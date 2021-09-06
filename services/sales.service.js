const db = require('./storage.service');
const meliService = require('./meli.service');

const _ = require('lodash');

const ProductBase = db.models.ProductBase;

const findByCode = (code) => ProductBase.findOne({where: {code: code}});

const addProduct = (order) => {
    return findByCode(order.item.seller_sku)
        .then(p => p.toJSON())
        .then(p => {
            order.item = _.assign(order.item, {code: p.code, cost: p.cost});
            return order;
        });
}

const getOrders = (sale ) => {
   return _.map(sale.order_items, addProduct);
};

const mapSale = (sale) => {
    const ordersPromises = getOrders(sale);
    return Promise.all(ordersPromises)
        .then(orders => {
            sale.order_items = orders;
            return sale;
        });
}

const mapSales = (sales) => {
    return _.map(sales, mapSale);
};

class SalesService {
    constructor() {
    }

    getSales() {
        return meliService.findSales()
            .then(sales => {
               const salesPromises = mapSales(sales);
               return Promise.all(salesPromises);
            });

    }
}

const salesService = new SalesService();
module.exports = salesService;
