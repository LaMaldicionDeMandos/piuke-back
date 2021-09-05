const express = require('express');
const salesService = require('../services/sales.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const router = express.Router();

router.get('/', [keepPropertiesAfter('product_code,meli_id,payments(transaction_amount,date_approved,shipping_cost),date_closed,order_items(item(id),quantity,sale_fee,unit_price,listing_type_id)')], (req, res) => {
    salesService.getSales()
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
    });

module.exports = router;
