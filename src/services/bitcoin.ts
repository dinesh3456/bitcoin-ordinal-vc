// src/services/bitcoin.ts
import { networks, payments } from "bitcoinjs-lib";
import { config } from "../config";

export class BitcoinService {
  private network: typeof networks.bitcoin | typeof networks.testnet;

  constructor() {
    this.network =
      config.bitcoin.network === "testnet"
        ? networks.testnet
        : networks.bitcoin;
  }

  async generateInscriptionAddress(publicKey: Buffer): Promise<string> {
    const payment = payments.p2tr({
      pubkey: publicKey,
      network: this.network,
    });

    return payment.address!;
  }

  async verifyTransaction(txId: string): Promise<boolean> {
    // Implementation for transaction verification
    // Will be expanded in next phase
    return true;
  }
}
