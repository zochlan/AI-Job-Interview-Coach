import React, { useMemo, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './context/AuthContext';
import { useThemeContext } from './contexts/ThemeContext';
import { CVProvider } from './contexts/CVContext';
import { Redirect, Route, RouteProps } from 'react-router-dom';
// Note: We're still using react-router-dom v5 with React 18
// This is compatible but we should consider upgrading to react-router-dom v6 in the future
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import RateLimitNotification from './components/RateLimitNotification';
import { CircularProgress, Box } from '@mui/material';
import { initSyncQueue } from './utils/indexedDB';
import { initErrorLogging } from './utils/errorLogging';

// Import global animations
import './styles/animations.css';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewSession from './pages/InterviewSession';
import ChatBot from './pages/ChatBot';
import CVAnalysis from './pages/CVAnalysis';
import SessionSummary from './pages/SessionSummary';

// Context imports
// Remove AuthProvider here (should only be in index.tsx)

// Using GlobalErrorBoundary component for error handling

// PrivateRoute ensures protected routes check backend authentication only when needed
function PrivateRoute({ component: Component, ...rest }: RouteProps & { component: any }) {
  const { isAuthenticated } = useAuth();
  // Removed the checkAuth call on every route change to prevent excessive API calls
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

function App() {
  // Use the authentication context
  const { isAuthenticated, checkAuth } = useAuth();
  // Use the ThemeContext
  const { mode } = useThemeContext();

  // On app mount, check authentication only once and clear storage if not authenticated
  useEffect(() => {
    // We only check auth once when the app loads, not on every isAuthenticated change
    // This prevents excessive API calls
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth !== 'true') {
      checkAuth();
    }

    if (!isAuthenticated) {
      localStorage.removeItem('user');
      localStorage.setItem('isAuthenticated', 'false');
      // Don't clear everything in localStorage as it might contain other app settings
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#6a9fff' : '#2979ff', // More vibrant blue that works in both modes
            contrastText: '#fff',
            dark: mode === 'dark' ? '#5183e0' : '#1c54b2',
            light: mode === 'dark' ? '#8bb5ff' : '#5393ff',
          },
          secondary: {
            main: mode === 'dark' ? '#ff5a8c' : '#ff4081', // Brighter pink for better visibility
            contrastText: '#fff',
            dark: mode === 'dark' ? '#e0436d' : '#c51162',
            light: mode === 'dark' ? '#ff8eb3' : '#ff80ab',
          },
          background: {
            default: mode === 'dark' ? '#1a1a2e' : '#e8f5ff',
            paper: mode === 'dark' ? '#252536' : '#fff',
          },
          text: {
            primary: mode === 'dark' ? '#f5f5f5' : '#1a237e',
            secondary: mode === 'dark' ? '#b0bec5' : '#546e7a',
          },
          success: {
            main: mode === 'dark' ? '#4caf50' : '#43e97b',
            dark: mode === 'dark' ? '#388e3c' : '#2e7d32',
            light: mode === 'dark' ? '#81c784' : '#66bb6a',
          },
          warning: {
            main: mode === 'dark' ? '#ff9800' : '#fbc02d',
            dark: mode === 'dark' ? '#f57c00' : '#f9a825',
            light: mode === 'dark' ? '#ffb74d' : '#ffca28',
          },
          error: {
            main: mode === 'dark' ? '#f44336' : '#ff5252',
            dark: mode === 'dark' ? '#d32f2f' : '#c62828',
            light: mode === 'dark' ? '#e57373' : '#ef5350',
          },
          info: {
            main: mode === 'dark' ? '#2196f3' : '#29b6f6',
            dark: mode === 'dark' ? '#1976d2' : '#0288d1',
            light: mode === 'dark' ? '#64b5f6' : '#4fc3f7',
          },
          divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        },
        typography: {
          fontFamily: `'Poppins', 'Montserrat', 'Inter', 'Roboto', 'Arial', sans-serif`,
          h1: { fontWeight: 800 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0.5 },
        },
        shape: {
          borderRadius: 4, // Reduced border radius for more box-like appearance with slight curves
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                transition: 'background-color 0.3s ease, color 0.3s ease',
                scrollbarWidth: 'thin',
                scrollbarColor: mode === 'dark' ? '#6a9fff #2d2d44' : '#2979ff #f0f7ff',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === 'dark' ? '#2d2d44' : '#f0f7ff',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === 'dark' ? '#6a9fff' : '#2979ff',
                  borderRadius: '4px',
                  border: '2px solid',
                  borderColor: mode === 'dark' ? '#2d2d44' : '#f0f7ff',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: mode === 'dark' ? '#8bb5ff' : '#5393ff',
                },
                '& ::selection': {
                  background: mode === 'dark' ? 'rgba(106, 159, 255, 0.3)' : 'rgba(41, 121, 255, 0.2)',
                },
              },
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 }
              },
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              },
              '@keyframes fadeInLeft': {
                '0%': { opacity: 0, transform: 'translateX(-20px)' },
                '100%': { opacity: 1, transform: 'translateX(0)' }
              },
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' }
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 4, // Reduced border radius for more box-like appearance with slight curves
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)'
                  : '0 4px 12px rgba(41,121,255,0.08), 0 1px 4px rgba(41,121,255,0.05)',
                background: mode === 'dark' ? '#252536' : '#fff',
                transition: 'all 0.3s ease',
                border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.1)' : 'rgba(41,121,255,0.05)'}`,
                '&:hover': {
                  boxShadow: mode === 'dark'
                    ? '0 6px 16px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)'
                    : '0 6px 16px rgba(41,121,255,0.12), 0 2px 6px rgba(41,121,255,0.08)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 4, // Reduced border radius for more box-like appearance with slight curves
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)'
                  : '0 4px 12px rgba(41,121,255,0.08), 0 1px 4px rgba(41,121,255,0.05)',
                transition: 'all 0.3s ease',
                border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.1)' : 'rgba(41,121,255,0.05)'}`,
                '&:hover': {
                  boxShadow: mode === 'dark'
                    ? '0 6px 16px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)'
                    : '0 6px 16px rgba(41,121,255,0.12), 0 2px 6px rgba(41,121,255,0.08)',
                  transform: 'translateY(-4px)',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 4, // Reduced border radius for more box-like appearance with slight curves
                fontWeight: 700,
                letterSpacing: 0.5,
                padding: '8px 20px',
                transition: 'all 0.3s ease',
                textTransform: 'none',
                fontSize: '0.95rem',
              },
              contained: {
                boxShadow: mode === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(41,121,255,0.15)',
                '&:hover': {
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(0,0,0,0.4)'
                    : '0 4px 12px rgba(41,121,255,0.25)',
                  transform: 'translateY(-2px)',
                },
              },
              containedPrimary: {
                background: mode === 'dark'
                  ? 'linear-gradient(45deg, #6a9fff 0%, #5183e0 100%)'
                  : 'linear-gradient(45deg, #2979ff 0%, #1c54b2 100%)',
                '&:hover': {
                  background: mode === 'dark'
                    ? 'linear-gradient(45deg, #8bb5ff 0%, #6a9fff 100%)'
                    : 'linear-gradient(45deg, #5393ff 0%, #2979ff 100%)',
                },
              },
              outlined: {
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(0,0,0,0.2)'
                    : '0 4px 12px rgba(41,121,255,0.1)',
                },
              },
              text: {
                '&:hover': {
                  backgroundColor: mode === 'dark'
                    ? 'rgba(106,159,255,0.1)'
                    : 'rgba(41,121,255,0.1)',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #252536 0%, #1a1a2e 100%)'
                  : 'linear-gradient(90deg, #2979ff 0%, #1c54b2 100%)',
                boxShadow: mode === 'dark'
                  ? '0 2px 12px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)'
                  : '0 2px 12px rgba(41,121,255,0.15), 0 1px 4px rgba(41,121,255,0.1)',
                transition: 'all 0.3s ease',
                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.2)' : 'rgba(41,121,255,0.2)'}`,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                marginBottom: '16px',
                '& .MuiInputLabel-root': {
                  color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s ease',
                  borderRadius: 4,
                  '& fieldset': {
                    borderColor: mode === 'dark' ? 'rgba(106,159,255,0.3)' : 'rgba(41,121,255,0.3)',
                    borderWidth: '1px',
                    transition: 'all 0.3s ease',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'dark' ? 'rgba(106,159,255,0.5)' : 'rgba(41,121,255,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: mode === 'dark' ? '#6a9fff' : '#2979ff',
                    borderWidth: '2px',
                  },
                  '&.Mui-error fieldset': {
                    borderColor: mode === 'dark' ? '#ff5a8c' : '#ff4081',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '12px 14px',
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: 0,
                  fontSize: '0.75rem',
                },
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                transition: 'all 0.3s ease',
                fontSize: '0.95rem',
                '&.Mui-focused': {
                  boxShadow: mode === 'dark'
                    ? '0 0 0 2px rgba(106,159,255,0.2)'
                    : '0 0 0 2px rgba(41,121,255,0.2)',
                },
              },
            },
          },
          MuiListItem: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.08)' : 'rgba(41,121,255,0.08)',
                },
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.08)' : 'rgba(41,121,255,0.08)',
                },
                '&.Mui-selected': {
                  backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.15)' : 'rgba(41,121,255,0.15)',
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.25)' : 'rgba(41,121,255,0.25)',
                  },
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: mode === 'dark'
                    ? '0 2px 6px rgba(0,0,0,0.3)'
                    : '0 2px 6px rgba(41,121,255,0.2)',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  // Initialize services
  useEffect(() => {
    // Initialize offline sync queue
    initSyncQueue();

    // Initialize error logging
    initErrorLogging();

    // Log app initialization
    console.info('App initialized successfully');
  }, []);

  return (
    <GlobalErrorBoundary>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {/* Custom font import for Poppins/Montserrat/Inter */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap');
            body {
              background-color: ${mode === 'dark' ? '#1a1a2e' : '#e8f5ff'};
              color: ${mode === 'dark' ? '#f5f5f5' : '#1a237e'};
              min-height: 100vh;
              transition: background-color 0.3s ease, color 0.3s ease;
            }

            /* Add theme-specific styles */
            body.light-mode {
              background-color: #e8f5ff;
              color: #1a237e;
            }

            body.dark-mode {
              background-color: #1a1a2e;
              color: #f5f5f5;
            }
          `}
        </style>
        {/* AuthProvider now only in index.tsx */}
        <CVProvider>
          <Router>
            <Navbar />
            {/* Main content wrapper with padding for fixed navbar */}
            <Box sx={{ pt: '64px' }}> {/* 64px is the default height of MUI AppBar */}
              <Suspense fallback={
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 'calc(100vh - 64px)' /* Adjust for navbar */
                }}>
                  <CircularProgress size={60} />
                </Box>
              }>
                <Switch>
                  <Route path="/login" component={Login} />
                  <Route path="/register" component={Register} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/interview/:sessionId" component={InterviewSession} />
                  <Route path="/chatbot" component={ChatBot} />
                  <Route path="/cv-analysis" component={CVAnalysis} />
                  <Route path="/session/:sessionId" render={(props) =>
                    <SessionSummary {...props} mode={mode} />
                  } />
                  <Route path="/sessions" render={(props) =>
                    <SessionSummary {...props} mode={mode} />
                  } />
                  <PrivateRoute path="/user" component={require('./pages/UserPage').default} />
                  <Route exact path="/" component={Home} />
                  <Route path="*" component={require('./pages/NotFound').default} />
                </Switch>
              </Suspense>
            </Box>

            {/* Offline indicator */}
            <OfflineIndicator />

            {/* Rate limit notification */}
            <RateLimitNotification />
          </Router>
        </CVProvider>
      </MuiThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
