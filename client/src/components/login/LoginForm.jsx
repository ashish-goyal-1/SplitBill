import * as Yup from 'yup';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik, Form, FormikProvider } from 'formik';
// material
import { Stack, TextField, IconButton, InputAdornment, Snackbar, Alert, Link, Button, Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// component
import Iconify from '../Iconify';
import { login, resendVerificationEmail } from '../../services/auth';

import useResponsive from '../../theme/hooks/useResponsive';

// ----------------------------------------------------------------------

export default function LoginForm() {
  const smUp = useResponsive('up', 'sm');

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(" ");
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const LoginSchema = Yup.object().shape({
    emailId: Yup.string().email('Email must be a valid email address').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const formik = useFormik({
    initialValues: {
      emailId: '',
      password: '',
      remember: true,
    },
    validationSchema: LoginSchema,
    onSubmit: async () => {
      //User Login Service call - Upon success user is redirected to dashboard 
      //Login fail snackbar displays error
      const result = await login(values, setShowAlert, setAlertMessage);
      if (result?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(result.email);
      } else {
        setUnverifiedEmail(null);
      }
    },
  });

  const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps } = formik;

  const handleShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    setResendSuccess(false);
    const result = await resendVerificationEmail(unverifiedEmail, setShowAlert, setAlertMessage);
    setResendLoading(false);
    if (result?.status === 'Success') {
      setResendSuccess(true);
      setAlertMessage('Verification email sent! Please check your inbox.');
    }
  };

  return (
    <><Snackbar
      open={showAlert && !unverifiedEmail}
      autoHideDuration={6000}
    >
      <Alert severity="error" sx={{ width: '100%' }}>
        {alertMessage}
      </Alert>
    </Snackbar>
      <FormikProvider value={formik}>
        <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {smUp && showAlert && !unverifiedEmail && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {alertMessage}
              </Alert>
            )}

            {unverifiedEmail && (
              <Alert
                severity={resendSuccess ? "success" : "warning"}
                sx={{ width: '100%' }}
                action={
                  !resendSuccess && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Sending...' : 'Resend'}
                    </Button>
                  )
                }
              >
                {resendSuccess ? alertMessage : 'Please verify your email before logging in.'}
              </Alert>
            )}

            <TextField
              name="emailId"
              fullWidth
              autoComplete="username"
              type="email"
              label="Email address"
              {...getFieldProps('emailId')}
              error={Boolean(touched.emailId && errors.emailId)}
              helperText={touched.emailId && errors.emailId} />

            <TextField
              name="password"
              fullWidth
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              {...getFieldProps('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleShowPassword} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              error={Boolean(touched.password && errors.password)}
              helperText={touched.password && errors.password} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
              <Link component={RouterLink} variant="subtitle2" to="/forgot-password" underline="hover">
                Forgot password?
              </Link>
            </Box>

            <LoadingButton fullWidth size="large" type="submit" variant="contained" loading={isSubmitting}>
              Login
            </LoadingButton>

            {/* Demo Account Quick Access for Recruiters */}
            <Box sx={{
              mt: 2,
              p: 1.5,
              border: '1px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              backgroundColor: 'action.hover'
            }}>
              <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Box component="span" sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'primary.main',
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  🚀 Quick Demo Access
                </Box>
                <Box sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>
                  Click to auto-fill and login instantly
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  disabled={isSubmitting}
                  onClick={async () => {
                    // Visual feedback: fill fields first
                    await formik.setFieldValue('emailId', 'john@gmail.com');
                    await formik.setFieldValue('password', 'John@123');
                    // Small delay for visual effect, then submit
                    setTimeout(() => formik.handleSubmit(), 300);
                  }}
                  sx={{ fontSize: '0.75rem' }}
                >
                  👤 Demo User 1
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  disabled={isSubmitting}
                  onClick={async () => {
                    await formik.setFieldValue('emailId', 'jane@gmail.com');
                    await formik.setFieldValue('password', 'Jane@123');
                    setTimeout(() => formik.handleSubmit(), 300);
                  }}
                  sx={{ fontSize: '0.75rem' }}
                >
                  👤 Demo User 2
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Form>
      </FormikProvider></>
  );
}
