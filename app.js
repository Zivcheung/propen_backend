const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

/* database */
const mongoose = require('mongoose');

// deprecation patch
mongoose.set('useFindAndModify', false);

/* routers */
const exhibitionRouter = require('./routes/exhibition');
const indexRouter = require('./routes/index');

// manage site router
const workflow = require('./routes/manageSite/workflow');

// initiate express
const app = express();

// initiate mongoose
const uri = 'mongodb+srv://tianzhu:mimipao123%2C.%2F@cluster0-ekakp.mongodb.net/propen';
app.use(cors());
app.use(logger('dev')); // logger
app.use(express.json()); // json parser
app.use(express.urlencoded({ extended: false })); // todo: check
app.use(cookieParser()); // cookieParser
app.use(express.static(path.join(__dirname, 'public'))); // static content

mongoose.connect(uri, { useNewUrlParser: true })
  .then(() => {
    console.log('mongodb connected');

    // init all router after db connected
    app.use('/', indexRouter);
    app.use('/REST/exhibition', exhibitionRouter);
    app.use('/REST/manageSite/workflow', workflow);
  })
  .catch((err) => {
    console.log('mongodb connection error:' + err);
  });


module.exports = app;
