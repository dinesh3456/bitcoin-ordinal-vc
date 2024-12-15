// src/services/service-manager.ts
import { BitcoinService } from "./bitcoin";
import { OrdinalService } from "./ordinal";
import { KeyManager } from "../utils/key-manager";
import { ConfigManager } from "../config/config-manager";
import { Logger } from "../utils/logger";

export class ServiceManager {
  private static instance: ServiceManager;
  private bitcoinService!: BitcoinService; // Using definite assignment assertion
  private ordinalService!: OrdinalService; // Using definite assignment assertion
  private keyManager!: KeyManager; // Using definite assignment assertion
  private readonly logger: Logger;

  private constructor() {
    this.logger = new Logger("ServiceManager");
    this.initializeServices();
  }

  private initializeServices(): void {
    try {
      const config = ConfigManager.getInstance().getConfig();

      // Initialize key manager with seed
      this.keyManager = new KeyManager(
        config.bitcoin.network,
        this.loadOrCreateSeed()
      );

      // Initialize services
      this.bitcoinService = new BitcoinService(this.keyManager);
      this.ordinalService = new OrdinalService(this.bitcoinService);

      this.logger.info("Services initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize services", error as Error);
      throw error;
    }
  }

  private loadOrCreateSeed(): Buffer {
    try {
      //const config = ConfigManager.getInstance().getKeyManagementConfig();
      return KeyManager.generateSeed();
    } catch (error) {
      this.logger.error("Failed to load or create seed", error as Error);
      throw error;
    }
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  getBitcoinService(): BitcoinService {
    return this.bitcoinService;
  }

  getOrdinalService(): OrdinalService {
    return this.ordinalService;
  }

  getKeyManager(): KeyManager {
    return this.keyManager;
  }
}
