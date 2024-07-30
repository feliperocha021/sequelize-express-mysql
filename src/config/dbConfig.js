module.exports = {
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    dialect: 'mysql',

    //gerenciar as conexões no db
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
}