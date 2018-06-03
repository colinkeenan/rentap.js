var rentap = require('./rentapModel.js');
var apsGbl; 
var headersGbl;
let unsavedGbl = false;
let apUnsaved = null;
let fieldFocused = 'fullname';
let namesGbl = null;
let headerSelected = false; //keep track if header has been selected on a new ap yet or not. set true when header selected, false when ap is saved.
let headerName = null; //this is for display on a new ap. regular headerName is stored with the ap
let modeGbl = 'new'; //since each post button has it's own form, form.body.mode is not available to any but save, so a global mode is needed,
                     //and apsGbl is either undefined or not applicable when the mode is 'new' so can't use apsGbl.mode as the global mode
let errorGbl = null;
/* all these "exports" methods are for 'get' buttons where rentapRoutes decides which method to use based on the url
 * except for form_submission which uses a switch to decide which form it came from (hidden input with name of form)
 *
 * due to javascript being async, can't rely on getaps finishing before render,
 * so doing render in getaps callback if need to getaps
 * can't just have one render at end
 * as a result, making a "handle_..." function for each function that would otherwise need to repeat the exact same stuff twice
 * depending on whether or not getaps was needed
 */

var refresh_page_with_unsaved_changes = function(form, res) { //all rentap input fields trigger a post onchange, which triggers this since Save button wasn't clicked
  unsavedGbl = true;
  if (undefined===form.body.fullname && apUnsaved) apUnsaved.headerName = form.body.button; //The header is selected on it's own form so there is no "fullname"
  else if (!(undefined===form.body.fullname)) {
    let i = 1;
    let updatedApUnsaved = {rowid: form.body.rentapID, FullName:form.body.fullname, SSN:form.body.ssnumber, BirthDate:form.body.birthdate, MaritalStatus:form.body.maritalstatus, Email:form.body.email, StateID:form.body.stateid, Phone1:form.body.phone1, Phone2:form.body.phone2, CurrentAddress:form.body.currentaddress, PriorAddresses:form.body.previousaddresses, ProposedOccupants:form.body.occupants, ProposedPets:form.body.pets, Income:form.body.income, Employment:form.body.employment, Evictions:form.body.evictions, Felonies:form.body.felonies, dateApplied:form.body.authdate, dateGuested:form.body.guestdate, dateRented:form.body.rentdate, headerName:headerName};
    let arrayApUnsaved = Object.entries(updatedApUnsaved);
    for (i = 1; i < arrayApUnsaved.length - 1; i++) {
      if (arrayApUnsaved[i][1] !== (apUnsaved ? Object.entries(apUnsaved)[i][1] : null)) break;
    }
    if (i >= arrayApUnsaved.length - 1) i = 1;
    else i++;
    apUnsaved = updatedApUnsaved;
    let fieldNames = ['rentapID', 'fullname', 'ssnumber', 'birthdate', 'maritalstatus', 'email', 'stateid', 'phone1', 'phone2', 'currentaddress', 'previousaddresses', 'occupants', 'pets', 'income', 'employment', 'evictions', 'felonies', 'authdate', 'guestdate', 'rentdate', 'headername'];
    fieldFocused = fieldNames[i];
  } else {
    apUnsaved = {FullName:'', SSN:'', BirthDate:'', MaritalStatus:'', Email:'', StateID:'', Phone1:'', Phone2:'', CurrentAddress:'', PriorAddresses:'', ProposedOccupants:'', ProposedPets:'', Income:'', Employment:'', Evictions:'', Felonies:'', dateApplied:'', dateGuested:'', dateRented:'', headerName:headerName};
    fieldFocused = 'fullname';
  }
  res.redirect('back');//makes errorGbl available to the view as a variable named 'error', unsavedGbl as a variable named 'unsaved' = true, and apUnsaved as 'ap'
}

var display_error = function(form, res, message) {
  console.error('error: ', message);
  errorGbl = message;
  refresh_page_with_unsaved_changes(form, res); 
}

/*
 * Post button methods
 */

var save = function(form, res) {
  if (unsavedGbl && 'save'===form.body.button) {
    if (headersGbl && headersGbl.length && headersGbl[headersGbl.length - 1].Name.match(/^Choose /)) headersGbl.pop();
    if (headerName) {
      if (form.body.fullname) {
        if (form.body.authdate) {
          headerSelected = true;
          rentap.save(form.body, headerName, function(returned_ap_id) {
            rentap.getaps(returned_ap_id, 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0
              apsGbl = returned_aps;
              modeGbl = apsGbl.mode;
              unsavedGbl = false;
              namesGbl = null; //trigger names to be reloaded in case a new ap was inserted
              res.redirect('/rentap/show/' + returned_ap_id);
            });
          });
        } else display_error(form, res, 'Fill in the Applied date before saving');
      } else display_error(form, res, 'Fill in the Full Name before saving');
    } else display_error(form, res, 'Choose a Header before saving');
  } else if ('save'!=form.body.button) refresh_page_with_unsaved_changes(form, res); //save button was not clicked, but changes triggered running this function
  else res.redirect('back'); //save button was clicked, but there were no changes to save. have to refresh page to stop browser waiting for a response from the post
};

var handle_show_row = function(row_num, res) {
  if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
  apsGbl.rownum = row_num;
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
};

