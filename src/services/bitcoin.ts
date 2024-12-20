import BitcoinCore from "bitcoin-core";
import * as bitcoin from "bitcoinjs-lib";
import { ConfigManager } from "../config/config-manager";
import { KeyManager } from "../utils/key-manager";
import { Logger } from "../utils/logger";
import { networks, payments, Psbt as _Psbt } from "bitcoinjs-lib"; // Prefix with underscore
interface UTXO {
  txid: string;
  vout: number;
  value: number;
  witnessUtxo: {
    script: Buffer;
    value: number;
  };
}

interface BitcoinCoreConfig {
  network: string;
  username: string;
  password: string;
  port: number;
  host: string;
  version: string;
  wallet: string;
  agentOptions: {
    rejectUnauthorized: boolean;
  };
}

export class BitcoinService {
  private keyManager: KeyManager;
  private logger: Logger;
  private client: BitcoinCore;
  private network: typeof networks.bitcoin | typeof networks.testnet;

  constructor(keyManager: KeyManager) {
    const config = ConfigManager.getInstance().getConfig();

    const bitcoinCoreConfig: BitcoinCoreConfig = {
      network:
        config.bitcoin.network === bitcoin.networks.testnet
          ? "testnet"
          : "mainnet",
      username: config.bitcoin.rpcUser,
      password: config.bitcoin.rpcPassword,
      port: config.bitcoin.network === bitcoin.networks.testnet ? 18332 : 8332,
      host: "127.0.0.1",
      version: "0.21.0", // Specify Bitcoin Core version
      wallet: "", // Default wallet
      agentOptions: {
        // Required agent options
        rejectUnauthorized: false,
      },
    };

    this.client = new BitcoinCore(bitcoinCoreConfig);
    this.network = config.bitcoin.network;
    this.keyManager = keyManager;
    this.logger = new Logger("BitcoinService");
  }

  // RPC methods
  async getBlockchainInfo() {
    return await this.client.getBlockchainInfo();
  }

  async getNewAddress() {
    const publicKey = this.keyManager.getPublicKey();
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: publicKey,
      network: this.network,
    });
    return address!;
  }

  async getFeeEstimate() {
    return await this.client.estimateSmartFee(6);
  }

  async broadcastTransaction(txHex: string): Promise<string> {
    try {
      const txId = await this.client.sendRawTransaction(txHex);
      this.logger.info(`Transaction broadcast successful: ${txId}`);
      return txId;
    } catch (error) {
      this.logger.error("Failed to broadcast transaction", error as Error);
      throw error;
    }
  }

  async getTransaction(txId: string) {
    return await this.client.getRawTransaction(txId, true);
  }
  async getChangeAddress() {
    return this.getNewAddress();
  }

  async getSpendableUtxos(requiredAmount: number): Promise<UTXO[]> {
    try {
      const unspent = await this.client.listUnspent(1);
      const spendableUtxos: UTXO[] = [];
      let totalAmount = 0;

      for (const utxo of unspent) {
        if (totalAmount >= requiredAmount) break;

        totalAmount += Math.floor(utxo.amount * 100000000);
      }

      if (totalAmount < requiredAmount) {
        throw new Error("Insufficient funds");
      }

      return spendableUtxos;
    } catch (error) {
      this.logger.error("Failed to get spendable UTXOs", error as Error);
      throw error;
    }
  }
  getNetwork() {
    return this.network;
  }

  async signPsbt(psbt: bitcoin.Psbt, inputIndex: number = 0): Promise<void> {
    await this.keyManager.signPsbt(psbt, inputIndex);
  }
  // Inscription-specific methods
  async generateInscriptionAddress(publicKey: Buffer): Promise<string> {
    const payment = payments.p2tr({
      pubkey: publicKey,
      network: this.network,
    });

    return payment.address!;
  }

  async verifyTransaction(txId: string): Promise<boolean> {
    try {
      const tx = await this.client.getTransaction(txId);
      return tx.confirmations > 0;
    } catch (error) {
      console.error("Transaction verification failed:", error);
      return false;
    }
  }
}
