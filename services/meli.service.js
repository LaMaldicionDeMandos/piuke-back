const axios = require('axios').default;
const MELI_BASE_URL = 'https://api.mercadolibre.com/';
const MELI_CREDENTIALS = {
    grant_type: 'client_credentials',
    client_id: process.env.MELI_APP_ID,
    client_secret: process.env.MELI_SECRET
};
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
        return axios.post(MELI_BASE_URL + 'oauth/token', MELI_CREDENTIALS)
            .then((response) => {
                credentials = new Credentials(response.data);
                console.log('Credentials: ' + JSON.stringify(credentials));
                return credentials;
            });
    }
    return Promise.resolve(credentials);
}


class MeliService {
    constructor() {
        getCredentials();
    }
}

const meliService = new MeliService();
module.exports = meliService;
