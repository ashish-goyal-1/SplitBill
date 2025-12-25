import { Card, CardContent, Grid, Skeleton, Box } from "@mui/material";

/**
 * Skeleton loader for Group Cards
 * Shows placeholder cards while groups are loading
 */
export function GroupCardSkeleton() {
    return (
        <Card sx={{ height: '100%', minHeight: 180 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={50} height={50} />
                    <Box sx={{ ml: 2, flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={28} />
                        <Skeleton variant="text" width="40%" height={20} />
                    </Box>
                </Box>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton variant="rounded" width={80} height={32} />
                    <Skeleton variant="rounded" width={60} height={32} />
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton loader for Groups List page
 * Shows multiple group card placeholders
 */
export function GroupsListSkeleton({ count = 6 }) {
    return (
        <Grid container spacing={3}>
            {[...Array(count)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                    <GroupCardSkeleton />
                </Grid>
            ))}
        </Grid>
    );
}

/**
 * Skeleton loader for Expense Cards
 */
export function ExpenseCardSkeleton() {
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ ml: 2, flex: 1 }}>
                    <Skeleton variant="text" width="50%" height={24} />
                    <Skeleton variant="text" width="30%" height={18} />
                </Box>
                <Skeleton variant="text" width={80} height={28} />
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton loader for Recent Transactions
 */
export function TransactionsSkeleton({ count = 5 }) {
    return (
        <Box>
            {[...Array(count)].map((_, index) => (
                <ExpenseCardSkeleton key={index} />
            ))}
        </Box>
    );
}

/**
 * Skeleton loader for Dashboard Summary Cards
 */
export function SummaryCardsSkeleton() {
    return (
        <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
                <Grid item xs={12} sm={4} key={index}>
                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width="40%" height={20} />
                            <Skeleton variant="text" width="60%" height={40} />
                            <Skeleton variant="text" width="30%" height={16} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}

/**
 * Skeleton loader for Charts/Graphs
 */
export function ChartSkeleton({ height = 300 }) {
    return (
        <Card>
            <CardContent>
                <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={height} />
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton loader for Settlement Cards
 */
export function SettlementCardSkeleton() {
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" width={100} height={24} sx={{ mx: 2 }} />
                        <Skeleton variant="circular" width={40} height={40} />
                    </Box>
                    <Skeleton variant="rounded" width={80} height={36} />
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton loader for Group View page
 */
export function GroupViewSkeleton() {
    return (
        <Box>
            {/* Header skeleton */}
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="40%" height={40} />
                <Skeleton variant="text" width="60%" height={24} />
            </Box>

            {/* Stats cards skeleton */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {[...Array(3)].map((_, index) => (
                    <Grid item xs={12} md={4} key={index}>
                        <Card>
                            <CardContent>
                                <Skeleton variant="circular" width={60} height={60} sx={{ mb: 1 }} />
                                <Skeleton variant="text" width="50%" height={20} />
                                <Skeleton variant="text" width="70%" height={32} />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Expenses list skeleton */}
            <TransactionsSkeleton count={4} />
        </Box>
    );
}

/**
 * Full page skeleton with optional message
 */
export function PageSkeleton({ message = "Loading..." }) {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2
        }}>
            <Skeleton variant="circular" width={80} height={80} animation="wave" />
            <Skeleton variant="text" width={150} height={30} />
        </Box>
    );
}

/**
 * Skeleton loader for Dashboard page
 * Matches the actual dashboard's 3-zone layout to prevent CLS
 */
export function DashboardSkeleton() {
    return (
        <>
            {/* =================== ZONE 1: STATUS (Full Width) =================== */}
            <Box sx={{ mb: 3 }}>
                {/* Welcome message skeleton */}
                <Skeleton variant="text" width="40%" height={36} sx={{ mb: 1 }} />

                {/* Balance Cards skeleton - EXACTLY matching real Stack styling */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {[...Array(2)].map((_, index) => (
                        <Grid item xs={12} md={6} key={index}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: index === 0 ? 'success.lighter' : 'error.lighter',
                                borderRadius: 2,
                                p: 2.5,
                                minHeight: 90,
                                height: '100%'
                            }}>
                                <Skeleton variant="circular" width={60} height={60} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="50%" height={18} sx={{ mb: 0.5 }} />
                                    <Skeleton variant="text" width="40%" height={32} />
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* =================== ZONE 2: NAVIGATION & ACTIVITY (8-4 Grid) =================== */}
            <Grid container spacing={3}>
                {/* Left Column: Your Groups */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Skeleton variant="text" width="40%" height={28} />
                                <Skeleton variant="text" width="15%" height={20} />
                            </Box>
                            {/* Group cards skeleton */}
                            <Grid container spacing={2}>
                                {[...Array(3)].map((_, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card sx={{ height: '100%' }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                    <Skeleton variant="circular" width={40} height={40} />
                                                    <Skeleton variant="text" width="60%" height={24} />
                                                </Box>
                                                <Skeleton variant="text" width="40%" height={16} />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Recent Transactions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderLeft: 4, borderColor: 'info.main' }}>
                        <CardContent>
                            <Skeleton variant="text" width="70%" height={28} sx={{ mb: 2 }} />
                            <TransactionsSkeleton count={3} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* =================== ZONE 3: ANALYTICS (Full Width) =================== */}
            <Box sx={{ mt: 4 }}>
                <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <ChartSkeleton height={300} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ChartSkeleton height={300} />
                    </Grid>
                    <Grid item xs={12}>
                        <ChartSkeleton height={250} />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
}
