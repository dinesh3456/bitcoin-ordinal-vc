import { BitcoinService } from "../../src/services/bitcoin";
import { KeyManager } from "../../src/utils/key-manager";

jest.mock("../../src/services/bitcoin");

export const mockBitcoinService = {
  getNewAddress: jest.fn().mockResolvedValue("tb1qtest"),
  getFeeEstimate: jest.fn().mockResolvedValue({ feerate: 0.00001, blocks: 6 }),
  broadcastTransaction: jest.fn().mockResolvedValue("txid123"),
  getTransaction: jest.fn().mockResolvedValue({
    confirmations: 1,
    txid: "txid123",
    hash: "hash123",
  }),
  verifyTransaction: jest.fn().mockResolvedValue(true),
  getSpendableUtxos: jest.fn().mockResolvedValue([
    {
      txid: "utxo123",
      vout: 0,
      value: 100000,
      witnessUtxo: {
        script: Buffer.from("test"),
        value: 100000,
      },
    },
  ]),
};

// Update test setup to use mocks
beforeEach(() => {
  jest.clearAllMocks();
  BitcoinService.prototype.getNewAddress = mockBitcoinService.getNewAddress;
  BitcoinService.prototype.getFeeEstimate = mockBitcoinService.getFeeEstimate;
  BitcoinService.prototype.broadcastTransaction =
    mockBitcoinService.broadcastTransaction;
  BitcoinService.prototype.getTransaction = mockBitcoinService.getTransaction;
  BitcoinService.prototype.verifyTransaction =
    mockBitcoinService.verifyTransaction;
  BitcoinService.prototype.getSpendableUtxos =
    mockBitcoinService.getSpendableUtxos;
});
