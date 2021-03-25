const bcrypt = require('bcryptjs')

const HttpError = require('../models/http-error')
const User = require('../models/user')

const uuid = require('uuid/v4')
const { validationResult } = require('express-validator')

//------------------------GET USERS--------------------------------------------------------

const getUsers = async (req, res, next) => {
  // const users = DUMMY_USERS
  let users
  try {
    users = await User.find({}, '-password')
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find Users.", 500)
    return next(error)
  }

  if (!users) {
    return next(new HttpError('No users found.', 404))
  }

  res.status(200).json({ users: users.map(user => user.toObject({ getters: true })) })
}


//------------------------SIGNUP USER--------------------------------------------------------

const singupUser = async (req, res, next) => {
  const { userName, email, password } = req.body

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

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("Could not crearte user, olease try again. ", 500))
  }

  const createdUser = new User({
    name: userName,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: []
  })

  try {
    await createdUser.save()
  } catch (error) {
    return next(new HttpError("Could nor create User, email already exist", 422))
  }

  res.status(200).json({ user: createdUser.toObject({ getters: true }) })
}

//------------------------LOGIN USER--------------------------------------------------------

const loginUser = async (req, res, next) => {
  const { email, password } = req.body

  let existingUser


  try {
    existingUser = await User.findOne({ email: email })
  } catch (error) {
    console.log(error)
    return next(new HttpError("Logging is faild, please try again later ", 500))
  }

  if (!existingUser) {
    return next(new HttpError("Could not identify user, credentials seem to be wrong", 401))
  }

  let isValidPassword = false

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)

  } catch (error) {
    return next(new HttpError("Could not log you in, plese check your credentials and try again.", 500))
  }
  res.json({ message: "logged In", user: existingUser.toObject({ getters: true }) })
}

exports.getUsers = getUsers
exports.singupUser = singupUser
exports.loginUser = loginUser