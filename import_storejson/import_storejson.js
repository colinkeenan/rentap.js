// Run this with nodejs. It converts store.json (must be in same directory as this script) 
// to an sqlite database named store.db for use in rentap.js (a nodejs app).

/*
 * Here is the structure for the sqlite db, store.db, that will be created.
 * Only 3 tables: tbl, header, and trash
 *
 * header will only have 4 columns which hold the address being rented, title of the rental application, and name for the header to be used in a drop-down menu
 * trash  will only have 1 column which lists the rows currently in "Trash"
 * tbl    will contain all the important information obtained from the prospective tenant in the following 20 columns
 *
 * 1    FullName
 * 2    SSN
 * 3    BirthDate
 * 4    MaritalStatus
 * 5    Email
 * 6    StateID
 * 7    Phone1
 * 8    Phone2
 * 9    CurrentAddress
 * 10   PriorAddresses
 * 11   ProposedOccupants
 * 12   ProposedPets
 * 13   Income
 * 14   Employment
 * 15   Evictions
 * 16   Felonies
 * 17   dateApplied
 * 18   dateGuested
 * 19   dateRented
 * 20   headerName
 *       (StreetAddress, CityStateZip, Title, Name)
 * 
 * store.json directly stores the information from header but I just want to store headerName
 * The plan is to insert values for the first 19 columns from store.json into store.db tbl, then 
 * create a temporary 2 column table of header (StreetAddress, CityStateZip) to look up
 * and insert values for column 20, headerName
 *
 * Also need to store some information about the state of what's showing, but I don't think it needs to be stored in store.db. 
 * (It was in store.json to be able to return to the same state on restarting the browser, but I've decided that's not really a good idea.)
 * State variables would be row and mode: i.e. what row we're showing and what mode we're in (new, edit, discarded).
 * 
 */
var CSV = require('./ucsv-1.2.0.min.js'); //! ucsv v1.2.0 2014-04-09 * Copyright 2014 Peter Johnson * Licensed MIT, GPL-3.0 * https://github.com/uselesscode/ucsv

let storejson = require('./store.json'); //from rentap firefox addon - want to convert it to sqlite and save as store.db
let headers = storejson.RHEADER;
let trash = storejson.trash;

function arrayofcsvToArrayofArrays(arrayofcsv) {
  var arrayofArrays = [[]];
  if (typeof(arrayofcsv) != 'undefined') {
    for(var i=0; i<arrayofcsv.length; i++) {
      if (typeof(arrayofcsv[i]) === 'string') {
        arrayofArrays[i] = CSV.csvToArray(arrayofcsv[i])[0];
      } else {
        arrayofArrays[i] = [null]; //these null rows were deleted from trash - need to keep this somehow in store.db. Don't want to lose/change ID's
      }
    }
  }
  return arrayofArrays;
}
let rentaps = arrayofcsvToArrayofArrays(storejson.csv);

let not_shifted = 1;

