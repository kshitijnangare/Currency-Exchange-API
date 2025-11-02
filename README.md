# Currency Exchange API - USD to ARS

A real-time currency exchange API that provides USD to ARS (Argentinian Peso) quotes from multiple sources with automatic updates every 60 seconds.

## Live Link (Render)
### https://currency-exchange-api-gx85.onrender.com

## Features

- 🔄 **Real-time data**: Automatically updates every 60 seconds
- 📊 **Multiple sources**: Aggregates data from 3 different sources
- 📈 **Statistical analysis**: Calculate averages and slippage
- 🚀 **Fast API**: Data served from PostgreSQL cache
- ☁️ **Cloud-ready**: Designed for Render deployment

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Scheduler**: node-cron
- **HTTP Client**: axios

## API Endpoints

### GET `/quotes`
Returns all available currency quotes with their latest prices.

**Response:**
```json
[
  {
    "buy_price": 1015.50,
    "sell_price": 1035.50,
    "source": "https://www.ambito.com/contenidos/dolar.html",
    "updatedAt": "2025-11-02T10:30:00.000Z"
  },
  {
    "buy_price": 1020.00,
    "sell_price": 1040.00,
    "source": "https://www.dolarhoy.com",
    "updatedAt": "2025-11-02T10:30:00.000Z"
  },
  {
    "buy_price": 1018.75,
    "sell_price": 1038.75,
    "source": "https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB",
    "updatedAt": "2025-11-02T10:30:00.000Z"
  }
]
```

### GET `/average`
Returns the average buy and sell prices across all sources.

**Response:**
```json
{
  "average_buy_price": 1018.08,
  "average_sell_price": 1038.08,
  "sourceCount": 3
}
```

### GET `/slippage`
Returns the slippage percentage for each source compared to the average.

**Response:**
```json
[
  {
    "source": "https://www.ambito.com/contenidos/dolar.html",
    "buy_price_slippage": -0.0025,
    "sell_price_slippage": -0.0025,
    "buy_price_difference": -2.58,
    "sell_price_difference": -2.58
  },
  {
    "source": "https://www.dolarhoy.com",
    "buy_price_slippage": 0.0019,
    "sell_price_slippage": 0.0018,
    "buy_price_difference": 1.92,
    "sell_price_difference": 1.92
  },
  {
    "source": "https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB",
    "buy_price_slippage": 0.0007,
    "sell_price_slippage": 0.0006,
    "buy_price_difference": 0.67,
    "sell_price_difference": 0.67
  }
]
```

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────┐
│  Background Job (every 60 seconds)              │
│  1. Fetch from dolarapi.com                     │
│  2. Map sources to target URLs                  │
│  3. Upsert to PostgreSQL                        │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  PostgreSQL Database (Fresh cached data)        │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Express API Endpoints                          │
│  - Fast reads from database                     │
│  - No external API calls                        │
│  - Calculate averages & slippage on-the-fly    │
└─────────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Separation of Concerns**: Background job handles data fetching, API handles serving
2. **Performance**: API endpoints are fast (read from database only)
3. **Reliability**: API works even if external source is temporarily down
4. **Freshness**: Data is never older than 60 seconds
5. **Scalability**: Database can handle multiple concurrent reads

## Local Development

### Prerequisites

- Node.js v16 or higher
- PostgreSQL (local or cloud)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kshitijnangare/Currency-Exchange-API
cd Currency-Exchange-API
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Push database schema:
```bash
npx prisma db push
```

6. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Project Structure

```
currency-exchange-api/
├── src/
│   ├── index.js              # Express app & server setup
│   ├── db.js                 # Prisma client instance
│   ├── services/
│   │   └── scraper.js        # Data fetching logic
│   ├── jobs/
│   │   └── updateQuotes.js   # Cron job for updates
│   ├── controllers/
│   │   └── quoteController.js # Endpoint logic
│   └── routes/
│       └── quoteRoutes.js     # Route definitions
├── prisma/
│   └── schema.prisma         # Database schema
├── package.json
├── .env
├── .gitignore
└── README.md
```

## Data Sources

This API aggregates data from:
- Ámbito: https://www.ambito.com/contenidos/dolar.html
- Dolar Hoy: https://www.dolarhoy.com
- Cronista: https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB

Data is fetched via the dolarapi.com aggregator API.

## Testing

Test your endpoints using cURL:

```bash
# Get all quotes
curl https://currency-exchange-api-gx85.onrender.com/quotes

# Get averages
curl https://currency-exchange-api-gx85.onrender.com/average

# Get slippage
curl https://currency-exchange-api-gx85.onrender.com/slippage

# Health check
curl https://currency-exchange-api-gx85.onrender.com/health
```

## Troubleshooting

### "No quotes available yet"
Wait 60 seconds for the first background job to run.

### Database connection errors
Verify your `DATABASE_URL` is correct and the database is running.

### Build failures
Check that all files are committed and `package.json` is valid.

## Performance

- **Cold start**: ~50 seconds (Render free tier)
- **Warm requests**: < 100ms
- **Data update frequency**: Every 60 seconds
- **Database queries**: Optimized with Prisma

## Limitations (Free Tier)

- **Render**: Service suspends after 15 min inactivity
- **PostgreSQL**: 1GB storage, 90 days free trial
- **Rate limiting**: Subject to Render's limits
