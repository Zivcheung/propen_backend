const { model, Schema } = require('mongoose');

const projectSchema = new Schema({
  title: String,
  currentStage: String,
  projectId: Schema.Types.ObjectId,
  authors: Array,
  authorType: String,
  coverImage: String,
  voiceOver: String,
  introduction: String,
}, {
  timestamps: { createdAt: 'created_at' },
});

// step 3 constructing

const consContentSchema = {
  projectId: String,
  // a list of section name in the table of Content
  tableOfContent: [String],
  pages: [
    {
      sectionName: String,
      pageNumber: Number,
      illustrations: [{
        name: String,
        url: String,
      }],
      description: String,
      voiceOver: String,
    },
  ],
};

exports.project = model('manage/project', projectSchema);

exports.consContent = model('manage/consContent', consContentSchema);
