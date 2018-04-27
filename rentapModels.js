exports.good = function(ap_id, direction) { //returns good {aps, rownum} where rownum is the (index in aps where tbl.rowid = ap_id) + direction
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var good;
  db.serialize(function() {
    db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
      if (err) console.error(err);
      good = {aps: rows, rownum: rows.findIndex(obj => obj.rowid == ap_id)};
      //direction should normally be -1, 0, or +1 where -1 and +1 are for prev and next
      good.rownum = good.rownum + direction;
      if (good.rownum < 0) good.rownum = 0;
      if (good.rownum > good.aps.length) good.rownum = good.aps.length;
      console.log(good.rownum); //test
      console.log(good.aps[good.rownum]); //test
    });
  });
  db.close
  return good;
};

exports.trash = function(ap_id, direction) { //same as good, but in trash instead of not in trash
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var trash;
  db.serialize(function() {
    db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, rows) {
      if (err) console.error(err);
      trash = {aps: rows, rownum: rows.findIndex(obj => obj.rowid == ap_id)};
      //direction should normally be -1, 0, or +1 where -1 and +1 are for prev and next
      trash.rownum = trash.rownum + direction;
      if (trash.rownum < 0) trash.rownum = 0;
      if (trash.rownum > trash.aps.length) trash.rownum = trash.aps.length;
      console.log(trash.rownum); //test
      console.log(trash.aps[trash.rownum]); //test
    });
  });
  db.close
  return trash;
}

exports.goodnames = function() { //for dropdown list of full names to choose an ap from
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var goodnames = [];
  db.serialize(function() {
    db.all("SELECT FullName FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash)", function(err, rows) {
      if (err) console.error(err);
      goodnames = rows; //will be null if error
    });
  });
  db.close
  return goodnames;
};

exports.trashnames = function() { //for dropdown list of full names to choose an ap from
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var trashnames = [];
  db.serialize(function() {
    db.all("SELECT FullName FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash)", function(err, rows) {
      if (err) console.error(err);
      trashnames = rows; //will be null if error
    });
  });
  db.close
  return trashnames;
}

exports.getap = function (ap_id) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var ap;
  db.serialize(function() {
    db.get("SELECT * FROM tbl WHERE rowid=(?)", ap_id, function(err, row) {
      if (err) console.error(err);
      ap=row; //will be null if error and undefined if no row found
    });
  });
  db.close
  return ap;
}

//if ap_id in trash, mode is 'discarded', else 'edit' (don't need to call on
//the database to figure out if an ap is 'new')
exports.forward_mode = function (ap_id, nextCallback, param3, param4) { //nextCallback(ap_id, mode, param3, param4)
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var mode;
  db.serialize(function() {
    db.get("SELECT CASE WHEN (?) IN (SELECT discardedRow FROM trash) THEN 'discarded' ELSE 'edit' END mode", ap_id, function(err, ap) {
      if (err) console.error(err);
      mode = ap.mode; //ap is just {mode:'edit'} or {mode:'discarded'}, so no reason to return the whole object
      nextCallback(ap_id, mode, param3, param4); //after getting the mode, run whatever needed to know the mode like getap_prev
    });
  });
  db.close
}

//not exporting getap_prev and getap_next because they have to be passed to getmode
getap_prev = function (ap_id, mode, trash, good) {
  if (mode==='discarded')
    trash(ap_id, -1);
  else
    good(ap_id, -1);
}

getap_next = function (ap_id, mode, trash, good) {
  if (mode==='discarded')
    trash(ap_id, +1);
  else
    good(ap_id, +1);
}

this.forward_mode(47, getap_next, this.trash, this.good) //test

//ap_id is tbl.rowid, row is the rowth ap found where rowid is either in or not in trash
//based on whether or not ap_id is in trash. For this method, row comes from the search form.
exports.get_rowth_ap = function (ap_id, row) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var ap;
  db.serialize(function() {
    db.get("SELECT * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid LIMIT 1 OFFSET (?)", row-1, function(err, rowth_ap) {
      if (err) console.error(err);
      ap=rowth_ap; //will be null if error
    });
  });
  db.close
  return ap;
}
//should not have get_trash_row, instead, get_row has to figure out if ap_id is in trash or not ...
exports.get_trash_row = function (ap_id, row) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var ap;
  db.serialize(function() {
    db.get("SELECT * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid LIMIT 1 OFFSET (?)", row-1, function(err, rowth_ap) {
      if (err) console.error(err);
      ap=rowth_ap; //will be null if error
    });
  });
  db.close
  return ap;
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

exports.save_new_ap = function (ap) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var ap_id = null;
  db.serialize(function() {
    db.run("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented, headerName) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, ap.rentapHeadername, 
      function(err) {
        if (err) console.error(err) 
        else ap_id = this.lastID;
      }
    ); 
  });
  db.close
  return ap_id;
}

exports.save_ap = function (ap_id, ap) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var updated_id = null;
  db.serialize(function() {
    db.run("UPDATE tbl FullName = (?), SSN = (?), BirthDate = (?), MaritalStatus = (?), Email = (?), StateID = (?), Phone1 = (?), Phone2 = (?), CurrentAddress = (?), PriorAddresses = (?), ProposedOccupants = (?), ProposedPets = (?), Income = (?), Employment = (?), Evictions = (?), Felonies = (?), dateApplied = (?), dateGuested = (?), dateRented = (?), headerName = (?) WHERE rowid = (?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, ap.rentapHeadername, ap_id,
      function(err) {
        if (err) console.error(err) 
        else updated_id = this.lastID;
      }
    ); 
  });
  db.close
  return updated_id;
}
//should not have search.goodaps and search.trashaps, just search, which will
//decide which to search based on ap_id (if in trash or not)
exports.search_goodaps = function(pattern) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_goodaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_goodaps = rows; //will be null if error (or nothing matches, of course)
      }
    );
  });
  db.close
  return matching_goodaps;
}

exports.search_trashaps = function(pattern) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_trashaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_trashaps = rows; //will be null if error (or nothing matches, of course)
      }
    );
  });
  db.close
  return matching_trashaps;
}

exports.search_allaps = function(pattern) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_allaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_allaps = rows; //will be null if error (or nothing matches, of course)
      }
    );
  });
  db.close
  return matching_allaps;
}

exports.search_column = function(pattern) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var rows_with_matching_field = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        rows_with_matching_field = rows; //will be null if error (or nothing matches, of course)
      }
    );
  });
  db.close
  return rows_with_matching_field;
}
