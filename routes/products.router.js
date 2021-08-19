const express = require('express');
const router = express.Router();
const meliService = require('../services/meli.service');

router.get('', (req, res, next) => {
    meliService.getProducts()
        .then(products => res.send(products))
        .catch(e => res.status(400).send());
});

module.exports = router;
