const express = require('express');
const controller = require('../controller/exhibition');

const router = express.Router();


// get exhibition intro
router.get('/exhibitionIntro', controller.exhiIntro);

// router.put('/exhibitionIntro')

module.exports = router;
