const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const URL = require('./env')

const placesRoutes = require('./routes/places-routes');
const usersRouts = require('./routes/users-routes')

const HttpError = require('./models/http-error')

const app = express();

app.use(bodyParser.json())

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin', '*'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origing, X-Requested-With, Content-Type, Accept, Authorizetion'
  )
  res.setHeader(
    'Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE'
  )

  next()
});

app.use('/api/places', placesRoutes)
app.use('/api/users/', usersRouts)

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404)
  throw error
})

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error)
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' })

})

const url = URL.URL

mongoose.connect(url)
  .then(
    app.listen(5000)
  )
  .catch(
    err => console.log(err)
  )
