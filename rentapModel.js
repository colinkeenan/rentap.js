// if ap_id is in trash, mode is 'discarded', else 'edit' 
// (don't need to call on the database to figure out if an ap is 'new') 
// getmode is not exported, just used as needed by other methods
var getmode = function (ap_id, callback) { //callback gets mode
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.get("SELECT CASE WHEN (?) IN (SELECT discardedRow FROM trash) THEN 'discarded' ELSE 'edit' END mode", ap_id, function(err, ap) {
      if (err) console.error(err);
      callback(ap.mode);
    });
  });
  db.close();
};

exports.getaps = function(ap_id, switch_mode, callback) { //callback {aps, rownum, mode} where rownum is the (index in aps where tbl.rowid = ap_id)
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var rownum = 0; // will stay 0 if ap_id is negative, or if switch_mode is true
  if (ap_id < 0 ) { // negative ap_id means set mode to edit and return all goodaps. like true switch_mode, rownum will be 0.
    db.serialize(function() {
      db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
        if (err) console.error(err);
        callback({aps:aps, rownum:rownum, mode:'edit'});
      });
    });
    db.close();
  } else {
    getmode(ap_id, function(mode) {
     // if switch_mode is true, then instead of returning aps in the same mode as ap_id, return aps of the opposite mode
      if (switch_mode) mode = mode==='discarded' ? 'edit' : 'discarded';
      db.serialize(function() {
        if (mode==='discarded')
          db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
            if (err) console.error(err);
            if (!switch_mode) rownum = aps.findIndex(ap => ap.rowid == ap_id); //this is where rownum gets assigned (switch_mode is false)
            callback({aps:aps, rownum:rownum, mode:mode});
          });
        else
          db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
            if (err) console.error(err);
            if (!switch_mode) rownum = aps.findIndex(ap => ap.rowid == ap_id); //this is where rownum gets assigned (switch_mode is false)
            callback({aps:aps, rownum:rownum, mode:mode});
          });
      });
      db.close();
    });
  }
};

exports.getheaders = function(callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.all("SELECT * FROM headers ORDER BY name", function(err, headers) {
      if (err) console.error(err);
      headers.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
      callback(headers);
    });
  });
  db.close();
}

exports.add_header = function(hdr, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.run("INSERT INTO headers (StreetAddress, CityStateZip, Title, Name) VALUES (?,?,?,?)", hdr.StreetAddress, hdr.CityStateZip, hdr.Title, hdr.Name, 
      function(err) {
        if (err) console.error(err);
      }
    );
    db.all("SELECT * FROM headers ORDER BY name", function(err, headers) {
      if (err) console.error(err);
      headers.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
      callback(headers);
    });
  });
  db.close();
}

exports.update_header = function(hdr, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.run("UPDATE headers SET StreetAddress = (?), CityStateZip = (?), Title = (?) WHERE Name = (?)", hdr.StreetAddress, hdr.CityStateZip, hdr.Title, hdr.Name, 
      function(err) {
        if (err) console.error(err);
      }
    );
    db.all("SELECT * FROM headers ORDER BY name", function(err, headers) {
      if (err) console.error(err);
      headers.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
      callback(headers);
    });
  });
  db.close();
}

exports.rm_header = function(headername, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.run("DELETE FROM headers WHERE Name = (?)", headername, 
      function(err) {
        if (err) console.error(err);
      }
    );
    db.all("SELECT * FROM headers ORDER BY name", function(err, headers) {
      if (err) console.error(err);
      headers.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
      callback(headers);
    });
  });
  db.close();
}

exports.names = function(ap_id, callback) { //for dropdown list of full names to choose an ap from
  //sometimes ap_id will be undefined, but that's OK because getmode just checks if it's trash, and undefined is not trash, so will
  //say the mode is edit. that works because want all goodnames when on a new ap (can only click New when on a goodap and 
  //also, a new ap is shown on first starting so want to be able to select a good name in either case).
  getmode(ap_id, function(mode) {
    const sqlite3 = require('sqlite3');
    let db = new sqlite3.Database('./store.db');
    db.serialize(function() {
      if (mode==='discarded')
        db.all("SELECT FullName, rowid FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, names) {
          if (err) console.error(err);
          names.push({ FullName: 'Choose Name', rowid: 0 });
          callback(names);
        });
      else
        db.all("SELECT FullName, rowid FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, names) {
          if (err) console.error(err);
          names.push({ FullName: 'Choose Name', rowid: 0 });
          callback(names);
        });
    });
    db.close();
  });
};

