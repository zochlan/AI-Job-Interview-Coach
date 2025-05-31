import React, { useEffect } from 'react';
import { useHistory, Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { isAuthenticated, logout } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const history = useHistory(); // Kept for potential future use
  const { mode, toggleColorMode } = useThemeContext();

  // Add debug log to verify the theme mode in Navbar
  useEffect(() => {
    console.log('Navbar component - current theme mode:', mode);
  }, [mode]);



  const handleClose = () => {
    setAnchorEl(null);
  };

  // Fix: Add robust error handling to logout
  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      // Use window.location to ensure a full page reload after logout
      window.location.href = '/login';
    } catch (err: any) {
      // Optionally, display an error notification (e.g., Snackbar)
      alert(err.message || 'Logout failed. Please try again.');
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        boxShadow: 3,
        height: '64px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Toolbar sx={{
        width: '100%',
        maxWidth: '1400px',
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        height: '100%',
      }}>
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          '&:hover': {
            transform: 'scale(1.02)',
            transition: 'transform 0.3s ease',
          }
        }}>
          {/* Using isLink={true} to make the Logo itself a link, not wrapping it in another link */}
          <Logo size="medium" showText={true} isLink={true} />
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Navigation Links */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 1,
            mr: 2,
            '& a': {
              textDecoration: 'none',
            }
          }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/cv-analysis"
              sx={{
                fontWeight: 600,
                borderRadius: 1,
                px: 2,
                py: 1,
                transition: 'all 0.3s ease',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  width: '0%',
                  height: '2px',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  transform: 'translateX(-50%)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&::after': {
                    width: '60%',
                  }
                }
              }}
            >
              CV Analysis
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/sessions"
              sx={{
                fontWeight: 600,
                borderRadius: 1,
                px: 2,
                py: 1,
                transition: 'all 0.3s ease',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  width: '0%',
                  height: '2px',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  transform: 'translateX(-50%)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&::after': {
                    width: '60%',
                  }
                }
              }}
            >
              Sessions
            </Button>
          </Box>

          {/* Light/Dark mode toggle */}
          <Button
            onClick={() => {
              console.log('Theme toggle button clicked, current mode:', mode);
              toggleColorMode();
              // Log after toggle to verify the state change
              setTimeout(() => {
                console.log('After toggle, mode should be:', mode === 'dark' ? 'light' : 'dark');
                console.log('Body data-theme-mode attribute:', document.body.getAttribute('data-theme-mode'));
                console.log('Body background color:', document.body.style.backgroundColor);
              }, 100);
            }}
            color="inherit"
            sx={{
              mr: 1,
              borderRadius: '50%',
              minWidth: '40px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              border: '2px solid',
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                transform: 'scale(1.05)',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              }
            }}
            aria-label="Toggle dark/light mode"
          >
            {mode === 'dark' ? (
              <span style={{ fontSize: '1.2rem' }}>🌙</span>
            ) : (
              <span style={{ fontSize: '1.2rem' }}>☀️</span>
            )}
          </Button>

          {/* Debug button - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={() => {
                console.log('Debug button clicked');
                console.log('Current theme mode:', mode);
                console.log('localStorage theme mode:', localStorage.getItem('themeMode'));

                // Force update the body styles
                const currentMode = mode;
                document.body.style.backgroundColor = currentMode === 'dark' ? '#1a1a2e' : '#e8f5ff';
                document.body.style.color = currentMode === 'dark' ? '#f5f5f5' : '#1a237e';
                document.body.setAttribute('data-theme-mode', currentMode);

                // Check server health and time
                Promise.all([
                  fetch('/api/health'),
                  fetch('/api/time')
                ])
                  .then(responses => {
                    // Check if all responses are ok
                    if (!responses.every(response => response.ok)) {
                      const failedResponse = responses.find(response => !response.ok);
                      throw new Error(`API check failed: ${failedResponse?.status}`);
                    }
                    // Parse all responses as JSON
                    return Promise.all(responses.map(response => response.json()));
                  })
                  .then(([healthData, timeData]) => {
                    console.log('Server health check:', healthData);
                    console.log('Server time:', timeData);

                    // Display server status in a more user-friendly way
                    const serverInfo = `
Server Status: ${healthData.status}
Server Time: ${new Date(timeData.timestamp).toLocaleString()}
Theme Mode: ${mode}
                    `;
                    alert(serverInfo);
                  })
                  .catch(error => {
                    console.error('Server check failed:', error);
                    alert(`Server check failed: ${error.message}\nCheck the browser console for more details.`);
                  });
              }}
              variant="contained"
              color="warning"
              size="small"
              sx={{
                mr: 1,
                fontSize: '0.7rem',
                padding: '2px 8px',
                minWidth: 'auto',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? '#ff9800' : '#e65100',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }
              }}
            >
              Debug
            </Button>
          )}

          {/* User Page icon */}
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/user"
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <AccountCircle />
          </IconButton>

          {isAuthenticated ? (
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }
              }}
            >
              <MenuItem onClick={handleLogout} sx={{
                minWidth: 150,
                borderRadius: 1,
                mx: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                }
              }}>
                Logout
              </MenuItem>
            </Menu>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.8)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/register"
                variant="contained"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
