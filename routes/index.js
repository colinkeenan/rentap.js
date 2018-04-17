var express = require('express');
var router = express.Router();

var rentap_controller = require('../controllers/rentapController.js');

router.get('/', rentap_controller.show_new_ap);
router.post('/', rentap_controller.save_new_ap);
router.get('/:ap_id', rentap_controller.getap);
router.post('/:ap_id', rentap_controller.save_edited_ap;
router.post('/:ap_id/discard', rentap_controller.discard_ap);
router.post('/trash/:ap_id/delete', rentap_controller.rm_ap);


module.exports = router;
