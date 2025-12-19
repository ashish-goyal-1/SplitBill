import { useEffect, useState } from 'react';
import {
    Avatar, Box, Button, Chip, Divider, ListItem, ListItemAvatar,
    ListItemText, Paper, TextField, Typography
} from '@mui/material';
import { getRecentContacts, searchUsers, sendInvite } from '../../api';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Reusable Member Search Component
 * Provides privacy-focused member search with:
 * - Recent contacts (from shared groups) → Direct add to groupMembers
 * - Global search by email (strangers) → Add to pendingMembers
 * - Invite functionality for non-registered users
 * 
 * @param {Object} props
 * @param {string[]} props.members - Current list of confirmed member emails
 * @param {string[]} props.pendingMembers - Current list of pending member emails
 * @param {Function} props.onAddMember - Callback for direct add (recent contacts)
 * @param {Function} props.onAddPendingMember - Callback for pending add (strangers)
 * @param {Function} props.onRemoveMember - Callback when member is removed
 * @param {Function} props.onRemovePendingMember - Callback when pending member is removed
 * @param {string} props.currentUser - Current user's email (cannot be removed)
 * @param {string} props.groupName - Group name (for invite emails)
 * @param {Function} props.onAlert - Callback for alerts (message, severity) => void
 */
export default function MemberSearchInput({
    members = [],
    pendingMembers = [],
    onAddMember,
    onAddPendingMember,
    onRemoveMember,
    onRemovePendingMember,
    currentUser,
    groupName = 'a group',
    onAlert
}) {
    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState({ recentContacts: [], others: [] });
    const [recentContacts, setRecentContacts] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(true);

    // Debounce search input (300ms)
    const debouncedSearch = useDebounce(searchInput, 300);

    // Fetch recent contacts on mount
    useEffect(() => {
        const fetchRecentContacts = async () => {
            setLoadingContacts(true);
            try {
                const response = await getRecentContacts();
                setRecentContacts(response?.data?.recentContacts || []);
            } catch (error) {
                console.error('Error fetching recent contacts:', error);
                setRecentContacts([]);
            }
            setLoadingContacts(false);
        };
        fetchRecentContacts();
    }, []);

    // Search users when debounced input changes
    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearch.length >= 3) {
                setSearching(true);
                try {
                    const response = await searchUsers(debouncedSearch);
                    setSearchResults({
                        recentContacts: response?.data?.recentContacts || [],
                        others: response?.data?.others || []
                    });
                } catch (error) {
                    console.error('Search error:', error);
                    setSearchResults({ recentContacts: [], others: [] });
                }
                setSearching(false);
            } else {
                setSearchResults({ recentContacts: [], others: [] });
            }
        };
        performSearch();
    }, [debouncedSearch]);

    // Get all recent contact emails for checking
    const recentContactEmails = recentContacts.map(c => c.email);

    // Add member handler - Recent contacts go direct, others go pending
    const handleAddMember = (email, isRecentContact = false) => {
        const allMembers = [...members, ...pendingMembers];
        if (allMembers.includes(email)) return;

        if (isRecentContact) {
            // Recent contact = trusted, add directly
            onAddMember(email);
        } else {
            // Stranger = pending invite
            if (onAddPendingMember) {
                onAddPendingMember(email);
                onAlert?.(`${email} will receive an invitation to join`, 'info');
            } else {
                // Fallback to direct add if pending not supported
                onAddMember(email);
            }
        }
        setSearchInput('');
        setSearchResults({ recentContacts: [], others: [] });
    };

    // Remove member handler
    const handleRemoveMember = (email) => {
        if (email !== currentUser) {
            onRemoveMember(email);
        }
    };

    // Remove pending member handler
    const handleRemovePendingMember = (email) => {
        if (onRemovePendingMember) {
            onRemovePendingMember(email);
        }
    };

    // Send invite to non-registered user
    const handleInvite = async () => {
        if (!searchInput.includes('@')) {
            onAlert?.('Please enter a valid email address', 'error');
            return;
        }

        try {
            const response = await sendInvite({
                email: searchInput,
                groupName
            });
            onAlert?.(response?.data?.message || 'Invitation sent!', 'success');
            setSearchInput('');
        } catch (error) {
            if (error.response?.data?.code === 'USER_EXISTS') {
                onAlert?.('User exists! Search for them instead.', 'info');
            } else {
                onAlert?.(error.response?.data?.message || 'Failed to send invite', 'error');
            }
        }
    };

    // Check if email looks valid for invite
    const isValidEmail = searchInput.includes('@') && searchInput.includes('.');

    // Check if no results found
    const noResults = debouncedSearch.length >= 3 &&
        !searching &&
        searchResults.recentContacts.length === 0 &&
        searchResults.others.length === 0;

    // Should show results panel
    const showResults = searchResults.recentContacts.length > 0 ||
        searchResults.others.length > 0 ||
        (recentContacts.length > 0 && searchInput.length < 3);

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Group Members
            </Typography>

            {/* Current Members as Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {members.map((email) => (
                    <Chip
                        key={email}
                        label={email}
                        onDelete={email !== currentUser ? () => handleRemoveMember(email) : undefined}
                        color={email === currentUser ? 'primary' : 'default'}
                        variant={email === currentUser ? 'filled' : 'outlined'}
                    />
                ))}
                {/* Pending Members with different styling */}
                {pendingMembers.map((email) => (
                    <Chip
                        key={`pending-${email}`}
                        label={`${email} (Pending)`}
                        onDelete={() => handleRemovePendingMember(email)}
                        color="warning"
                        variant="outlined"
                        sx={{ borderStyle: 'dashed' }}
                    />
                ))}
            </Box>

            {/* Search Input */}
            <TextField
                fullWidth
                placeholder="🔍 Search by email or name (min 3 chars)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
                helperText={searchInput.length > 0 && searchInput.length < 3
                    ? 'Type at least 3 characters to search'
                    : ''
                }
            />

            {/* Search Results Panel */}
            {showResults && (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                    {/* Show Recent Contacts when not searching */}
                    {searchInput.length < 3 && recentContacts.length > 0 && (
                        <>
                            <Typography
                                variant="caption"
                                sx={{ px: 2, py: 1, display: 'block', bgcolor: 'grey.100', fontWeight: 600 }}
                            >
                                📍 RECENT CONTACTS
                            </Typography>
                            {recentContacts.map((contact) => (
                                <ListItem
                                    key={contact.email}
                                    button
                                    onClick={() => handleAddMember(contact.email, true)}
                                    disabled={members.includes(contact.email) || pendingMembers.includes(contact.email)}
                                    sx={{ opacity: members.includes(contact.email) ? 0.5 : 1 }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                            {contact.name?.charAt(0) || contact.email.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={contact.email}
                                        secondary={`${contact.name || ''} • from "${contact.source}"`}
                                    />
                                    {!members.includes(contact.email) && (
                                        <Chip size="small" label="+ Add" color="primary" variant="outlined" />
                                    )}
                                </ListItem>
                            ))}
                        </>
                    )}

                    {/* Search Results - Recent Contacts */}
                    {searchResults.recentContacts.length > 0 && (
                        <>
                            <Typography
                                variant="caption"
                                sx={{ px: 2, py: 1, display: 'block', bgcolor: 'grey.100', fontWeight: 600 }}
                            >
                                📍 RECENT CONTACTS
                            </Typography>
                            {searchResults.recentContacts.map((contact) => (
                                <ListItem
                                    key={contact.email}
                                    button
                                    onClick={() => handleAddMember(contact.email, true)}
                                    disabled={members.includes(contact.email) || pendingMembers.includes(contact.email)}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                            {contact.name?.charAt(0) || contact.email.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={contact.email}
                                        secondary={`${contact.name || ''} • from "${contact.source}"`}
                                    />
                                    <Chip size="small" label="+ Add" color="primary" variant="outlined" />
                                </ListItem>
                            ))}
                        </>
                    )}

                    {/* Search Results - Other Users */}
                    {searchResults.others.length > 0 && (
                        <>
                            <Divider />
                            <Typography
                                variant="caption"
                                sx={{ px: 2, py: 1, display: 'block', bgcolor: 'grey.50', fontWeight: 600 }}
                            >
                                🔎 OTHER RESULTS
                            </Typography>
                            {searchResults.others.map((user) => (
                                <ListItem
                                    key={user.email}
                                    button
                                    onClick={() => handleAddMember(user.email, false)}
                                    disabled={members.includes(user.email) || pendingMembers.includes(user.email)}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                                            {user.name?.charAt(0) || user.email.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={user.email}
                                        secondary={`${user.name || ''} • Will receive invite`}
                                    />
                                    <Chip size="small" label="+ Invite" color="warning" variant="outlined" />
                                </ListItem>
                            ))}
                        </>
                    )}
                </Paper>
            )}

            {/* No Results - Invite Option */}
            {noResults && (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        No user found with "{debouncedSearch}"
                    </Typography>
                    {isValidEmail ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleInvite}
                            startIcon={<span>✉️</span>}
                        >
                            Invite "{searchInput}" to SplitBill
                        </Button>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Enter a valid email to send an invite
                        </Typography>
                    )}
                </Paper>
            )}

            {/* Loading indicator */}
            {searching && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Searching...
                </Typography>
            )}
        </Box>
    );
}
