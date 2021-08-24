const express = require('express');
const router = express.Router();
const meliService = require('../services/meli.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');

router.get('', [keepPropertiesAfter('id,title,price,available_quantity,sold_quantity,start_time,thumbnail,status')],(req, res) => {
    meliService.getProducts()
        .then(products => res.send(products))
        .catch(e => res.status(400).send());
});

module.exports = router;
