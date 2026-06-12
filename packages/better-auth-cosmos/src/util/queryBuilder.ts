import type { SqlParameter, SqlQuerySpec } from '@azure/cosmos';
import type { CleanedWhere } from 'better-auth/adapters';

interface QueryBuilderOptions {
  select?: string[];
  where?: CleanedWhere[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  offset?: number;
  limit?: number;
  /**
   * Build a `SELECT VALUE COUNT(1)` query instead of returning documents.
   */
  countOnly?: boolean;
}

export const queryBuilder = ({ select = ['*'], where, sortBy, offset, limit, countOnly }: QueryBuilderOptions): SqlQuerySpec => {
  const conditions: string[] = [];
  const parameters: SqlParameter[] = [];

  const addParameter = (value: unknown): string => {
    const name = `@p${parameters.length}`;
    parameters.push({ name, value: value as SqlParameter['value'] });
    return name;
  };

  for (const w of where ?? []) {
    conditions.push(`${conditions.length ? ` ${w.connector} ` : ''}${mapCondition(w, addParameter)}`);
  }

  const columns = select.length === 1 && select.at(0) === '*' ? '*' : select.map(column => `c.${column}`).join(', ');

  let query = `SELECT ${countOnly ? 'VALUE COUNT(1)' : columns} FROM c${conditions.length ? ` WHERE ${conditions.join(' ')}` : ''}${sortBy ? ` ORDER BY c.${sortBy.field} ${sortBy.direction}` : ''}`;

  // Handle pagination
  // offset/limit are interpolated into the query text (Cosmos has no parameter
  // binding for these), so they must be validated as non-negative integers.
  const safeOffset = offset === undefined ? undefined : assertNonNegativeInteger(offset, 'offset');
  const safeLimit = limit === undefined ? undefined : assertNonNegativeInteger(limit, 'limit');

  // If limit is provided, always include OFFSET (default 0) and LIMIT
  // If only offset is provided, include OFFSET and LIMIT 0
  if (safeLimit !== undefined) {
    query += ` OFFSET ${safeOffset ?? 0} LIMIT ${safeLimit}`;
  } else if (safeOffset !== undefined && safeOffset > 0) {
    query += ` OFFSET ${safeOffset} LIMIT 0`;
  }

  return { query: query.trim(), parameters };
};

const assertNonNegativeInteger = (value: number, name: string): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${name}: expected a non-negative integer, received ${value}`);
  }
  return value;
};

const mapCondition = (where: CleanedWhere, addParameter: (value: unknown) => string): string => {
  if (where.operator === 'contains') {
    return `CONTAINS(c.${where.field}, ${addParameter(where.value)}, true)`;
  }
  if (where.operator === 'starts_with') {
    return `STARTSWITH(c.${where.field}, ${addParameter(where.value)}, true)`;
  }
  if (where.operator === 'ends_with') {
    return `ENDSWITH(c.${where.field}, ${addParameter(where.value)}, true)`;
  }
  if (where.operator === 'in' && Array.isArray(where.value)) {
    return `ARRAY_CONTAINS(${addParameter(where.value)}, c.${where.field})`;
  }
  if (where.operator === 'not_in' && Array.isArray(where.value)) {
    return `NOT ARRAY_CONTAINS(${addParameter(where.value)}, c.${where.field})`;
  }

  // Comparing against null with `=` / `!=` yields undefined in Cosmos SQL,
  // so null checks need the IS_NULL builtin instead.
  if (where.value === null) {
    if (where.operator === 'ne') {
      return `NOT IS_NULL(c.${where.field})`;
    }
    return `IS_NULL(c.${where.field})`;
  }

  let mappedOperator: string;
  switch (where.operator) {
    case 'eq':
      mappedOperator = '=';
      break;
    case 'ne':
      mappedOperator = '!=';
      break;
    case 'lt':
      mappedOperator = '<';
      break;
    case 'lte':
      mappedOperator = '<=';
      break;
    case 'gt':
      mappedOperator = '>';
      break;
    case 'gte':
      mappedOperator = '>=';
      break;
    default:
      mappedOperator = '=';
      break;
  }

  return `c.${where.field} ${mappedOperator} ${addParameter(where.value)}`;
};
