const { Op } = require('sequelize');

const db = require('../models')
const asyncErrorHandler = require('../utils/asyncErrorHandler')
const CustomError = require('../utils/CustomError')

// models
const Product = db.products
const Review = db.reviews

//functions
function clearProduct(product) {
    delete product.dataValues.id
    delete product.dataValues.updatedAt
    delete product.dataValues.createdAt
    
    return product
}

const addProduct = asyncErrorHandler(async (req, res, next) => {
    let info = {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        published: req.body.published ? req.body.published : false
    }

    const product = await Product.create(info)

    res.status(201).json({
        status:'success',
        data: {
            product
        }
    })
})

const getAllProducts = asyncErrorHandler(async (req, res, next) => {
    // Converte o objeto de consulta em uma string
    let queryStr = JSON.stringify(req.query);
    queryStr = queryStr.replace(/\b(eq|ne|gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // Analisa a string modificada de volta em um objeto JavaScript
    const queryObj = JSON.parse(queryStr);

    // Converte todos os valores numéricos do objeto de consulta e aplica operadores do Sequelize
    const query = {};
    for (const key in queryObj) {
        if (key != 'sort' && key != 'fields' && typeof queryObj[key] === 'object' && !Array.isArray(queryObj[key])) {
            query[key] = {};
            for (const subKey in queryObj[key]) {
                query[key][Op[subKey.replace('$', '')]] = parseFloat(queryObj[key][subKey]);
            }
        } else if (key != 'sort' && key != 'fields') {
            query[key] = !isNaN(queryObj[key]) ? parseFloat(queryObj[key]) : queryObj[key];
        }
    }

    // LOGICA DE ORDENACAO
    // Pode usar o FOREACH ou MAP
    /*
    let order = [];
    if (queryObj.sort) {
        const sortFields = req.query.sort.split(',');
        sortFields.forEach(field => {
            if (field.startsWith('-')) {
                order.push([field.slice(1), 'DESC']);
            } else {
                order.push([field, 'ASC']);
            }
        });
    }
    */
    let order = []
    if (req.query.sort) {
        sortFields = req.query.sort.split(',')
        order = sortFields.map(field => {
            if (field.startsWith('-')) {
                return ([field.slice(1), 'DESC'])
            } else {
                return ([field, 'ASC'])
            }
        })
    } else {
        order.push(['createdAt', 'DESC'])
    }

    //FILTRAR CAMPOS SELECIONADOS
    const attributes = req.query.fields ? req.query.fields.split(',') : { exclude: ['createdAt', 'updatedAt'] }

    const products = await Product.findAll({ 
        where: query,
        order: order,
        attributes: attributes
    });

    res.status(200).json({
        status: 'success',
        length: products.length,
        data: {
            products
        }
    });
});

const getProduct = asyncErrorHandler(async (req, res, next) => {
    let id = req.params.id

    const product = await Product.findOne({
        where: {
            id: id
        }
    })

    if(!product) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
    }

    clearProduct(product)

    res.status(200).json({
        status: 'success',
        data: {
            product
        }
    })
})

const updateProduct = asyncErrorHandler(async (req, res, next) => {
    let id = req.params.id

    if(isNaN(id)) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
    }

    const match = await Product.update(req.body, {
        where: {
            id: id
        }
    })

    if(match[0] === 0) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
    }

    const product = await Product.findOne({
        where: {
            id: id
        }
    })

    clearProduct(product)

    res.status(200).json({
        status: 'success',
        data: {
            product
        }
    })
})

const deleteProduct = asyncErrorHandler(async (req, res, next) => {
    let id = req.params.id
    
    if(isNaN(id)) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
    }

    const match = await Product.destroy({
        where: {
            id: id
        }
    })

    if(match === 0) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
    }

    res.status(200).json({
        status: 'success',
        data: null
    })
})

const getPublishedProduct = asyncErrorHandler(async(req, res, next) => {
    const products = await Product.findAll({
        where: {
            published: true
        }
    })

    res.status(200).json({
        status: 'success',
        data: {
            products
        }
    })
})

//connect one to many relation Product and Reviews
const getProductReviews = asyncErrorHandler(async (req, res, next) => {
    const id = req.params.id

    const product = await Product.findAll({
        include: [{
            model: Review,
            as: 'review'
        }],
        where: {
            id: id
        }
    })

    if(product.length === 0) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
        
    }

    res.status(200).json({
        status: "success",
        data: {
            product
        }
    })
})

module.exports = {
    addProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getPublishedProduct,
    getProductReviews
}