const mongoose = require('mongoose');
const sharp = require('sharp');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const cModel = require('../../model/manageSite/workflow');
const { serverError } = require('../../common/errorRes');


exports.getProjectList = (req, res) => {
  const { startFrom, pageNumber } = req.query;
  const pageSize = 5;

  let query;
  if (!startFrom) {
    query = {
      currentStage: { $not: { $eq: 'completed' } },
    };
  } else {
    query = {
      $and: [
        { currentStage: { $not: { $eq: 'completed' } } },
        { _id: { $lt: startFrom || '' } },
      ],
    };
  }

  (async function run() {
    const s1 = cModel.project.countDocuments(query).exec();
    const s2 = cModel.project.find(query)
      .skip((pageNumber - 1) * pageSize)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .exec();

    const totalNumber = await s1;
    const projectList = await s2;
    console.log(projectList);
    res.json({
      totalNumber,
      projectList,
    });
  }())
    .catch((err) => {
      serverError(err, res);
    });
};

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
  const projectId = mongoose.Types.ObjectId().toString();
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

exports.getCreateState = (req, res) => {
  const { projectId } = req.query;
  cModel.project.findOne({
    projectId,
  })
    .exec()
    .then((doc) => {
      const data = {
        title: doc.title,
        authorType: doc.authorType,
        authors: doc.authors,
        stage: doc.currentStage,
      };

      res.json({
        ...data,
      });
    })
    .catch((err) => {
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

/*
* --------------------------------------
* material collection state        ~  ~ |
* --------------------------------------
*/

exports.getTemplateOptions = (req, res) => {
  cModel.materialCollectionTemplate.find()
    .exec()
    .then((doc) => {
      console.log(doc);
      const optionList = doc.map((item) => {
        console.log(item.name);
        return item.name;
      });
      console.log(optionList);
      res.json({
        optionList,
      });
    })
    .catch((err) => {
      serverError(err, res);
    });
};

exports.getMaterialTemplate = (req, res) => {
  const { templateName } = req.query;
  const decodedName = decodeURIComponent(templateName);
  cModel.materialCollectionTemplate.findOne({ name: decodedName })
    .exec()
    .then((doc) => {
      console.log(doc);
      const template = [];
      const keys = Object.keys(doc.content);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        template.push({
          name: k,
          description: doc.content[k].description,
          state: 'unsubmitted',
        });
      }

      res.json({
        template,
      });
    })
    .catch((err) => {
      serverError(err, res);
    });
};

exports.saveCollectionList = (req, res) => {
  const { projectId, collectionList } = req.body;
  if (!projectId) {
    res.status(400);
    res.type('text/plain');
    res.send('request should have a projectId');
    console.log('request should have a projectId');
  }
  cModel.materialCollection.findOneAndUpdate({
    projectId,
  }, {
    projectId,
    collectionList,
  }, {
    upsert: true,
  })
    .exec()
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      serverError(err, res);
    });
};

exports.getMaterialCollection = (req, res) => {
  const { projectId } = req.query;

  cModel.materialCollection.findOne({
    projectId,
  })
    .exec()
    .then((doc) => {
      if (doc == null) {
        res.json(null);
      } else {
        res.json({
          collectionList: doc.collectionList,
        });
      }
    })
    .catch((err) => {
      serverError(err, res);
    });
};
/*
* --------------------------------------
* constructing state        ~  ~ |
* --------------------------------------
*/
exports.getConstructingStage = (req, res) => {
  const { projectId } = req.query;

  cModel.consContent.findOne({
    projectId,
  })
    .then((doc) => {
      if (!doc) {
        res.json(null);
        return;
      }
      res.json({
        tableOfContent: doc.tableOfContent,
        coverImage: doc.coverImage,
        introduction: doc.introduction,
        pages: doc.pages,
      });
    })
    .catch((err) => {
      serverError(err, res);
    });
};

// exports.postConstructContent = (req, res) => {
//   const { body } = req;
//   // need content validation
//   const data = {
//     projectId: body.porjectId,
//     // a list of section name in the table of Content
//     tableOfContent: body.tableOfContent,
//     pages: body.pages,
//   };

//   async function createConsContent() {
//     await cModel.consContent.create({
//       ...data,
//     });

//     res.status(200);
//     res.json({
//       projectId: data.projectId,
//     });
//   }

//   // run
//   createConsContent().catch((err) => {
//     serverError(err, res);
//   });
// };

exports.updateConstructContent = (req, res) => {
  const { body } = req;

  const data = {
    projectId: body.projectId,
    introduction: body.introduction,
    introVoiceover: body.introVoiceover,
    coverImage: body.coverImage,
    pages: body.pages,
    tableOfContent: body.tableOfContent,
  };
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
exports.uploadCoverImage = (req, res) => {
  const image = req.file;
  const folderInfo = req.body;
  const width = 3000;
  const height = 1688;
  const fileName = `${folderInfo.sectionName}_${image.originalname.replace(/\..*/, '')}_${uuidv4()}`;
  const folderPath = `${'projectContentImage'}/${folderInfo.project}`;

  const bucketParam = {
    Bucket: 'propen.exhibition.resources',
    Key: `${folderPath}/${fileName}.webp`,
    ACL: 'public-read',
  };
  async function imageProcessing() {
    const image2x = await sharp(image.buffer)
      .resize({
        width,
        height,
        fit: 'cover',
      })
      .webp()
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

exports.uploadContentImage = (req, res) => {
  const image = req.file;
  const folderInfo = req.body;
  const width = 780 * 2;
  const height = 585 * 2;
  const fileName = `${folderInfo.sectionName}_${image.originalname.replace(/\..*/, '')}_${uuidv4()}`;
  const folderPath = `${'projectContentImage'}/${folderInfo.project}`;

  const bucketParam = {
    Bucket: 'propen.exhibition.resources',
    Key: `${folderPath}/${fileName}.webp`,
    ACL: 'public-read',
  };
  async function imageProcessing() {
    const image2x = await sharp(image.buffer)
      .resize({
        width,
        height,
        fit: 'contain',
      })
      .webp()
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

/*
* --------------------------------------
* finish state        ~  ~ |
* --------------------------------------
*/
exports.updateFinishStage = (req, res) => {
  const { projectId, ...info } = req.body;

  cModel.finishInformation.findOneAndUpdate({
    projectId,
  }, {
    projectId,
    ...info,
  }, {
    upsert: true,
  })
    .exec()
    .then((doc) => {
      res.json({
        projectId: doc && doc.projectId,
      });
    })
    .catch((err) => {
      serverError(err, res);
    });
};
