import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useHistory();
  const { register } = useAuth();

  // Validation functions
  const validateUsername = (username: string): string => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error message when user starts typing
    setError('');

    // Validate field on change
    let fieldError = '';
    switch (name) {
      case 'username':
        fieldError = validateUsername(value);
        break;
      case 'email':
        fieldError = validateEmail(value);
        break;
      case 'password':
        fieldError = validatePassword(value);
        // Also validate confirm password if it's already filled
        if (formData.confirmPassword) {
          setValidationErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
          }));
        }
        break;
      case 'confirmPassword':
        fieldError = validateConfirmPassword(value, formData.password);
        break;
      default:
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    // Update validation errors
    setValidationErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });

    // Check if there are any validation errors
    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setError('Please fix the validation errors before submitting');
      setIsSubmitting(false);
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      history.push('/user');
    } catch (err: any) {
      console.error('Registration error:', err);

      // Handle specific error messages from the server
      if (err.message && err.message.includes('already exists')) {
        if (err.message.includes('username')) {
          setValidationErrors(prev => ({
            ...prev,
            username: 'This username is already taken'
          }));
        } else if (err.message.includes('email')) {
          setValidationErrors(prev => ({
            ...prev,
            email: 'This email is already registered'
          }));
        } else {
          setError(err.message || 'Registration failed');
        }
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Box sx={{
        position: 'fixed',
        zIndex: -1,
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        background: 'radial-gradient(circle at center, #e3f2fd 0%, #4f8cff 60%, #1a237e 100%)',
      }} />
      <Container component="main" maxWidth="xs" sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 8 },
      }}>
        <Box sx={{
          maxWidth: 420,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '3px solid',
        borderColor: theme => theme.palette.primary.light,
        borderRadius: 8,
        boxShadow: '0 0 40px 0 rgba(79,140,255,0.10)',
        p: { xs: 1.5, md: 2.5 },
        background: 'rgba(255,255,255,0.10)',
      }}>
        <Paper elevation={6} sx={(theme) => ({
          p: { xs: 3, md: 5 },
          width: '100%',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,36,0.96)' : 'rgba(255,255,255,0.85)',
          color: theme.palette.text.primary,
          borderRadius: 6,
          boxShadow: theme.palette.mode === 'dark' ? '0 8px 40px 0 rgba(30,40,90,0.35)' : '0 8px 40px 0 rgba(79,140,255,0.17)',
          backdropFilter: 'blur(16px)',
          border: theme.palette.mode === 'dark' ? '1.5px solid rgba(79,140,255,0.13)' : '1.5px solid rgba(79,140,255,0.13)',
        })}>
          <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 800, letterSpacing: 0.5, color: theme => theme.palette.primary.main }}>
            Create Account
          </Typography>
          {error && (
            <Alert severity="error" style={{ marginBottom: 16 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} style={{ marginTop: 8 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.username}
              helperText={validationErrors.username}
              sx={{
                input: {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#222b36' : '#fff',
                  color: (theme) => theme.palette.text.primary,
                  borderRadius: 2,
                  padding: 1.5,
                  boxShadow: (theme) => theme.shadows[1],
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: (theme) => validationErrors.username
                      ? theme.palette.error.main
                      : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => validationErrors.username
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => validationErrors.username
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              sx={{
                input: {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#222b36' : '#fff',
                  color: (theme) => theme.palette.text.primary,
                  borderRadius: 2,
                  padding: 1.5,
                  boxShadow: (theme) => theme.shadows[1],
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: (theme) => validationErrors.email
                      ? theme.palette.error.main
                      : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => validationErrors.email
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => validationErrors.email
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              sx={{
                input: {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#222b36' : '#fff',
                  color: (theme) => theme.palette.text.primary,
                  borderRadius: 2,
                  padding: 1.5,
                  boxShadow: (theme) => theme.shadows[1],
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: (theme) => validationErrors.password
                      ? theme.palette.error.main
                      : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => validationErrors.password
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => validationErrors.password
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button onClick={() => setShowPassword((prev) => !prev)} size="small"
                    sx={{
                      minWidth: 0,
                      color: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 1,
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                )
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              sx={{
                input: {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#222b36' : '#fff',
                  color: (theme) => theme.palette.text.primary,
                  borderRadius: 2,
                  padding: 1.5,
                  boxShadow: (theme) => theme.shadows[1],
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: (theme) => validationErrors.confirmPassword
                      ? theme.palette.error.main
                      : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => validationErrors.confirmPassword
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => validationErrors.confirmPassword
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button onClick={() => setShowConfirmPassword((prev) => !prev)} size="small"
                    sx={{
                      minWidth: 0,
                      color: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 1,
                    }}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Button>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              style={{ marginTop: 24, marginBottom: 16 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => history.push('/login')}
            >
              Already have an account? Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
    </>
  );
};

export default Register;
