import { LoadingButton } from '@mui/lab';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import {
    Alert, Box, Button, Chip, Collapse, Divider, FormControl, FormControlLabel,
    FormHelperText, Grid, Checkbox, InputAdornment, InputLabel, MenuItem,
    OutlinedInput, Paper, Select, TextField, Typography
} from '@mui/material';
import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { useMemo } from 'react';
import useResponsive from '../../theme/hooks/useResponsive';
import { currencyFind } from '../../utils/helper';
import { Link as RouterLink } from 'react-router-dom';
import configData from '../../config.json';

/**
 * Reusable Expense Form Component
 * Used by both AddExpense and EditExpense pages
 * 
 * @param {Object} props
 * @param {string} props.mode - 'add' or 'edit'
 * @param {Object} props.initialValues - Initial form values (for edit mode)
 * @param {string[]} props.groupMembers - List of group member emails
 * @param {string} props.groupCurrency - Currency code for the group
 * @param {string} props.groupId - ID of the group
 * @param {string} props.currentUser - Current user's email
 * @param {Function} props.onSubmit - Submit handler (values) => Promise
 * @param {boolean} props.isLoading - Whether form is submitting
 */
export default function ExpenseForm({
    mode = 'add',
    initialValues = {},
    groupMembers = [],
    groupCurrency = 'INR',
    groupId,
    currentUser,
    onSubmit,
    isLoading = false
}) {
    const mdUp = useResponsive('up', 'md');

    // Validation schema
    const expenseSchema = Yup.object().shape({
        expenseName: Yup.string().required('Expense name is required'),
        expenseDescription: Yup.string(),
        expenseAmount: Yup.string().required('Amount is required'),
        expenseCategory: Yup.string().required('Category is required'),
        expenseType: Yup.string().required('Payment Method is required'),
        expenseMembers: Yup.array().min(1, 'At least one expense member is required')
    });

    // Memoize default values to prevent form reset on every render
    const defaultValues = useMemo(() => ({
        expenseName: '',
        expenseDescription: '',
        expenseAmount: '',
        expenseCategory: '',
        expenseDate: new Date(),
        expenseMembers: groupMembers,
        expenseOwner: currentUser,
        groupId: groupId,
        expenseType: 'Cash',
        isRecurring: false,
        recurrenceFrequency: 'monthly',
        splitType: 'equal',
        splitDetails: [],
        ...initialValues
    }), [groupMembers, currentUser, groupId, initialValues]);

    const formik = useFormik({
        initialValues: defaultValues,
        validationSchema: expenseSchema,
        // Only enable reinitialize for edit mode to prevent form reset in add mode
        enableReinitialize: mode === 'edit',
        onSubmit: async (values) => {
            await onSubmit(values);
        },
    });


    const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps } = formik;

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    // Handle split type change
    const handleSplitTypeChange = (e) => {
        formik.setFieldValue('splitType', e.target.value);
        if (e.target.value === 'equal') {
            formik.setFieldValue('splitDetails', []);
        } else {
            const details = formik.values.expenseMembers.map(email => ({
                email,
                amount: e.target.value === 'exact' ? 0 : null,
                percentage: e.target.value === 'percentage' ? 0 : null
            }));
            formik.setFieldValue('splitDetails', details);
        }
    };

    // Handle split detail change for a member
    const handleSplitDetailChange = (index, member, e) => {
        const newDetails = [...(formik.values.splitDetails || [])];
        const numValue = parseFloat(e.target.value) || 0;
        newDetails[index] = {
            email: member,
            amount: formik.values.splitType === 'exact' ? numValue : null,
            percentage: formik.values.splitType === 'percentage' ? numValue : null
        };
        formik.setFieldValue('splitDetails', newDetails);
    };

    // Calculate split validation
    const getSplitValidation = () => {
        const splitDetails = formik.values.splitDetails || [];
        const expenseAmount = parseFloat(formik.values.expenseAmount) || 0;

        if (formik.values.splitType === 'exact') {
            const total = splitDetails.reduce((sum, d) => sum + (d?.amount || 0), 0);
            const isValid = Math.abs(total - expenseAmount) < 0.01;
            return {
                isValid,
                message: `Total: ${currencyFind(groupCurrency)}${total.toFixed(2)} / ${currencyFind(groupCurrency)}${expenseAmount.toFixed(2)}${!isValid ? ` (${total > expenseAmount ? 'Over' : 'Under'} by ${currencyFind(groupCurrency)}${Math.abs(total - expenseAmount).toFixed(2)})` : ''}`
            };
        } else {
            const totalPct = splitDetails.reduce((sum, d) => sum + (d?.percentage || 0), 0);
            const isValid = Math.abs(totalPct - 100) < 0.01;
            return {
                isValid,
                message: `Total: ${totalPct.toFixed(1)}% / 100%${!isValid ? ` (${totalPct > 100 ? 'Over' : 'Under'} by ${Math.abs(totalPct - 100).toFixed(1)}%)` : ''}`
            };
        }
    };

    return (
        <FormikProvider value={formik}>
            <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
                <Grid container spacing={3} sx={{ maxWidth: 800 }}>
                    {/* Expense Name */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="text"
                            name="expenseName"
                            label="Expense Name"
                            variant="outlined"
                            {...getFieldProps('expenseName')}
                            error={Boolean(touched.expenseName && errors.expenseName)}
                            helperText={touched.expenseName && errors.expenseName}
                        />
                    </Grid>

                    {/* Expense Description */}
                    <Grid item xs={12}>
                        <TextField
                            multiline
                            rows={2}
                            fullWidth
                            name="expenseDescription"
                            label="Expense Description"
                            variant="outlined"
                            {...getFieldProps('expenseDescription')}
                            error={Boolean(touched.expenseDescription && errors.expenseDescription)}
                            helperText={touched.expenseDescription && errors.expenseDescription}
                        />
                    </Grid>

                    {/* Expense Owner */}
                    <Grid item xs={12}>
                        <FormControl fullWidth error={Boolean(touched.expenseOwner && errors.expenseOwner)}>
                            <InputLabel id="expense-owner">Expense Owner</InputLabel>
                            <Select
                                name='expenseOwner'
                                labelId="expense-owner"
                                label="Expense Owner"
                                {...getFieldProps('expenseOwner')}
                            >
                                {groupMembers?.map((member) => (
                                    <MenuItem key={member} value={member}>{member}</MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{touched.expenseOwner && errors.expenseOwner}</FormHelperText>
                        </FormControl>
                    </Grid>

                    {/* Expense Members */}
                    <Grid item xs={12}>
                        <FormControl sx={{ width: '100%' }} error={Boolean(touched.expenseMembers && errors.expenseMembers)}>
                            <InputLabel id="expense-members-label">Expense Members</InputLabel>
                            <Select
                                labelId="expense-members-label"
                                multiple
                                {...getFieldProps('expenseMembers')}
                                input={<OutlinedInput label="Expense Members" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </Box>
                                )}
                                MenuProps={MenuProps}
                            >
                                {groupMembers?.map((member) => (
                                    <MenuItem key={member} value={member}>{member}</MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{touched.expenseMembers && errors.expenseMembers}</FormHelperText>
                        </FormControl>
                    </Grid>

                    {/* Split Type */}
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel id="split-type-label">Split Type</InputLabel>
                            <Select
                                labelId="split-type-label"
                                label="Split Type"
                                {...getFieldProps('splitType')}
                                onChange={handleSplitTypeChange}
                            >
                                <MenuItem value="equal">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>⚖️ Equal Split</Box>
                                </MenuItem>
                                <MenuItem value="exact">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>💵 Exact Amounts</Box>
                                </MenuItem>
                                <MenuItem value="percentage">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>📊 By Percentage</Box>
                                </MenuItem>
                            </Select>
                            <FormHelperText>
                                {values.splitType === 'equal' && 'Split equally among all members'}
                                {values.splitType === 'exact' && 'Specify exact amount each person owes'}
                                {values.splitType === 'percentage' && 'Specify percentage each person owes'}
                            </FormHelperText>
                        </FormControl>
                    </Grid>

                    {/* Dynamic Split Details */}
                    {values.splitType !== 'equal' && values.expenseMembers.length > 0 && (
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    {values.splitType === 'exact' ? '💵 Enter amount each person owes:' : '📊 Enter percentage for each person:'}
                                </Typography>
                                {values.expenseMembers.map((member, index) => (
                                    <Box key={member} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                                        <Typography sx={{ flex: 1, fontSize: '0.9rem', color: 'text.secondary' }}>
                                            {member.split('@')[0]}
                                        </Typography>
                                        <TextField
                                            size="small"
                                            type="number"
                                            onWheel={(e) => e.target.blur()}
                                            sx={{ width: 140 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        {values.splitType === 'exact' ? currencyFind(groupCurrency) : ''}
                                                    </InputAdornment>
                                                ),
                                                endAdornment: values.splitType === 'percentage' ? (
                                                    <InputAdornment position="end">%</InputAdornment>
                                                ) : null
                                            }}
                                            value={values.splitDetails?.[index]?.[values.splitType === 'exact' ? 'amount' : 'percentage'] || ''}
                                            onChange={(e) => handleSplitDetailChange(index, member, e)}
                                        />
                                    </Box>
                                ))}
                                <Divider sx={{ my: 2 }} />
                                {(() => {
                                    const { isValid, message } = getSplitValidation();
                                    return <Alert severity={isValid ? 'success' : 'warning'} sx={{ py: 0 }}>{message}</Alert>;
                                })()}
                            </Paper>
                        </Grid>
                    )}

                    {/* Amount and Category */}
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            name="expenseAmount"
                            type="number"
                            onWheel={(e) => e.target.blur()}
                            label="Expense Amount"
                            variant="outlined"
                            {...getFieldProps('expenseAmount')}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">{currencyFind(groupCurrency)}</InputAdornment>
                                ),
                            }}
                            error={Boolean(touched.expenseAmount && errors.expenseAmount)}
                            helperText={touched.expenseAmount && errors.expenseAmount}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth error={Boolean(touched.expenseCategory && errors.expenseCategory)}>
                            <InputLabel id="expense-category">Expense Category</InputLabel>
                            <Select
                                name='expenseCategory'
                                labelId="expense-category"
                                label="Expense Category"
                                {...getFieldProps('expenseCategory')}
                            >
                                <MenuItem value={'Food & drink'}>Food & drink</MenuItem>
                                <MenuItem value={'Shopping'}>Shopping</MenuItem>
                                <MenuItem value={'Entertainment'}>Entertainment</MenuItem>
                                <MenuItem value={'Home'}>Home</MenuItem>
                                <MenuItem value={'Transportation'}>Transportation</MenuItem>
                                <MenuItem value={'Others'}>Others</MenuItem>
                            </Select>
                            <FormHelperText>{touched.expenseCategory && errors.expenseCategory}</FormHelperText>
                        </FormControl>
                    </Grid>

                    {/* Payment Method */}
                    <Grid item xs={12}>
                        <FormControl fullWidth error={Boolean(touched.expenseType && errors.expenseType)}>
                            <InputLabel id="expense-type">Payment Method</InputLabel>
                            <Select
                                name='expenseType'
                                labelId="expense-type"
                                label="Payment Method"
                                {...getFieldProps('expenseType')}
                            >
                                <MenuItem value={'Cash'}>Cash</MenuItem>
                                <MenuItem value={'UPI Payment'}>UPI Payment</MenuItem>
                                <MenuItem value={'Card'}>Card</MenuItem>
                            </Select>
                            <FormHelperText>{touched.expenseType && errors.expenseType}</FormHelperText>
                        </FormControl>
                    </Grid>

                    {/* Date Picker */}
                    <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            {mdUp ? (
                                <DesktopDatePicker
                                    name="expenseDate"
                                    label="Expense Date"
                                    inputFormat="dd/MM/yyyy"
                                    renderInput={(params) => <TextField {...params} sx={{ width: '100%' }} />}
                                    value={values.expenseDate}
                                    onChange={(value) => formik.setFieldValue('expenseDate', Date.parse(value))}
                                />
                            ) : (
                                <MobileDatePicker
                                    name="expenseDate"
                                    label="Expense Date"
                                    inputFormat="dd/MM/yyyy"
                                    renderInput={(params) => <TextField {...params} sx={{ width: '100%' }} />}
                                    value={values.expenseDate}
                                    onChange={(value) => formik.setFieldValue('expenseDate', Date.parse(value))}
                                />
                            )}
                        </LocalizationProvider>
                    </Grid>

                    {/* Recurring Expense */}
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={values.isRecurring}
                                    onChange={(e) => formik.setFieldValue('isRecurring', e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Make this a recurring expense"
                        />
                    </Grid>

                    <Collapse in={values.isRecurring} sx={{ width: '100%' }}>
                        <Grid item xs={12} sx={{ px: 3, pb: 2 }}>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel id="recurrence-frequency">Repeat Every</InputLabel>
                                <Select
                                    name='recurrenceFrequency'
                                    labelId="recurrence-frequency"
                                    label="Repeat Every"
                                    {...getFieldProps('recurrenceFrequency')}
                                >
                                    <MenuItem value={'daily'}>Day</MenuItem>
                                    <MenuItem value={'weekly'}>Week</MenuItem>
                                    <MenuItem value={'monthly'}>Month</MenuItem>
                                    <MenuItem value={'yearly'}>Year</MenuItem>
                                </Select>
                                <FormHelperText>This expense will auto-repeat on this schedule</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Collapse>

                    {/* Action Buttons */}
                    {mdUp && <Grid item xs={0} md={6} />}
                    <Grid item xs={6} md={3}>
                        <Button
                            fullWidth
                            size="large"
                            variant="outlined"
                            component={RouterLink}
                            to={configData.VIEW_GROUP_URL + groupId}
                        >
                            Cancel
                        </Button>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <LoadingButton
                            fullWidth
                            size="large"
                            type="submit"
                            variant="contained"
                            loading={isSubmitting || isLoading}
                        >
                            {mode === 'add' ? 'Add Expense' : 'Update Expense'}
                        </LoadingButton>
                    </Grid>
                </Grid>
            </Form>
        </FormikProvider>
    );
}
