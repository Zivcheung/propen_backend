const mongoose = require('mongoose');
const eModel = require('../../model/exhibition');
const cModel = require('../../model/manageSite/workflow');
const { serverError } = require('../../common/errorRes');


exports.publishExhibition = (req, res) => {
  const { projectId } = req.body;
  const aggregateQuery = [
    {
      $lookup: {
        from: 'manage/construct_contents',
        localField: 'projectId',
        foreignField: 'projectId',
        as: 'contents',
      },
    },
    {
      $lookup: {
        from: 'manage/finish_informations',
        localField: 'projectId',
        foreignField: 'projectId',
        as: 'details',
      },
    },
    { $unwind: '$contents' },
    { $unwind: '$details' },
    { $match: { projectId } },
    {
      $project: {
        projectId: 1,
        title: 1,
        authorType: 1,
        authors: 1,
        coverImage: '$contents.coverImage',
        introduction: '$contents.introduction',
        introVoiceover: '$contents.introVoiceover',
        pages: '$contents.pages',
        tableOfContent: '$contents.tableOfContent',
        archiveDuration: '$details.archiveDuration',
        copyright: '$details.copyright',
        schedule: '$details.schedule',
        updatedAt: 1,
        createdAt: 1,
      },
    },
  ];
  function orgnizePages(pages, tableOfContent) {
    // function to load every pages to its proper location
    const tocBin = tableOfContent.reduce((acc, cur) => {
      acc[cur] = [];
      return acc;
    }, {});

    pages.forEach((item) => {
      tocBin[item.sectionName][item.pageNumber - 1] = item;
    });

    const done = tableOfContent.map(sect => ({
      sectionName: sect,
      pages: tocBin[sect],
    }));
    console.log(done);
    return done;
  }
  async function run() {
    // merge all metadata into exhibition data
    const exhibitionData = await cModel.project.aggregate(aggregateQuery).exec();
    // complete stage
    await cModel.project.findOneAndUpdate({
      projectId,
    }, {
      currentStage: 'completed',
    }).exec();
    const doc = await eModel.exhibition.create({
      ...exhibitionData[0],
      publishedAt: new Date(),
      content: orgnizePages(exhibitionData[0].pages, exhibitionData[0].tableOfContent),
      curatorialStage: 'exhibited',
    });
    res.json({
      ...doc,
    });
  }

  run().catch((err) => {
    serverError(err, res);
  });
};

exports.getGalleryList = (req, res) => {
  const { startFrom, pageNumber } = req.query;
  const pageSize = 20;

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
    const s1 = eModel.exhibition.countDocuments(query).exec();
    const s2 = eModel.exhibition.find(query)
      .skip((pageNumber - 1) * pageSize)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .exec();

    const totalNumber = await s1;
    const galleryList = await s2;
    console.log(galleryList);
    res.json({
      totalNumber,
      galleryList,
    });
  }())
    .catch((err) => {
      serverError(err, res);
    });
};
