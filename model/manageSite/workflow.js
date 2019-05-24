const { model, Schema } = require('mongoose');

const projectSchema = new Schema({
  title: String,
  currentStage: String,
  projectId: String,
  authors: Array,
  authorType: String,
}, {
  timestamps: { createdAt: 'createdAt' },
});

projectSchema.index({ createdAt: -1 });

// step 3 constructing

const consContentSchema = {
  projectId: String,
  // intro page
  coverImage: String,
  introVoiceover: String,
  introduction: String,

  // a list of section name in the table of Content
  tableOfContent: [String],
  pages: [
    {
      sectionName: String,
      pageNumber: Number,
      pageName: String,
      illustrations: [{
        name: String,
        url: String,
      }],
      description: String,
      voiceover: String,
    },
  ],
};

const materialCollectionTemplate = {
  name: String,
  content: Object,
};

const materialCollection = {
  projectId: String,
  collectionList: Array,
};

const finishInformation = {
  projectId: String,
  schedule: [String],
  archiveDuration: String,
  copyright: String,
  authorizationAgreement: String,
  // opening night
};

exports.project = model('manage/exhibition_projects', projectSchema);

exports.materialCollectionTemplate = model('manage/material_collection_template',
  materialCollectionTemplate,
  'manage/material_collection_template');

exports.materialCollection = model('manage/material_collection',
  materialCollection,
  'manage/material_collection');

exports.consContent = model('manage/construct_contents', consContentSchema);

exports.finishInformation = model('manage/finish_information', finishInformation);
