import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Avatar, Chip, Divider } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import gravatarUrl from 'gravatar-url';
import Iconify from '../../Iconify';
import { convertToCurrency, currencyFind } from '../../../utils/helper';
import configData from '../../../config.json';
import Loading from '../../loading';

const profile = JSON.parse(localStorage.getItem('profile'));
const currentUserEmail = profile?.emailId;

export default function MyBalance({ currencyType }) {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [settlements, setSettlements] = useState([]);
    const [myOwes, setMyOwes] = useState([]);     // What I owe to others
    const [owedToMe, setOwedToMe] = useState([]); // What others owe to me

    useEffect(() => {
        const fetchBalances = async () => {
            setLoading(true);
            try {
                const response = await axios.post(
                    '/api/group/v1/settlement',
                    { id: params.groupId },
                    { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
                );

                const allSettlements = response.data.data || [];

                // Filter settlements involving current user
                const iOwe = allSettlements.filter(s => s[0] === currentUserEmail);
                const theyOwe = allSettlements.filter(s => s[1] === currentUserEmail);

                setMyOwes(iOwe);
                setOwedToMe(theyOwe);
                setSettlements(allSettlements);
            } catch (error) {
                console.error('Error fetching balances:', error);
            }
            setLoading(false);
        };

        fetchBalances();
    }, [params.groupId]);

    const totalIOwe = myOwes.reduce((sum, s) => sum + s[2], 0);
    const totalOwedToMe = owedToMe.reduce((sum, s) => sum + s[2], 0);
    const netBalance = totalOwedToMe - totalIOwe;

    if (loading) return <Loading />;

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Net Balance Summary Card */}
            <Card sx={{
                mb: 3,
                background: netBalance >= 0
                    ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                    : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                color: 'white'
            }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        Your Net Balance
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
                        {netBalance >= 0 ? '+' : ''}{currencyFind(currencyType)} {convertToCurrency(Math.abs(netBalance))}
                    </Typography>
                    <Chip
                        icon={<Iconify icon={netBalance >= 0 ? "mdi:arrow-up" : "mdi:arrow-down"} />}
                        label={netBalance >= 0 ? "You are owed money" : "You owe money"}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                </CardContent>
            </Card>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                {/* What I Owe */}
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <Iconify icon="mdi:cash-minus" color="error.main" width={24} />
                            <Typography variant="h6" color="error.main">
                                You Owe
                            </Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Typography variant="h6" color="error.main">
                                {currencyFind(currencyType)} {convertToCurrency(totalIOwe)}
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />

                        {myOwes.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" py={2}>
                                🎉 You don't owe anyone!
                            </Typography>
                        ) : (
                            myOwes.map((settlement, index) => (
                                <Stack
                                    key={index}
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                    sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                                >
                                    <Avatar
                                        src={gravatarUrl(settlement[1], { size: 100, default: configData.USER_DEFAULT_LOGO_URL })}
                                        sx={{ width: 40, height: 40 }}
                                    />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {settlement[1].split('@')[0]}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {settlement[1]}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight={700} color="error.main">
                                        {currencyFind(currencyType)} {convertToCurrency(settlement[2])}
                                    </Typography>
                                </Stack>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* What's Owed to Me */}
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <Iconify icon="mdi:cash-plus" color="success.main" width={24} />
                            <Typography variant="h6" color="success.main">
                                Owed to You
                            </Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Typography variant="h6" color="success.main">
                                {currencyFind(currencyType)} {convertToCurrency(totalOwedToMe)}
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />

                        {owedToMe.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" py={2}>
                                No one owes you money
                            </Typography>
                        ) : (
                            owedToMe.map((settlement, index) => (
                                <Stack
                                    key={index}
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                    sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                                >
                                    <Avatar
                                        src={gravatarUrl(settlement[0], { size: 100, default: configData.USER_DEFAULT_LOGO_URL })}
                                        sx={{ width: 40, height: 40 }}
                                    />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {settlement[0].split('@')[0]}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {settlement[0]}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight={700} color="success.main">
                                        {currencyFind(currencyType)} {convertToCurrency(settlement[2])}
                                    </Typography>
                                </Stack>
                            ))
                        )}
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}
