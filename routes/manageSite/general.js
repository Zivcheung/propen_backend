const express = require('express');
const controller = require('../../controller/manageSite/general');

const router = express.Router();


// publish exhibition
router.post('/publishExhibition', controller.publishExhibition);

// get exhibition list for manage gallery page
router.get('/galleryList', controller.getGalleryList);

module.exports = router;
