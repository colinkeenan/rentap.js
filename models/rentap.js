exports.goodaps = function() { //rentap extension didn't provide this functionality
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var goodaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE id NOT IN (SELECT discardedRow FROM trash)", function(err, rows) {
      if (err) console.error(err);
      goodaps = rows; //will be null if error
    });
  });
  db.close
  return goodaps;
};

exports.trashaps = function() { //rentap extension didn't provide this functionality
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var trashaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE id IN (SELECT discardedRow FROM trash)", function(err, rows) {
      if (err) console.error(err);
      trashaps = rows; //will be null if error
    });
  });
  db.close
  return trashaps;
}

exports.goodnames = function() { //for dropdown list of full names to choose an ap from
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var goodnames = [];
  db.serialize(function() {
    db.all("SELECT FullName FROM tbl WHERE id NOT IN (SELECT discardedRow FROM trash)", function(err, rows) {
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
    db.all("SELECT FullName FROM tbl WHERE id IN (SELECT discardedRow FROM trash)", function(err, rows) {
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
      ap=row; //will be null if error
    });
  });
  db.close
  return ap;
}

exports.rm_ap = function (ap_id) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  db.serialize(function() {
    db.run("DELETE FROM tbl WHERE rowid = (?)", ap_id, function(err, row) {
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
    db.run("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented, headerID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ap.FullName, ap.SSN, ap.BirthDate, ap.MaritalStatus, ap.Email, ap.StateID, ap.Phone1, ap.Phone2, ap.CurrentAddress, ap.PriorAddresses, ap.ProposedOccupants, ap.ProposedPets, ap.Income, ap.Employment, ap.Evictions, ap.Felonies, ap.dateApplied, ap.dateGuested, ap.dateRented, ap.headerID, 
      function(err) {
        if (err) console.error(err) else ap_id = this.lastID;
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
    db.run("UPDATE tbl FullName = (?), SSN = (?), BirthDate = (?), MaritalStatus = (?), Email = (?), StateID = (?), Phone1 = (?), Phone2 = (?), CurrentAddress = (?), PriorAddresses = (?), ProposedOccupants = (?), ProposedPets = (?), Income = (?), Employment = (?), Evictions = (?), Felonies = (?), dateApplied = (?), dateGuested = (?), dateRented = (?), headerID = (?) WHERE rowid = (?)", ap.FullName, ap.SSN, ap.BirthDate, ap.MaritalStatus, ap.Email, ap.StateID, ap.Phone1, ap.Phone2, ap.CurrentAddress, ap.PriorAddresses, ap.ProposedOccupants, ap.ProposedPets, ap.Income, ap.Employment, ap.Evictions, ap.Felonies, ap.dateApplied, ap.dateGuested, ap.dateRented, ap.headerID, ap_id,
      function(err) {
        if (err) console.error(err) else updated_id = this.lastID;
      }
    ); 
  });
  db.close
  return updated_id;
}

exports.search_goodaps = function(pattern) {
  const sqlite3 = require('sqlite3');
  let db = new sqlite3.Database('./store.db');
  var matching_goodaps = [];
  db.serialize(function() {
    db.all("SELECT * FROM tbl WHERE id NOT IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
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
    db.all("SELECT * FROM tbl WHERE id IN (SELECT discardedRow FROM trash) AND FullName LIKE (?) OR SSN LIKE (?) OR BirthDate LIKE (?) OR MaritalStatus LIKE (?) OR Email LIKE (?) OR StateID LIKE (?) OR Phone1 LIKE (?) OR Phone2 LIKE (?) OR CurrentAddress LIKE (?) OR PriorAddresses LIKE (?) OR ProposedOccupants LIKE (?) OR ProposedPets LIKE (?) OR Income LIKE (?) OR Employment LIKE (?) OR Evictions LIKE (?) OR Felonies LIKE (?) OR dateApplied LIKE (?) OR dateGuested LIKE (?) OR dateRented LIKE (?)",
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
