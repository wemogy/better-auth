import { Container, CosmosClient, CosmosClientOptions, Database, ItemDefinition, SqlQuerySpec } from '@azure/cosmos';

export interface ContainerSpec {
  name: string;
  /**
   * Partition key path, e.g. '/id' or '/userId'. Defaults to '/id'.
   */
  partitionKey?: string;
}

export class Cosmos {
  private client: CosmosClient;
  private database: Database;
  /**
   * Partition key field per (final, possibly pluralized) container name.
   * Needed for deletes, where the partition key value must be supplied explicitly.
   */
  private partitionKeyFields: Record<string, string> = {};

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
      containers.map(({ name, partitionKey = '/id' }) => {
        const finalName = usePlural ? Cosmos.pluralize(name) : name;
        this.partitionKeyFields[finalName] = partitionKey.replace(/^\//, '');
        return this.database.containers.createIfNotExists({ id: finalName, partitionKey: { paths: [partitionKey] } });
      }),
    );
  }

  private getContainer(containerName: string): Container {
    return this.database.container(containerName);
  }

  public async create<T extends ItemDefinition>(containerName: string, item: T) {
    const container = this.getContainer(containerName);
    const created = await container.items.create(item);
    return created.resource!;
  }

  public async update<T extends ItemDefinition>(containerName: string, item: T) {
    const container = this.getContainer(containerName);
    const { resource } = await container.items.upsert(item);
    return resource!;
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
    const container = this.getContainer(containerName);
    const { resources } = await container.items.query<number>(query).fetchAll();
    return resources[0] ?? 0;
  }

  public async delete(containerName: string, item: ItemDefinition & { id: string }) {
    const container = this.getContainer(containerName);
    const partitionKeyField = this.partitionKeyFields[containerName] ?? 'id';
    const partitionKeyValue = (item[partitionKeyField] as string | undefined) ?? item.id;
    await container.item(item.id, partitionKeyValue).delete();
  }
}
