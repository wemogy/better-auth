import { CosmosClientManager, type CosmosConfig } from './cosmosClient.js';
import logger from '../logger/logger.js';

export interface CosmosFactoryConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  defaultContainerId?: string;
}

/**
 * Factory class for creating Cosmos DB clients and repositories
 */
export class CosmosFactory {
  private static instance: CosmosClientManager | null = null;
  private static config: CosmosConfig | null = null;

  /**
   * Initializes the Cosmos DB client (singleton pattern)
   */
  static initialize(config: CosmosFactoryConfig): CosmosClientManager {
    if (this.instance) {
      throw new Error('CosmosFactory is already initialized. Call getInstance() instead.');
    }

    logger.info('Initializing Cosmos DB client', {
      endpoint: config.endpoint,
      databaseId: config.databaseId,
      defaultContainerId: config.defaultContainerId,
    });

    this.config = {
      endpoint: config.endpoint,
      key: config.key,
      databaseId: config.databaseId,
      defaultContainerId: config.defaultContainerId,
    };

    try {
      this.instance = new CosmosClientManager(this.config);
      logger.info('Cosmos DB client initialized successfully');
      return this.instance;
    } catch (error) {
      logger.error('Failed to initialize Cosmos DB client', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Gets the singleton instance of the Cosmos client manager
   */
  static getInstance(): CosmosClientManager {
    if (!this.instance) {
      throw new Error('CosmosFactory not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  /**
   * Checks if the factory is initialized
   */
  static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Gets the current configuration
   */
  static getConfig(): CosmosConfig | null {
    return this.config;
  }
}

/**
 * Convenience function to initialize the factory with environment variables
 */
export function initializeCosmosFromEnv(): CosmosClientManager {
  logger.info('Initializing Cosmos DB from environment variables');

  const endpoint = process.env.COSMOS_DB_ENDPOINT;
  const key = process.env.COSMOS_DB_KEY;
  const databaseId = process.env.COSMOS_DB_DATABASE_ID;
  const defaultContainerId = process.env.COSMOS_DB_CONTAINER_ID;

  if (!endpoint || !key || !databaseId) {
    logger.error('Missing required environment variables for Cosmos DB', {
      hasEndpoint: !!endpoint,
      hasKey: !!key,
      hasDatabaseId: !!databaseId,
      hasDefaultContainerId: !!defaultContainerId,
    });
    throw new Error('Missing required environment variables: COSMOS_DB_ENDPOINT, COSMOS_DB_KEY, COSMOS_DB_DATABASE_ID');
  }

  logger.info('Environment variables validated, proceeding with Cosmos DB initialization');

  return CosmosFactory.initialize({
    endpoint,
    key,
    databaseId,
    defaultContainerId,
  });
}
