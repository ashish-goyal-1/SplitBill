/**
 * Analytics Router - MongoDB Aggregation Pipelines for Data Analytics
 * 
 * Features:
 * - Category-wise expense breakdown
 * - Monthly spending trends
 * - User spending summary
 * - Group analytics
 */

const express = require('express');
const router = express.Router();
const model = require('../model/schema');
const logger = require('../helper/logger');

/**
 * GET /api/analytics/category-breakdown
 * Returns expense breakdown by category for a user across all groups
 * 
 * Uses MongoDB Aggregation Pipeline:
 * - $match: Filter by user (expense owner or member)
 * - $group: Group by category, sum amounts
 * - $sort: Order by total descending
 */
router.post('/category-breakdown', async (req, res) => {
    try {
        const { emailId, groupId } = req.body;

        const matchStage = groupId
            ? { groupId: groupId }
            : { $or: [{ expenseOwner: emailId }, { expenseMembers: emailId }] };

        const result = await model.Expense.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$expenseCategory',
                    totalAmount: { $sum: '$expenseAmount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$expenseAmount' }
                }
            },
            { $sort: { totalAmount: -1 } },
            {
                $project: {
                    category: '$_id',
                    totalAmount: { $round: ['$totalAmount', 2] },
                    count: 1,
                    avgAmount: { $round: ['$avgAmount', 2] },
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            status: 'Success',
            data: result,
            total: result.reduce((sum, item) => sum + item.totalAmount, 0)
        });
    } catch (err) {
        logger.error(`Analytics Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/analytics/monthly-trends
 * Returns monthly spending trends for a user
 * 
 * Uses MongoDB Aggregation Pipeline:
 * - $match: Filter by user
 * - $group: Group by year-month
 * - $sort: Order chronologically
 */
router.post('/monthly-trends', async (req, res) => {
    try {
        const { emailId, groupId, months = 6 } = req.body;

        const matchStage = groupId
            ? { groupId: groupId }
            : { $or: [{ expenseOwner: emailId }, { expenseMembers: emailId }] };

        // Calculate date range (last N months)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const result = await model.Expense.aggregate([
            {
                $match: {
                    ...matchStage,
                    expenseDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$expenseDate' },
                        month: { $month: '$expenseDate' }
                    },
                    totalAmount: { $sum: '$expenseAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    totalAmount: { $round: ['$totalAmount', 2] },
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Add month names for frontend
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedResult = result.map(item => ({
            ...item,
            label: `${monthNames[item.month - 1]} ${item.year}`
        }));

        res.status(200).json({
            status: 'Success',
            data: formattedResult
        });
    } catch (err) {
        logger.error(`Analytics Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/analytics/user-summary
 * Returns comprehensive spending summary for a user
 * 
 * Uses MongoDB Aggregation Pipeline:
 * - Multiple aggregations for different metrics
 */
router.post('/user-summary', async (req, res) => {
    try {
        const { emailId } = req.body;

        // Aggregate user's total spending (as expense owner)
        const spendingResult = await model.Expense.aggregate([
            { $match: { expenseOwner: emailId } },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$expenseAmount' },
                    expenseCount: { $sum: 1 }
                }
            }
        ]);

        // Aggregate user's share in expenses (as member)
        const shareResult = await model.Expense.aggregate([
            { $match: { expenseMembers: emailId } },
            {
                $group: {
                    _id: null,
                    totalShare: { $sum: '$expensePerMember' }
                }
            }
        ]);

        // Get group count
        const groupCount = await model.Group.countDocuments({ groupMembers: emailId });

        // Get recent activity
        const recentExpenses = await model.Expense.find({
            $or: [{ expenseOwner: emailId }, { expenseMembers: emailId }]
        })
            .sort({ expenseDate: -1 })
            .limit(5)
            .select('expenseName expenseAmount expenseDate expenseCategory');

        const totalPaid = spendingResult[0]?.totalPaid || 0;
        const totalShare = shareResult[0]?.totalShare || 0;

        res.status(200).json({
            status: 'Success',
            summary: {
                totalPaid: Math.round(totalPaid * 100) / 100,
                totalShare: Math.round(totalShare * 100) / 100,
                netBalance: Math.round((totalPaid - totalShare) * 100) / 100,
                expenseCount: spendingResult[0]?.expenseCount || 0,
                groupCount
            },
            recentActivity: recentExpenses
        });
    } catch (err) {
        logger.error(`Analytics Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/analytics/top-spenders
 * Returns top spenders in a group
 * 
 * Uses MongoDB Aggregation Pipeline:
 * - $match: Filter by group
 * - $group: Group by expense owner
 * - $sort: Order by total descending
 * - $limit: Top N spenders
 */
router.post('/top-spenders', async (req, res) => {
    try {
        const { groupId, limit = 5 } = req.body;

        const result = await model.Expense.aggregate([
            { $match: { groupId: groupId } },
            {
                $group: {
                    _id: '$expenseOwner',
                    totalSpent: { $sum: '$expenseAmount' },
                    expenseCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            {
                $project: {
                    email: '$_id',
                    totalSpent: { $round: ['$totalSpent', 2] },
                    expenseCount: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            status: 'Success',
            data: result
        });
    } catch (err) {
        logger.error(`Analytics Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/analytics/daily-breakdown
 * Returns daily spending for the current month
 */
router.post('/daily-breakdown', async (req, res) => {
    try {
        const { emailId, groupId } = req.body;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const matchStage = groupId
            ? { groupId: groupId, expenseDate: { $gte: startOfMonth } }
            : {
                $or: [{ expenseOwner: emailId }, { expenseMembers: emailId }],
                expenseDate: { $gte: startOfMonth }
            };

        const result = await model.Expense.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dayOfMonth: '$expenseDate' },
                    totalAmount: { $sum: '$expenseAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    day: '$_id',
                    totalAmount: { $round: ['$totalAmount', 2] },
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            status: 'Success',
            data: result
        });
    } catch (err) {
        logger.error(`Analytics Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
