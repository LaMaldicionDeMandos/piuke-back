const db = require('./storage.service');
const meliService = require('./meli.service');

const _ = require('lodash');

const ProductBase = db.models.ProductBase;

class ProductsService {
    constructor() {
    }

    newProduct(productBase) {
        return ProductBase.create(productBase)
            .then(r => {
                console.log(`Product created: ${JSON.stringify(r)}`);
                return r;
            });
    }

    getProductBases() {
        return ProductBase.findAll();
    }

    getAllProducts() {
        return this.getProductBases()
            .then(productBases => {
               const ids = _.chain(productBases)
                   .filter('meli_id')
                   .map('meli_id').value();

               return {productBases, ids};
            })
            .then(map =>
                meliService.getProductsByIds(map.ids)
                    .then(items => {
                        return _.map(map.productBases, base => {
                            const detail = _.find(items, {id: base.meli_id});
                            return detail ? _.assignIn(detail, base.toJSON()) : base;
                        });
                    })
            );
    }

    update(code, change) {
        return ProductBase.findOne({where: {code: code}})
            .then(product => product || Promise.reject(new Error('No product')))
            .then(product => product.update(change));
    }
}

const productService = new ProductsService();
module.exports = productService;
