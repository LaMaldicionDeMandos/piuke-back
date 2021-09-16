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

router.get('/:year', (req, res) => {
    expensesService.getExpenses(req.params.year)
        .then(expenses => res.send(expenses))
        .catch(e => res.sendStatus(400));
});

router.get('/:year/:month', (req, res) => {
    expensesService.getExpenses(req.params.year, req.params.month)
        .then(expenses => res.send(expenses))
        .catch(e => res.sendStatus(400));
});

router.get('/:year/summary', (req, res) => {
    expensesService.getExpensesSummary(req.params.year)
        .then(expenses => res.send({summary: expenses}))
        .catch(e => res.sendStatus(400));
});

router.get('/:year/:month/summary', (req, res) => {
    expensesService.getExpensesSummary(req.params.year, req.params.month)
        .then(expenses => res.send({summary: expenses}))
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
