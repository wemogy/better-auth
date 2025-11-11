import type { CleanedWhere } from 'better-auth/adapters';
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

  async create({ model, data, select: _select, tenantId }: { model: string; data: Record<string, unknown>; select?: string[]; tenantId?: string }) {
    void _select;
    console.log('COSMOS CREATE', model, data);

    // Add tenantId to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    const effectiveTenantId = tenantId || this.tenantId;
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      data.tenantId = effectiveTenantId;
    }

    return await this.cosmos.create(this.getModelName(model), data);
  }

  async update({ model, where, update, tenantId }: { model: string; where: CleanedWhere[]; update: Record<string, unknown>; tenantId?: string }) {
    const effectiveTenantId = tenantId || this.tenantId;

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItem = await this.cosmos.findOne(this.getModelName(model), queryBuilder({ where }));
    const updatedItem = { ...(existingItem || {}), ...update };
    return (await this.cosmos.update(this.getModelName(model), updatedItem)) as typeof update;
  }

  async updateMany({ model, where, update, tenantId }: { model: string; where: CleanedWhere[]; update: Record<string, unknown>; tenantId?: string }) {
    const effectiveTenantId = tenantId || this.tenantId;

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where }));
    const updated = await Promise.all(
      existingItems.map(item => {
        const updatedItem = { ...(item || {}), ...update };
        return this.cosmos.update(this.getModelName(model), updatedItem);
      }),
    );
    return updated.length;
  }

  async delete({ model, where, tenantId }: { model: string; where: CleanedWhere[]; tenantId?: string }) {
    const effectiveTenantId = tenantId || this.tenantId;

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItem = await this.cosmos.findOne(this.getModelName(model), queryBuilder({ where }));
    if (existingItem) {
      await this.cosmos.delete(this.getModelName(model), existingItem.id);
    }
  }

  async deleteMany({ model, where, tenantId }: { model: string; where: CleanedWhere[]; tenantId?: string }) {
    const effectiveTenantId = tenantId || this.tenantId;

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where }));
    const updated = await Promise.all(existingItems.map(item => this.cosmos.delete(this.getModelName(model), item.id)));
    return updated.length;
  }

  async findOne({ model, select, where, tenantId }: { model: string; select?: string[]; where: CleanedWhere[]; tenantId?: string }) {
    const effectiveTenantId = tenantId || this.tenantId;
    console.log('COSMOS FINDONE', model, 'tenantId:', effectiveTenantId);

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItem = await this.cosmos.findOne(this.getModelName(model), queryBuilder({ select, where }));
    return existingItem;
  }

  async findMany({
    model,
    where,
    sortBy,
    offset,
    limit,
    tenantId,
  }: {
    model: string;
    where?: CleanedWhere[];
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    offset?: number;
    limit?: number;
    tenantId?: string;
  }) {
    const effectiveTenantId = tenantId || this.tenantId;
    console.log('COSMOS FINDMANY', model, 'tenantId:', effectiveTenantId);

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where, sortBy, offset, limit }));
    return existingItems;
  }

  async count({ model, where, tenantId }: { model: string; where?: CleanedWhere[]; tenantId?: string }) {
    const effectiveTenantId = tenantId || this.tenantId;
    console.log('COSMOS COUNT', model, 'tenantId:', effectiveTenantId);

    // Add tenant filter to models that should be tenant-scoped
    const tenantScopedModels = ['user', 'session', 'account', 'verification'];
    if (effectiveTenantId && tenantScopedModels.includes(model)) {
      if (!where) {
        where = [];
      }
      where.push({
        field: 'tenantId',
        operator: 'eq',
        value: effectiveTenantId,
        connector: 'AND',
      });
    }

    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where }));
    return existingItems.length;
  }
}
