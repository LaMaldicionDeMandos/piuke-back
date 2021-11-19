const db = require('./storage.service');
const { Op } = require("sequelize");
const meliService = require('./meli.service');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');


const ProductBase = db.models.ProductBase;
const Sale = db.models.Sale;

class SalesService {
    constructor() {
    }

    newSaleComplete(sale) {
        return Sale.create(sale);
    }

    async newSale(sale, changeStock = false) {
        const product = await this.#findByCode(sale.item_code);
        const s = await Sale.create(_.assign(sale, {
            provider: 'local',
            code: uuidv4(),
            date: (new Date()).toISOString(),
            cost: product.cost,
            item_code: product.code
        }));
        if (changeStock) meliService.changeStock(product.meli_ids, -1).then(() => console.log("Stock changed"));
        return _.chain(s)
            .thru(s => s.toJSON())
            .assign(product.toJSON())
            .value();
    }

    async existsSale(code) {
        const sale = await Sale.findOne({where: {code: code}});
        return sale !== null;
    }

    getSales(year = undefined, month = undefined) {
        return Sale.findAll(this.#buildSaleDateQuery(year, month))
            .then(sales => {
                const promises = _.chain(sales)
                    .map(sale => sale.toJSON())
                    .map(sale => this.#findByCode(sale.item_code).then(product => _.assign(sale, product.toJSON())))
                    .value();
                return Promise.all(promises);
            });
    }

    getSummary(year = undefined, month = undefined) {
        return this.getSales(year, month)
            .then(sales => _.chain(sales).map(this.#calculateProfit).reduce((sum, profit) => sum + profit, 0).value());

    }

    getPerformances(year = undefined, month = undefined) {
        return this.getSales(year, month).then(this.#salesToPerformances);
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

    #calculateProfit = (sale) => {
        return sale.amount - sale.cost - sale.fee - sale.shipping_cost;
    };

    #calculatePerformance = (items) => {
        return _.map(items, (item) => this.#calculateProfit(item));
    };

    #salesToPerformances = (sales) => {
        return _.chain(sales)
            .groupBy(sale => sale.item_code)
            .transform((list, sales, key) => {
                const item = _.head(sales);
                let product = {
                    code: key,
                    title: item.title,
                    image: item.thumbnail,
                    profits: this.#calculatePerformance(sales)
                };
                list.push(product);
                return list;
            }, []).value();
    }
}

const salesService = new SalesService();
module.exports = salesService;
