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

router.get('', [keepPropertiesAfter('id,meli_items(title,price,available_quantity,sold_quantity,start_time,thumbnail,status,listing_type_id),code,cost')],(req, res) => {
    productsService.getAllProducts()
        .then(products => {
            console.log("Products: " + JSON.stringify(products));
            res.send(products)
        })
        .catch(e => res.status(400).send());
});

router.get('/full', (req, res) => {
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

router.post('/:code/meli_ids',
    body('meli_ids').not().isEmpty(),
    errorMiddleware,
    (req, res) => {
        console.log(`Nuevos Ids para el producto => ${req.params.code} ids: ${JSON.stringify(req.body)}`);
        res.status(201).send({ok: 'ok'});
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
});

module.exports = router;
