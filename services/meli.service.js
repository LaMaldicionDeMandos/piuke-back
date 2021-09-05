const axios = require('axios').default;
const _ = require('lodash');
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

function getCredentials() {
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

function getItemQuestions(id) {
    return getCredentials()
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

function getItemVisits(id) {
    return getCredentials()
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

function getItemDetails(itemIds) {
    return getCredentials()
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
                const questionsPromise = getItemQuestions(detail.id);
                const visitsPromise = getItemVisits(detail.id);
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

function hasCode(item, code) {
   return _.chain(item.attributes)
       .filter(attr => attr.id === 'GTIN' || attr.id === 'SELLER_SKU')
       .map(attr => attr.value_name)
       .some(item_code => item_code === code)
       .value();
}

class MeliService {
    constructor() {
        getCredentials();
    }

    getProductsByIds(ids) {
        const pagedIds = _.chunk(ids, REQUEST_LIMIT);
        const promises = _.map(pagedIds, ids => getItemDetails(ids));
        return Promise.all(promises).then(_.flatten);
    }

    getProducts(offset = 0) {
        return getCredentials()
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
                return getItemDetails(data.results)
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
        return this.getProducts().then(items => _.filter(items, item => hasCode(item, code)));
    }

    getItemCode(item) {
        return _.chain(item.attributes)
            .filter(attr => attr.id === 'GTIN' || attr.id === 'SELLER_SKU')
            .map(attr => attr.value_name)
            .head()
            .value().value_name;
    }

    findSales() {
        return getCredentials()
            .then(credentials => credentials.credentials)
            .then(credentials => {
                return {
                    baseURL: MELI_BASE_URL,
                    url: `/orders/search?seller=${MELI_SELLER_ID}&order.status=paid`,
                    headers: {'Authorization': `Bearer ${credentials.access_token}`}
                };
            })
            .then(config => axios.request(config))
            .then(res => res.data.results)
            .then(sales => _.filter(sales, sale => _.some(sale.order_items, item => item.item.seller_sku !== null)))
            .catch(e => {
                console.log("Error => " + JSON.stringify(e));
                throw e;
            });
    }
}

const meliService = new MeliService();
module.exports = meliService;
