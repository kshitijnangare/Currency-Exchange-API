/*
Prisma Database Client
This file initializes a single, shared instance of the PrismaClient.
By exporting this singleton, we ensure that the entire application shares the same database connection pool, which is the recommended best practice for performance and connection management.
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

process.on('beforeExit', async () => {
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
});

module.exports = prisma;