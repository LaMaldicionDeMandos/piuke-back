const express = require('express');
const router = express.Router();
const service = require('../services/meli.service');

const ORDER_TOPIC = 'orders_v2';

router.get('/listeners/auth',  (req, res, next) => {
    console.log("GET");
    console.log(req.path);
    res.send('ok');
});

router.post('/listeners/auth',  (req, res, next) => {
    console.log("POST");
    console.log(req.path);
    res.send('ok');
});

router.post('/listeners/notifications',  (req, res, next) => {
    const noti = req.body;
    console.log(`New notification -> ${noti.topic}`);
    if (noti.topic === ORDER_TOPIC) {
        console.log('New Order');
    }
    res.send('ok');
});

router.get('/sales', function(req, res, next) {
    console.log(req.path);
    service.findSales()
        .then(sales => res.send(sales))
        .catch(e => res.sendStatus(400));
});

router.get('/shipping/:id', function(req, res, next) {
    service.getShipping(req.params.id)
        .then(shipping => res.send(shipping))
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
