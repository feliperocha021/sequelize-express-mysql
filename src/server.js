require('dotenv').config({path:'./.env'}) // acesso as variaveis de ambiente
const express =  require('express')
const cors = require('cors')
const app = express()

/*
Tratamento de erros síncronos
OBS: se houver algum erro síncrono no express o globalErrorHandler irá tratar esse erro
*/
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message)
  console.log('Uncaught exception occured! Shutting down...')
  process.exit(1)
})

const productRouter = require('./routes/productRouter')
const reviewRouter = require('./routes/reviewRouter')
const authRouter = require('./routes/authRouter')
const CustomError = require('./utils/CustomError')
const globalErrorHandler = require('./controllers/errorController')

let corsOptions = {
  origin: 'https://localhost:3000'
}

//middlewares
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//routes
app.use('/api/v1/products', productRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/users', authRouter)

//invalids routes
app.all('*', (req, res, next) => {
  // forma simples:
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on the server`
  // })

  // forma simples:
  // const err = new Error(`Can't find ${req.originalUrl} on the server`)
  // err.status = 'fail'
  // err.statusCode = 404

  // forma ideal:
  const err = new CustomError(`Can't find ${req.originalUrl} on the server`, 404)

  return next(err) //ignora todos os outros middlewares da pilha e vai para o middleware de tratamento global
})

//global error handler middleware
app.use(globalErrorHandler)

//test api
/* app.get('/', (req, res) => {
    res.json({ message: ' hello world!'})   
})
*/

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
    console.log('Server is running in port ' + port)
})

//Caso a conexão com o banco de dados falhe(erros de promessas) encerramos o aplicativo
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message)
  console.log('Unhandled rejection occured! Shutting down...')
  //espera o servidor tratar as solicitações pendentes para depois encerra o mesmo
  server.close(() => {
      process.exit(1)
  })
})