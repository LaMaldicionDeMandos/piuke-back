const db = require('./storage.service');
const meliService = require('./meli.service');

const _ = require('lodash');

const ProductBase = db.models.ProductBase;

const findByCode = (code) => ProductBase.findOne({where: {code: code}});

class SalesService {
    constructor() {
    }

    getSales() {
        return meliService.findSales()
            .then(sales => {
                _.forEach(sales, sale => {
                   const order =  _.head(sale.order_items);
                   const code = order.item.seller_sku;
                   const meliId = order.item.id;
                   sale['product_code'] = code;
                   sale['meli_id'] = meliId;
                });
                return sales;
            });
    }
}

const salesService = new SalesService();
module.exports = salesService;
