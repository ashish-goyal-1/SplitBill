import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem,
    Typography, Box, CircularProgress, Alert, IconButton
} from '@mui/material';
import Iconify from '../Iconify';
import ExpenseForm from '../expense/ExpenseForm';
import { getUserGroupsService, getGroupDetailsService } from '../../services/groupServices';
import { addExpenseService } from '../../services/expenseServices';

/**
 * Global Add Expense Modal
 * Accessible from dashboard FAB for quick expense entry
 */
export default function GlobalAddExpenseModal({ open, onClose, onSuccess }) {
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const profile = JSON.parse(localStorage.getItem('profile'));

    // Fetch user's groups on mount
    useEffect(() => {
        if (open) {
            fetchGroups();
        }
    }, [open]);

    // Fetch group details when selection changes
    useEffect(() => {
        if (selectedGroupId) {
            fetchGroupDetails(selectedGroupId);
        } else {
            setSelectedGroup(null);
        }
    }, [selectedGroupId]);

    const fetchGroups = async () => {
        setLoadingGroups(true);
        setError('');
        try {
            const response = await getUserGroupsService(profile);
            setGroups(response?.data?.groups || []);
        } catch (err) {
            setError('Failed to load groups');
        } finally {
            setLoadingGroups(false);
        }
    };

    const fetchGroupDetails = async (groupId) => {
        setLoading(true);
        setError('');
        try {
            const response = await getGroupDetailsService(
                { id: groupId },
                () => { },
                () => { }
            );
            setSelectedGroup(response?.data?.group);
        } catch (err) {
            setError('Failed to load group details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        setError('');
        try {
            await addExpenseService(values, setError, (msg) => setError(msg));
            setSuccess('Expense added successfully!');
            setTimeout(() => {
                handleClose();
                onSuccess?.();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to add expense');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedGroupId('');
        setSelectedGroup(null);
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="mdi:plus-circle" sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Typography variant="h6">Quick Add Expense</Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <Iconify icon="mdi:close" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                {/* Step 1: Select Group */}
                <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
                    <InputLabel id="group-select-label">Select Group *</InputLabel>
                    <Select
                        labelId="group-select-label"
                        value={selectedGroupId}
                        label="Select Group *"
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        disabled={loadingGroups}
                    >
                        {loadingGroups ? (
                            <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} /> Loading groups...
                            </MenuItem>
                        ) : groups.length === 0 ? (
                            <MenuItem disabled>No groups found</MenuItem>
                        ) : (
                            groups.map(group => (
                                <MenuItem key={group._id} value={group._id}>
                                    {group.groupName}
                                </MenuItem>
                            ))
                        )}
                    </Select>
                </FormControl>

                {/* Step 2: Show loading while fetching group details */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}

                {/* Step 3: Render Expense Form when group is loaded */}
                {selectedGroup && !loading && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                            Adding expense to <strong>{selectedGroup.groupName}</strong> ({selectedGroup.groupMembers?.length} members)
                        </Typography>
                        <ExpenseForm
                            mode="add"
                            groupId={selectedGroupId}
                            groupMembers={selectedGroup.groupMembers || []}
                            groupCurrency={selectedGroup.groupCurrency || 'INR'}
                            currentUser={profile?.emailId}
                            onSubmit={handleSubmit}
                            isLoading={submitting}
                        />
                    </Box>
                )}

                {/* Empty state - no group selected */}
                {!selectedGroupId && !loading && (
                    <Box sx={{
                        textAlign: 'center',
                        py: 6,
                        bgcolor: 'action.hover',
                        borderRadius: 2
                    }}>
                        <Iconify icon="mdi:folder-open-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Select a group above to add an expense
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
