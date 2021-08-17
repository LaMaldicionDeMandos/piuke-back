require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const healthRouter = require('./routes/helth.router');
const productsRouter = require('./routes/products.router');
const meliRouter = require('./routes/meli.router');

const app = express();

console.log('Enviroment => ' + process.env.ENV);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('health', healthRouter);
app.use('/products', productsRouter);
app.use('/meli/', meliRouter);

module.exports = app;
