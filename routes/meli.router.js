const express = require('express');
const router = express.Router();
const service = require('../services/meli.service');

router.get('/listeners/auth', function(req, res, next) {
    console.log(req.path);
    res.send('ok');
});

module.exports = router;
