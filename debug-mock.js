// Debug script to understand the mock behavior
const mockDataStore = {};

const mockQuery = (querySpec, containerName) => {
  if (!mockDataStore[containerName]) {
    mockDataStore[containerName] = [];
  }

  // Add some test data
  mockDataStore[containerName] = [{ id: 'test-id', name: 'user', email: 'test@email.com' }];

  let filtered = [...mockDataStore[containerName]];

  // Handle both string queries and QuerySpec objects
  let sql = '';
  if (typeof querySpec === 'string') {
    sql = querySpec;
  } else if (querySpec && typeof querySpec.query === 'string') {
    sql = querySpec.query;
  }

  console.log('SQL:', sql);

  if (sql) {
    // Parse SELECT clause to determine which fields to return
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    let selectFields = null;
    if (selectMatch) {
      const selectStr = selectMatch[1].trim();
      console.log('Select string:', selectStr);
      if (selectStr !== '*') {
        selectFields = selectStr.split(',').map(f => f.trim().replace(/^c\./, ''));
        console.log('Select fields:', selectFields);
      }
    }

    // Parse WHERE clauses
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+OFFSET|\s+LIMIT|$)/i);
    if (whereMatch) {
      const conditions = whereMatch[1];
      console.log('Where conditions:', conditions);

      // Process simple equality: c.field = 'value'
      const eqMatches = Array.from(conditions.matchAll(/c\.(\w+)\s*=\s*'([^']+)'/g));
      for (const match of eqMatches) {
        const [, field, value] = match;
        console.log(`Filtering: ${field} = ${value}`);
        filtered = filtered.filter(item => String(item[field]) === String(value));
      }
    }

    // Apply SELECT field filtering
    console.log('Before filtering:', filtered);
    if (selectFields && selectFields.length > 0) {
      filtered = filtered.map(item => {
        const selected = {};
        // Always include id if it exists
        if (item.id !== undefined) {
          selected.id = item.id;
        }
        selectFields.forEach(field => {
          if (field in item) {
            selected[field] = item[field];
          }
        });
        // If no fields were selected (excluding id), return the original item
        return Object.keys(selected).length > (item.id !== undefined ? 1 : 0) ? selected : item;
      });
    }
    console.log('After filtering:', filtered);
  }

  return {
    fetchAll: Promise.resolve({
      resources: filtered,
    }),
  };
};

// Test different query types
console.log('=== Test 1: SELECT * ===');
mockQuery("SELECT * FROM c WHERE c.id = 'test-id'", 'users');

console.log('\n=== Test 2: SELECT specific fields ===');
mockQuery("SELECT c.name, c.email FROM c WHERE c.id = 'test-id'", 'users');

console.log('\n=== Test 3: No WHERE clause ===');
mockQuery('SELECT * FROM c', 'users');
