const express = require('express');
const multer = require('multer');
const controller = require('../../controller/manageSite/workflow');

const router = express.Router();


// get exhibition intro

// create new project
router.post('/projectAndCreate', controller.postProjectAndCreate);

// adding content
// router.post('/constructContent', controller.postConstructContent);

// update content
// router.put('/constructContent', controller.updateConstructContent);

// image upload handler
// content image handling
const cImageUpload = multer({});
const cAudioUpload = multer({});
router.post('/contentIllustration', cImageUpload.single('file'), controller.uploadContentImage);
router.post('/contentVoiceover', cAudioUpload.single('file'), controller.uploadContentVoiceover);

// router.put('/exhibitionIntro')

module.exports = router;
