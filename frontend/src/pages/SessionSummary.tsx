import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import SessionProgress from '../components/SessionProgress';
import SessionsSidebar from '../components/SessionsSidebar';

interface SessionSummaryProps {
  mode: 'light' | 'dark';
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ mode }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId || '');
  const history = useHistory();
  const muiTheme = useMuiTheme();

  // Check URL query parameters for sessionId as well (for direct links)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const querySessionId = queryParams.get('sessionId');
    if (querySessionId && !sessionId) {
      setCurrentSessionId(querySessionId);
      console.log("Session ID from query params:", querySessionId);
    }
  }, [sessionId]);
  // We'll use this variable in our responsive styles
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Custom theme based on light/dark mode
  const theme = {
    background: mode === 'dark' ? '#121212' : '#f5f7fa',
    paper: mode === 'dark' ? '#1e1e30' : '#ffffff',
    text: mode === 'dark' ? '#ffffff' : '#333333',
    border: mode === 'dark' ? '#2d2d42' : '#e0e0e0',
    primary: mode === 'dark' ? '#5f9fff' : '#4f8cff',
  };

  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId);
      console.log("Session ID set in SessionSummary:", sessionId);
    }
  }, [sessionId]);

  const handleSessionSelect = (id: string) => {
    setCurrentSessionId(id);
    history.push(`/session/${id}`);
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      bgcolor: theme.background,
      color: theme.text,
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      {/* Sessions Sidebar */}
      <SessionsSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        mode={mode}
      />

      {/* Main Content */}
      <Box sx={{
        flexGrow: 1,
        p: { xs: 0, md: 3 },
        ml: { xs: 0, md: '280px' },
        transition: 'margin 0.3s ease',
      }}>
        {/* Header */}
        <Paper sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: theme.paper,
          borderRadius: { xs: 0, md: 2 },
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s ease',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => history.push('/')}
              sx={{
                mr: 2,
                color: mode === 'dark' ? '#6a9fff' : '#2979ff',
                borderColor: mode === 'dark' ? 'rgba(106,159,255,0.5)' : 'rgba(41,121,255,0.5)',
                '&:hover': {
                  borderColor: mode === 'dark' ? '#6a9fff' : '#2979ff',
                  backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.1)' : 'rgba(41,121,255,0.1)',
                }
              }}
            >
              Back to Home
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              Session Analysis
            </Typography>
          </Box>
        </Paper>

        {/* Session Progress Component */}
        {currentSessionId ? (
          <SessionProgress sessionId={currentSessionId} mode={mode} />
        ) : (
          <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              No session selected
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: mode === 'dark' ? '#aaa' : '#666' }}>
              Please select a session from the sidebar or start a new interview session.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => history.push('/')}
              sx={{
                px: 4,
                py: 1.2,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '8px',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(95,159,255,0.3)'
                  : '0 4px 12px rgba(79,140,255,0.3)',
                '&:hover': {
                  boxShadow: mode === 'dark'
                    ? '0 6px 16px rgba(95,159,255,0.4)'
                    : '0 6px 16px rgba(79,140,255,0.4)',
                }
              }}
            >
              Start New Session
            </Button>
          </Container>
        )}
      </Box>
    </Box>
  );
};

export default SessionSummary;
