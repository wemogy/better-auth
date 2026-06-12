import { CleanedWhere } from 'better-auth/adapters';
import { describe, it, expect } from 'vitest';
import { queryBuilder } from '../src/util/queryBuilder';

describe('QueryBuilder', () => {
  describe('basic query building', () => {
    it('should build simple SELECT * query', () => {
      const { query, parameters } = queryBuilder({});
      expect(query).toBe('SELECT * FROM c');
      expect(parameters).toEqual([]);
    });

    it('should build SELECT with specific columns', () => {
      const { query, parameters } = queryBuilder({ select: ['id', 'name', 'email'] });
      expect(query).toBe('SELECT c.id, c.name, c.email FROM c');
      expect(parameters).toEqual([]);
    });

    it('should build query with single WHERE condition', () => {
      const where: CleanedWhere[] = [{ field: 'id', value: '123', operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.id = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: '123' }]);
    });

    it('should build query with multiple WHERE conditions', () => {
      const where: CleanedWhere[] = [
        { field: 'id', value: '123', operator: 'eq', connector: 'AND' },
        { field: 'name', value: 'John', operator: 'eq', connector: 'AND' },
      ];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.id = @p0  AND c.name = @p1');
      expect(parameters).toEqual([
        { name: '@p0', value: '123' },
        { name: '@p1', value: 'John' },
      ]);
    });
  });

  describe('operator handling', () => {
    it('should handle equality operator', () => {
      const where: CleanedWhere[] = [{ field: 'status', value: 'active', operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.status = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 'active' }]);
    });

    it('should handle not equal operator', () => {
      const where: CleanedWhere[] = [{ field: 'status', value: 'deleted', operator: 'ne', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.status != @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 'deleted' }]);
    });

    it('should handle less than operator', () => {
      const where: CleanedWhere[] = [{ field: 'age', value: 25, operator: 'lt', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.age < @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 25 }]);
    });

    it('should handle less than or equal operator', () => {
      const where: CleanedWhere[] = [{ field: 'age', value: 30, operator: 'lte', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.age <= @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 30 }]);
    });

    it('should handle greater than operator', () => {
      const where: CleanedWhere[] = [{ field: 'score', value: 100, operator: 'gt', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.score > @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 100 }]);
    });

    it('should handle greater than or equal operator', () => {
      const where: CleanedWhere[] = [{ field: 'score', value: 50, operator: 'gte', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.score >= @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 50 }]);
    });

    it('should use default operator for unknown operators', () => {
      const where: CleanedWhere[] = [{ field: 'type', value: 'test', operator: 'unknown' as unknown as CleanedWhere['operator'], connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.type = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 'test' }]);
    });

    it('should preserve boolean values', () => {
      const where: CleanedWhere[] = [{ field: 'verified', value: true, operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.verified = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: true }]);
    });
  });

  describe('null handling', () => {
    it('should use IS_NULL for eq with null value', () => {
      const where: CleanedWhere[] = [{ field: 'image', value: null, operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE IS_NULL(c.image)');
      expect(parameters).toEqual([]);
    });

    it('should use NOT IS_NULL for ne with null value', () => {
      const where: CleanedWhere[] = [{ field: 'image', value: null, operator: 'ne', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE NOT IS_NULL(c.image)');
      expect(parameters).toEqual([]);
    });
  });

  describe('string operators', () => {
    it('should handle contains operator', () => {
      const where: CleanedWhere[] = [{ field: 'name', value: 'John', operator: 'contains', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE CONTAINS(c.name, @p0, true)');
      expect(parameters).toEqual([{ name: '@p0', value: 'John' }]);
    });

    it('should handle starts_with operator', () => {
      const where: CleanedWhere[] = [{ field: 'email', value: 'test@', operator: 'starts_with', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE STARTSWITH(c.email, @p0, true)');
      expect(parameters).toEqual([{ name: '@p0', value: 'test@' }]);
    });

    it('should handle ends_with operator', () => {
      const where: CleanedWhere[] = [{ field: 'domain', value: '.com', operator: 'ends_with', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE ENDSWITH(c.domain, @p0, true)');
      expect(parameters).toEqual([{ name: '@p0', value: '.com' }]);
    });
  });

  describe('IN operator', () => {
    it('should handle IN operator with string array', () => {
      const where: CleanedWhere[] = [{ field: 'status', value: ['active', 'pending'], operator: 'in', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE ARRAY_CONTAINS(@p0, c.status)');
      expect(parameters).toEqual([{ name: '@p0', value: ['active', 'pending'] }]);
    });

    it('should handle IN operator with number array', () => {
      const where: CleanedWhere[] = [{ field: 'roleId', value: [1, 2, 3], operator: 'in', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE ARRAY_CONTAINS(@p0, c.roleId)');
      expect(parameters).toEqual([{ name: '@p0', value: [1, 2, 3] }]);
    });

    it('should handle IN operator with single item', () => {
      const where: CleanedWhere[] = [{ field: 'category', value: ['admin'], operator: 'in', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE ARRAY_CONTAINS(@p0, c.category)');
      expect(parameters).toEqual([{ name: '@p0', value: ['admin'] }]);
    });

    it('should handle empty array for IN operator', () => {
      const where: CleanedWhere[] = [{ field: 'tags', value: [], operator: 'in', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE ARRAY_CONTAINS(@p0, c.tags)');
      expect(parameters).toEqual([{ name: '@p0', value: [] }]);
    });

    it('should handle NOT IN operator', () => {
      const where: CleanedWhere[] = [{ field: 'status', value: ['banned', 'deleted'], operator: 'not_in', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE NOT ARRAY_CONTAINS(@p0, c.status)');
      expect(parameters).toEqual([{ name: '@p0', value: ['banned', 'deleted'] }]);
    });
  });

  describe('sorting', () => {
    it('should add ORDER BY with ASC direction', () => {
      const sortBy = { field: 'createdAt', direction: 'asc' as const };
      const { query } = queryBuilder({ sortBy });
      expect(query).toBe('SELECT * FROM c ORDER BY c.createdAt asc');
    });

    it('should add ORDER BY with DESC direction', () => {
      const sortBy = { field: 'name', direction: 'desc' as const };
      const { query } = queryBuilder({ sortBy });
      expect(query).toBe('SELECT * FROM c ORDER BY c.name desc');
    });

    it('should combine WHERE and ORDER BY', () => {
      const where: CleanedWhere[] = [{ field: 'status', value: 'active', operator: 'eq', connector: 'AND' }];
      const sortBy = { field: 'name', direction: 'asc' as const };
      const { query, parameters } = queryBuilder({ where, sortBy });
      expect(query).toBe('SELECT * FROM c WHERE c.status = @p0 ORDER BY c.name asc');
      expect(parameters).toEqual([{ name: '@p0', value: 'active' }]);
    });
  });

  describe('pagination', () => {
    it('should add LIMIT', () => {
      const { query } = queryBuilder({ limit: 10 });
      expect(query).toBe('SELECT * FROM c OFFSET 0 LIMIT 10');
    });

    it('should add OFFSET and LIMIT', () => {
      const { query } = queryBuilder({ offset: 20, limit: 10 });
      expect(query).toBe('SELECT * FROM c OFFSET 20 LIMIT 10');
    });

    it('should add only OFFSET (without LIMIT)', () => {
      const { query } = queryBuilder({ offset: 50 });
      expect(query).toBe('SELECT * FROM c OFFSET 50 LIMIT 0');
    });

    it('should combine WHERE, ORDER BY, and pagination', () => {
      const where: CleanedWhere[] = [{ field: 'status', value: 'active', operator: 'eq', connector: 'AND' }];
      const sortBy = { field: 'name', direction: 'asc' as const };
      const { query, parameters } = queryBuilder({ where, sortBy, offset: 10, limit: 5 });
      expect(query).toBe('SELECT * FROM c WHERE c.status = @p0 ORDER BY c.name asc OFFSET 10 LIMIT 5');
      expect(parameters).toEqual([{ name: '@p0', value: 'active' }]);
    });
  });

  describe('complex queries', () => {
    it('should build complex query with all components', () => {
      const where: CleanedWhere[] = [
        { field: 'status', value: 'active', operator: 'eq', connector: 'AND' },
        { field: 'age', value: 18, operator: 'gte', connector: 'AND' },
        { field: 'category', value: ['user', 'admin'], operator: 'in', connector: 'OR' },
      ];
      const select = ['id', 'name', 'email', 'status'];
      const sortBy = { field: 'name', direction: 'asc' as const };
      const offset = 0;
      const limit = 25;

      const { query, parameters } = queryBuilder({ select, where, sortBy, offset, limit });

      expect(query).toBe(
        'SELECT c.id, c.name, c.email, c.status FROM c WHERE c.status = @p0  AND c.age >= @p1  OR ARRAY_CONTAINS(@p2, c.category) ORDER BY c.name asc OFFSET 0 LIMIT 25',
      );
      expect(parameters).toEqual([
        { name: '@p0', value: 'active' },
        { name: '@p1', value: 18 },
        { name: '@p2', value: ['user', 'admin'] },
      ]);
    });

    it('should handle query with only pagination', () => {
      const { query } = queryBuilder({ offset: 100, limit: 50 });
      expect(query).toBe('SELECT * FROM c OFFSET 100 LIMIT 50');
    });

    it('should handle query with specific columns and WHERE', () => {
      const select = ['id', 'name'];
      const where: CleanedWhere[] = [{ field: 'verified', value: true, operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ select, where });
      expect(query).toBe('SELECT c.id, c.name FROM c WHERE c.verified = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: true }]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty where array', () => {
      const where: CleanedWhere[] = [];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c');
      expect(parameters).toEqual([]);
    });

    it('should handle undefined where', () => {
      const { query, parameters } = queryBuilder({ where: undefined });
      expect(query).toBe('SELECT * FROM c');
      expect(parameters).toEqual([]);
    });

    it('should handle empty select array', () => {
      const select: string[] = [];
      const { query } = queryBuilder({ select });
      expect(query).toBe('SELECT  FROM c');
    });

    it('should handle select with single asterisk', () => {
      const select = ['*'];
      const { query } = queryBuilder({ select });
      expect(query).toBe('SELECT * FROM c');
    });

    it('should handle zero offset and zero limit', () => {
      const { query } = queryBuilder({ offset: 0, limit: 0 });
      expect(query).toBe('SELECT * FROM c OFFSET 0 LIMIT 0');
    });

    it('should trim whitespace from final query', () => {
      const where: CleanedWhere[] = [{ field: 'name', value: 'test', operator: 'eq', connector: 'AND' }];
      const { query } = queryBuilder({ where });
      expect(query.trim()).toBe(query);
    });
  });

  describe('SQL injection prevention', () => {
    it('should pass quotes through as parameter values, not query text', () => {
      const where: CleanedWhere[] = [{ field: 'name', value: "O'Reilly", operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.name = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: "O'Reilly" }]);
    });

    it('should pass special characters through as parameter values', () => {
      const where: CleanedWhere[] = [{ field: 'description', value: 'Test; DROP TABLE users; --', operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.description = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: 'Test; DROP TABLE users; --' }]);
    });

    it('should not allow filter bypass via crafted values', () => {
      const where: CleanedWhere[] = [{ field: 'email', value: "x' OR c.id != '", operator: 'eq', connector: 'AND' }];
      const { query, parameters } = queryBuilder({ where });
      expect(query).toBe('SELECT * FROM c WHERE c.email = @p0');
      expect(parameters).toEqual([{ name: '@p0', value: "x' OR c.id != '" }]);
    });
  });
});
