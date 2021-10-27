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

    getAllProductCompetitions() {
        return this.getAllProducts()
            .then(products => {
                const promises = _.reduce(products, (proms, product) => {
                    _.forEach(product.product_comparations, (comp) => {
                        const promise = meliService.getExternalItemDetails(comp.ownerId, comp.itemId);
                        promise.then(meliItem => comp.newPrice = meliItem.price);
                        proms.push(promise);
                    });
                    return proms;
                }, []);
                return Promise.all(promises).then(() => products);
            });
    }

    async syncCompetition(code) {
        const productBase = await this.#findByCode(code);
        const product = productBase.toJSON();
        product.product_comparations = _.map(product.product_comparations, (comp) => {
            comp.oldPrice = comp.newPrice;
            comp.checked = false;
            return comp;
        });
        productBase.update({product_comparations: product.product_comparations});
        return product;
    }

    async addCompetition(code, competitionData) {
        const productBase = await this.#findByCode(code);
        const product = productBase.toJSON();
        const meliProduct = await meliService.getExternalItemDetails(competitionData.ownerId, competitionData.itemId);
        const competition = {
            ownerI: competitionData.owner_id,
            itemId: competitionData.item_id,
            itemLink: meliProduct.permalink,
            oldPrice: meliProduct.price,
            newPrice: meliProduct.price};
        product.product_comparations.push(competition);
        productBase.update({product_comparations: product.product_comparations});
        return product;
    }

    async updateCompetition(code, comp) {
        const productBase = await this.#findByCode(code);
        const product = productBase.toJSON();
        const index = _.findIndex(product.product_comparations, (c) => comp.ownerId === c.ownerId);
        product.product_comparations.splice(index, 1, comp);
        productBase.update({product_comparations: product.product_comparations});
        return product;
    }

    // Private methods
    #findByCode = (code) => ProductBase.findOne({where: {code: code}});
}

const productService = new ProductsService();
module.exports = productService;
