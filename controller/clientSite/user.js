const mongoose = require('mongoose');
const passport = require('passport');
const Users = require('../../model/clientSite/user').users;
const UserProfile = require('../../model/clientSite/user').profiles;
const { serverError } = require('../../common/errorRes.js');


exports.userSignup = (req, res) => {
  const user = req.body;

  if (!user.email) {
    return res.status(422).json({
      errors: {
        email: 'required',
      },
    });
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        password: 'required',
      },
    });
  }

  const finalUser = new Users(user);
  finalUser.setPassword(user.password);
  const userProfile = new UserProfile({
    icon: '',
    gender: '',
  });

  (async function save() {
    const profile = await userProfile.save();
    finalUser.profile = profile._id;
    const savedUser = await finalUser.save();

    passport.authenticate('local', (err, passUser) => {
      if (err) throw err;
      req.login(passUser, () => {
        res.cookie('userStatus', 'login', {
          maxAge: 2 * 60 * 60 * 1000,
        });

        res.json({
          message: 'success',
          username: savedUser.username,
        });
      });
    })(req, res);
  }())
    .catch(err => serverError(err));
};

exports.userLogin = (req, res) => {
  const { user } = req;
  res.cookie('userStatus', 'login', {
    maxAge: 2 * 60 * 60 * 1000,
  });
  res.json({
    message: 'success',
    userIcon: user.profile.icon,
    username: user.username,
  });
};

exports.userLogout = (req, res) => {
  req.logOut();
  req.session.destroy();
  res.cookie('userStatus', 'login', {
    maxAge: -10000,
  });
  res.cookie('propen', '', {
    maxAge: -10000,
    httpOnly: true,
  });
  res.json({
    message: 'success',
  });
};

exports.getUserInfo = (req, res) => {
  const { user } = req;
  if (!user) {
    res.cookie('userStatus', 'login', {
      maxAge: -10000,
    });
    res.cookie('propen', '', {
      maxAge: -10000,
      httpOnly: true,
    });
    res.json({
      message: 'unmatched',
    });
    return;
  }
  res.json({
    username: user.username,
    userIcon: user.profile.icon,
  });
};
