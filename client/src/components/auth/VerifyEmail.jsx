import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert, Button, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { verifyEmail } from '../../api';
import Logo from '../Logo';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const { data } = await verifyEmail(token);
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };

        if (token) {
            verify();
        } else {
            setStatus('error');
            setMessage('Invalid verification link.');
        }
    }, [token]);

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Logo />
                </Box>

                <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center', borderRadius: 3 }}>
                    {status === 'loading' && (
                        <>
                            <CircularProgress size={60} sx={{ mb: 3 }} />
                            <Typography variant="h5" gutterBottom>
                                Verifying your email...
                            </Typography>
                            <Typography color="text.secondary">
                                Please wait while we verify your email address.
                            </Typography>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
                                Email Verified!
                            </Typography>
                            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                                {message}
                            </Alert>
                            <Button
                                component={RouterLink}
                                to="/"
                                variant="contained"
                                size="large"
                                fullWidth
                                sx={{
                                    mt: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)'
                                    }
                                }}
                            >
                                Continue to Login
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                            <Typography variant="h4" gutterBottom fontWeight="bold" color="error.main">
                                Verification Failed
                            </Typography>
                            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                                {message}
                            </Alert>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                The verification link may have expired or is invalid. You can request a new verification email from the login page.
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
                        </>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}
