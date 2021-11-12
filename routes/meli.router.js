const express = require('express');
const router = express.Router();
const service = require('../services/meli.service');
const db = require('../services/storage.service');

const PruebaVenta = db.models.PruebaVenta;

router.get('/listeners/auth',  (req, res, next) => {
    console.log(req.path);
    res.send('ok');
});

router.get('/listeners/notifications',  (req, res, next) => {
    console.log(req.path);
    PruebaVenta.create({});
    res.send('ok');
});

router.get('/sales', function(req, res, next) {
    console.log(req.path);
    service.findSales()
        .then(sales => res.send(sales))
        .catch(e => res.sendStatus(400));
});

router.get('/categories', async (req, res, next) => {
    try {
        const categories = await service.categories()
        res.send(categories);
    }catch(e) {
        res.sendStatus(400);
    }
});

router.get('/externals/:sellerId/:itemId', async (req, res, next) => {
    try {
        const item = await service.getExternalItemDetails(req.params.sellerId, req.params.itemId);
        res.send(item);
    }catch(e) {
        res.sendStatus(400);
    }
});

module.exports = router;
