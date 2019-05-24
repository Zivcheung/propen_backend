const { Schema, model } = require('mongoose');
const crypto = require('crypto');

const userSchema = new Schema({
  email: String,
  username: String,
  hash: String,
  salt: String,
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'userProfiles',
  },
});

userSchema.methods.setPassword = function setPassword(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

userSchema.methods.validatePassword = function validatePassword(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};


const userProfileSchema = new Schema({
  icon: String,
  gender: String,
});
// userSchema.methods.generateJWT = function generateGWT() {
//   const today = new Date();
//   const expirationDate = new Date(today);
//   expirationDate.setHours(today.getHours() + 1);

//   return jwt.sign({
//     email: this.email,
//     id: this._id,
//     exp: parseInt(expirationDate.getTime() / 1000, 10),
//   }, 'propen');
// };

// userSchema.mehtods.toAuthJSON = function toAuthJSON() {
//   return {
//     id: this._id,
//     email: this.email,
//     token: this.generateJWT(),
//   };
// };


module.exports = {
  users: model('users', userSchema),
  profiles: model('userProfiles', userProfileSchema),
};
