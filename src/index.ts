// src/index.ts
import { ServiceManager } from "./services/service-manager";
import { IdentityVerifiableCredential } from "./types/verifiable-credential";
import { Logger } from "./utils/logger";

export class OrdinalInscriptionSystem {
  private serviceManager: ServiceManager;
  private logger: Logger;

  constructor() {
    this.serviceManager = ServiceManager.getInstance();
    this.logger = new Logger("OrdinalInscriptionSystem");
  }

  async inscribeCredential(
    credential: IdentityVerifiableCredential
  ): Promise<string> {
    this.logger.info("Starting credential inscription process");

    try {
      const ordinalService = this.serviceManager.getOrdinalService();
      const inscriptionId = await ordinalService.createInscription(credential);

      this.logger.info(
        `Credential successfully inscribed with ID: ${inscriptionId}`
      );
      return inscriptionId;
    } catch (error) {
      this.logger.error("Failed to inscribe credential", error as Error);
      throw new Error(`Inscription failed: ${(error as Error).message}`);
    }
  }

  async verifyCredential(
    inscriptionId: string
  ): Promise<IdentityVerifiableCredential> {
    this.logger.info(
      `Starting credential verification for inscription: ${inscriptionId}`
    );

    try {
      const ordinalService = this.serviceManager.getOrdinalService();
      const credential = await ordinalService.verifyInscription(inscriptionId);

      this.logger.info("Credential verification successful");
      return credential;
    } catch (error) {
      this.logger.error("Credential verification failed", error as Error);
      throw new Error(`Verification failed: ${(error as Error).message}`);
    }
  }

  async getBlockchainStatus(): Promise<any> {
    try {
      const bitcoinService = this.serviceManager.getBitcoinService();
      return await bitcoinService.getBlockchainInfo();
    } catch (error) {
      this.logger.error("Failed to get blockchain status", error as Error);
      throw error;
    }
  }
}

export default OrdinalInscriptionSystem;
