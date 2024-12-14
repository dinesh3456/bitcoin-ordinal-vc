import { IdentityVerifiableCredential } from "../types/verifiable-credential";
import { OrdinalService } from "../services/ordinal";
import { BitcoinService } from "../services/bitcoin"; // Ensure you import BitcoinService

export class InscriptionHandler {
  private ordinalService: OrdinalService;

  constructor(bitcoinService: BitcoinService) {
    // Add parameter here
    this.ordinalService = new OrdinalService(bitcoinService); // Pass it to the OrdinalService constructor
  }

  async inscribeCredential(
    credential: IdentityVerifiableCredential
  ): Promise<string> {
    try {
      // Create inscription
      const inscriptionId = await this.ordinalService.createInscription(
        credential
      );

      // Verify inscription was successful
      await this.ordinalService.verifyInscription(inscriptionId);

      return inscriptionId;
    } catch (error) {
      throw new Error(`Credential inscription failed: ${error.message}`);
    }
  }

  async retrieveCredential(
    inscriptionId: string
  ): Promise<IdentityVerifiableCredential> {
    try {
      return await this.ordinalService.verifyInscription(inscriptionId);
    } catch (error) {
      throw new Error(`Credential retrieval failed: ${error.message}`);
    }
  }
}
