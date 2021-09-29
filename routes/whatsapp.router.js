const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    console.log(req.path);
    console.log('Params: ' + JSON.stringify(req.params));
    console.log('Body: ' + JSON.stringify(req.body));
    res.send('ok');
});

router.get('/sales', function(req, res, next) {
    console.log(req.path);
    service.findSales()
        .then(sales => res.send(sales))
        .catch(e => res.sendStatus(400));
});

router.get('/categories', function(req, res, next) {
    service.categories()
        .then(categories => res.send(categories))
        .catch(e => res.sendStatus(400));
});

module.exports = router;
