var rentap = require('./rentapModel.js');
var apsGbl; 
var headersGbl;
let apInvalid = null;
let namesGbl = null;
let headerSelected = false; //keep track if header has been selected on a new ap yet or not. set true when header selected, false when ap is saved.
let headerName = null; //this is for display on a new ap. regular headerName is stored with the ap
let modeGbl = 'new'; //since each post button has it's own form, form.body.mode is not available to any but save, so a global mode is needed,
                     //and apsGbl is either undefined or not applicable when the mode is 'new' so can't use apsGbl.mode as the global mode
let errorGbl = null;
// all these "exports" methods are for 'get' buttons where rentapRoutes decides which method to use based on the url
// except for form_submission which uses a switch to decide which var function(form.button
// because all the submit buttons are named "button", but have distinct values
// The post button values and (text on button) are:
// addheader (+)
// updateheader (~)
// deleteheader (-)
// save (Save)
// row: 
// search (Search)
// any other word (selected header from dropdown)
// any positive intiger (ap_id that matches selected name from dropdown)

//due to javascript being async, can't rely on getaps finishing before render,
//so doing render in getaps callback if need to getaps
//can't just have one render at end
//as a result, making a "handle_..." function for each function that would otherwise need to repeat the exact same stuff twice
//depending on whether or not getaps was needed

//methods for 'post' buttons

var refresh_page = function(res) {
  if (modeGbl === 'new' || undefined===apsGbl || undefined===apsGbl.aps[apsGbl.rownum])
    res.redirect('/rentap');
  else
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

var display_error = function(form, res, message) {
  console.log('error: ', message);
  errorGbl = message;
  apInvalid = {FullName:form.body.fullname, SSN:form.body.ssnumber, BirthDate:form.body.birthdate, MaritalStatus:form.body.maritalstatus, Email:form.body.email, SateID:form.body.stateid, Phone1:form.body.phone1, Phone2:form.body.phone2, CurrentAddress:form.body.currentaddress, PriorAddresses:form.body.previousaddresses, ProposedOccupants:form.body.occupants, ProposedPets:form.body.pets, Income:form.body.income, Employment:form.body.employment, Evictions:form.body.evictions, Felonies:form.body.felonies, dateApplied:form.body.authdate, dateGuested:form.body.guestdate, dateRented:form.body.rentdate, headerName:form.body.headername} 
  refresh_page(res); //makes message available to the view as a variable named 'error'
}

var save = function(form, res) {
  if (headersGbl && headersGbl.length && headersGbl[headersGbl.length - 1].Name.match(/^Choose /)) headersGbl.pop();
  if (headerName || form.body.headername) {
    if (!form.body.headername) form.body.headername = headerName;
    headerName = form.body.headername;
    if (form.body.fullname) {
      if (form.body.authdate) {
        headerSelected = true;
        rentap.save(form.body, function(returned_ap_id) {
          rentap.getaps(returned_ap_id, false, function(returned_aps) {
            apsGbl = returned_aps;
            modeGbl = apsGbl.mode;
            res.redirect('/rentap/show/' + returned_ap_id);
          });
        });
      } else display_error(form, res, 'Fill in the Applied date before saving');
    } else display_error(form, res, 'Fill in the Full Name before saving');
  } else display_error(form, res, 'Choose a Header before saving');
};

var handle_show_row = function(row_num, res) {
  if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
  apsGbl.rownum = row_num;
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
};

var show_ap_rownum = function(row_num, res) { 
  if (row_num >= 0) {
    if (undefined===apsGbl) 
      rentap.getaps(-1, false, function(returned_aps) {
        apsGbl = returned_aps;
        modeGbl = apsGbl.mode;
        handle_show_row(row_num, res);
      });
    else
      handle_show_row(row_num, res);
  } else { //if it's not a valid row number, just redisplay the ap already showing
    console.error("Can't parse row number: ", row_num);
    refresh_page(res);
  }
};

var header_selected = function(headername, res) {
  headerSelected = true; //gets set true here, and false in save
  headerName = headername;
  refresh_page(res);
};

var ap_selected = function(ap_id, res) {
  if (ap_id > 0) res.redirect('/rentap/show/' + ap_id);
  else console.error("There are no rental applications with this ID: ", ap_id);
};

var save_header = function(form, res) {
  let header = { StreetAddress: form.body.rentaladdress, CityStateZip: form.body.rentalcitystzip, Title: form.body.title, Name: form.body.headername };
  rentap.save_header(header, function(returned_headers) {
    headersGbl = returned_headers;
    refresh_page(res);
  });
};

var handle_search = function(form, res) {
  //node-sqlite3 LIKE isn't working across multiple columns for me even with OR so just doing the search here in javascript
  if (form.body.pattern) {
    var regexp = RegExp(form.body.pattern, 'ig');
    var matching_names = [];
    var i, key;
    //supposedly, for ... in will include prototype properties and not just the index/key, but in my testing with console.log, there's nothing extra here
    for (i in apsGbl.aps) {
      let ap = apsGbl.aps[i];
      for (key in ap) {
        //have to reset lastIndex of regexp on each field or else it will continue the search from where it last found something in the previous one 
        regexp.lastIndex = 0; 
        if (regexp.test(ap[key])) {
          matching_names.push({ FullName: ap.FullName, rowid: ap.rowid });
          break; //move on to next ap as soon as there's a match because don't want to list the same ap more than once in the search results
        }
      }
    }
    matching_names.push({ FullName: 'Choose from Search Results', rowid: 0 });
    namesGbl = !Array.isArray(matching_names) || matching_names.length <= 1 ? null : matching_names;
  } else namesGbl=null; //this will triger reloading all names on redirect below
  refresh_page(res);
};

var search = function(form, res) { //the search results will be displayed in the dropdown list of names, but will not affect other navigation buttons
  if (undefined===apsGbl) 
    rentap.getaps(form.body.rentapID, false, function(returned_aps) { 
      apsGbl = returned_aps;
      modeGbl = apsGbl.mode;
      handle_search(form, res); 
    });
  else handle_search(form, res); 
};

var handle_form_submission = function(form, res) {
  //Discovered that putting onchange() inputs or selects on the same form with regular submit buttons (all named "button") creates confusing arrays 
  //for the value of form.body.button, making it very difficult to know which actually submitted the form.
  //Fixed by creating some seperate forms with an invisible/label-like input that identifies the form. Since that worked, eventually
  //moved all the buttons to their own forms (and changed rm_header to a get just like rm_ap), with Save being the default for the main form

  switch(form.body.label) {
    case 'saveheader': save_header(form, res); break;
    case 'selectHeader': header_selected(form.body.button, res); break;
    case 'search': search(form, res); break;
    case 'row:': show_ap_rownum(form.body.button, res); break;
    case 'selectName': ap_selected(form.body.button, res); break;
    default: save(form, res);
  }
};

exports.form_submission = function(form, res) {
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      modeGbl = apsGbl.mode;
      handle_form_submission(form, res);
    });
  else handle_form_submission(form, res);
};

