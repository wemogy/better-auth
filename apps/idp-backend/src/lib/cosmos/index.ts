// Core client and factory
export { CosmosClientManager, type CosmosConfig } from './cosmosClient.js';
export { CosmosFactory, type CosmosFactoryConfig, initializeCosmosFromEnv } from './cosmosFactory.js';

// Repository base class and interfaces
export { CosmosRepository, type BaseEntity, type QueryOptions, type QueryResult } from './cosmosRepository.js';

// Example implementations
export { TenantRepository, type Tenant } from './tenantRepository.js';
