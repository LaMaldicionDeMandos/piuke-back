const express = require('express');
const salesService = require('../services/sales.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const router = express.Router();

const KEEP_PROPERTIES = [keepPropertiesAfter('payments(total_paid_amount,transaction_amount,date_approved,shipping_cost),order_items(item(title,code,cost,meli_item(id,thumbnail)),quantity,sale_fee,unit_price,listing_type_id,full_unit_price),buyer,total_amount,paid_amount')];

router.get('/', KEEP_PROPERTIES, (req, res) => {
    salesService.getSales()
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
    });

router.get('/summary', (req, res) => {
    salesService.getSummary()
        .then(summary => res.send({summary: summary}));
});

router.get('/:year', KEEP_PROPERTIES, (req, res) => {
    salesService.getSales(req.params.year)
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
});

router.get('/:year/summary', (req, res) => {
    salesService.getSummary(req.params.year)
        .then(summary => res.send({summary: summary}));
});

router.get('/:year/:month', KEEP_PROPERTIES, (req, res) => {
    salesService.getSales(req.params.year, req.params.month)
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
});

router.get('/:year/:month/summary', (req, res) => {
    salesService.getSummary(req.params.year, req.params.month)
        .then(summary => res.send({summary: summary}));
});

module.exports = router;
