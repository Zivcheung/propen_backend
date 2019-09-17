const express = require('express');
const multer = require('multer');
const docController = require('../../controller/clientSite/documentation');

const router = express.Router();

const imageUpload = multer({});

// get exhibition intro
router.post('/newDocumentProject', docController.createNewDocProject);

router.get('/documentProjects', docController.getDocumentProjects);

router.get('/processesList', docController.getProcessesList);

router.get('/compileDocument', docController.getCompileDocument);

router.post('/imageUpload', imageUpload.single('file'), docController.uploadImage);

router.post('/publishDocument', docController.publishDocument);

router.post('/addNewProcess', docController.addNewProcess);

module.exports = router;
