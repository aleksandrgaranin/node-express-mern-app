const mongoose = require('mongoose')
const fs = require('fs')
const Place = require('../models/place')
const aws = require('aws-sdk')

const HttpError = require('../models/http-error')
// const uuid = require('uuid/v4')
const { validationResult } = require('express-validator')
const getCoordsForAddress = require('../util/location')
const User = require('../models/user')


//------------------------GET PLACE BY ID--------------------------------------------------------

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    const error = new HttpError("something went wrong, could not find a place.", 500)
    return next(error)
  }

  if (!place) {
    return next(
      new HttpError('Could not find a place for provided id.', 404)
    )
  }

  res.json({ place: place.toObject({ getters: true }) });
}

//------------------------GET PLACE BY USER ID--------------------------------------------------------

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces

  try {
    userWithPlaces = await User.findById(userId).populate('places')
  } catch (err) {
    console.log(err)
    return next(new HttpError("Can not find any matches.", 500))
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError('Could not find a places for provided user id.', 404))
  }

  res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
}

//------------------------CREATE PLACE--------------------------------------------------------

const createPlace = async (req, res, next) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return next(new HttpError("Invalid inputs passed, please check your data.", 422))
  }

  const { title, description, address } = req.body
  // console.log(req.file)
  let coordinates
  try {
    coordinates = await getCoordsForAddress(address)
    // console.log('working', coordinates)
  } catch (error) {
    return next(error)
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.transforms[0].location, //maybe need req.gile.location
    creator: req.userData.userId
  })

  let user;

  try {
    user = await User.findById(req.userData.userId)
  } catch (error) {
    console.log(error)
    return next(new HttpError('could not find user for provided id', 500))
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404)
    return next(error)
  }

  console.log(user)

  try {
    // Session/Transaction
    const sess = await mongoose.startSession();//opens session
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    // Not standard is .push method of JS. 
    // This is mongoose push which establishing connection between the two models we are referring. 
    // Mongoose feature here and adds it to the place field of the User.
    await user.save({ session: sess });
    await sess.commitTransaction(); // commit session

  } catch (error) {
    console.log(error)
    return next(new HttpError('Creating place failed, pleace try again', 500))
  }

  res.status(201).json({ place: createdPlace })
}

//------------------------UPDATE PLACE--------------------------------------------------------

const updatePlace = async (req, res, next) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    throw new HttpError("Invalid inputs passed, please check your data.", 422)
  }

  const { title, description } = req.body
  const placeId = req.params.pid

  let place

  try {
    place = await Place.findById(placeId)
  } catch (err) {
    console.log(err)
    return next(new HttpError("Something went wrong, could not update place", 500))
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError('You are not allowed to edit this place.', 401))
  }

  place.title = title
  place.description = description

  try {
    await place.save()
  } catch (err) {
    console.log(err)
    return next(new HttpError("Something went wrong, could not update place", 500))
  }

  res.status(200).json({ place: place.toObject({ getters: true }) })
}

//------------------------DELETE PLACE--------------------------------------------------------

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid

  let place

  try {
    place = await Place.findById(placeId).populate('creator')
    // .populate() - allows as to refer to a document stored  other collection 
    // and work with data in that existing document
    // work only with {ref:...} in the model.js

  } catch (err) {
    console.log(err)
    return next(new HttpError("Something went wrong, could not delete place", 500))
  }

  if (!place) {
    return next(new HttpError('Could not find place for this id.', 404))
  }

  if (place.creator.id !== req.userData.userId) { // becose of .populate method 
    return next(new HttpError('You are not allowed to delete this place.', 401))
  }

  const imagePath = place.image

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await place.remove({ session: sess });

    place.creator.places.pull(place) // removing place from the user
    await place.creator.save({ session: sess });

    await sess.commitTransaction();

  } catch (error) {
    console.log(error)
    return next(new HttpError('Could not delete place, try again later', 500))
  }

  aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accsessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION
  })

  const s3 = new aws.S3()
  const key = imagePath.split('/')[3]
  // console.log(key)

  s3.deleteObject({
    Bucket: process.env.AWS_BUCKED_NAME,
    Key: key
  }
    , err => {
      console.log(err)
    })

  // fs.unlink(imagePath, err => {
  //   console.log(err)
  // })

  res.status(200).json({ message: 'Deleted place.' })
}

//------------------------EXPORTS--------------------------------------------------------

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace