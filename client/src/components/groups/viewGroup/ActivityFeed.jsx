import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Stack, Avatar, Chip,
    CircularProgress, Divider, Alert
} from '@mui/material';
import Iconify from '../../Iconify';
import axios from 'axios';

// Activity type icons and colors
const activityConfig = {
    EXPENSE_ADDED: { icon: 'mdi:plus-circle', color: 'success.main', label: 'Added' },
    EXPENSE_UPDATED: { icon: 'mdi:pencil', color: 'info.main', label: 'Updated' },
    EXPENSE_DELETED: { icon: 'mdi:delete', color: 'error.main', label: 'Deleted' },
    SETTLEMENT_MADE: { icon: 'mdi:handshake', color: 'success.main', label: 'Settled' },
    MEMBER_JOINED: { icon: 'mdi:account-plus', color: 'primary.main', label: 'Joined' },
    MEMBER_LEFT: { icon: 'mdi:account-minus', color: 'warning.main', label: 'Left' },
    GROUP_CREATED: { icon: 'mdi:folder-plus', color: 'primary.main', label: 'Created' },
    GROUP_UPDATED: { icon: 'mdi:folder-edit', color: 'info.main', label: 'Updated' },
    INVITE_SENT: { icon: 'mdi:email-send', color: 'info.main', label: 'Invited' },
    INVITE_ACCEPTED: { icon: 'mdi:account-check', color: 'success.main', label: 'Accepted' }
};

// Format relative time
const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

/**
 * ActivityFeed Component
 * Displays audit trail of group actions
 */
export default function ActivityFeed({ groupId }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const profile = JSON.parse(localStorage.getItem('profile'));

    useEffect(() => {
        fetchActivities();
    }, [groupId]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.post(
                '/api/group/v1/activity',
                { groupId, limit: 50 },
                { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
            );
            setActivities(response.data.activities || []);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setError('Failed to load activity feed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    if (activities.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Iconify icon="mdi:timeline-clock-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                    No activity yet. Actions like adding expenses will appear here.
                </Typography>
            </Box>
        );
    }

    return (
        <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="mdi:timeline-text" sx={{ fontSize: 24 }} />
                    Activity Log
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                    {activities.map((activity, index) => {
                        const config = activityConfig[activity.action] || {
                            icon: 'mdi:information',
                            color: 'text.secondary',
                            label: 'Action'
                        };

                        return (
                            <Box key={activity._id || index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                {/* Timeline dot */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: `${config.color}20`,
                                            color: config.color
                                        }}
                                    >
                                        <Iconify icon={config.icon} sx={{ fontSize: 20 }} />
                                    </Avatar>
                                    {index < activities.length - 1 && (
                                        <Box sx={{ width: 2, height: 32, bgcolor: 'divider', mt: 1 }} />
                                    )}
                                </Box>

                                {/* Activity content */}
                                <Box sx={{ flex: 1, pb: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                        <Chip
                                            label={config.label}
                                            size="small"
                                            sx={{
                                                bgcolor: `${config.color}20`,
                                                color: config.color,
                                                fontWeight: 600,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {formatRelativeTime(activity.timestamp)}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                        {activity.description}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>
        </Card>
    );
}
