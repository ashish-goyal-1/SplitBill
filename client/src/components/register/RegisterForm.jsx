import * as Yup from 'yup';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik, Form, FormikProvider } from 'formik';
// material
import { Stack, TextField, IconButton, InputAdornment, Snackbar, Alert, Paper, Typography, Button, Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// component
import Iconify from '../Iconify';
import { register } from '../../services/auth';

import useResponsive from '../../theme/hooks/useResponsive';

// ----------------------------------------------------------------------

export default function RegisterForm() {
  const smUp = useResponsive('up', 'sm');

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(" ");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const RegisterSchema = Yup.object().shape({
    emailId: Yup.string().email('Email must be a valid email address').required('Email is required'),
    password: Yup.string().required('Password is required')
      .min(8, 'Password should be 8 characters minimum'),
    firstName: Yup.string().required('First Name is required')
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      emailId: '',
      password: '',
      remember: true,
    },
    validationSchema: RegisterSchema,
    onSubmit: async () => {
      //User Register Service call - Upon success show verification message
      const result = await register(values, setShowAlert, setAlertMessage);
      if (result?.requiresVerification || result?.status === 'Success') {
        setRegistrationSuccess(true);
        setRegisteredEmail(values.emailId);
      }
    },
  });

  const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps } = formik;

  const handleShowPassword = () => {
    setShowPassword((show) => !show);
  };

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
          Registration Successful!
        </Typography>
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          We've sent a verification email to <strong>{registeredEmail}</strong>. Please check your inbox and click the verification link to activate your account.
        </Alert>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Didn't receive the email? Check your spam folder or wait a few minutes and try again.
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
          Continue to Login
        </Button>
      </Paper>
    );
  }

  return (
    <>
      {!smUp &&
        <Snackbar
          open={showAlert}
          autoHideDuration={6000}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>
      }
      <FormikProvider value={formik}>
        <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {smUp && showAlert && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {alertMessage}
              </Alert>
            )}
            <Stack spacing={3} direction="row"
              alignItems="center" justifyContent="space-between"
            >
              <TextField
                name="firstName"
                fullWidth
                type="text"
                label="First Name"
                {...getFieldProps('firstName')}
                error={Boolean(touched.firstName && errors.firstName)}
                helperText={touched.firstName && errors.firstName} />

              <TextField
                name="lastName"
                fullWidth
                type="text"
                label="Last Name"
                {...getFieldProps('lastName')}
                error={Boolean(touched.lastName && errors.lastName)}
                helperText={touched.lastName && errors.lastName} />
            </Stack>

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
                    <IconButton onClick={handleShowPassword} edge="end">
                      <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              error={Boolean(touched.password && errors.password)}
              helperText={touched.password && errors.password} />

            <LoadingButton fullWidth size="large" type="submit" variant="contained" loading={isSubmitting}>
              Register
            </LoadingButton>
          </Stack>
        </Form>
      </FormikProvider></>
  );
}
