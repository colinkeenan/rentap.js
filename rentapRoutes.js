var express = require('express');
var router = express.Router();

var rentap_controller = require('./rentapController.js');

/* All the routes defined below are relative to /rentap because 
 * in app.js, there's a use /rentap as the router defined in
 * this file
 * i.e.  app.use('/rentap', rentapRouter); where var rentapRouter = require('./routes/rentap');
 */

router.get('/', rentap_controller.show_new_ap); //home page is just blank ap
router.get('/show/:ap_id', rentap_controller.show_ap); //show particular ap for viewing/editing/discarding (or deleting/restoring if in trash)
router.get('/show/:ap_id/prev', rentap_controller.show_ap_prev); //prev & next skips trash items (or if in trash, skips not trash items)
router.get('/show/:ap_id/next', rentap_controller.show_ap_next); 
router.get('/discard/:ap_id', rentap_controller.discard_ap);//just puts the rowid=ap_id in the trash table and shows next good ap
router.get('/show/:ap_id/switch_mode', rentap_controller.switch_mode); //for Trash and Back buttons, find the next ap_id in opposite mode
router.get('/restore/:ap_id', rentap_controller.restore_ap); //restores by removing rowid=ap_id from trash table
router.get('/delete/:ap_id', rentap_controller.rm_ap); //actually deletes the row from tbl, but only if in trash, then shows next in trash
router.get('/deleteheader/:headername', rentap_controller.rm_header); //deletes the header
router.get('/deleteheader', rentap_controller.rm_header); //deletes header with no name
router.post('*', rentap_controller.form_submission); //post can happen on any route because it's based on user clicking a button or pressing enter, 
//so form_submission ignores the route and determines what to do from info on the form
//the result of a submission is to always go back to the route the post came from

module.exports = router;
