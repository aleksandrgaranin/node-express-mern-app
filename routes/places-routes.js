const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
    console.log('GET Request in Places');
    res.json({ massege: 'It works!' });
});


module.exports = router;