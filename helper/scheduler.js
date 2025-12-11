/**
 * Email Scheduler using node-cron
 * Runs automated jobs for payment reminders
 */

const cron = require('node-cron');
const model = require('../model/schema');
const emailService = require('./emailService');
const splitCalculator = require('./split');

/**
 * Check all groups and send payment reminders to users with pending balances
 */
const sendDailyPaymentReminders = async () => {
    console.log('[Scheduler] Running daily payment reminder job...');

    try {
        // Get all groups
        const groups = await model.Group.find({});

        // Build a map of user -> debts
        const userDebts = {};

        for (const group of groups) {
            if (!group.split || !group.split[0]) continue;

            // Get settlements for this group
            const settlements = splitCalculator(group.split[0]);

            // settlements is array of [from, to, amount]
            for (const [from, to, amount] of settlements) {
                if (amount > 0) {
                    if (!userDebts[from]) {
                        userDebts[from] = [];
                    }
                    userDebts[from].push({
                        to: to,
                        amount: amount,
                        groupName: group.groupName,
                        groupCurrency: group.groupCurrency || 'INR'
                    });
                }
            }
        }

        // Send reminder to each user with debts
        let sentCount = 0;
        for (const [userEmail, debts] of Object.entries(userDebts)) {
            if (debts.length > 0) {
                const currency = getCurrencySymbol(debts[0].groupCurrency);
                const success = await emailService.sendPaymentReminder(userEmail, debts, currency);
                if (success) sentCount++;
            }
        }

        console.log(`[Scheduler] Payment reminders sent to ${sentCount} users`);
    } catch (error) {
        console.error('[Scheduler] Error in payment reminder job:', error.message);
    }
};

/**
 * Get currency symbol from code
 */
const getCurrencySymbol = (code) => {
    const symbols = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£',
        'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF',
        'CNY': '¥', 'SGD': 'S$'
    };
    return symbols[code] || '₹';
};

/**
 * Process recurring expenses - creates new expenses from recurring templates
 */
const processRecurringExpenses = async () => {
    console.log('[Scheduler] Processing recurring expenses...');

    try {
        const now = new Date();

        // Find all recurring expenses where nextRecurrenceDate <= now
        const recurringExpenses = await model.Expense.find({
            isRecurring: true,
            nextRecurrenceDate: { $lte: now }
        });

        console.log(`[Scheduler] Found ${recurringExpenses.length} recurring expenses to process`);

        for (const expense of recurringExpenses) {
            try {
                // Create a new expense based on the recurring one
                const newExpense = new model.Expense({
                    groupId: expense.groupId,
                    expenseName: expense.expenseName,
                    expenseDescription: expense.expenseDescription || `Auto-generated from recurring expense`,
                    expenseAmount: expense.expenseAmount,
                    expenseCategory: expense.expenseCategory,
                    expenseCurrency: expense.expenseCurrency,
                    expenseDate: new Date(),
                    expenseOwner: expense.expenseOwner,
                    expenseMembers: expense.expenseMembers,
                    expensePerMember: expense.expensePerMember,
                    expenseType: expense.expenseType,
                    isRecurring: false, // The new expense is not recurring itself
                    parentExpenseId: expense._id.toString()
                });

                await newExpense.save();

                // Update the group split
                const group = await model.Group.findOne({ _id: expense.groupId });
                if (group) {
                    group.groupTotal += expense.expenseAmount;
                    group.split[0][expense.expenseOwner] += expense.expenseAmount;
                    const perPerson = expense.expenseAmount / expense.expenseMembers.length;
                    for (const member of expense.expenseMembers) {
                        group.split[0][member] -= perPerson;
                    }
                    await model.Group.updateOne({ _id: group._id }, { $set: { split: group.split, groupTotal: group.groupTotal } });
                }

                // Calculate next recurrence date
                let nextDate = new Date(expense.nextRecurrenceDate);
                switch (expense.recurrenceFrequency) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                    case 'yearly':
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        break;
                }

                // Update the recurring expense with next date
                await model.Expense.updateOne(
                    { _id: expense._id },
                    { $set: { nextRecurrenceDate: nextDate } }
                );

                console.log(`[Scheduler] Created recurring expense: ${expense.expenseName}`);
            } catch (err) {
                console.error(`[Scheduler] Error processing recurring expense ${expense._id}:`, err.message);
            }
        }

        console.log('[Scheduler] Recurring expenses processed successfully');
    } catch (error) {
        console.error('[Scheduler] Error processing recurring expenses:', error.message);
    }
};

/**
 * Initialize all scheduled jobs
 */
const initScheduler = () => {
    // Check if scheduling is enabled
    if (process.env.ENABLE_EMAIL_SCHEDULER !== 'true') {
        console.log('[Scheduler] Email scheduler disabled. Set ENABLE_EMAIL_SCHEDULER=true to enable.');
        return;
    }

    console.log('[Scheduler] Initializing scheduler...');

    // Daily payment reminder at 9 AM
    cron.schedule('0 9 * * *', () => {
        sendDailyPaymentReminders();
    }, {
        timezone: 'Asia/Kolkata'
    });
    console.log('[Scheduler] Daily payment reminder scheduled for 9:00 AM IST');

    // Process recurring expenses at midnight
    cron.schedule('0 0 * * *', () => {
        processRecurringExpenses();
    }, {
        timezone: 'Asia/Kolkata'
    });
    console.log('[Scheduler] Recurring expense processor scheduled for 12:00 AM IST');
};

/**
 * Manually trigger payment reminders (for testing)
 */
const triggerPaymentReminders = async () => {
    return await sendDailyPaymentReminders();
};

/**
 * Manually trigger recurring expense processing (for testing)
 */
const triggerRecurringExpenses = async () => {
    return await processRecurringExpenses();
};

module.exports = {
    initScheduler,
    triggerPaymentReminders,
    triggerRecurringExpenses,
    sendDailyPaymentReminders,
    processRecurringExpenses
};
