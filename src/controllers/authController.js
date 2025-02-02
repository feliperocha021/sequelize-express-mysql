const jwt = require('jsonwebtoken')
const util = require('util')
const crypto = require('crypto')
const { Sequelize, where } = require('sequelize');

const db = require('../models')
const asyncErrorHandler = require('../utils/asyncErrorHandler')
const CustomError = require('../utils/CustomError')
const sendEmail = require('../utils/email');
const { updateProduct } = require('./productController');

//models
const User = db.users

//functions
function clearUser(user) {
    delete user.dataValues.password
    delete user.dataValues.id
    delete user.dataValues.updatedAt
    delete user.dataValues.createdAt
    delete user.dataValues.role
    delete user.dataValues.passwordChanged
    delete user.dataValues.passwordResetToken
    delete user.dataValues.passwordResetTokenExpires

    return user
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function signToken (id) {
    const token = jwt.sign({id}, process.env.SECRET_STRING, {
        expiresIn: process.env.LOGIN_EXPIRES
    }) //utiliza o playload(dados do arquivo json) e a string secreta(min: 32caracteres) para criar o token

    return token
}

const signup = asyncErrorHandler(async (req, res, next) => {
    let info = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordChanged: formatDate(new Date())
    }

    if(User.validatePassword(info.password)) {
        const error = new CustomError('A senha deve ter entre 8 e 16 caracteres.', 400)
        return next(error)
    }

    const user = await User.create(info)
    const token = signToken(user.id)
    clearUser(user)

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
})

const login = asyncErrorHandler(async (req, res, next) => {
    const {email, password} = req.body
    
    if(!email || !password) {
        const error = new CustomError('Insira o e-mail e a senha para fazer login', 400)
        return next(error)
    }

    const user = await User.findOne({
        where: {
            email: email
        }
    }) 

    if(!user || !(await User.comparePasswordInDb(password, user.password))) {
        const error = new CustomError('E-mail e/ou senha inválido(s)', 400)
        return next(error)
    }

    const token = signToken(user.id)
    clearUser(user)

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
})

const protect = asyncErrorHandler(async (req, res, next) => {
    //Ler o token e verificar se o mesmo existe
    const testToken = req.headers.authorization
    let token
    console.log(testToken)
    if(testToken && testToken.startsWith('bearer')) {
        token = testToken.split(' ')[1]
    }

    if(!token) {
        const error = new CustomError('You are not logged in.', 401)
        return next(error)
    }

    //Validar o token
    const decodeToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STRING)

    //Verficar se o usuário existe
    const user = await User.findOne({
        where: {
            id: decodeToken.id
        }
    })
    
    if(!user) {
        const error = new CustomError('The user withe given token does no exist', 401)
        return next(error)
    }

    //Verificar se o usuário alterou a senha após a emissão do token
    if(await User.isPasswordChanged(decodeToken.iat, user)) {
        const error = new CustomError('The password has been changed recently. Please login again.', 401)
        return next(error)
    } //iat: informa o carimbo da data e hora em que o token foi emitido em milisegundos

    //Permissão para o usuário acessar a rota
    //Se caso precisarmos do objeto usuário no próximo midlleware
    req.user = user
    return next()
})

//...roles pode receber vários parâmetros e vira um array
const restrict = (...role) => {
    return asyncErrorHandler(async (req, res, next) => {
        console.log(role)
        if(!role.includes(req.user.role)) {
            const error = new CustomError('You do not have permission to perform this action', 403)
            return next(error)
        }
        return next()
    })
}

const forgotPassword = asyncErrorHandler(async (req, res, next) => {
    //get user based on posted email
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    })

    if(!user) {
        const error = new CustomError('We could not find the user with given email', 404)
        return next(error)
    }

    //generate a random reset token
    const {resetToken, passwordResetToken, passwordResetTokenExpires} = User.createResetTokenPswd(user)
    
    //update user in database
    const updatedUser = await User.update({
        passwordResetToken: passwordResetToken,
        passwordResetTokenExpires: passwordResetTokenExpires
    },
    {
        where: { id: user.id }
    })

    if(updatedUser[0] === 0) {
        const error = new CustomError('An error occurred when trying to save the password reset token. Please try again later', 500)
    }

    //send the token back to the user email
    const urlReset = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `We have received a password reset request. Please use the below link to reset your password\n\n${urlReset}\n\nThis reset password link will be valid only for 10 minutes.`

    try{
        await sendEmail({
            email: user.email,
            subject: 'Password change request received',
            message: message
        })

        res.status(200).json({
            status: 'success',
            message: 'Password reset link send to the user email'
        })
    }catch(err) {
        const updatedUser = await User.update({
            passwordResetToken: null,
            passwordResetTokenExpires: null
        },
        {
            where: { id: user.id }
        })

        return next(new CustomError('There was an error sending password reset email. Please try again later', 500))
    }
})

const resetPassword = asyncErrorHandler(async (req, res, next) => {
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        where: {
            passwordResetToken: resetToken
        } 
    })

    if(!user) { 
        const error = new CustomError('This is token is invalid.', 400)
        return next(error)
    }

    if(Date.now() > user.passwordResetTokenExpires) {
        const updatedUser = await User.update({
            passwordResetToken: null,
            passwordResetTokenExpires: null
        },
        {
            where: { id: user.id }
        })

        const error = new CustomError('This is token has expired.', 400)
        return next(error)
    }

    if(User.validatePassword(req.body.password)) {
        const error = new CustomError('A senha deve ter entre 8 e 16 caracteres.', 400)
        return next(error)
    }

    user.password = req.body.password
    user.passwordResetToken = null
    user.passwordResetTokenExpires = null
    user.passwordChanged = Date.now()

    await user.save()

    const token = signToken(user.id)
    clearUser(user)

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    })

})

const updatePassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findOne({
        where: {
            id: req.user.id
        }
    })

    if(!(await User.comparePasswordInDb(req.body.currentPassword, user.password))) {
        const error = new CustomError('Incorrect current password', 401)
        return next(error)
    }

    if(User.validatePassword(req.body.password)) {
        const error = new CustomError('A senha deve ter entre 8 e 16 caracteres.', 400)
        return next(error)
    }

    user.password = req.body.password
    user.passwordChanged = Date.now()

    await user.save()

    const token = signToken(user.id)
    clearUser(user)

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
})

module.exports = {
    signup,
    login,
    protect,
    restrict,
    forgotPassword,
    resetPassword,
    updatePassword
}
