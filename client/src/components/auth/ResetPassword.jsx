import { useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik, Form, FormikProvider } from 'formik';
import { Container, Typography, Box, TextField, Alert, Button, Paper, Stack, IconButton, InputAdornment } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Iconify from '../Iconify';
import Logo from '../Logo';
import { resetPassword } from '../../api';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const ResetPasswordSchema = Yup.object().shape({
        password: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .matches(/[a-z]/, 'Password must contain a lowercase letter')
            .matches(/[A-Z]/, 'Password must contain an uppercase letter')
            .matches(/[0-9]/, 'Password must contain a number')
            .matches(/[^a-zA-Z0-9]/, 'Password must contain a special character')
            .required('Password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Please confirm your password'),
    });

    const formik = useFormik({
        initialValues: {
            password: '',
            confirmPassword: '',
        },
        validationSchema: ResetPasswordSchema,
        onSubmit: async (values) => {
            try {
                await resetPassword(token, values.password);
                setSubmitted(true);
            } catch (err) {
                setShowAlert(true);
                setAlertMessage(err.response?.data?.message || 'Failed to reset password. Please try again.');
            }
        },
    });

    const { errors, touched, isSubmitting, handleSubmit, getFieldProps } = formik;

    if (!token) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                    <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center', borderRadius: 3 }}>
                        <Alert severity="error" sx={{ mb: 3 }}>
                            Invalid reset link. Please request a new password reset.
                        </Alert>
                        <Button
                            component={RouterLink}
                            to="/forgot-password"
                            variant="contained"
                            size="large"
                        >
                            Request New Reset Link
                        </Button>
                    </Paper>
                </Box>
            </Container>
        );
    }

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
                                <LockResetIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h4" gutterBottom fontWeight="bold">
                                    Reset Password
                                </Typography>
                                <Typography color="text.secondary">
                                    Enter your new password below.
                                </Typography>
                            </Box>

                            {showAlert && (
                                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setShowAlert(false)}>
                                    {alertMessage}
                                </Alert>
                            )}

                            <FormikProvider value={formik}>
                                <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
                                    <Stack spacing={3}>
                                        <TextField
                                            fullWidth
                                            autoComplete="new-password"
                                            type={showPassword ? 'text' : 'password'}
                                            label="New Password"
                                            {...getFieldProps('password')}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                            <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            error={Boolean(touched.password && errors.password)}
                                            helperText={touched.password && errors.password}
                                        />

                                        <TextField
                                            fullWidth
                                            autoComplete="new-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            label="Confirm Password"
                                            {...getFieldProps('confirmPassword')}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                                            <Iconify icon={showConfirmPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                                            helperText={touched.confirmPassword && errors.confirmPassword}
                                        />

                                        <Typography variant="caption" color="text.secondary">
                                            Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.
                                        </Typography>

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
                                            Reset Password
                                        </LoadingButton>
                                    </Stack>
                                </Form>
                            </FormikProvider>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
                                Password Reset!
                            </Typography>
                            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                                Your password has been reset successfully. You can now log in with your new password.
                            </Alert>
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
                                Continue to Login
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}
