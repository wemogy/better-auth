import { Container, CosmosClient, Database } from '@azure/cosmos';

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  defaultContainerId?: string;
}

export class CosmosClientManager {
  private readonly client: CosmosClient;
  private readonly database: Database;
  private config: CosmosConfig;

  constructor(config: CosmosConfig) {
    this.config = config;
    this.client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
    this.database = this.client.database(config.databaseId);
  }

  /**
   * Gets the Cosmos client instance
   */
  getClient(): CosmosClient {
    return this.client;
  }

  /**
   * Gets the database instance
   */
  getDatabase(): Database {
    return this.database;
  }

  /**
   * Gets a container by name
   */
  async getContainer(containerId: string): Promise<Container> {
    const { container } = await this.database.container(containerId).read();
    return container;
  }

  /**
   * Gets the default container
   */
  async getDefaultContainer(): Promise<Container> {
    if (!this.config.defaultContainerId) {
      throw new Error('No default container ID configured');
    }
    return this.getContainer(this.config.defaultContainerId);
  }

  /**
   * Creates a container if it doesn't exist
   */
  async createContainerIfNotExists(containerId: string, partitionKey: string, throughput?: number): Promise<Container> {
    const { container } = await this.database.containers.createIfNotExists(
      {
        id: containerId,
        partitionKey: { paths: [partitionKey], version: 1 },
      },
      throughput ? { offerThroughput: throughput } : undefined,
    );

    return container;
  }

  /**
   * Checks if the connection to Cosmos DB is working
   */
  async ping(): Promise<boolean> {
    try {
      await this.database.read();
      return true;
    } catch (error) {
      console.error('Cosmos DB connection failed:', error);
      return false;
    }
  }
}
