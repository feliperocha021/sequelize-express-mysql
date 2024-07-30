const reviewController = require('../controllers/reviewController')
const router = require('express').Router()

router.route('/')
    .get(reviewController.getAllReviews)

router.route('/:id')
    .post(reviewController.addReview)

module.exports = router