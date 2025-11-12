import { CosmosClientManager, type CosmosConfig } from './cosmosClient.js';
import { CosmosRepository } from './cosmosRepository.js';

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

    this.config = {
      endpoint: config.endpoint,
      key: config.key,
      databaseId: config.databaseId,
      defaultContainerId: config.defaultContainerId,
    };

    this.instance = new CosmosClientManager(this.config);
    return this.instance;
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
   * Creates a repository for a specific entity type
   */
  static createRepository<T extends { id: string }>(
    containerId: string,
    partitionKey: string = '/id',
  ): CosmosRepository<T & { id: string; createdAt?: Date; updatedAt?: Date; version?: number }> {
    const client = this.getInstance();
    return new CosmosRepository(client, containerId, partitionKey);
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

  /**
   * Resets the factory (for testing purposes)
   */
  static reset(): void {
    this.instance = null;
    this.config = null;
  }
}

/**
 * Convenience function to initialize the factory with environment variables
 */
export function initializeCosmosFromEnv(): CosmosClientManager {
  const endpoint = process.env.COSMOS_DB_ENDPOINT;
  const key = process.env.COSMOS_DB_KEY;
  const databaseId = process.env.COSMOS_DB_DATABASE_ID;
  const defaultContainerId = process.env.COSMOS_DB_CONTAINER_ID;

  if (!endpoint || !key || !databaseId) {
    throw new Error('Missing required environment variables: COSMOS_DB_ENDPOINT, COSMOS_DB_KEY, COSMOS_DB_DATABASE_ID');
  }

  return CosmosFactory.initialize({
    endpoint,
    key,
    databaseId,
    defaultContainerId,
  });
}
