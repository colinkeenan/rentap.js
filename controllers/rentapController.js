var rentap = require('../models/rentap');

//when implimented, will get data from rentap.whatever, and also from req.whatever and pass them to view through res.render

exports.show_new_ap = function(req, res) {
  //- no rentap method needed
  res.send('NOT IMPLEMENTED: Show New (blank) Application');
};

exports.save_new_ap = function(ap_form, res) {
  //- rentap.save_new_ap
  //- new_ap {authdate, guestdate, rentdate, rentapHeadername, fullname, ssnumber, birthdate, maritalstatus, email, stateid, phone1, phone2, currentaddress, previousaddresses, occupants, pets, income, employment, evictions, felonies}
  var new_ap = ap_form.body
  res.send('NOT IMPLEMENTED: Save New (filled in) Application with values: ' + new_ap.fullname + '. . .');
};

exports.show_ap = function(req, res) {
  //- rentap.getap(req.params.ap_id)
  res.send('NOT IMPLEMENTED: Display Application: ' + req.params.ap_id);
};

exports.show_ap_prev = function(req, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Display Previous Application: ' + req.params.ap_id);
};

exports.show_ap_next = function(req, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Display Next Application: ' + req.params.ap_id);
};

exports.show_closest_ap_in_trash = function(req, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Go to trash from: ' + req.params.ap_id);
};


exports.save_ap = function(ap_form, res) {
  //- rentap.save_ap
  var edited_ap = ap_form.body
  res.send('NOT IMPLEMENTED: Save Edited Application:' + ap_form.params.ap_id + 'with values: ' + edited_ap.fullname + '. . .');
};

exports.discard_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Discard Application: ' + req.params.ap_id)
};

exports.rm_ap = function(req, res) {
  res.send('NOT IMPLEMENTED: Delete Application: ' + req.params.ap_id);
};


exports.save_new_header = function(req, res) {
  res.send('NOT IMPLEMENTED: Save New Header while on Ap' + req.params.ap_id + 'with values: ' + req.params.ap + '. This url: ' + req.originalUrl);
};

exports.save_header = function(req, res) {
  res.send('NOT IMPLEMENTED: Save Header: ' + req.params.header_id + ' while on Ap' + req.params.ap_id + 'with values: ' + req.params.ap + '. This url: ' + req.originalUrl);
};

exports.rm_header = function(req, res) {
  res.send('NOT IMPLEMENTED: Delete Header: ' + req.params.header_id + ' while on Ap' + req.params.ap_id + '. This url: ' + req.originalUrl);
};

exports.set_default_header = function(req, res) {
  res.send('NOT IMPLEMENTED: Set Default Header: ' + req.params.header_id + ' while on Ap' + req.params.ap_id + '. This url: ' + req.originalUrl);
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
  res.send('NOT IMPLEMENTED: Find All Applications that have ' + req.params.column + ' that match pattern: ' + req.params.pattern);
};

exports.search_col_good = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Non-Trash Applications that have ' + req.params.column + ' that match pattern: ' + req.params.pattern);
};

exports.search_col_trash = function(req, res) {
  res.send('NOT IMPLEMENTED: Find All Trashed Applications that have ' + req.params.column + ' that match pattern: ' + req.params.pattern);
};
