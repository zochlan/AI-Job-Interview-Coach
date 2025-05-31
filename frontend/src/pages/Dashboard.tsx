import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Session {
  id: number;
  session_type: string;
  start_time: string;
  end_time: string | null;
  date?: string;
}

const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [sessionType, setSessionType] = useState('');
  const history = useHistory();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      history.push('/login');
      return;
    }
    fetchSessions();
  }, [isAuthenticated, history]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/sessions', { withCredentials: true });
      const data = response.data as { sessions: Session[] };
      setSessions(data.sessions);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const response = await axios.post('/sessions',
        { session_type: sessionType },
        { withCredentials: true }
      );
      const data = response.data as { session_id: number, first_question?: any };
      history.push({
        pathname: `/interview/${data.session_id}`,
        state: { firstQuestion: data.first_question }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create session');
    }
  };

  const handleResumeSession = (sessionId: number) => {
    history.push(`/interview/${sessionId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #4f8cff 0%, #e3f2fd 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: { xs: 6, md: 10 },
    }}>
      <Container maxWidth="lg" disableGutters sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh'
      }}>
        <Paper elevation={4} sx={{
          p: { xs: 2, md: 6 },
          borderRadius: 6,
          boxShadow: '0 8px 40px 0 rgba(79,140,255,0.17)',
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(18px)',
          border: '2px solid rgba(79,140,255,0.13)',
          width: { xs: '97vw', sm: '90vw', md: '75vw' },
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Box sx={{ marginTop: 4, marginBottom: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h4">
                Interview Sessions
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenDialog(true)}
              >
                Start New Interview
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ marginBottom: 3 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {sessions.map((session: Session) => (
                <Grid item xs={12} sm={6} md={4} key={session.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {session.session_type} Interview
                      </Typography>
                      <Typography color="textSecondary">
                        Started: {session.start_time ? new Date(session.start_time).toLocaleString() : (session.date || new Date().toLocaleString())}
                      </Typography>
                      <Typography color="textSecondary">
                        Status: {session.end_time ? 'Completed' : 'In Progress'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleResumeSession(session.id)}
                      >
                        {session.end_time ? 'Review' : 'Resume'}
                      </Button>
                      <Button
                        size="small"
                        color="secondary"
                        onClick={async () => {
                          try {
                            await axios.delete(`/sessions/${session.id}`, { withCredentials: true });
                            setSessions(sessions.filter(s => s.id !== session.id));
                          } catch (err: any) {
                            setError(err.response?.data?.error || 'Failed to delete session');
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Container>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Start New Interview Session</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel id="session-type-label">Session Type</InputLabel>
            <Select
              labelId="session-type-label"
              id="session-type"
              value={sessionType}
              label="Session Type"
              onChange={(event: SelectChangeEvent<string>) => {
                setSessionType(event.target.value as string);
                setError('');
              }}
            >
              <MenuItem value="TECHNICAL">Technical Interview</MenuItem>
              <MenuItem value="BEHAVIORAL">Behavioral Interview</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!sessionType}
          >
            Start
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;