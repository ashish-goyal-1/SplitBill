import { Box, Typography, Stack, Avatar, Chip, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTopSpenders } from '../../../api';
import { convertToCurrency, currencyFind } from '../../../utils/helper';
import Iconify from '../../Iconify';

export default function TopSpenders({ currencyType }) {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [topSpenders, setTopSpenders] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopSpenders = async () => {
            try {
                setLoading(true);
                const response = await getTopSpenders(params.groupId, 5);
                setTopSpenders(response.data.data || []);
            } catch (err) {
                setError('Failed to load top spenders');
                console.error('Top spenders error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (params.groupId) {
            fetchTopSpenders();
        }
    }, [params.groupId]);

    const getMedalColor = (index) => {
        switch (index) {
            case 0: return '#FFD700'; // Gold
            case 1: return '#C0C0C0'; // Silver
            case 2: return '#CD7F32'; // Bronze
            default: return '#94a3b8';
        }
    };

    const getMedalIcon = (index) => {
        if (index < 3) return 'mdi:medal';
        return 'mdi:account';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (error || topSpenders.length === 0) {
        return null; // Don't show widget if no data
    }

    return (
        <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2,
            p: 3,
            height: '100%'
        }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Iconify icon="mdi:podium-gold" sx={{ fontSize: 24, color: 'warning.main' }} />
                <Typography variant="h6" fontWeight="bold">
                    Top Spenders
                </Typography>
            </Stack>

            <Stack spacing={2}>
                {topSpenders.map((spender, index) => (
                    <Stack
                        key={spender.email}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: index === 0 ? 'warning.lighter' : 'grey.50',
                            border: index === 0 ? '1px solid' : 'none',
                            borderColor: 'warning.light'
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: getMedalColor(index),
                                    fontSize: 14
                                }}
                            >
                                {index + 1}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 140 }}>
                                    {spender.email.split('@')[0]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {spender.expenseCount} expense{spender.expenseCount !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip
                            label={`${currencyFind(currencyType)}${convertToCurrency(spender.totalSpent)}`}
                            size="small"
                            color={index === 0 ? 'warning' : 'default'}
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
}
