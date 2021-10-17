const db = require('./storage.service');
const meliService = require('./meli.service');

const _ = require('lodash');

const ProductBase = db.models.ProductBase;

class ProductsService {
    constructor() {
    }

    newProduct(productBase) {
        return ProductBase.create(productBase).then(r => this.syncWithMeli(r.code));
    }

    getProductBases() {
        return ProductBase.findAll().catch(e => console.log(JSON.stringify(e)));
    }

    getProductByCode(code) {
        return this.#findByCode(code)
            .then(productBase => {
                meliService.getProductsByIds(productBase.meli_ids)
                    .then(meliItems => {
                        let result = productBase.toJSON();
                        result['meli_items'] = [];
                        _.each(result.meli_ids, (id) => {
                            const detail = _.find(items, {id: id});
                            if (detail) result.meli_items.push(detail);
                        });
                        return result;
                    });
            });
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
        return this.#findByCode(code)
            .then(product => product || Promise.reject(new Error('No product')))
            .then(product => product.update(change));
    }

    remove(id) {
        return ProductBase.destroy({where: {_id: id}});
    }

    syncWithMeli(code) {
        let _meliItems;
        return meliService.findByCode(code)
            .then(meliItems => {
                _meliItems = meliItems;
                return _.map(meliItems, 'id');
            })
            .then(meliIds => this.update(code, {meli_ids: meliIds}))
            .then(productBase => _.assign(productBase, {meli_items: _meliItems}));
    }

    async addCompetition(code, competition) {
        console.log(`Agregando competencia para ${code} => ${JSON.stringify(competition)}`);
        const product = await this.#findByCode(code);
        const meliProduct = await meliService.getExternalItemDetails(competition.seller_id, competition.item_id);
        return meliProduct;
    }

    // Private methods
    #findByCode = (code) => ProductBase.findOne({where: {code: code}});
}

const productService = new ProductsService();
module.exports = productService;
