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

    getAllProducts() {
        return this.getProductBases();
    }

    update(code, change) {
        return ProductBase.findOne({where: {code: code}})
            .then(product => product || Promise.reject(new Error('No product')))
            .then(product => product.update(change));
    }
}

const productService = new ProductsService();
module.exports = productService;
