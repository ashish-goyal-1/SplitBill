import { Box, Container, Fab, Grid, Typography, Card, CardContent, Stack, styled } from "@mui/material"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getUserExpenseService } from "../../services/expenseServices"
import { getUserGroupsService } from "../../services/groupServices"
import { DashboardSkeleton } from "../skeletons"
import { CalenderExpenseGraph } from "./CalenderExpenseGraph"
import { CategoryExpenseChart } from "./CategoryExpenseGraph"
import { GroupExpenseChart } from "./GroupExpenseChart"
import { RecentTransactions } from "./RecentTransactions"
import { WelcomeMessage } from "./welcomeMessage"
import PendingInvites from "./PendingInvites"
import GlobalAddExpenseModal from "./GlobalAddExpenseModal"
import GroupCards from "./GroupCards"
import { Link as RouterLink } from 'react-router-dom';
import configData from '../../config.json'
import Iconify from "../Iconify"
import { convertToCurrency, currencyFind } from "../../utils/helper"


const LabelIconStyle = styled('div')(({ theme }) => ({
    borderRadius: 60,
    width: 60,
    height: 60,
}));

export default function Dashboard() {
    const [loading, setLoading] = useState(true)
    const profile = JSON.parse(localStorage.getItem("profile"))
    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [userExp, setUserExp] = useState()
    const [userGroups, setUserGroups] = useState([])
    const [newUser, setNewUser] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

    // Multi-currency balance totals: [{ currency: 'INR', amount: 500 }, ...]
    const [owedByCurrency, setOwedByCurrency] = useState([])
    const [oweByCurrency, setOweByCurrency] = useState([])

    useEffect(() => {
        const getUserDetails = async () => {
            setLoading(true);
            const userIdJson = {
                user: profile.emailId
            }

            // Fetch expenses
            const response_expense = await getUserExpenseService(userIdJson, setAlert, setAlertMessage)
            setUserExp(response_expense?.data);

            // Fetch groups
            const response_group = await getUserGroupsService(profile)
            const groups = response_group?.data?.groups || [];
            setUserGroups(groups);

            if (groups.length === 0) {
                setNewUser(true)
            } else {
                // Calculate total balances grouped by currency
                calculateTotalBalances(groups);
            }

            setLoading(false)
        }
        getUserDetails();
    }, [])

    // Calculate total owe/owed across all groups, GROUPED BY CURRENCY
    const calculateTotalBalances = (groups) => {
        const owedMap = {}; // { 'INR': 500, 'USD': 10 }
        const oweMap = {};

        groups.forEach(group => {
            const currency = group.groupCurrency || 'INR';

            if (group.split && group.split[0]) {
                const userBalance = group.split[0][profile.emailId] || 0;

                if (userBalance > 0) {
                    // You are owed money
                    owedMap[currency] = (owedMap[currency] || 0) + userBalance;
                } else if (userBalance < 0) {
                    // You owe money
                    oweMap[currency] = (oweMap[currency] || 0) + Math.abs(userBalance);
                }
            }
        });

        // Convert to array format: [{ currency: 'INR', amount: 500 }, ...]
        const owedArray = Object.entries(owedMap)
            .map(([currency, amount]) => ({ currency, amount }))
            .sort((a, b) => b.amount - a.amount); // Sort by amount descending

        const oweArray = Object.entries(oweMap)
            .map(([currency, amount]) => ({ currency, amount }))
            .sort((a, b) => b.amount - a.amount);

        setOwedByCurrency(owedArray);
        setOweByCurrency(oweArray);
    };

    const handleModalSuccess = () => {
        // Refresh data after expense added
        window.location.reload();
    };

    // Render currency amount with symbol
    const renderCurrencyAmount = (currency, amount) => (
        <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
            {currencyFind(currency)} {convertToCurrency(amount)}
        </Typography>
    );

    // Render balance list (for multi-currency)
    const renderBalanceList = (balances, colorKey) => {
        if (balances.length === 0) {
            return (
                <Typography variant="h4" sx={{ color: (theme) => theme.palette[colorKey].darker }}>
                    {currencyFind('INR')} 0
                </Typography>
            );
        }

        if (balances.length === 1) {
            // Single currency - show big number
            return (
                <Typography variant="h4" sx={{ color: (theme) => theme.palette[colorKey].darker }}>
                    {currencyFind(balances[0].currency)} {convertToCurrency(balances[0].amount)}
                </Typography>
            );
        }

        // Multiple currencies - show list
        return (
            <Box sx={{
                maxHeight: balances.length > 3 ? 120 : 'auto',
                overflowY: balances.length > 3 ? 'auto' : 'visible',
                pr: balances.length > 3 ? 1 : 0
            }}>
                {balances.map((item, index) => (
                    <Typography
                        key={item.currency}
                        variant={index === 0 ? "h5" : "h6"}
                        sx={{
                            color: (theme) => theme.palette[colorKey].darker,
                            fontWeight: index === 0 ? 700 : 500,
                            mb: 0.5
                        }}
                    >
                        {currencyFind(item.currency)} {convertToCurrency(item.amount)}
                    </Typography>
                ))}
            </Box>
        );
    };

    return (
        <Container maxWidth={'xl'}>
            {loading ? <DashboardSkeleton /> :
                <>
                    {/* =================== ZONE 1: STATUS (Top) =================== */}
                    <Box sx={{ mb: 3 }}>
                        {/* Simple Text Greeting */}
                        <WelcomeMessage />

                        {/* Pending Invites Alert */}
                        <PendingInvites />

                        {/* Balance Cards - Multi-Currency Support */}
                        {!newUser && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {/* You Are Owed (Green) */}
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={2} direction='row' sx={{
                                        bgcolor: (theme) => theme.palette['success'].lighter,
                                        borderRadius: 2,
                                        p: 2.5,
                                        minHeight: 90,
                                        height: '100%'
                                    }}>
                                        <LabelIconStyle sx={{ bgcolor: (theme) => theme.palette['success'].dark, py: '18px' }}>
                                            <Iconify icon="mdi:cash-plus" sx={{ width: '100%', height: '100%', color: 'white' }} />
                                        </LabelIconStyle>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" component="h2"
                                                sx={{ color: (theme) => theme.palette['success'].darker, mb: 0.5 }}
                                            >
                                                You are owed
                                            </Typography>
                                            {renderBalanceList(owedByCurrency, 'success')}
                                        </Box>
                                    </Stack>
                                </Grid>

                                {/* You Owe (Red) */}
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={2} direction='row' sx={{
                                        bgcolor: (theme) => theme.palette['error'].lighter,
                                        borderRadius: 2,
                                        p: 2.5,
                                        minHeight: 90,
                                        height: '100%'
                                    }}>
                                        <LabelIconStyle sx={{ bgcolor: (theme) => theme.palette['error'].dark, py: '18px' }}>
                                            <Iconify icon="mdi:cash-minus" sx={{ width: '100%', height: '100%', color: 'white' }} />
                                        </LabelIconStyle>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" component="h2"
                                                sx={{ color: (theme) => theme.palette['error'].darker, mb: 0.5 }}
                                            >
                                                You owe
                                            </Typography>
                                            {renderBalanceList(oweByCurrency, 'error')}
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>
                        )}
                    </Box>

                    {/* =================== ZONE 2: NAVIGATION & ACTIVITY (Middle) =================== */}
                    {newUser ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 8,
                            bgcolor: 'action.hover',
                            borderRadius: 2
                        }}>
                            <Iconify icon="mdi:folder-plus-outline" sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" component="h2" color="text.secondary" gutterBottom>
                                Welcome to SplitBill!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Create your first group and start tracking shared expenses
                            </Typography>
                            <Link component={RouterLink} to={configData.CREATE_GROUP_URL}>
                                Create Group
                            </Link>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {/* Left Column: Your Groups (Clean navigation cards) */}
                            <Grid item xs={12} md={8}>
                                <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Iconify icon="mdi:folder-multiple" sx={{ fontSize: 24, color: 'success.main' }} />
                                                Your Groups ({userGroups.length})
                                            </Typography>
                                            <Link
                                                component={RouterLink}
                                                to={configData.USER_GROUPS_URL}
                                                underline="none"
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: 'text.primary !important',
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}
                                            >
                                                View All
                                            </Link>
                                        </Box>
                                        {/* Compact Group Cards - No Chart! */}
                                        <GroupCards groups={userGroups.slice(0, 6)} />
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Right Column: Recent Transactions */}
                            <Grid item xs={12} md={4}>
                                <RecentTransactions />
                            </Grid>
                        </Grid>
                    )}

                    {/* =================== ZONE 3: ANALYTICS OVERVIEW (Bottom) =================== */}
                    {!newUser && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" component="h2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Iconify icon="mdi:chart-line" sx={{ fontSize: 24 }} />
                                Analytics Overview
                            </Typography>
                            <Grid container spacing={3}>
                                {/* Groupwise Expense Chart */}
                                <Grid item xs={12} md={6}>
                                    <GroupExpenseChart />
                                </Grid>

                                {/* Category Chart */}
                                <Grid item xs={12} md={6}>
                                    <CategoryExpenseChart />
                                </Grid>

                                {/* Monthly Expense Graph - Full Width */}
                                <Grid item xs={12}>
                                    <CalenderExpenseGraph />
                                </Grid>
                            </Grid>
                            <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary', textAlign: 'center' }}>
                                * Values shown in original group currency
                            </Typography>
                        </Box>
                    )}

                    {/* =================== GLOBAL FAB =================== */}
                    {!newUser && (
                        <Fab
                            color="primary"
                            aria-label="add expense"
                            onClick={() => setModalOpen(true)}
                            sx={{
                                position: 'fixed',
                                bottom: 24,
                                right: 24,
                                zIndex: 1000
                            }}
                        >
                            <Iconify icon="mdi:plus" sx={{ fontSize: 28 }} />
                        </Fab>
                    )}

                    {/* Global Add Expense Modal */}
                    <GlobalAddExpenseModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSuccess={handleModalSuccess}
                    />
                </>
            }
        </Container>
    )
}
