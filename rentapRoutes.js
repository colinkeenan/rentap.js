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
router.post('/', rentap_controller.save_new_ap); //if changed, can post to save new app and get the new rowid if worked, or null if error

router.get('/show/:ap_id', rentap_controller.show_ap); //show particular ap for viewing/editing/discarding (or deleting/restoring if in trash)
router.post('/show/:ap_id', rentap_controller.save_ap); //if changed and not in trash, can post to save edited ap

router.get('/show/:ap_id/prev', rentap_controller.show_ap_prev); //prev & next skips trash items (or if in trash, skips not trash items)
router.get('/show/:ap_id/next', rentap_controller.show_ap_next); 
router.get('/discard/:ap_id', rentap_controller.discard_ap);//just puts the rowid=ap_id in the trash table and shows next good ap
router.get('/show/:ap_id/switch_mode', rentap_controller.switch_mode); //for Trash and Back buttons, find the next ap_id in opposite mode
router.get('/restore/:ap_id', rentap_controller.restore_ap); //restores by removing rowid=ap_id from trash table
router.get('/delete/:ap_id', rentap_controller.rm_ap); //actually deletes the row from tbl, but only if in trash, then shows next in trash

router.get('*/jump', rentap_controller.show_ap); //show_ap and hopefully trigger auto submit to post what row to jump to
router.post('*/jump', rentap_controller.show_ap_rownum); //for the "Go" button which jumps to the row entered from the one shown (ap_id)
//It's the same "Go" button for Trash and not trash, so jump_ap decides based on current mode

router.get('/showSelected', rentap_controller.show_ap); //again, show_ap and trigger auto submit
router.post('/showSelected', rentap_controller.selected_ap); //for the dropdown list of names

/* routes for manipulating headers
 * need to continue showing the same ap while working on header list 
 * so view post buttons preserve req.originaUrl and just add /header etc to end */
router.get('*/header/update', rentap_controller.show_ap);
router.post('*/header/update', rentap_controller.header_update); //show the header that user selected or that matches the displayed ap

router.get('*/header', rentap_controller.show_ap);
router.post('*/header', rentap_controller.save_new_header); //if not empty, save new header

router.get('*/header/save', rentap_controller.show_ap);
router.post('*/header/save', rentap_controller.save_header); //if actually changed, save changes

router.get('*/header/delete', rentap_controller.show_ap); 
router.post('*/header/delete', rentap_controller.rm_header); //actually deletes the row from headers without verifying

router.get('*/header/default', rentap_controller.show_ap); 
router.post('*/header/default', rentap_controller.set_default_header); 

/* routes for displaying a table of matching aps,
 * or just one column from matching aps*/
router.get('/goodaps', rentap_controller.show_goodaps); //table of aps not in trash
router.get('/trashaps', rentap_controller.show_trashaps); //table of trashed aps
router.get('/goodnames', rentap_controller.show_goodnames); //list of names not in trash
router.get('/trashnames', rentap_controller.show_trashnames); //list of trashed names
router.get('/show/:ap_id/search/all', rentap_controller.search_allaps); //searches every column for pattern (from post) and returns matching rows. searches both goodaps and trashaps
router.get('/show/:ap_id/search', rentap_controller.search); //searches every column for pattern (from post) and returns matching rows. searches trash if ap_id in trash, otherwise, goodaps.
router.get('/show/:ap_id/search/:column/all', rentap_controller.search_col_allaps); //searches specified column for pattern (from post) and returns matching rows. searches both goodaps and trashaps
router.get('/show/:ap_id/search/:column', rentap_controller.search_col); //searches specified column for pattern (from post) and returns matching rows. searches trash if ap_id in trash, otherwise, goodaps.

module.exports = router;
