import { Avatar, Box, Button, Chip, Container, Divider, Fab, FormControl, Grid, IconButton, InputAdornment, InputLabel, Link, MenuItem, Select, Snackbar, Stack, styled, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getGroupDetailsService, getGroupExpenseService } from '../../../services/groupServices';
import AlertBanner from '../../AlertBanner';
import Iconify from '../../Iconify';
import { GroupViewSkeleton } from '../../skeletons';
import useResponsive from '../../../theme/hooks/useResponsive';
import { convertToCurrency, currencyFind, categoryIcon } from '../../../utils/helper';
import ExpenseCard from '../../expense/expenseCard';
import GroupCategoryGraph from './groupCategoryGraph';
import GroupMonthlyGraph from './groupMonthlyGraph';
import TopSpenders from './TopSpenders';
import { Link as RouterLink } from 'react-router-dom';
import dataConfig from '../../../config.json';
import { GroupSettlements } from '../settlement';
import MyBalance from '../settlement/MyBalance';
import { exportToPDF, exportToCSV } from '../../../utils/exportUtils';
import ActivityFeed from './ActivityFeed';

const profile = JSON.parse(localStorage.getItem('profile'))
const emailId = profile?.emailId
var showCount = 10
export default function ViewGroup() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [group, setGroup] = useState({});
    const [groupExpense, setGroupExpense] = useState([]);
    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertExpense, setAlertExpense] = useState(false);
    const [alertExpenseMessage, setAlertExpenseMessage] = useState('');
    const [showAllExp, setShowAllExp] = useState(false);
    const [expFocus, setExpFocus] = useState(false);
    const [expenses, setExpenses] = useState()
    const [viewSettlement, setViewSettlement] = useState(0)

    // Search and Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [payerFilter, setPayerFilter] = useState('all');

    // Snackbar for share feedback
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Share group link handler
    const handleShareGroup = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setSnackbarMessage('Group link copied to clipboard!');
            setSnackbarOpen(true);
        } catch (err) {
            setSnackbarMessage('Failed to copy link');
            setSnackbarOpen(true);
        }
    };


    const toggleAllExp = () => {
        setExpenses(groupExpense?.expense?.slice(0, showCount))
        if (showCount >= groupExpense?.expense?.length)
            setShowAllExp(true)
        setExpFocus(true)
        showCount += 5
    }


    const toggleExpView = () => {
        setViewSettlement(0)
    }

    const toggleSettleView = () => {
        setViewSettlement(1)
    }

    const toggleMySettleView = () => {
        setViewSettlement(2)
    }

    const toggleActivityView = () => {
        setViewSettlement(3)
    }

    // Filtered expenses based on search and filters
    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter(exp => {
            const matchesSearch = searchTerm === '' ||
                exp.expenseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.expenseDescription?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' ||
                exp.expenseCategory === categoryFilter;
            const matchesPayer = payerFilter === 'all' ||
                exp.expenseOwner === payerFilter;
            return matchesSearch && matchesCategory && matchesPayer;
        });
    }, [expenses, searchTerm, categoryFilter, payerFilter]);

    // Handle PDF export
    const handleExportPDF = () => {
        exportToPDF({
            groupName: group?.groupName,
            currency: currencyFind(group?.groupCurrency),
            totalExpense: groupExpense?.total,
            expenses: groupExpense?.expense,
            settlements: [], // Would need to fetch from settlement API
            members: group?.groupMembers
        });
    };

    // Handle CSV export
    const handleExportCSV = () => {
        exportToCSV(groupExpense?.expense, group?.groupName);
    };

    const mdUp = useResponsive('up', 'md');

    const findUserSplit = (split) => {
        if (split) {
            split = split[0]
            return split[emailId]
        }
        return 0
    }

    useEffect(() => {
        const getGroupDetails = async () => {
            setLoading(true)
            const groupIdJson = {
                id: params.groupId
            }
            const response_group = await getGroupDetailsService(groupIdJson, setAlert, setAlertMessage)
            const response_expense = await getGroupExpenseService(groupIdJson, setAlertExpense, setAlertExpenseMessage)

            response_group && setGroup(response_group?.data?.group)
            response_expense && setGroupExpense(response_expense?.data)
            response_expense?.data?.expense && setExpenses(response_expense?.data?.expense?.slice(0, 5))
            if (response_expense?.data?.expense?.length <= 5 || !response_expense)
                setShowAllExp(true)
            setLoading(false)
        }
        getGroupDetails()
    }, [params.groupId]);

    const CategoryStyle = styled('span')(({ theme }) => ({
        top: 22,
        left: -57,
        zIndex: 10,
        width: 35,
        height: 32,
        borderRadius: 50,
        position: 'relative'
    }));

    const LabelIconStyle = styled('div')(({ theme }) => ({
        borderRadius: 60,
        width: 60,
        height: 60,


    }))
    return (

        <Container>
            {loading ? <GroupViewSkeleton /> :
                <>
                    <Box sx={(theme) => ({
                        bgcolor: theme.palette.mode === 'dark'
                            ? 'background.paper'
                            : theme.palette['info'].lighter,
                        borderRadius: 2,
                        p: 2,
                        color: 'text.primary',
                        pb: 3,
                        border: theme.palette.mode === 'dark' ? 1 : 0,
                        borderColor: 'divider'
                    })}>

                        <AlertBanner showAlert={alert} alertMessage={alertMessage} severity='error' />

                        <Stack direction="row" spacing={1} sx={{ float: 'right' }}>
                            <Tooltip title="Copy invite link" arrow>
                                <IconButton
                                    onClick={handleShareGroup}
                                    size="small"
                                    sx={{ color: 'primary.main' }}
                                >
                                    <Iconify icon="mdi:share-variant" sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                            <Iconify
                                icon="mdi:file-pdf-box"
                                onClick={handleExportPDF}
                                sx={{ fontSize: 22, cursor: 'pointer', color: 'error.main', '&:hover': { opacity: 0.7 } }}
                                title="Export to PDF"
                            />
                            <Iconify
                                icon="mdi:file-excel"
                                onClick={handleExportCSV}
                                sx={{ fontSize: 22, cursor: 'pointer', color: 'success.main', '&:hover': { opacity: 0.7 } }}
                                title="Export to CSV"
                            />
                            <Link component={RouterLink} to={dataConfig.EDIT_GROUP_URL + group?._id}>
                                <Iconify icon="akar-icons:edit" sx={{ fontSize: 18 }} />
                            </Link>
                        </Stack>
                        <Typography variant="h4" pb={1}>
                            {group?.groupName}
                        </Typography>
                        <Typography variant="subtitle2">
                            {group?.groupDescription}
                        </Typography>

                        <Typography mt={1} variant="body2" sx={{ color: 'text.secondary' }}>
                            Created by &nbsp;
                            <Box component={'span'} sx={{ color: (theme) => theme.palette['primary'].darker }}>
                                {group?.groupOwner}
                            </Box>
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    bgcolor: (theme) => theme.palette['warning'].lighter,
                                    p: 1,
                                    borderRadius: 1,
                                    color: (theme) => theme.palette['warning'].darker
                                }}>
                                Category : &nbsp;
                                {group?.groupCategory}
                            </Typography>
                        </Stack>

                        {/* Members Section */}
                        <Box sx={{ mt: 2, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Iconify icon="mdi:account-group" sx={{ fontSize: 18 }} />
                                Members ({(group?.groupMembers?.length || 0) + (group?.pendingMembers?.length || 0)})
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {group?.groupMembers?.map(member => (
                                    <Tooltip key={member} title={member} arrow>
                                        <Chip
                                            avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{member[0].toUpperCase()}</Avatar>}
                                            label={member.split('@')[0]}
                                            variant="filled"
                                            color="primary"
                                            size="small"
                                            sx={(theme) => ({
                                                bgcolor: theme.palette.mode === 'dark'
                                                    ? 'primary.main'
                                                    : 'primary.lighter',
                                                color: theme.palette.mode === 'dark'
                                                    ? 'white'
                                                    : 'primary.darker',
                                                '& .MuiChip-avatar': { color: 'white' }
                                            })}
                                        />
                                    </Tooltip>
                                ))}
                                {group?.pendingMembers?.map(member => (
                                    <Tooltip key={member} title={`${member} (Pending invite)`} arrow>
                                        <Chip
                                            avatar={<Avatar sx={{ bgcolor: 'warning.main' }}>{member[0].toUpperCase()}</Avatar>}
                                            label={`${member.split('@')[0]} ⏳`}
                                            variant="outlined"
                                            color="warning"
                                            size="small"
                                        />
                                    </Tooltip>
                                ))}
                            </Stack>
                        </Box>

                        <Stack direction="row" justifyContent="flex-end" mt={1}>
                            <Fab component={RouterLink}

                                to={dataConfig.ADD_EXPENSE_URL + group?._id}
                                color="primary" aria-label="add"
                                variant="extended"
                                sx={{
                                    textDecoration: 'none',
                                    ...(!mdUp && {
                                        margin: 0,
                                        top: 'auto',
                                        right: 20,
                                        bottom: 20,
                                        left: 'auto',
                                        position: 'fixed'
                                    }),
                                }}>
                                <Iconify icon='eva:file-add-fill' sx={{
                                    height: 22,
                                    ...(mdUp && {
                                        mr: 1,
                                        width: 22
                                    }),
                                    ...(!mdUp && {
                                        width: '100%'
                                    })
                                }} />
                                {mdUp &&
                                    <>Add Expense</>}
                            </Fab>
                        </Stack>
                        <Box
                            sx={{
                                mb: -4,
                                ml: -2,
                                width: 80,
                                height: 36,
                                display: 'inline-block',
                                bgcolor: 'currentColor',
                                mask: `url(/static/icons/shape-avatar.svg) no-repeat center / contain`,
                                WebkitMask: `url(/static/icons/shape-avatar.svg) no-repeat center / contain`,
                                zIndex: 9,
                                color: 'background.paper'
                            }}
                        />
                        <CategoryStyle
                            sx={{
                                bgcolor: (theme) => theme.palette['primary'].lighter,
                                py: '6px',
                                px: '9px'
                            }}
                        >
                            <Iconify icon={categoryIcon(group?.groupCategory)} color={(theme) => theme.palette['primary'].darker}
                            />
                        </CategoryStyle>
                    </Box>

                    <Box sx={{
                        mt: -2, p: 2,
                        bgcolor: 'background.paper',
                        minHeight: 50,
                        width: '100%'

                    }}>
                        <Grid container spacing={3} mt={'1px'}
                            sx={{
                                ...(mdUp && { px: 6 })
                            }}
                        >

                            <Grid item xs={12} md={4}>
                                <Stack spacing={2} direction='row'
                                    sx={{
                                        bgcolor: (theme) => theme.palette['primary'].lighter,
                                        borderRadius: 2,
                                        p: 3
                                    }}>
                                    <LabelIconStyle sx={{ bgcolor: (theme) => theme.palette['primary'].dark, py: '18px' }}>
                                        <Iconify icon=":nimbus:invoice" sx={{ width: '100%', height: '100%', color: 'white' }} />
                                    </LabelIconStyle>
                                    <Box>
                                        <Typography variant="h6"
                                            sx={{ color: (theme) => theme.palette['primary'].dark }}>
                                            Total expense
                                        </Typography>
                                        <Typography variant="h5"
                                            sx={{ color: (theme) => theme.palette['primary'].darker }}>
                                            {currencyFind(group?.groupCurrency)} {groupExpense.total ? convertToCurrency(groupExpense.total) : 0}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={4}

                            >
                                <Stack spacing={2} direction='row' sx={{
                                    bgcolor: (theme) => theme.palette['success'].lighter,
                                    borderRadius: 2,
                                    p: 3
                                }} >
                                    <LabelIconStyle sx={{ bgcolor: (theme) => theme.palette['success'].dark, py: '18px' }}>
                                        <Iconify icon="mdi:cash-plus" sx={{ width: '100%', height: '100%', color: 'white' }} />
                                    </LabelIconStyle>
                                    <Box>
                                        <Typography variant="h6"
                                            sx={{ color: (theme) => theme.palette['success'].dark }}
                                        >
                                            You are owed <br />
                                        </Typography>
                                        <Typography variant="h5"
                                            sx={{ color: (theme) => theme.palette['success'].darker }}>
                                            {currencyFind(group?.groupCurrency)} {findUserSplit(group?.split) > 0 ? convertToCurrency(findUserSplit(group?.split)) : 0}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Stack spacing={2} direction='row' sx={{
                                    bgcolor: (theme) => theme.palette['error'].lighter,
                                    borderRadius: 2,
                                    p: 3
                                }} >
                                    <LabelIconStyle sx={{ bgcolor: (theme) => theme.palette['error'].dark, py: '18px' }}>
                                        <Iconify icon="mdi:cash-minus" sx={{ width: '100%', height: '100%', color: 'white' }} />
                                    </LabelIconStyle>
                                    <Box>
                                        <Typography variant="h6"
                                            sx={{ color: (theme) => theme.palette['error'].dark }}
                                        >
                                            You owe <br />
                                        </Typography>
                                        <Typography variant="h5"
                                            sx={{ color: (theme) => theme.palette['error'].darker }}>
                                            {currencyFind(group?.groupCurrency)} {findUserSplit(group?.split) < 0 ? convertToCurrency(Math.abs(findUserSplit(group?.split))) : 0}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                        </Grid>
                        <Stack
                            pt={4}
                            px={{ xs: 0, md: 6 }}
                            divider={<Divider orientation="vertical" flexItem />}
                            direction="row"
                            justifyContent='space-evenly'
                            alignItems="center"
                            spacing={1}
                        >
                            <Typography variant="subtitle" onClick={toggleExpView} noWrap sx={{
                                cursor: 'pointer', fontSize: 18,
                                width: '100%',
                                textAlign: 'center',
                                ...(viewSettlement === 0 && {
                                    fontWeight: 800,
                                    borderRadius: 1,
                                    px: 1,
                                    color: (theme) => theme.palette['info'].dark,
                                    bgcolor: (theme) => theme.palette['primary'].lighter,
                                    py: '5px',
                                }),
                                ...(!mdUp && {
                                    fontSize: 11
                                })
                            }}>
                                Group Expenses
                            </Typography>

                            <Typography variant="subtitle" onClick={toggleSettleView} noWrap sx={{
                                cursor: 'pointer', fontSize: 18,
                                width: '100%',
                                textAlign: 'center',
                                ...(viewSettlement === 1 && {
                                    fontWeight: 800,
                                    borderRadius: 1,
                                    px: 1,
                                    color: (theme) => theme.palette['info'].dark,
                                    bgcolor: (theme) => theme.palette['primary'].lighter,
                                    py: '5px',
                                }),
                                ...(!mdUp && {
                                    fontSize: 11
                                })
                            }}>
                                Group Balance
                            </Typography>

                            <Typography variant="subtitle" onClick={toggleMySettleView} noWrap sx={{
                                cursor: 'pointer', fontSize: 18,
                                width: '100%',
                                textAlign: 'center',
                                ...(viewSettlement === 2 && {
                                    fontWeight: 800,
                                    borderRadius: 1,
                                    px: 1,
                                    color: (theme) => theme.palette['info'].dark,
                                    bgcolor: (theme) => theme.palette['primary'].lighter,
                                    py: '5px',
                                }),
                                ...(!mdUp && {
                                    fontSize: 11
                                })
                            }}>
                                My Balance
                            </Typography>

                            <Typography variant="subtitle" onClick={toggleActivityView} noWrap sx={{
                                cursor: 'pointer', fontSize: 18,
                                width: '100%',
                                textAlign: 'center',
                                ...(viewSettlement === 3 && {
                                    fontWeight: 800,
                                    borderRadius: 1,
                                    px: 1,
                                    color: (theme) => theme.palette['info'].dark,
                                    bgcolor: (theme) => theme.palette['primary'].lighter,
                                    py: '5px',
                                }),
                                ...(!mdUp && {
                                    fontSize: 11
                                })
                            }}>
                                Activity
                            </Typography>
                        </Stack>
                        <Grid container mt={2} rowSpacing={2} columnSpacing={{ xs: 1, md: 2 }}
                            justifyContent={'center'}
                            alignItems={'center'}
                            sx={{
                                ...(mdUp && { px: 6 })
                            }}
                        >
                            {viewSettlement == 2 &&
                                <MyBalance currencyType={group?.groupCurrency} />
                            }
                            {viewSettlement === 1 &&
                                <Grid item md={12} xs={12}>
                                    <GroupSettlements currencyType={group?.groupCurrency} />
                                    {/* Analytics Section - Moved from Expenses Tab */}
                                    <Box sx={{ mt: 4 }}>
                                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Iconify icon="mdi:chart-line" sx={{ fontSize: 24 }} />
                                            Spending Analysis
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <GroupCategoryGraph currencyType={group?.groupCurrency} />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TopSpenders currencyType={group?.groupCurrency} />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <GroupMonthlyGraph />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            }
                            {viewSettlement === 3 &&
                                <Grid item xs={12}>
                                    <ActivityFeed groupId={params.groupId} />
                                </Grid>
                            }
                            {viewSettlement === 0 &&
                                <>
                                    {alertExpense ?
                                        <Grid container
                                            direction="column"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                minHeight: '200px'
                                            }}
                                        >
                                            <Typography variant="body2" fontSize={18} textAlign={'center'}>
                                                No expense present for this group! Record your first group expense now <br />
                                                <Link component={RouterLink}
                                                    to={dataConfig.ADD_EXPENSE_URL + group?._id}>
                                                    Add Expense
                                                </Link>
                                            </Typography>
                                        </Grid>
                                        : <>
                                            {/* Summary Ribbon - Sticky on desktop, scrollable on mobile */}
                                            <Grid item xs={12}>
                                                <Box sx={(theme) => ({
                                                    display: 'flex',
                                                    justifyContent: 'space-around',
                                                    alignItems: 'center',
                                                    bgcolor: theme.palette.mode === 'dark'
                                                        ? 'background.paper'
                                                        : 'info.lighter',
                                                    borderRadius: 2,
                                                    p: 2,
                                                    mb: 2,
                                                    boxShadow: 2,
                                                    border: 1,
                                                    borderColor: theme.palette.mode === 'dark'
                                                        ? 'divider'
                                                        : 'info.light',
                                                    position: { md: 'sticky' },
                                                    top: { md: 0 },
                                                    zIndex: { md: 10 }
                                                })}>
                                                    <Box sx={{ textAlign: 'center', px: 2, py: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: 'text.secondary',
                                                                fontWeight: 500,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                                mb: 0.5
                                                            }}
                                                        >
                                                            Total Group Spend
                                                        </Typography>
                                                        <Typography
                                                            variant="h5"
                                                            sx={{
                                                                color: 'primary.main',
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {currencyFind(group?.groupCurrency)} {groupExpense?.total ? convertToCurrency(groupExpense.total) : 0}
                                                        </Typography>
                                                    </Box>
                                                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'primary.light' }} />
                                                    <Box sx={{ textAlign: 'center', px: 2, py: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: 'text.secondary',
                                                                fontWeight: 500,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                                mb: 0.5
                                                            }}
                                                        >
                                                            Your Total Share
                                                        </Typography>
                                                        <Typography
                                                            variant="h5"
                                                            sx={{
                                                                color: findUserSplit(group?.split) >= 0 ? 'success.main' : 'error.main',
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {currencyFind(group?.groupCurrency)} {Math.abs(findUserSplit(group?.split) || 0).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Search and Filter UI */}
                                            <Grid item xs={12}>
                                                <Stack
                                                    direction={{ xs: 'column', md: 'row' }}
                                                    spacing={2}
                                                    sx={{
                                                        mb: 2,
                                                        p: 2,
                                                        bgcolor: 'action.hover',
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <TextField
                                                        size="small"
                                                        placeholder="Search expenses..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Iconify icon="mdi:magnify" sx={{ color: 'text.disabled' }} />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ flex: 1, minWidth: 200 }}
                                                    />
                                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                                        <InputLabel>Category</InputLabel>
                                                        <Select
                                                            value={categoryFilter}
                                                            label="Category"
                                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                                        >
                                                            <MenuItem value="all">All Categories</MenuItem>
                                                            <MenuItem value="Food & drink">Food & drink</MenuItem>
                                                            <MenuItem value="Entertainment">Entertainment</MenuItem>
                                                            <MenuItem value="Transportation">Transportation</MenuItem>
                                                            <MenuItem value="Healthcare">Healthcare</MenuItem>
                                                            <MenuItem value="Utilities">Utilities</MenuItem>
                                                            <MenuItem value="Others">Others</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                                        <InputLabel>Paid By</InputLabel>
                                                        <Select
                                                            value={payerFilter}
                                                            label="Paid By"
                                                            onChange={(e) => setPayerFilter(e.target.value)}
                                                        >
                                                            <MenuItem value="all">All Payers</MenuItem>
                                                            {group?.groupMembers?.map(member => (
                                                                <MenuItem key={member} value={member}>
                                                                    {member.split('@')[0]}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Stack>
                                            </Grid>

                                            <Grid item xs={12} md={expFocus ? 12 : 6}>
                                                <Grid container spacing={2}>

                                                    {filteredExpenses?.length === 0 && (searchTerm || categoryFilter !== 'all' || payerFilter !== 'all') ? (
                                                        <Grid item xs={12}>
                                                            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                                                No expenses match your filters.
                                                            </Typography>
                                                        </Grid>
                                                    ) : (
                                                        filteredExpenses?.map(myExpense => (
                                                            <Grid item xs={12} md={expFocus ? 6 : 12} key={myExpense?._id}>
                                                                <ExpenseCard
                                                                    expenseId={myExpense?._id}
                                                                    expenseName={myExpense?.expenseName}
                                                                    expenseAmount={myExpense?.expenseAmount}
                                                                    expensePerMember={myExpense?.expensePerMember}
                                                                    expenseOwner={myExpense?.expenseOwner}
                                                                    expenseDate={myExpense?.expenseDate}
                                                                    currencyType={group?.groupCurrency}
                                                                    splitType={myExpense?.splitType}
                                                                />
                                                            </Grid>))
                                                    )}

                                                    {!showAllExp && <Grid item xs={12}>
                                                        <Button onClick={toggleAllExp}>View More</Button>
                                                    </Grid>}
                                                </Grid>
                                            </Grid>
                                        </>
                                    }
                                </>
                            }

                        </Grid>

                        {/* Snackbar for share feedback */}
                        <Snackbar
                            open={snackbarOpen}
                            autoHideDuration={3000}
                            onClose={() => setSnackbarOpen(false)}
                            message={snackbarMessage}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        />
                    </Box>

                </>}
        </Container>
    )
}
