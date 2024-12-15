import { OrdinalInscriptionSystem } from "../../src";
import { IdentityVerifiableCredential } from "../../src/types/verifiable-credential";
import { VCEncoder } from "../../src/core/encoding";
import {
  mockBitcoinService,
  storeInscriptionData,
} from "../mocks/bitcoin-service.mock";

describe("OrdinalInscriptionSystem E2E", () => {
  let system: OrdinalInscriptionSystem;

  beforeAll(async () => {
    process.env.BITCOIN_NETWORK = "testnet";
    process.env.BITCOIN_RPC_USER = "test_user";
    process.env.BITCOIN_RPC_PASSWORD = "test_password";
    system = new OrdinalInscriptionSystem();

    // Ensure BitcoinService is properly mocked
    const bitcoinService = system["serviceManager"].getBitcoinService();
    Object.assign(bitcoinService, mockBitcoinService);
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

  it("should complete inscription and verification workflow", async () => {
    const encodedData = VCEncoder.encode(testCredential);
    storeInscriptionData(encodedData);

    const status = await system.getBlockchainStatus();
    expect(status.chain).toBe("test");

    const inscriptionId = await system.inscribeCredential(testCredential);
    expect(inscriptionId).toBe("txid123");

    const verifiedCredential = await system.verifyCredential(inscriptionId);
    expect(verifiedCredential).toMatchObject(testCredential);
  });

  it("should handle network issues gracefully", async () => {
    const bitcoinService = system["serviceManager"].getBitcoinService();
    const mockError = new Error("Network connection failed");
    jest
      .spyOn(bitcoinService, "broadcastTransaction")
      .mockRejectedValueOnce(mockError);

    await expect(system.inscribeCredential(testCredential)).rejects.toThrow(
      /Network connection failed/
    );
  });

  it("should handle invalid credentials", async () => {
    const invalidCredential = { ...testCredential };
    delete invalidCredential.credentialSubject;

    await expect(
      system.inscribeCredential(
        invalidCredential as IdentityVerifiableCredential
      )
    ).rejects.toThrow(/Missing required field: credentialSubject/);
  });
});
