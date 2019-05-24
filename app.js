const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');

// install user model and password middleware
require('./config/passport');
require('./model/clientSite/user');

/* database */
const mongoose = require('mongoose');

// deprecation patch
mongoose.set('useFindAndModify', false);

/* routers */
const exhibitionRouter = require('./routes/clientSite/exhibition');
const indexRouter = require('./routes/index');
const clientUserRouter = require('./routes/clientSite/user');

// manage site router
const workflow = require('./routes/manageSite/workflow');
const general = require('./routes/manageSite/general');

// initiate express
const app = express();

// initiate mongoose
const uri = 'mongodb+srv://tianzhu:mimipao123%2C.%2F@cluster0-ekakp.mongodb.net/propen';
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));
app.use(logger('dev')); // logger
app.use(express.json()); // json parser
app.use(express.urlencoded({ extended: false })); // todo: check
app.use(express.static(path.join(__dirname, 'public'))); // static content
app.use(cookieParser()); // cookieParser
app.use(session({
  name: 'propen',
  secret: 'randomCookieKeyForPropen',
  cookie: {
    maxAge: 2 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(uri, { useNewUrlParser: true })
  .then(() => {
    console.log('mongodb connected');

    // init all router after db connected
    app.use('/', indexRouter);
    app.use('/REST/clientSite', exhibitionRouter);
    app.use('/REST/clientSite', clientUserRouter);
    app.use('/REST/manageSite/', general);
    app.use('/REST/manageSite/workflow', workflow);
  })
  .catch((err) => {
    console.log('mongodb connection error:' + err);
  });


module.exports = app;
