// import controller
const { webhook: webhookController } = require('../controllers');

const express = require('express');
const router = express.Router();

router.post('/minswap', webhookController.minswapHappen);

module.exports = router;
