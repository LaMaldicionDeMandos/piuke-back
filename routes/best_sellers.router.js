const express = require('express');
const bestSellersService = require('../services/best.sellers.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const router = express.Router();

router.get('/', [keepPropertiesAfter('id,title,seller_id,category_id,sold_quantity,price,start_time,permalink,thumbnail,position')], (req, res) => {
    bestSellersService.bestSellers()
        .then(bestSellers => {
            console.log("Best Sellers: " + JSON.stringify(bestSellers));
            res.send(bestSellers);
        })
        .catch(e => res.status(400).send());
    });

router.get('/:category', [keepPropertiesAfter('id,title,seller_id,category_id,sold_quantity,price,start_time,permalink,thumbnail,position')], (req, res) => {
    bestSellersService.bestSellers(req.params.category)
        .then(bestSellers => {
            console.log("Best Sellers: " + JSON.stringify(bestSellers));
            res.send(bestSellers);
        })
        .catch(e => res.status(400).send());
});

module.exports = router;
