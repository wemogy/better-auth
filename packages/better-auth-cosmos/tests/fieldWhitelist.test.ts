import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CosmosAdapter } from '../src/cosmosAdapter';
import type { Cosmos } from '../src/cosmos';

// Unit tests for the identifier whitelist as a standalone safety net.
//
// In normal operation, better-auth's adapter factory already validates
// where/sortBy/select field names via getFieldName before they reach this
// class. These tests cover direct CosmosAdapter usage, where getFieldName may
// be a lenient identity function and the whitelist is the last line of defense
// against an unvalidated identifier reaching the Cosmos SQL text.

describe('CosmosAdapter field whitelist', () => {
  let cosmos: { findOne: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  let adapter: CosmosAdapter;

  beforeEach(() => {
    cosmos = {
      findOne: vi.fn().mockResolvedValue(undefined),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    };

    const getModelName = (model: string) => model;
    // Identity mapping, simulating a lenient setup where getFieldName does not
    // itself reject unknown fields.
    const getFieldName = ({ field }: { model: string; field: string }) => field;
    const validFields = { user: new Set(['id', 'email', 'name', 'role']) };

    adapter = new CosmosAdapter(cosmos as unknown as Cosmos, getModelName, getFieldName, validFields);
  });

  it('rejects an unknown where field', async () => {
    await expect(adapter.findOne({ model: 'user', where: [{ field: 'nonexistent', value: 'x', operator: 'eq', connector: 'AND' }] })).rejects.toThrow(
      /Unknown field "nonexistent" for model "user"/,
    );
    expect(cosmos.findOne).not.toHaveBeenCalled();
  });

  it('rejects an injection attempt in a where field', async () => {
    await expect(
      adapter.findMany({ model: 'user', where: [{ field: "id' OR '1'='1", value: 'x', operator: 'eq', connector: 'AND' }] }),
    ).rejects.toThrow(/Unknown field/);
    expect(cosmos.findMany).not.toHaveBeenCalled();
  });

  it('rejects an injection attempt in sortBy', async () => {
    await expect(adapter.findMany({ model: 'user', sortBy: { field: 'name; DROP', direction: 'asc' } })).rejects.toThrow(/Unknown field/);
    expect(cosmos.findMany).not.toHaveBeenCalled();
  });

  it('rejects an unknown select field', async () => {
    await expect(
      adapter.findOne({ model: 'user', select: ['id', 'secret FROM c--'], where: [{ field: 'id', value: 'x', operator: 'eq', connector: 'AND' }] }),
    ).rejects.toThrow(/Unknown field/);
    expect(cosmos.findOne).not.toHaveBeenCalled();
  });

  it('allows known fields through to the query', async () => {
    await adapter.findMany({
      model: 'user',
      where: [{ field: 'email', value: 'a@b.com', operator: 'eq', connector: 'AND' }],
      sortBy: { field: 'name', direction: 'asc' },
      select: ['id', 'role'],
    });
    expect(cosmos.findMany).toHaveBeenCalledOnce();
  });

  it('skips validation when the model has no registered field set', async () => {
    // Unknown models (no schema entry) fall through without throwing, so the
    // whitelist never blocks legitimate-but-unmapped usage.
    await adapter.count({ model: 'unregistered', where: [{ field: 'anything', value: 'x', operator: 'eq', connector: 'AND' }] });
    expect(cosmos.count).toHaveBeenCalledOnce();
  });
});
