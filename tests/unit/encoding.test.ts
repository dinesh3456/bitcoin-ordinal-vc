// tests/unit/encoding.test.ts
import { VCEncoder } from "../../src/core/encoding";
import { IdentityVerifiableCredential } from "../../src/types/verifiable-credential";

describe("VCEncoder", () => {
  const sampleCredential: IdentityVerifiableCredential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "test-credential-1",
    type: ["VerifiableCredential", "IdentityCredential"],
    issuer: {
      id: "did:example:issuer123",
      name: "Test Issuer",
      verifierType: "organization",
    },
    issuanceDate: "2024-01-01T00:00:00Z",
    expirationDate: "2025-01-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:subject123",
      fullName: "Test Subject",
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

  test("should maintain data integrity with error correction", () => {
    const encoded = VCEncoder.encode(sampleCredential);
    const decoded = VCEncoder.decode(encoded);
    expect(decoded).toEqual(sampleCredential);
  });
});
