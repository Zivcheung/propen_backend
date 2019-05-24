const express = require('express');
const controller = require('../../controller/clientSite/exhibition');

const router = express.Router();


// get exhibition intro
router.get('/galleryList', controller.getGalleryList);

// get introduction page
router.get('/exhibitionIntroduction', controller.getExhibitionIntroduction);
router.get('/exhibitionContent', controller.getExhibitionContent);
router.post('/exhibitionComment', controller.postComment);
router.get('/exhibitionComment', controller.getComment);

module.exports = router;
