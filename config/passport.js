const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = require('../model/clientSite/user').users;

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
}, (email, password, done) => {
  Users.findOne({ email })
    .then((user) => {
      if (!user || !user.validatePassword(password)) {
        return done(null, false, { error: { 'email or password': 'is invalid' } });
      }
      console.log('auth success');
      return done(null, user);
    }).catch(err => done(err));
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Users.findById(id)
    .populate('profile', 'icon')
    .exec((err, user) => {
      done(err, user);
    });
});
