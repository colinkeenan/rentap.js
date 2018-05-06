var rentap = require('./rentapModel.js');
var apsGbl; 
// all these "exports" methods are for 'get' buttons where rentapRoutes decides which method to use based on the url
// except for form_submission which uses a switch to decide which var function(form.button
// because all the submit buttons are named "button", but have distinct values
// The post button values and (text on button) are:
// newheader (+)
// existingheader (~)
// deleteheader (-)
// defaultheader (->0)
// save (Save)
// jump (Go)
// search (Search)
// any other word (selected header from dropdown)
// any positive intiger (ap_id that matches selected name from dropdown)

//methods for 'post' buttons
var save_new_header = function(form, res) {
  res.send('NOT IMPLEMENTED: Save New Header while on Ap' + form.params.ap_id + 'with values: ' + form.body.ap + '. This url: ' + form.originalUrl);
};

var save_header = function(form, res) {
  if (form.body.search === 'search') { // Search button was clicked
    res.send('NOT IMPLEMENTED: Find All Applications (ap_id in Trash ? in trash : not in trash) that match pattern: ' + form.params.pattern + ' for ap_id ' + form.params.ap_id);
  } else { // Name was selected from dropdown list
    res.send('NOT IMPLEMENTED: Show ap selected from dropdown list of names. The selected ap_id is: ' + form.body.selectedAp_id)
  }
  res.send('NOT IMPLEMENTED: Save Header: ' + form.body.headername + ' while on Ap' + form.params.ap_id + 'with values: ' + form.body.ap + '. This url: ' + form.originalUrl);
};

var rm_header = function(form, res) {
  res.send('NOT IMPLEMENTED: Delete Header: ' + form.body.headername + ' while on Ap' + form.params.ap_id + '. This url: ' + form.originalUrl);
};

var default_header = function(form, res) {
  res.send('NOT IMPLEMENTED: Set Default Header: ' + form.body.headername + ' while on Ap' + form.params.ap_id + '. This url: ' + form.originalUrl);
};

var save = function(ap_from, res) {
  // rentap.save
  // form.body {fullname, ssnumber, birthdate, maritalstatus, email, stateid, phone1, phone2, currentaddress, previousaddresses, occupants, pets, income, employment, evictions, felonies, authdate, guestdate, rentdate, rentapHeadername}
  res.send('NOT IMPLEMENTED: Save New or Edited (filled in) Application with values: ' + form.body.fullname + '. . .');
}

var show_ap_rownum = function(form, res) { 
  if (typeof form.body.row === 'number') { //don't do anything if user didn't enter the number of the row to jump to
    var row_num = form.body.row; //row number that user entered
    if (row_num < 0) row_num = 0; //in case it's negative, make it 0
    //negative ap_id, false means get all aps NOT in trash and set rownum to 0
    if (undefined === apsGbl) //this should only be true if just opened rentap on new ap, so treat as getting row of ap not in trash
      rentap.getaps(-1, false, function(returned_aps) {
        apsGbl = returned_aps;
        if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
        apsGbl.rownum = row_num;
        res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
      });
    else {
      if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
      apsGbl.rownum = row_num;
      res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
    }
  }
};

var search = function(form, res) {
  res.send('NOT IMPLEMENTED: Find All Applications (ap_id in Trash ? in trash : not in trash) that match pattern: ' + form.body.pattern + ' for ap_id ' + form.params.ap_id);
};

var header_selected = function(form, res) {
  res.send('NOT IMPLEMENTED: Show header selected from dropdown list of header names. The selected headername is: ' + form.body.button)
}

var ap_selected = function(form, res) {
  res.send('NOT IMPLEMENTED: Show ap selected from dropdown list of names. The selected ap_id is: ' + form.body.button)
}

exports.form_submission = function(form, res) {
  switch(form.body.button) {
    case 'newheader': save_new_header(form, res); break;
    case 'existingheader': save_header(form, res); break;
    case 'deleteheader': rm_header(form, res); break;
    case 'defaultheader': default_header(form, res); break;
    case 'save': save(form, res); break;
    case 'jump': show_ap_rownum(form, res); break;
    case 'search': search(form, res); break;
    default: {
      if (Number.isInteger(form.body.button) && form.body.button >= 0)
        rentap_ap_selected(form, res);
      else rentap_header_selected;
    }
  }
}

