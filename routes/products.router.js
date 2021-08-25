const express = require('express');
const router = express.Router();
const meliService = require('../services/meli.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');
const { body, validationResult } = require('express-validator');

errorMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next();
};

router.get('', [keepPropertiesAfter('id,title,price,available_quantity,sold_quantity,start_time,thumbnail,status')],(req, res) => {
    meliService.getProducts()
        .then(products => res.send(products))
        .catch(e => res.status(400).send());
});

router.post('',
    body('code').not().isEmpty(),
    body('cost').not().isEmpty(),
    body('cost').isNumeric(),
    errorMiddleware,
    (req, res) => {
    console.log(`Nuevo producto => ${JSON.stringify(req.body)}`);
    res.sendStatus(201);
});

module.exports = router;
