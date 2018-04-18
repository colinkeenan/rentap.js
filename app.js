var express = require('express');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var rentapRouter = require('./routes/rentap');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/rentap', rentapRouter);

app.set('views', './views'));
app.set('view engine', 'pug');

module.exports = app;