// methods for 'get' buttons
exports.show_new_ap = function(form, res) {
  res.render('rentap', {url:form.originalUrl, mode:'new', rownum: undefined, ap: undefined});
};

exports.show_ap = function(form, res) {
  //due to javascript being async, can't rely on getaps finishing before render,
  //so doing render in getaps callback if need to getaps
  //can't just have one render at end
  if (undefined===apsGbl)
    //rentap.getaps gets aps of the oppopsite mode as ap_id if 2nd param is true
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
    });
  else {
    apsGbl.rownum = apsGbl.aps.findIndex(ap => ap.rowid == form.params.ap_id);
    res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
  }
};

exports.show_ap_prev = function(form, res) {
  //same as show_ap, but just decrement aps.rownum, wrapping around to the last ap if already on 0
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      apsGbl.rownum = apsGbl.rownum===0 ? (apsGbl.aps.length - 1) : (apsGbl.rownum - 1); //down one if can, otherwise goto end
      res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
    });
  else {
    apsGbl.rownum = apsGbl.rownum===0 ? (apsGbl.aps.length - 1) : (apsGbl.rownum - 1);
    res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
  }
};

exports.show_ap_next = function(form, res) {
  //same as show_ap, but just increment aps.rownum, wrapping around to 0 if already on the last ap
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      apsGbl.rownum = apsGbl.rownum===(apsGbl.aps.length - 1) ? 0 : (apsGbl.rownum + 1); //up one if can, otherwiss goto 0
      res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
    });
  else {
    apsGbl.rownum = apsGbl.rownum===(apsGbl.aps.length - 1) ? 0 : (apsGbl.rownum + 1);
    res.render('rentap', {url:form.originalUrl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum]});
  }
};

exports.discard_ap = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by putting one in trash
  rentap.discard_ap(form.params.ap_id, function(returned_aps) {
    apsGbl = returned_aps;
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.restore_ap = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by taking one from trash
  rentap.restore_ap(form.params.ap_id, function(returned_aps) {
    apsGbl = returned_aps;
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.rm_ap = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by permanently deleting one
  rentap.rm_ap(form.params.ap_id, function(returned_aps) {
    apsGbl = returned_aps;
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.switch_mode = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by switching to aps of the opposite mode (edit/discarded)
  rentap.getaps(form.params.ap_id, true, function(returned_aps) { //true signals to switch mode
    apsGbl=returned_aps; //apsGbl.aps is now an array of all aps of opposite mode, and aps.rownum is set to 0
    if (apsGbl.aps.length > 1) {
      if (form.params.ap_id > apsGbl.aps[apsGbl.aps.length - 1].rowid) //if ap_id bigger than last one, set rownum to last one
        apsGbl.rownum = apsGbl.aps.length - 1 
      else //ap_id is either less than the 0th rowid, or falls somewhere in the middle of ap_id's, find next higher one
        for (var i = 0; i < apsGbl.aps.length; i++) 
          if (form.params.ap_id < apsGbl.aps[i].rowid) { //ap_id can't be equal to rowid because of opposite mode
            apsGbl.rownum = i; 
            break;
          }
    }
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.search_allaps = function(form, res) {
  // rentap.serach_allaps(form.body.pattern)
  // currently no way to triger this from view
  res.send('NOT IMPLEMENTED: Find All Applications that match pattern: ' + form.body.pattern + ' from ap ' + search_from.params.ap_id);
};

exports.search_col_allaps = function(form, res) {
  // currently no way to triger this from view and there's no field named column
  // rentap.search(form.body.pattern, form.body.column)
  res.send('NOT IMPLEMENTED: Find All Applications that have ' + form.body.column + ' that match pattern: ' + form.body.pattern);
};

exports.search_col = function(form, res) {
  // currently no way to triger this from view and there's no field named column
  // rentap.search(form.body.pattern, form.body.column, form.params.ap_id)
  res.send('NOT IMPLEMENTED: Find All Non-Trash Applications that have ' + form.body.column + ' that match pattern: ' + form.body.pattern + ' for ap_id ' +form.params.ap_id);
};

