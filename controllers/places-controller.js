const mongoose = require('mongoose')
const Place = require('../models/place')

const HttpError = require('../models/http-error')
const uuid = require('uuid/v4')
const { validationResult } = require('express-validator')
const getCoordsForAddress = require('../util/location')
const place = require('../models/place');
const User = require('../models/user')
const user = require('../models/user')


let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous scy  scrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
]

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
  const { title, description, address, creator } = req.body

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return next(new HttpError("Invalid inputs passed, please check your data.", 422))
  }
  
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
    image: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffarm7.staticflickr.com%2F6072%2F6119013601_44ca8a73bd_b.jpg&f=1&nofb=1",
    creator
  })

  let user;

  try {
    user = await User.findById(creator)
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
    return next(new HttpError('Could not find place for thid id.', 404))
  }

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

  res.status(200).json({ message: 'Deleted place.' })
}

//------------------------EXPORTS--------------------------------------------------------

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace