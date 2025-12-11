var express = require('express');
var controller = require('../components/notification');

var router = express.Router();

// Get all notifications for a user
router.post('/v1/list', controller.getNotifications);

// Mark a notification as read
router.post('/v1/read', controller.markAsRead);

// Mark all notifications as read
router.post('/v1/readAll', controller.markAllAsRead);

// Delete a notification
router.delete('/v1/delete', controller.deleteNotification);

module.exports = router;
