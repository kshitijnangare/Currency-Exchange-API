const { PrismaClient } = require('@prisma/client');

// Create a single instance of PrismaClient to be reused across the application
// This prevents creating multiple database connections
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Graceful shutdown handler
process.on('beforeExit', async () => {
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
});

module.exports = prisma;