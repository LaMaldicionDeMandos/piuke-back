const express = require('express');
const router = express.Router();
const productsService = require('../services/products.service');
const meliService = require('../services/meli.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const { body, validationResult } = require('express-validator');
const _ = require('lodash');

errorMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next();
};

router.get('/sync/:code', [keepPropertiesAfter('_id,meli_items(id,title,price,available_quantity,sold_quantity,start_time,thumbnail,status,listing_type_id,health,questions,visits),code,cost')],(req, res) => {
    console.log("Sync with meli");
    productsService.syncWithMeli(req.params.code)
        .then(product => {
            console.log("Product: " + JSON.stringify(product));
            res.send(product);
        })
        .catch(e => res.status(404).send());
});

router.get('', [keepPropertiesAfter('_id,meli_items(id,title,price,available_quantity,sold_quantity,start_time,thumbnail,status,listing_type_id,health,questions,visits),code,cost')],(req, res) => {
    productsService.getAllProducts()
        .then(products => {
            console.log("Products: " + JSON.stringify(products));
            res.send(products)
        })
        .catch(e => res.status(400).send());
});

router.get('/competitions', [keepPropertiesAfter('_id,meli_items(title,price,thumbnail),code,cost,product_comparations')],(req, res) => {
    productsService.getAllProductCompetitions()
        .then(products => {
            console.log("Products: " + JSON.stringify(products));
            res.send(products);
        })
        .catch(e => res.status(400).send());
});

router.post('/:code/competitions/sync',(req, res) => {
    productsService.syncCompetition(req.params.code)
        .then(competition => {
            res.send(competition);
        })
        .catch(e => res.status(400).send(e));
});

router.post('/:code/competitions', (req, res) => {
    productsService.addCompetition(req.params.code, req.body)
        .then(competition => {
            res.send(competition);
        })
        .catch(e => res.status(400).send(e));
});

router.get('/full', (req, res) => {
    productsService.getAllProducts()
        .then(products => {
            console.log("Products: " + JSON.stringify(products));
            res.send(products)
        })
        .catch(e => res.status(400).send(e));
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
    [keepPropertiesAfter('_id,meli_items(id,title,price,available_quantity,sold_quantity,start_time,thumbnail,status,listing_type_id),code,cost')],
    (req, res) => {
    console.log(`Nuevo producto => ${JSON.stringify(req.body)}`);
    productsService.newProduct(req.body)
        .then(product => res.status(201).send(product));
});

router.delete('/:id', (req, res) => {
        console.log(`Borrar producto => ${req.params.id}`);
        productsService.remove(req.params.id)
            .then(count => count === 0 ? res.sendStatus(404) : res.send({ok: 'ok'}));
    });

module.exports = router;
