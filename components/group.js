const model = require('../model/schema')
const validator = require('../helper/validation')
const logger = require('../helper/logger')
const splitCalculator = require('../helper/split')
const emailService = require('../helper/emailService')
const socketHelper = require('../helper/socketHelper')
const activityLogger = require('../helper/activityLogger')

/*
Create Group Function This function basically create new groups
Accepts: Group Name
         Group Description:
         Group Members
         Currency Type:
Validation: Group Name not empty
            Group Members present in DB
            Currency type INR, USD, EUR (for now)
*/
exports.createGroup = async (req, res) => {
    try {
        var newGroup = new model.Group(req.body)
        //Performing validation on the input
        if (validator.notNull(newGroup.groupName) &&
            validator.currencyValidation(newGroup.groupCurrency)) {

            //Validating the group Owner exist in the DB 
            var ownerCheck = await validator.userValidation(newGroup.groupOwner)
            if (!ownerCheck) {
                var err = new Error('Invalid owner id')
                err.status = 400
                throw err
            }

            // Get owner's recent contacts (people they've been in groups with)
            const ownerGroups = await model.Group.find(
                { groupMembers: newGroup.groupOwner },
                { groupMembers: 1 }
            );
            const recentContacts = new Set();
            for (const group of ownerGroups) {
                for (const member of group.groupMembers) {
                    if (member !== newGroup.groupOwner) {
                        recentContacts.add(member);
                    }
                }
            }

            /*
            Split Json is used to store the user split value (how much a person owes)
            When the Group is created all members are assigned the split value as 0    
            */
            var splitJson = {}
            const confirmedMembers = [newGroup.groupOwner]; // Owner is always confirmed
            const pendingMembers = [];
            splitJson[newGroup.groupOwner] = 0; // Owner always in split

            for (var user of newGroup.groupMembers) {
                // Skip owner (already added)
                if (user === newGroup.groupOwner) continue;

                //Validating the group Members exist in the DB 
                var memberCheck = await validator.userValidation(user)
                if (!memberCheck) {
                    var err = new Error(`User ${user} is not registered on SplitBill`)
                    err.status = 400
                    throw err
                }

                // Check if this user is a recent contact of the owner
                if (recentContacts.has(user)) {
                    // Recent contact - add directly to group
                    confirmedMembers.push(user);
                    splitJson[user] = 0;
                } else {
                    // Stranger - add to pending, they need to accept invite
                    pendingMembers.push(user);
                    // Note: Don't add to splitJson yet - will be added when they accept
                }
            }

            /*
            Split Json will now contain an json with user email as the key and the split amount (currently 0) as the value
            We now store this splitJson object to the newGroup model so it can be stored to DB directly
            */
            newGroup.groupMembers = confirmedMembers;
            newGroup.pendingMembers = pendingMembers;
            newGroup.split = splitJson

            var createdGroup = await model.Group.create(newGroup)

            // Send invite emails and real-time notifications to pending members
            if (pendingMembers.length > 0) {
                const ownerUser = await model.User.findOne({ emailId: newGroup.groupOwner });
                const ownerName = ownerUser ? `${ownerUser.firstName} ${ownerUser.lastName || ''}`.trim() : newGroup.groupOwner;

                for (const pendingEmail of pendingMembers) {
                    // Send email
                    sendGroupInviteEmail(pendingEmail, newGroup.groupName, ownerName, ownerUser?.emailId || newGroup.groupOwner)
                        .catch(err => logger.error(`Failed to send invite email to ${pendingEmail}: ${err.message}`));

                    // Emit real-time socket notification
                    socketHelper.emitGroupInvite(pendingEmail, {
                        groupId: createdGroup._id,
                        groupName: newGroup.groupName,
                        inviterName: ownerName,
                        inviterEmail: newGroup.groupOwner
                    });
                }
            }

            // Log group creation activity
            await activityLogger.createActivityLog(
                createdGroup._id,
                'GROUP_CREATED',
                `${newGroup.groupOwner.split('@')[0]} created group '${newGroup.groupName}'`,
                newGroup.groupOwner,
                { confirmedMembers: confirmedMembers.length, pendingInvites: pendingMembers.length }
            );

            res.status(200).json({
                status: "Success",
                message: pendingMembers.length > 0
                    ? `Group created! ${pendingMembers.length} invitation(s) sent.`
                    : "Group Creation Success",
                Id: createdGroup._id,
                confirmedMembers: confirmedMembers.length,
                pendingInvites: pendingMembers.length
            })
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message} ${err.stack}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/**
 * Helper function to send group invite email
 */
async function sendGroupInviteEmail(toEmail, groupName, inviterName, inviterEmail) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Group Invitation</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="font-size: 18px; color: #333;">
                        <strong>${inviterName}</strong> has invited you to join
                    </p>
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <p style="font-size: 28px; font-weight: bold; color: #667eea; margin: 0;">
                            ${groupName}
                        </p>
                    </div>
                    <p style="color: #666;">
                        Log in to SplitBill to accept or decline this invitation.
                    </p>
                    <div style="margin-top: 20px;">
                        <a href="${appUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                            View Invitation
                        </a>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                    Sent via SplitBill | Invited by ${inviterEmail}
                </div>
            </div>
        </body>
        </html>
    `;

    return emailService.sendEmail(
        toEmail,
        `🎉 You're invited to "${groupName}" on SplitBill`,
        html
    );
}




