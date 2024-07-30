const CustomError = require('../utils/CustomError') 

const devErros = (error, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stackTracer: error.stack,
    error: error
  })
}

const tipagemErrorHandler = (error) => {
  const string = error.parent.sqlMessage
  const posicaoAt = string.indexOf("at")
  const message = string.substring(0, posicaoAt).trim();
  return new CustomError(message, 400)
}

const duplicateKeyErrorHandler = (error) => {
  let msg = ''
  for(const err in error.errors) {
    msg = msg + error.errors[err].message + ' '
  }
  return new CustomError(msg, 400)
}

const nullErrorHandler = (error) => {
  let msg = ''
  for(const err in error.errors) {
    msg = msg + error.errors[err].message + ' '
  }
  return new CustomError(msg, 400)
}

const validationErrorHandler = (error) => {
  let msg = ''
  for(const err in error.errors) {
    msg = msg + error.errors[err].message + ' '
  }
  return new CustomError(msg, 400)
}

const tokenExpiredErrorHandler = (error) => {
  return new CustomError('Token jwt has expired. Please login again.', 401)
}

const tokenErrorHandler = (error) => {
  return new CustomError('Invalid token. Please login again.', 401)
}

const prodErros = (error, res) =>  {
  if(error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    })
  } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong! Please try again later.'
      })
  }

}

//middleware de tratamento global de erros
module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500
    error.status = error.status || 'error'
    console.log(error)
    //exibição mais detalhada do erro para o processo de desenvolvimento
    if(process.env.NODE_ENV === 'development') {
      devErros(error, res)
    //exibição mais simples do erro para o cliente
    } else if(process.env.NODE_ENV === 'production') {
      //err não vai possuir a propriedade message, pois a mesma pertence ao CustomError
      //let err = {...error} //Atenção: propriedades não enumeráveis não serão copiadas
      //erros gerados pelo SequelizeDatabaseError sendo tratados abaixo
      if(error.name) {
        if(error.name === 'TokenExpiredError') {
          error = tokenExpiredErrorHandler(error)
          return prodErros(error, res)
        }
        if(error.name === 'JsonWebTokenError') {
          error = tokenErrorHandler(error)
          return prodErros(error, res)
        }
        if(error.parent) {
          if(error.parent.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
            error = tipagemErrorHandler(error)
            return prodErros(error, res)
          }
          if(error.parent.code === 'ER_DUP_ENTRY') {
            error = duplicateKeyErrorHandler(error)
            return prodErros(error, res)
          }
        }
        if(error.errors) {
          if(error.errors[0].type === 'notNull Violation') {
            error = nullErrorHandler(error)
            return prodErros(error, res)
          }
          if(error.errors[0].type === 'Validation error') {
            error = validationErrorHandler(error)
            return prodErros(error, res)
          }
        }
      }
      return prodErros(error, res)
    }
}
