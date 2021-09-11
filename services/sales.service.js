const db = require('./storage.service');
const meliService = require('./meli.service');

const _ = require('lodash');

const ProductBase = db.models.ProductBase;

const findByCode = (code) => ProductBase.findOne({where: {code: code}});

const addProduct = (order) => {
    const basePromise = findByCode(order.item.seller_sku).then(p => p.toJSON());
    const meliItemPromise = meliService.getProductsById(order.item.id);
    return Promise.all([basePromise, meliItemPromise])
        .then(results => {
            const base = _.head(results);
            const meliItem = _.last(results);
            order.item = _.assign(order.item, {code: base.code, cost: base.cost, meli_item: meliItem});
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

    getSales(year = undefined, month = undefined) {
        const service = year
            ? (month ? meliService.findSalesFromMonth : meliService.findSalesFromYear)
            : meliService.findSales;
        return service(Number.parseInt(year, 10), Number.parseInt(month, 10))
            .then(sales => {
               const salesPromises = mapSales(sales);
               return Promise.all(salesPromises);
            });

    }
}

const salesService = new SalesService();
module.exports = salesService;
