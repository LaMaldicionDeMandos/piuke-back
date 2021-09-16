const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const expensesService = require('../services/expenses.service');

errorMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next();
};

router.get('', (req, res) => {
    expensesService.getExpenses()
        .then(expenses => res.send(expenses))
        .catch(e => res.sendStatus(400));
});

router.post('',
    body('value').not().isEmpty(),
    body('value').isNumeric(),
    errorMiddleware,
    (req, res) => {
    expensesService.newExpense(req.body)
        .then((ex) => res.status(201).send(ex))
        .catch(e => res.sendStatus(400));
});

module.exports = router;
