import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Stack, Avatar, Chip,
    CircularProgress, Snackbar, Alert, Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from '../Iconify';
import axios from 'axios';
import configData from '../../config.json';
import { useSocket } from '../../utils/SocketContext';

/**
 * PendingInvites Component
 * Shows pending group invitations on the dashboard with Accept/Decline buttons
 */
export default function PendingInvites() {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // groupId of loading action
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const profile = JSON.parse(localStorage.getItem('profile'));
    const { joinUser, onGroupInvite } = useSocket();

    // Fetch pending invites on mount
    useEffect(() => {
        fetchPendingInvites();
    }, []);

    // Join user's socket room for real-time invite notifications
    useEffect(() => {
        if (profile?.emailId) {
            joinUser(profile.emailId);
        }
    }, [profile?.emailId, joinUser]);

    // Listen for real-time invite notifications
    useEffect(() => {
        const cleanup = onGroupInvite?.((data) => {
            console.log('[Socket] Received new invite:', data);
            // Refresh the invite list
            fetchPendingInvites();
            // Show notification
            setSnackbar({
                open: true,
                message: `${data.invite.inviterName} invited you to "${data.invite.groupName}"`,
                severity: 'info'
            });
        });
        return cleanup;
    }, [onGroupInvite]);

    const fetchPendingInvites = async () => {
        try {
            setLoading(true);
            const response = await axios.post(
                configData.GROUP_PENDING_INVITES,
                { email: profile?.emailId },
                { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
            );
            setInvites(response.data.pendingInvites || []);
        } catch (error) {
            console.error('Failed to fetch pending invites:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleAccept = async (groupId) => {
        try {
            setActionLoading(groupId);
            const response = await axios.post(
                configData.GROUP_ACCEPT_INVITE,
                { groupId },
                { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
            );
            setSnackbar({ open: true, message: response.data.message, severity: 'success' });
            // Remove from list
            setInvites(invites.filter(inv => inv.groupId !== groupId));
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to accept invite',
                severity: 'error'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (groupId) => {
        try {
            setActionLoading(groupId);
            const response = await axios.post(
                configData.GROUP_DECLINE_INVITE,
                { groupId },
                { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
            );
            setSnackbar({ open: true, message: response.data.message, severity: 'info' });
            // Remove from list
            setInvites(invites.filter(inv => inv.groupId !== groupId));
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to decline invite',
                severity: 'error'
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Don't render anything during loading or if no pending invites
    // This prevents CLS - we don't show a loading state that disappears
    if (loading || invites.length === 0) {
        return null;
    }

    return (
        <>
            <Card sx={{
                mb: 3,
                background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
                border: '1px solid',
                borderColor: 'primary.light'
            }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <Iconify icon="mdi:email-open" sx={{ color: 'primary.main', fontSize: 24 }} />
                        <Typography variant="h6" fontWeight={600}>
                            Pending Group Invitations
                        </Typography>
                        {invites.length > 0 && (
                            <Chip
                                label={invites.length}
                                color="primary"
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Stack>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {invites.map((invite, index) => (
                                <Box key={invite.groupId}>
                                    {index > 0 && <Divider sx={{ my: 1 }} />}
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                                        spacing={2}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{
                                                bgcolor: 'primary.main',
                                                width: 48,
                                                height: 48
                                            }}>
                                                <Iconify icon="mdi:account-group" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {invite.groupName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Invited by <strong>{invite.inviter.name}</strong>
                                                </Typography>
                                                <Stack direction="row" spacing={1} mt={0.5}>
                                                    <Chip
                                                        label={invite.groupCategory}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label={`${invite.memberCount} members`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Stack>
                                            </Box>
                                        </Stack>

                                        <Stack direction="row" spacing={1}>
                                            <LoadingButton
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                loading={actionLoading === invite.groupId}
                                                onClick={() => handleAccept(invite.groupId)}
                                                startIcon={<Iconify icon="mdi:check" />}
                                            >
                                                Accept
                                            </LoadingButton>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                disabled={actionLoading === invite.groupId}
                                                onClick={() => handleDecline(invite.groupId)}
                                                startIcon={<Iconify icon="mdi:close" />}
                                            >
                                                Decline
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
