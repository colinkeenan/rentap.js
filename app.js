var express = require('express');
var indexRouter = require('./index');
var rentapRouter = require('./rentapRoutes');

var app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('./public'));
app.use('/', indexRouter);
app.use('/rentap', rentapRouter);

app.set('views', './views');
app.set('view engine', 'pug');

// error handler
app.use(function(err, req, res, next) {
  res.locals.error = err;
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
