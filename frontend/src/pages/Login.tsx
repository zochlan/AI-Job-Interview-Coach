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

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      history.push('/user');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
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
            Sign In
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
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUsername(e.target.value); setError(''); }}
              variant="outlined"
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
                    borderColor: (theme) => theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => theme.palette.primary.main,
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
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setError(''); }}
              variant="outlined"
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
                    borderColor: (theme) => theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowPassword((prev) => !prev)}
                    size="small"
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, fontWeight: 700, bgcolor: (theme) => theme.palette.primary.main, color: (theme) => theme.palette.primary.contrastText, '&:hover': { bgcolor: (theme) => theme.palette.primary.dark } }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ fontWeight: 700, color: (theme) => theme.palette.primary.main, borderColor: (theme) => theme.palette.primary.main, mb: 1 }}
              onClick={() => history.push('/register')}
            >
              Don't have an account? Sign Up
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
    </>
  );
};

export default Login;
