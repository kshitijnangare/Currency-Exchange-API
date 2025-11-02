const cron = require('node-cron');
const prisma = require('../db');
const { fetchQuotes } = require('../services/scraper');

/**
 * Updates quotes in the database by fetching fresh data from the external API
 * This function is called by the cron job every 60 seconds
 */
async function updateQuotesInDatabase() {
  console.log(`[${new Date().toISOString()}] Starting quote update job...`);
  
  try {
    // Fetch fresh quotes from the external API
    const quotes = await fetchQuotes();

    if (!quotes || quotes.length === 0) {
      console.warn('No quotes returned from scraper service');
      return;
    }

    // Use upsert to insert or update each quote
    // This ensures data freshness while avoiding duplicates
    const updatePromises = quotes.map(quote => {
      return prisma.quote.upsert({
        where: {
          source: quote.source
        },
        update: {
          buy_price: quote.buy_price,
          sell_price: quote.sell_price
        },
        create: {
          source: quote.source,
          buy_price: quote.buy_price,
          sell_price: quote.sell_price
        }
      });
    });

    // Execute all upserts in parallel for better performance
    const results = await Promise.all(updatePromises);
    
    console.log(`[${new Date().toISOString()}] Successfully updated ${results.length} quotes in database`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating quotes:`, error.message);
    // Don't throw - we want the cron job to continue running even if one update fails
  }
}

/**
 * Initializes the cron job that runs every 60 seconds
 * Also performs an immediate update on startup
 */
function initializeQuoteUpdateJob() {
  console.log('Initializing quote update job (runs every 60 seconds)...');
  
  // Run immediately on startup to populate the database
  updateQuotesInDatabase()
    .then(() => console.log('Initial quote update completed'))
    .catch(err => console.error('Initial quote update failed:', err.message));

  // Schedule the job to run every 60 seconds
  // Cron pattern: '*/60 * * * * *' means every 60 seconds
  const job = cron.schedule('*/60 * * * * *', () => {
    updateQuotesInDatabase();
  });

  console.log('Quote update job initialized successfully');
  
  return job;
}

module.exports = {
  initializeQuoteUpdateJob,
  updateQuotesInDatabase // Export for testing purposes
};