const router = require('express').Router()
const authController = require('../controllers/authController')

router.route('/signup').post(authController.signup)
router.route('/login').post(authController.login)
router.route('/forgotPassword').post(authController.forgotPassword)
router.route('/resetPassword/:token').patch(authController.resetPassword)
router.route('/updatePassword').patch(authController.protect, authController.updatePassword)

module.exports = router