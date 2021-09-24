const express = require('express');
const router = express.Router();
const service = require('../services/meli.service');

router.get('/listeners/auth', function(req, res, next) {
    console.log(req.path);
    res.send('ok');
});

router.get('/sales', function(req, res, next) {
    console.log(req.path);
    service.findSales()
        .then(sales => res.send(sales))
        .catch(e => res.sendStatus(400));
});

router.get('/categories', function(req, res, next) {
    service.categories()
        .then(categories => res.send(categories))
        .catch(e => res.sendStatus(400));
});

module.exports = router;
