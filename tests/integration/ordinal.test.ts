import { OrdinalService } from "../../src/services/ordinal";
import { BitcoinService } from "../../src/services/bitcoin";
import { KeyManager } from "../../src/utils/key-manager";
import { ConfigManager } from "../../src/config/config-manager";
import { IdentityVerifiableCredential } from "../../src/types/verifiable-credential";
import { VCEncoder } from "../../src/core/encoding";
import {
  mockBitcoinService,
  storeInscriptionData,
} from "../mocks/bitcoin-service.mock";

jest.mock("../../src/services/bitcoin");

describe("OrdinalService Integration", () => {
  let ordinalService: OrdinalService;
  let bitcoinService: BitcoinService;
  let keyManager: KeyManager;

  beforeEach(() => {
    const config = ConfigManager.getInstance().getConfig();
    keyManager = new KeyManager(config.bitcoin.network);
    bitcoinService = new BitcoinService(keyManager);
    Object.assign(bitcoinService, mockBitcoinService);
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

  it("should successfully inscribe and verify credential", async () => {
    // Store the encoded credential data before inscription
    const encodedData = VCEncoder.encode(sampleCredential);
    storeInscriptionData(encodedData);

    const inscriptionId = await ordinalService.createInscription(
      sampleCredential
    );
    expect(inscriptionId).toBe("txid123");

    const verifiedCredential = await ordinalService.verifyInscription(
      inscriptionId
    );
    expect(verifiedCredential).toMatchObject(sampleCredential);
  });

  it("should handle inscription errors gracefully", async () => {
    const mockError = new Error("Network error");
    jest
      .spyOn(bitcoinService, "broadcastTransaction")
      .mockRejectedValueOnce(mockError);

    await expect(
      ordinalService.createInscription(sampleCredential)
    ).rejects.toThrow("Network error");
  });
});
