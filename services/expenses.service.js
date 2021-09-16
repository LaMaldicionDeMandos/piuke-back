const db = require('./storage.service');
const _ = require('lodash');

const Expense = db.models.Expense;

class ExpenseService {
    constructor() {
    }

    newExpense(expense) {
        return Expense.create(expense);
    }

    getExpenses(year = undefined, month = undefined) {
        return Expense.findAll().catch(e => console.log(JSON.stringify(e)));
    }
}

const expensesService = new ExpenseService();
module.exports = expensesService;
