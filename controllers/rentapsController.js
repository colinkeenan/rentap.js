var rentaps = require('../models/rentaps');

exports.goodaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Listing of All Rental Application Data not in Trash');
};

exports.trashaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Listing of All Trashed Rental Application Data');
};

exports.goodnames = function(req, res) {
  res.send('NOT IMPLEMENTED: Listing of All Full Names not in Trash');
};

exports.trashnames = function(req, res) {
  res.send('NOT IMPLEMENTED: Listing of All Trashed Full Names');
};

exports.getap = function(req, res) {
  res.send('NOT IMPLEMENTED: Display Application: ' + req.params.ap_id);
};

exports.rm_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Delete Application: ' + req.params.ap_id);
};

exports.save_new_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Save New Application');
};

exports.save_edited_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Save Edited Application');
};

exports.search_goodaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Applications not in trash that match pattern: ' + req.params.pattern);
};

exports.search_trashaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Trashed Applications that match pattern: ' + req.params.pattern);
};

exports.search_allaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Applications that match pattern: ' + req.params.pattern);
};

exports.search_column = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Applications that have ' + req.params.search_column + ' that match pattern: ' + req.params.pattern);
};
