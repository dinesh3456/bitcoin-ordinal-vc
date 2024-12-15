import { VCEncoder } from "../../src/core/encoding";
import { IdentityVerifiableCredential } from "../../src/types/verifiable-credential";

describe("VCEncoder", () => {
  const sampleCredential: IdentityVerifiableCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/identity/v1",
    ],
    id: "urn:uuid:test123",
    type: ["VerifiableCredential", "IdentityCredential"],
    issuer: {
      id: "did:example:issuer123",
      name: "Test Authority",
      verifierType: "organization",
    },
    issuanceDate: "2024-01-01T00:00:00Z",
    expirationDate: "2025-01-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:holder123",
      fullName: "Test User",
      dateOfBirth: "1990-01-01",
      nationality: "US",
      documentType: "passport",
      documentNumber: "TEST123",
      verificationLevel: "basic",
      verificationDate: "2024-01-01T00:00:00Z",
      expirationDate: "2025-01-01T00:00:00Z",
    },
  };

  test("should encode and decode credential correctly", () => {
    const encoded = VCEncoder.encode(sampleCredential);
    const decoded = VCEncoder.decode(encoded);

    expect(decoded).toEqual(sampleCredential);
  });

  test("should handle large credentials", () => {
    const largeCredential = {
      ...sampleCredential,
      additionalData: "x".repeat(1000),
    };

    const encoded = VCEncoder.encode(largeCredential);
    const decoded = VCEncoder.decode(encoded);

    expect(decoded).toEqual(largeCredential);
  });

  test("should throw error for invalid data", () => {
    const invalidBuffer = Buffer.from("invalid data");
    expect(() => VCEncoder.decode(invalidBuffer)).toThrow();
  });

  test("should maintain data integrity with error correction", () => {
    const encoded = VCEncoder.encode(sampleCredential);
    // Simulate minor data corruption
    encoded[encoded.length - 5] = 0;

    const decoded = VCEncoder.decode(encoded);
    expect(decoded).toEqual(sampleCredential);
  });
});
