var rentap = require('../models/rentap');

//RENTAP FORM

exports.show_new_ap = function(ap_form, res) {
  //- no rentap method needed
  res.send('NOT IMPLEMENTED: Show New (blank) Application');
};

exports.save_new_ap = function(ap_form, res) {
  //- rentap.save_new_ap
  //- ap_form.body {fullname, ssnumber, birthdate, maritalstatus, email, stateid, phone1, phone2, currentaddress, previousaddresses, occupants, pets, income, employment, evictions, felonies, authdate, guestdate, rentdate, rentapHeadername}
  res.send('NOT IMPLEMENTED: Save New (filled in) Application with values: ' + ap_form.body.fullname + '. . .');
};

exports.save_ap = function(ap_form, res) {
  //- rentap.save_ap
  res.send('NOT IMPLEMENTED: Save Edited Application:' + ap_form.params.ap_id + 'with values: ' + ap_form.body.fullname + '. . .');
};

exports.show_ap = function(ap_form, res) {
  //- rentap.getap(ap_form.params.ap_id)
  //- rentap.get_row_and_mode(ap_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Display Application: ' + ap_form.params.ap_id);
};

exports.show_closest_ap_in_trash = function(ap_form, res) {
  //- rentap. [need to define this method]
  res.send('NOT IMPLEMENTED: Go to trash from: ' + ap_form.params.ap_id);
};


exports.discard_ap = function(ap_form, res) {
  //- rentap.discard_ap(ap_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Discard Application: ' + ap_form.params.ap_id)
};

exports.rm_ap = function(ap_form, res) {
  //- rentap.rm_ap(ap_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Delete Application: ' + ap_form.params.ap_id);
};

exports.restore_ap = function(ap_form, res) {
  //- rentap.restore_ap(ap_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Restore Discarded Application: ' + ap_form.params.ap_id);
};

exports.show_goodaps = function(ap_form, res) {
  //- rentap.goodaps()
  res.send('NOT IMPLEMENTED: Table of All Rental Application Data not in Trash');
};

exports.show_trashaps = function(ap_form, res) {
  //- rentap.trashaps()
  res.send('NOT IMPLEMENTED: Table of All Trashed Rental Application Data');
};

exports.show_goodnames = function(ap_form, res) {
  //- rentap.goodnames()
  res.send('NOT IMPLEMENTED: Listing of All Full Names not in Trash');
};

exports.show_trashnames = function(ap_form, res) {
  //- rentap.trashnames()
  res.send('NOT IMPLEMENTED: Listing of All Trashed Full Names');
};

//- SEARCHES FORM

exports.selected_ap = function(search_form, res) {
  //- rentap.getap(search_form.body.selectedAp_id)
  res.send('NOT IMPLEMENTED: Show ap selected from dropdown list of names. The selected ap_id is: ' + search_form.body.selectedAp_id)
};

exports.show_ap_prev = function(search_form, res) {
  //- rentap.getap_prev(rentap.get_row(search_form.params.ap_id - 1))
  res.send('NOT IMPLEMENTED: Display Previous Application: ' + search_form.params.ap_id);
};

exports.show_ap_next = function(search_form, res) {
  //- rentap.getap_next [need to define this method]
  res.send('NOT IMPLEMENTED: Display Next Application: ' + search_form.params.ap_id);
};

exports.search_allaps = function(search_form, res) {
  //- rentap.serach_allaps(search_form.body.pattern)
  //- currently no way to triger this from view
  res.send('NOT IMPLEMENTED: Find All Applications that match pattern: ' + search_form.body.pattern + ' from ap ' + search_from.params.ap_id);
};

exports.search = function(search_form, res) {
  //- rentap.search(search_form.body.pattern)
  //- based on whether or not ap_id is in trash, finds rows that match pattern either in trash or not in trash
  res.send('NOT IMPLEMENTED: Find All Applications (ap_id in Trash ? in trash : not in trash) that match pattern: ' + search_form.params.pattern + ' for ap_id ' + search_form.params.ap_id);
};

exports.search_col_allaps = function(search_form, res) {
  //- currently no way to triger this from view and there's no field named column
  //- rentap.search(search_form.body.pattern, search_form.body.column)
  res.send('NOT IMPLEMENTED: Find All Applications that have ' + search_form.body.column + ' that match pattern: ' + search_form.body.pattern);
};

exports.search_col = function(search_form, res) {
  //- currently no way to triger this from view and there's no field named column
  //- rentap.search(search_form.body.pattern, search_form.body.column, search_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Find All Non-Trash Applications that have ' + search_form.body.column + ' that match pattern: ' + search_form.body.pattern + ' for ap_id ' +search_form.params.ap_id);
};

//- in the view, row is not the same as ap_id because tbl contains all aps, even those in trash but view displays either those rows in trash or not in trash
//- and row is always consecutive without any skips. In other words, there are two row 1's, one in trash, and one out. Many rows are like that.
exports.jump_ap = function(search_form, res) {
  //rentap.get_row(search_form.body.row, search_form.params.ap_id) either in trash or not depending on whether or not ap_id is in trash
  //or if that fails, rentap.getap(search_form.params.ap_id)
  res.send('NOT IMPLEMENTED: Jump to row ' + search_form.body.row + ' from ap ' + search_form.params.ap_id)
};

// HEADERS FORM

//still need to make all the headers methods in models/rentap.js

exports.header_update = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Show Header with name: ' header_form.body.headername 'that goes with Ap' + header_form.params.ap_id + 'with values: ' + header_form.body.ap + '. This url: ' + header_form.originalUrl);
};

exports.save_new_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Save New Header while on Ap' + header_form.params.ap_id + 'with values: ' + header_form.body.ap + '. This url: ' + header_form.originalUrl);
};

exports.save_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Save Header: ' + header_form.body.headername + ' while on Ap' + header_form.params.ap_id + 'with values: ' + header_form.body.ap + '. This url: ' + header_form.originalUrl);
};

exports.rm_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Delete Header: ' + header_form.body.headername + ' while on Ap' + header_form.params.ap_id + '. This url: ' + header_form.originalUrl);
};

exports.set_default_header = function(header_form, res) {
  res.send('NOT IMPLEMENTED: Set Default Header: ' + header_form.body.headername + ' while on Ap' + header_form.params.ap_id + '. This url: ' + header_form.originalUrl);
};

