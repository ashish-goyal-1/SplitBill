import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
// @mui
import {
  Box,
  List,
  Badge,
  Tooltip,
  Divider,
  Typography,
  IconButton,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  CircularProgress,
} from '@mui/material';
// utils
import { fToNow } from '../../utils/formatTime';
// components
import Iconify from '../../components/Iconify';
import Scrollbar from '../../components/Scrollbar';
import MenuPopover from '../../components/MenuPopover';

// ----------------------------------------------------------------------

export default function NotificationsPopover() {
  const anchorRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);

  // Get fresh profile on each render
  const getProfile = () => JSON.parse(localStorage.getItem('profile'));

  // Fetch notifications on mount and periodically
  const fetchNotifications = async () => {
    const profile = getProfile();
    if (!profile?.emailId) return;

    try {
      const response = await axios.post(
        '/api/notification/v1/list',
        { userId: profile.emailId },
        { headers: { Authorization: `Bearer ${profile.accessToken}` } }
      );
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (event) => {
    setOpen(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleMarkAllAsRead = async () => {
    const profile = getProfile();
    try {
      await axios.post(
        '/api/notification/v1/readAll',
        { userId: profile?.emailId },
        { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
      );
      // Re-fetch to get accurate state from server
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    const profile = getProfile();
    // Close the popover first to allow navigation
    handleClose();

    try {
      await axios.post(
        '/api/notification/v1/read',
        { notificationId },
        { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
      );
      // Don't re-fetch here - let navigation happen, next open will fetch fresh data
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <>
      <IconButton
        ref={anchorRef}
        color={open ? 'primary' : 'default'}
        onClick={handleOpen}
        sx={{ width: 40, height: 40 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Iconify icon="eva:bell-fill" width={20} height={20} />
        </Badge>
      </IconButton>

      <MenuPopover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        sx={{ width: 360, p: 0, mt: 1.5, ml: 0.75, overflow: 'hidden' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 2.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {unreadCount > 0 ? `You have ${unreadCount} unread` : 'All caught up!'}
            </Typography>
          </Box>

          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton color="primary" onClick={handleMarkAllAsRead}>
                <Iconify icon="eva:done-all-fill" width={20} height={20} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <List disablePadding>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="mdi:bell-off-outline" width={48} height={48} sx={{ color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.slice(0, 3).map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification._id)}
                />
              ))
            )}
          </List>
        </Box>
      </MenuPopover>
    </>
  );
}

// ----------------------------------------------------------------------

function NotificationItem({ notification, onClick }) {
  const { icon, color } = getNotificationIcon(notification.type);

  return (
    <ListItemButton
      onClick={onClick}
      component={notification.groupId ? RouterLink : 'div'}
      to={notification.groupId ? `/dashboard/groups/view/${notification.groupId}` : undefined}
      sx={{
        py: 1.5,
        px: 2.5,
        mt: '1px',
        ...(!notification.isRead && {
          bgcolor: 'action.selected',
        }),
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main` }}>
          <Iconify icon={icon} width={24} height={24} />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="subtitle2" noWrap>
            {notification.title}
          </Typography>
        }
        secondary={
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              {notification.message}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                color: 'text.disabled',
              }}
            >
              <Iconify icon="eva:clock-outline" sx={{ mr: 0.5, width: 16, height: 16 }} />
              {fToNow(new Date(notification.createdAt))}
            </Typography>
          </>
        }
      />
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function getNotificationIcon(type) {
  switch (type) {
    case 'expense_added':
      return { icon: 'mdi:receipt-text-plus', color: 'success' };
    case 'expense_edited':
      return { icon: 'mdi:receipt-text-edit', color: 'warning' };
    case 'expense_deleted':
      return { icon: 'mdi:receipt-text-remove', color: 'error' };
    case 'settlement':
      return { icon: 'mdi:handshake', color: 'info' };
    case 'nudge':
      return { icon: 'mdi:bell-ring', color: 'warning' };
    case 'member_added':
      return { icon: 'mdi:account-plus', color: 'primary' };
    case 'member_removed':
      return { icon: 'mdi:account-minus', color: 'error' };
    default:
      return { icon: 'mdi:bell', color: 'primary' };
  }
}
