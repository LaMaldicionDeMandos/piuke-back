const axios = require('axios').default;
const _ = require('lodash');

const MELI_ROOT_CATEGORY = 'MLA1132';
const MELI_BASE_URL = 'https://api.mercadolibre.com';
const MELI_CREDENTIALS = {
    grant_type: 'client_credentials',
    client_id: process.env.MELI_APP_ID,
    client_secret: process.env.MELI_SECRET
};
const MELI_SELLER_ID = process.env.MELI_USER;
const REQUEST_LIMIT = 20;
let credentials;

class Credentials {
    constructor(credentials) {
        this.credentials = credentials;
        this.credentials['created_at'] = new Date().getTime();
    }

    isExpired() {
        const expirationTime = this.credentials.created_at + this.credentials.expires_in*1000;
        const currentTime = new Date().getTime();
        return expirationTime < currentTime;
    }
}

class MeliService {
    constructor() {
        this.#getCredentials();
    }

    getProductsByIds(ids) {
        const pagedIds = _.chunk(ids, REQUEST_LIMIT);
        const promises = _.map(pagedIds, ids => this.#getItemDetails(ids));
        return Promise.all(promises).then(_.flatten);
    }

    getProductsById(id) {
        return this.#getItemDetails([id]);
    }

    getProducts(offset = 0) {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/users/${MELI_SELLER_ID}/items/search?limit=${REQUEST_LIMIT}&offset=${offset}`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data)
            .then(data => {
                return this.#getItemDetails(data.results)
                    .then(items => {
                        if (data.paging.offset + data.paging.limit < data.paging.total) {
                            return this.getProducts(offset + REQUEST_LIMIT)
                                        .then(lastItems =>  _.concat(items, lastItems));
                        }
                        return items;
                    });
            })
            .catch(e => {
                console.log("Error => " + JSON.stringify(e));
                throw e;
            });
    }

    findByCode(code) {
        return this.getProducts().then(items => _.filter(items, item => this.#hasCode(item, code) || item.title === code));
    }

    getItemCode(item) {
        return _.chain(item.attributes)
            .filter(attr => attr.id === 'GTIN' || attr.id === 'SELLER_SKU')
            .map(attr => attr.value_name)
            .head()
            .value().value_name;
    }

    findSalesFromMonth = (year, month) => {
        const m = month < 10 ? '0' + month : month;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? '01' : (month < 9 ? `0${month+1}` : month + 1);
        return this.#searchSales(`&order.date_created.from=${year}-${m}-01T00:00:00.000-03:00&order.date_created.to=${nextYear}-${nextMonth}-01T00:00:00.000-03:00`);
    }

    findSalesFromYear = (year) => {
        return this.#searchSales(`&order.date_created.from=${year}-01-01T00:00:00.000-03:00&orfer.date_created.to=${year+1}-01-01T00:00:00.000-03:00`);
    }

    findSales = () => {
        return this.#searchSales('');
    }

    bestSellers(category) {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/highlights/MLA/category/${category || MELI_ROOT_CATEGORY}`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data)
            .then(data => {
                const ids = _.map(data.content, 'id');
                return this.#getItemDetails(ids)
                    .then(items => {
                        _.each(items, item => {
                            _.assignIn(item, {position: _.find(data.content, c => c.id === item.id).position});
                        });
                        return items;
                    })
            })
            .catch(e => {
                console.log("Error => " + JSON.stringify(e));
                throw e;
            });
    }

    categories() {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/categories/${MELI_ROOT_CATEGORY}`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data.children_categories)
            .catch(e => {
                console.log("Error => " + JSON.stringify(e));
                throw e;
            });
    }

    // Private methods
     #getCredentials() {
        if (!credentials || credentials.isExpired()) {
            return axios.post(MELI_BASE_URL + '/oauth/token', MELI_CREDENTIALS)
                .then((response) => {
                    credentials = new Credentials(response.data);
                    console.log('Credentials: ' + JSON.stringify(credentials));
                    return credentials;
                });
        }
        return Promise.resolve(credentials);
    }

    #getItemQuestions(id) {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/questions/search?item=${id}&api_version=4`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data.questions);
    }

    #getItemVisits(id) {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/visits/items?ids=${id}`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data[id]);
    }

    #getItemDetails(itemIds) {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/items?ids=${_.join(itemIds)}`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => _.map(res.data, result => result.body))
            .then(details => {
                const promises = _.map(details, detail => {
                    const questionsPromise = this.#getItemQuestions(detail.id);
                    const visitsPromise = this.#getItemVisits(detail.id);
                    return Promise.all([questionsPromise, visitsPromise])
                        .then(r => {
                            detail['questions'] = r[0].length;
                            detail['visits'] = r[1];
                            return detail;
                        })
                });
                return Promise.all(promises);
            });
    }

    #hasCode(item, code) {
        return _.chain(item.attributes)
            .filter(attr => attr.id === 'GTIN' || attr.id === 'SELLER_SKU')
            .map(attr => attr.value_name)
            .some(item_code => item_code === code)
            .value();
    }

    #searchSales(query = '') {
        return this.#getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/orders/search?seller=${MELI_SELLER_ID}&order.status=paid${query}`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data.results)
            .then(orders => _.filter(orders, order => _.some(order.order_items, item => item.item.seller_sku !== null)))
            .catch(e => {
                console.log("Error => " + JSON.stringify(e));
                throw e;
            });
    }
}

const meliService = new MeliService();
module.exports = meliService;
