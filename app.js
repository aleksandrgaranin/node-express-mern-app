const fs = require('fs')
const path = require('path')

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const placesRoutes = require('./routes/places-routes');
const usersRouts = require('./routes/users-routes')

const HttpError = require('./models/http-error')

const app = express();

app.use(bodyParser.json())

app.use('/uploads/images', express.static(path.join('uploads', 'images')))

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin', '*'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origing, X-Requested-With, Content-Type, Accept, Authorization'
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
  if (req.file) {

    aws.config.update({
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      accsessKeyId: process.env.AWS_ACCESS_KEY_ID,
      region: process.env.AWS_REGION
    })

    const s3 = new aws.S3()
    const key = file.location.split('/')[3]
    // console.log(key)

    s3.deleteObject({
      Bucket: process.env.AWS_BUCKED_NAME,
      Key: key
    }, err => {
      console.log(err)
    })
    // fs.unlink(req.file.path, (err) => {
    //   console.log(err)
    // })
  }
  if (res.headerSent) {
    return next(error)
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' })

})

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.idapp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
  .then(
    app.listen(process.env.PORT || 5000)
  )
  .catch(
    err => console.log(err)
  )
