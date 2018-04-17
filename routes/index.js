var express = require('express');
var router = express.Router();

var rentap_controller = require('../controllers/rentapController.js');

/* manipulating 
 * individual ap */
router.get('/', rentap_controller.show_new_ap); //home page is just blank ap
router.post('/', rentap_controller.save_new_ap); //if changed, can post to save it and get the new rowid if worked, or null if error
router.get('/:ap_id', rentap_controller.show_ap); //show particular ap for viewing/editing/discarding (or deleting/restoring if in trash)
router.post('/:ap_id', rentap_controller.save_ap); //if changed and not in trash, can post to save edited ap
router.post('/:ap_id/discard', rentap_controller.discard_ap); //just puts the rowid in the trash table
router.post('/trash/:ap_id/delete', rentap_controller.rm_ap); //actually deletes the row from tbl, but only if in trash, getting null if error
router.post('/trash/:ap_id/restore', rentap_controller.restore_ap); //restores by removing rowid from trash table

/* displaying table of matching aps,
 * or just one column from matching aps*/
router.get('/goodaps', rentap_controller.show_goodaps); //table of aps not in trash
router.get('/trashaps', rentap_controller.show_trashaps); //table of trashed aps
router.get('/goodnames', rentap_controller.show_goodnames); //list of names not in trash
router.get('/trashnames', rentap_controller.show_trashnames); //list of trashed names
router.get('/find/:pattern', rentap_controller.search_allaps); //searches every column for pattern and returns matching rows
router.get('/find_in_good/:pattern', rentap_controller.search_goodaps); //same but exclude rows in trash
router.get('/find_in_trash/:pattern', rentap_controller.search_trashaps); //same but only rows in trash
router.get('/find_in_col/:column/:pattern', rentap_controller.search_column); //search only the specified column for pattern and return matching rows
router.get('/find_in_col_good/:column/:pattern', rentap_controller.search_col_good); //same but exclude rows in trash
router.get('/find_in_col_trash/:column/:pattern', rentap_controller.search_col_trash); //same but only rows in trash

module.exports = router;
