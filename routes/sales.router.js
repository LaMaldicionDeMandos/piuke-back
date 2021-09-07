const express = require('express');
const salesService = require('../services/sales.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const router = express.Router();

router.get('/', [keepPropertiesAfter('payments(total_paid_amount,transaction_amount,date_approved,shipping_cost),order_items(item(title,code,cost,meli_item(id,thumbnail)),quantity,sale_fee,unit_price,listing_type_id,full_unit_price),buyer,total_amount,paid_amount')], (req, res) => {
    salesService.getSales()
        .then(sales => {
            console.log("Sales: " + JSON.stringify(sales));
            res.send(sales);
        })
        .catch(e => res.status(400).send());
    });

module.exports = router;
