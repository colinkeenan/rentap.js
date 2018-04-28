//getaps is not exported because it is called from modeway when way is -1, 0, or 1, which provides mode ('discarded' or 'edit') to getaps
getaps = function(ap_id, way, mode, callback) { //callback gets getaps {aps, rownum, mode} where rownum is the (index in aps where tbl.rowid = ap_id) + way
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var getaps;
  db.serialize(function() {
    if (mode==='discarded')
      db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
        if (err) console.error(err);
        getaps = {aps:rows, rownum:rows.findIndex(obj => obj.rowid == ap_id), mode:mode};
        //way should be -1, 0, or 1
        getaps.rownum = getaps.rownum + way;
        //wrap around from 0 to end of list or from end of list to 0
        if (getaps.rownum < 0) getaps.rownum = getaps.aps.length; 
        if (getaps.rownum > getaps.aps.length) getaps.rownum = 0;
        callback(getaps);
      });
    else
      db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
        if (err) console.error(err);
        getaps = {aps:rows, rownum:rows.findIndex(obj => obj.rowid == ap_id), mode:mode};
        //way should be -1, 0, or 1
        getaps.rownum = getaps.rownum + way;
        //wrap around from 0 to end of list or from end of list to 0
        if (getaps.rownum < 0) getaps.rownum = getaps.aps.length; 
        if (getaps.rownum > getaps.aps.length) getaps.rownum = 0;
        callback(getaps);
      });
  });
  db.close
};

/* get_rowth_ap is not exported because it is called from this.modeway when "way" is greater than 1 
 * in which case way is used as the rownum 
 * 
 * modeway provides mode to get_rowth_ap
 * ap_id is tbl.rowid, rownum is an integer (index) for the rowth ap found where rowid is either in or not in trash 
 * For this function, rownum comes from the search form.
*/
get_rowth_ap = function (ap_id, rownum, mode, callback) {
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
}

/* if ap_id is in trash, mode is 'discarded', else 'edit' (don't need to call on
 * the database to figure out if an ap is 'new') 
 * 
 * get ap,   this.modeway(ap_id, 0, callback)
 * prev ap,  this.modeway(ap_id, -1, callback)
 * next ap,  this.modeway(ap_id, +1, callback)
 * rowth ap, this.modeway(ap_id, rownum+2, callback)
 *
 * First 3 call getaps, last calls get_rowth_ap
 *
*/
exports.modeway = function (ap_id, way, callback) { //callback gets whatever is supplied to it from getaps or get_rowth_ap
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.get("SELECT CASE WHEN (?) IN (SELECT discardedRow FROM trash) THEN 'discarded' ELSE 'edit' END mode", ap_id, function(err, ap) {
      if (err) console.error(err);
      if (way===-1 || way===0 || way===1) 
        getaps(ap_id, way, ap.mode, callback);
      if (way>1) { //way is 2+rownum to distinguish row 0 or 1 from going to next ap or gettting the mode of current ap
        get_rowth_ap(ap_id, way-2, ap.mode, callback); //subtract 2 to pass desired rownum
      }
    });
  });
  db.close
}

exports.goodnames = function(callback) { //for dropdown list of full names to choose an ap from
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var goodnames = [];
  db.serialize(function() {
    db.all("SELECT FullName FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash)", function(err, rows) {
      if (err) console.error(err);
      goodnames = rows; //will be null if error
      callback(goodnames);
    });
  });
  db.close
};

exports.trashnames = function(callback) { //for dropdown list of full names to choose an ap from
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var trashnames = [];
  db.serialize(function() {
    db.all("SELECT FullName FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash)", function(err, rows) {
      if (err) console.error(err);
      trashnames = rows; //will be null if error
      callback(trashnames);
    });
  });
  db.close
}

exports.rm_ap = function (ap_id) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() { //do not allow an ap to be deleted unless it is in trash
    db.run("DELETE FROM tbl WHERE rowid = (?) AND rowid IN (SELECT discardedRow FROM trash)", ap_id, function(err, row) {
      if (err) console.error(err);
    });
  });
}

exports.discard_ap = function (ap_id) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    //adding ap_id to trash "discards" the row without actually changing it in tbl
    db.run("INSERT INTO trash (discardedRow) VALUES (?)", ap_id, function(err, row) {
      if (err) console.error(err);
    });
  });
}

exports.restore_ap = function (ap_id) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    //deleting ap_id from trash "restores" the row which was never changed in tbl
    db.run("DELETE FROM trash WHERE discardedRow = (?)", ap_id, function(err, row) {
      if (err) console.error(err);
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
//should not have search.goodaps and search.trashaps, just search, which will
//decide which to search based on ap_id (if in trash or not)
exports.search_goodaps = function(pattern, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_goodaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_goodaps = rows; //will be null if error (or nothing matches, of course)
        callback(matching_goodaps);
      }
    );
  });
  db.close
}

exports.search_trashaps = function(pattern, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_trashaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_trashaps = rows; //will be null if error (or nothing matches, of course)
        callback(matching_trashaps);
      }
    );
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

