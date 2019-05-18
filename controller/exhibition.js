const models = require('../model/exhibition');
const { serverError } = require('../common/errorRes');

// const eiModel = models.exhiIntroModel;

// exports.exhiIntro = (req, res) => {
//   const queryTitle = req.query.title;

//   eiModel.findOne(
//     {
//       title: queryTitle,
//     },
//   )
//     .exec()
//     .then((doc) => {
//       res.status(200);
//       res.json(doc);
//     })
//     .catch((err) => {
//       serverError(err, res);
//     });
// };
