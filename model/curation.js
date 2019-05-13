const { Schema, model } = require('mongoose');



/* sub-document */

// sub-doc for exhibition table
const tableOfContent = new Schema({
  title: String,
  // link to content page or pages, one section may contain numbers of page
  content: Array,
});

// sub-doc for contnetPate
const content3D = new Schema({
  illustration: String, // link to image basket
  description: String,
  voiceOver: String, // link to audio basket
});


/* parent document */
const exhibitionIntro = new Schema({
  title: {
    type: String,
    default: 'unset title',
  },
  authorType: String,
  designer: Array,
  abstract: String, // article
  voiceOver: String, // audio address
  // rate is separate with sum and number
});

// including sub-document tableOfcontent
const exhibitionTable = new Schema({
  table: [tableOfContent],
});

// content page
const exhibitionContentPage = new Schema({
  content: [content3D],
});

/* parent document */
const exhiIntroModel = model('exhiIntro', exhibitionIntro, 'exhiIntro');
const exhiTable = model('exhiTable', exhibitionTable);
const exhiContentPage = model('exhiContentPage', exhibitionContentPage);

module.exports = {
  exhiIntroModel,
  exhiTable,
  exhiContentPage,
};
