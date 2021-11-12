const express = require('express');
const router = express.Router();
const ordersService = require('../services/orders.service');

errorMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next();
};

router.get('', (req, res) => {
    ordersService.getOrders()
        .then(orders => {
            res.send(orders);
        })
        .catch(e => res.status(400).send());
});

router.post('', (req, res) => {
    ordersService.newOrder(req.body)
        .then(order => {
            res.send(order);
        })
        .catch(e => res.status(400).send());
});

router.delete('/all', (req, res) => {
    ordersService.clear()
        .then(() => {
            res.send({ok: 'ok'});
        })
        .catch(e => res.status(400).send());
});

router.delete('/:id', (req, res) => {
    ordersService.deleteOrder(req.params.id)
        .then(() => {
            res.send({ok: 'ok'});
        })
        .catch(e => res.status(400).send());
});

module.exports = router;
