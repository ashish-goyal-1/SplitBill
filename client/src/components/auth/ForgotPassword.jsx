import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik, Form, FormikProvider } from 'formik';
import { Container, Typography, Box, TextField, Alert, Button, Paper, Stack, Link } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Logo from '../Logo';
import { forgotPassword } from '../../api';

export default function ForgotPassword() {
    const [submitted, setSubmitted] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const ForgotPasswordSchema = Yup.object().shape({
        email: Yup.string().email('Please enter a valid email address').required('Email is required'),
    });

    const formik = useFormik({
        initialValues: {
            email: '',
        },
        validationSchema: ForgotPasswordSchema,
        onSubmit: async (values) => {
            try {
                await forgotPassword(values.email);
                setSubmitted(true);
            } catch (err) {
                // Always show success to prevent email enumeration
                setSubmitted(true);
            }
        },
    });

    const { errors, touched, isSubmitting, handleSubmit, getFieldProps } = formik;

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Logo />
                </Box>

                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 3 }}>
                    {!submitted ? (
                        <>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <EmailOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h4" gutterBottom fontWeight="bold">
                                    Forgot Password?
                                </Typography>
                                <Typography color="text.secondary">
                                    No worries! Enter your email and we'll send you a reset link.
                                </Typography>
                            </Box>

                            {showAlert && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {alertMessage}
                                </Alert>
                            )}

                            <FormikProvider value={formik}>
                                <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
                                    <Stack spacing={3}>
                                        <TextField
                                            fullWidth
                                            autoComplete="email"
                                            type="email"
                                            label="Email address"
                                            {...getFieldProps('email')}
                                            error={Boolean(touched.email && errors.email)}
                                            helperText={touched.email && errors.email}
                                        />

                                        <LoadingButton
                                            fullWidth
                                            size="large"
                                            type="submit"
                                            variant="contained"
                                            loading={isSubmitting}
                                            sx={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)'
                                                }
                                            }}
                                        >
                                            Send Reset Link
                                        </LoadingButton>
                                    </Stack>
                                </Form>
                            </FormikProvider>

                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Link
                                    component={RouterLink}
                                    to="/"
                                    variant="subtitle2"
                                    underline="hover"
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                                >
                                    <ArrowBackIcon fontSize="small" />
                                    Back to Login
                                </Link>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
                                Check Your Email
                            </Typography>
                            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                                If an account exists with this email, we've sent a password reset link. Please check your inbox.
                            </Alert>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Didn't receive the email? Check your spam folder or try again in a few minutes.
                            </Typography>
                            <Button
                                component={RouterLink}
                                to="/"
                                variant="contained"
                                size="large"
                                fullWidth
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)'
                                    }
                                }}
                            >
                                Back to Login
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}
