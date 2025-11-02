const express = require('express');
const router = express.Router();
const { getQuotes, getAverage, getSlippage } = require('../controllers/quoteController');

router.get('/quotes', getQuotes);
router.get('/average', getAverage);
router.get('/slippage', getSlippage);

module.exports = router;