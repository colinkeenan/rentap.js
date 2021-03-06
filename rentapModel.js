exports.create_db = function(callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db'); //the database being created (or opened if already exists)
  db.serialize(function() {
    //create tbl (if it doesn't already exist) with all 20 columns accepting text (sqlite only has a few datatypes and text is the only suitable one)
    db.run("CREATE TABLE IF NOT EXISTS tbl (FullName text, SSN text, BirthDate text, MaritalStatus text, Email text, StateID text, Phone1 text, Phone2 text, CurrentAddress text, PriorAddresses text, ProposedOccupants text, ProposedPets text, Income text, Employment text, Evictions text, Felonies text, dateApplied text, dateGuested text, dateRented text, headerName text)", 
      function(err) { 
        if (err) {
          console.error('Create tbl table', err); 
          callback(err);
        } 
      }
    ); 
    //create headers with 4 columns, all text again
    db.run("CREATE TABLE IF NOT EXISTS headers (StreetAddress text, CityStateZip text, Title text, Name text PRIMARY Key)", 
      function(err) { 
        if (err) {
          console.error('Create headers table', err); 
          callback(err);
        } 
      }
    ); 
    //create trash with just 1 column of integers (the rows in tbl that are discarded)
    db.run("CREATE TABLE IF NOT EXISTS trash (discardedRow integer)", 
      function(err) { 
        if (err) {
          console.error('Create trash table', err); 
          callback(err);
        } 
        else callback(null);
      }
    ); 
  });
  //create deleted with just 1 column of integers (the rows in tbl that are deleted)
  db.run("CREATE TABLE IF NOT EXISTS deleted (deletedRow integer)", 
      function(err) { 
        if (err) {
          console.error('Create deleted table', err); 
          callback(err);
        } 
        else callback(null);
      }
  ); 
  db.close();
}

// if ap_id is in trash, mode is 'discarded', else 'edit' 
// (don't need to call on the database to figure out if an ap is 'new') 
// getmode is not exported, just used as needed by other methods
var getmode = function (ap_id, switch_mode, callback) { //callback gets mode of ap_id (or it's opposite if switch_mode)
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.get("SELECT CASE WHEN (?) IN (SELECT discardedRow FROM trash) THEN 'discarded' ELSE 'edit' END mode", ap_id, function(err, ap) {
      if (err) console.error(err);
      callback(!switch_mode && ap ? ap.mode : (ap && ap.mode==='discarded' ? 'edit' : 'discarded'));
    });
  });
  db.close();
};

let savedRownum = 0; //just for keeping track of what the rownum was when switch to trash

//rownum should be passed as 0 when switch_mode is false because the rownum will be looked up based on ap_id
exports.getaps = function(ap_id, rownum, switch_mode, callback) { //callback {aps, rownum, mode} where rownum is the (index in aps where tbl.rowid = ap_id)
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  if (ap_id < 0 ) { // negative ap_id means set mode to edit and return all goodaps. 
    db.serialize(function() {
      db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT deletedRow FROM deleted) AND rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
        if (err) console.error(err);
        callback({aps:aps, rownum:rownum, mode:'edit'});
      });
    });
    db.close();
  } else {
    // if switch_mode is true, then instead of returning aps in the same mode as ap_id, return aps of the opposite mode
    // (getmode takes care of switching the mode)
    getmode(ap_id, switch_mode, function(mode) {
      db.serialize(function() {
        if (mode==='discarded') // if switch_mode, just entering trash. 
          db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
            if (err) console.error(err);
            if (!switch_mode) rownum = aps.findIndex(ap => ap.rowid == ap_id); //this is where rownum gets assigned when not switchmode
            else {
              savedRownum = rownum; // just entered trash, so save rownum for later display when leave trash
              rownum = 1; //just display the 1st ap in trash (0th ap in trash is Instructions)
            }
            callback({aps:aps, rownum:rownum, mode:mode});
          });
        else // just leaving trash if switch_mode
          db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT deletedRow FROM deleted) AND rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
            if (err) console.error(err);
            if (!switch_mode) rownum = aps.findIndex(ap => ap.rowid == ap_id); //this is where rownum gets assigned when not switch_mode
            else rownum = savedRownum; // just left trash so display same ap that entered trash from
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
      callback(headers);
    });
  });
  db.close();
}

