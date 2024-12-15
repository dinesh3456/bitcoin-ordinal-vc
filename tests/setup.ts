// tests/setup.ts
import { BitcoinService } from "../src/services/bitcoin";
import { KeyManager } from "../src/utils/key-manager";
import { networks } from "bitcoinjs-lib";
import { ConfigManager } from "../src/config/config-manager";

// Mock environment variables
process.env.BITCOIN_NETWORK = "testnet";
process.env.BITCOIN_NODE_URL = "http://localhost:18332";
process.env.BITCOIN_RPC_USER = "test_user";
process.env.BITCOIN_RPC_PASSWORD = "test_password";

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
  keyManagement: {
    derivationPath: "m/84'/1'/0'/0",
    seedPath: undefined,
  },
};

// Initialize config before tests
jest.mock("../src/config/config-manager");
(ConfigManager.getInstance as jest.Mock).mockReturnValue({
  getConfig: () => testConfig,
  getBitcoinNetwork: () => networks.testnet,
  getKeyManagementConfig: () => testConfig.keyManagement,
});

export const mockKeyManager = new KeyManager(testConfig.bitcoin.network);
export const mockBitcoinService = new BitcoinService(mockKeyManager);