const sqlite3 = require('sqlite3');
let db = new sqlite3.Database('./store.db'); //the database being created
db.serialize(function() {

  //create tbl with all 20 columns accepting text (sqlite only has a few datatypes and text is the only suitable one)
  db.run("CREATE TABLE tbl (FullName text, SSN text, BirthDate text, MaritalStatus text, Email text, StateID text, Phone1 text, Phone2 text, CurrentAddress text, PriorAddresses text, ProposedOccupants text, ProposedPets text, Income text, Employment text, Evictions text, Felonies text, dateApplied text, dateGuested text, dateRented text, headerName text)"); 
  //insert all the rentaps read from store.json
  var stmt = db.prepare("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  //I've decided not to use "Instructions by Example" which was rentaps[0] by default. The title was stored in rentaps[i][21].
  //If it was in trash, have to remove that too
  if (trash[0] === 0 && rentaps[0][21] === "Instructions by Example") trash.shift() //removes first element
  if (rentaps[0][21] === "Instructions by Example") {
    rentaps.shift();
    not_shifted = 0;
  }
  for (i = 0; i < rentaps.length; i++) {
    //inserts the ith rentap into db (store.db) up to dateRented, will later lookup headerName based on 
    //[headers.StreetAddress, headers.CityStateZip] = [rentaps[i][19], rentaps[i][20]]
    stmt.run(rentaps[i].slice(0,19));
  } 
  stmt.finalize();

  //create headers with 4 columns, all text again
  db.run("CREATE TABLE headers (StreetAddress text, CityStateZip text, Title text, Name text PRIMARY Key)"); 
  //insert all the headers (but no duplicates) read from store.json
  stmt = db.prepare("INSERT OR REPLACE INTO headers (StreetAddress, CityStateZip, Title, Name) VALUES (?,?,?,?)");
  for (i = 0; i < headers.length; i++) {
    //inserts the ith header into db (store.db) 
    stmt.run(headers[i]);
  } 
  stmt.finalize();

  //create headerAddresses with 2 column text (will drop this table after using it to look up headerName's for tbl)
  db.run("CREATE TABLE headerAddresses (StreetAddress text, CityStateZip text)"); 
  //insert all the headerAddresses read from rentaps in store.json
  stmt = db.prepare("INSERT INTO headerAddresses (StreetAddress, CityStateZip) VALUES (?,?)");
  for (i = 0; i < rentaps.length; i++) {
    //inserts the ith headerAddress from rentaps in store.json
    stmt.run(rentaps[i][19],rentaps[i][20]);
  } 
  stmt.finalize();

  //now need to lookup headerName for each rentap based on corresponding headderAddress
  db.run("UPDATE tbl SET headerName = (SELECT h.Name FROM headers AS h WHERE h.StreetAddress = (SELECT ha.StreetAddress FROM headerAddresses AS ha WHERE ha.rowid = tbl.rowid) AND h.CityStateZip = (SELECT ha.CityStateZip FROM headerAddresses AS ha WHERE ha.rowid = tbl.rowid))");

  //create trash with just 1 column of integers (the rows in tbl that are discarded)
  db.run("CREATE TABLE trash (discardedRow integer)"); 
  //insert all the trash read from store.json
  stmt = db.prepare("INSERT INTO trash (discardedRow) VALUES (?)");
  for (i = 0; i < trash.length; i++) {
    //inserts the ith discardedRow (just the row number) into db (store.db) 
    stmt.run(trash[i] + not_shifted); //have to add one (unless did rentap.shift()) because sqlite3 starts from 1 instead of 0
  } 
  stmt.finalize();

  //because the rentap extension allowed user to change the header address without assigning it to a new header, many tbl.headerName will be null now
  //So, find those null's and get user to choose correct header
  
  //show records not matching headers.rowid, if any
  var badcount = 0;
  db.each("SELECT rowid AS id, FullName, headerName FROM tbl WHERE headerName IS NULL OR headerName NOT IN (SELECT headerName FROM headers)", function(err, row) {
    if (!badcount) {
      console.log("\nNAMES WITH IMPROPER headerName (shown between angle brackets <>)\n");
    }
    console.log(row.id + " <" + row.headerName + ">:" + row.FullName + ", ");
    badcount++;
  });

  //give list of headers and make array of headerNames so can verify user enters valid response when getting correct headerNames
  let headerNames = [];
  var header1st = 1;
  db.each("SELECT rowid AS id, * FROM headers", function(err,row) {
    if (header1st) {
      console.log("\nLIST OF HEADERS\n");
      header1st = 0;
    }
    console.log(row.id + " " + row.Name + ": " + row.StreetAddress + ", " + row.CityStateZip + " " + row.Title);
    headerNames.push(row.Name);
  });

  //then, get correct headerName for each null
  let answers = 0;
  let headerNameArray = [];
  let readlineSync = require('readline-sync');

  //db.each rows with null headerNames showing the corresponding headerAddress
  db.each("SELECT tbl.rowid AS id, tbl.FullName, tbl.headerName, ha.StreetAddress, ha.CityStateZip FROM tbl JOIN headerAddresses AS ha ON id = ha.rowid WHERE headerName IS NULL",

    function(err, row) { //1st callback function: row callback (for each null headerName, get the correct one from user)
      if (!answers) {
        console.log("\nSUPPLY " + badcount + " headerNames THAT COULD NOT BE DETERMINED AUTOMATICALLY\n");
      }
      console.log(row.id + ": " + row.FullName + ", " + row.StreetAddress + ", " + row.CityStateZip);
      do {
        var answer = readlineSync.question('Correct headerName? ');
      } while (!headerNames.includes(answer))
      answers++;
      headerNameArray.push([answer, row.id]);
    }, //end 1st callback (row callback) 

    function(err,rowcount) { //2nd callback function: complete callback which is called after the row callback is called for the last row
      db.serialize(function() {
        //update tbl with answers that are in headerNameArray
        stmt = db.prepare("UPDATE tbl SET headerName = (?) WHERE rowid = (?)");
        for (i = 0; i < headerNameArray.length; i++) {
          stmt.run(headerNameArray[i]);
        }
        stmt.finalize();

        //show records still not matching headers.rowid, if any
        var bad1st = 1;
        db.each("SELECT rowid AS id, FullName, headerName FROM tbl WHERE headerName IS NULL OR headerName NOT IN (SELECT Name FROM headers)", function(err, row) {
          if (err) console.error(err);
          if (bad1st) {
            console.log("\nNAMES WITH IMPROPER headerNames (shown between angle brackets <>)\n");
            bad1st = 0;
          }
          console.log(row.id + " <" + row.headerName + ">:" + row.FullName + ", ");
        });

        //show it worked by listing good names and discarded ones separately along with header names

        var good1st = 1;
        db.each("SELECT tbl.rowid AS id, tbl.FullName, tbl.headerName, headers.Name FROM tbl JOIN headers ON tbl.headerName = headers.Name WHERE id NOT IN (SELECT discardedRow FROM trash)", function(err, row) {
          if (good1st) {
            console.log("\nGOOD NAMES WITH HEADER NAME\n");
            good1st = 0;
          }
          console.log(row.id + " " + row.Name + ": " + row.FullName);
        });

        var trash1st = 1;
        db.each("SELECT tbl.rowid AS id, tbl.FullName, tbl.headerName, headers.Name FROM tbl JOIN headers ON tbl.headerName = headers.name WHERE id IN (SELECT discardedRow FROM trash)", function(err, row) {
          if (trash1st) {
            console.log("\nTRASHED NAMES WITH HEADER NAME\n");
            trash1st = 0;
          }
          console.log(row.id + " " + row.Name + ": " + row.FullName);
        });
      }); //ends db.serialize(function() inside 2nd callback
      db.close();
    }//ends 2nd callback (complete callback)
  );//ends db.each for rows with null headerNames showing the corresponding headerAddress 

  //done using headerAddresses table and not needed for rentap.js
  db.run("DROP TABLE headerAddresses");

}); //ends db.serialize(function() {


