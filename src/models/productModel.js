module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('product', {
        title: {
            type: DataTypes.STRING(30),
            allowNull: false, // campo obrigatório
            unique: {
                msg: 'Este produto já foi registrado'
            },
        },
        price: {
            type: DataTypes.DECIMAL(5,2)
        },
        description: {
            type: DataTypes.TEXT
        },
        published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true, // Adiciona createdAt e updatedAt automaticamente
        freezeTableName: true // Impede que o Sequelize pluralize o nome da tabela
    });
    
    return Product;
}
