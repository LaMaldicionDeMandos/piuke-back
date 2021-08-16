const express = require('express');
const router = express.Router();

const axios = require('axios').default;

/* GET users listing. */
router.get('/', function(req, res, next) {
  axios.get("https://google.com")
      .then((response) => {
        res.send(response.data);
      });
});

module.exports = router;
