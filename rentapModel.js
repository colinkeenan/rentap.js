// if ap_id is in trash, mode is 'discarded', else 'edit' 
// (don't need to call on the database to figure out if an ap is 'new') 
// getmode is not exported, just used as needed by other methods
getmode = function (ap_id, callback) { //callback gets mode
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.get("SELECT CASE WHEN (?) IN (SELECT discardedRow FROM trash) THEN 'discarded' ELSE 'edit' END mode", ap_id, function(err, ap) {
      if (err) console.error(err);
      callback(ap.mode);
    });
  });
  db.close
}

/* switch_mode is either true or false 
 * if true, then instead of returning aps in the same mode as ap_id, it returns aps of the opposite mode,
 * and the rownum returned is always 0 when switch_mode is true. 
 *
 * negative ap_id means set mode to edit and return all goodaps. like true switch_mode, rownum will be 0.
*/
exports.getaps = function(ap_id, switch_mode, callback) { //callback {aps, rownum, mode} where rownum is the (index in aps where tbl.rowid = ap_id)
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var rownum = 0;
  if (ap_id < 0 ) {
    db.serialize(function() {
      db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
        if (err) console.error(err);
        callback({aps:aps, rownum:rownum, mode:'edit'});
      });
    });
    db.close
  } else {
  getmode(ap_id, function(mode) {
    if (switch_mode) mode = mode==='discarded' ? 'edit' : 'discarded';
    db.serialize(function() {
      if (mode==='discarded')
        db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
          if (err) console.error(err);
          if (!switch_mode) rownum = aps.findIndex(ap => ap.rowid === ap_id);
          callback({aps:aps, rownum:rownum, mode:mode});
        });
      else
        db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
          if (err) console.error(err);
          if (!switch_mode) rownum = aps.findIndex(ap => ap.rowid === ap_id);
          callback({aps:aps, rownum:rownum, mode:mode});
        });
    });
    db.close
  });
};

/* I don't think this one will be needed since getting the "rowth ap" is trivial from rentapController which has apsGbl now
 *
// ap_id is tbl.rowid, rownum is an integer (index) for the rowth ap found where rowid is in (or not in) trash 
// For this function, rownum comes from the search form.
exports.get_rowth_ap = function (ap_id, rownum, callback) { //callback gets ap {ap, rownum, mode} where ap.ap is the rowth ap found
  getmode(ap_id, function(mode) {
    const sqlite3 = require('sqlite3');
    let db = new sqlite3.Database('./store.db');
    var ap;
    db.serialize(function() {
      if (mode==='discarded')
        db.get("SELECT * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid LIMIT 1 OFFSET (?)", rownum-1, function(err, rowth_ap) {
          if (err) console.error(err);
          ap={ap:rowth_ap, rownum:rownum, mode:mode};
          callback(ap);
        });
      else
        db.get("SELECT * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid LIMIT 1 OFFSET (?)", rownum-1, function(err, rowth_ap) {
          if (err) console.error(err);
          ap={ap:rowth_ap, rownum:rownum, mode:mode};
          callback(ap);
        });
    });
    db.close
  });
}
*/

exports.names = function(callback) { //for dropdown list of full names to choose an ap from
  getmode(ap_id, function(mode) {
    const sqlite3 = require('sqlite3');
    let db = new sqlite3.Database('./store.db');
    var names;
    db.serialize(function() {
      if (mode==='discarded')
        db.all("SELECT FullName FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
          if (err) console.error(err);
          names = rows; //will be null if error
          callback(names);
        });
      else
        db.all("SELECT FullName FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
          if (err) console.error(err);
          names = rows; //will be null if error
          callback(names);
        });
    });
    db.close
  });
};

exports.discard_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var getaps;
  db.serialize(function() {
    //get next_ap to be shown. no need to get the mode because discard can only be called when not in trash
    db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
      if (err) console.error(err);
      getaps = {aps:rows, rownum:rows.findIndex(obj => obj.rowid == ap_id), mode:'edit'};
      getaps.rownum = getaps.rownum + 1; //want next ap
      //wrap around from 0 to end of list or from end of list to 0
      if (getaps.rownum < 0) getaps.rownum = getaps.aps.length; 
      if (getaps.rownum > getaps.aps.length) getaps.rownum = 0;
    });
    //adding ap_id to trash "discards" the row without actually changing it in tbl
    db.run("INSERT INTO trash (discardedRow) VALUES (?)", ap_id, function(err, row) {
      if (err) console.error(err);
      callback(getaps);
    });
  });
}

exports.restore_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    //deleting ap_id from trash "restores" the row which was never changed in tbl
    db.run("DELETE FROM trash WHERE discardedRow = (?)", ap_id, function(err, row) {
      if (err) console.error(err);
      callback(err);
    });
  });
}

exports.rm_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() { //do not allow an ap to be deleted unless it is in trash
    db.run("DELETE FROM tbl WHERE rowid = (?) AND rowid IN (SELECT discardedRow FROM trash)", ap_id, function(err, row) {
      if (err) console.error(err);
      callback(err);
    });
  });
}

exports.save_new_ap = function (ap, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var ap_id = null;
  db.serialize(function() {
    db.run("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented, headerName) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, ap.rentapHeadername, 
      function(err) {
        if (err) console.error(err) 
        else ap_id = this.lastID;
        callback(ap_id);
      }
    ); 
  });
  db.close
}

exports.save_ap = function (ap_id, ap, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var updated_id = null;
  db.serialize(function() {
    db.run("UPDATE tbl FullName = (?), SSN = (?), BirthDate = (?), MaritalStatus = (?), Email = (?), StateID = (?), Phone1 = (?), Phone2 = (?), CurrentAddress = (?), PriorAddresses = (?), ProposedOccupants = (?), ProposedPets = (?), Income = (?), Employment = (?), Evictions = (?), Felonies = (?), dateApplied = (?), dateGuested = (?), dateRented = (?), headerName = (?) WHERE rowid = (?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, ap.rentapHeadername, ap_id,
      function(err) {
        if (err) console.error(err) 
        else updated_id = this.lastID;
        callback(updated_id);
      }
    ); 
  });
  db.close
}

exports.search = function(ap_id, pattern, callback) {
  getmode(ap_id, function(mode) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_goodaps = [];
  db.serialize(function() {
    if (mode==='discarded')
      db.all("SELECT * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
        pattern, function(err, rows) {
          if (err) console.error(err);
          matching_goodaps = rows; //will be null if error (or nothing matches, of course)
          callback(matching_goodaps);
        }
      );
    else
      db.all("SELECT * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
        pattern, function(err, rows) {
          if (err) console.error(err);
          matching_goodaps = rows; //will be null if error (or nothing matches, of course)
          callback(matching_goodaps);
        }
      );
    });
  });
  db.close
}

exports.search_allaps = function(pattern, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_allaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_allaps = rows; //will be null if error (or nothing matches, of course)
        callback(matching_allaps);
      }
    );
  });
  db.close
}

exports.search_column = function(pattern, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var rows_with_matching_field = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        rows_with_matching_field = rows; //will be null if error (or nothing matches, of course)
        callback(rows_with_matching_field);
      }
    );
  });
  db.close
}

test = function (result) {
  console.log(result);
}
