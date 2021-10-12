const db = require('./storage.service');
const _ = require('lodash');
const {Op} = require("sequelize");

const Expense = db.models.Expense;

class ExpenseService {
    constructor() {
    }

    newExpense(expense) {
        return Expense.create(expense);
    }

    getExpenses(year = undefined, month = undefined) {
        if (!year && !month) return this.#getAllExpenses();
        const dateRange = getDateRange(year, month);
        return getExpensesFromRange(dateRange);
    }

    getExpensesSummary(year = undefined, month = undefined) {
        if (!year && !month) return this.#getAllExpenses();
        const dateRange = this.#getDateRange(year, month);
        return this.#getExpensesFromRange(dateRange)
            .then(expenses => _.reduce(expenses, (sum, exp) => sum + exp.value, 0));
    }

    // Private methods
    #getAllExpenses() {
        return Expense.findAll().catch(e => console.log(JSON.stringify(e)));
    }

    #getDateRange(year, month) {
        const y = Number.parseInt(year);
        const m = month ? Number.parseInt(month) - 1 : 0;
        const ny = m === 11 ? y + 1 : y;
        const nm = m < 11 ? m + 1 : 0;
        return {from: new Date(y, m), to: new Date(ny, nm)};
    }

    #getExpensesFromRange(range) {
        return Expense.findAll({where: {createdAt: {[Op.between]: [range.from, range.to]}}});
    }
}

const expensesService = new ExpenseService();
module.exports = expensesService;