exports.discard_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var next_rownum
  db.serialize(function() {
    //get rownum (which becomes next_rownum after trashing it). no need to get the mode because discard can only be called when not in trash
    db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      next_rownum = aps.findIndex(ap => ap.rowid == ap_id);
      //no need to add 1 to the rownum because will be discarding this ap, moving the next one to the same rownum
      //wrap around from 0 to end of list or from end of list to 0
      if (next_rownum < 0) next_rownum = aps.length - 2; //this would only happen if there was an error getting rownum with =>
      if (next_rownum > aps.length - 2) next_rownum = 0; //the last index will be length-2 instead of length-1 because discarding one
    });
    //adding ap_id to trash "discards" the row without actually changing it in tbl
    db.run("INSERT INTO trash (discardedRow) VALUES (?)", ap_id, function(err, ap) {
      if (err) console.error(err);
    });
    //update aps now that this ap is in trash
    db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      callback({aps:aps, rownum:next_rownum, mode:'edit'});
    });
  });
};

exports.restore_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    //get rownum (which becomes next_rownum after restoring it). no need to get the mode because restore can only be called when in trash
    db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      next_rownum = aps.findIndex(ap => ap.rowid == ap_id);
      //no need to add 1 to the rownum because will be restoring this ap, moving the next one to the same rownum
      //wrap around from 0 to end of list or from end of list to 0
      if (next_rownum < 0) next_rownum = aps.length - 2; //this would only happen if there was an error getting rownum with =>
      if (next_rownum > aps.length - 2) next_rownum = 0; //the last index will be length-2 instead of length-1 because discarding one
    });
    //removing ap_id from trash "restores" the row without actually changing it in tbl
    db.run("DELETE FROM trash WHERE discardedRow = (?)", ap_id, function(err, ap) {
      if (err) console.error(err);
    });
    //update aps now that this ap has been restored
    db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      callback({aps:aps, rownum:next_rownum, mode:'discarded'});
    });
  });
};

exports.save = function (ap, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  if (ap.mode == 'new') {
    db.serialize(function() {
      db.run("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented, headerName) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, ap.headername, 
        function(err) {
          if (err) console.error(err); 
          callback(this.lastID);
        }
      ); 
    });
    db.close();
  } else {
    db.serialize(function() {
      db.run("UPDATE tbl SET FullName = (?), SSN = (?), BirthDate = (?), MaritalStatus = (?), Email = (?), StateID = (?), Phone1 = (?), Phone2 = (?), CurrentAddress = (?), PriorAddresses = (?), ProposedOccupants = (?), ProposedPets = (?), Income = (?), Employment = (?), Evictions = (?), Felonies = (?), dateApplied = (?), dateGuested = (?), dateRented = (?), headerName = (?) WHERE rowid = (?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, ap.headername, ap.rentapID,
        function(err) {
          if (err) console.error(err); 
          callback(ap.rentapID);
        }
      ); 
    });
    db.close();
  }
}

exports.rm_ap = function (ap_id, rownum, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() { //do not allow an ap to be deleted unless it is in trash
    db.run("DELETE FROM tbl WHERE rowid = (?) AND rowid IN (SELECT discardedRow FROM trash)", ap_id, function(err) {
      if (err) console.error(err);
    });
    db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      callback({aps:aps, rownum:rownum , mode:'discarded'});
    });
  });
};

exports.search = function(ap_id, pattern, callback) {
  getmode(ap_id, function(mode) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    if (mode==='discarded')
      db.all("SELECT FullName, rowid FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?) ORDER BY rowid",
        pattern, function(err, matching_names) {
          if (err) console.error(err);
          matching_names.push({ FullName: 'Choose from Search Results', rowid: 0 });
          callback(matching_names);
        }
      );
    else
      db.all("SELECT FullName, rowid FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?) ORDER BY rowid",
        pattern, function(err, matching_names) {
          if (err) console.error(err);
          matching_names.push({ FullName: 'Choose from Search Results', rowid: 0 });
          callback(matching_names);
        }
      );
    });
    db.close();
  });
};

//methods below here are not callable from the view yet
exports.search_allaps = function(pattern, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_allaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        matching_allaps = rows;
        callback(matching_allaps);
      }
    );
  });
  db.close();
};
//this doesn't do what it says - just copied above - can the column be passed in?
exports.search_column = function(pattern, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var rows_with_matching_field = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
      pattern, function(err, rows) {
        if (err) console.error(err);
        rows_with_matching_field = rows;
        callback(rows_with_matching_field);
      }
    );
  });
  db.close();
};
