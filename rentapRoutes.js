var express = require('express');
var router = express.Router();

var rentap_controller = require('./rentapController.js');

/* All the routes defined below are relative to /rentap because 
 * in app.js, there's a use /rentap as the router defined in
 * this file
 * i.e.  app.use('/rentap', rentapRouter); where var rentapRouter = require('./routes/rentap');
 */

/* routes for manipulating 
 * an individual ap */
router.get('/', rentap_controller.show_new_ap); //home page is just blank ap
router.get('/show/:ap_id', rentap_controller.show_ap); //show particular ap for viewing/editing/discarding (or deleting/restoring if in trash)
router.get('/show/:ap_id/prev', rentap_controller.show_ap_prev); //prev & next skips trash items (or if in trash, skips not trash items)
router.get('/show/:ap_id/next', rentap_controller.show_ap_next); 
router.get('/discard/:ap_id', rentap_controller.discard_ap);//just puts the rowid=ap_id in the trash table and shows next good ap
router.get('/show/:ap_id/switch_mode', rentap_controller.switch_mode); //for Trash and Back buttons, find the next ap_id in opposite mode
router.get('/restore/:ap_id', rentap_controller.restore_ap); //restores by removing rowid=ap_id from trash table
router.get('/delete/:ap_id', rentap_controller.rm_ap); //actually deletes the row from tbl, but only if in trash, then shows next in trash

/* routes for displaying a table of matching aps,
 * or just one column from matching aps*/
router.get('/goodaps', rentap_controller.show_goodaps); //table of aps not in trash
router.get('/trashaps', rentap_controller.show_trashaps); //table of trashed aps
router.get('/goodnames', rentap_controller.show_goodnames); //list of names not in trash
router.get('/trashnames', rentap_controller.show_trashnames); //list of trashed names

module.exports = router;
