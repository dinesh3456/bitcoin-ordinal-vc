import { BitcoinService } from "../src/services/bitcoin";
import { KeyManager } from "../src/utils/key-manager";
import { networks } from "bitcoinjs-lib";

export const testConfig = {
  bitcoin: {
    network: networks.testnet,
    nodeUrl: "http://localhost:18332",
    rpcUser: "test_user",
    rpcPassword: "test_password",
  },
  ordinal: {
    inscriptionSize: 1000,
    minSats: 1000,
  },
};

export const mockKeyManager = new KeyManager(testConfig.bitcoin.network);

export const mockBitcoinService = new BitcoinService(mockKeyManager);
