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
}
