const express = require('express');
const router = express.Router();

router.post('/', function(req, res, next) {
    console.log(req.path);
    console.log('Params: ' + JSON.stringify(req.params));
    console.log('Body: ' + JSON.stringify(req.body));
    res.send('ok');
});

module.exports = router;
