require('dotenv').config();
const nodemailer = require('nodemailer')

//utlizando o site malitrap para visualizar os emails teste enviados
const sendEmail = async (option) => {
    //create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    //define email options
    const emailOptions = {
        from: 'Estoque wave support<support@estoquewave.com>',
        to: option.email,
        subject: option.subject,
        text: option.message
    }

    await transporter.sendMail(emailOptions)
}

module.exports = sendEmail