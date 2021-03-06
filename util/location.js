const axios = require('axios')
const { loginUser } = require('../controllers/users-controllers')
const HttpError = require('../models/http-error')

const API_KEY = process.env.GOOGLE_API_KEY

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
  )
  // console.log(response.data.results[0].geometry.location)
  const data = response.data
  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError('Could not find location for the specified address', 422)
    throw error
  }

  const coordinates = data.results[0].geometry.location
  // console.log(coordinates);
  return coordinates
}

module.exports = getCoordsForAddress