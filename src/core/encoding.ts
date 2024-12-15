// src/core/encoding.ts
import { IdentityVerifiableCredential } from "../types/verifiable-credential";

export class VCEncoder {
  // Encode VC to binary format
  static encode(credential: IdentityVerifiableCredential): Buffer {
    try {
      this.validateCredential(credential);
      const jsonStr = JSON.stringify(credential);
      const buffer = Buffer.from(jsonStr, "utf8");
      const version = Buffer.from([0x01]);
      const length = Buffer.alloc(4);
      length.writeUInt32BE(buffer.length);

      const data = Buffer.concat([version, length, buffer]);
      return ErrorCorrection.addChecksum(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Encoding failed: ${error.message}`);
      } else {
        throw new Error("Encoding failed: unknown error");
      }
    }
  }

  // Decode binary format back to VC
  static decode(data: Buffer): IdentityVerifiableCredential {
    try {
      // Verify checksum
      if (!ErrorCorrection.verifyChecksum(data)) {
        throw new Error("Checksum verification failed");
      }

      // Remove checksum
      const encodedData = data.slice(0, -4);

      if (encodedData[0] !== 0x01) {
        throw new Error("Unsupported version");
      }

      const length = encodedData.readUInt32BE(1);
      const jsonBuffer = encodedData.slice(5, 5 + length);
      const jsonStr = jsonBuffer.toString("utf8");
      const credential = JSON.parse(jsonStr);

      // Validate decoded credential
      this.validateCredential(credential);
      return credential;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Decoding failed: ${error.message}`);
      } else {
        throw new Error("Decoding failed: unknown error");
      }
    }
  }

  // Validate credential structure
  private static validateCredential(credential: any): void {
    const requiredFields = [
      "@context",
      "type",
      "issuer",
      "issuanceDate",
      "expirationDate",
      "credentialSubject",
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!credential[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate credential subject
    const subject = credential.credentialSubject;
    const requiredSubjectFields = [
      "id",
      "fullName",
      "dateOfBirth",
      "nationality",
      "documentType",
      "documentNumber",
      "verificationLevel",
      "verificationDate",
      "expirationDate",
    ];

    for (const field of requiredSubjectFields) {
      if (!subject[field]) {
        throw new Error(
          `Missing required field in credentialSubject: ${field}`
        );
      }
    }

    // Validate document type
    const validDocTypes = ["passport", "nationalId", "driverLicense"];
    if (!validDocTypes.includes(subject.documentType)) {
      throw new Error(`Invalid documentType: ${subject.documentType}`);
    }

    // Validate verification level
    const validVerificationLevels = ["basic", "advanced", "expert"];
    if (!validVerificationLevels.includes(subject.verificationLevel)) {
      throw new Error(
        `Invalid verificationLevel: ${subject.verificationLevel}`
      );
    }
  }
}

export class ErrorCorrection {
  // Add CRC32 checksum
  static addChecksum(data: Buffer): Buffer {
    const crc32 = this.calculateCRC32(data);
    const checksumBuffer = Buffer.alloc(4);
    checksumBuffer.writeUInt32BE(crc32);
    return Buffer.concat([data, checksumBuffer]);
  }

  // Verify CRC32 checksum
  static verifyChecksum(data: Buffer): boolean {
    if (data.length < 4) return false;

    const content = data.slice(0, -4);
    const storedChecksum = data.readUInt32BE(data.length - 4);
    const calculatedChecksum = this.calculateCRC32(content);
    return storedChecksum === calculatedChecksum;
  }

  // CRC32 implementation
  private static calculateCRC32(data: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return ~crc >>> 0;
  }
}
