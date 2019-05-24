const mongoose = require('mongoose');
const _ = require('lodash');
const eModel = require('../../model/exhibition');
const { serverError } = require('../../common/errorRes');
const escape = require('escape-html');

exports.getGalleryList = (req, res) => {
  const { startFrom, pageNumber } = req.query;
  const pageSize = 20;
  console.log(req.user);
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
      .sort({ publishedAt: -1 })
      .limit(pageSize)
      .exec();

    const totalNumber = await s1;
    const fglist = await s2;
    const galleryList = fglist.map((item) => {
      const desired = {
        title: item.title,
        publishedAt: item.publishedAt,
        _id: item._id,
        projectId: item.projectId,
        authors: item.authors,
        coverImage: item.coverImage,
        introduction: item.introduction,
      };
      return desired;
    });
    res.json({
      totalNumber,
      galleryList,
    });
  }())
    .catch((err) => {
      serverError(err, res);
    });
};

exports.getExhibitionIntroduction = (req, res) => {
  // the generated exhibition id is used here instead of projectId
  let { exhibitionId } = req.query;
  exhibitionId = decodeURIComponent(exhibitionId);

  eModel.exhibition.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(exhibitionId),
      },
    },
    {
      $project: {
        title: 1,
        introduction: 1,
        introVoiceover: 1,
        authors: 1,
        authorType: 1,
        coverImage: 1,
        // review
        // partner
      },
    },
  ]).exec()
    .then((doc) => {
      res.json(doc[0]);
    })
    .catch((err) => {
      serverError(err, res);
    });
};

exports.getExhibitionContent = (req, res) => {
  // the generated exhibition id is used here instead of projectId
  let id = decodeURIComponent(req.query.id);

  eModel.exhibition.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(id),
      },
    },
    {
      $project: {
        tableOfContent: 1,
        content: 1,
        projectId: 1,
      },
    },
  ]).exec()
    .then((doc) => {
      res.json(doc[0]);
    })
    .catch((err) => {
      serverError(err, res);
    });
};

exports.postComment = (req, res) => {
  const { user } = req;
  const comment = req.body;
  if (!user) {
    // global relogin intercepter
    res.status(401);
    res.end();
  }
  if (comment.type === 'NEW_POST') {
    return eModel.comment.create({
      exhibition: comment.exhibitionId,
      where: comment.where, // general or pageId
      userId: mongoose.Types.ObjectId(user._id),
      comment: comment.comment,
      postedAt: new Date(),
      children: [],
    })
      .then((doc) => {
        console.log(doc);
        res.json({
          userId: doc.userId,
          comment: doc.comment,
        });
      })
      .catch(err => serverError(err, res));
  }
  if (comment.type === 'FOLLOW_POST') {
    console.log(comment);
    return eModel.comment.findOneAndUpdate({
      _id: comment.originPostId,
    }, {
      $push: {
        children: {
          comment: comment.comment,
          userId: mongoose.Types.ObjectId(user._id),
          postedAt: new Date(),
        },
      },
    })
      .then((doc) => {
        res.json({
          message: 'success',
        });
      })
      .catch(err => serverError(err, res));
  }

  res.status(404);
  res.send({
    message: 'unidentified comment type',
  });
};

exports.getComment = (req, res) => {
  const { query } = req;
  console.log(query);
  const aggregateQuery = [
    {
      $match: {
        exhibition: query.exhibitionId,
        where: query.where,
      },
    },
    {
      $unwind: {
        path: '$children',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $lookup: {
        from: 'users',
        localField: 'children.userId',
        foreignField: '_id',
        as: 'children.user',
      },
    },
    {
      $unwind: {
        path: '$children.user',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'userprofiles',
        localField: 'user.profile',
        foreignField: '_id',
        as: 'userProfile',
      },
    },
    {
      $unwind: '$userProfile',
    },
    {
      $lookup: {
        from: 'userprofiles',
        localField: 'children.user.profile',
        foreignField: '_id',
        as: 'children.userProfile',
      },
    },
    {
      $unwind: {
        path: '$children.userProfile',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        comment: { $first: '$comment' },
        userId: { $first: '$user._id' },
        username: { $first: '$user.username' },
        userIcon: { $first: '$profile.icon' },
        postedAt: { $first: '$postedAt' },
        children: {
          $push: {
            $cond: {
              if: { $not: ['$children.comment'] },
              then: null,
              else: {
                userId: '$children.user._id',
                username: '$children.user.username',
                userIcon: '$children.profile.icon',
                comment: '$children.comment',
              },
            },
          },
        },
      },
    },
    {
      $sort: {
        postedAt: -1,
      },
    },
  ];
  eModel.comment.aggregate(aggregateQuery)
    .exec()
    .then((doc) => {
      const flattenComments = doc.map((item) => {
        const flatten = [];
        flatten.push(_.omit(item, ['children']));
        return item.children[0] ? flatten.concat(item.children) : flatten;
      });
      res.json({
        flattenComments,
      });
    })
    .catch(err => serverError(err, res));
};
