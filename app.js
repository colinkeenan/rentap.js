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
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
