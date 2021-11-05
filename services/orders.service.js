const db = require('./storage.service');

const _ = require('lodash');

const ProductBase = db.models.ProductBase;
const PurchaseOrder = db.models.PurchaseOrder;

class OrdersService {
    constructor() {
    }

    async newOrder(data) {
        const product = await this.#findProductByCode(data.item_code);
        const order = await PurchaseOrder.create({count: data.count});
        await order.setProduct_base(product);
        return PurchaseOrder.findByPk(order._id, {include: 'product_base'});
    }

    getOrders() {
        return PurchaseOrder.findAll({include: 'product_base'})
            .catch(e => console.log(JSON.stringify(e)));
    }

    #findProductByCode = (code) => ProductBase.findOne({where: {code: code}});
}

const orderService = new OrdersService();
module.exports = orderService;
