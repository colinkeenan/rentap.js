var express = require('express');
var indexRouter = require('./index');
var rentapRouter = require('./rentapRoutes.js');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('./public'));

app.use('/', indexRouter);
app.use('/rentap', rentapRouter);

app.set('views', './views');
app.set('view engine', 'pug');

module.exports = app;
