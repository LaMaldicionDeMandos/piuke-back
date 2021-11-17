const db = require('./storage.service');
const { Op } = require("sequelize");
const meliService = require('./meli.service');
const Cache = require('ttl-mem-cache');

const _ = require('lodash');

const cache = new Cache();
const CACHE_TTL = 1000*60*5;

const ProductBase = db.models.ProductBase;
const Sale = db.models.Sale;

class SalesService {
    constructor() {
    }

    newSale(sale) {
        return Sale.create(sale);
    }

    getSales(year = undefined, month = undefined) {
        const service = year
            ? (month ? meliService.findSalesFromMonth : meliService.findSalesFromYear)
            : meliService.findSales;
        return service(Number.parseInt(year, 10), Number.parseInt(month, 10))
            .then(sales => {
               const salesPromises = this.#mapSales(sales);
               return Promise.all(salesPromises);
            })
            .then(sales => {
                cache.set(`${year}-${month}-sales`, sales, CACHE_TTL);
                return sales;
            });
    }

    getSalesV2(year = undefined, month = undefined) {
        return Sale.findAll(this.#buildSaleDateQuery(year, month))
            .then(sales => {
                const promises = _.chain(sales)
                    .map(sale => sale.toJSON())
                    .map(sale => this.#findByCode(sale.item_code).then(product => _.assign(sale, product.toJSON())))
                    .value();
                return Promise.all(promises);
            });
    }

    getCachedSales(year = undefined, month = undefined) {
        const sales = cache.get(`${year}-${month}-sales`);
        if (!sales) return this.getSales(year, month);
        return Promise.resolve(sales);
    }

    getSummary(year = undefined, month = undefined) {
        return this.getCachedSales(year, month)
            .then(sales => _.chain(sales).map(this.#calculateProfit).reduce((sum, profit) => sum + profit, 0).value());

    }

    getPerformances(year = undefined, month = undefined) {
        return this.getCachedSales(year, month).then(this.#salesToPerformances);
    }

    #buildSaleDateQuery(year, month) {
        if (!year && !month) return undefined;
        const like = `${(year || '%')}-${month || ''}%`;
        return {
            where: {
                date: {
                    [Op.like]: like
                }
            }
        };
    }

    // Private Methods
    #findByCode = (code) => ProductBase.findOne({where: {code: code}})

    #addProduct = (order) => {
        const basePromise = this.#findByCode(order.item.seller_sku).then(p => p.toJSON())
            .catch(() => this.#findByCode(order.item.title).then(p => p.toJSON()));
        const meliItemPromise = meliService.getProductsById(order.item.id);
        return Promise.all([basePromise, meliItemPromise])
            .then(results => {
                const base = _.head(results);
                const meliItem = _.last(results);
                order.item = _.assign(order.item, {code: base.code, cost: base.cost, meli_item: meliItem});
                return order;
            });
    }

    #getOrders = (sale ) => {
        return _.map(sale.order_items, this.#addProduct);
    };

    #mapSale = (sale) => {
        const ordersPromises = this.#getOrders(sale);
        return Promise.all(ordersPromises)
            .then(orders => {
                sale.order_items = orders;
                return sale;
            });
    }

    #mapSales = (sales) => {
        return _.map(sales, this.#mapSale);
    };

    #calculateOrderProfit = (order, payment) => {
        const price = order.full_unit_price;
        const shippingFee = payment.shipping_cost;
        const totalPaid = payment.total_paid_amount;
        const transaction = payment.transaction_amount;
        const fees = order.sale_fee + shippingFee - (totalPaid - transaction);
        return price - fees - order.item.cost;
    }

    #calculateProfit = (sale) => {
        const payment = _.head(sale.payments);
        return _.reduce(sale.order_items, (sum, order) => sum + this.#calculateOrderProfit(order, payment), 0);
    };

    #calculatePerformance = (items) => {
        return _.map(items, (item) => this.#calculateOrderProfit(item.order, item.payment));
    };

    #salesToPerformances = (sales) => {
        return _.chain(sales).map((sale) => _.map(sale.order_items, (order) => {
            return {payment: _.head(sale.payments), order: order};
        })).flatten()
            .groupBy(item => item.order.item.code)
            .transform((list, value, key) => {
                const item = _.head(value).order.item;
                let product = {
                    code: key,
                    title: item.title,
                    image: _.head(item.meli_item).thumbnail,
                    profits: this.#calculatePerformance(value)
                };
                list.push(product);
                return list;
            }, []).value();
    }
}

const salesService = new SalesService();
module.exports = salesService;
