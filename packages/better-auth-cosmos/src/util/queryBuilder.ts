import { CleanedWhere } from 'better-auth/adapters';

interface QueryBuilderOptions {
  select?: string[];
  where?: CleanedWhere[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  offset?: number;
  limit?: number;
}
export const queryBuilder = ({ select = ['*'], where, sortBy, offset, limit }: QueryBuilderOptions) => {
  const conditions: string[] = [];
  for (const w of where ?? []) {
    conditions.push(`${conditions.length ? ` ${w.connector} ` : ''}${mapCondition(w)}`);
  }

  const columns = select.length === 1 && select.at(0) === '*' ? '*' : select.map(column => `c.${column}`).join(', ');

  let query = `SELECT ${columns} FROM c${conditions.length ? ` WHERE ${conditions.join(' ')}` : ''}${sortBy ? ` ORDER BY c.${sortBy.field} ${sortBy.direction}` : ''}`;

  // Handle pagination - only add if limit is defined and > 0, or offset is defined and > 0
  if (offset !== undefined && offset > 0) {
    query += ` OFFSET ${offset}`;
  }
  if (limit !== undefined && limit > 0) {
    query += ` LIMIT ${limit}`;
  }

  return query.trim();
};

const mapCondition = (where: CleanedWhere) => {
  if (where.operator === 'contains') {
    return `CONTAINS(c.${where.field}, '${where.value}', true)`;
  }
  if (where.operator === 'starts_with') {
    return `STARTSWITH(c.${where.field}, '${where.value}', true)`;
  }
  if (where.operator === 'ends_with') {
    return `ENDSWITH(c.${where.field}, '${where.value}', true)`;
  }
  if (where.operator === 'in' && Array.isArray(where.value)) {
    return `c.${where.field} IN (${where.value.map(v => `'${v}'`).join(', ')})`;
  }
  if (where.operator === 'not_in' && Array.isArray(where.value)) {
    return `c.${where.field} NOT IN (${where.value.map(v => `'${v}'`).join(', ')})`;
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

  return `c.${where.field} ${mappedOperator} '${where.value}'`;
};
