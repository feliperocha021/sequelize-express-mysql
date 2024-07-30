const productController = require('../controllers/productController')
const router = require('express').Router()
const authController  = require('../controllers/authController')

router.route('/')
    .get(authController.protect, productController.getAllProducts)
    .get(authController.protect, productController.getPublishedProduct)
    .post(authController.protect, authController.restrict('admin'), productController.addProduct)
   
router.route('/:id')
    .put(authController.protect, authController.restrict('admin'), productController.updateProduct)
    .get(authController.protect, productController.getProduct)
    .delete(authController.protect, authController.restrict('admin'), productController.deleteProduct)

router.route('/:id/reviews')
    .get(authController.protect, productController.getProductReviews)

module.exports =  router