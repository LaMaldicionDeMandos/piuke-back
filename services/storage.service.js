const { Sequelize, DataTypes } = require('sequelize');

const DIALECT_METHOD = 'dialect';
const connectionMethod = process.env.DATABASE_CONNECTION_METHOD;


const connectionParam =  (connectionMethod === DIALECT_METHOD)
    ? {dialect: process.env.DATABASE_CONNECTION_DIALECT, storage: process.env.DATABASE_URL, dialectOptions: {mode: 2}}
    : process.env.DATABASE_URL;

const sequelize = new Sequelize(connectionParam);

sequelize.define('ProductBase', {
    _id: {type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4,  primaryKey: true},
    code: {type: DataTypes.STRING, allowNull: false},
    cost: {type: DataTypes.DECIMAL(10, 2) , allowNull: false},
    meli_ids: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '[]',
        set(ids) {
            this.setDataValue('meli_ids',JSON.stringify(ids));
        },
        get() {
            return JSON.parse(this.getDataValue('meli_ids'));
        }
    }
});

(async () => {
    console.log("Ejecucion asyncrona");
    try {
        await sequelize.authenticate();
        console.log('Authenticated');
        await sequelize.models.ProductBase.sync({alter: false});
        console.log('Synchronized');
    } catch (e) {
        console.log("Error " + JSON.stringify(e));
    }

})();

process.on('exit', function() {
    console.log('Desconnecting db');
    sequelize.close();
});

module.exports = sequelize;