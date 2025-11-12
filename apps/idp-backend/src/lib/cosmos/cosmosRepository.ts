import { Container, type ItemDefinition, type SqlQuerySpec } from '@azure/cosmos';
import { CosmosClientManager } from './cosmosClient.js';

export interface BaseEntity extends ItemDefinition {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

export interface QueryOptions {
  maxItemCount?: number;
  enableCrossPartition?: boolean;
  continuationToken?: string;
}

export interface QueryResult<T extends BaseEntity> {
  items: T[];
  continuationToken?: string;
  count: number;
}

export class CosmosRepository<T extends BaseEntity> {
  protected container!: Container;
  protected containerId: string;
  protected partitionKey: string;

  constructor(
    protected cosmosClient: CosmosClientManager,
    containerId: string,
    partitionKey: string = '/id',
  ) {
    this.containerId = containerId;
    this.partitionKey = partitionKey;
  }

  /**
   * Initializes the repository by ensuring the container exists
   */
  async initialize(throughput?: number): Promise<void> {
    this.container = await this.cosmosClient.createContainerIfNotExists(this.containerId, this.partitionKey, throughput);
  }

  /**
   * Creates a new item
   */
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'> & Partial<Pick<T, 'id'>>): Promise<T> {
    const now = new Date();
    const newItem: T = {
      ...(item as T),
      id: item.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    } as T;

    const { resource } = await this.container.items.create(newItem);
    return resource as unknown as T;
  }

  /**
   * Reads an item by ID
   */
  async findById(id: string, partitionKey?: string): Promise<T | null> {
    try {
      const partitionKeyValue = partitionKey || id;
      const { resource } = await this.container.item(id, partitionKeyValue).read();
      return resource as unknown as T;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Updates an existing item
   */
  async update(id: string, updates: Partial<T>, partitionKey?: string): Promise<T | null> {
    const partitionKeyValue = partitionKey || id;

    // Read the existing item
    const existingItem = await this.findById(id, partitionKeyValue);
    if (!existingItem) {
      return null;
    }

    // Apply updates
    const updatedItem: T = {
      ...existingItem,
      ...updates,
      updatedAt: new Date(),
      version: (existingItem.version || 0) + 1,
    } as T;

    const { resource } = await this.container.item(id, partitionKeyValue).replace(updatedItem);
    return resource as unknown as T;
  }

  /**
   * Deletes an item by ID
   */
  async deleteById(id: string, partitionKey?: string): Promise<boolean> {
    const partitionKeyValue = partitionKey || id;

    try {
      await this.container.item(id, partitionKeyValue).delete();
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Executes a SQL query
   */
  async query(query: string | SqlQuerySpec, options: QueryOptions = {}): Promise<QueryResult<T>> {
    const queryOptions = {
      maxItemCount: options.maxItemCount || 100,
      enableCrossPartition: options.enableCrossPartition || false,
      ...(options.continuationToken && { continuationToken: options.continuationToken }),
    };

    const { resources, continuationToken } = await this.container.items.query(query, queryOptions).fetchAll();

    return {
      items: resources as unknown as T[],
      continuationToken,
      count: resources.length,
    };
  }

  /**
   * Finds all items (with optional pagination)
   */
  async findAll(options: QueryOptions = {}): Promise<QueryResult<T>> {
    const query = 'SELECT * FROM c';
    return this.query(query, options);
  }

  /**
   * Counts all items
   */
  async count(): Promise<number> {
    const query = 'SELECT VALUE COUNT(1) FROM c';
    const result = await this.query(query);
    return result.items[0] as unknown as number;
  }

  /**
   * Checks if an item exists by ID
   */
  async exists(id: string, partitionKey?: string): Promise<boolean> {
    return (await this.findById(id, partitionKey)) !== null;
  }
}
