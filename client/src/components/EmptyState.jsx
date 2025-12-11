import { Box, Typography, Button, Stack } from '@mui/material';
import Iconify from './Iconify';
import { Link as RouterLink } from 'react-router-dom';

/**
 * EmptyState Component - Shows friendly message when no data exists
 * @param {string} title - Main title text
 * @param {string} description - Description text
 * @param {string} icon - Iconify icon name
 * @param {string} actionText - Button text (optional)
 * @param {string} actionLink - Button link (optional)
 */
export default function EmptyState({
    title = "Nothing here yet",
    description = "Get started by creating something new",
    icon = "mdi:folder-open-outline",
    actionText,
    actionLink,
    iconColor = "primary.main"
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 3,
                textAlign: 'center'
            }}
        >
            {/* Animated Icon */}
            <Box
                sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.primary.light} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                        '100%': { transform: 'scale(1)', opacity: 1 }
                    }
                }}
            >
                <Iconify
                    icon={icon}
                    sx={{
                        width: 60,
                        height: 60,
                        color: iconColor
                    }}
                />
            </Box>

            {/* Title */}
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                {title}
            </Typography>

            {/* Description */}
            <Typography
                variant="body1"
                sx={{
                    mb: 3,
                    color: 'text.secondary',
                    maxWidth: 400
                }}
            >
                {description}
            </Typography>

            {/* Action Button */}
            {actionText && actionLink && (
                <Button
                    variant="contained"
                    component={RouterLink}
                    to={actionLink}
                    startIcon={<Iconify icon="mdi:plus" />}
                    sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {actionText}
                </Button>
            )}
        </Box>
    );
}

// Pre-configured empty states for common scenarios
export const EmptyGroups = () => (
    <EmptyState
        title="No Groups Yet"
        description="Create your first group to start splitting expenses with friends!"
        icon="mdi:account-group-outline"
        actionText="Create Group"
        actionLink="/dashboard/crateGroup"
    />
);

export const EmptyExpenses = () => (
    <EmptyState
        title="No Expenses"
        description="This group doesn't have any expenses yet. Add your first expense to get started!"
        icon="mdi:receipt-text-outline"
    />
);

export const EmptySettlements = () => (
    <EmptyState
        title="All Settled Up! 🎉"
        description="Everyone is square! No pending payments in this group."
        icon="mdi:check-circle-outline"
        iconColor="success.main"
    />
);

export const EmptyTransactions = () => (
    <EmptyState
        title="No Recent Activity"
        description="Your recent transactions will appear here once you start adding expenses."
        icon="mdi:history"
    />
);
