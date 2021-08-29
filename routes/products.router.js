const express = require('express');
const router = express.Router();
const productsService = require('../services/products.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const { body, validationResult } = require('express-validator');

errorMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next();
};

router.get('', [keepPropertiesAfter('id,meli_items(title,price,available_quantity,sold_quantity,start_time,thumbnail,status),code,cost')],(req, res) => {
    productsService.getAllProducts()
        .then(products => {
            console.log("Products: " + JSON.stringify(products));
            res.send(products)
        })
        .catch(e => res.status(400).send());
});

router.patch('/:code',(req, res) => {
    productsService.update(req.params.code, req.body)
        .then((p) => res.send(p))
        .catch(e => res.status(400).send());
});

router.post('',
    body('code').not().isEmpty(),
    body('cost').not().isEmpty(),
    body('cost').isNumeric(),
    errorMiddleware,
    (req, res) => {
    console.log(`Nuevo producto => ${JSON.stringify(req.body)}`);
    productsService.newProduct(req.body)
        .then(product => res.status(201).send(product));
    res.sendStatus(201);
});

module.exports = router;
