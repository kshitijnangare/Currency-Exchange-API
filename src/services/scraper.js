/*
External API Service (Data Fetcher)
This file is responsible for all external API communication.
Its main job is to fetch data from the dolarapi.com service, map the results to our database schema (including the specific source URLs from the assignment), and update our database using Prisma's upsert command.
*/

const axios = require('axios');

const SOURCE_MAPPING = {
  'oficial': 'https://www.ambito.com/contenidos/dolar.html',
  'blue': 'https://www.dolarhoy.com',
  'bolsa': 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB'
};

const ALTERNATIVE_CASA_NAMES = {
  'ambito': 'https://www.ambito.com/contenidos/dolar.html',
  'dolarhoy': 'https://www.dolarhoy.com',
  'cronista': 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB',
  'ccl': 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB'
};

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
    for (const item of response.data) {
      let sourceUrl = null;
      if (item.casa) {
        const casaLower = item.casa.toLowerCase();
        if (SOURCE_MAPPING[casaLower]) {
          sourceUrl = SOURCE_MAPPING[casaLower];
        }
        else if (ALTERNATIVE_CASA_NAMES[casaLower]) {
          sourceUrl = ALTERNATIVE_CASA_NAMES[casaLower];
        }
      }

      if (sourceUrl && !usedSources.has(sourceUrl)) {
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
      if (quotes.length === 3) {
        break;
      }
    }
    if (quotes.length < 3) {
      console.warn(`Warning: Only found ${quotes.length} out of 3 expected sources`);
    }
    console.log(`Successfully fetched ${quotes.length} quotes from dolarapi.com`);
    return quotes;
  } catch (error) {
    console.error('Error fetching quotes from dolarapi.com:', error.message);
    
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