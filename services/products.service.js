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
        return ProductBase.findAll().catch(e => console.log(JSON.stringify(e)));
    }

    getAllProducts() {
        return this.getProductBases()
            .then(productBases => {
               const ids = _.chain(productBases)
                   .filter(p => !_.isEmpty(p.meli_ids))
                   .map('meli_ids')
                   .flatten().value();

               return {productBases, ids};
            })
            .then(map =>
                meliService.getProductsByIds(map.ids)
                    .then(items => {
                        return _.map(map.productBases, base => {
                            let result = base.toJSON();
                            console.log(`Result: ${JSON.stringify(result)}`);
                            result['meli_items'] = [];
                            _.each(base.meli_ids, (id) => {
                                const detail = _.find(items, {id: id});
                                if (detail) result.meli_items.push(detail);
                            });
                            return result;
                        });
                    })
            );
    }

    update(code, change) {
        return ProductBase.findOne({where: {code: code}})
            .then(product => product || Promise.reject(new Error('No product')))
            .then(product => product.update(change));
    }

    remove(id) {
        return ProductBase.destroy({where: {_id: id}});
    }

    syncWithMeli(code) {
        //Buscar si existe en meli y despues buscar el item y meterle los ids de meli
        return null;
    }
}

const productService = new ProductsService();
module.exports = productService;
