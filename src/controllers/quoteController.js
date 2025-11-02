/*
Quote API Controller
This file contains the core business logic for the currency API endpoints.
- getQuotes: Fetches all formatted quotes from the database.
- getAverage: Fetches all quotes, calculates the average, and returns it.
- getSlippage: Fetches all quotes, calculates the average, and then calculates the slippage for each source against that average.
All functions read directly from the database, ensuring API responses are fast and don't wait for external fetches.
*/

const prisma = require('../db');

// GET /quotes
async function getQuotes(req, res) {
  try {
    const quotes = await prisma.quote.findMany({
      select: {
        buy_price: true,
        sell_price: true,
        source: true,
        updatedAt: true
      },
      orderBy: {
        source: 'asc'
      }
    });

    if (quotes.length === 0) {
      return res.status(200).json({
        message: 'No quotes available yet. Please wait for the background job to fetch data.',
        quotes: []
      });
    }

    res.status(200).json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({
      error: 'Failed to fetch quotes',
      message: error.message
    });
  }
}

// GET /average
async function getAverage(req, res) {
  try {
    const quotes = await prisma.quote.findMany({
      select: {
        buy_price: true,
        sell_price: true
      }
    });

    if (quotes.length === 0) {
      return res.status(200).json({
        message: 'No quotes available yet. Please wait for the background job to fetch data.',
        average_buy_price: 0,
        average_sell_price: 0,
        sourceCount: 0
      });
    }
    const totalBuyPrice = quotes.reduce((sum, quote) => sum + quote.buy_price, 0);
    const totalSellPrice = quotes.reduce((sum, quote) => sum + quote.sell_price, 0);

    const average_buy_price = totalBuyPrice / quotes.length;
    const average_sell_price = totalSellPrice / quotes.length;

    res.status(200).json({
      average_buy_price: parseFloat(average_buy_price.toFixed(2)),
      average_sell_price: parseFloat(average_sell_price.toFixed(2)),
      sourceCount: quotes.length
    });
  } catch (error) {
    console.error('Error calculating average:', error);
    res.status(500).json({
      error: 'Failed to calculate average',
      message: error.message
    });
  }
}

// GET /slippage
async function getSlippage(req, res) {
  try {
    const quotes = await prisma.quote.findMany({
      select: {
        buy_price: true,
        sell_price: true,
        source: true
      }
    });

    if (quotes.length === 0) {
      return res.status(200).json({
        message: 'No quotes available yet. Please wait for the background job to fetch data.',
        slippages: []
      });
    }

    const totalBuyPrice = quotes.reduce((sum, quote) => sum + quote.buy_price, 0);
    const totalSellPrice = quotes.reduce((sum, quote) => sum + quote.sell_price, 0);

    const average_buy_price = totalBuyPrice / quotes.length;
    const average_sell_price = totalSellPrice / quotes.length;

    const slippages = quotes.map(quote => {
      const buy_price_difference = quote.buy_price - average_buy_price;
      const sell_price_difference = quote.sell_price - average_sell_price;

      const buy_price_slippage = average_buy_price !== 0 
        ? (buy_price_difference / average_buy_price)
        : 0;

      const sell_price_slippage = average_sell_price !== 0
        ? (sell_price_difference / average_sell_price)
        : 0;

      return {
        source: quote.source,
        buy_price_slippage: parseFloat(buy_price_slippage.toFixed(4)),
        sell_price_slippage: parseFloat(sell_price_slippage.toFixed(4)),
        buy_price_difference: parseFloat(buy_price_difference.toFixed(2)),
        sell_price_difference: parseFloat(sell_price_difference.toFixed(2))
      };
    });

    res.status(200).json(slippages);
  } catch (error) {
    console.error('Error calculating slippage:', error);
    res.status(500).json({
      error: 'Failed to calculate slippage',
      message: error.message
    });
  }
}

module.exports = {
  getQuotes,
  getAverage,
  getSlippage
};