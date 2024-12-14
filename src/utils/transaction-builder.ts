import * as bitcoin from "bitcoinjs-lib";
import { BitcoinService } from "../services/bitcoin";
import { Logger } from "./logger";
import { ECPairFactory } from "ecpair"; // Add this import
import * as tinysecp from "tiny-secp256k1"; // Add this import
const ECPair = ECPairFactory(tinysecp);

interface InscriptionOptions {
  data: Buffer;
  address: string;
  feeRate: number;
  witness: boolean;
}

export class TransactionBuilder {
  private bitcoinService: BitcoinService;
  private logger: Logger;

  constructor(bitcoinService: BitcoinService) {
    this.bitcoinService = bitcoinService;
    this.logger = new Logger("TransactionBuilder");
  }

  async createInscriptionTransaction(
    options: InscriptionOptions
  ): Promise<string> {
    const { data, address, feeRate, witness } = options;

    try {
      // Create inscription script
      const inscriptionScript = this.createInscriptionScript(data);

      // Calculate required fees
      const estimatedSize = this.estimateTransactionSize(
        inscriptionScript.length,
        witness
      );
      const fee = Math.ceil(estimatedSize * feeRate);

      // Get UTXOs for funding
      const utxos = await this.bitcoinService.getSpendableUtxos(fee);
      if (!utxos.length) {
        throw new Error("Insufficient funds for inscription");
      }

      // Create and sign transaction
      const psbt = new bitcoin.Psbt({
        network: this.bitcoinService.getNetwork(),
      });

      // Add inputs
      utxos.forEach((utxo) => {
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: utxo.witnessUtxo,
        });
      });

      // Add inscription output
      psbt.addOutput({
        script: inscriptionScript,
        value: witness ? 546 : 1000, // Minimum dust value
      });

      // Add change output if needed
      const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      const change = totalInput - fee - (witness ? 546 : 1000);

      if (change > 546) {
        psbt.addOutput({
          address: await this.bitcoinService.getChangeAddress(),
          value: change,
        });
      }

      // Sign transaction
      await this.signTransaction(psbt);

      const tx = psbt.finalizeAllInputs().extractTransaction();

      return tx.toHex();
    } catch (error) {
      this.logger.error("Failed to create inscription transaction", error);
      throw new Error(`Transaction creation failed: ${error.message}`);
    }
  }

  private createInscriptionScript(data: Buffer): Buffer {
    return bitcoin.script.compile([
      bitcoin.opcodes.OP_FALSE,
      bitcoin.opcodes.OP_IF,
      Buffer.from("ord"),
      Buffer.from([1]), // protocol version
      Buffer.from("text/plain"), // content type
      bitcoin.opcodes.OP_0,
      data,
      bitcoin.opcodes.OP_ENDIF,
    ]);
  }

  private estimateTransactionSize(
    scriptSize: number,
    witness: boolean
  ): number {
    const baseSize = 10; // Version + locktime
    const inputSize = witness ? 68 : 148;
    const outputSize = 34;
    const witnessSize = witness ? scriptSize + 106 : 0;

    return baseSize + inputSize + outputSize + witnessSize;
  }

  private async signTransaction(psbt: bitcoin.Psbt): Promise<void> {
    try {
      // Sign all inputs using BitcoinService
      await this.bitcoinService.signPsbt(psbt);

      // Validate all inputs are signed
      const isComplete = psbt.validateSignaturesOfAllInputs(
        (pubkey, msghash, signature) => {
          return ECPair.fromPublicKey(pubkey).verify(msghash, signature); // Update this line
        }
      );
      if (!isComplete) {
        throw new Error("Transaction signing validation failed");
      }

      this.logger.info("Transaction successfully signed");
    } catch (error) {
      this.logger.error("Failed to sign transaction", error);
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
  }
}
