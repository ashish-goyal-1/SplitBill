import { Box, Typography } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chart.js/auto';
import Loading from '../loading';
import AlertBanner from '../AlertBanner';
import { convertToCurrency, currencyFind } from '../../utils/helper';

/**
 * Reusable Doughnut Chart Component
 * Used for both dashboard category expense and group category expense charts
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of { _id: string, amount: number }
 * @param {string} props.title - Chart title
 * @param {boolean} props.loading - Whether data is loading
 * @param {boolean} props.showAlert - Whether to show error alert
 * @param {string} props.alertMessage - Error message to show
 * @param {string} props.currencyType - Currency code (optional, for labels)
 * @param {boolean} props.showCurrencyInLabels - Whether to show currency in data labels
 * @param {number} props.height - Chart height (default: 500)
 * @param {boolean} props.showContainer - Whether to wrap in styled container
 */
export default function DoughnutChart({
    data = [],
    title = 'Category Expense Chart',
    loading = false,
    showAlert = false,
    alertMessage = '',
    currencyType,
    showCurrencyInLabels = false,
    height = 500,
    showContainer = true
}) {
    // Chart color palette
    const CHART_COLORS = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
    ];

    // Prepare chart data
    const chartData = {
        labels: data?.map(item => item._id) || [],
        datasets: [{
            label: 'Category Expenses',
            data: data?.map(item => item.amount) || [],
            fill: true,
            backgroundColor: CHART_COLORS,
            borderWidth: 1,
        }]
    };

    // Chart options
    const options = {
        maintainAspectRatio: false,
        plugins: {
            datalabels: {
                display: showCurrencyInLabels,
                color: 'error',
                formatter: (value) => {
                    if (showCurrencyInLabels && currencyType) {
                        return `${currencyFind(currencyType)} ${convertToCurrency(value)}`;
                    }
                    return convertToCurrency(value);
                }
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    padding: showContainer ? 10 : 18
                },
            },
        }
    };

    if (loading) return <Loading />;

    // Render without container (for inline use)
    if (!showContainer) {
        return (
            <>
                <AlertBanner showAlert={showAlert} alertMessage={alertMessage} severity='error' />
                <Doughnut data={chartData} options={options} plugins={[ChartDataLabels]} />
                <Typography variant='subtitle' p={3}>
                    <center>{title}</center>
                </Typography>
            </>
        );
    }

    // Render with styled container
    return (
        <Box sx={{
            p: 5,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 5
        }}>
            <Typography variant="h6" mb={2}>
                {title}
            </Typography>
            <AlertBanner showAlert={showAlert} alertMessage={alertMessage} severity='error' />
            <Box height={height}>
                <Doughnut data={chartData} options={options} plugins={[ChartDataLabels]} />
            </Box>
        </Box>
    );
}