var show_ap_rownum = function(row_num, res) { 
  if (row_num >= 0) {
    if (undefined===apsGbl) 
      rentap.getaps(-1, 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0
        apsGbl = returned_aps;
        modeGbl = apsGbl.mode;
        handle_show_row(row_num, res);
      });
    else
      handle_show_row(row_num, res);
  } else { //if it's not a valid row number, just redisplay the ap already showing
    console.error("Can't parse row number: ", row_num);
    res.redirect('back');
  }
};

var header_selected = function(form, res) {
  headerSelected = true; //gets set true here, and false in save
  headerName = form.body.button;
  if (unsavedGbl) refresh_page_with_unsaved_changes(form, res);
  else res.redirect('back');
};

var ap_selected = function(ap_id, res) {
  if (ap_id > 0) res.redirect('/rentap/show/' + ap_id);
  else console.error("There are no rental applications with this ID: ", ap_id);
};

var save_header = function(form, res) {
  let header = { StreetAddress: form.body.rentaladdress, CityStateZip: form.body.rentalcitystzip, Title: form.body.title, Name: form.body.headername };
  rentap.save_header(header, function(returned_headers) {
    headersGbl = returned_headers;
    res.redirect('back');
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
  res.redirect('back');
};

var search = function(form, res) { //the search results will be displayed in the dropdown list of names, but will not affect other navigation buttons
  if (undefined===apsGbl) 
    rentap.getaps(form.body.rentapID, 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0 
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
    case 'selectHeader': header_selected(form, res); break;
    case 'search': search(form, res); break;
    case 'row:': show_ap_rownum(form.body.button, res); break;
    case 'selectName': ap_selected(form.body.button, res); break;
    default: save(form, res);
  }
};

exports.form_submission = function(form, res) {
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0
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
      let i = headerName ? headersGbl.findIndex(header => header.Name  == headerName) : null;
      res.render('rentap', {unsaved:unsavedGbl, fieldFocused:fieldFocused, error:errorGbl, mode:'new', rownum: null, ap: apUnsaved, Names:namesGbl, headers:headersGbl, header:(headerName ? headersGbl[i] : null)});
      if (!unsavedGbl) apUnsaved = null;
      errorGbl = null;
    }); 
  else {
    //whenever showing a new ap, there's no valid name to be selected automatically so show "Choose Name" (search also puts in a "Choose..." option)
    if (!namesGbl[namesGbl.length - 1].FullName.match(/^Choose /)) namesGbl.push({ FullName: 'Choose Name', rowid: 0 });
    let i = headerName ? headersGbl.findIndex(header => header.Name  == headerName) : null;
    res.render('rentap', {unsaved:unsavedGbl, fieldFocused:fieldFocused, error:errorGbl, mode:'new', rownum: null, ap: apUnsaved, Names:namesGbl, headers:headersGbl, header:(headerName ? headersGbl[i] : null)});
    if (!unsavedGbl) apUnsaved = null;
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
    res.render('rentap', {unsaved:unsavedGbl, fieldFocused:fieldFocused, error:errorGbl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:(unsavedGbl ? apUnsaved : apsGbl.aps[apsGbl.rownum]), Names:namesGbl, headers:headersGbl, header:headersGbl[i]});
  } else rentap.names(form.params.ap_id, function(returned_names) {
    namesGbl = returned_names;
    res.render('rentap', {unsaved:unsavedGbl, fieldFocused:fieldFocused, error:errorGbl, mode:apsGbl.mode, rownum:apsGbl.rownum, ap:(unsavedGbl ? apUnsaved : apsGbl.aps[apsGbl.rownum]), Names:namesGbl, headers:headersGbl, header:headersGbl[i]});
  });
  errorGbl = null;
};

exports.show_ap = function(form, res) {
  if (undefined===headersGbl || undefined===apsGbl)
    rentap.getaps(form.params.ap_id, 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0
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
    rentap.getaps(('row0'===form.params.ap_id ? -1 : form.params.ap_id), 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0
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
    rentap.getaps(('row0'===form.params.ap_id ? -1 : form.params.ap_id), 0, false, function(returned_aps) { // rownum will be assigned in getaps because switch_mode is false, so just using 0
      apsGbl = returned_aps;
      modeGbl = apsGbl.mode;
      handle_next_ap(form, res);
    });
  else
    handle_next_ap(form, res);
};

exports.discard_ap = function(form, res) {
  if (modeGbl==='new') res.redirect('back')
  else rentap.discard_ap(form.params.ap_id, function(returned_aps) {
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
    res.redirect('back');
  });
};

/* 
 * The actual mode switching occurs in the model function rentap.getaps
 */
exports.switch_mode = function(form, res) {
  //always gets apsGbl and namesGbl whether or not it is already defined
  //because expecting to change apsGbl by switching to aps of the opposite mode (edit/discarded)
  let row_to_get = 0;
  if (apsGbl) if (apsGbl.rownum) row_to_get = apsGbl.rownum;
  rentap.getaps(form.params.ap_id, row_to_get, true, function(returned_aps) { //true signals to switch mode
    apsGbl = returned_aps; //apsGbl.aps is now an array of all aps of opposite mode, 
    //and apsGbl.rownum is set to 0 if entered trash or what it was before entering trash if just left
    modeGbl = apsGbl.mode;
    rentap.names(apsGbl.aps[0].rowid, function(returned_names) { //have to update names to match returned_aps
      namesGbl=returned_names;
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    });
  });
};
