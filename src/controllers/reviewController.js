const db = require('../models')
const asyncErrorHandler = require('../utils/asyncErrorHandler')
const CustomError = require('../utils/CustomError')

// models
const Review = db.reviews
const Product = db.products

//functions
const addReview = asyncErrorHandler(async (req, res, next) =>  {
    const data = {
        productId: req.params.id,
        rating: req.body.rating,
        description: req.body.description
    }

    const { productId } = data

    const product = await Product.findOne({
        where: {
            id: productId
        }
    })

    if(!product) {
        const error = new CustomError('Product with that id is not found', 404)
        return next(error)
    }

    const review = await Review.create(data)

    res.status(201).json({
        status: 'success',
        data: {
            review
        }
    })
})

const getAllReviews = asyncErrorHandler(async (req, res, next) => {
    const reviews = await Review.findAll({})

    res.status(200).json({
        status: 'success',
        data: {
            reviews
        }
    })
})

module.exports = {
    addReview,
    getAllReviews
}