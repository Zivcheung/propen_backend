const express = require('express');
const multer = require('multer');
const controller = require('../../controller/manageSite/workflow');

const router = express.Router();


// get exhibition intro

// get Project list (with length returned if specify length param)
router.get('/projectList', controller.getProjectList);

// create new project
router.post('/projectAndCreate', controller.postProjectAndCreate);
router.get('/createStage', controller.getCreateState);


// update stage
router.post('/updateStage', controller.updateStage);

// send available template options
router.get('/templateOptions', controller.getTemplateOptions);

router.get('/materialTemplate', controller.getMaterialTemplate);

router.post('/saveCollectionList', controller.saveCollectionList);

router.get('/materialCollection', controller.getMaterialCollection);


// update content
router.put('/constructContent', controller.updateConstructContent);
router.get('/constructingStage', controller.getConstructingStage);

// finish stage
router.post('/finishStage', controller.updateFinishStage);

// image upload handler
// content image handling
const cImageUpload = multer({});
const cAudioUpload = multer({});
router.post('/contentIllustration', cImageUpload.single('file'), controller.uploadContentImage);
router.post('/contentVoiceover', cAudioUpload.single('file'), controller.uploadContentVoiceover);
router.post('/coverImage', cAudioUpload.single('file'), controller.uploadCoverImage);


router.delete('/contentUpload', controller.deleteContentUpload);


// router.put('/exhibitionIntro')

module.exports = router;
