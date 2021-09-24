const meliService = require('./meli.service');
const _ = require('lodash');

class BestSellersService {
    constructor() {
    }

    bestSellers(category) {
        return meliService.bestSellers(category)
            .then(items => _.filter(items, item => !item.error));
    }
}

const bestSellersService = new BestSellersService();
module.exports = bestSellersService;
