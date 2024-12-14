import { BitcoinService } from "./bitcoin";
import { OrdinalService } from "./ordinal";
import { KeyManager } from "../utils/key-manager";
import { ConfigManager } from "../config/config-manager";
import { Logger } from "../utils/logger";

export class ServiceManager {
  private static instance: ServiceManager;
  private bitcoinService: BitcoinService;
  private ordinalService: OrdinalService;
  private keyManager: KeyManager;
  private logger: Logger;

  private constructor() {
    this.logger = new Logger("ServiceManager");
    this.initializeServices();
  }

  private initializeServices(): void {
    try {
      const config = ConfigManager.getInstance().getConfig();

      // Initialize KeyManager
      this.keyManager = new KeyManager(
        config.bitcoin.network,
        this.loadOrCreateSeed()
      );

      // Initialize BitcoinService with KeyManager
      this.bitcoinService = new BitcoinService(this.keyManager);

      // Initialize OrdinalService
      this.ordinalService = new OrdinalService(this.bitcoinService);

      this.logger.info("Services initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize services", error as Error);
      throw error;
    }
  }

  private loadOrCreateSeed(): Buffer {
    const config = ConfigManager.getInstance().getKeyManagementConfig();

    // Implementation for secure seed loading or creation
    // In a production environment, this should use secure storage
    return KeyManager.generateSeed();
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
