var rentap = ap_formuire('../models/rentap');

//when implimented, will get data from rentap.whatever, and also from ap_form.whatever and pass them to view through res.render

exports.show_new_ap = function(ap_form, res) {
  //- no rentap method needed
  res.send('NOT IMPLEMENTED: Show New (blank) Application');
};

exports.save_new_ap = function(ap_form, res) {
  //- rentap.save_new_ap
  //- new_ap {fullname, ssnumber, birthdate, maritalstatus, email, stateid, phone1, phone2, currentaddress, previousaddresses, occupants, pets, income, employment, evictions, felonies, authdate, guestdate, rentdate, rentapHeadername}
  var new_ap = ap_form.body
  res.send('NOT IMPLEMENTED: Save New (filled in) Application with values: ' + new_ap.fullname + '. . .');
};

exports.save_ap = function(ap_form, res) {
  //- rentap.save_ap
  var ed_ap = ap_form.body
  res.send('NOT IMPLEMENTED: Save Edited Application:' + ap_form.params.ap_id + 'with values: ' + ed_ap.fullname + '. . .');
};

exports.show_ap = function(ap_form, res) {
  //- rentap.getap(ap_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Display Application: ' + ap_form.params.ap_id);
};

exports.show_ap_prev = function(ap_form, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Display Previous Application: ' + ap_form.params.ap_id);
};

exports.show_ap_next = function(ap_form, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Display Next Application: ' + ap_form.params.ap_id);
};

exports.show_closest_ap_in_trash = function(ap_form, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Go to trash from: ' + ap_form.params.ap_id);
};


exports.discard_ap = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Discard Application: ' + ap_form.params.ap_id)
};

exports.rm_ap = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Delete Application: ' + ap_form.params.ap_id);
};

exports.restore_ap = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Restore Discarded Application: ' + ap_form.params.ap_id);
};

exports.show_goodaps = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Table of All Rental Application Data not in Trash');
};

exports.show_trashaps = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Table of All Trashed Rental Application Data');
};

exports.show_goodnames = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Listing of All Full Names not in Trash');
};

exports.show_trashnames = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Listing of All Trashed Full Names');
};

exports.search_allaps = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Find All Applications that match pattern: ' + ap_form.params.pattern);
};

exports.search_goodaps = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Find All Applications not in trash that match pattern: ' + ap_form.params.pattern);
};

exports.search_trashaps = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Find All Trashed Applications that match pattern: ' + ap_form.params.pattern);
};

exports.search_column = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Find All Applications that have ' + ap_form.params.column + ' that match pattern: ' + ap_form.params.pattern);
};

exports.search_col_good = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Find All Non-Trash Applications that have ' + ap_form.params.column + ' that match pattern: ' + ap_form.params.pattern);
};

exports.search_col_trash = function(ap_form, res) {
  res.send('NOT IMPLEMENTED: Find All Trashed Applications that have ' + ap_form.params.column + ' that match pattern: ' + ap_form.params.pattern);
};

//headers
exports.save_new_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Save New Header while on Ap' + header_form.params.ap_id + 'with values: ' + header_form.params.ap + '. This url: ' + header_form.originalUrl);
};

exports.save_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Save Header: ' + header_form.params.header_id + ' while on Ap' + header_form.params.ap_id + 'with values: ' + header_form.params.ap + '. This url: ' + header_form.originalUrl);
};

exports.rm_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Delete Header: ' + header_form.params.header_id + ' while on Ap' + header_form.params.ap_id + '. This url: ' + header_form.originalUrl);
};

exports.set_default_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Set Default Header: ' + header_form.params.header_id + ' while on Ap' + header_form.params.ap_id + '. This url: ' + header_form.originalUrl);
};

