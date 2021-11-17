const express = require('express');
const salesService = require('../services/sales.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const router = express.Router();

const KEEP_PROPERTIES = [keepPropertiesAfter('payments(total_paid_amount,transaction_amount,date_approved,shipping_cost),order_items(item(title,code,cost,meli_item(id,thumbnail)),quantity,sale_fee,unit_price,listing_type_id,full_unit_price),buyer,total_amount,paid_amount')];

router.get('/', (req, res) => {
    salesService.getSalesV2()
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
    });

router.post('/', (req, res) => {
    salesService.newSale(req.body)
        .then(sale => {
            console.log("new Sale: " + JSON.stringify(sale));
            res.send(sale);
        })
        .catch(e => res.status(400).send());
});

router.get('/summary', async (req, res) => {
    const symmary = await salesService.getSummary();
    res.send({summary: summary});
});

router.get('/performance', async (req, res) => {
    const performances = await salesService.getPerformances();
    res.send(performances);
});

router.get('/:year', (req, res) => {
    salesService.getSalesV2(req.params.year)
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
});

router.get('/:year/summary', async (req, res) => {
    const summary = await salesService.getSummary(req.params.year);
    res.send({summary: summary});
});

router.get('/:year/performance', async (req, res) => {
    const performances = await salesService.getPerformances(req.params.year);
    res.send(performances);
});

router.get('/:year/:month', (req, res) => {
    salesService.getSalesV2(req.params.year, req.params.month)
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => {
            console.error(`Error => ${JSON.stringify(e.stack)}`);
            res.status(400).send(e.stack)
        });
});

router.get('/:year/:month/summary', async (req, res) => {
    const summary = await salesService.getSummary(req.params.year, req.params.month);
    res.send({summary: summary});
});

router.get('/:year/:month/performance', (req, res) => {
    salesService.getPerformances(req.params.year, req.params.month)
        .then(performances => res.send(performances))
        .catch(e => res.sendStatus(500));
});

module.exports = router;
