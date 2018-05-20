var rentap = require('./rentapModel.js');
var apsGbl; 
let namesGbl = null;
var headersGbl;
let headerSelected = false; //keep track if header has been selected on a new ap yet or not. set true when header selected, false when ap is saved.
let headerName = null; //this is for display on a new ap. regular headerName is stored with the ap
// all these "exports" methods are for 'get' buttons where rentapRoutes decides which method to use based on the url
// except for form_submission which uses a switch to decide which var function(form.button
// because all the submit buttons are named "button", but have distinct values
// The post button values and (text on button) are:
// addheader (+)
// updateheader (~)
// deleteheader (-)
// save (Save)
// jump (Go)
// search (Search)
// any other word (selected header from dropdown)
// any positive intiger (ap_id that matches selected name from dropdown)

//due to javascript being async, can't rely on getaps finishing before render,
//so doing render in getaps callback if need to getaps
//can't just have one render at end
//as a result, making a "handle_..." function for each function that would otherwise need to repeat the exact same stuff twice
//depending on whether or not getaps was needed

//methods for 'post' buttons
var save = function(form, res) {
  //todo: before allowing a save, need to verify there really is a fullName and header
  headerSelected = true; 
  if (headersGbl[headersGbl.length - 1].Name.match(/^Choose /)) headersGbl.pop();
  rentap.save(form.body, function(returned_ap_id) {
    rentap.getaps(returned_ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      res.redirect('/rentap/show/' + returned_ap_id);
    });
  });
}

var handle_show_row = function(row_num, res) {
  if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
  apsGbl.rownum = row_num;
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

var show_ap_rownum = function(row_num, res) { 
  if (row_num >= 0) {
    if (undefined == apsGbl) 
      rentap.getaps(-1, false, function(returned_aps) {
        apsGbl = returned_aps;
        handle_show_row(row_num, res);
      });
    else
      handle_show_row(row_num, res);
  } else { //if it's not a valid row number, just redisplay the ap already showing
    console.error("Can't parse row number: ", row_num);
    if (undefined === apsGbl)
      res.redirect('/rentap');
    else
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  }
};

var handle_selected_header = function(form, res) {
  if (undefined===apsGbl.aps[apsGbl.rownum]) {
    headerName = form.body.button;
    res.redirect('/rentap');
  } else {
    apsGbl.aps[apsGbl.rownum].headerName = form.body.button;
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  }
}

var header_selected = function(form, res) {
  headerSelected = true; //gets set true here, and false in save
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      handle_selected_header(form, res);
    });
  else 
    handle_selected_header(form, res);
}

var ap_selected = function(ap_id, res) {
  if (ap_id > 0) res.redirect('/rentap/show/' + ap_id);
  else console.error("There are no rental applications with a negative ID");
}