/* 
 * Get button methods
 */

var handle_show_new = function(form, res) {
  modeGbl = 'new';
  if (!Array.isArray(namesGbl) || !namesGbl.length) 
    rentap.names(form.params.ap_id, function(returned_names) {
      namesGbl = returned_names;
      //whenever showing a new ap, there's no valid name to be selected automatically so show "Choose Name" (search also puts in a "Choose..." option)
      if (!namesGbl[namesGbl.length - 1].FullName.match(/^Choose /)) namesGbl.push({ FullName: 'Choose Name', rowid: 0 });
      let i = headerName ? headersGbl.findIndex(header => header.Name  == headerName) : undefined;
      res.render('rentap', {error:errorGbl, mode:'new', rownum: undefined, ap: apInvalid, Names:namesGbl, headers:headersGbl, header:(headerName ? headersGbl[i] : undefined)});
      apInvalid = null;
      errorGbl = null;
    }); 
  else {
    //whenever showing a new ap, there's no valid name to be selected automatically so show "Choose Name" (search also puts in a "Choose..." option)
    if (!namesGbl[namesGbl.length - 1].FullName.match(/^Choose /)) namesGbl.push({ FullName: 'Choose Name', rowid: 0 });
    let i = headerName ? headersGbl.findIndex(header => header.Name  == headerName) : undefined;
    res.render('rentap', {error:errorGbl, mode:'new', rownum: undefined, ap: apInvalid, Names:namesGbl, headers:headersGbl, header:(headerName ? headersGbl[i] : undefined)});
    apInvalid = null;
    errorGbl = null;
  }
};

exports.show_new_ap = function(form, res) {
  if (undefined===headersGbl) 
    rentap.getheaders(function(returned_headers) {
      headersGbl=returned_headers;
      //showing headers for first time on a new ap, so put the "Choose" option on
      headerSelected = false;
      headersGbl.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
      handle_show_new(form, res);
    });
  else {
    if (!headerSelected && !headersGbl[headersGbl.length - 1].Name.match(/^Choose /)) 
      headersGbl.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
    handle_show_new(form, res);
  }
};

