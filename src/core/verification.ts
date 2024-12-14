// src/core/verification.ts
import { IdentityVerifiableCredential } from "../types/verifiable-credential";
import { Logger } from "../utils/logger";

export class CredentialVerifier {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("CredentialVerifier");
  }

  async verifyCredential(
    credential: IdentityVerifiableCredential
  ): Promise<boolean> {
    try {
      // Verify structural integrity
      if (!this.verifyStructure(credential)) {
        return false;
      }

      // Verify dates
      if (!this.verifyDates(credential)) {
        return false;
      }

      // Verify credential subject
      if (!this.verifyCredentialSubject(credential)) {
        return false;
      }

      // Verify proof if exists
      if (credential.proof && !(await this.verifyProof(credential))) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error("Credential verification failed", error as Error);
      return false;
    }
  }

  private verifyStructure(credential: IdentityVerifiableCredential): boolean {
    // Verify required fields
    const requiredFields = [
      "@context",
      "type",
      "issuer",
      "issuanceDate",
      "credentialSubject",
    ];
    for (const field of requiredFields) {
      if (!credential[field as keyof IdentityVerifiableCredential]) {
        this.logger.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Verify context includes required values
    if (
      !credential["@context"].includes("https://www.w3.org/2018/credentials/v1")
    ) {
      this.logger.error("Missing required context");
      return false;
    }

    return true;
  }

  private verifyDates(credential: IdentityVerifiableCredential): boolean {
    const now = new Date();
    const issuanceDate = new Date(credential.issuanceDate);
    const expirationDate = new Date(credential.expirationDate);

    // Check if dates are valid
    if (isNaN(issuanceDate.getTime()) || isNaN(expirationDate.getTime())) {
      this.logger.error("Invalid date format");
      return false;
    }

    // Verify issuance date is in the past
    if (issuanceDate > now) {
      this.logger.error("Issuance date is in the future");
      return false;
    }

    // Verify expiration date
    if (expirationDate < now) {
      this.logger.error("Credential has expired");
      return false;
    }

    return true;
  }

  private verifyCredentialSubject(
    credential: IdentityVerifiableCredential
  ): boolean {
    const subject = credential.credentialSubject;
    const requiredFields = [
      "id",
      "fullName",
      "dateOfBirth",
      "nationality",
      "documentType",
      "documentNumber",
      "verificationLevel",
    ];

    for (const field of requiredFields) {
      if (!subject[field as keyof typeof subject]) {
        this.logger.error(
          `Missing required field in credentialSubject: ${field}`
        );
        return false;
      }
    }

    // Verify document type
    const validDocTypes = ["passport", "nationalId", "driverLicense"];
    if (!validDocTypes.includes(subject.documentType)) {
      this.logger.error(`Invalid document type: ${subject.documentType}`);
      return false;
    }

    // Verify verification level
    const validLevels = ["basic", "advanced", "expert"];
    if (!validLevels.includes(subject.verificationLevel)) {
      this.logger.error(
        `Invalid verification level: ${subject.verificationLevel}`
      );
      return false;
    }

    return true;
  }

  private async verifyProof(
    credential: IdentityVerifiableCredential
  ): Promise<boolean> {
    if (!credential.proof) {
      return true; // No proof to verify
    }

    try {
      // For now, we'll just verify the proof structure
      const requiredProofFields = [
        "type",
        "created",
        "verificationMethod",
        "proofPurpose",
      ];
      for (const field of requiredProofFields) {
        if (!credential.proof[field as keyof typeof credential.proof]) {
          this.logger.error(`Missing required field in proof: ${field}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error("Proof verification failed", error as Error);
      return false;
    }
  }
}
