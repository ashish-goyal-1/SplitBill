var mongoose = require('mongoose')
var logger = require('../helper/logger')

mongoose.connect(process.env.MONGODB_URI,
    //     {
    //     maxPoolSize: 50,
    //     wtimeoutMS: 2500,
    //     useNewUrlParser: true
    // }
).then(() => {
    logger.info(`DB Connection Established`)
    console.log("DB Connected")
}).catch(err => {
    logger.error(`DB Connection Fail | ${err.stack}`)
    console.log(err)
})

const User = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
    },
    emailId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Refresh Token for token rotation
    refreshToken: {
        type: String,
        default: null
    },
    // Payment Preferences Feature
    paymentMethods: [{
        type: {
            type: String,  // UPI, Bank, PayPal, Venmo, Cash, etc.
            default: 'Cash'
        },
        details: {
            type: String   // UPI ID, Account number, PayPal email, etc.
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    preferredPayees: [{
        type: String  // Email IDs of preferred people to settle with
    }],
    defaultCurrency: {
        type: String,
        default: 'INR'
    },
    // Email verification
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationTokenExpires: {
        type: Date,
        default: null
    },
    // Password reset
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpires: {
        type: Date,
        default: null
    }
})

const Group = new mongoose.Schema({
    groupName: {
        type: String,
        required: true
    },
    groupDescription: {
        type: String
    },
    groupCurrency: {
        type: String,
        default: "INR"
    },
    groupOwner: {
        type: String,
        required: true
    },
    groupMembers: {
        type: Array,
        required: true
    },
    // Pending members waiting to accept invitation
    pendingMembers: {
        type: Array,
        default: []
    },
    groupCategory: {
        type: String,
        default: "Others"
    }, groupTotal: {
        type: Number,
        default: 0
    },
    split: {
        type: Array
    }
})

const Expense = new mongoose.Schema({
    groupId: {
        type: String,
        required: true
    },
    expenseName: {
        type: String,
        required: true
    },
    expenseDescription: {
        type: String,
    },
    expenseAmount: {
        type: Number,
        required: true
    },
    expenseCategory: {
        type: String,
        default: "Others"
    },
    expenseCurrency: {
        type: String,
        default: "INR"
    },
    expenseDate: {
        type: Date,
        default: Date.now
    },
    expenseOwner: {
        type: String,
        required: true
    },
    expenseMembers: {
        type: Array,
        required: true
    },
    expensePerMember: {
        type: Number,
        required: false  // Not required for exact/percentage splits
    },
    expenseType: {
        type: String,
        default: "Cash"
    },
    // Split type configuration
    splitType: {
        type: String,
        enum: ['equal', 'exact', 'percentage'],
        default: 'equal'
    },
    // Per-member split details (for exact/percentage splits)
    splitDetails: [{
        email: {
            type: String,
            required: true
        },
        amount: {
            type: Number,    // Calculated amount owed
            required: true
        },
        percentage: {
            type: Number,    // Only for percentage split (0-100)
            default: null
        }
    }],
    // Recurring expense fields
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrenceFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', null],
        default: null
    },
    nextRecurrenceDate: {
        type: Date,
        default: null
    },
    parentExpenseId: {
        type: String,
        default: null
    }
})

const Settlement = new mongoose.Schema({
    groupId: {
        type: String,
        required: true
    },
    settleTo: {
        type: String,
        required: true
    },
    settleFrom: {
        type: String,
        required: true
    },
    settleDate: {
        type: String,
        required: true
    },
    settleAmount: {
        type: Number,
        required: true
    },
    // Payment tracking
    paymentMethod: {
        type: String,
        default: 'Cash'
    },
    currency: {
        type: String,
        default: 'INR'
    }
})

// Notification Schema for in-app notifications
const Notification = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['expense_added', 'expense_edited', 'expense_deleted', 'settlement', 'nudge', 'member_added', 'member_removed', 'group_invite', 'invite_accepted', 'invite_declined'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    groupId: {
        type: String
    },
    groupName: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Object
    }
})

// Activity Log for audit trail
const ActivityLog = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'group',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED',
            'SETTLEMENT_MADE', 'MEMBER_JOINED', 'MEMBER_LEFT',
            'GROUP_CREATED', 'GROUP_UPDATED', 'INVITE_SENT', 'INVITE_ACCEPTED'
        ]
    },
    description: {
        type: String,
        required: true
    },
    performedBy: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
})

module.exports.Expense = mongoose.model('expense', Expense)
module.exports.User = mongoose.model('user', User)
module.exports.Group = mongoose.model('group', Group)
module.exports.Settlement = mongoose.model('settlement', Settlement)
module.exports.Notification = mongoose.model('notification', Notification)
module.exports.ActivityLog = mongoose.model('activitylog', ActivityLog)
