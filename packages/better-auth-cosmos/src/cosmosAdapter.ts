import { ItemDefinition } from '@azure/cosmos';
import type { CleanedWhere, Where } from 'better-auth/adapters';
import { Cosmos } from './cosmos.js';
import { queryBuilder } from './util/queryBuilder.js';

interface CosmosAdapterDeps {
  cosmos: Cosmos;
  getModelName: (model: string) => string;
  getFieldName: (args: { model: string; field: string }) => string;
  /**
   * Allowed document field names per model, derived from the better-auth schema.
   * Whitelists identifiers (where/sortBy/select) before they are interpolated
   * into Cosmos SQL — Cosmos cannot parameterize identifiers, so an unvalidated
   * field name would be a SQL injection vector.
   */
  validFields: Record<string, ReadonlySet<string>>;
  /**
   * Resolves once all containers required by the active better-auth schema exist.
   */
  ready: Promise<void>;
}

export class CosmosAdapter {
  private readonly cosmos: Cosmos;
  private readonly getModelName: (model: string) => string;
  private readonly getFieldName: (args: { model: string; field: string }) => string;
  private readonly validFields: Record<string, ReadonlySet<string>>;
  private readonly ready: Promise<void>;

  constructor({ cosmos, getModelName, getFieldName, validFields, ready }: CosmosAdapterDeps) {
    this.cosmos = cosmos;
    this.getModelName = getModelName;
    this.getFieldName = getFieldName;
    this.validFields = validFields;
    this.ready = ready;
  }

  /**
   * Reject any identifier that is not a known field of the model. better-auth's
   * adapter factory already maps and validates `where` field names (and throws
   * on unknown ones), so for `where` this is a second line of defense; for
   * `sortBy` and `select` — which the factory does not validate — it is the
   * primary guard against an unvalidated identifier reaching the query text.
   */
  private assertField(model: string, field: string): void {
    const allowed = this.validFields[model];
    if (allowed && !allowed.has(field)) {
      throw new Error(`Unknown field "${field}" for model "${model}"`);
    }
  }

  // `select` and `sortBy` arrive with logical field names (the factory does not
  // transform them), so map them to the physical document property names and
  // validate the result before it reaches the query.
  private mapField(model: string, field: string): string {
    const mapped = this.getFieldName({ model, field });
    this.assertField(model, mapped);
    return mapped;
  }

  private mapSelect(model: string, select?: string[]): string[] | undefined {
    return select?.map(field => this.mapField(model, field));
  }

  private mapSortBy(model: string, sortBy?: { field: string; direction: 'asc' | 'desc' }) {
    if (!sortBy) {
      return undefined;
    }
    return { ...sortBy, field: this.mapField(model, sortBy.field) };
  }

  // `where` field names arrive already mapped to physical column names by the
  // factory; validate them as defense in depth before they reach the query.
  private assertWhere(model: string, where?: { field: string }[]): void {
    where?.forEach(({ field }) => {
      this.assertField(model, field);
    });
  }

  async create<T extends ItemDefinition>({ model, data, select: _select }: { model: string; data: T; select?: string[] }) {
    void _select;
    await this.ready;
    return await this.cosmos.create(this.getModelName(model), data);
  }

  async update<T extends ItemDefinition>({ model, where, update }: { model: string; where: Required<Where>[]; update: T }) {
    if (!where?.length) {
      return null;
    }

    this.assertWhere(model, where);
    await this.ready;
    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ where }));
    if (!existingItem) {
      return null;
    }

    const updatedItem: T = { ...existingItem, ...update };
    return await this.cosmos.update(this.getModelName(model), updatedItem);
  }

  async updateMany<T extends ItemDefinition>({ model, where, update }: { model: string; where: CleanedWhere[]; update: T }) {
    this.assertWhere(model, where);
    await this.ready;
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
    this.assertWhere(model, where);
    await this.ready;
    const existingItem = await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ where }));
    if (existingItem?.id) {
      await this.cosmos.delete(this.getModelName(model), existingItem as T & { id: string });
    }
  }

  async deleteMany<T extends ItemDefinition>({ model, where }: { model: string; where?: CleanedWhere[] }) {
    this.assertWhere(model, where);
    await this.ready;
    const existingItems = await this.cosmos.findMany<T>(this.getModelName(model), queryBuilder({ where }));
    const deleted = await Promise.all(
      existingItems.filter(item => item.id).map(item => this.cosmos.delete(this.getModelName(model), item as T & { id: string })),
    );
    return deleted.length;
  }

  async findOne<T extends ItemDefinition>({ model, select, where }: { model: string; select?: string[]; where: CleanedWhere[] }) {
    this.assertWhere(model, where);
    const mappedSelect = this.mapSelect(model, select);
    await this.ready;
    return await this.cosmos.findOne<T>(this.getModelName(model), queryBuilder({ select: mappedSelect, where }));
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
    this.assertWhere(model, where);
    const mappedSelect = this.mapSelect(model, select);
    const mappedSortBy = this.mapSortBy(model, sortBy);
    await this.ready;
    return await this.cosmos.findMany<T>(
      this.getModelName(model),
      queryBuilder({ select: mappedSelect, where, sortBy: mappedSortBy, offset, limit }),
    );
  }

  async count({ model, where }: { model: string; where?: CleanedWhere[] }) {
    this.assertWhere(model, where);
    await this.ready;
    return await this.cosmos.count(this.getModelName(model), queryBuilder({ where, countOnly: true }));
  }
}