/*
View Group function 
This function is used to display the group details 
Accepts: Group Id 
Returns: Group Info 
*/
exports.viewGroup = async (req, res) => {
    try {
        const group = await model.Group.findOne({
            _id: req.body.id
        })
        if (!group || req.body.id == null) {
            var err = new Error('Invalid Group Id')
            err.status = 400
            throw err
        }
        res.status(200).json({
            status: "Success",
            group: group,
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Find all user group function
This function is basically to display the list of group that a user belongs
Accepts: user email ID
Validation: email Id present in DB
*/
exports.findUserGroup = async (req, res) => {
    try {
        const user = await model.User.findOne({
            emailId: req.body.emailId
        })
        if (!user) {
            var err = new Error("User Id not found !")
            err.status = 400
            throw err
        }
        const groups = await model.Group.find({
            groupMembers: req.body.emailId
        }).sort({
            $natural: -1 //to get the newest first 
        })
        res.status(200).json({
            status: "Success",
            groups: groups
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Edit Group Function
This function is to edit the already existing group to make changes.
Accepts: Group Id
        Modified group info
*/
exports.editGroup = async (req, res) => {
    try {
        var group = await model.Group.findOne({
            _id: req.body.id
        })
        if (!group || req.body.id == null) {
            var err = new Error("Invalid Group Id")
            err.status = 400
            throw err
        }

        var editGroup = new model.Group(req.body)

        //Passing the existing split to the edit group 
        editGroup.split = group.split

        if (validator.notNull(editGroup.groupName) &&
            validator.currencyValidation(editGroup.groupCurrency)) {

            for (var user of editGroup.groupMembers) {
                //Validation to check if the members exist in the DB 
                var memberCheck = await validator.userValidation(user)
                if (!memberCheck) {
                    var err = new Error('Invalid member id')
                    err.status = 400
                    throw err
                }

                //Check if a new gorup member is added to the gorup and missing in the split 
                //split[0] is used since json is stored as an array in the DB - ideally there should only be one element in the split array hence we are using the index number 
                if (!editGroup.split[0].hasOwnProperty(user)) {
                    //adding the missing members to the split and init with value 0
                    editGroup.split[0][user] = 0
                }
            }

            //validation to check if the groupOwner exist in the DB 
            var ownerCheck = await validator.userValidation(editGroup.groupOwner)
            if (!ownerCheck) {
                var err = new Error('Invalid owner id')
                err.status = 400
                throw err
            }

            var update_response = await model.Group.updateOne({
                _id: req.body.id
            }, {
                $set: {
                    groupName: editGroup.groupName,
                    groupDescription: editGroup.groupDescription,
                    groupCurrency: editGroup.groupCurrency,
                    groupMembers: editGroup.groupMembers,
                    groupCategory: editGroup.groupCategory,
                    split: editGroup.split
                }
            })
            res.status(200).json({
                status: "Success",
                message: "Group updated successfully!",
                response: update_response
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
Delete Group Function
This function is used to delete the existing group
Accepts: Group Id
Validation: exisitng group Id
*/
exports.deleteGroup = async (req, res) => {
    try {
        const group = await model.Group.findOne({
            _id: req.body.id
        })
        if (!group) {
            var err = new Error("Invalid Group Id")
            err.status = 400
            throw err
        }
        var delete_group = await model.Group.deleteOne({
            _id: req.body.id
        })
        res.status(200).json({
            message: "Group deleted successfully!",
            status: "Success",
            response: delete_group
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
Make Settlement Function 
This function is used to make the settlements in the gorup 

*/
exports.makeSettlement = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        var reqBody = new model.Settlement(req.body)
        validator.notNull(reqBody.groupId)
        validator.notNull(reqBody.settleTo)
        validator.notNull(reqBody.settleFrom)
        validator.notNull(reqBody.settleAmount)
        validator.notNull(reqBody.settleDate)

        // 1. Defensive Checks
        if (req.body.settleAmount <= 0) {
            throw new Error("Settlement amount must be positive");
        }
        if (req.body.settleFrom === req.body.settleTo) {
            throw new Error("Payer and Payee cannot be the same person");
        }

        const group = await model.Group.findOne({
            _id: req.body.groupId
        }).session(session);

        if (!group) {
            throw new Error("Invalid Group Id")
        }

        // Verify if payer is actually in the group
        if (!group.split[0].hasOwnProperty(req.body.settleFrom) || !group.split[0].hasOwnProperty(req.body.settleTo)) {
            throw new Error("Payer or Payee not part of this group");
        }

        // 2. Atomic Updates
        group.split[0][req.body.settleFrom] += req.body.settleAmount
        group.split[0][req.body.settleTo] -= req.body.settleAmount

        // Nullifying floating point errors
        group.split[0][req.body.settleFrom] = Math.round((group.split[0][req.body.settleFrom] + Number.EPSILON) * 100) / 100;
        group.split[0][req.body.settleTo] = Math.round((group.split[0][req.body.settleTo] + Number.EPSILON) * 100) / 100;

        // Create settlement with current session
        var id = await model.Settlement.create([reqBody], { session: session });

        // Update group balance with current session
        var update_response = await model.Group.updateOne(
            { _id: group._id },
            { $set: { split: group.split } }
        ).session(session);

        await session.commitTransaction();
        session.endSession();

        // Send settlement confirmation emails (async, don't block response)
        const currencySymbol = getCurrencySymbol(group.groupCurrency);
        emailService.sendSettlementConfirmation(
            req.body.settleFrom,
            req.body.settleTo,
            req.body.settleAmount,
            group.groupName,
            currencySymbol
        ).catch(err => logger.error(`Email error: ${err.message}`));

        // Log settlement activity
        await activityLogger.createActivityLog(
            req.body.groupId,
            'SETTLEMENT_MADE',
            `${req.body.settleFrom.split('@')[0]} paid ${currencySymbol}${req.body.settleAmount} to ${req.body.settleTo.split('@')[0]} in transaction`,
            req.body.settleFrom,
            { amount: req.body.settleAmount, from: req.body.settleFrom, to: req.body.settleTo, transaction: true }
        );

        res.status(200).json({
            message: "Settlement successfully!",
            status: "Success",
            update: update_response,
            response: id[0] // create returns an array when using sessions
        })
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        // Handle Idempotency Duplicate Key Error
        if (err.code === 11000) {
            logger.warn(`Duplicate settlement attempt detected: ${err.message}`);
            return res.status(409).json({ // 409 Conflict
                message: "Settlement already processed (Idempotent)",
                status: "Success" // Returning success-like status for client handling
            });
        }

        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
Add Split function 
This function is called when a new expense is added 
This function updates the member split amount present in the group 
Accepts: groupId - the group ID
         expense - the expense object containing splitDetails with per-member amounts
It will add split to the owner and deduct from each member based on splitDetails
This function is not a direct API hit - it is called by add expense function 
*/
exports.addSplit = async (groupId, expense) => {
    var group = await model.Group.findOne({
        _id: groupId
    })

    const expenseAmount = expense.expenseAmount;
    const expenseOwner = expense.expenseOwner;
    const splitDetails = expense.splitDetails || [];

    group.groupTotal += expenseAmount;

    // Credit the payer (expense owner)
    group.split[0][expenseOwner] += expenseAmount;

    // Debit each member based on their splitDetails amount
    for (const detail of splitDetails) {
        group.split[0][detail.email] -= detail.amount;
    }

    // Nullifying floating point errors - ensure group balance is zero
    let bal = 0;
    for (const val of Object.entries(group.split[0])) {
        bal += val[1];
    }
    group.split[0][expenseOwner] -= bal;
    group.split[0][expenseOwner] = Math.round((group.split[0][expenseOwner] + Number.EPSILON) * 100) / 100;

    // Updating back the split values to the group 
    return await model.Group.updateOne({
        _id: groupId
    }, group)
}

/*
Clear Split function 
This function is used to clear the split caused due to a prev expense 
This is used during edit expense or delete expense operation 
Works in the reverse of addSplit function 
Accepts: groupId - the group ID
         expense - the expense object containing splitDetails with per-member amounts
*/
exports.clearSplit = async (groupId, expense) => {
    var group = await model.Group.findOne({
        _id: groupId
    })

    const expenseAmount = expense.expenseAmount;
    const expenseOwner = expense.expenseOwner;
    // For old expenses that might not have splitDetails, generate them from equal split
    let splitDetails = expense.splitDetails;
    if (!splitDetails || splitDetails.length === 0) {
        const expenseMembers = expense.expenseMembers || [];
        const perMember = expenseAmount / expenseMembers.length;
        splitDetails = expenseMembers.map(email => ({
            email,
            amount: Math.round((perMember + Number.EPSILON) * 100) / 100
        }));
    }

    group.groupTotal -= expenseAmount;

    // Un-credit the payer (expense owner)
    group.split[0][expenseOwner] -= expenseAmount;

    // Un-debit each member based on their splitDetails amount
    for (const detail of splitDetails) {
        group.split[0][detail.email] += detail.amount;
    }

    // Nullifying floating point errors - ensure group balance is zero
    let bal = 0;
    for (const val of Object.entries(group.split[0])) {
        bal += val[1];
    }
    group.split[0][expenseOwner] -= bal;
    group.split[0][expenseOwner] = Math.round((group.split[0][expenseOwner] + Number.EPSILON) * 100) / 100;

    // Updating back the split values to the group 
    return await model.Group.updateOne({
        _id: groupId
    }, group)
}


/*
Group Settlement Calculator 
This function is used to calculate the balnce sheet in a group, who owes whom 
Accepts : group Id 
return : group settlement detals
*/
exports.groupBalanceSheet = async (req, res) => {
    try {
        const group = await model.Group.findOne({
            _id: req.body.id
        })
        if (!group) {
            var err = new Error("Invalid Group Id")
            err.status = 400
            throw err
        }

        // Get settlement with optional currency conversion
        const targetCurrency = req.body.currency || group.groupCurrency || 'INR';
        const settlements = splitCalculator(group.split[0]);

        res.status(200).json({
            status: "Success",
            currency: targetCurrency,
            data: settlements
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Consolidate User Debts Function
This function aggregates all debts for a user across all their groups
Accepts: user emailId, optional target currency
Returns: consolidated list of who this user owes / is owed by
*/
exports.consolidateUserDebts = async (req, res) => {
    try {
        const userEmail = req.body.emailId;
        const targetCurrency = req.body.currency || 'INR';

        // Validate user exists
        const user = await model.User.findOne({ emailId: userEmail });
        if (!user) {
            var err = new Error("User not found");
            err.status = 400;
            throw err;
        }

        // Find all groups this user is a member of
        const groups = await model.Group.find({
            groupMembers: userEmail
        });

        // Aggregate all balances across groups
        const consolidatedBalances = {};
        const groupDetails = [];

        for (const group of groups) {
            const currency = require('../helper/currency');
            const groupCurrency = group.groupCurrency || 'INR';
            const userBalance = group.split[0] ? group.split[0][userEmail] || 0 : 0;

            // Convert to target currency
            const convertedBalance = currency.convert(userBalance, groupCurrency, targetCurrency);

            // For each other member, calculate this user's relationship with them
            for (const member of group.groupMembers) {
                if (member === userEmail) continue;

                const memberBalance = group.split[0] ? group.split[0][member] || 0 : 0;
                const convertedMemberBalance = currency.convert(memberBalance, groupCurrency, targetCurrency);

                if (!consolidatedBalances[member]) {
                    consolidatedBalances[member] = 0;
                }

                // If user has positive balance and member has negative, member owes user (proportionally)
                // Simplified: just track overall balances per person across groups
            }

            groupDetails.push({
                groupId: group._id,
                groupName: group.groupName,
                groupCurrency: groupCurrency,
                userBalance: userBalance,
                convertedBalance: convertedBalance
            });
        }

        // Calculate net debts from all groups
        const netBalances = {};
        for (const group of groups) {
            if (!group.split[0]) continue;

            const currency = require('../helper/currency');
            const groupCurrency = group.groupCurrency || 'INR';

            // Get settlements for this group
            const settlements = splitCalculator(group.split[0]);

            for (const [from, to, amount] of settlements) {
                // Only interested in transactions involving this user
                if (from === userEmail) {
                    // User owes 'to'
                    const converted = currency.convert(amount, groupCurrency, targetCurrency);
                    netBalances[to] = (netBalances[to] || 0) - converted;
                } else if (to === userEmail) {
                    // 'from' owes user
                    const converted = currency.convert(amount, groupCurrency, targetCurrency);
                    netBalances[from] = (netBalances[from] || 0) + converted;
                }
            }
        }

        // Format consolidated settlements
        const consolidatedSettlements = [];
        for (const [person, balance] of Object.entries(netBalances)) {
            const roundedBalance = Math.round((balance + Number.EPSILON) * 100) / 100;
            if (Math.abs(roundedBalance) >= 0.01) {
                if (roundedBalance > 0) {
                    // Person owes user
                    consolidatedSettlements.push({
                        from: person,
                        to: userEmail,
                        amount: roundedBalance,
                        direction: 'receivable'
                    });
                } else {
                    // User owes person
                    consolidatedSettlements.push({
                        from: userEmail,
                        to: person,
                        amount: -roundedBalance,
                        direction: 'payable'
                    });
                }
            }
        }

        // Calculate totals
        const totalReceivable = consolidatedSettlements
            .filter(s => s.direction === 'receivable')
            .reduce((sum, s) => sum + s.amount, 0);
        const totalPayable = consolidatedSettlements
            .filter(s => s.direction === 'payable')
            .reduce((sum, s) => sum + s.amount, 0);

        res.status(200).json({
            status: "Success",
            user: userEmail,
            currency: targetCurrency,
            totalReceivable: Math.round((totalReceivable + Number.EPSILON) * 100) / 100,
            totalPayable: Math.round((totalPayable + Number.EPSILON) * 100) / 100,
            netBalance: Math.round((totalReceivable - totalPayable + Number.EPSILON) * 100) / 100,
            settlements: consolidatedSettlements,
            groupDetails: groupDetails
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/**
 * Helper function to get currency symbol from code
 */
function getCurrencySymbol(code) {
    const symbols = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£',
        'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF',
        'CNY': '¥', 'SGD': 'S$'
    };
    return symbols[code] || '₹';
}

/**
 * Send Nudge Reminder - Manual payment reminder
 * Sends an email to remind someone to pay
 * Accepts: groupId, fromEmail (who is owed), toEmail (who owes), amount
 */
exports.sendNudgeReminder = async (req, res) => {
    try {
        const { groupId, fromEmail, toEmail, amount } = req.body;

        // Validate inputs
        validator.notNull(groupId);
        validator.notNull(fromEmail);
        validator.notNull(toEmail);
        validator.notNull(amount);

        // Get group details
        const group = await model.Group.findOne({ _id: groupId });
        if (!group) {
            var err = new Error("Invalid Group Id");
            err.status = 400;
            throw err;
        }

        const currency = getCurrencySymbol(group.groupCurrency);

        // Create nudge email HTML
        const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">👋 Payment Reminder</h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p style="font-size: 18px; color: #333;">
                            <strong>${fromEmail}</strong> is reminding you about a pending payment
                        </p>
                        <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                            <p style="margin: 0; color: #666;">Amount Due</p>
                            <p style="font-size: 36px; font-weight: bold; color: #f5576c; margin: 10px 0;">
                                ${currency}${amount.toLocaleString()}
                            </p>
                            <p style="margin: 0; color: #888;">in ${group.groupName}</p>
                        </div>
                        <div style="margin-top: 20px;">
                            <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
                               style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                                Settle Now
                            </a>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                        Sent via SplitBill
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send the email
        const success = await emailService.sendEmail(
            toEmail,
            `👋 ${fromEmail} is reminding you to pay ${currency}${amount}`,
            html
        );

        if (success) {
            res.status(200).json({
                message: "Reminder sent successfully!",
                status: "Success"
            });
        } else {
            res.status(200).json({
                message: "Email not configured. Reminder not sent.",
                status: "Warning"
            });
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/**
 * Get all pending invites for a user
 * Returns groups where user is in pendingMembers array
 */
exports.getPendingInvites = async (req, res) => {
    try {
        const userEmail = req.body.email || req.user;

        // Find all groups where user is in pendingMembers
        const pendingGroups = await model.Group.find(
            { pendingMembers: userEmail },
            { groupName: 1, groupOwner: 1, groupCategory: 1, groupCurrency: 1, groupMembers: 1, _id: 1 }
        );

        // Get inviter names for better UX
        const groupsWithInviters = await Promise.all(pendingGroups.map(async (group) => {
            const owner = await model.User.findOne(
                { emailId: group.groupOwner },
                { firstName: 1, lastName: 1, emailId: 1 }
            );
            return {
                groupId: group._id,
                groupName: group.groupName,
                groupCategory: group.groupCategory,
                groupCurrency: group.groupCurrency,
                memberCount: group.groupMembers.length,
                inviter: owner ? {
                    name: `${owner.firstName} ${owner.lastName || ''}`.trim(),
                    email: owner.emailId
                } : { name: group.groupOwner, email: group.groupOwner }
            };
        }));

        res.status(200).json({
            status: "Success",
            pendingInvites: groupsWithInviters,
            count: groupsWithInviters.length
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/**
 * Accept a group invitation
 * Moves user from pendingMembers to groupMembers and initializes split
 */
exports.acceptInvite = async (req, res) => {
    try {
        const { groupId } = req.body;
        const userEmail = req.user;

        validator.notNull(groupId);

        // Find the group
        const group = await model.Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is in pendingMembers
        if (!group.pendingMembers.includes(userEmail)) {
            return res.status(400).json({ message: "No pending invitation found" });
        }

        // Check if already a member
        if (group.groupMembers.includes(userEmail)) {
            return res.status(400).json({ message: "Already a member of this group" });
        }

        // Move from pending to members
        const updatedPending = group.pendingMembers.filter(m => m !== userEmail);
        const updatedMembers = [...group.groupMembers, userEmail];

        // Initialize split for new member
        let updatedSplit = group.split;
        if (Array.isArray(updatedSplit) && updatedSplit.length > 0) {
            updatedSplit[0][userEmail] = 0;
        } else {
            updatedSplit = [{ [userEmail]: 0 }];
        }

        await model.Group.updateOne(
            { _id: groupId },
            {
                $set: {
                    groupMembers: updatedMembers,
                    pendingMembers: updatedPending,
                    split: updatedSplit
                }
            }
        );

        // Notify group owner
        const notificationService = require('./notification');
        await notificationService.createNotification(
            group.groupOwner,
            'invite_accepted',
            'Invitation Accepted',
            `${userEmail} has joined "${group.groupName}"`,
            groupId,
            group.groupName
        );

        res.status(200).json({
            status: "Success",
            message: `You have joined "${group.groupName}"!`,
            groupId: groupId
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/**
 * Decline a group invitation
 * Removes user from pendingMembers
 */
exports.declineInvite = async (req, res) => {
    try {
        const { groupId } = req.body;
        const userEmail = req.user;

        validator.notNull(groupId);

        // Find the group
        const group = await model.Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is in pendingMembers
        if (!group.pendingMembers.includes(userEmail)) {
            return res.status(400).json({ message: "No pending invitation found" });
        }

        // Remove from pending
        const updatedPending = group.pendingMembers.filter(m => m !== userEmail);

        await model.Group.updateOne(
            { _id: groupId },
            { $set: { pendingMembers: updatedPending } }
        );

        // Notify group owner
        const notificationService = require('./notification');
        await notificationService.createNotification(
            group.groupOwner,
            'invite_declined',
            'Invitation Declined',
            `${userEmail} declined to join "${group.groupName}"`,
            groupId,
            group.groupName
        );

        res.status(200).json({
            status: "Success",
            message: "Invitation declined"
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}

/**
 * Get activity logs for a group
 */
exports.getGroupActivity = async (req, res) => {
    try {
        const { groupId, limit = 50 } = req.body;

        if (!groupId) {
            var err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }

        const activities = await activityLogger.getGroupActivity(groupId, limit);

        res.status(200).json({
            status: "Success",
            activities
        });
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | status : ${err.status} | message: ${err.message}`);
        res.status(err.status || 500).json({
            message: err.message
        });
    }
}
