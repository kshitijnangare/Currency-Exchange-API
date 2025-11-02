/*
Background Cron Job for Quote Updates
This file handles the 60s freshness requirement.
It sets up a 'node-cron' scheduler that runs the fetchAndSaveQuotes function every 60 seconds. This keeps our database populated with recent data, allowing the API endpoints to be fast and responsive.
*/

const cron = require('node-cron');
const prisma = require('../db');
const { fetchQuotes } = require('../services/scraper');

async function updateQuotesInDatabase() {
  console.log(`[${new Date().toISOString()}] Starting quote update job...`);
  try {
    const quotes = await fetchQuotes();
    if (!quotes || quotes.length === 0) {
      console.warn('No quotes returned from scraper service');
      return;
    }
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
    const results = await Promise.all(updatePromises);
    console.log(`[${new Date().toISOString()}] Successfully updated ${results.length} quotes in database`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating quotes:`, error.message);
  }
}
function initializeQuoteUpdateJob() {
  console.log('Initializing quote update job (runs every 60 seconds)...');

  updateQuotesInDatabase()
    .then(() => console.log('Initial quote update completed'))
    .catch(err => console.error('Initial quote update failed:', err.message));
  const job = cron.schedule('*/60 * * * * *', () => {
    updateQuotesInDatabase();
  });
  console.log('Quote update job initialized successfully');  
  return job;
}

module.exports = {
  initializeQuoteUpdateJob,
  updateQuotesInDatabase 
};