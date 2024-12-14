import { BitcoinService } from "./bitcoin";
import { VCEncoder } from "../core/encoding";
import { IdentityVerifiableCredential } from "../types/verifiable-credential";
import { TransactionBuilder } from "../utils/transaction-builder";
import { Logger } from "../utils/logger";

export class OrdinalService {
  private bitcoinService: BitcoinService;
  private logger: Logger;

  constructor(bitcoinService: BitcoinService) {
    this.bitcoinService = bitcoinService;
    this.logger = new Logger("OrdinalService");
  }

  async createInscription(
    credential: IdentityVerifiableCredential
  ): Promise<string> {
    this.logger.info("Starting credential inscription process");

    try {
      const encodedData = VCEncoder.encode(credential);
      const inscriptionAddress = await this.bitcoinService.getNewAddress();
      const feeRate = await this.bitcoinService.getFeeEstimate();

      const txBuilder = new TransactionBuilder(this.bitcoinService);

      // Prepare inscription transaction
      const inscriptionTx = await txBuilder.createInscriptionTransaction({
        data: encodedData,
        address: inscriptionAddress,
        feeRate: feeRate.feerate,
        witness: true, // Use segwit for better efficiency
      });

      // Broadcast transaction
      const txId = await this.bitcoinService.broadcastTransaction(
        inscriptionTx
      );

      this.logger.info(`Inscription transaction broadcast successful: ${txId}`);

      // Wait for confirmation
      await this.waitForConfirmation(txId);

      return txId;
    } catch (error) {
      this.logger.error("Inscription creation failed", error);
      throw new Error(`Inscription creation failed: ${error.message}`);
    }
  }

  async verifyInscription(
    inscriptionId: string
  ): Promise<IdentityVerifiableCredential> {
    this.logger.info(`Verifying inscription: ${inscriptionId}`);

    try {
      const isValid = await this.bitcoinService.verifyTransaction(
        inscriptionId
      );
      if (!isValid) {
        throw new Error("Invalid or unconfirmed inscription");
      }

      const inscriptionData = await this.getInscriptionData(inscriptionId);
      const credential = VCEncoder.decode(inscriptionData);

      this.logger.info("Inscription verification successful");
      return credential;
    } catch (error) {
      this.logger.error("Inscription verification failed", error);
      throw new Error(`Inscription verification failed: ${error.message}`);
    }
  }

  private async waitForConfirmation(
    txId: string,
    confirmations: number = 1
  ): Promise<void> {
    this.logger.info(`Waiting for ${confirmations} confirmation(s)`);

    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const tx = await this.bitcoinService.getTransaction(txId);
      if (tx.confirmations >= confirmations) {
        this.logger.info("Transaction confirmed");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
      attempts++;
    }

    throw new Error("Transaction confirmation timeout");
  }

  private async getInscriptionData(inscriptionId: string): Promise<Buffer> {
    const tx = await this.bitcoinService.getTransaction(inscriptionId);
    if (!tx) {
      throw new Error("Transaction not found");
    }

    // Extract inscription data from transaction witness
    const witness = tx.witness?.[1];
    if (!witness) {
      throw new Error("No inscription data found in transaction");
    }

    return Buffer.from(witness, "hex");
  }
}
