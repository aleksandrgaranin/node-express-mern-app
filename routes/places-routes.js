const express = require('express');
const { check } = require('express-validator')
const fileUpload = require('../middleware/file-upload')
const chackAuth = require('../middleware/check-auth')

const placesControllers = require('../controllers/places-controller')

const router = express.Router();

router.get('/:pid', placesControllers.getPlaceById);
router.get('/user/:uid', placesControllers.getPlacesByUserId)

router.use(chackAuth) // bloking middleware to continue to other routes

router.post('/',
  fileUpload.single('image'),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty()
  ],
  placesControllers.createPlace)
router.patch('/:pid',
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
  ],
  placesControllers.updatePlace)
router.delete('/:pid', placesControllers.deletePlace)


module.exports = router;