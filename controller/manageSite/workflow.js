const mongoose = require('mongoose');
const cModel = require('../../model/manageSite/workflow');
const { serverError } = require('../../common/errorRes');
const sharp = require('sharp');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');

exports.postProjectAndCreate = (req, res) => {
  const data = req.body;
  const projectId = mongoose.Types.ObjectId();

  async function createDoc() {
    await cModel.project.create({
      title: data.title,
      currentStage: 'material_collection',
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

exports.postConstructContent = (req, res) => {
  const body = req.body;
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
  const body = req.body;

  const data = {
    projectId: body.porjectId,
    // a list of section name in the table of Content
    tableOfContent: body.tableOfContent,
    pages: body.pages,
  };

  cModel.consContent.update({ projectId: data.projectId }, {
    ...data,
  })
    .then(() => {
      res.status = 200;
      res.json({
        projectId: data.projectId,
      });
    })
    .catch((err) => {
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
    });
  }

  audioupload().catch((err) => {
    serverError(err, res);
  });
};
