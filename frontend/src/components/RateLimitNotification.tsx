import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Button, Typography, Box, Link } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme } from '@mui/material/styles';

/**
 * Component that displays a notification when API rate limits are hit
 */
const RateLimitNotification: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    // Listen for rate limit events
    const handleRateLimit = (event: Event) => {
      const customEvent = event as CustomEvent;
      setEndpoint(customEvent.detail?.endpoint || 'API');
      setOpen(true);
    };

    // Add event listener
    window.addEventListener('api:rate-limited', handleRateLimit);

    // Clean up
    return () => {
      window.removeEventListener('api:rate-limited', handleRateLimit);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Reset show details when closing
    setShowDetails(false);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const getFriendlyEndpointName = (endpoint: string): string => {
    if (endpoint.includes('/groq/question')) {
      return 'interview question generation';
    } else if (endpoint.includes('/groq/analyze')) {
      return 'response analysis';
    } else if (endpoint.includes('/groq/')) {
      return 'AI services';
    }
    return 'some services';
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={15000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{
        top: { xs: 16, sm: 24 },
        width: { xs: '95%', sm: '600px', md: '700px' },
        zIndex: 9999
      }}
    >
      <Alert
        severity="warning"
        icon={<WarningIcon />}
        onClose={handleClose}
        sx={{
          width: '100%',
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: isDarkMode ? 'rgba(50, 50, 70, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 180, 0, 0.5)' : 'rgba(255, 180, 0, 0.7)'}`,
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
            color: 'warning.main'
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Rate Limit Reached</AlertTitle>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            You've reached the hourly limit for {getFriendlyEndpointName(endpoint)}.
            The application will continue to function using local fallbacks.
          </Typography>

          {showDetails && (
            <Box sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1
            }}>
              <InfoIcon color="info" sx={{ mt: 0.3 }} />
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  The Poe API has a limit of 50 requests per hour. Your interview will continue using locally generated questions.
                </Typography>
                <Typography variant="body2">
                  The rate limit will reset automatically after one hour, or you can try again later.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Link
            component="button"
            variant="body2"
            onClick={toggleDetails}
            sx={{
              color: 'info.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Link>

          <Button
            color="warning"
            variant="outlined"
            size="small"
            sx={{
              ml: 2,
              fontWeight: 'medium',
              borderColor: isDarkMode ? 'rgba(255, 180, 0, 0.5)' : 'rgba(255, 180, 0, 0.7)',
              color: isDarkMode ? 'warning.light' : 'warning.dark',
            }}
            onClick={handleClose}
          >
            Continue with Fallbacks
          </Button>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default RateLimitNotification;
