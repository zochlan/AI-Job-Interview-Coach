import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useHistory } from 'react-router-dom';

const NotFound: React.FC = () => {
  const history = useHistory();
  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h2" color="error" gutterBottom>404</Typography>
      <Typography variant="h5" gutterBottom>Page Not Found</Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>Sorry, the page you are looking for does not exist.</Typography>
      <Button variant="contained" color="primary" onClick={() => history.push('/')}>Go Home</Button>
    </Box>
  );
};

export default NotFound;
