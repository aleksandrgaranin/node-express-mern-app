const HttpError = require('../models/http-error')
const User = require('../models/user')

const uuid = require('uuid/v4')
const { validationResult } = require('express-validator')

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Aleks Garanin",
    email: "alek@gmail.com",
    password: "testtest"
    // image: "https://aleksandrgaranin.github.io/images/ag.jpg",
    // places: 1,
  },
  {
    id: "u2",
    name: "Aleks G",
    email: "alekgg@gmail.com",
    password: "testtest"
    // image: "https://aleksandrgaranin.github.io/images/ag.jpg",
    // places: 2,
  }
]

//------------------------GET USERS--------------------------------------------------------

const getUsers = async (req, res, next) => {
  // const users = DUMMY_USERS
  let users
  try {
    users = await User.find({}, '-password')
  } catch (err) {
    const error = new HttpError("something went wrong, could not find Users.", 500)
    return next(error)
  }
  if (!users) {
    return next(new HttpError('No users found.', 404))
  }

  res.status(200).json({ users: users.map(user => user.toObject({ getters: true })) })
}


//------------------------SIGNUP USER--------------------------------------------------------

const singupUser = async (req, res, next) => {
  const { userName, email, password, places } = req.body

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    )
  }

  let existingUser

  try {
    existingUser = await User.findOne({ email: email })
  } catch (error) {
    console.log(error)
    return next(new HttpError("Signing up faild, please try again later ", 500))
  }

  if (existingUser) {
    return next(new HttpError("User exist already, please login instead", 422))
  }

  const createdUser = new User({
    name: userName,
    email,
    password,
    image: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%3Fid%3DOIP.0lSk-v5GFI2VgUcay9KbLwHaE7%26pid%3DApi&f=1",
    places
  })

  try {
    await createdUser.save()
  } catch (error) {
    return next(new HttpError("Could nor create User, email already exist", 422))
  }

  res.status(200).json({ user: createdUser.toObject({ getters: true }) })
}

//------------------------LOGIN USER--------------------------------------------------------

const loginUser = async(req, res, next) => {
  const { email, password } = req.body

  let existingUser

  try {
    existingUser = await User.findOne({ email: email })
  } catch (error) {
    console.log(error)
    return next(new HttpError("Logging is faild, please try again later ", 500))
  }
  
  if (!existingUser || existingUser.password !== password) {
    return next( new HttpError("Could not identify user, credentials seem to be wrong", 401))
  }
  res.json({ message: "logged In" })
}

exports.getUsers = getUsers
exports.singupUser = singupUser
exports.loginUser = loginUser