var handle_show_ap = function(form, res) {
  //all existing aps should have a header, so headerSelected is true, but setting to false because headerSelected is for new aps, it's ignored for existing aps
  //need headerSelected to be false the next time "New" button is clicked
  if (!headerName || !headerSelected) headerName = apsGbl.aps[apsGbl.rownum].headerName;
  headerSelected = false;
  if (headersGbl[headersGbl.length - 1].Name.match(/^Choose /)) headersGbl.pop();
  //whenever showing a valid ap (not a new ap), let the select menu show the name selected - remove the "Choose..." option
  // unless a search was just performed (the number of names is less than the number of aps + 1 where +1 is because of the "Choose" option)
  if (namesGbl && namesGbl[namesGbl.length - 1].FullName.match(/^Choose /) && apsGbl.aps.length + 1 === namesGbl.length) namesGbl.pop();
  let i = headersGbl.findIndex(header => header.Name  == headerName);
  if (namesGbl) {
    res.render('rentap', {error:errorGbl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:namesGbl, headers:headersGbl, header:headersGbl[i]});
  } else rentap.names(form.params.ap_id, function(returned_names) {
    namesGbl = returned_names;
    res.render('rentap', {error:errorGbl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:namesGbl, headers:headersGbl, header:headersGbl[i]});
  });
  errorGbl = null;
};

exports.show_ap = function(form, res) {
  if (undefined===headersGbl || undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) { //rentap.getaps gets aps of the oppopsite mode as ap_id if 2nd param is true
      apsGbl = returned_aps; //rapsGbl.rownum already provided here by the model
      modeGbl = apsGbl.mode;
      rentap.getheaders(function(returned_headers) {
        headersGbl=returned_headers;
        handle_show_ap(form, res);
      });
    });
  else {
    //need to change the rownum in case form.params.ap_id is different than it was before
    //rownum is the index of the current absGbl array. rowid and ap_id are indexes of the full tbl in the model, including both goodaps and trashaps
    apsGbl.rownum = apsGbl.aps.findIndex(ap => ap.rowid == form.params.ap_id);
    handle_show_ap(form, res);
  }
};

var handle_prev_ap = function(form, res) {
  //triggers show_ap by redirect, after decrement aps.rownum, wrapping around to the last ap if already on 0
  apsGbl.rownum = apsGbl.rownum<=0 ? (apsGbl.aps.length - 1) : (apsGbl.rownum - 1); //down one if can, otherwise goto end
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
};

exports.show_ap_prev = function(form, res) {
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      modeGbl = apsGbl.mode;
      handle_prev_ap(form, res);
    });
  else
    handle_prev_ap(form, res);
};

var handle_next_ap = function(form, res) {
  apsGbl.rownum = apsGbl.rownum>=(apsGbl.aps.length - 1) ? 0 : (apsGbl.rownum + 1); //up one if can, else goto 0
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
};

exports.show_ap_next = function(form, res) {
  //triggers show_ap by redirect, after increment aps.rownum, wrapping around to 0 if already on the last ap
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      modeGbl = apsGbl.mode;
      handle_next_ap(form, res);
    });
  else
    handle_next_ap(form, res);
};

exports.discard_ap = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by putting one in trash
  rentap.discard_ap(form.params.ap_id, function(returned_aps) {
    apsGbl = returned_aps;
    modeGbl = apsGbl.mode;
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.restore_ap = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by taking one from trash
  rentap.restore_ap(form.params.ap_id, function(returned_aps) {
    apsGbl = returned_aps;
    modeGbl = apsGbl.mode;
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.rm_ap = function(form, res) {
  //always gets apsGbl whether or not it is already defined
  //because expecting to change apsGbl by permanently deleting one
  rentap.rm_ap(form.params.ap_id, apsGbl.rownum, function(returned_aps) {
    apsGbl = returned_aps;
    modeGbl = apsGbl.mode;
    if (apsGbl.rownum >= apsGbl.aps.length) apsGbl.rownum = 0; //wrap around to 0 if it was the last ap that was deleted
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

exports.rm_header = function(form, res) {
  rentap.rm_header(headerName, function(returned_headers) {
    headersGbl = returned_headers;
    refresh_page(res);
  });
};

/* 
 * The actual mode switching occurs in the model function rentap.getaps
 */
exports.switch_mode = function(form, res) {
  //always gets apsGbl and namesGbl whether or not it is already defined
  //because expecting to change apsGbl by switching to aps of the opposite mode (edit/discarded)
  rentap.getaps(form.params.ap_id, true, function(returned_aps) { //true signals to switch mode
    apsGbl = returned_aps; //apsGbl.aps is now an array of all aps of opposite mode, and aps.rownum is set 
    modeGbl = apsGbl.mode;
    //to next or prev ap_id (next if going to trash and prev if leaving trash, so going to and from trash
    //returns to same ap_id)
    rentap.names(apsGbl.aps[0].rowid, function(returned_names) { //have to update names to match returned_aps
      namesGbl=returned_names;
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    });
  });
};
