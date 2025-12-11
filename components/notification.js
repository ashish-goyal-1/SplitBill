/**
 * Notification Controller
 * Handles in-app notifications for users
 */

const model = require('../model/schema');
const logger = require('../helper/logger');

/**
 * Get all notifications for a user
 */
exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.body;

        const notifications = await model.Notification
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await model.Notification.countDocuments({
            userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (err) {
        logger.error(`Get Notifications Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body;

        await model.Notification.updateOne(
            { _id: notificationId },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        logger.error(`Mark As Read Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

/**
 * Mark all notifications as read for a user
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.body;

        await model.Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (err) {
        logger.error(`Mark All As Read Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.body;

        await model.Notification.deleteOne({ _id: notificationId });

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (err) {
        logger.error(`Delete Notification Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

/**
 * Create a notification (internal helper, not exposed via API)
 * @param {string} userId - User email to notify
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} groupId - Optional group ID
 * @param {string} groupName - Optional group name
 * @param {object} metadata - Optional additional data
 */
exports.createNotification = async (userId, type, title, message, groupId = null, groupName = null, metadata = null) => {
    try {
        const notification = new model.Notification({
            userId,
            type,
            title,
            message,
            groupId,
            groupName,
            metadata
        });

        await notification.save();
        logger.info(`Notification created for ${userId}: ${title}`);
        return true;
    } catch (err) {
        logger.error(`Create Notification Error: ${err.message}`);
        return false;
    }
};

/**
 * Notify all group members except the actor
 */
exports.notifyGroupMembers = async (groupMembers, actorEmail, type, title, message, groupId, groupName, metadata = null) => {
    try {
        const notifyList = groupMembers.filter(member => member !== actorEmail);

        for (const member of notifyList) {
            await exports.createNotification(member, type, title, message, groupId, groupName, metadata);
        }

        return true;
    } catch (err) {
        logger.error(`Notify Group Members Error: ${err.message}`);
        return false;
    }
};
