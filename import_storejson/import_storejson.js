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
 * tbl    will contain all the important information obtained from the prospective tenant, as shown below
 *
 * 0  FullName
 * 1  SSN
 * 2  BirthDate
 * 3  MaritalStatus
 * 4  Email
 * 5  StateID
 * 6  Phone1
 * 7  Phone2
 * 8  CurrentAddress
 * 9  PriorAddresses
 * 10 ProposedOccupants
 * 11 ProposedPets
 * 12 Income
 * 13 Employment
 * 14 Evictions
 * 15 Felonies
 * 16 dateApplied
 * 17 dateGuested
 * 18 dateRented
 * 19 headerStreetAddress
 *   (header.StreetAddress, header.CityStateZip, header.Title, header.Name)
 *
 * using "." to mean coming from another table - not sure of the correct notation at the moment. 
 * Would like to store headerID in tbl instead of headerStreetAddress, but headerID was not stored 
 * in original store.json main table, (and neither was headerName)
 *
 * Also need to store some information about the state of what's showing, but I don't think it needs to be stored in store.db 
 * (it was stored in store.json for some reason)
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
var RHEADER = storejson.RHEADER;
var trash= storejson.trash;

const sqlite3 = require('sqlite3');
let db = new sqlite3.Database('./store.db'); //the database being created
db.serialize(function() {
  //create tbl with all 20 columns accepting text (sqlite only has a few datatypes and text is the only suitable one)
  db.run("CREATE TABLE tbl (FullName text, SSN text, BirthDate text, MaritalStatus text, Email text, StateID text, Phone1 text, Phone2 text, CurrentAddress text, PriorAddresses text, ProposedOccupants text, ProposedPets text, Income text, Employment text, Evictions text, Felonies text, dateApplied text, dateGuested text, dateRented text, headerName text)"); 
  //insert all the rentaps read from store.json
  var stmt = db.prepare("INSERT INTO tbl (FullName, SSN, BirthDate, MaritalStatus, Email, StateID, Phone1, Phone2, CurrentAddress, PriorAddresses, ProposedOccupants, ProposedPets, Income, Employment, Evictions, Felonies, dateApplied, dateGuested, dateRented, headerName) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (var i = 0; i < rentaps.length; i++) {
    //inserts the ith rentap into db (store.db), but rentaps[i] contains more than 20 items while tbl only has 20 columns (so using slice)
    stmt.run(rentaps[i].slice(0,20));
  } 
  stmt.finalize();

  db.each("SELECT rowid AS id, FullName FROM tbl", function(err, row) {
    console.log(row.id + ": " + row.FullName);
  });
});

db.close();
 
