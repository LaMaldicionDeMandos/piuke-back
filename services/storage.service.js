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
    cost: {type: DataTypes.FLOAT , allowNull: false},
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

sequelize.define('ProductComparation', {
    _id: {type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4,  primaryKey: true},
    ownerId: {type: DataTypes.STRING, allowNull: false, defaultValue: ''},
    itemId: {type: DataTypes.STRING , allowNull: false, defaultValue: ''},
    itemLink: {type: DataTypes.STRING, allowNull: false, defaultValue: ''},
    oldPrice: {type: DataTypes.FLOAT , allowNull: false},
    newPrice: {type: DataTypes.FLOAT , allowNull: false}
});

sequelize.define('Expense', {
    _id: {type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4,  primaryKey: true},
    desc: {type: DataTypes.STRING, allowNull: true, defaultValue: ''},
    value: {type: DataTypes.FLOAT , allowNull: false}
});

sequelize.models.ProductBase.hasMany(sequelize.models.ProductComparation);
sequelize.models.ProductComparation.belongsTo(sequelize.models.ProductBase);

(async () => {
    console.log("Ejecucion asyncrona");
    try {
        await sequelize.authenticate();
        console.log('Authenticated');
        await sequelize.models.ProductBase.sync({alter: true});
        await sequelize.models.Expense.sync({alter: true});
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
