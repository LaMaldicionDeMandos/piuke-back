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
    cost: {
        type: DataTypes.DECIMAL(10, 2) ,
        allowNull: false,
        set(v) {
            this.setDataValue('cost', v.toString());
        },
        get() {
            return Number.parseFloat(this.getDataValue('cost'));
        }
    },
    meli_ids: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '[]',
        set(ids) {
            this.setDataValue('meli_ids', JSON.stringify(ids));
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
    oldPrice: {type: DataTypes.DECIMAL(10, 2) , allowNull: false,
            set(v) {
                this.setDataValue('oldPrice', v.toString());
            },
            get() {
                return Number.parseFloat(this.getDataValue('oldPrice'));
            }
    },
    newPrice: {type: DataTypes.DECIMAL(10, 2) , allowNull: false,
        set(v) {
            this.setDataValue('newPrice', v.toString());
        },
        get() {
            return Number.parseFloat(this.getDataValue('newPrice'));
        }},
    checked: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'false',
        set(c) {
            this.setDataValue('checked', c ? 'true' : 'false');
        },
        get() {
            return this.getDataValue('checked') === 'true';
        }
    }
});

sequelize.define('PurchaseOrder', {
    _id: {type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4,  primaryKey: true},
    count: {type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0}
});

sequelize.define('Expense', {
    _id: {type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4,  primaryKey: true},
    desc: {type: DataTypes.STRING, allowNull: true, defaultValue: ''},
    value: {type: DataTypes.DECIMAL(10, 2) , allowNull: false}
});

sequelize.models.ProductBase.hasMany(sequelize.models.ProductComparation, { as: "product_comparations" });
sequelize.models.ProductComparation.belongsTo(sequelize.models.ProductBase);
sequelize.models.PurchaseOrder.hasOne(sequelize.models.ProductBase, {as: 'product_base'});
sequelize.models.ProductBase.belongsTo(sequelize.models.PurchaseOrder, {foreignKey: 'order_id'});

(async () => {
    console.log("Ejecucion asyncrona");
    try {
        await sequelize.authenticate();
        console.log('Authenticated');
        await sequelize.models.ProductBase.sync({alter: true});
        await sequelize.models.ProductComparation.sync({alter: true});
        await sequelize.models.PurchaseOrder.sync({alter: true});
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
