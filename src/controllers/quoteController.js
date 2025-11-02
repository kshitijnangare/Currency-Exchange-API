const prisma = require('../db');

/**
 * GET /quotes
 * Returns all quotes from the database with their latest prices and update timestamps
 */
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

/**
 * GET /average
 * Returns the average buy and sell prices across all quotes
 */
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

    // Calculate averages
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

/**
 * GET /slippage
 * Returns the slippage percentage for each quote compared to the average
 * Slippage = (individual_price - average_price) / average_price
 */
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

    // Calculate averages
    const totalBuyPrice = quotes.reduce((sum, quote) => sum + quote.buy_price, 0);
    const totalSellPrice = quotes.reduce((sum, quote) => sum + quote.sell_price, 0);

    const average_buy_price = totalBuyPrice / quotes.length;
    const average_sell_price = totalSellPrice / quotes.length;

    // Calculate slippage for each quote
    const slippages = quotes.map(quote => {
      // Calculate raw differences
      const buy_price_difference = quote.buy_price - average_buy_price;
      const sell_price_difference = quote.sell_price - average_sell_price;

      // Calculate slippage percentages
      // Slippage = (individual - average) / average
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