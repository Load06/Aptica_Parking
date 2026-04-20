// Test what Prisma does with Invalid Date objects
const invalidDate = new Date('invalid-input');
const validDate = new Date('2024-04-20');

console.log('Invalid Date object:', invalidDate);
console.log('Invalid Date toString:', invalidDate.toString());
console.log('Invalid Date getTime:', invalidDate.getTime());
console.log('Invalid Date === Invalid Date:', new Date('invalid') === new Date('invalid'));
console.log('');
console.log('Valid Date object:', validDate);
console.log('Valid Date toString:', validDate.toString());
console.log('Valid Date getTime:', validDate.getTime());

// Test what happens when comparing
console.log('');
console.log('Testing comparisons with Invalid Date:');
console.log('invalidDate < new Date():', invalidDate < new Date());
console.log('invalidDate > new Date():', invalidDate > new Date());
console.log('invalidDate <= new Date():', invalidDate <= new Date());
console.log('invalidDate >= new Date():', invalidDate >= new Date());
console.log('invalidDate === invalidDate:', invalidDate === invalidDate);

// Test how Prisma would serialize it
console.log('');
console.log('JSON.stringify(invalidDate):', JSON.stringify({d: invalidDate}));
