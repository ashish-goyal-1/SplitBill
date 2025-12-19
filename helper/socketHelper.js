/**
 * Socket.io Helper - Real-time Communication
 * 
 * Features:
 * - Real-time expense updates
 * - Group-based rooms for targeted broadcasts
 * - Settlement notifications
 * - Connection management
 */

const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 */
function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        logger.info(`[Socket] Client connected: ${socket.id}`);

        // Join a group room for targeted broadcasts
        socket.on('join-group', (groupId) => {
            socket.join(`group-${groupId}`);
            logger.info(`[Socket] ${socket.id} joined group-${groupId}`);
        });

        // Leave a group room
        socket.on('leave-group', (groupId) => {
            socket.leave(`group-${groupId}`);
            logger.info(`[Socket] ${socket.id} left group-${groupId}`);
        });

        // Join user's personal room for notifications
        socket.on('join-user', (userEmail) => {
            socket.join(`user-${userEmail}`);
            logger.info(`[Socket] ${socket.id} joined user-${userEmail}`);
        });

        socket.on('disconnect', () => {
            logger.info(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    logger.info('[Socket] Socket.io server initialized');
    return io;
}

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io server instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

/**
 * Emit expense added event to group
 * @param {string} groupId - Group ID
 * @param {Object} expense - Expense data
 * @param {string} addedBy - Email of user who added
 */
function emitExpenseAdded(groupId, expense, addedBy) {
    if (io) {
        io.to(`group-${groupId}`).emit('expense-added', {
            expense,
            addedBy,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted expense-added to group-${groupId}`);
    }
}

/**
 * Emit expense updated event to group
 * @param {string} groupId - Group ID
 * @param {Object} expense - Updated expense data
 * @param {string} updatedBy - Email of user who updated
 */
function emitExpenseUpdated(groupId, expense, updatedBy) {
    if (io) {
        io.to(`group-${groupId}`).emit('expense-updated', {
            expense,
            updatedBy,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted expense-updated to group-${groupId}`);
    }
}

/**
 * Emit expense deleted event to group
 * @param {string} groupId - Group ID
 * @param {string} expenseId - Deleted expense ID
 * @param {string} deletedBy - Email of user who deleted
 */
function emitExpenseDeleted(groupId, expenseId, deletedBy) {
    if (io) {
        io.to(`group-${groupId}`).emit('expense-deleted', {
            expenseId,
            deletedBy,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted expense-deleted to group-${groupId}`);
    }
}

/**
 * Emit settlement event to group
 * @param {string} groupId - Group ID
 * @param {Object} settlement - Settlement data
 */
function emitSettlement(groupId, settlement) {
    if (io) {
        io.to(`group-${groupId}`).emit('settlement-made', {
            settlement,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted settlement-made to group-${groupId}`);
    }
}

/**
 * Emit notification to specific user
 * @param {string} userEmail - User's email
 * @param {Object} notification - Notification data
 */
function emitNotification(userEmail, notification) {
    if (io) {
        io.to(`user-${userEmail}`).emit('notification', {
            notification,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted notification to user-${userEmail}`);
    }
}

/**
 * Emit group update event
 * @param {string} groupId - Group ID
 * @param {Object} group - Updated group data
 */
function emitGroupUpdated(groupId, group) {
    if (io) {
        io.to(`group-${groupId}`).emit('group-updated', {
            group,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted group-updated to group-${groupId}`);
    }
}

/**
 * Emit group invite notification to user
 * @param {string} userEmail - Email of user being invited
 * @param {Object} invite - Invite details (groupName, inviter, etc.)
 */
function emitGroupInvite(userEmail, invite) {
    if (io) {
        io.to(`user-${userEmail}`).emit('group-invite', {
            invite,
            timestamp: new Date()
        });
        logger.info(`[Socket] Emitted group-invite to user-${userEmail}`);
    }
}

module.exports = {
    initializeSocket,
    getIO,
    emitExpenseAdded,
    emitExpenseUpdated,
    emitExpenseDeleted,
    emitSettlement,
    emitNotification,
    emitGroupUpdated,
    emitGroupInvite
};
