const mongoose = require('mongoose')
const Place = require('../models/place')

const HttpError = require('../models/http-error')
const uuid = require('uuid/v4')
const { validationResult } = require('express-validator')
const getCoordsForAddress = require('../util/location')
const place = require('../models/place')


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

  rres.json({ places: place.toObject({ getters: true }) });
}

//------------------------GET PLACE USER ID--------------------------------------------------------

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places

  try {
    places = await Place.find({ creator: userId }).exec()
  } catch (err) {
    console.log(err)
    return next(new HttpError("Can not find any matches.", 500))
  }

  if (!places || places.length === 0) {
    return next(new HttpError('Could not find a places for provided user id.', 404))
  }

  res.json({ places: places.map(place => place.toObject({ getters: true })) });
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
    // console.log('workin', coordinates)
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

  try {
    await createdPlace.save()
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

  // const updatedPlace = { ...DUMMY_PLACES.find(p => p.id === placeId) }

  // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId)

  place.title = title
  place.description = description

  try {
    await place.save()
  } catch (error) {
    console.log(err)
    return next(new HttpError("Something went wrong, could not update place", 500))
  }

  res.status(200).json({ place: place.toObject({getters: true}) })
}

//------------------------DELETE PLACE--------------------------------------------------------

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid
  if (!DUMMY_PLACES.find(p => p.id === placeId)) {
    throw new HttpError("Could not find a place for that id", 404)
  }
  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId)
  res.status(200).json({ message: 'Deleted place.' })
}

//------------------------EXPORTS--------------------------------------------------------

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace