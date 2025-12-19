/**
 * Activity Logger Helper
 * Creates audit trail entries for group actions
 */

const model = require('../model/schema');
const logger = require('./logger');

/**
 * Create an activity log entry
 * @param {string} groupId - Group ID
 * @param {string} action - Action type (EXPENSE_ADDED, SETTLEMENT_MADE, etc.)
 * @param {string} description - Human-readable description
 * @param {string} performedBy - Email of user who performed action
 * @param {Object} metadata - Optional additional data
 */
async function createActivityLog(groupId, action, description, performedBy, metadata = {}) {
    try {
        await model.ActivityLog.create({
            groupId,
            action,
            description,
            performedBy,
            metadata
        });
        logger.info(`[Activity] ${action} logged for group ${groupId}`);
    } catch (err) {
        // Don't throw - activity logging should not break main operations
        logger.error(`[Activity] Failed to log: ${err.message}`);
    }
}

/**
 * Get activity logs for a group
 * @param {string} groupId - Group ID
 * @param {number} limit - Max number of logs to return
 * @returns {Array} Activity logs sorted by newest first
 */
async function getGroupActivity(groupId, limit = 50) {
    try {
        return await model.ActivityLog.find({ groupId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    } catch (err) {
        logger.error(`[Activity] Failed to fetch logs: ${err.message}`);
        return [];
    }
}

module.exports = {
    createActivityLog,
    getGroupActivity
};
