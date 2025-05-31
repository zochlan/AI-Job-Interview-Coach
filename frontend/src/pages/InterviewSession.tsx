import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';

// Minor improvements: Add explicit types, handle edge cases, improve error handling, and ensure all props and hooks are used correctly

interface Response {
  id: number;
  response_text: string;
  timestamp: string;
  feedback?: {
    feedback_text: string;
    improvement_suggestions: string;
    analysis: {
      professional_tone: number;
      clarity: number;
      completeness_score: number;
      correctness?: number;
    };
  };
}

interface Session {
  id: number;
  session_type: string;
  start_time: string;
  end_time: string | null;
  date?: string;
  responses: Response[];
}

const InterviewSession: React.FC = () => {
  // State declarations (declare each only ONCE)
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation<{ firstQuestion?: any }>();
  const [session, setSession] = useState<Session | null>(null);
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string>(''); // Used for error handling in API calls
  const [evaluation, setEvaluation] = useState<{ label: number; confidence: number } | null>(null);
  const history = useHistory();
  const { isAuthenticated } = useAuth();
  const [question, setQuestion] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) {
      history.push('/login');
      return;
    }
    fetchSession();
    // If the first question is passed via navigation state, use it
    if (location.state && location.state.firstQuestion && location.state.firstQuestion.text) {
      setQuestion(location.state.firstQuestion.text);
    } else {
      fetchQuestion();
    }
    // eslint-disable-next-line
  }, [sessionId, isAuthenticated]);

  const fetchSession = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/sessions/${sessionId}`, {
        withCredentials: true
      });
      const data = response.data as Session;
      setSession(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };

  interface RandomQuestionResponse {
    question: string;
  }

  const fetchQuestion = async () => {
    try {
      // Pass session_type as a query param to get the right question type
      const sessionType = session?.session_type;
      const response = await axios.get<RandomQuestionResponse>(
        `/random-question${sessionType ? `?session_type=${encodeURIComponent(sessionType)}` : ''}`
      );
      setQuestion(response.data.question);
      setResponse(""); // Clear the answer field for the new question
    } catch (error) {
      setQuestion("Error fetching question.");
    }
  };



  const handleSubmitResponse = async () => {
    if (!response.trim()) return;
    setAnalyzing(true);
    setError('');
    setEvaluation(null);
    try {
      // 1. Evaluate the answer with AI
      const evalRes = await axios.post('/evaluate-answer', { answer: response });
      setEvaluation(evalRes.data as { label: number; confidence: number });

      // 2. (Optional) Save the response as before
      const result = await axios.post(
        `/sessions/${sessionId}/responses`,
        { response_text: response },
        { withCredentials: true }
      );
      const newResponse = result.data as Response;
      setSession(prev => prev ? {
        ...prev,
        responses: [...prev.responses, newResponse]
      } : null);
      setResponse('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit response');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEndSession = async () => {
    setError('');
    try {
      await axios.post(`/sessions/${sessionId}/end`, {}, {
        withCredentials: true
      });
      history.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to end session');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Container>
        <Alert severity="error">Session not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box style={{ marginTop: 32, marginBottom: 32 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Typography variant="h4" component="h1">
            {session.session_type} Interview
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleEndSession}
          >
            End Session
          </Button>
        </Box>
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper style={{ padding: 24 }}>
              <Typography variant="h6" gutterBottom>
                Interview Question
              </Typography>
              <Box style={{ marginBottom: 20 }}>
                <Typography variant="body1">{question}</Typography>
              </Box>
              <TextField
                multiline
                minRows={6}
                variant="outlined"
                fullWidth
                placeholder="Type your response here..."
                value={response}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResponse(e.target.value)}
                disabled={analyzing}
                style={{ marginBottom: 16 }}
              />
              <Box style={{ marginTop: 16 }}>
                {/* NOTE: This Button triggers a Modal/Dialog using MUI's Fade/Transition. If you see a findDOMNode warning, it's a known React StrictMode/MUI issue and can be safely ignored for now. */}
                <Button
                  variant="contained"
                  onClick={handleSubmitResponse}
                  disabled={!response.trim() || analyzing}
                >
                  Submit Response
                </Button>
              </Box>
              {evaluation && (
                <Alert severity={evaluation.label === 1 ? "success" : "warning"} style={{ marginTop: 16 }}>
                  {evaluation.label === 1
                    ? `Good answer! (Confidence: ${(evaluation.confidence * 100).toFixed(1)}%)`
                    : `Needs improvement. (Confidence: ${(evaluation.confidence * 100).toFixed(1)}%)`}
                </Alert>
              )}
              {analyzing && (
                <Box style={{ marginTop: 16 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                    Analyzing your response...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={5} {...({} as any)}>
            <Paper style={{ padding: 24 }}>
              <Typography variant="h6" gutterBottom>
                Previous Responses & Feedback
              </Typography>
              <Box style={{ maxHeight: '60vh', overflow: 'auto' }}>
                {session.responses.map((response, index) => (
                  <Card key={response.id} style={{ marginBottom: 16 }}>
                    <CardContent>
                      <Typography variant="body1" gutterBottom>
                        {response.response_text}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(response.timestamp).toLocaleString()}
                      </Typography>
                      {response.feedback && (
                        <>
                          <Divider style={{ marginTop: 16, marginBottom: 16 }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Feedback
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            {response.feedback.feedback_text}
                          </Typography>
                          <Box style={{ marginTop: 16 }}>
                            <Chip
                              label={`Professional: ${Math.round(response.feedback.analysis.professional_tone * 100)}%`}
                              color="primary"
                              size="small"
                              style={{ marginRight: 8 }}
                            />
                            <Chip
                              label={`Clarity: ${Math.round(response.feedback.analysis.clarity * 100)}%`}
                              color="secondary"
                              size="small"
                              style={{ marginRight: 8 }}
                            />
                            <Chip
                              label={`Complete: ${Math.round(response.feedback.analysis.completeness_score * 100)}%`}
                              color="primary"
                              size="small"
                              style={{ marginRight: 8 }}
                            />
                            {/* Correctness Chip for technical sessions */}
                            {typeof response.feedback.analysis.correctness === 'number' && session.session_type?.toUpperCase() === 'TECHNICAL' && (
                              <Chip
                                label={`Correctness: ${getCorrectnessLabel(response.feedback.analysis.correctness)}`}
                                color={
                                  response.feedback.analysis.correctness >= 0.8
                                    ? 'primary'
                                    : response.feedback.analysis.correctness >= 0.5
                                    ? 'secondary'
                                    : 'default'
                                }
                                size="small"
                                style={{ marginRight: 8 }}
                              />
                            )}
                          </Box>
                          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 16 }}>
                            Suggestions for Improvement
                          </Typography>
                          <Typography variant="body2">
                            {response.feedback.improvement_suggestions}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
            {/* Display the random question above the main response box */}
            <Box style={{ padding: 16, marginTop: 24, marginBottom: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <Typography variant="h6" gutterBottom>
                Interview Question
              </Typography>
              <div style={{ marginTop: 8, marginBottom: 8 }}>{question}</div>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

// Helper to translate correctness score to a label
function getCorrectnessLabel(score: number): string {
  if (score >= 0.8) return 'Correct';
  if (score >= 0.5) return 'Partially Correct';
  if (score >= 0) return 'Incorrect';
  return '';
}

export default InterviewSession;