var add_header = function(form, res) {
  let header = { StreetAddress: form.body.rentaladdress, CityStateZip: form.body.rentalcitystzip, Title: form.body.title, Name: form.body.headername };
  rentap.add_header(header, function(returned_headers) {
    headersGbl = returned_headers;
    if (form.body.mode === 'new') 
      res.redirect('/rentap');
    else 
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

var update_header = function(form, res) {
  let header = { StreetAddress: form.body.rentaladdress, CityStateZip: form.body.rentalcitystzip, Title: form.body.title, Name: form.body.headername };
  rentap.update_header(header, function(returned_headers) {
    headersGbl = returned_headers;
    if (form.body.mode === 'new') 
      res.redirect('/rentap');
    else 
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

var rm_header = function(form, res) {
  rentap.rm_header(form.body.headername, function(returned_headers) {
    headersGbl = returned_headers;
    if (form.body.mode === 'new') 
      res.redirect('/rentap');
    else 
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

var handle_search = function(form, res) {
  //node-sqlite3 LIKE isn't working across multiple columns for me even with OR so just doing the search here in javascript
  var regexp = RegExp(form.body.pattern, 'ig');
  var matching_names = [];
  var i, key;
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
  if (form.body.mode === 'new') 
    res.redirect('/rentap');
  else 
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

var search = function(form, res) { //the search results will be displayed in the dropdown list of names, but will not affect other navigation buttons
  if (undefined===apsGbl) 
    rentap.getaps(form.body.rentapID, false, function(returned_aps) { 
      apsGbl = returned_aps;
      handle_search(form, res); 
    });
  else handle_search(form, res); 
};

var handle_form_submission = function(form, res) {
  //Discovered that putting onchange() inputs or selects on the same form with regular submit buttons creates confusing arrays of submitted
  //values. Fixed by creating some seperate forms with an invisible or label-like input that identifies the form. The default is for all
  //the regular submit buttons. Also plan on putting search on a separate form so that can press Enter instead of clicking search button.

  switch(form.body.label) {
    case 'row:': show_ap_rownum(form.body.button, res); break;
    case 'selectHeader': header_selected(form, res); break;
    case 'selectName': ap_selected(form.body.button, res); break;
    default: switch(form.body.button) {
      case 'addheader': add_header(form, res); break;
      case 'updateheader': update_header(form, res); break;
      case 'deleteheader': rm_header(form, res); break;
      case 'save': save(form, res); break;
      case 'search': search(form, res); break;
      default: console.error('Not sure what to do with the submit button that has the following value: ', form.body.button);
        if (form.body.mode === 'new') 
          res.redirect('/rentap');
        else 
          res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    }
  }
}

exports.form_submission = function(form, res) {
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      handle_form_submission(form, res);
    });
  else handle_form_submission(form, res);
}

// methods for 'get' buttons
var handle_show_new = function(form, res) {
  if (!Array.isArray(namesGbl) || !namesGbl.length) 
    rentap.names(form.params.ap_id, function(returned_names) {
      namesGbl = returned_names;
      //whenever showing a new ap, there's no valid name to be selected automatically so show "Choose Name" (search also puts in a "Choose..." option)
      if (!namesGbl[namesGbl.length - 1].FullName.match(/^Choose /)) namesGbl.push({ FullName: 'Choose Name', rowid: 0 });
      let i = headerName ? headersGbl.findIndex(header => header.Name  == headerName) : undefined;
      res.render('rentap', {mode:'new', rownum: undefined, ap: undefined, Names:namesGbl, headers:headersGbl, header:(headerName ? headersGbl[i] : undefined)});
    }); 
  else {
    //whenever showing a new ap, there's no valid name to be selected automatically so show "Choose Name" (search also puts in a "Choose..." option)
    if (!namesGbl[namesGbl.length - 1].FullName.match(/^Choose /)) namesGbl.push({ FullName: 'Choose Name', rowid: 0 });
    let i = headerName ? headersGbl.findIndex(header => header.Name  == headerName) : undefined;
    res.render('rentap', {mode:'new', rownum: undefined, ap: undefined, Names:namesGbl, headers:headersGbl, header:(headerName ? headersGbl[i] : undefined)});
  }
}

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
  headerSelected = false;
  if (headersGbl[headersGbl.length - 1].Name.match(/^Choose /)) headersGbl.pop();
  //whenever showing a valid ap (not a new ap), let the select menu show the name selected - remove the "Choose..." option
  // unless a search was just performed (the number of names is less than the number of aps + 1 where +1 is because of the "Choose" option)
  if (namesGbl && namesGbl[namesGbl.length - 1].FullName.match(/^Choose /) && apsGbl.aps.length + 1 === namesGbl.length) namesGbl.pop()
  if (namesGbl) {
    headerName = null;
    let i = headersGbl.findIndex(header => header.Name  == apsGbl.aps[apsGbl.rownum].headerName);
    res.render('rentap', {mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:namesGbl, headers:headersGbl, header:headersGbl[i]});
  } else rentap.names(form.params.ap_id, function(returned_names) {
    namesGbl = returned_names
    headerName = null;
    let i = headersGbl.findIndex(header => header.Name  == apsGbl.aps[apsGbl.rownum].headerName);
    res.render('rentap', {mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:namesGbl, headers:headersGbl, header:headersGbl[i]});
  });
}

exports.show_ap = function(form, res) {
  if (undefined===headersGbl || undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) { //rentap.getaps gets aps of the oppopsite mode as ap_id if 2nd param is true
      apsGbl = returned_aps; //rapsGbl.rownum already provided here by the model
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
}

exports.show_ap_prev = function(form, res) {
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      handle_prev_ap(form, res);
    });
  else
    handle_prev_ap(form, res);
};

var handle_next_ap = function(form, res) {
  apsGbl.rownum = apsGbl.rownum>=(apsGbl.aps.length - 1) ? 0 : (apsGbl.rownum + 1); //up one if can, else goto 0
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

exports.show_ap_next = function(form, res) {
  //triggers show_ap by redirect, after increment aps.rownum, wrapping around to 0 if already on the last ap
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
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
  rentap.rm_ap(form.params.ap_id, apsGbl.rownum, function(returned_aps) {
    apsGbl = returned_aps;
    if (apsGbl.rownum >= apsGbl.aps.length) apsGbl.rownum = 0; //wrap around to 0 if it was the last ap that was deleted
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  });
};

/* 
 * The actual mode switching occurs in the model function rentap.getaps
 */
exports.switch_mode = function(form, res) {
  //always gets apsGbl and namesGbl whether or not it is already defined
  //because expecting to change apsGbl by switching to aps of the opposite mode (edit/discarded)
  rentap.getaps(form.params.ap_id, true, function(returned_aps) { //true signals to switch mode
    apsGbl=returned_aps; //apsGbl.aps is now an array of all aps of opposite mode, and aps.rownum is set 
    //to next or prev ap_id (next if going to trash and prev if leaving trash, so going to and from trash
    //returns to same ap_id)
    rentap.names(apsGbl.aps[0].rowid, function(returned_names) { //have to update names to match returned_aps
      namesGbl=returned_names;
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    });
  });
};
