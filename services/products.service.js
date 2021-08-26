const db = require('./storage.service');
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
/*
    replaceResource(resource) {
        return Resource.update(resource, { where: {_id: resource._id}})
            .then(r => {
                console.log(`Resource updated: ${JSON.stringify(r)}`);
                return r;
            });
    }
    */
}

const productService = new ProductsService();
module.exports = productService;
