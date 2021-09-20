const db = require('./storage.service');
const meliService = require('./meli.service');
const Cache = require('ttl-mem-cache');

const _ = require('lodash');

const cache = new Cache();
const CACHE_TTL = 1000*60*5;

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

const calculateOrderProfit = (order, payment) => {
    const price = order.full_unit_price;
    const shippingFee = payment.shipping_cost;
    const totalPaid = payment.total_paid_amount;
    const transaction = payment.transaction_amount;
    const fees = order.sale_fee + shippingFee - (totalPaid - transaction);
    return price - fees - order.item.cost;
}

const calculateProfit = (sale) => {
    const payment = _.head(sale.payments);
    return _.reduce(sale.order_items, (sum, order) => sum + calculateOrderProfit(order, payment), 0);
};

const calculatePerformance = (items) => {
  return _.reduce(items, (result, item) => {
      result.count++;
      result.profit+= calculateOrderProfit(item.order, item.payment);
      return result;
  }, {count: 0, profit: 0});
};

const salesToPerformances = (sales) => {
    return _.chain(sales).map((sale) => _.map(sale.order_items, (order) => {
        return {payment: _.head(sale.payments), order: order};
    })).flatten()
        .groupBy(item => item.order.item.code)
        .transform((list, value, key) => {
            const item = _.head(value).order.item;
            let product = {code: key, title: item.title, image: _.head(item.meli_item).thumbnail};
            product = _.assign(product, calculatePerformance(value));
            list.push(product);
            return list;
        }, []).value();
}

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
            })
            .then(sales => {
                cache.set(`${year}-${month}-sales`, sales, CACHE_TTL);
                return sales;
            });
    }

    getCachedSales(year = undefined, month = undefined) {
        const sales = cache.get(`${year}-${month}-sales`);
        if (!sales) return this.getSales(year, month);
        return Promise.resolve(sales);
    }

    getSummary(year = undefined, month = undefined) {
        return this.getCachedSales(year, month)
            .then(sales => _.chain(sales).map(calculateProfit).reduce((sum, profit) => sum + profit, 0).value());

    }

    getPerformances(year = undefined, month = undefined) {
        return this.getCachedSales(year, month).then(salesToPerformances);
    }
}

const salesService = new SalesService();
module.exports = salesService;
