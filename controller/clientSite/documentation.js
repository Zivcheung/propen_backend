const mongoose = require('mongoose');
const sharp = require('sharp');
const uuidv4 = require('uuid/v4');
const aws = require('aws-sdk');
const docModel = require('../../model/clientSite/documentation');
const userModel = require('../../model/clientSite/user');
const {serverError} = require('../../common/errorRes');
const io = require('./collaborationIO');


const s3 = new aws.S3({});

const createNewDocProject = (req, res) => {
  const projectData = req.body;
  const { user } = req;
  if (!projectData.projectName) {
    res.status(404);
    res.json({
      message: 'required field missing',
    });
    return;
  }
  // todo: check existence of members
  (async function dbUpdate() {
    const savedPjct = await docModel.Project.create({
      name: projectData.projectName,
      creator: user.email,
      members: projectData.members,
    });
    // add the project to all memebrs' bin
    const participants = [user.email].concat(projectData.members);
    const participantsPromise = [];
    for (let i = 0; i < participants.length; i++) {
      participantsPromise.push(docModel.UserProject.findOneAndUpdate({
        userEmail: participants[i],
      }, {
        $push: { projects: savedPjct._id},
      }, {
        upsert: true,
      }));
    }
    await Promise.all(participantsPromise);

    res.json({
      status: 'success',
      message: 'success',
    });
  }()).catch(err => serverError(err, res));
};

const getDocumentProjects = (req, res) => {
  const { user } = req;
  const query = [
    {
      $match: { userEmail: user.email },
    },
    {
      $unwind: '$projects',
    },
    {
      $lookup: {
        from: 'collaboration_projects',
        localField: 'projects',
        foreignField: '_id',
        as: 'linkedProjects',
      },
    },
    {
      $unwind: '$linkedProjects',
    },
    {
      $group: {
        _id: '$_id',
        userEmail: { $first: '$userEmail' },
        projects: { $push: '$linkedProjects' },
      },
    },
  ];
  docModel.UserProject.aggregate(query)
    .exec()
    .then((doc) => {
      const payload = doc[0];
      res.json(payload);
    })
    .catch(err => serverError(err, res));
};

const addNewProcess = (req, res) => {
  const { projectId, ...process } = req.body;
  const updateDoc = {
    name: process.name,
    startDate: new Date(process.startDate),
    endDate: new Date(process.endDate),
    methodName: process.methodName,
    concurrent: process.concurrent,
    compiled: false,
    contribution: [
    ],
  };
  docModel.Project.findOneAndUpdate({ _id: projectId }, {
    $push: {
      processes: updateDoc,
    },
  })
    .then((doc) => {
      $$io.to(projectId).emit('processUpdated');
      res.json({
        type: 'success',
        data: doc,
      });
    })
    .catch(err => serverError(err, res));
};

const getProcessesList = (req, res) => {
  const { projectId } = req.query;

  docModel.Project.findOne({ _id: projectId })
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.json({ type: 'success', message: 'no query found' });
      }
      const process = doc.processes.map((item) => {
        const p = {
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate,
          methodName: item.methodName,
          id: item._id,
          compiled: item.compiled,
        };
        return p;
      });
      res.json({
        type: 'success',
        data: process,
      });
    })
    .catch(err => serverError(err, res));
};

const uploadImage = (req, res) => {
  const image = req.file;
  const folderInfo = req.body;
  const fileName = `${folderInfo.projectId}_${image.originalname.replace(/\..*/, '')}_${uuidv4()}`;
  const folderPath = `${'documentation'}/${folderInfo.projectId}`;

  const bucketParam = {
    Bucket: 'propen.exhibition.resources',
    Key: `${folderPath}/${fileName}.webp`,
    ACL: 'public-read',
  };

  async function imageProcessing() {
    const size = {
      height: 350,
      width: 1440,
    };
    const oriImage = sharp(image.buffer);
    const imageinfo = await oriImage.metadata();
    if (imageinfo.width > 1440 || imageinfo.height > 600) {
      await oriImage.resize({
        width: size.width,
        height: size.height,
        fit: 'contain',
        background: {r:0,g:0,b:0,alpha:0},
      });
    }
    const processedImage = await oriImage.webp()
      .toBuffer();
    const awsRes = await s3.upload({
      ...bucketParam,
      Body: processedImage,
    }).promise();

    res.json({
      url: awsRes.Location,
      s3Key: awsRes.key,
    });
  }
  // run
  imageProcessing().catch((err) => {
    serverError(err, res);
  });
};

const publishDocument = (req, res) => {
  const data = req.body;
  const { content } = data;
  docModel.Document.findOneAndUpdate({ processId: data.processId }, {
    content,
    projectId: data.projectId,
  }, {
    upsert: true,
  }).then((doc) => {
    res.json({
      type: 'success',
      message: 'document has been uploaded',
      document: doc || `newDoc: ${content}`,
    });
  }).catch(err => serverError(err, res));
};

const getCompileDocument = (req, res) => {
  const processId = req.query.id;
  docModel.Document.findOne({ processId })
    .then((doc) => {
      res.json({
        type: 'success',
        document: doc,
      });
    })
    .catch(err => serverError(err));
};

module.exports = {
  createNewDocProject,
  getDocumentProjects,
  addNewProcess,
  getProcessesList,
  uploadImage,
  publishDocument,
  getCompileDocument,
};
