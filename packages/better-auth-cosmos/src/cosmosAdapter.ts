import { ItemDefinition } from '@azure/cosmos';
import type { CleanedWhere, Where } from 'better-auth/adapters';
import { Cosmos } from './cosmos';
import { queryBuilder } from './util/queryBuilder';

export class CosmosAdapter {
  private cosmos: Cosmos;
  private readonly getModelName: (model: string) => string;
  private readonly getFieldName: (args: { model: string; field: string }) => string;

  constructor(cosmos: Cosmos, getModelName: (model: string) => string, getFieldName: (args: { model: string; field: string }) => string) {
    this.cosmos = cosmos;
    this.getModelName = getModelName;
    this.getFieldName = getFieldName;
  }

  // `select` arrives with logical field names and has to be mapped to the
  // actual document property names (devs can rename fields via better-auth options).
  private mapSelect(model: string, select?: string[]): string[] | undefined {
    return select?.map(field => this.getFieldName({ model, field }));
  }

  async create<T extends ItemDefinition>({ model, data, select: _select }: { model: string; data: T; select?: string[] }) {
    void _select;
    return await this.cosmos.create(this.getModelName(model), data);
  }

  async update<T extends ItemDefinition>({ model, where, update }: { model: string; where: Required<Where>[]; update: T }) {
    if (!where?.length) {
      return null;
    }

    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ where }));
    if (!existingItem) {
      return null;
    }

    const updatedItem: T = { ...existingItem, ...update };
    return await this.cosmos.update(this.getModelName(model), updatedItem);
  }

  async updateMany<T extends ItemDefinition>({ model, where, update }: { model: string; where: CleanedWhere[]; update: T }) {
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
    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ where }));
    if (existingItem?.id) {
      await this.cosmos.delete(this.getModelName(model), existingItem.id);
    }
  }

  async deleteMany<T extends ItemDefinition>({ model, where }: { model: string; where?: CleanedWhere[] }) {
    const existingItems = await this.cosmos.findMany<T>(this.getModelName(model), queryBuilder({ where }));
    const updated = await Promise.all(existingItems.map(item => item.id && this.cosmos.delete(this.getModelName(model), item.id)));
    return updated.length;
  }

  async findOne<T extends ItemDefinition>({ model, select, where }: { model: string; select?: string[]; where: CleanedWhere[] }) {
    return await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ select: this.mapSelect(model, select), where }));
  }

  async findMany<T extends ItemDefinition>({
    model,
    select,
    where,
    sortBy,
    offset,
    limit,
  }: {
    model: string;
    select?: string[];
    where?: CleanedWhere[];
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    offset?: number;
    limit?: number;
  }) {
    return await this.cosmos.findMany<T>(
      this.getModelName(model),
      queryBuilder({ select: this.mapSelect(model, select), where, sortBy, offset, limit }),
    );
  }

  async count({ model, where }: { model: string; where?: CleanedWhere[] }) {
    const existingItems = await this.cosmos.findMany(this.getModelName(model), queryBuilder({ where }));
    return existingItems.length;
  }
}
