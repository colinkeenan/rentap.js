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
  res.send('NOT IMPLEMENTED: Save Header: ' + form.body.headername + ' while on Ap' + form.params.ap_id + 'with values: ' + form.body.ap + '. This url: ' + form.originalUrl);
};

var rm_header = function(form, res) {
  res.send('NOT IMPLEMENTED: Delete Header: ' + form.body.headername + ' while on Ap' + form.params.ap_id + '. This url: ' + form.originalUrl);
};

var default_header = function(form, res) {
  res.send('NOT IMPLEMENTED: Set Default Header: ' + form.body.headername + ' while on Ap' + form.params.ap_id + '. This url: ' + form.originalUrl);
};

var save = function(form, res) {
  rentap.save(form.body, function(returned_ap_id) {
    rentap.getaps(returned_ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      res.redirect('/rentap/show/' + returned_ap_id);
    });
  });
}

var show_ap_rownum = function(form, res) { 
  let row_num = parseInt(form.body.row); //row number that user entered
  if (Number.isInteger(row_num) && row_num >= 0) {
    if (undefined == apsGbl) 
      //sending negative ap_id and false to getaps below means get all aps NOT in trash and set rownum to 0
      rentap.getaps(-1, false, function(returned_aps) {
        apsGbl = returned_aps;
        if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
        apsGbl.rownum = row_num;
        res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
      });
    else {
      if (row_num > apsGbl.aps.length - 1) row_num = apsGbl.aps.length - 1; //in case user entered too large of a row number, set it to last ap
      apsGbl.rownum = row_num;
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    }
  } else {
    if (undefined === apsGbl)
      res.redirect('/rentap');
    else
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  }
};

var search = function(form, res) {
  res.send('NOT IMPLEMENTED: Find All Applications (ap_id in Trash ? in trash : not in trash) that match pattern: ' + form.body.pattern + ' for ap_id ' + form.params.ap_id);
};

var header_selected = function(form, res) {
  form.body.headerName = form.body.button;
  if (undefined === apsGbl || form.body.mode === 'new')
    res.redirect('/rentap');
  else
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
}

var ap_selected = function(form, res) {
  res.redirect('/rentap/show/' + form.body.button);
}

exports.form_submission = function(form, res) {
  //I expected a button click to produce a single value for form.body.rentapID, the value assigned to the button.
  //However, trial and error shows the following pattern of form.body.button values:
  //Header Selection: [selected_headerName, ap_id] In order to distinguish between Header selection and Name selection, will check for which changed
  //Name Selection: [headerName, selectedAp_id]
  //Go: [headerName, jump, ap_id]
  //+ - ! -> [headeraction, headerName, ap_id] where hederaction is one of newheader, existingheader, deleteheader, or defaultheader

  //So, this line corrects the value of form.body.button to the expected single value unless it's got less than 3 elements
  //in which case it is passed along to the default part of the switch below to figure out what to do
  console.log(form.body.button);
  form.body.button = (Array.isArray(form.body.button) ? (form.body.button.length==3 ? (form.body.button[1]=='jump' || form.body.button[1]=='search' ? form.body.button[1] : form.body.button[0]) : form.body.button) : form.body.button); //2nd to last form.body.button is [hederName, ap_id] where one of those changed. last form.body.button is if it was a single value already (not array)
  console.log(form.body.button);
  switch(form.body.button) {
    case 'newheader': save_new_header(form, res); break;
    case 'existingheader': save_header(form, res); break;
    case 'deleteheader': rm_header(form, res); break;
    case 'defaultheader': default_header(form, res); break;
    case 'save': save(form, res); break;
    case 'jump': show_ap_rownum(form, res); break;
    case 'search': search(form, res); break;
    default: {
      //if got this far, it should be a 2 element array, [headerName, ap_id]
      //where one of the two values has changed from what's already on the form
      if (form.body.headername != form.body.button[0]) {
        form.body.button = form.body.button[0]
        header_selected(form,res);
      } else if (form.body.ap_rentapID != form.body.button[1]) {
        form.body.button = form.body.button[1]
        let ap_id = parseInt(form.body.button);
        if (Number.isInteger(ap_id) && ap_id >= 0)
          ap_selected(form, res);
      } else console.log('Not sure what to do with the submit button that has the following value: ', form.body.button);
    }
  }
}

// methods for 'get' buttons
exports.show_new_ap = function(form, res) {
  apsGbl = undefined;
  rentap.headernames(function(returned_headernames) {
    rentap.names(form.params.ap_id, function(returned_names) {
      res.render('rentap', {mode:'new', rownum: undefined, ap: undefined, Names:returned_names, headerNames:returned_headernames});
    });
  });
};

exports.show_ap = function(form, res) {
  //due to javascript being async, can't rely on getaps finishing before render,
  //so doing render in getaps callback if need to getaps
  //can't just have one render at end
  if (undefined===apsGbl)
    //rentap.getaps gets aps of the oppopsite mode as ap_id if 2nd param is true
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      rentap.headernames(function(returned_headernames) {
        rentap.names(form.params.ap_id, function(returned_names) {
          res.render('rentap', {mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:returned_names, headerNames:returned_headernames});
        });
      });
    });
  else {
    apsGbl.rownum = apsGbl.aps.findIndex(ap => ap.rowid == form.params.ap_id);
    rentap.headernames(function(returned_headernames) {
      rentap.names(form.params.ap_id, function(returned_names) {
        res.render('rentap', {mode:apsGbl.mode, rownum:apsGbl.rownum, ap:apsGbl.aps[apsGbl.rownum], Names:returned_names, headerNames:returned_headernames});
      });
    });
  }
};

exports.show_ap_prev = function(form, res) {
  //triggers show_ap by redirect, after decrement aps.rownum, wrapping around to the last ap if already on 0
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      apsGbl.rownum = apsGbl.rownum<=0 ? (apsGbl.aps.length - 1) : (apsGbl.rownum - 1); //down one if can, otherwise goto end
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    });
  else {
    apsGbl.rownum = apsGbl.rownum<=0 ? (apsGbl.aps.length - 1) : (apsGbl.rownum - 1);
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
  }
};

exports.show_ap_next = function(form, res) {
  //triggers show_ap by redirect, after increment aps.rownum, wrapping around to 0 if already on the last ap
  if (undefined===apsGbl)
    rentap.getaps(form.params.ap_id, false, function(returned_aps) {
      apsGbl = returned_aps;
      apsGbl.rownum = apsGbl.rownum>=(apsGbl.aps.length - 1) ? 0 : (apsGbl.rownum + 1); //up one if can, else goto 0
      res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
    });
  else {
    apsGbl.rownum = apsGbl.rownum>=(apsGbl.aps.length - 1) ? 0 : (apsGbl.rownum + 1);
    res.redirect('/rentap/show/' + apsGbl.aps[apsGbl.rownum].rowid);
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

