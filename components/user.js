const model = require('../model/schema')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const validator = require('../helper/validation')
const logger = require('../helper/logger')
const apiAuth = require('../helper/apiAuthentication')
const emailService = require('../helper/emailService')

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

                // Generate verification token
                const verificationToken = crypto.randomBytes(32).toString('hex')
                newUser.verificationToken = verificationToken
                newUser.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                newUser.isVerified = false

                //storing user details in DB
                var id = await model.User.create(newUser)

                // Send verification email
                await emailService.sendVerificationEmail(
                    newUser.emailId,
                    verificationToken,
                    newUser.firstName
                )

                res.status(200).json({
                    status: "Success",
                    message: "Registration successful! Please check your email to verify your account.",
                    userId: id.id,
                    requiresVerification: true
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
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                status: "Error",
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
                code: "EMAIL_NOT_VERIFIED",
                email: user.emailId
            })
        }

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

/*
Recent Contacts function
Gets emails of users the current user has been in groups with
Accepts: current user email (from token)
Returns: array of recent contacts with names
*/
exports.recentContacts = async (req, res) => {
    try {
        const currentUser = req.user;

        // Find all groups where current user is a member
        const groups = await model.Group.find(
            { groupMembers: currentUser },
            { groupMembers: 1, groupName: 1, _id: 0 }
        );

        // Collect unique emails (excluding current user)
        const contactMap = new Map();
        for (const group of groups) {
            for (const member of group.groupMembers) {
                if (member !== currentUser && !contactMap.has(member)) {
                    contactMap.set(member, group.groupName);
                }
            }
        }

        // Get user details for these emails
        const emails = Array.from(contactMap.keys());
        const users = await model.User.find(
            { emailId: { $in: emails } },
            { emailId: 1, firstName: 1, lastName: 1, _id: 0 }
        );

        // Build response with names and group source
        const recentContacts = users.map(user => ({
            email: user.emailId,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            source: contactMap.get(user.emailId)
        }));

        res.status(200).json({
            status: "Success",
            recentContacts
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Search Users function
PRIVACY-FOCUSED: 
- Recent contacts: Search by name OR email (people you already know)
- Global users: Search by EMAIL ONLY, must match start of email (no name search for strangers)
Accepts: query string (q)
Returns: { recentContacts: [...], others: [...] }
*/
exports.searchUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        const query = req.query.q?.trim() || '';

        // Validate minimum length
        if (query.length < 3) {
            return res.status(400).json({
                message: "Search query must be at least 3 characters"
            });
        }

        // 1. FETCH RECENT CONTACTS (People I already know)
        const myGroups = await model.Group.find(
            { groupMembers: currentUser },
            { groupMembers: 1, groupName: 1, _id: 0 }
        );

        // Extract emails of people I know
        const knownEmails = new Set();
        const contactMap = new Map(); // Map email -> groupName

        myGroups.forEach(group => {
            group.groupMembers.forEach(member => {
                if (member !== currentUser) {
                    knownEmails.add(member);
                    if (!contactMap.has(member)) {
                        contactMap.set(member, group.groupName);
                    }
                }
            });
        });

        const knownEmailArray = Array.from(knownEmails);

        // 2. SEARCH IN RECENT CONTACTS (By Name OR Email) - Full search allowed
        const searchRegex = new RegExp(query, 'i');

        const recentMatches = await model.User.find({
            emailId: { $in: knownEmailArray }, // Restrict to people I know
            $or: [
                { emailId: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex }
            ]
        }, { emailId: 1, firstName: 1, lastName: 1, _id: 0 });

        const recentContacts = recentMatches.map(user => ({
            email: user.emailId,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            source: contactMap.get(user.emailId)
        }));

        // 3. SEARCH GLOBALLY (By Email ONLY - PRIVACY PROTECTED)
        // Only search 'others' by EMAIL, must STARTS WITH query
        // NO NAME SEARCH FOR STRANGERS - prevents email harvesting

        let others = [];

        // Only run global search if query doesn't contain spaces (not a name pattern)
        if (!query.includes(' ')) {
            const globalMatches = await model.User.find({
                emailId: {
                    $nin: [...knownEmailArray, currentUser], // Exclude me and my friends
                    $regex: `^${query}`, // Must START with query (better for email)
                    $options: 'i'
                }
            }, { emailId: 1, firstName: 1, lastName: 1, _id: 0 }).limit(5); // Limit to prevent harvesting

            others = globalMatches.map(user => ({
                email: user.emailId,
                name: `${user.firstName} ${user.lastName || ''}`.trim()
            }));
        }

        res.status(200).json({
            status: "Success",
            recentContacts,
            others
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Send Invite function
Sends invitation email to non-registered user
Does NOT create a user in database (stateless invite)
Accepts: email, groupName
Returns: success/failure message
*/
exports.sendInvite = async (req, res) => {
    try {
        const { email, groupName } = req.body;
        const inviterEmail = req.user;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                message: "Valid email address required"
            });
        }

        // Check if user already exists
        const existingUser = await model.User.findOne({ emailId: email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already registered. Search for them instead!",
                code: "USER_EXISTS"
            });
        }

        // Get inviter's name
        const inviter = await model.User.findOne(
            { emailId: inviterEmail },
            { firstName: 1, lastName: 1, _id: 0 }
        );
        const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName || ''}`.trim() : inviterEmail;

        // Send invite email
        const emailService = require('../helper/emailService');
        const sent = await emailService.sendGroupInvite(email, inviterName, groupName);

        if (sent) {
            res.status(200).json({
                status: "Success",
                message: `Invitation sent to ${email}`
            });
        } else {
            res.status(500).json({
                message: "Failed to send invitation email"
            });
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Verify Email function
Validates the verification token and marks user as verified
Accepts: token (URL param)
Returns: success/failure message
API: /users/v1/verify/:token
*/
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                message: "Verification token is required"
            });
        }

        // Find user with this token
        const user = await model.User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired verification link. Please request a new one.",
                code: "INVALID_TOKEN"
            });
        }

        // Mark user as verified and clear token
        await model.User.updateOne(
            { _id: user._id },
            {
                $set: { isVerified: true },
                $unset: { verificationToken: 1, verificationTokenExpires: 1 }
            }
        );

        res.status(200).json({
            status: "Success",
            message: "Email verified successfully! You can now log in."
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Resend Verification Email function
Generates a new verification token and sends email
Rate limited to 1 request per minute
Accepts: email
Returns: success message
API: /users/v1/resendVerification
*/
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await model.User.findOne({ emailId: email });

        if (!user) {
            // Don't reveal if email exists
            return res.status(200).json({
                status: "Success",
                message: "If this email is registered, a verification link has been sent."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "This email is already verified. Please log in."
            });
        }

        // Rate limiting - check if token was sent recently (within 1 minute)
        if (user.verificationTokenExpires) {
            const tokenAge = 24 * 60 * 60 * 1000 - (user.verificationTokenExpires - new Date());
            if (tokenAge < 60 * 1000) { // Less than 1 minute since last send
                return res.status(429).json({
                    message: "Please wait a minute before requesting another verification email."
                });
            }
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await model.User.updateOne(
            { _id: user._id },
            {
                $set: {
                    verificationToken: verificationToken,
                    verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            }
        );

        // Send verification email
        await emailService.sendVerificationEmail(email, verificationToken, user.firstName);

        res.status(200).json({
            status: "Success",
            message: "Verification email sent. Please check your inbox."
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Forgot Password function
Sends password reset email with token
Accepts: email
Returns: success message (always, for security)
API: /users/v1/forgotPassword
*/
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await model.User.findOne({ emailId: email });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                status: "Success",
                message: "If this email is registered, a password reset link has been sent."
            });
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');

        await model.User.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetToken: resetToken,
                    resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
                }
            }
        );

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, resetToken, user.firstName);

        res.status(200).json({
            status: "Success",
            message: "If this email is registered, a password reset link has been sent."
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/*
Reset Password function
Validates reset token and updates password
Accepts: token, newPassword
Returns: success/failure message
API: /users/v1/resetPassword
*/
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required"
            });
        }

        // Validate password requirements
        if (!validator.passwordValidation(newPassword)) {
            return res.status(400).json({
                message: "Password does not meet requirements"
            });
        }

        // Find user with valid reset token
        const user = await model.User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset link. Please request a new one.",
                code: "INVALID_TOKEN"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        await model.User.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: 1, resetTokenExpires: 1 }
            }
        );

        res.status(200).json({
            status: "Success",
            message: "Password reset successfully! You can now log in with your new password."
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}