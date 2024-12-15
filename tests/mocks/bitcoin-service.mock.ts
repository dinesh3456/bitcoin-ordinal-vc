import { BitcoinService } from "../../src/services/bitcoin";
import { networks, payments, Psbt } from "bitcoinjs-lib";
import * as tinysecp from "tiny-secp256k1";
import * as ECPair from "ecpair";

jest.mock("../../src/services/bitcoin");

const ECPairFactory = ECPair.ECPairFactory(tinysecp);

class TestSigner {
  network: typeof networks.testnet | typeof networks.bitcoin;
  publicKey: Buffer;
  sign: (hash: Buffer) => Buffer;

  constructor() {
    const privKey = Buffer.from(
      "0000000000000000000000000000000000000000000000000000000000000001",
      "hex"
    );
    const keyPair = ECPairFactory.fromPrivateKey(privKey);
    this.network = networks.testnet;
    this.publicKey = Buffer.from(keyPair.publicKey);
    this.sign = (hash: Buffer) => Buffer.from(keyPair.sign(hash));
  }
}

const testSigner = new TestSigner();

// Store inscriptionData for verification
let storedInscriptionData: Buffer | null = null;

export const mockBitcoinService = {
  getBlockchainInfo: jest.fn().mockResolvedValue({
    chain: "test",
    blocks: 1000,
    headers: 1000,
    bestblockhash: "0".repeat(64),
    difficulty: 1,
    mediantime: Date.now(),
    verificationprogress: 1,
    chainwork: "0".repeat(64),
    size_on_disk: 1000000,
    pruned: false,
  }),

  getNetwork: jest.fn().mockReturnValue(networks.testnet),

  getNewAddress: jest.fn().mockReturnValue(
    payments.p2wpkh({
      pubkey: testSigner.publicKey,
      network: networks.testnet,
    }).address
  ),

  getChangeAddress: jest.fn().mockReturnValue(
    payments.p2wpkh({
      pubkey: testSigner.publicKey,
      network: networks.testnet,
    }).address
  ),

  getFeeEstimate: jest.fn().mockResolvedValue({
    feerate: 0.00001,
    blocks: 6,
  }),

  broadcastTransaction: jest.fn().mockImplementation((txHex: string) => {
    if (!txHex) throw new Error("Invalid transaction hex");
    return Promise.resolve("txid123");
  }),

  getTransaction: jest.fn().mockImplementation(() => {
    if (!storedInscriptionData) {
      throw new Error("No inscription data found");
    }

    return Promise.resolve({
      txid: "txid123",
      hash: "hash123",
      confirmations: 1,
      hex: "020000000001...",
      witness: ["witness_data", storedInscriptionData.toString("hex")],
    });
  }),

  verifyTransaction: jest.fn().mockResolvedValue(true),

  getSpendableUtxos: jest.fn().mockResolvedValue([
    {
      txid: "0".repeat(64),
      vout: 0,
      value: 100000,
      witnessUtxo: {
        script: payments.p2wpkh({
          pubkey: testSigner.publicKey,
          network: networks.testnet,
        }).output!,
        value: 100000,
      },
    },
  ]),

  signPsbt: jest
    .fn()
    .mockImplementation(async (psbt: Psbt, inputIndex: number) => {
      psbt.signInput(inputIndex, testSigner);
      return psbt;
    }),
};

// Mock store function to save inscription data
export const storeInscriptionData = (data: Buffer) => {
  storedInscriptionData = data;
};

// Clear stored data between tests
beforeEach(() => {
  jest.clearAllMocks();
  storedInscriptionData = null;
  Object.assign(BitcoinService.prototype, mockBitcoinService);
});
