const express = require('express');
const router = express.Router();
const service = require('../services/meli.service');

router.get('', (req, res, next) => {
    res.send('En construcción');
});

module.exports = router;
