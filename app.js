require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const healthRouter = require('./routes/health.router');
const productsRouter = require('./routes/products.router');
const salesRouter = require('./routes/sales.router');
const meliRouter = require('./routes/meli.router');
const expensesRouter = require('./routes/expenses.router');
const bestSellersRouter = require('./routes/best_sellers.router');

const app = express();

console.log('Enviroment => ' + process.env.ENV);

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/health', healthRouter);
app.use('/products', productsRouter);
app.use('/sales', salesRouter);
app.use('/meli', meliRouter);
app.use('/expenses', expensesRouter);
app.use('/bestsellers', bestSellersRouter);

module.exports = app;
