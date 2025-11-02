/*
Main application entry point.
This file is responsible for:
1. Initializing the Express server.
2. Connecting to the PostgreSQL database via Prisma.
3. Setting up all application-level middleware (like JSON parsing).
4. Mounting the API routes.
5. Starting the background job scheduler.
6. Starting the server and listening for requests.
Also includes graceful shutdown logic.
@author Kshitij
@project Currency Exchange API
 */

const express = require('express');
const prisma = require('./db');
const quoteRoutes = require('./routes/quoteRoutes');
const { initializeQuoteUpdateJob } = require('./jobs/updateQuotes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.status(200).send(`
    <pre>
      Welcome to the Currency Exchange API!

      Go to /quotes to view all quotes:
      <a href="/quotes">/quotes</a>

      Go to /average to view average prices:
      <a href="/average">/average</a>

      Go to /slippage to view slippage data:
      <a href="/slippage">/slippage</a>
    </pre>
  `);
});

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/', quoteRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: ['/quotes', '/average', '/slippage']
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    initializeQuoteUpdateJob();
    console.log('Background job initialized');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints available at:`);
      console.log(`http://localhost:${PORT}/quotes`);
      console.log(`http://localhost:${PORT}/average`);
      console.log(`http://localhost:${PORT}/slippage`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();