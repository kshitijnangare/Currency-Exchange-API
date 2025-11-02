const express = require('express');
const router = express.Router();
const { getQuotes, getAverage, getSlippage } = require('../controllers/quoteController');

// GET /quotes - Returns all currency quotes
router.get('/quotes', getQuotes);

// GET /average - Returns average buy and sell prices
router.get('/average', getAverage);

// GET /slippage - Returns slippage percentages for each source
router.get('/slippage', getSlippage);

module.exports = router;