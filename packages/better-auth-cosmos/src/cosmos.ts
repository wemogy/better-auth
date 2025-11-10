import { Container, CosmosClient, CosmosClientOptions, Database, ItemDefinition } from '@azure/cosmos';

export class Cosmos {
  private client: CosmosClient;
  private database: Database;

  private constructor(credentials: CosmosClientOptions) {
    this.client = new CosmosClient(credentials);
  }

  public static async create(credentials: CosmosClientOptions, dbName?: string, containerNames?: string[], usePlural?: boolean) {
    const instance = new Cosmos(credentials);
    if (dbName) {
      const { database } = await instance.client.databases.createIfNotExists({ id: dbName });
      instance.database = database;
    }
    if (instance.database && containerNames) {
      const pluralize = (word: string): string => {
        if (!usePlural) return word;
        // Simple pluralization rules
        if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
          return word + 'es';
        }
        if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
          return word.slice(0, -1) + 'ies';
        }
        return word + 's';
      };
      const pluralizedNames = containerNames.map(name => pluralize(name));
      await Promise.all(pluralizedNames.map(name => instance.database.containers.createIfNotExists({ id: name, partitionKey: { paths: ['/id'] } })));
    }
    return instance;
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

  public async findOne(containerName: string, query: string) {
    const container = this.getContainer(containerName);
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0];
  }

  public async findMany(containerName: string, query: string) {
    const container = this.getContainer(containerName);
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }

  public async delete(containerName: string, id: string) {
    const container = this.getContainer(containerName);
    await container.item(id, id).delete();
  }
}
