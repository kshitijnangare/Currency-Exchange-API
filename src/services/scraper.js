const axios = require('axios');

// Mapping between dolarapi.com "casa" types and our target sources
const SOURCE_MAPPING = {
  'oficial': 'https://www.ambito.com/contenidos/dolar.html',
  'blue': 'https://www.dolarhoy.com',
  'bolsa': 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB'
};

// Alternative mapping if the above doesn't match
const ALTERNATIVE_CASA_NAMES = {
  'ambito': 'https://www.ambito.com/contenidos/dolar.html',
  'dolarhoy': 'https://www.dolarhoy.com',
  'cronista': 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB',
  'ccl': 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB'
};

/**
 * Fetches currency quotes from the dolarapi.com public API
 * @returns {Promise<Array>} Array of quote objects with source, buy_price, and sell_price
 */
async function fetchQuotes() {
  try {
    const response = await axios.get('https://dolarapi.com/v1/dolares', {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from dolarapi.com');
    }

    const quotes = [];
    const usedSources = new Set();

    // Process each quote from the API
    for (const item of response.data) {
      let sourceUrl = null;

      // Try to map using the casa field
      if (item.casa) {
        const casaLower = item.casa.toLowerCase();
        
        // Try primary mapping
        if (SOURCE_MAPPING[casaLower]) {
          sourceUrl = SOURCE_MAPPING[casaLower];
        }
        // Try alternative mapping
        else if (ALTERNATIVE_CASA_NAMES[casaLower]) {
          sourceUrl = ALTERNATIVE_CASA_NAMES[casaLower];
        }
      }

      // If we found a valid source and haven't used it yet
      if (sourceUrl && !usedSources.has(sourceUrl)) {
        // Validate that we have valid prices
        const buyPrice = parseFloat(item.compra);
        const sellPrice = parseFloat(item.venta);

        if (!isNaN(buyPrice) && !isNaN(sellPrice) && buyPrice > 0 && sellPrice > 0) {
          quotes.push({
            source: sourceUrl,
            buy_price: buyPrice,
            sell_price: sellPrice
          });
          usedSources.add(sourceUrl);
        }
      }

      // Stop if we've collected all 3 sources
      if (quotes.length === 3) {
        break;
      }
    }

    // Log warning if we couldn't find all 3 sources
    if (quotes.length < 3) {
      console.warn(`Warning: Only found ${quotes.length} out of 3 expected sources`);
    }

    console.log(`Successfully fetched ${quotes.length} quotes from dolarapi.com`);
    return quotes;

  } catch (error) {
    console.error('Error fetching quotes from dolarapi.com:', error.message);
    
    // If it's a network error, log more details
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - dolarapi.com took too long to respond');
    } else if (error.response) {
      console.error(`API returned status ${error.response.status}`);
    }
    
    throw error;
  }
}

module.exports = {
  fetchQuotes
};