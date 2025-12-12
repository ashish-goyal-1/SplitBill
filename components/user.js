const model = require('../model/schema')
const bcrypt = require('bcryptjs')
const validator = require('../helper/validation')
const logger = require('../helper/logger')
const apiAuth = require('../helper/apiAuthentication')

/*
User Registeration function
Accepts: firstName, lastName, emailId, password 
Validation: firstname, lastname not Null 
            emailID - contain '@' and '.com' 
            password - min 8, lowecase, uppercase, special character, numbers
API: /users/v1/register
*/
exports.userReg = async (req, res) => {
    try {
        //Checking email Id exist in DB
        const user = await model.User.findOne({
            emailId: req.body.emailId
        })
        //If email ID present in database thows error and retuen message
        if (user) {
            const err = new Error("Email Id already present please login!")
            err.status = 400
            throw err
        } else {
            //Accepts the inputs and create user model form req.body
            var newUser = new model.User(req.body)
            //Performing validations
            if (validator.emailValidation(newUser.emailId) &&
                validator.passwordValidation(newUser.password) &&
                validator.notNull(newUser.firstName)) {
                //Bcrypt password encription
                const salt = await bcrypt.genSalt(10);
                newUser.password = await bcrypt.hash(newUser.password, salt)

                //storing user details in DB
                var id = await model.User.create(newUser)
                res.status(200).json({
                    status: "Success",
                    message: "User Registeration Success",
                    userId: id.id
                })
            }
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
User login function
Accepts: email Id & Pass
Returns: Access token (15min) and Refresh token (7 days)
Implement Google Sign-in in the future.
*/
exports.userLogin = async (req, res) => {
    try {
        //Checking email Id exist in DB 
        const user = await model.User.findOne({
            emailId: req.body.emailId
        })
        if (!user) {
            var err = new Error("Invalid email Id or Password !")
            err.status = 401
            throw err
        }

        //validating password using bcrypt
        const validCred = await bcrypt.compare(req.body.password, user.password)
        if (!validCred) {
            var err = new Error("Invalid email Id or Password* !")
            err.status = 401
            throw err
        } else {
            // Generate token pair (access + refresh)
            const { accessToken, refreshToken } = apiAuth.generateTokenPair(req.body.emailId)

            // Store refresh token in database for rotation
            await model.User.updateOne(
                { emailId: req.body.emailId },
                { $set: { refreshToken: refreshToken } }
            )

            res.status(200).json({
                status: "Success",
                message: "User Login Success",
                userId: user.id,
                emailId: user.emailId,
                firstName: user.firstName,
                lastName: user.lastName,
                accessToken,
                refreshToken
            })
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message} ${err.stack}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
View User function 
This function is to view the user details 
Accepts: user email Id 
Returns: user details (ensure password is removed)
*/
exports.viewUser = async (req, res) => {
    try {
        //check if the login user is same as the requested user 
        apiAuth.validateUser(req.user, req.body.emailId)
        const user = await model.User.findOne({
            emailId: req.body.emailId
        }, {
            password: 0
        })
        if (!user) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        res.status(200).json({
            status: "Success",
            user: user
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
View All User EmailIs function 
This function is to get all the user email Id 
Accepts: none
Returns: all user Email ID
*/
exports.emailList = async (req, res) => {
    try {
        //check if the login user is same as the requested user 
        const userEmails = await model.User.find({
        }, {
            emailId: 1,
            _id: 0
        })
        if (!userEmails) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        var emailList = []
        for (var email of userEmails) {
            emailList.push(email.emailId)
        }
        res.status(200).json({
            status: "Success",
            user: emailList
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
Delete User function 
This function is used to delete an existing user in the database 
Accepts: user email id 
*/
exports.deleteUser = async (req, res) => {
    try {
        //check if the login user is same as the requested user 
        apiAuth.validateUser(req.user, req.body.emailId)
        const userCheck = await validator.userValidation(req.body.emailId)
        if (!userCheck) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        const delete_response = await model.User.deleteOne({
            emailId: req.body.emailId
        })
        res.status(200).json({
            status: "Success",
            message: "User Account deleted!",
            response: delete_response
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Edit User function 
This function is used to edit the user present in the database 
Accepts: User data (user email id can not be changed)
This function can not be used to change the password of the user 
*/
exports.editUser = async (req, res) => {
    try {
        //check if the login user is same as the requested user 
        apiAuth.validateUser(req.user, req.body.emailId)
        const userCheck = await validator.userValidation(req.body.emailId)
        if (!userCheck) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        //Accepts the inputs and create user model form req.body
        var editUser = req.body
        //Performing validations
        if (validator.notNull(editUser.firstName) &&
            validator.notNull(editUser.lastName)) {
            //storing user details in DB
            var update_response = await model.User.updateOne({
                emailId: editUser.emailId
            }, {
                $set: {
                    firstName: editUser.firstName,
                    lastName: editUser.lastName,
                }
            })
            res.status(200).json({
                status: "Success",
                message: "User update Success",
                userId: update_response
            })
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Update Password function 
This function is used to update the user password 
Accepts : emailId 
          new password 
          old password 
validation : old password is correct 
             new password meet the requirements 
*/
exports.updatePassword = async (req, res) => {
    try {
        //check if the login user is same as the requested user 
        apiAuth.validateUser(req.user, req.body.emailId)
        const user = await model.User.findOne({
            emailId: req.body.emailId
        })
        if (!user) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }

        //Performing basic validations 
        validator.notNull(req.body.oldPassword)
        validator.passwordValidation(req.body.newPassword)

        //validating password using bcrypt
        const validCred = await bcrypt.compare(req.body.oldPassword, user.password)
        if (!validCred) {
            var err = new Error("Old Password does not match")
            err.status = 400
            throw err
        }
        //Bcrypt password encription
        const salt = await bcrypt.genSalt(10);
        var hash_password = await bcrypt.hash(req.body.newPassword, salt)
        var update_response = await model.User.updateOne({
            emailId: req.body.emailId
        }, {
            $set: {
                password: hash_password
            }
        })
        res.status(200).json({
            status: "Success",
            message: "Password update Success",
            userId: update_response
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message} ${err.stack}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Get User Names by Emails function 
This function returns display names for a list of email IDs
Accepts: array of email IDs
Returns: object mapping email to display name info
*/
exports.getUserNames = async (req, res) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({ message: 'Emails array required' });
        }

        const users = await model.User.find(
            { emailId: { $in: emails } },
            { emailId: 1, firstName: 1, lastName: 1, _id: 0 }
        );

        // Create mapping of email -> name info
        const nameMap = {};
        for (const user of users) {
            const lastInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() + '.' : '';
            nameMap[user.emailId] = {
                displayName: `${user.firstName} ${lastInitial}`.trim(),
                fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
                firstName: user.firstName,
                lastName: user.lastName || ''
            };
        }

        // For emails not found in DB, use email prefix
        for (const email of emails) {
            if (!nameMap[email]) {
                const prefix = email.split('@')[0];
                nameMap[email] = {
                    displayName: prefix,
                    fullName: email,
                    firstName: prefix,
                    lastName: ''
                };
            }
        }

        res.status(200).json({
            status: "Success",
            names: nameMap
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Refresh Token function
Uses refresh token to generate new access token without re-login
Implements token rotation for security
Accepts: refreshToken
Returns: new accessToken (and optionally new refreshToken)
*/
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required",
                code: "NO_REFRESH_TOKEN"
            });
        }

        // Validate the refresh token
        const decoded = apiAuth.validateRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({
                message: "Invalid or expired refresh token",
                code: "INVALID_REFRESH_TOKEN"
            });
        }

        // Check if refresh token matches what's stored in database
        const user = await model.User.findOne({ emailId: decoded.email });
        if (!user || user.refreshToken !== refreshToken) {
            // Token rotation detection - possible token theft
            if (user) {
                // Invalidate all tokens for this user
                await model.User.updateOne(
                    { emailId: decoded.email },
                    { $set: { refreshToken: null } }
                );
            }
            return res.status(403).json({
                message: "Refresh token reuse detected",
                code: "TOKEN_REUSE_DETECTED"
            });
        }

        // Generate new token pair (rotation)
        const newTokens = apiAuth.generateTokenPair(decoded.email);

        // Update stored refresh token
        await model.User.updateOne(
            { emailId: decoded.email },
            { $set: { refreshToken: newTokens.refreshToken } }
        );

        res.status(200).json({
            status: "Success",
            message: "Token refreshed",
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Logout function
Invalidates the refresh token to prevent further use
Accepts: emailId
*/
exports.logout = async (req, res) => {
    try {
        const emailId = req.body.emailId || req.user;

        // Clear the refresh token from database
        await model.User.updateOne(
            { emailId: emailId },
            { $set: { refreshToken: null } }
        );

        res.status(200).json({
            status: "Success",
            message: "Logged out successfully"
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}