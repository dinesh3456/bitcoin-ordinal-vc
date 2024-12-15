import { OrdinalInscriptionSystem } from "../../src";
import { IdentityVerifiableCredential } from "../../src/types/verifiable-credential";

describe("OrdinalInscriptionSystem E2E", () => {
  let system: OrdinalInscriptionSystem;

  beforeAll(async () => {
    // Ensure we're using testnet
    process.env.BITCOIN_NETWORK = "testnet";
    system = new OrdinalInscriptionSystem();
  });

  const testCredential: IdentityVerifiableCredential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "test-e2e-credential",
    type: ["VerifiableCredential", "IdentityCredential"],
    issuer: {
      id: "did:example:issuer123",
      name: "E2E Test Issuer",
      verifierType: "organization",
    },
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 86400000).toISOString(),
    credentialSubject: {
      id: "did:example:subject123",
      fullName: "E2E Test Subject",
      dateOfBirth: "1990-01-01",
      nationality: "US",
      documentType: "passport",
      documentNumber: "E2E123",
      verificationLevel: "basic",
      verificationDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
    },
  };

  test("complete inscription and verification workflow", async () => {
    // Check blockchain connection
    const status = await system.getBlockchainStatus();
    expect(status.chain).toBe("test");

    // Inscribe credential
    const inscriptionId = await system.inscribeCredential(testCredential);
    expect(inscriptionId).toBeTruthy();

    // Wait for at least one confirmation
    await new Promise((resolve) => setTimeout(resolve, 60000));

    // Verify the inscribed credential
    const verifiedCredential = await system.verifyCredential(inscriptionId);
    expect(verifiedCredential).toMatchObject(testCredential);

    // Verify specific fields
    expect(verifiedCredential.credentialSubject).toBeDefined(); // Check if defined
    expect(verifiedCredential.credentialSubject!.fullName).toBe(
      // Use non-null assertion
      testCredential.credentialSubject?.fullName
    );
    expect(verifiedCredential.issuer.name).toBe(testCredential.issuer.name);
  }, 120000); // Increase timeout for blockchain operations

  test("should handle network issues gracefully", async () => {
    // Simulate network disconnection
    jest
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(new Error("Network error"));

    await expect(system.inscribeCredential(testCredential)).rejects.toThrow(
      "Network error"
    );
  });

  test("should handle invalid credentials", async () => {
    const invalidCredential = { ...testCredential };
    delete invalidCredential.credentialSubject;

    await expect(
      system.inscribeCredential(invalidCredential as any)
    ).rejects.toThrow();
  });
});
