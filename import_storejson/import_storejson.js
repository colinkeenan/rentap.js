// Run this with nodejs. It converts store.json (must be in same directory as this script) 
// to an sqlite database named store.db for use in rentap.js (a nodejs app).

// INTITcsv would only be necessary if store.json was empty, but there's no reason to use this script in that case. Including for completeness.
var INITcsv = ['"My First M Last","###-##-####","mo/dy/year","Single/Divorced/Seperated/Married","emailname@emailprovider.com","driver\'s license/ID# and State","555-321-4321","555-123-1234","9080 Example Blvd, $200/mo' +
'\nCity, ST  Zip' +
'\nJun\'09 - present' +
'\nMr. Landlord 555-555-5555","7060 Example Ave, $525/mo' +
'\nCity, ST  Zip, Aug\'08 - Jun\'09' +
'\nMr. Landlord 555-444-4444' +
'\n' +
'\n5040 Example St, Free' +
'\nCity, ST  Zip, Jun\'08 - July\'08' +
'\nRelative/Shelter 555-333-3333' +
'\n' +
'\n3020 Example Rd, $175/wk' +
'\nCity, ST  Zip, -Dec\'07 - May\'08' +
'\nHotel 555-222-2222","My First M Last, age' +
'\nFirst M Last, age, friend/spouse/relative","name, age, type of animal & breed, size' +
'\n' +
'\nor N/A","$200/mo Food Stamps' +
'\n$175 every two weeks from job listed below","Company Name' +
'\nAddress' +
'\nCity, ST  Zip' +
'\n' +
'\nas' +
'\n' +
'\nPosition, # hours/wk, under' +
'\nMs. Supervisor 555-111-1111' +
'\nfor # months/years","Company or Person that evicted you in Month/Year from Address, City, ST  Zip","Offense, County, State, Date, D.O.C. ID, and, if currently on parole/probation, include P.O. name and phone number.","mo/dy/year","","","","","Instructions by Example"'];

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

function arrayofcsvToArrayofArrays(arrayofcsv) {
   var INITARRAY = [[]];
   var arrayofArrays = [[]];
   if (typeof(arrayofcsv) != 'undefined') {
      for(var i=0; i<arrayofcsv.length; i++) {
         if (typeof(arrayofcsv[i]) === 'string') {
            arrayofArrays[i] = CSV.csvToArray(arrayofcsv[i])[0];
         } else if (i === 0) {
               arrayofArrays = CSV.csvToArray(INITcsv)[0];
         } else {
            arrayofArrays[i] = [null];
         }
      }
   } else {  
      arrayofArrays = INITcsv;
   }
   if (arrayofArrays === INITARRAY)
      arrayofArrays = INITcsv;
   return arrayofArrays;
}

var storejson = require('./store.json'); //from rentap firefox addon - want to convert it to sqlite and save as store.db
var rentaps = arrayofcsvToArrayofArrays(storejson.csv);
var headers = storejson.RHEADER;
var trash = storejson.trash;

const sqlite3 = require('sqlite3');
let db = new sqlite3.Database('./store.db'); //the database being created
db.serialize(function() {

  //create tbl with all 20 columns accepting text (sqlite only has a few datatypes and text is the only suitable one)
  db.run("CREATE TABLE tbl (FullName text, SSN text, BirthDate text, MaritalStatus text, Email text, StateID text, Phone1 text, Phone2 text, CurrentAddress text, PriorAddresses text, ProposedOccupants text, ProposedPets text, Income text, Employment text, Evictions text, Felonies text, dateApplied text, dateGuested text, dateRented text, headerName text)"); 
  //insert all the rentaps read from store.json
  var stmt = db.prepare("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (i = 0; i < rentaps.length; i++) {
    //inserts the ith rentap into db (store.db) up to dateRented, will later lookup headerName based on 
    //[headers.StreetAddress, headers.CityStateZip] = [rentaps[i][19], rentaps[i][20]]
    stmt.run(rentaps[i].slice(0,19));
  } 
  stmt.finalize();

  //remove null rows
  db.run("DELETE FROM tbl WHERE FullName IS NULL"); //this will leave blank-space names, which is fine - just getting rid of actually null rows

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
    stmt.run(trash[i] + 1); //have to add one because sqlite starts from 1 instead of 0
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

  //give list of headers
  var header1st = 1;
  db.each("SELECT rowid AS id, * FROM headers", function(err,row) {
    if (header1st) {
      console.log("\nLIST OF HEADERS\n");
      header1st = 0;
    }
    console.log(row.id + " " + row.Name + ": " + row.StreetAddress + ", " + row.CityStateZip + " " + row.Title);
  });

  //then, get correct headerName for each null
  var answers = 0;
  var headerNameArray = [];
  var readlineSync = require('readline-sync');

  //db.each rows with null headerNames showing the corresponding headerAddress
  db.each("SELECT tbl.rowid AS id, tbl.FullName, tbl.headerName, ha.StreetAddress, ha.CityStateZip FROM tbl JOIN headerAddresses AS ha ON id = ha.rowid WHERE headerName IS NULL",

    function(err, row) { //1st callback function: row callback (for each null headerName, get the correct one from user)
      if (!answers) {
        console.log("\nSUPPLY " + badcount + " headerNames THAT COULD NOT BE DETERMINED AUTOMATICALLY\n");
      }
      console.log(row.id + ": " + row.FullName + ", " + row.StreetAddress + ", " + row.CityStateZip);
      var answer = readlineSync.questionInt('Correct headerName? ');
      answers++;
      headerNameArray.push([answer, row.id]);
    }, //end 1st callback (row callback) 

    function(err,rowcount) { //2nd callback function: complete callback which is called after the row callback is called for the last row
      let db = new sqlite3.Database('./store.db'); //the database being verified has been closed by now, but I don't know why
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
      db.close(); //closing the 2nd time opened the database
    }//ends 2nd callback (complete callback)
  );//ends db.each for rows with null headerNames showing the corresponding headerAddress 

  //done using headerAddresses table and not needed for rentap.js
  db.run("DROP TABLE headerAddresses");

}); //ends db.serialize(function() {
db.close(); //this one gets called first, or the database just closes for some other reason before the 2nd callback is called, I don't know


