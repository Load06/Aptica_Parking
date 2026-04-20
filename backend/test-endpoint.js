// Simulate the exact code path from reservations.ts line 12
const invalidDate = new Date('invalid-query-string');
const validDate = new Date('2024-04-20');

console.log('=== SIMULATING reservations.ts line 12 ===');
console.log('Query param date string: "invalid-query-string"');

// This is what the code does
const where = { date: invalidDate };
console.log('');
console.log('where object created:', where);
console.log('');

// Now let's see what happens when this is passed to Prisma
console.log('What Prisma needs to do:');
console.log('1. Serialize the date for SQL query');

try {
  console.log('   Calling toISOString():', invalidDate.toISOString());
} catch (e) {
  console.log('   ERROR: toISOString() throws:', e.message);
}

console.log('');
console.log('2. If toISOString() fails, what happens?');
console.log('   - Prisma query building would THROW an error');
console.log('   - This error is NOT caught in the route handler');
console.log('   - Server returns 500 Internal Server Error');
console.log('');

console.log('=== SIMULATING plazas.ts line 17 ===');
const date_query = 'bad-date';
const where_plazas = { date: new Date(date_query) };
console.log('where clause for liberations:', where_plazas);
try {
  new Date(date_query).toISOString();
} catch (e) {
  console.log('Will throw:', e.message);
}

console.log('');
console.log('=== SIMULATING reservations.ts line 26 (my/weekly) ===');
const ref = new Date('corrupt-date');
console.log('ref object:', ref);
console.log('');
console.log('Attempting to call getDay():', ref.getDay());
console.log('Result is NaN, which could cause logic errors');
console.log('');
console.log('Attempting date math with NaN:');
const day = ref.getDay() === 0 ? 7 : ref.getDay();
console.log('day variable:', day);
const someDate = new Date(ref);
console.log('Calling setDate(ref.getDate() - (day - 1)):');
console.log('  ref.getDate():', ref.getDate());
console.log('  day:', day);
try {
  someDate.setDate(ref.getDate() - (day - 1));
  console.log('  Result:', someDate);
} catch (e) {
  console.log('  ERROR:', e.message);
}
