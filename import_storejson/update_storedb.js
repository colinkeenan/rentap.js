var headerIDarray = require('./badheaders.json'); 
require('fs').unlinkSync('./badheaders.json', function (err) {
  if (err) {
    console.error(err);
  }
});                               ; 

const sqlite3 = require('sqlite3');
let db = new sqlite3.Database('./store.db'); //the database being verified
db.serialize(function() {

  //update tbl with answers that are in headerIDarray
  stmt = db.prepare("UPDATE tbl SET headerID = (?) WHERE rowid = (?)");
  for (i = 0; i < headerIDarray.length; i++) {
    stmt.run(headerIDarray[i]);
  }
  stmt.finalize();

  //show records still not matching headers.rowid, if any
  var bad1st = 1;
  db.each("SELECT rowid AS id, FullName, headerID FROM tbl WHERE headerID IS NULL OR headerID NOT IN (SELECT rowid FROM headers)", function(err, row) {
    if (bad1st) {
      console.log("\nNAMES WITH IMPROPER headerID (shown between angle brackets <>)\n");
      bad1st = 0;
    }
    console.log(row.id + " <" + row.headerID + ">:" + row.FullName + ", ");
  });

  //show it worked by listing good names and discarded ones separately along with header names

  var good1st = 1;
  db.each("SELECT tbl.rowid AS id, tbl.FullName, tbl.headerID, headers.Name FROM tbl JOIN headers ON tbl.headerID = headers.rowid WHERE id NOT IN (SELECT discardedRow FROM trash)", function(err, row) {
    if (good1st) {
      console.log("\nGOOD NAMES WITH HEADER NAME\n");
      good1st = 0;
    }
    console.log(row.id + " " + row.Name + " " + row.headerID + ": " + row.FullName);
  });

  var trash1st = 1;
  db.each("SELECT tbl.rowid AS id, tbl.FullName, tbl.headerID, headers.Name FROM tbl JOIN headers ON tbl.headerID = headers.rowid WHERE id IN (SELECT discardedRow FROM trash)", function(err, row) {
    if (trash1st) {
      console.log("\nTRASHED NAMES WITH HEADER NAME\n");
      trash1st = 0;
    }
    console.log(row.id + " " + row.Name + " " + row.headerID + ": " + row.FullName);
  });

}); //ends db.serialize(function() {
db.close();
