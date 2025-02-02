require('dotenv').config({path:'./.env'}) // acesso as variaveis de ambiente
const { Sequelize, DataTypes } = require('sequelize')
const dbConfig = require('../config/dbConfig')

const sequelize = new Sequelize (
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD, {
        host: dbConfig.HOST,
        port: dbConfig.PORT,
        dialect: dbConfig.dialect,
        
        //gerenciar as conexões no db
        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle
        }
    }
)

//conexão ao banco
sequelize.authenticate()
.then(() => {
    console.log('connected...')
})

const db = {} //Usado para agrupar todas as entidades relacionadas ao banco de dados, como modelos e a própria conexão.

db.Sequelize = Sequelize //Atribui a classe Sequelize importada ao objeto db. Isso é útil para ter acesso à classe Sequelize em outros arquivos sem precisar importá-la novamente.
db.sequelize = sequelize //Atribui a instância do Sequelize (que representa uma conexão com o banco de dados) ao objeto db.

//importando as tabelas
db.products = require('./productModel.js')(sequelize, DataTypes)
db.reviews = require('./reviewModel.js')(sequelize, DataTypes)
db.users = require('./userModel.js')(sequelize, DataTypes)

db.sequelize.sync({ alter: true })
.then(() => {
    console.log('sync done')
})

//1 to many relation
db.products.hasMany(db.reviews, {
    foreignKey: 'productId',
    as: 'review'
})

db.reviews.belongsTo(db.products, {
    foreignKey: 'productId',
    as: 'product'
})

module.exports = db