const HttpError = require('../models/http-error')
const uuid = require('uuid/v4')

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

const getUsers = (req, res, next) => {
  const users = DUMMY_USERS
  if (!users) {
    throw new HttpError('No users found.', 404)
  }

  res.status(200).json({ users })
}

const singupUser = (req, res, next) => {
  const { userName, email, password } = req.body

  const hasUser = DUMMY_USERS.find(u => u.email === email)
  if (hasUser) {
    throw new HttpError("Could nor create User, email already exist", 422)
  }
  const newUser = {
    id: uuid(),
    name: userName,
    email,
    password
  }


  DUMMY_USERS.push(newUser);

  res.status(200).json({ user: newUser })
}

const loginUser = (req, res, next) => {
  const { email, password } = req.body

  const identifiedUser = DUMMY_USERS.find(u => u.email === email)
  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError("Could not identify user, credentials seem to be wrong", 401);
  }
  res.json({ message: "logged In" })
}

exports.getUsers = getUsers
exports.singupUser = singupUser
exports.loginUser = loginUser