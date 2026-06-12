import { Container, CosmosClient, CosmosClientOptions, Database, ItemDefinition, SqlQuerySpec } from '@azure/cosmos';

export interface ContainerSpec {
  name: string;
  /**
   * Partition key path, e.g. '/id' or '/userId'. Defaults to '/id'.
   * Must be a single leading-slash segment.
   */
  partitionKey?: string;
}

/**
 * Derive the document field name from a partition key path, rejecting anything
 * that is not a single leading-slash segment (e.g. `userId`, `/a/b`). Cosmos
 * requires partition key paths to start with `/`, and the delete path needs a
 * top-level field name — validating here turns those mistakes into an early,
 * explicit error instead of a deferred container-creation failure or a silently
 * mis-addressed delete.
 */
const partitionKeyFieldFromPath = (partitionKey: string): string => {
  if (!/^\/[^/]+$/.test(partitionKey)) {
    throw new Error(`Invalid partition key path "${partitionKey}": expected a single leading-slash segment such as "/id" or "/userId".`);
  }
  return partitionKey.slice(1);
};

export class Cosmos {
  private client: CosmosClient;
  private database: Database;
  /**
   * Partition key field per (final, possibly pluralized) container name.
   * Needed for deletes, where the partition key value must be supplied explicitly.
   */
  private partitionKeyFields: Record<string, string> = {};
  private ensuredContainers = new Map<string, Promise<unknown>>();

  private constructor(credentials: CosmosClientOptions) {
    this.client = new CosmosClient(credentials);
  }

  public static async create(credentials: CosmosClientOptions, dbName?: string, containers?: ContainerSpec[], usePlural?: boolean) {
    const instance = new Cosmos(credentials);
    if (dbName) {
      const { database } = await instance.client.databases.createIfNotExists({ id: dbName });
      instance.database = database;
    }
    if (instance.database && containers) {
      await instance.createContainers(containers, usePlural);
    }
    return instance;
  }

  private static pluralize(word: string): string {
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    }
    if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
      return word.slice(0, -1) + 'ies';
    }
    return word + 's';
  }

  private async createContainers(containers: ContainerSpec[], usePlural?: boolean): Promise<void> {
    await Promise.all(
      containers.map(({ name, partitionKey }) => {
        const finalName = usePlural ? Cosmos.pluralize(name) : name;
        return this.ensureContainer({ name: finalName, partitionKey });
      }),
    );
  }

  /**
   * Create the given containers if they don't exist yet. Idempotent: each
   * container is only created once per Cosmos instance. Names are expected
   * to be final container names (custom model names / pluralization applied).
   */
  public async ensureContainers(containers: ContainerSpec[]): Promise<void> {
    await Promise.all(containers.map(container => this.ensureContainer(container)));
  }

  private ensureContainer({ name, partitionKey = '/id' }: ContainerSpec): Promise<unknown> {
    let pending = this.ensuredContainers.get(name);
    if (!pending) {
      // Validate the path up front so a bad config fails loudly here rather than
      // as a deferred container-creation rejection.
      this.partitionKeyFields[name] = partitionKeyFieldFromPath(partitionKey);
      pending = this.database.containers.createIfNotExists({ id: name, partitionKey: { paths: [partitionKey] } }).catch(error => {
        // Don't cache a failed creation: a transient error (throttling, network)
        // would otherwise poison this container for the whole process lifetime.
        // Drop the entry so a later operation can retry.
        this.ensuredContainers.delete(name);
        // eslint-disable-next-line no-console
        console.error(`[better-auth-cosmos] Failed to create container "${name}":`, error);
        throw error;
      });
      this.ensuredContainers.set(name, pending);
    }
    return pending;
  }

  private getContainer(containerName: string): Container {
    return this.database.container(containerName);
  }

  public async create<T extends ItemDefinition>(containerName: string, item: T) {
    const { resource } = await this.getContainer(containerName).items.create(item);
    if (!resource) {
      throw new Error(`Cosmos create returned no resource for container "${containerName}"`);
    }
    return resource;
  }

  public async update<T extends ItemDefinition>(containerName: string, item: T) {
    const { resource } = await this.getContainer(containerName).items.upsert(item);
    if (!resource) {
      throw new Error(`Cosmos upsert returned no resource for container "${containerName}"`);
    }
    return resource;
  }

  public async findOne<T extends ItemDefinition>(containerName: string, query: string | SqlQuerySpec) {
    const container = this.getContainer(containerName);
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0] as T | undefined;
  }

  public async findMany<T extends ItemDefinition>(containerName: string, query: string | SqlQuerySpec) {
    const container = this.getContainer(containerName);
    const { resources } = await container.items.query(query).fetchAll();
    return resources as T[];
  }

  public async count(containerName: string, query: string | SqlQuerySpec): Promise<number> {
    const { resources } = await this.getContainer(containerName).items.query<number>(query).fetchAll();
    // `SELECT VALUE COUNT(1)` always yields exactly one row; an empty result
    // means the query shape is wrong, which must not be reported as "0 matches".
    if (resources.length === 0) {
      throw new Error(`Count query returned no rows for container "${containerName}"`);
    }
    return resources[0];
  }

  public async delete(containerName: string, item: ItemDefinition & { id: string }) {
    const partitionKeyField = this.partitionKeyFields[containerName] ?? 'id';
    const partitionKeyValue = item[partitionKeyField];
    // Refuse to guess the partition value: substituting item.id when the real
    // partition key field is absent would address the wrong logical partition.
    if (partitionKeyValue === undefined || partitionKeyValue === null) {
      throw new Error(
        `Document "${item.id}" in container "${containerName}" is missing partition key field "${partitionKeyField}"; refusing to delete to avoid targeting the wrong partition.`,
      );
    }
    await this.getContainer(containerName)
      .item(item.id, partitionKeyValue as string)
      .delete();
  }
}
