const { Schema, model } = require('mongoose');


const exhibitionSchema = new Schema({
  projectId: String,
  title: String,
  authorType: String,
  authors: Array,
  coverImage: String,
  introVoiceover: String,
  introduction: String,
  content: [
    {
      sectionName: String,
      pages: [Object],
    },
  ],
  tableOfContent: Array,
  archiveDuration: String,
  schedule: Array,
  copyright: String,
  updatedAt: Date,
  createdAt: Date,
  publishedAt: Date,
  curatorialStage: String,
});

const commentSchema = new Schema({
  exhibition: String,
  where: String, // general or pageId
  userId: Schema.Types.ObjectId,
  comment: String,
  postedAt: Date,
  children: [
    {
      userId: Schema.Types.ObjectId,
      comment: String,
      postedAt: Date,
    },
  ],
});
commentSchema.index({ postedAt: -1 });

module.exports = {
  exhibition: model('exhibitions', exhibitionSchema),
  comment: model('comment', commentSchema),
};
