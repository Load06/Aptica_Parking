// Simulating what Prisma does internally
const invalidDate = new Date('invalid-input');
const validDate = new Date('2024-04-20');

// Prisma typically converts Date to ISO string for queries
console.log('Invalid Date toISOString():', invalidDate.toISOString());
console.log('Valid Date toISOString():', validDate.toISOString());

// Test the behavior in a where clause scenario
console.log('');
console.log('Testing where clause behavior:');
const whereClause = { date: invalidDate };
console.log('where clause:', whereClause);
console.log('JSON.stringify(where):', JSON.stringify(whereClause));
