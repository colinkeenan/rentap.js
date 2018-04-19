var express = require('express');
var router = express.Router();

var rentap_controller = require('../controllers/rentapController.js');

/* All the routes defined below are relative to /rentap because 
 * in app.js, there's a use /rentap as the router defined in
 * this file
 * i.e.  app.use('/rentap', rentapRouter); where var rentapRouter = require('./routes/rentap');
 */

/* routes for manipulating 
 * an individual ap */
router.get('/', rentap_controller.show_new_ap); //home page is just blank ap
router.get('/show/:ap_id', rentap_controller.show_ap); //show particular ap for viewing/editing/discarding (or deleting/restoring if in trash)

router.post('/', rentap_controller.save_new_ap); //if changed, can post to save new app and get the new rowid if worked, or null if error
router.post('/show/:ap_id', rentap_controller.save_ap); //if changed and not in trash, can post to save edited ap
router.post('/discard/:ap_id', rentap_controller.discard_ap); //just puts the rowid in the trash table
router.post('/restore/:ap_id/trash', rentap_controller.restore_ap); //restores by removing rowid from trash table
router.post('/delete/:ap_id/trash', rentap_controller.rm_ap); //actually deletes the row from tbl, but only if in trash

/* routes for displaying a table of matching aps,
 * or just one column from matching aps*/
router.get('/goodaps', rentap_controller.show_goodaps); //table of aps not in trash
router.get('/trashaps', rentap_controller.show_trashaps); //table of trashed aps
router.get('/goodnames', rentap_controller.show_goodnames); //list of names not in trash
router.get('/trashnames', rentap_controller.show_trashnames); //list of trashed names
router.get('/find/:pattern', rentap_controller.search_allaps); //searches every column for pattern and returns matching rows
router.get('/find/:pattern/good', rentap_controller.search_goodaps); //same but exclude rows in trash
router.get('/find/:pattern/good/col/:column', rentap_controller.search_col_good); //same but exclude rows in trash
router.get('/find/:pattern/trash', rentap_controller.search_trashaps); //same but only rows in trash
router.get('/find/:pattern/trash/col/:column', rentap_controller.search_col_trash); //same but only rows in trash
router.get('/find/:pattern/col/:column', rentap_controller.search_column); //search only the specified column for pattern and return matching rows

module.exports = router;
