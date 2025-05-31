import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Function to update online status
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Listen for custom offline event from API client
    window.addEventListener('app:offline', () => setIsOffline(true));

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      window.removeEventListener('app:offline', () => setIsOffline(true));
    };
  }, []);

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 90, sm: 16 } }} // Adjust for mobile navigation
    >
      <Alert 
        severity="warning" 
        icon={<WifiOffIcon />}
        sx={{ 
          width: '100%',
          boxShadow: 3,
          '& .MuiAlert-icon': {
            fontSize: '1.5rem'
          }
        }}
      >
        <AlertTitle>You're offline</AlertTitle>
        Some features may be unavailable until you reconnect to the internet.
      </Alert>
    </Snackbar>
  );
};

export default OfflineIndicator;
