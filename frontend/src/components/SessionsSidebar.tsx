import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Drawer,
  useMediaQuery,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import { useHistory } from 'react-router-dom';

// Define the session type
interface Session {
  id: string;
  date: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  sessionType?: 'interview' | 'coach'; // Optional for backward compatibility
  usesCV?: boolean; // Whether the session uses CV data
}

interface SessionsSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  mode: 'light' | 'dark';
  isOpen?: boolean;
  onToggle?: () => void;
}

const SessionsSidebar: React.FC<SessionsSidebarProps> = ({
  currentSessionId,
  onSessionSelect,
  mode,
  isOpen = true,
  onToggle
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessionTitleToDelete, setSessionTitleToDelete] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const isMobile = useMediaQuery('(max-width:900px)');
  const history = useHistory();

  // Custom theme based on light/dark mode
  const theme = {
    background: mode === 'dark' ? '#1a1a2e' : '#f0f2f5',
    sidebarBg: mode === 'dark' ? '#1e1e30' : '#f8f9fa',
    text: mode === 'dark' ? '#ffffff' : '#333333',
    border: mode === 'dark' ? '#2d2d42' : '#e0e0e0',
    hover: mode === 'dark' ? '#2d2d42' : '#e8eaed',
    selected: mode === 'dark' ? '#3a3a5a' : '#d7e3fc',
    headerBg: mode === 'dark' ? '#252540' : '#eaeef3',
  };

  // Function to clean up duplicate sessions in localStorage
  const cleanupDuplicateSessions = () => {
    try {
      const savedSessions = localStorage.getItem('interview-sessions');
      if (!savedSessions) return;

      const parsedSessions = JSON.parse(savedSessions);

      // Create a map to track unique sessions
      const uniqueMap = new Map<string, boolean>();
      const uniqueSessions: any[] = [];

      parsedSessions.forEach((session: any) => {
        // Create a key based on title and message count
        const title = session.title || '';
        const messageCount = session.messages?.length || 0;
        const key = `${title}-${messageCount}`;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, true);
          uniqueSessions.push(session);
        }
      });

      // Only update localStorage if we found duplicates
      if (uniqueSessions.length < parsedSessions.length) {
        console.log(`Cleaned up ${parsedSessions.length - uniqueSessions.length} duplicate sessions`);
        localStorage.setItem('interview-sessions', JSON.stringify(uniqueSessions));
      }
    } catch (error) {
      console.error('Error cleaning up duplicate sessions:', error);
    }
  };

  // Load sessions from localStorage
  useEffect(() => {
    // Clean up duplicates first
    cleanupDuplicateSessions();

    const loadSessions = () => {
      try {
        // Try to load from the new format first
        const savedSessions = localStorage.getItem('interview-sessions');

        if (savedSessions) {
          // New format (array of session objects)
          const parsedSessions = JSON.parse(savedSessions);

          // Convert to our Session format
          const formattedSessions: Session[] = parsedSessions.map((session: any) => {
            const messages = session.messages || [];
            const lastMessage = messages.length > 0 ?
              messages[messages.length - 1].message.substring(0, 50) + (messages[messages.length - 1].message.length > 50 ? '...' : '') :
              'No messages';

            return {
              id: session.id,
              date: session.date || new Date().toLocaleDateString(),
              title: session.title || `Session ${session.id.substring(0, 8)}`,
              messageCount: messages.length,
              lastMessage,
              sessionType: session.sessionType,
              usesCV: session.metadata?.usesCV
            };
          });

          // Deduplicate sessions by title and content
          const uniqueSessions: Session[] = [];
          const titleMap = new Map<string, boolean>();

          formattedSessions.forEach(session => {
            // Create a key based on title and message count to identify potential duplicates
            const key = `${session.title}-${session.messageCount}`;

            if (!titleMap.has(key)) {
              titleMap.set(key, true);
              uniqueSessions.push(session);
            } else {
              console.log(`Skipping duplicate session: ${session.title}`);
            }
          });

          // Sort by most recent first
          uniqueSessions.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          setSessions(uniqueSessions);
          return;
        }

        // Fall back to old format if new format not found
        const oldSavedSessions = localStorage.getItem('interviewSessions');
        if (oldSavedSessions) {
          const parsedSessions = JSON.parse(oldSavedSessions);

          // Convert to our Session format
          const formattedSessions: Session[] = Object.keys(parsedSessions).map(id => {
            const session = parsedSessions[id];
            const messages = session.messages || [];
            const lastMessage = messages.length > 0 ?
              messages[messages.length - 1].message.substring(0, 50) + (messages[messages.length - 1].message.length > 50 ? '...' : '') :
              'No messages';

            return {
              id,
              date: new Date(session.timestamp || Date.now()).toLocaleDateString(),
              title: session.title || `Session ${id.substring(0, 8)}`,
              messageCount: messages.length,
              lastMessage,
              sessionType: session.sessionType // Include the session type if available
            };
          });

          // Sort by most recent first
          formattedSessions.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          setSessions(formattedSessions);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    loadSessions();

    // Set up event listener for storage changes
    window.addEventListener('storage', loadSessions);
    return () => window.removeEventListener('storage', loadSessions);
  }, []);

  // Open delete confirmation dialog
  const handleDeleteSession = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    // Find the session title to display in the confirmation dialog
    const sessionToDelete = sessions.find(session => session.id === id);
    if (sessionToDelete) {
      setSessionTitleToDelete(sessionToDelete.title);
    }

    setSessionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm deletion of session
  const confirmDeleteSession = () => {
    const id = sessionToDelete;
    if (!id) return;

    try {
      // Check if we're deleting the current session
      const isDeletingCurrentSession = id === currentSessionId;

      // Get the session type before deleting (for starting a new session of the same type)
      let sessionType: 'interview' | 'coach' = 'interview'; // Default to interview

      // Try to delete from the new format first
      const savedSessions = localStorage.getItem('interview-sessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);

        // If deleting current session, get its type first
        if (isDeletingCurrentSession) {
          const currentSession = parsedSessions.find((session: any) => session.id === id);
          if (currentSession && currentSession.sessionType) {
            sessionType = currentSession.sessionType;
          }
        }

        const updatedSessions = parsedSessions.filter((session: any) => session.id !== id);
        localStorage.setItem('interview-sessions', JSON.stringify(updatedSessions));

        // Update state
        setSessions(sessions.filter(session => session.id !== id));

        // If current session is deleted, start a new session of the same type
        if (isDeletingCurrentSession) {
          // Create a custom event to notify the ChatBot component to start a new session
          const event = new CustomEvent('startNewSession', {
            detail: { sessionType }
          });
          window.dispatchEvent(event);

          // Clear the URL parameter
          const newUrl = window.location.pathname;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      } else {
        // Fall back to old format if new format not found
        const oldSavedSessions = localStorage.getItem('interviewSessions');
        if (oldSavedSessions) {
          const parsedSessions = JSON.parse(oldSavedSessions);
          delete parsedSessions[id];
          localStorage.setItem('interviewSessions', JSON.stringify(parsedSessions));

          // Update state
          setSessions(sessions.filter(session => session.id !== id));

          // If current session is deleted, start a new session
          if (isDeletingCurrentSession) {
            // Create a custom event to notify the ChatBot component to start a new session
            const event = new CustomEvent('startNewSession', {
              detail: { sessionType: 'interview' } // Default to interview for old format
            });
            window.dispatchEvent(event);

            // Clear the URL parameter
            const newUrl = window.location.pathname;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }

    // Close the dialog
    setDeleteDialogOpen(false);
    setSessionToDelete(null);

    // Show success notification
    setSnackbarMessage(`Session "${sessionTitleToDelete}" deleted successfully`);
    setSnackbarOpen(true);
  };

  // Cancel deletion
  const cancelDeleteSession = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const toggleDrawer = () => {
    if (onToggle && !isMobile) {
      // Use the parent's toggle function for desktop view
      onToggle();
    } else {
      // Use local state for mobile drawer
      setDrawerOpen(!drawerOpen);
    }
  };

  const sidebarContent = (
    <Box sx={{
      width: isMobile ? '100%' : 280,
      height: 'calc(100vh - 64px)', // Adjust height to account for navbar
      position: 'fixed',
      top: 64, // Position below navbar
      left: 0,
      bgcolor: mode === 'dark' ? '#202123' : '#f7f7f8',
      color: theme.text,
      borderRight: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      zIndex: 1200,
    }}>
      <Box sx={{
        p: 2.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        bgcolor: mode === 'dark' ? '#202123' : '#f7f7f8',
      }}>
        <Typography variant="h6" sx={{
          fontWeight: 600,
          fontSize: '1rem',
          color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
        }}>
          Interview Sessions
        </Typography>
        <IconButton onClick={toggleDrawer} size="small" sx={{
          color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
        }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {sessions.length === 0 ? (
        <Box sx={{
          p: 4,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <Typography variant="body1" sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            mb: 2,
            fontWeight: 500,
            fontSize: '0.95rem'
          }}>
            No saved sessions yet.
          </Typography>
          <Button
            variant="contained"
            size="medium"
            onClick={() => history.push('/')}
            sx={{
              mt: 2,
              px: 3,
              py: 1,
              borderRadius: '6px',
              fontWeight: 500,
              bgcolor: '#10a37f',
              color: 'white',
              '&:hover': {
                bgcolor: '#0e8f6e',
              },
              textTransform: 'none',
            }}
          >
            Start New Session
          </Button>
        </Box>
      ) : (
        <List sx={{
          overflow: 'auto',
          flexGrow: 1,
          py: 1,
          px: 1
        }}>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              disablePadding
              secondaryAction={
                <Tooltip title="Delete session" arrow placement="left">
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
              sx={{
                mb: 0.5
              }}
            >
              <ListItemButton
                selected={session.id === currentSessionId}
                onClick={() => {
                  onSessionSelect(session.id);
                  if (isMobile) setDrawerOpen(false);
                }}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: '6px',
                  bgcolor: session.id === currentSessionId
                    ? mode === 'dark' ? 'rgba(52, 53, 65, 0.9)' : 'rgba(247, 247, 248, 0.9)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor: session.id === currentSessionId
                      ? mode === 'dark' ? 'rgba(52, 53, 65, 0.9)' : 'rgba(247, 247, 248, 0.9)'
                      : mode === 'dark' ? 'rgba(52, 53, 65, 0.7)' : 'rgba(247, 247, 248, 0.7)',
                  },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'
                    }}>
                      {session.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 0.5
                      }}>
                        <Typography variant="caption" sx={{
                          display: 'block',
                          color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                          fontSize: '0.7rem'
                        }}>
                          {session.date} • {session.messageCount} messages
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {/* CV Indicator */}
                          {session.usesCV !== undefined && (
                            <Box
                              sx={{
                                bgcolor: mode === 'dark' ? 'rgba(16, 163, 127, 0.2)' : 'rgba(16, 163, 127, 0.1)',
                                color: mode === 'dark' ? 'rgba(16, 163, 127, 0.9)' : 'rgba(16, 163, 127, 0.9)',
                                px: 0.8,
                                py: 0.1,
                                borderRadius: 4,
                                fontSize: '0.6rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.3,
                              }}
                            >
                              {session.usesCV ? 'CV' : 'No CV'}
                            </Box>
                          )}


                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{
                        display: 'block',
                        color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px',
                        mt: 0.5,
                        fontSize: '0.7rem'
                      }}>
                        {session.lastMessage}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <>
      {/* Success Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': { fontSize: '1.2rem' },
            '& .MuiAlert-message': { fontSize: '0.95rem', fontWeight: 500 }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteSession}
        PaperComponent={Paper}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            maxWidth: '400px',
            width: '100%',
            bgcolor: mode === 'dark' ? '#1e1e30' : '#fff',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: mode === 'dark' ? '#252540' : '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2
        }}>
          <WarningIcon sx={{
            color: mode === 'dark' ? '#ff9800' : '#f57c00',
            fontSize: 28
          }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Session
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <DialogContentText sx={{
            color: mode === 'dark' ? '#e0e0e0' : '#424242',
            mb: 1
          }}>
            Are you sure you want to delete this session?
          </DialogContentText>
          <Box sx={{
            mt: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {sessionTitleToDelete}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{
            mt: 2,
            color: mode === 'dark' ? '#ff9800' : '#f57c00',
            fontWeight: 500
          }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          px: 3,
          py: 2,
          bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
          borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}>
          <Button
            onClick={cancelDeleteSession}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteSession}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: mode === 'dark' ? '0 4px 12px rgba(244,67,54,0.3)' : '0 4px 12px rgba(244,67,54,0.2)',
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {isMobile ? (
        <>
          <IconButton
            onClick={toggleDrawer}
            sx={{
              position: 'fixed',
              top: 70, // Adjusted position below navbar
              left: 16,
              zIndex: 1100,
              bgcolor: mode === 'dark' ? '#6a9fff' : '#2979ff',
              color: 'white',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: mode === 'dark' ? '#5183e0' : '#1c54b2',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer}
          >
            {sidebarContent}
          </Drawer>
        </>
      ) : (
        isOpen ? sidebarContent : (
          <IconButton
            onClick={toggleDrawer}
            sx={{
              position: 'fixed',
              top: 70, // Adjusted position below navbar
              left: 16,
              zIndex: 1100,
              bgcolor: mode === 'dark' ? '#6a9fff' : '#2979ff',
              color: 'white',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: mode === 'dark' ? '#5183e0' : '#1c54b2',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )
      )}
    </>
  );
};

export default SessionsSidebar;
