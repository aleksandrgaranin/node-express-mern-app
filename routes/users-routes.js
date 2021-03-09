const express = require('express');

const router = express.Router();

const DUMMY_USER = [
  {
    id: "u1",
    name: "Aleks Garanin",
    image: "https://aleksandrgaranin.github.io/images/ag.jpg",
    places: 1,
  }
]


router.get('/:uid', (req, res, next) => {
  const userId = req.params.uid;
  
  const user = DUMMY_USER.find(user => {
    return user.id === userId
  })
  console.log('GET Request in Users');
  res.json({user})
})


module.exports = router