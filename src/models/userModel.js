const bcrypt = require('bcryptjs')
const crypto = require('crypto')

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'O campo nome é obrigatório.'
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                msg: 'Este e-mail já está em uso.'
            },
            validate: {
                isEmail: {
                    msg: 'Por favor, insira um endereço de e-mail válido.'
                }
            }
        },
        role: {
            type: DataTypes.STRING,
            enum: ['user', 'admin'],
            defaultValue: 'user',
            validate: {
                isIn: [['user', 'admin']]
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        passwordChanged: {
            type: DataTypes.DATE
        },
        passwordResetToken: {
            type: DataTypes.STRING
        },
        passwordResetTokenExpires: {
            type: DataTypes.DATE
        }
    },
    {
        timestamps: true,
        freezeTableName: true, // Impede que o Sequelize pluralize o nome da tabela
        hooks: {
            beforeCreate: async function (user) {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 8)
                }
            },
            beforeUpdate: async function (user) {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 8)
                }
            }
        }
    })

    User.validatePassword = function (password) {
        const minLength = 8;
        const maxLength = 16;
    
        if (password.length >= minLength && password.length <= maxLength) {
            return false
        }
        return true
    }

    User.comparePasswordInDb = async function (password, passwordDB) {
        return await bcrypt.compare(password, passwordDB)
    }

    User.isPasswordChanged = async function (JWTTimestamp, user) {
        if(user.passwordChanged) {
            const pswdChangedTimestamp = parseInt(user.passwordChanged.getTime() / 1000, 10) //transforma a data e hora em carimbo de data e hora em segundos e depois divide por 1000 na base 10 para milisegundos

            return (JWTTimestamp < pswdChangedTimestamp)
        }
        return false
    }

    User.createResetTokenPswd = function (user) {
        const resetToken = crypto.randomBytes(32).toString('hex')
        
        //criptografando o token de redifinição de senha para evitar que hackers alterem a senha do usuário
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        user.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000

        return { resetToken, passwordResetToken: user.passwordResetToken, passwordResetTokenExpires: user.passwordResetTokenExpires }
    }

    return User
}