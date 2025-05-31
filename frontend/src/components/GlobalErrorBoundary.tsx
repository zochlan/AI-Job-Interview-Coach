import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // You could send this to a logging service
    // logErrorToService(error, errorInfo);
  }

  handleReload = (): void => {
    // Clear any cached state that might be causing the error
    sessionStorage.removeItem('app_error_state');
    
    // Reload the page
    window.location.reload();
  }

  handleGoHome = (): void => {
    // Navigate to home page
    window.location.href = '/';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Store current location before showing error
      try {
        sessionStorage.setItem('error_location', window.location.pathname);
      } catch (e) {
        // Ignore storage errors
      }
      
      // Render fallback UI
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            py: 4
          }}
        >
          <Container maxWidth="md">
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h4" color="error" gutterBottom>
                Something went wrong
              </Typography>
              
              <Typography variant="body1" paragraph>
                We're sorry, but an unexpected error has occurred. Our team has been notified.
              </Typography>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={this.handleGoHome}
                >
                  Go to Home Page
                </Button>
              </Box>
              
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 4, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>
                    Error Details (Development Only):
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      color: 'error.main',
                      maxHeight: '200px',
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Paper>
                </Box>
              )}
            </Paper>
          </Container>
        </Box>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default GlobalErrorBoundary;
