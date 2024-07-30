module.exports = (sequelize , DataTypes) => {
    const Product = sequelize.define('product', {
        title: {
            type: DataTypes.STRING(15),
            allowNull: false, //campo obrigatório
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
    })
    
    return Product
}