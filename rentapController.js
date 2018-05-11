var rentap = require('./rentapModel.js');
var apsGbl; 
var headersGbl;
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
  rentap.save(form.body, function(returned_ap_id) {
    rentap.getaps(returned_ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      res.redirect('/rentap/show/' + returned_ap_id);
    });
  });
}

var handle_show_row = function(form, res, row_num) {
  if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
  apsGbl.rownum = row_num;
  res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

var show_ap_rownum = function(form, res) { 
  let row_num = parseInt(form.body.row); //row number that user entered
  if (Number.isInteger(row_num) && row_num >= 0) {
    if (undefined == apsGbl) 
      rentap.getaps(-1, false, function(returned_aps) {
        apsGbl = returned_aps;
        handle_show_row(form, res, row_num);
      });
    else
      handle_show_row(form, res, row_num);
  } else { //if it's not a valid row number, just redisplay the ap already showing
    if (undefined === apsGbl)
      res.redirect('/rentap');
    else
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  }
};

var handle_selected_header = function(form, res) {
  if (undefined===apsGbl.aps[apsGbl.rownum] || form.body.mode === 'new')
    headerName = form.body.button;
  else
    apsGbl.aps[apsGbl.rownum].headerName = form.body.button;
  if (form.body.mode === 'new') 
    res.redirect('/rentap');
  else 
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

var header_selected = function(form, res) {
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      handle_selected_header(form, res);
    });
  else 
    handle_selected_header(form, res);
}

var ap_selected = function(form, res) {
  res.redirect('/rentap/show/' + form.body.button);
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

//.
var search = function(form, res) {
  res.send('NOT IMPLEMENTED: Find All Applications (ap_id in Trash ? in trash : not in trash) that match pattern: ' + form.body.pattern + ' for ap_id ' + form.params.ap_id);
};

var handle_form_submission = function(form, res) {
  // I expected a button click to produce a single value for form.body.rentapID, the value assigned to the button.
  // However, trial and error shows the following pattern of form.body.button values:
  // Header Selection: [selected_headerName, ap_id] In order to distinguish between Header selection and Name selection, will check for which changed
  // Name Selection: [headerName, selectedAp_id]
  // Go Search + - ! -> [headerName, action, ap_id] where action is one of save, jump, search, addheader, updateheader, deleteheader, or defaultheader

  //form.body.button must be corrected to a single value which each of the actions will look for
  //also need a single value for the switch
  var buttonAction
  if (!Array.isArray(form.body.button)) buttonAction = form.body.button;
  else if (undefined === apsGbl || undefined === apsGbl.aps[apsGbl.rownum]) 
    buttonAction = form.body.button.length==3 ? form.body.button[1] : ('Choose Header'!=form.body.button[0] ? 'header_selected' : (0!=form.body.button[1] ? 'ap_selected' : 'unknown'));
  else 
    buttonAction = form.body.button.length==3 ? form.body.button[1] : (apsGbl.aps[apsGbl.rownum].headerName!=form.body.button[0] && 'Choose Header'!=form.body.button[0] ? 'header_selected' : (apsGbl.aps[apsGbl.rownum].rowid!=form.body.button[1] && 0!=form.body.button[1] ? 'ap_selected' : 'unknown'));

  switch(buttonAction) {
    case 'addheader': form.body.button = buttonAction; add_header(form, res); break;
    case 'updateheader': form.body.button = buttonAction; update_header(form, res); break;
    case 'deleteheader': form.body.button = buttonAction; rm_header(form, res); break;
    case 'save': form.body.button = buttonAction; save(form, res); break;
    case 'jump': form.body.button = buttonAction; show_ap_rownum(form, res); break;
    case 'search': form.body.button = buttonAction; search(form, res); break;
    case 'header_selected': form.body.button = form.body.button[0]; header_selected(form, res); break;
    case 'ap_selected': form.body.button = form.body.button[1]; 
      let ap_id = parseInt(form.body.button);
      if (Number.isInteger(ap_id) && ap_id >= 0) ap_selected(form, res);
      else console.log("Thought a new ap was selected, but can't parse this ap_id: ", form.body.button);
      break;
    default: console.log('Not sure what to do with the submit button that has the following value: ', form.body.button);
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
  rentap.names(form.params.ap_id, function(returned_names) {
    var i;
    if (headerName)
      i = headersGbl.findIndex(header => header.Name  == headerName);
    res.render('rentap', {mode:'new', rownum: undefined, ap: undefined, Names:returned_names, headers:headersGbl, header:(headerName ? headersGbl[i] : undefined)});
  });
}

exports.show_new_ap = function(form, res) {
  if (undefined===headersGbl) 
    rentap.getheaders(function(returned_headers) {
      headersGbl=returned_headers;
      handle_show_new(form, res);
    });
  else 
    handle_show_new(form, res);
};

var handle_show_ap = function(form, res) {
  rentap.names(form.params.ap_id, function(returned_names) {
    headerName = null;
    let i = headersGbl.findIndex(header => header.Name  == apsGbl.aps[apsGbl.rownum].headerName);
    res.render('rentap', {mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:returned_names, headers:headersGbl, header:headersGbl[i]});
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

handle_next_ap = function(form, res) {
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

