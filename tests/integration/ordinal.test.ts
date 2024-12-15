import { OrdinalService } from "../../src/services/ordinal";
import { mockBitcoinService } from "../setup";
import { IdentityVerifiableCredential } from "../../src/types/verifiable-credential";
import { KeyManager } from "../../src/utils/key-manager";
import { ConfigManager } from "../../src/config/config-manager";
import { BitcoinService } from "../../src/services/bitcoin";
import "../mocks/bitcoin-service.mock";

jest.mock("../../src/services/bitcoin");

describe("OrdinalService Integration", () => {
  let ordinalService: OrdinalService;
  let bitcoinService: BitcoinService;
  let keyManager: KeyManager;

  beforeEach(() => {
    const config = ConfigManager.getInstance().getConfig();
    keyManager = new KeyManager(config.bitcoin.network);
    bitcoinService = new BitcoinService(keyManager);
    ordinalService = new OrdinalService(bitcoinService);
  });

  const sampleCredential: IdentityVerifiableCredential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "test-credential-1",
    type: ["VerifiableCredential", "IdentityCredential"],
    issuer: {
      id: "did:example:issuer123",
      name: "Test Issuer",
      verifierType: "organization",
    },
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 86400000).toISOString(),
    credentialSubject: {
      id: "did:example:subject123",
      fullName: "Test Subject",
      dateOfBirth: "1990-01-01",
      nationality: "US",
      documentType: "passport",
      documentNumber: "TEST123",
      verificationLevel: "basic",
      verificationDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
    },
  };

  test("should successfully inscribe and verify credential", async () => {
    const inscriptionId = await ordinalService.createInscription(
      sampleCredential
    );
    expect(inscriptionId).toBeTruthy();

    const verifiedCredential = await ordinalService.verifyInscription(
      inscriptionId
    );
    expect(verifiedCredential).toEqual(sampleCredential);
  });

  test("should handle inscription errors gracefully", async () => {
    // Mock a failure scenario
    mockBitcoinService.broadcastTransaction = jest
      .fn()
      .mockRejectedValue(new Error("Insufficient funds"));

    await expect(
      ordinalService.createInscription(sampleCredential)
    ).rejects.toThrow("Inscription creation failed");
  });

  test("should verify inscription status correctly", async () => {
    const inscriptionId = await ordinalService.createInscription(
      sampleCredential
    );

    // Mock confirmation status
    mockBitcoinService.verifyTransaction = jest.fn().mockResolvedValue(true);

    const isValid = await ordinalService.verifyInscription(inscriptionId);
    expect(isValid).toBeTruthy();
  });
});
