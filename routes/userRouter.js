var express = require('express');
var controller = require('../components/user')
var apiAuth = require('../helper/apiAuthentication')

var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//User Registeration router
router.post('/v1/register', controller.userReg)

//User Login router 
router.post('/v1/login', controller.userLogin)

//View User router 
router.post('/v1/view', apiAuth.validateToken, controller.viewUser)

//Edit User router
router.post('/v1/edit', apiAuth.validateToken, controller.editUser)

//Delete User router 
router.delete('/v1/delete', apiAuth.validateToken, controller.deleteUser)

//Update Password router
router.post('/v1/updatePassword', apiAuth.validateToken, controller.updatePassword)

//Get all User Emalil Id 
router.get('/v1/emailList', apiAuth.validateToken, controller.emailList)

//Get User Names by emails
router.post('/v1/names', apiAuth.validateToken, controller.getUserNames)

//Refresh Token - get new access token using refresh token (no auth required)
router.post('/v1/refresh', controller.refreshToken)

//Logout - invalidate refresh token
router.post('/v1/logout', apiAuth.validateToken, controller.logout)

//Recent Contacts - get users from shared groups
router.get('/v1/recentContacts', apiAuth.validateToken, controller.recentContacts)

//Search Users - search by email or name (min 3 chars)
router.get('/v1/search', apiAuth.validateToken, controller.searchUsers)

//Send Invite - invite non-registered user via email
router.post('/v1/sendInvite', apiAuth.validateToken, controller.sendInvite)

// Email Verification & Password Reset Routes (no auth required)
router.get('/v1/verify/:token', controller.verifyEmail)
router.post('/v1/resendVerification', controller.resendVerification)
router.post('/v1/forgotPassword', controller.forgotPassword)
router.post('/v1/resetPassword', controller.resetPassword)

module.exports = router;