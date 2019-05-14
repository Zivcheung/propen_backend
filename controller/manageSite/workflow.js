const mongoose = require('mongoose');
const cModel = require('../../model/manageSite/workflow');
const { serverError } = require('../../common/errorRes');
const sharp = require('sharp');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');

exports.postProjectAndCreate = (req, res) => {
  const data = req.body;
  // update
  if (data.projectId) {
    cModel.project.findOneAndUpdate({
      projectId: data.projectId,
    }, {
      title: data.title,
      currentStage: data.currentStage,
      authors: data.authors,
      authorType: data.authorType,
    })
      .then(() => {
        res.json({
          projectId: data.projectId,
        });
      })
      .catch((err) => {
        serverError(err, res);
      });
    return;
  }
  // create
  const projectId = mongoose.Types.ObjectId();
  async function createDoc() {
    await cModel.project.create({
      title: data.title,
      currentStage: data.currentStage,
      projectId,
      authors: data.authors,
      authorType: data.authorType,
    });
    res.status(200);
    res.json({
      projectId,
    });
  }
  // run async
  createDoc().catch((err) => {
    serverError(err, res);
  });
};

exports.updateStage = (req, res) => {
  const { stage } = req.body;

  cModel.project.findOneAndUpdate({
    // query
    projectId: req.body.projectId,
  }, {
    // update
    currentStage: stage,
  }, {
    // opt
    runValidators: true,
  })
    .exec()
    .then((d) => {
      res.json({
        stage: d,
      });
    })
    .catch((err) => {
      serverError(err, res);
    });
};

exports.postConstructContent = (req, res) => {
  const { body } = req;
  // need content validation
  const data = {
    projectId: body.porjectId,
    // a list of section name in the table of Content
    tableOfContent: body.tableOfContent,
    pages: body.pages,
  };

  async function createConsContent() {
    await cModel.consContent.create({
      ...data,
    });

    res.status(200);
    res.json({
      projectId: data.projectId,
    });
  }

  // run
  createConsContent().catch((err) => {
    serverError(err, res);
  });
};

exports.updateConstructContent = (req, res) => {
  const { body } = req;

  const data = {
    projectId: body.projectId,
    introduction: body.introduction,
    introVoice: body.introVoice,
    coverImage: body.coverImage,
    pages: body.pages,
    tableOfContent: body.tableOfContent,
  };
  console.log(body);
  cModel.consContent.findOneAndUpdate({ projectId: body.projectId }, {
    ...data,
  }, {
    runValidators: true,
    maxTimeMS: 60 * 1000,
    upsert: true,
  }).exec()
    .then(() => {
      console.log('success');
      res.status = 200;
      res.json({
        projectId: body.projectId,
      });
    })
    .catch((err) => {
      console.log('fail');
      serverError(err, res);
    });
};

// s3 image and audio upload;
const s3 = new aws.S3({
});
exports.uploadContentImage = (req, res) => {
  const image = req.file;
  const folderInfo = req.body;
  const width = 780 * 2;
  const height = 585 * 2;
  const fileName = `${folderInfo.sectionName}_${image.originalname.replace('.png', '')}_${uuidv4()}`;
  const folderPath = `${'projectContentImage'}/${folderInfo.project}`;

  const bucketParam = {
    Bucket: 'propen.exhibition.resources',
    Key: `${folderPath}/${fileName}.png`,
    ACL: 'public-read',
  };
  async function imageProcessing() {
    const image2x = await sharp(image.buffer)
      .resize({
        width,
        height,
        fit: 'contain',
      })
      .png()
      .toBuffer();
    const awsRes = await s3.upload({
      ...bucketParam,
      Body: image2x,
    }).promise();

    res.json({
      url: awsRes.Location,
      s3Key: awsRes.key,
    });
  }

  imageProcessing().catch((err) => {
    serverError(err, res);
  });
};

exports.uploadContentVoiceover = (req, res) => {
  const voiceover = req.file;
  const folderInfo = req.body;
  const fileName = `${folderInfo.sectionName}_${voiceover.originalname.replace(/\..*$/, '')}_${uuidv4()}.m4a`;
  const folderPath = `${'projectContentVoiceover'}/${folderInfo.project}`;
  console.log(voiceover);
  const bucketParam = {
    Bucket: 'propen.exhibition.resources',
    Key: `${folderPath}/${fileName}`,
    ACL: 'public-read',
  };
  async function audioupload() {
    const awsRes = await s3.upload({
      ...bucketParam,
      Body: voiceover.buffer,
    }).promise();
    res.json({
      url: awsRes.Location,
      s3Key: awsRes.Key,
    });
  }

  audioupload().catch((err) => {
    serverError(err, res);
  });
};

exports.deleteContentUpload = (req, res) => {
  const s3Key = decodeURIComponent(req.query.key);
  const bucketParam = {
    Bucket: 'propen.exhibition.resources',
    Key: s3Key,
  };
  async function deleteFile() {
    await s3.deleteObject({
      ...bucketParam,
    }).promise();

    res.end();
  }

  deleteFile().catch((err) => {
    serverError(err, res);
  });
};
