//Criando uma classe de error personalizada que estende da classe Error
class CustomError extends Error{
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

        this.isOperational = true; //erros operacionais são erros que podem ser previstos e devem ser tratados

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CustomError;

//Example: const error = new CustomError('some error message', 404)