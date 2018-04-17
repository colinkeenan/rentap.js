var rentap = require('../models/rentap');

exports.show_new_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Show New (blank) Application');
};

exports.save_new_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Save New (filled in) Application');
};

exports.show_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Display Application: ' + req.params.ap_id);
};

exports.save_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Save Edited Application');
};

exports.discard_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Discard Application (putting in Trash)' + req.params.ap_id)
};

exports.rm_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Delete Application: ' + req.params.ap_id);
};

exports.restore_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Restore Discarded Application: ' + req.params.ap_id);
};


exports.show_goodaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Table of All Rental Application Data not in Trash');
};

exports.show_trashaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Table of All Trashed Rental Application Data');
};

exports.show_goodnames = function(req, res) {
  res.send('NOT IMPLEMENTED: Listing of All Full Names not in Trash');
};

exports.show_trashnames = function(req, res) {
  res.send('NOT IMPLEMENTED: Listing of All Trashed Full Names');
};

exports.search_allaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Applications that match pattern: ' + req.params.pattern);
};

exports.search_goodaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Applications not in trash that match pattern: ' + req.params.pattern);
};

exports.search_trashaps = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Trashed Applications that match pattern: ' + req.params.pattern);
};

exports.search_column = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Applications that have ' + req.params.search_column + ' that match pattern: ' + req.params.pattern);
};

exports.search_col-good = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Non-Trash Applications that have ' + req.params.search_column + ' that match pattern: ' + req.params.pattern);
};

exports.search_col-trash = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Trashed Applications that have ' + req.params.search_column + ' that match pattern: ' + req.params.pattern);
};
