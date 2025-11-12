import { CosmosRepository, type BaseEntity } from './cosmosRepository.js';
import { CosmosFactory } from './cosmosFactory.js';

export interface Tenant extends BaseEntity {
  name: string;
  description?: string;
}

export class TenantRepository extends CosmosRepository<Tenant> {
  constructor() {
    super(CosmosFactory.getInstance(), 'tenants', '/id');
  }

  /**
   * Initializes the tenant repository with the required container
   */
  async initialize(throughput?: number): Promise<void> {
    await super.initialize(throughput);
  }

  /**
   * Finds a tenant by name
   */
  async findByName(name: string): Promise<Tenant | null> {
    const query = {
      query: 'SELECT * FROM tenants t WHERE t.name = @name',
      parameters: [{ name: '@name', value: name }],
    };

    const result = await this.query(query);
    return result.items.length > 0 ? result.items[0] : null;
  }
}
