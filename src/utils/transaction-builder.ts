import * as bitcoin from "bitcoinjs-lib";
import { BitcoinService } from "../services/bitcoin";
import { Logger } from "./logger";
import { ECPairFactory } from "ecpair";
import * as tinysecp from "tiny-secp256k1";

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
    const { data, feeRate, witness } = options;

    try {
      const inscriptionScript = this.createInscriptionScript(data);
      const estimatedSize = this.estimateTransactionSize(
        inscriptionScript.length,
        witness
      );
      const fee = Math.ceil(estimatedSize * feeRate);

      const utxos = await this.bitcoinService.getSpendableUtxos(fee);
      if (!utxos.length) {
        throw new Error("Insufficient funds for inscription");
      }

      const psbt = new bitcoin.Psbt({
        network: this.bitcoinService.getNetwork(),
      });

      // Add inputs with proper derivation paths
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
        value: witness ? 546 : 1000,
      });

      // Calculate and add change output if needed
      const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      const change = totalInput - fee - (witness ? 546 : 1000);

      if (change > 546) {
        const changeAddress = await this.bitcoinService.getChangeAddress();
        psbt.addOutput({
          address: changeAddress,
          value: change,
        });
      }

      // Sign all inputs
      for (let i = 0; i < utxos.length; i++) {
        await this.bitcoinService.signPsbt(psbt, i);
      }

      try {
        psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) => {
          return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
        });
      } catch (error) {
        this.logger.error("Failed to validate signatures", error as Error);
        throw new Error("Failed to validate transaction signatures");
      }

      const tx = psbt.finalizeAllInputs().extractTransaction();
      return tx.toHex();
    } catch (error) {
      this.logger.error(
        "Failed to create inscription transaction",
        error as Error
      );
      throw new Error(
        `Transaction creation failed: ${(error as Error).message}`
      );
    }
  }

  private createInscriptionScript(data: Buffer): Buffer {
    return bitcoin.script.compile([
      bitcoin.opcodes.OP_FALSE,
      bitcoin.opcodes.OP_IF,
      Buffer.from("ord"),
      Buffer.from([1]),
      Buffer.from("text/plain"),
      bitcoin.opcodes.OP_0,
      data,
      bitcoin.opcodes.OP_ENDIF,
    ]);
  }

  private estimateTransactionSize(
    scriptSize: number,
    witness: boolean
  ): number {
    const baseSize = 10;
    const inputSize = witness ? 68 : 148;
    const outputSize = 34;
    const witnessSize = witness ? scriptSize + 106 : 0;
    return baseSize + inputSize + outputSize + witnessSize;
  }
}
