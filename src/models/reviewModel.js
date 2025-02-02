module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('review', {
        rating: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        timestamps: true, // Adiciona createdAt e updatedAt automaticamente
        freezeTableName: true // Impede que o Sequelize pluralize o nome da tabela
    });
    
    return Review;
}
