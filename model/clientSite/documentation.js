const { Schema, model } = require('mongoose');

// project collection has basic information of a project needed
const projectSchema = new Schema({
  name: String,
  creator: String,
  members: [String],
  createdAt: Date,
  state: String, // ongoing or complete
  processes: [
    {
      name: String,
      startDate: Date,
      endDate: Date,
      methodName: String,
      concurrent: String,
      compiled: Boolean,
      contribution: [
        {
          fileType: String,
          name: String,
          url: String,
        },
      ],
      compiledDocument: Object,
    },
  ],
});

// user project collection stores users' project
const userProjectSchema = new Schema({
  userEmail: String, // objectId string of the user
  projects: [Schema.Types.ObjectId], // objectId string
  invitation: [String], // pending invitation
});
userProjectSchema.index({
  userEmail: 1,
});

const documentSchema = new Schema({
  content: String,
  projectId: String,
  processId: String,
});
/*
* -------------
* MODEL
* -------------
*/
module.exports = {
  Project: model('collaboration_projects', projectSchema),
  UserProject: model('collaboration_userprojects', userProjectSchema),
  Document: model('collaboration_documents', documentSchema),
};
