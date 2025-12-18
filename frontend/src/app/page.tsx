'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { fetchClient } from '@/lib/fetchClient';
import { validateUserForm } from '@/lib/validation';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'success' | 'error',
  });

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (localStorage.getItem('sessionId')) {
      router.push('/dashboard');
    }
  }, [router]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    }));
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMessage = (
    message: string,
    severity: 'success' | 'error' = 'error'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      if (!formData.username || !formData.password) {
        showMessage('Username and Password are required');
        return;
      }
    } else {
      const validation = validateUserForm(
        {
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        true
      );

      if (!validation.isValid) {
        showMessage(validation.error || 'Validation failed');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';

      const payload: any = {
        username: formData.username,
        password: formData.password,
      };

      if (!isLogin) {
        payload.firstName = formData.firstName;
        payload.lastName = formData.lastName;
      }

      const response = await fetchClient(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('sessionId', response.sessionId);
      localStorage.setItem('user', JSON.stringify(response.user));
      router.push('/dashboard');
    } catch (err: any) {
      showMessage(err.message, 'error');
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Container component="main" maxWidth="xs">
        <ThemeProvider theme={lightTheme}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography
                component="h1"
                variant="h5"
                align="center"
                gutterBottom
                sx={{ fontWeight: 'bold', color: '#333' }}
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ width: '100%' }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  autoFocus
                  disabled={isLoading}
                  value={formData.username}
                  onChange={handleChange}
                  inputProps={{ 'aria-label': 'username' }}
                />

                {!isLogin && (
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="First Name"
                      name="firstName"
                      disabled={isLoading}
                      value={formData.firstName}
                      onChange={handleChange}
                      inputProps={{ 'aria-label': 'first name' }}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      disabled={isLoading}
                      value={formData.lastName}
                      onChange={handleChange}
                      inputProps={{ 'aria-label': 'last name' }}
                    />
                  </>
                )}

                {/* Main Password Field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleChange}
                  inputProps={{ 'aria-label': 'password' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Confirm Password Field */}
                {!isLogin && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    disabled={isLoading}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'confirm password' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
                >
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>

                <Box textAlign="center">
                  <Link
                    component="button"
                    variant="body2"
                    onClick={toggleMode}
                    type="button"
                    disabled={isLoading}
                    sx={{ fontWeight: 500 }}
                  >
                    {isLogin
                      ? "Don't have an account? Sign Up"
                      : 'Already have an account? Sign In'}
                  </Link>
                </Box>
              </Box>
            </Box>
          </Paper>
        </ThemeProvider>
      </Container>
    </Box>
  );
}
