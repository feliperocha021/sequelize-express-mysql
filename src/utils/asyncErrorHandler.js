/*Essa função retornada é o middleware que será usado nas rotas
O objetivo é envolver a função func e capturar erros e envia-los para o errorController(globalErrorHandler)
Utilizamos uma função anônima para que quando alguma função das rotas do controller for chamada o express executará
a função anônima e não a função asyncErrorHandler*/
module.exports = (func) => {
    return (req, res, next) => {  
        func(req, res, next).catch(err => next(err))  
    }
}