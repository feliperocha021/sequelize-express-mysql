// ESSE ARQUIVO NÃO FAZ PARTE DESSA API REST FULL É APENAS PARA USO DIDÁTICO

require('dotenv').config({path:'./.env'}) // acesso as variaveis de ambiente
const Sequelize = require('sequelize');
const { DataTypes } = Sequelize

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

const User = sequelize.define('user', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true // Define o campo como chave primária e auto incremento
  },
  username: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  age: {
    type: Sequelize.DataTypes.INTEGER,
    defaultValue: 18
  }
},
{
  // freezeTableName: true // a tabela terá o mesmo nome do modelo criado aqui, false: padrão coloca o nome da tabela no plural
  // timestamps: false // createdAt e updatedAt não são criados
})

User.sync( {alter: true} ).then((result) => {  /* sync( {force: true}) --> apaga a tabela no db que possui o mesmo nome e cria essa nova. sync( {alter: true}) --> adiciona novas propriedades a uma tabela existente no db */
  console.log(result)          
}).catch((err) => {
  console.log(err)
});