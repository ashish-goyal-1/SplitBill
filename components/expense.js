const model = require('../model/schema')
const validator = require('../helper/validation');
const logger = require('../helper/logger');
const groupDAO = require('./group')
const notificationService = require('./notification');
const socketHelper = require('../helper/socketHelper');
const activityLogger = require('../helper/activityLogger');

/*
Add Expense function
This function is used to add expense to the group 
Accepts: Group ID not null group ID exist in the DB
         Expense Name - Not Null
         Expense Desc - max 100 limit
         Expense Amount not null
         Expense Owner - not null --member in the Group Expense Members not null members in the Group
         Auto-Generate Expense ID - Auto generated and stored in the database
*/

exports.addExpense = async (req, res) => {
    try {
        var expense = req.body;
        var group = await model.Group.findOne({
            _id: expense.groupId
        })
        if (!group) {
            var err = new Error("Invalid Group Id")
            err.status = 400
            throw err
        }
        if (validator.notNull(expense.expenseName) &&
            validator.notNull(expense.expenseAmount) &&
            validator.notNull(expense.expenseOwner) &&
            validator.notNull(expense.expenseMembers) &&
            validator.notNull(expense.expenseDate)) {
            var ownerValidation = await validator.groupUserValidation(expense.expenseOwner, expense.groupId)
            if (!ownerValidation) {
                var err = new Error("Please provide a valid group owner")
                err.status = 400
                throw err
            }
            for (var user of expense.expenseMembers) {
                var memberValidation = await validator.groupUserValidation(user, expense.groupId)
                if (!memberValidation) {
                    var err = new Error("Please ensure the members exixt in the group")
                    err.status = 400
                    throw err
                }
            }

            // Handle different split types
            const splitType = expense.splitType || 'equal';
            expense.splitType = splitType;

            if (splitType === 'equal') {
                // Equal split - auto-calculate per member
                const perMember = expense.expenseAmount / expense.expenseMembers.length;
                expense.expensePerMember = Math.round((perMember + Number.EPSILON) * 100) / 100;
                expense.splitDetails = expense.expenseMembers.map(email => ({
                    email,
                    amount: Math.round((perMember + Number.EPSILON) * 100) / 100,
                    percentage: null
                }));
            } else if (splitType === 'exact') {
                // Exact split - validate amounts sum to total
                if (!expense.splitDetails || expense.splitDetails.length === 0) {
                    var err = new Error("Split details are required for exact split");
                    err.status = 400;
                    throw err;
                }
                const total = expense.splitDetails.reduce((sum, d) => sum + (d.amount || 0), 0);
                if (Math.abs(total - expense.expenseAmount) > 0.01) {
                    var err = new Error(`Split amounts (${total}) must equal expense amount (${expense.expenseAmount})`);
                    err.status = 400;
                    throw err;
                }
                expense.expensePerMember = null; // Not applicable for exact split
            } else if (splitType === 'percentage') {
                // Percentage split - validate percentages sum to 100
                if (!expense.splitDetails || expense.splitDetails.length === 0) {
                    var err = new Error("Split details are required for percentage split");
                    err.status = 400;
                    throw err;
                }
                const totalPct = expense.splitDetails.reduce((sum, d) => sum + (d.percentage || 0), 0);
                if (Math.abs(totalPct - 100) > 0.01) {
                    var err = new Error(`Percentages must sum to 100% (got ${totalPct}%)`);
                    err.status = 400;
                    throw err;
                }
                // Calculate amounts from percentages
                expense.splitDetails = expense.splitDetails.map(d => ({
                    email: d.email,
                    percentage: d.percentage,
                    amount: Math.round(((d.percentage / 100) * expense.expenseAmount + Number.EPSILON) * 100) / 100
                }));
                expense.expensePerMember = null;
            }

            expense.expenseCurrency = group.groupCurrency
            var newExp = new model.Expense(expense)
            var newExpense = await model.Expense.create(newExp)

            //New expense is created now we need to update the split values present in the group 
            var update_response = await groupDAO.addSplit(expense.groupId, newExpense)

            // Send notification to group members
            const currencySymbol = getCurrencySymbol(group.groupCurrency);
            await notificationService.notifyGroupMembers(
                group.groupMembers,
                expense.expenseOwner,
                'expense_added',
                `💰 New Expense: ${expense.expenseName}`,
                `${expense.expenseOwner.split('@')[0]} added ${currencySymbol}${expense.expenseAmount} in ${group.groupName}`,
                group._id.toString(),
                group.groupName,
                { expenseId: newExpense._id, amount: expense.expenseAmount }
            );

            // Emit real-time socket event to group members
            socketHelper.emitExpenseAdded(expense.groupId, newExpense, expense.expenseOwner);

            // Log activity
            await activityLogger.createActivityLog(
                expense.groupId,
                'EXPENSE_ADDED',
                `${expense.expenseOwner.split('@')[0]} added '${expense.expenseName}' for ${currencySymbol}${expense.expenseAmount}`,
                expense.expenseOwner,
                { expenseId: newExpense._id, amount: expense.expenseAmount }
            );

            res.status(200).json({
                status: "Success",
                message: "New expenses added",
                Id: newExpense._id,
                splitUpdateResponse: update_response
            })
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

// Helper function
function getCurrencySymbol(code) {
    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'SGD': 'S$' };
    return symbols[code] || '₹';
}

/*
Edit Expense function
This function is used to edit the previously added expense to the group
Accepts: Group ID not null group ID exist in the DB 
         Expense ID not null expense ID exist in the DB for the perticular group
         Expense Name Not Null
         Expense Desc max 100 limit Expense Amount not null
         Expense Owner - not null --member in the DB
         Expense Members not null members in the DB
*/
exports.editExpense = async (req, res) => {
    try {
        var expense = req.body
        var oldExpense = await model.Expense.findOne({
            _id: expense.id
        })
        if (!oldExpense || expense.id == null ||
            oldExpense.groupId != expense.groupId
        ) {
            var err = new Error("Invalid Expense Id")
            err.status = 400
            throw err
        }

        if (validator.notNull(expense.expenseName) &&
            validator.notNull(expense.expenseAmount) &&
            validator.notNull(expense.expenseOwner) &&
            validator.notNull(expense.expenseMembers) &&
            validator.notNull(expense.expenseDate)) {
            var ownerValidation = await validator.groupUserValidation(expense.expenseOwner, expense.groupId)
            if (!ownerValidation) {
                var err = new Error("Please provide a valid group owner")
                err.status = 400
                throw err
            }
            for (var user of expense.expenseMembers) {
                var memberValidation = await validator.groupUserValidation(user, expense.groupId)
                if (!memberValidation) {
                    var err = new Error("Please ensure the members exixt in the group")
                    err.status = 400
                    throw err
                }
            }

            // Handle different split types
            const splitType = expense.splitType || 'equal';
            expense.splitType = splitType;

            if (splitType === 'equal') {
                // Equal split - auto-calculate per member
                const perMember = expense.expenseAmount / expense.expenseMembers.length;
                expense.expensePerMember = Math.round((perMember + Number.EPSILON) * 100) / 100;
                expense.splitDetails = expense.expenseMembers.map(email => ({
                    email,
                    amount: Math.round((perMember + Number.EPSILON) * 100) / 100,
                    percentage: null
                }));
            } else if (splitType === 'exact') {
                // Exact split - validate amounts sum to total
                if (!expense.splitDetails || expense.splitDetails.length === 0) {
                    var err = new Error("Split details are required for exact split");
                    err.status = 400;
                    throw err;
                }
                const total = expense.splitDetails.reduce((sum, d) => sum + (d.amount || 0), 0);
                if (Math.abs(total - expense.expenseAmount) > 0.01) {
                    var err = new Error(`Split amounts (${total}) must equal expense amount (${expense.expenseAmount})`);
                    err.status = 400;
                    throw err;
                }
                expense.expensePerMember = null;
            } else if (splitType === 'percentage') {
                // Percentage split - validate percentages sum to 100
                if (!expense.splitDetails || expense.splitDetails.length === 0) {
                    var err = new Error("Split details are required for percentage split");
                    err.status = 400;
                    throw err;
                }
                const totalPct = expense.splitDetails.reduce((sum, d) => sum + (d.percentage || 0), 0);
                if (Math.abs(totalPct - 100) > 0.01) {
                    var err = new Error(`Percentages must sum to 100% (got ${totalPct}%)`);
                    err.status = 400;
                    throw err;
                }
                // Calculate amounts from percentages
                expense.splitDetails = expense.splitDetails.map(d => ({
                    email: d.email,
                    percentage: d.percentage,
                    amount: Math.round(((d.percentage / 100) * expense.expenseAmount + Number.EPSILON) * 100) / 100
                }));
                expense.expensePerMember = null;
            }

            var expenseUpdate = await model.Expense.updateOne({
                _id: req.body.id

            }, {
                $set: {
                    groupId: expense.groupId,
                    expenseName: expense.expenseName,
                    expenseDescription: expense.expenseDescription,
                    expenseAmount: expense.expenseAmount,
                    expenseOwner: expense.expenseOwner,
                    expenseMembers: expense.expenseMembers,
                    expensePerMember: expense.expensePerMember,
                    expenseType: expense.expenseType,
                    expenseDate: expense.expenseDate,
                    splitType: expense.splitType,
                    splitDetails: expense.splitDetails
                }
            })

            //Updating the group split values
            await groupDAO.clearSplit(oldExpense.groupId, oldExpense)
            await groupDAO.addSplit(expense.groupId, expense)

            // Emit real-time socket event
            socketHelper.emitExpenseUpdated(expense.groupId, expense, req.user);

            // Log activity
            const group = await model.Group.findById(expense.groupId);
            const currency = getCurrencySymbol(group?.groupCurrency || 'INR');
            await activityLogger.createActivityLog(
                expense.groupId,
                'EXPENSE_UPDATED',
                `${expense.expenseOwner.split('@')[0]} updated '${expense.expenseName}' to ${currency}${expense.expenseAmount}`,
                expense.expenseOwner,
                { expenseId: expense.id, oldAmount: oldExpense.expenseAmount, newAmount: expense.expenseAmount }
            );

            res.status(200).json({
                status: "Success",
                message: "Expense Edited",
                response: expenseUpdate
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
Delete Expense function
This function is used to deted the expense added to the group
Accepts: Group ID not null group ID exist in the DB 
         Expense ID not null expense ID exist in the DB for the perticular group
*/
exports.deleteExpense = async (req, res) => {
    try {
        var expense = await model.Expense.findOne({
            _id: req.body.id
        })
        if (!expense) {
            var err = new Error("Invalid Expense Id")
            err.status = 400
            throw err
        }
        var deleteExp = await model.Expense.deleteOne({
            _id: req.body.id
        })

        //Clearing split value for the deleted expense from group table
        await groupDAO.clearSplit(expense.groupId, expense)

        // Emit real-time socket event
        socketHelper.emitExpenseDeleted(expense.groupId, req.body.id, req.user);

        // Log activity
        const deletedBy = req.user || expense.expenseOwner;
        await activityLogger.createActivityLog(
            expense.groupId,
            'EXPENSE_DELETED',
            `${deletedBy.split('@')[0]} deleted '${expense.expenseName}'`,
            deletedBy,
            { expenseName: expense.expenseName, amount: expense.expenseAmount }
        );

        res.status(200).json({
            status: "Success",
            message: "Expense is deleted",
            response: deleteExp
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
View Individual Expense
This function is used to view individual expenses based on the expense ID 
Accepts: Expense Id
Returns: Json with the expense details
*/

exports.viewExpense = async (req, res) => {
    try {
        var expense = await model.Expense.findOne({
            _id: req.body.id
        })
        if (expense.length == 0) {
            var err = new Error("No expense present for the Id")
            err.status = 400
            throw err
        }
        res.status(200).json({
            status: "Success",
            expense: expense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
View Group Expense function
This function is used to view all the group expense
Accepts: Group Id
Returns: Json with all the expense record and the total expense amount for the group
*/
exports.viewGroupExpense = async (req, res) => {
    try {
        var groupExpense = await model.Expense.find({
            groupId: req.body.id
        }).sort({
            expenseDate: -1 //to get the newest first 
        })
        if (groupExpense.length == 0) {
            var err = new Error("No expense present for the group")
            err.status = 400
            throw err
        }
        var totalAmount = 0
        for (var expense of groupExpense) {
            totalAmount += expense['expenseAmount']
        }
        res.status(200).json({
            status: "Success",
            expense: groupExpense,
            total: totalAmount
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
User Expense function
This function is used to find all the expense a user is involved in
Accepts user email Id
returns: Expenses
*/
exports.viewUserExpense = async (req, res) => {
    try {
        validator.notNull(req.body.user)
        var userExpense = await model.Expense.find({
            expenseMembers: req.body.user
        }).sort({
            expenseDate: -1 //to get the newest first 
        })
        if (userExpense.length == 0) {
            var err = new Error("No expense present for the user")
            err.status = 400
            throw err
        }
        var totalAmount = 0
        for (var expense of userExpense) {
            totalAmount += expense['expensePerMember']
        }
        res.status(200).json({
            status: "Success",
            expense: userExpense,
            total: totalAmount
        })

    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Recent User Expenses function
This function is used to return the latest 5 expenses a user is involved in 
Accepts : user email id - check in db if user is present 
Returns : top 5 most resent expense user is a expenseMember in all the groups  
*/
exports.recentUserExpenses = async (req, res) => {
    try {
        var recentExpense = await model.Expense.find({
            expenseMembers: req.body.user
        }).sort({
            $natural: -1 //to get the newest first 
        }).limit(5); //to get the top 5 
        if (recentExpense.length == 0) {
            var err = new Error("No expense present for the user")
            err.status = 400
            throw err
        }
        res.status(200).json({
            status: "Success",
            expense: recentExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
Category wise group expense calculator function 
This function is used to retuen the expense spend on each category in a group 
Accepts : groupID 
Returns : Each category total exp (group as whole)
*/
exports.groupCategoryExpense = async (req, res) => {
    try {
        var categoryExpense = await model.Expense.aggregate([{
            $match: {
                groupId: req.body.id
            }
        },
        {
            $group: {
                _id: "$expenseCategory",
                amount: {
                    $sum: "$expenseAmount"
                }
            }
        }, { $sort: { "_id": 1 } }
        ])

        res.status(200).json({
            status: "success",
            data: categoryExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
Group Monthly Expense Function 
This function is used to get the monthly amount spend in a group 
Accepts : group Id 
Returns : Expense per month (current year)
*/
exports.groupMonthlyExpense = async (req, res) => {
    try {
        var monthlyExpense = await model.Expense.aggregate([{
            $match: {
                groupId: req.body.id
            }
        },
        {
            $group: {
                _id: {
                    month: {
                        $month: "$expenseDate"
                    },
                    year: {
                        $year: "$expenseDate"
                    }
                },
                amount: {
                    $sum: "$expenseAmount"
                }
            }
        },
        { $sort: { "_id.month": 1 } }
        ])
        res.status(200).json({
            status: "success",
            data: monthlyExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


new Date(new Date().setMonth(new Date().getMonth() - 5))
/*
Group Daily Expense Function 
This function is used to get the dailyly amount spend in a group 
Accepts : group Id 
Returns : Expense per day (current year)
*/
exports.groupDailyExpense = async (req, res) => {
    try {
        var dailyExpense = await model.Expense.aggregate([{
            $match: {
                groupId: req.body.id,
                expenseDate: {
                    $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                    $lte: new Date()
                }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dayOfMonth: "$expenseDate"
                    },
                    month: {
                        $month: "$expenseDate"
                    },
                    year: {
                        $year: "$expenseDate"
                    }
                },
                amount: {
                    $sum: "$expenseAmount"
                }
            }
        },
        { $sort: { "_id.month": 1, "_id.date": 1 } }
        ])
        res.status(200).json({
            status: "success",
            data: dailyExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}




/*
Category wise user expense calculator function 
This function is used to retuen the expense spend on each category for a user
Accepts : emailID
Returns : Each category total exp (individaul Expense)
*/
exports.userCategoryExpense = async (req, res) => {
    try {
        var categoryExpense = await model.Expense.aggregate([{
            $match: {
                expenseMembers: req.body.user
            }
        },
        {
            $group: {
                _id: "$expenseCategory",
                amount: {
                    $sum: "$expensePerMember"
                }
            }
        }, { $sort: { "_id": 1 } }
        ])

        res.status(200).json({
            status: "success",
            data: categoryExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
User Monthly Expense Function 
This function is used to get the monthly amount spend by a user
Accepts : Email Id 
Returns : Expense per month
*/
exports.userMonthlyExpense = async (req, res) => {
    try {
        var monthlyExpense = await model.Expense.aggregate([{
            $match: {
                expenseMembers: req.body.user
            }
        },
        {
            $group: {
                _id: {
                    month: {
                        $month: "$expenseDate"
                    },
                    year: {
                        $year: "$expenseDate"
                    }
                },
                amount: {
                    $sum: "$expensePerMember"
                }
            }
        },
        { $sort: { "_id.month": 1 } }
        ])
        res.status(200).json({
            status: "success",
            data: monthlyExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
User Daily Expense Function 
This function is used to get the daily amount spend by a user
Accepts : Email Id 
Returns : Expense per month
*/
exports.userDailyExpense = async (req, res) => {
    try {
        var dailyExpense = await model.Expense.aggregate([{
            $match: {
                expenseMembers: req.body.user,
                expenseDate: {
                    $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                    $lte: new Date()
                }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dayOfMonth: "$expenseDate"
                    },
                    month: {
                        $month: "$expenseDate"
                    },
                    year: {
                        $year: "$expenseDate"
                    }
                },
                amount: {
                    $sum: "$expenseAmount"
                }
            }
        },
        { $sort: { "_id.month": 1, "_id.date": 1 } }
        ])
        res.status(200).json({
            status: "success",
            data: dailyExpense
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}