exports.save_header = function(hdr, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.all("SELECT Name FROM headers WHERE Name = (?)", hdr.Name, function(err, header) {
      if (err) console.error('SELECT Name FROM headers...', err);
      let db = new sqlite3.Database('./store.db'); //for some reason, the db is already closed at this point
      db.serialize(function() {
        if (header.Name) db.run("UPDATE headers SET StreetAddress = (?), CityStateZip = (?), Title = (?) WHERE Name = (?)", hdr.StreetAddress, hdr.CityStateZip, hdr.Title, hdr.Name, 
          function(err) { if (err) console.error('UPDATE headers ', err); }
        );
        else db.run("INSERT INTO headers (StreetAddress, CityStateZip, Title, Name) VALUES (?,?,?,?)", hdr.StreetAddress, hdr.CityStateZip, hdr.Title, hdr.Name, 
          function(err) { if (err) console.error('INSERT INTO headers ', err); }
        );
        db.all("SELECT * FROM headers ORDER BY name", function(err, headers) {
          if (err) console.error('SELECT * FROM headers ', err);
          headers.push({ StreetAddress: '', CityStateZip: '', Title: '', Name: 'Choose Header' });
          callback(headers);
        });
      });
      db.close();
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
  getmode(ap_id, false, function(mode) { // false here means don't switch mode
    const sqlite3 = require('sqlite3');
    let db = new sqlite3.Database('./store.db');
    db.serialize(function() {
      if (mode==='discarded')
        db.all("SELECT FullName, rowid FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, names) {
          if (err) console.error(err);
          callback(names);
        });
      else
        db.all("SELECT FullName, rowid FROM tbl WHERE rowid NOT IN (SELECT deletedRow FROM deleted) AND rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, names) {
          if (err) console.error(err);
          callback(names);
        });
    });
    db.close();
  });
};

/*
 * Decided to stay with the ap when discarding and restoring so it will be easier for the user to confirm what happened
 * and delete or restore after discarding.
 */
exports.discard_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    //adding ap_id to trash "discards" the row without actually changing it in tbl
    db.run("INSERT INTO trash (discardedRow) VALUES (?)", ap_id, function(err, ap) {
      if (err) console.error(err);
    });
    //update aps now that this ap is in trash
    db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      let rownum = aps.findIndex(ap => ap.rowid == ap_id);
      callback({aps:aps, rownum:rownum, mode:'discarded'});
    });
  });
};

exports.restore_ap = function (ap_id, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    //removing ap_id from trash "restores" the row without actually changing it in tbl
    db.run("DELETE FROM trash WHERE discardedRow = (?)", ap_id, function(err, ap) {
      if (err) console.error(err);
    });
    //update aps now that this ap has been restored
    db.all("SELECT rowid, * FROM tbl WHERE rowid NOT IN (SELECT deletedRow FROM deleted) AND rowid NOT IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      let rownum = aps.findIndex(ap => ap.rowid == ap_id);
      callback({aps:aps, rownum:rownum, mode:'edit'});
    });
  });
};

exports.save = function (ap, headerName, callback) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  if (ap.mode == 'new') {
    db.serialize(function() {
      db.run("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented, headerName) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, headerName, 
        function(err) {
          if (err) console.error(err); 
          callback(this.lastID);
        }
      ); 
    });
    db.close();
  } else {
    db.serialize(function() {
      db.run("UPDATE tbl SET FullName = (?), SSN = (?), BirthDate = (?), MaritalStatus = (?), Email = (?), StateID = (?), Phone1 = (?), Phone2 = (?), CurrentAddress = (?), PriorAddresses = (?), ProposedOccupants = (?), ProposedPets = (?), Income = (?), Employment = (?), Evictions = (?), Felonies = (?), dateApplied = (?), dateGuested = (?), dateRented = (?), headerName = (?) WHERE rowid = (?)", ap.fullname, ap.ssnumber, ap.birthdate, ap.maritalstatus, ap.email, ap.stateid, ap.phone1, ap.phone2, ap.currentaddress, ap.previousaddresses, ap.occupants, ap.pets, ap.income, ap.employment, ap.evictions, ap.felonies, ap.authdate, ap.guestdate, ap.rentdate, headerName, ap.rentapID,
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
    //also delete from trash so a future ap with same ap_id doesn't end up in trash on creation
    db.run("DELETE FROM trash WHERE discardedRow = (?)", ap_id, function(err) { 
      if (err) console.error(err);
    });
    db.all("SELECT rowid, * FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) ORDER BY rowid", function(err, aps) {
      if (err) console.error(err);
      callback({aps:aps, rownum:rownum , mode:'discarded'});
    });
  });
};

/* searching accross multiple columns doesn't work for some reason. Doing searches using pure javascript in rentapController
exports.search = function(ap_id, pattern, callback) {
  getmode(ap_id, false, function(mode) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    if (mode==='discarded')
      db.all("SELECT FullName, rowid FROM tbl WHERE rowid IN (SELECT discardedRow FROM trash) AND (FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)) ORDER BY rowid",
        pattern, function(err, matching_names) {
          if (err) console.error(err);
          matching_names.push({ FullName: 'Choose from Search Results', rowid: 0 });
          callback(matching_names);
        }
      );
    else
      db.all("SELECT FullName, rowid FROM tbl WHERE rowid NOT IN (SELECT discardedRow FROM trash) AND (FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)) ORDER BY rowid",
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
*/
