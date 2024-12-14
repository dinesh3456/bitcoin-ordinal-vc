import * as bitcoin from "bitcoinjs-lib";
import { config } from "./index";

export interface SystemConfig {
  bitcoin: {
    network: bitcoin.Network;
    nodeUrl: string;
    rpcUser: string;
    rpcPassword: string;
  };
  ordinal: {
    inscriptionSize: number;
    minSats: number;
  };
  keyManagement: {
    seedPath?: string;
    derivationPath: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SystemConfig;

  private constructor() {
    this.config = {
      bitcoin: {
        network:
          config.bitcoin.network === "testnet"
            ? bitcoin.networks.testnet
            : bitcoin.networks.bitcoin,
        nodeUrl: config.bitcoin.nodeUrl,
        rpcUser: config.bitcoin.rpcUser,
        rpcPassword: config.bitcoin.rpcPassword,
      },
      ordinal: {
        inscriptionSize: config.ordinal.inscriptionSize,
        minSats: config.ordinal.minSats,
      },
      keyManagement: {
        derivationPath: "m/84'/0'/0'/0", // BIP84 for native segwit
        seedPath: process.env.SEED_PATH,
      },
    };
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): SystemConfig {
    return this.config;
  }

  getBitcoinNetwork(): bitcoin.Network {
    return this.config.bitcoin.network;
  }

  getKeyManagementConfig() {
    return this.config.keyManagement;
  }
}
