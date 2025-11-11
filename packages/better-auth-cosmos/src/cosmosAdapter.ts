import { ItemDefinition } from '@azure/cosmos';
import type { CleanedWhere, Where } from 'better-auth/adapters';
import { Cosmos } from './cosmos';
import { queryBuilder } from './util/queryBuilder';

export class CosmosAdapter {
  private cosmos: Cosmos;
  private getModelName: (model: string) => string;
  private tenantId?: string;

  constructor(cosmos: Cosmos, getModelName: (model: string) => string, tenantId?: string) {
    this.cosmos = cosmos;
    this.getModelName = getModelName;
    this.tenantId = tenantId;
  }

  async create<T extends ItemDefinition>({ model, data, select: _select }: { model: string; data: T; select?: string[] }) {
    void _select;
    this.enrichDataWithTenantId(data);
    return await this.cosmos.create(this.getModelName(model), data);
  }

  async update<T extends ItemDefinition>({ model, where, update }: { model: string; where: Required<Where>[]; update: T }) {
    where = this.enrichWhereWithTenantId(where);

    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ where }));
    const updatedItem: T = { ...existingItem, ...update };
    return await this.cosmos.update(this.getModelName(model), updatedItem);
  }

  async updateMany<T extends ItemDefinition>({ model, where, update }: { model: string; where: CleanedWhere[]; update: T }) {
    where = this.enrichWhereWithTenantId(where);

    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where }));
    const updated = await Promise.all(
      existingItems.map(item => {
        const updatedItem = { ...(item || {}), ...update };
        return this.cosmos.update<T>(this.getModelName(model), updatedItem);
      }),
    );
    return updated.length;
  }

  async delete<T extends ItemDefinition>({ model, where }: { model: string; where?: CleanedWhere[] }) {
    where = this.enrichWhereWithTenantId(where);

    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ where }));
    if (existingItem?.id) {
      await this.cosmos.delete(this.getModelName(model), existingItem.id);
    }
  }

  async deleteMany<T extends ItemDefinition>({ model, where }: { model: string; where?: CleanedWhere[] }) {
    where = this.enrichWhereWithTenantId(where);

    const existingItems = await this.cosmos.findMany<T>(this.getModelName(model), queryBuilder({ where }));
    const updated = await Promise.all(existingItems.map(item => item.id && this.cosmos.delete(this.getModelName(model), item.id)));
    return updated.length;
  }

  async findOne<T extends ItemDefinition>({ model, select, where }: { model: string; select?: string[]; where: CleanedWhere[] }) {
    where = this.enrichWhereWithTenantId(where);
    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ select, where }));
    return existingItem;
  }

  async findMany<T extends ItemDefinition>({
    model,
    where,
    sortBy,
    offset,
    limit,
  }: {
    model: string;
    where?: CleanedWhere[];
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    offset?: number;
    limit?: number;
  }) {
    where = this.enrichWhereWithTenantId(where);

    const existingItems = await this.cosmos.findMany<T>(this.getModelName(model), queryBuilder({ where, sortBy, offset, limit }));
    return existingItems;
  }

  async count({ model, where }: { model: string; where?: CleanedWhere[] }) {
    where = this.enrichWhereWithTenantId(where);

    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where }));
    return existingItems.length;
  }

  private enrichDataWithTenantId<T extends ItemDefinition>(data: T): void {
    if (this.tenantId) {
      (data as T & { tenantId?: string }).tenantId = this.tenantId;
    }
  }

  private enrichWhereWithTenantId(where?: CleanedWhere[]): CleanedWhere[] {
    if (!where) {
      where = [];
    }

    if (this.tenantId) {
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: this.tenantId,
        connector: 'AND',
      });
    }

    return where;
  }
}
