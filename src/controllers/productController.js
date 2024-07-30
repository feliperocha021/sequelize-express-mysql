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
    const products = await Product.findAll({})

    res.status(200).json({
        status: 'success',
        length: products.length,
        data: {
            products
        }
    })
})

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