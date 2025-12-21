import { Box, Card, CardActionArea, CardContent, Grid, Typography, Avatar, AvatarGroup, Chip } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import configData from '../../config.json';
import Iconify from "../Iconify";

/**
 * Compact Group Cards Grid
 * Displays groups as clickable navigation cards (Name + Member Count)
 */
export default function GroupCards({ groups = [] }) {
    if (!groups || groups.length === 0) {
        return (
            <Box sx={{
                textAlign: 'center',
                py: 4,
                bgcolor: 'action.hover',
                borderRadius: 2
            }}>
                <Iconify icon="mdi:folder-open-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                    No groups yet. Create your first group!
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={2}>
            {groups.map((group) => (
                <Grid item xs={12} sm={6} md={4} key={group._id}>
                    <Card
                        sx={{
                            height: '100%',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4
                            }
                        }}
                    >
                        <CardActionArea
                            component={RouterLink}
                            to={`${configData.VIEW_GROUP_URL}${group._id}`}
                            sx={{ height: '100%' }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                {/* Group Icon + Name */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: 'primary.main',
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        <Iconify icon="mdi:account-group" sx={{ fontSize: 22 }} />
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {group.groupName}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Member Count + Category */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Iconify icon="mdi:account-multiple" sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {group.groupMembers?.length || 0} members
                                        </Typography>
                                    </Box>
                                    {group.groupCategory && (
                                        <Chip
                                            label={group.groupCategory}
                                            size="small"
                                            sx={{
                                                fontSize: '0.65rem',
                                                height: 20,
                                                bgcolor: 'action.selected'
                                            }}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}
