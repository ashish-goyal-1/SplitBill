import { LoadingButton } from '@mui/lab';
import {
    Container, FormControl, FormHelperText, Grid, InputLabel,
    MenuItem, Select, TextField, Typography
} from '@mui/material'
import { Form, FormikProvider, useFormik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import Loading from '../../loading';
import useResponsive from '../../../theme/hooks/useResponsive';
import { createGroupService } from '../../../services/groupServices';
import AlertBanner from '../../AlertBanner';
import configData from '../../../config.json'
import MemberSearchInput from '../MemberSearchInput';


export default function Creategroup() {
    const mdUp = useResponsive('up', 'md');
    const profile = JSON.parse(localStorage.getItem('profile'))
    const currentUser = profile?.emailId
    const [loading] = useState(false);
    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('error');

    //Formik schema 
    const groupSchema = Yup.object().shape({
        groupName: Yup.string().required('Group name is required'),
        groupDescription: Yup.string(),
        groupCurrency: Yup.string().required('Currency Type is required'),
        groupCategory: Yup.string().required('Category is required'),
    });

    const formik = useFormik({
        initialValues: {
            groupName: '',
            groupDescription: '',
            groupCurrency: '',
            groupCategory: '',
            groupMembers: [currentUser],
            groupOwner: currentUser
        },
        validationSchema: groupSchema,
        onSubmit: async () => {
            const create_response = await createGroupService(values, setAlert, setAlertMessage)
            window.location = configData.VIEW_GROUP_URL + create_response.data.Id
        },
    });

    const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps } = formik;

    // Handle alert from MemberSearchInput
    const handleAlert = (message, severity) => {
        setAlert(true);
        setAlertMessage(message);
        setAlertSeverity(severity);
    };

    // Handle member add
    const handleAddMember = (email) => {
        formik.setFieldValue('groupMembers', [...values.groupMembers, email]);
    };

    // Handle member remove
    const handleRemoveMember = (email) => {
        formik.setFieldValue('groupMembers', values.groupMembers.filter(m => m !== email));
    };

    return (
        <Container>
            {loading ? <Loading /> :
                <>
                    <Typography variant="h4" pb={2} mb={3}>
                        Create New group
                    </Typography>
                    <AlertBanner showAlert={alert} alertMessage={alertMessage} severity={alertSeverity} />
                    <FormikProvider value={formik}>
                        <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
                            <Grid container spacing={3} sx={{ maxWidth: 800 }}>
                                <Grid item xs={12} >
                                    <TextField fullWidth
                                        type="text"
                                        name="groupName"
                                        id="outlined-basic"
                                        label="Group Name"
                                        variant="outlined"
                                        {...getFieldProps('groupName')}
                                        error={Boolean(touched.groupName && errors.groupName)}
                                        helperText={touched.groupName && errors.groupName}
                                    />
                                </Grid>
                                <Grid item xs={12} >
                                    <TextField
                                        multiline
                                        rows={4}
                                        fullWidth
                                        name="groupDescription"
                                        id="outlined-basic"
                                        label="Group Description"
                                        variant="outlined"
                                        {...getFieldProps('groupDescription')}
                                        error={Boolean(touched.groupDescription && errors.groupDescription)}
                                        helperText={touched.groupDescription && errors.groupDescription}
                                    />
                                </Grid>

                                {/* Members Section - Using Shared Component */}
                                <Grid item xs={12}>
                                    <MemberSearchInput
                                        members={values.groupMembers}
                                        onAddMember={handleAddMember}
                                        onRemoveMember={handleRemoveMember}
                                        currentUser={currentUser}
                                        groupName={values.groupName}
                                        onAlert={handleAlert}
                                    />
                                </Grid>

                                <Grid item xs={6} >
                                    <FormControl fullWidth
                                        error={Boolean(touched.groupCurrency && errors.groupCurrency)}
                                    >
                                        <InputLabel id="demo-simple-select-label">Currency</InputLabel>
                                        <Select
                                            name='groupCurrency'
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            label="Currency"
                                            {...getFieldProps('groupCurrency')}
                                        >
                                            <MenuItem value={'INR'}>₹ INR</MenuItem>
                                            <MenuItem value={'USD'}>$ USD</MenuItem>
                                            <MenuItem value={'EUR'}>€ EUR</MenuItem>
                                            <MenuItem value={'GBP'}>£ GBP</MenuItem>
                                            <MenuItem value={'JPY'}>¥ JPY</MenuItem>
                                            <MenuItem value={'AUD'}>A$ AUD</MenuItem>
                                            <MenuItem value={'CAD'}>C$ CAD</MenuItem>
                                            <MenuItem value={'CHF'}>CHF</MenuItem>
                                            <MenuItem value={'CNY'}>¥ CNY</MenuItem>
                                            <MenuItem value={'SGD'}>S$ SGD</MenuItem>
                                        </Select>
                                        <FormHelperText>{touched.groupCurrency && errors.groupCurrency}</FormHelperText>

                                    </FormControl>
                                </Grid>
                                <Grid item xs={6} >
                                    <FormControl fullWidth
                                        error={Boolean(touched.groupCategory && errors.groupCategory)}
                                    >
                                        <InputLabel id="group-category">Category</InputLabel>
                                        <Select
                                            name='groupCategory'
                                            labelId="group-category"
                                            id="demo-simple-select"
                                            label="Category"
                                            {...getFieldProps('groupCategory')}
                                        >
                                            <MenuItem value={'Home'}>Home</MenuItem>
                                            <MenuItem value={'Trip'}>Trip</MenuItem>
                                            <MenuItem value={'Office'}>Office</MenuItem>
                                            <MenuItem value={'Sports'}>Sports</MenuItem>
                                            <MenuItem value={'Others'}>Others</MenuItem>
                                        </Select>
                                        <FormHelperText>{touched.groupCategory && errors.groupCategory}</FormHelperText>

                                    </FormControl>
                                </Grid>

                                {mdUp && <Grid item xs={0} md={9} />}

                                <Grid item xs={6} md={3}>
                                    <LoadingButton fullWidth size="large" type="submit" variant="contained" loading={isSubmitting}>
                                        Create Group
                                    </LoadingButton>
                                </Grid>
                            </Grid>
                        </Form>
                    </FormikProvider>
                </>
            }
        </Container>
    )
}
