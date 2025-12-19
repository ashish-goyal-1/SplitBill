var express = require('express');
var controller = require('../components/group')

var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource')
})

//Add Group router
router.post('/v1/add', controller.createGroup)

//View Group router 
router.post('/v1/view', controller.viewGroup)

//View User groups router
router.post('/v1/user', controller.findUserGroup)

//Edit group router
router.post('/v1/edit', controller.editGroup)

//Settlement Calculator router 
router.post('/v1/settlement', controller.groupBalanceSheet)

//Make settlement router 
router.post('/v1/makeSettlement', controller.makeSettlement)

//Debt Consolidation - Cross-group balance aggregation
router.post('/v1/consolidate', controller.consolidateUserDebts)

//Delete group router
router.delete('/v1/delete', controller.deleteGroup)

//Send payment reminder (nudge) router
router.post('/v1/nudge', controller.sendNudgeReminder)

// Pending Invite System
router.post('/v1/pendingInvites', controller.getPendingInvites)
router.post('/v1/acceptInvite', controller.acceptInvite)
router.post('/v1/declineInvite', controller.declineInvite)

// Activity Feed
router.post('/v1/activity', controller.getGroupActivity)

module.exports = router;


