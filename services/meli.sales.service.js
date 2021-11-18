const db = require('./storage.service');
const meliService = require('./meli.service');
const salesService = require('./sales.service');
const ProductBase = db.models.ProductBase;
const _ = require('lodash');

class MeliSalesService {
    constructor() {
    }

    async newOrder(resource) {
        const code = _.split(resource, '/')[2];
        const order = await meliService.getSale(code);
        console.log("New SALE!!!!! ====> " + JSON.stringify(order));
        const promises = _.map(order.order_items, (item) => this.#getProduct(item.item).then(product =>
                meliService.getShipping(order.shipping.id)
                    .then(shipping => this.#buildSale(product, order, item, shipping))
                    .then(sale => salesService.newSaleComplete(sale))
            )
        );
        return Promise.all(promises);
    }

    #calculateShippingCost(shipping) {
        if (!shipping) return 0;
        if (shipping.tracking_method === '') return -shipping.base_cost;
        if (shipping.tracking_method === 'Webpack') return (shipping.shipping_option.list_cost - shipping.shipping_option.cost)/shipping.shipping_items.length;
        return shipping.shipping_option.list_cost - shipping.shipping_option.cost;
    }

    #buildSale(product, order, item, shipping) {
        return {
            provider: 'meli',
            code: order.id,
            date: order.date_created,
            amount: item.unit_price,
            shipping_cost: this.#calculateShippingCost(shipping),
            fee: item.sale_fee,
            cost: product.cost,
            item_code: product.code
        };
    }

    #findByCode = (code) => ProductBase.findOne({where: {code: code}})

    #getProduct(item) {
        return this.#findByCode(item.seller_sku)
            .then(p => p.toJSON())
            .catch(() => this.#findByCode(item.title).then(p => p.toJSON()));
    }
}

const meliSalesService = new MeliSalesService();
module.exports = meliSalesService;
