import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Button,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useHistory } from 'react-router-dom';

// Define the message type
interface ChatMessage {
  id: number;
  message: string;
  timestamp: string;
  isInterviewQuestion?: boolean;
  showFeedback?: boolean;
  feedback?: string;
  questionMetadata?: {
    id: string;
    category: string;
    difficulty: string;
  };
}

interface SessionProgressProps {
  sessionId: string;
  mode: 'light' | 'dark';
}

const SessionProgress: React.FC<SessionProgressProps> = ({ sessionId, mode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  // Custom theme based on light/dark mode
  const theme = {
    background: mode === 'dark' ? '#1a1a2e' : '#f0f2f5',
    cardBg: mode === 'dark' ? '#252542' : '#ffffff',
    text: mode === 'dark' ? '#ffffff' : '#333333',
    border: mode === 'dark' ? '#2d2d42' : '#e0e0e0',
    primary: mode === 'dark' ? '#5f9fff' : '#4f8cff',
    secondary: mode === 'dark' ? '#e91e63' : '#d81b60',
    success: mode === 'dark' ? '#4caf50' : '#43a047',
    warning: mode === 'dark' ? '#ff9800' : '#f57c00',
  };

  useEffect(() => {
    const loadSession = () => {
      try {
        // First try with the correct key 'interview-sessions'
        const savedSessions = localStorage.getItem('interview-sessions');
        if (savedSessions) {
          const parsedSessions = JSON.parse(savedSessions);
          // Find the session by ID in the array
          const session = parsedSessions.find((s: any) => s.id === sessionId);
          if (session) {
            setSessionData(session);
            setMessages(session.messages || []);
            setLoading(false);
            return;
          }
        }

        // Fallback to the old format for backward compatibility
        const oldSavedSessions = localStorage.getItem('interviewSessions');
        if (oldSavedSessions) {
          const parsedOldSessions = JSON.parse(oldSavedSessions);
          if (parsedOldSessions[sessionId]) {
            setSessionData(parsedOldSessions[sessionId]);
            setMessages(parsedOldSessions[sessionId].messages || []);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading session:', error);
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading session data...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!sessionData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Session not found</Typography>
        <Typography variant="body1" sx={{ mb: 4, color: mode === 'dark' ? '#aaa' : '#666' }}>
          The session you're looking for may have been deleted or doesn't exist.
        </Typography>
        <Button
          variant="contained"
          onClick={() => history.push('/')}
          sx={{
            mt: 2,
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
      </Box>
    );
  }

  // Calculate session statistics
  const userMessages = messages.filter(m => m.id === 0);
  const botMessages = messages.filter(m => m.id === 1);

  // Consider all bot messages as interview questions if none are explicitly marked
  // This ensures backward compatibility with older sessions
  const interviewQuestions = botMessages.filter(m =>
    m.isInterviewQuestion === true ||
    (botMessages.every(msg => msg.isInterviewQuestion === undefined) && m.id === 1)
  );

  // Calculate response quality metrics with more sophisticated analysis
  const calculateResponseQuality = () => {
    // If no user messages, return default values
    if (userMessages.length === 0) {
      return { score: 0, level: 'No Data', strengths: [], weaknesses: [], recommendations: [], isBadInterview: false };
    }

    // Calculate average length as one factor
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;

    // Calculate complexity score based on sentence structure and vocabulary
    const complexityScore = userMessages.reduce((score, msg) => {
      // Count sentences
      const sentences = msg.message.split(/[.!?]+/).filter(s => s.trim().length > 0);
      // Count words with more than 6 characters (proxy for vocabulary complexity)
      const complexWords = msg.message.split(/\s+/).filter(word => word.length > 6).length;
      // Count specific STAR method indicators
      const situationIndicators = (msg.message.match(/situation|context|background|when|where|while/gi) || []).length;
      const taskIndicators = (msg.message.match(/task|goal|objective|aim|needed to|had to|responsible for/gi) || []).length;
      const actionIndicators = (msg.message.match(/action|did|implement|execut|step|approach|method|process/gi) || []).length;
      const resultIndicators = (msg.message.match(/result|outcome|impact|success|accomplish|achiev|learn|finish/gi) || []).length;

      // Calculate STAR completeness (0-4 scale)
      const starCompleteness = Math.min(1, situationIndicators) +
                              Math.min(1, taskIndicators) +
                              Math.min(1, actionIndicators) +
                              Math.min(1, resultIndicators);

      return score + (sentences.length * 2) + (complexWords * 0.5) + (starCompleteness * 5);
    }, 0) / userMessages.length;

    // Calculate specificity score based on presence of numbers, dates, names, etc.
    const specificityScore = userMessages.reduce((score, msg) => {
      // Count numbers (including percentages, dollar amounts)
      const numbers = (msg.message.match(/\d+(\.\d+)?%?|\$\d+/g) || []).length;
      // Count specific time references
      const timeReferences = (msg.message.match(/\d+\s+(day|week|month|year|hour|minute)s?/gi) || []).length;
      // Count proper nouns (simplified approach - words starting with capital letters not at beginning of sentence)
      const properNouns = (msg.message.match(/(?<!\.\s+)[A-Z][a-z]+/g) || []).length;

      return score + (numbers * 3) + (timeReferences * 2) + (properNouns * 1);
    }, 0) / userMessages.length;

    // Calculate clarity score based on sentence length and structure
    const clarityScore = userMessages.reduce((score, msg) => {
      // Split into sentences
      const sentences = msg.message.split(/[.!?]+/).filter(s => s.trim().length > 0);
      // Calculate average sentence length (penalize very long sentences)
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / (sentences.length || 1);
      // Optimal sentence length is around 15-20 words
      const sentenceLengthScore = avgSentenceLength > 30 ? 5 :
                                 avgSentenceLength > 25 ? 7 :
                                 avgSentenceLength > 20 ? 8 :
                                 avgSentenceLength > 10 ? 10 :
                                 avgSentenceLength > 5 ? 8 : 5;

      // Check for transition words that improve clarity
      const transitionWords = (msg.message.match(/however|therefore|consequently|furthermore|additionally|in addition|moreover|thus|hence|as a result|for example|for instance|specifically|in particular|in contrast|on the other hand/gi) || []).length;

      return score + sentenceLengthScore + (transitionWords * 2);
    }, 0) / userMessages.length;

    // Detect bad interview patterns
    const detectBadInterviewPatterns = () => {
      // Check for very short answers (one-word or few-word responses)
      const shortAnswers = userMessages.filter(msg => msg.message.split(/\s+/).length < 5).length;
      const shortAnswerRatio = shortAnswers / userMessages.length;

      // Check for negative or unprofessional language
      const unprofessionalLanguage = userMessages.reduce((count, msg) => {
        const unprofessionalWords = (msg.message.match(/bad|terrible|hate|stupid|idiot|crap|damn|hell|shit|fuck|suck|whatever|idk|dunno|meh|lol|haha/gi) || []).length;
        return count + unprofessionalWords;
      }, 0);

      // Check for question avoidance (answering questions with questions)
      const questionResponses = userMessages.filter(msg => msg.message.includes('?')).length;
      const questionRatio = questionResponses / userMessages.length;

      // Check for very similar/repetitive answers
      const similarAnswers = userMessages.reduce((count, msg, idx, arr) => {
        if (idx === 0) return count;
        const prevMsg = arr[idx - 1].message;
        // Simple similarity check - if more than 50% of words are the same
        const currentWordsArray = msg.message.toLowerCase().split(/\s+/);
        const prevWordsArray = prevMsg.toLowerCase().split(/\s+/);

        // Count common words without using Set spread operator
        let commonWords = 0;
        for (let i = 0; i < currentWordsArray.length; i++) {
          if (prevWordsArray.includes(currentWordsArray[i])) {
            commonWords++;
          }
        }

        const similarity = commonWords / Math.min(currentWordsArray.length, prevWordsArray.length);
        return count + (similarity > 0.5 ? 1 : 0);
      }, 0);
      const similarAnswerRatio = similarAnswers / Math.max(1, userMessages.length - 1);

      // Calculate a "bad interview" score
      const badInterviewScore =
        (shortAnswerRatio * 40) +
        (Math.min(unprofessionalLanguage, 5) * 10) +
        (questionRatio * 30) +
        (similarAnswerRatio * 20);

      // Determine if this is a bad interview (score > 30 indicates problematic patterns)
      const isBadInterview = badInterviewScore > 30;

      // Generate specific feedback for bad interview patterns
      const badPatterns = [];
      if (shortAnswerRatio > 0.3) badPatterns.push('Too many short, incomplete answers');
      if (unprofessionalLanguage > 0) badPatterns.push('Use of unprofessional language');
      if (questionRatio > 0.2) badPatterns.push('Tendency to answer questions with questions');
      if (similarAnswerRatio > 0.3) badPatterns.push('Repetitive answers without adding new information');

      return { isBadInterview, badPatterns, badInterviewScore };
    };

    const badInterviewAnalysis = detectBadInterviewPatterns();

    // Calculate final score (weighted average of all factors)
    let finalScore = 0;
    finalScore += (avgLength > 400) ? 25 : (avgLength > 300) ? 22 : (avgLength > 200) ? 18 : (avgLength > 100) ? 15 : 10;
    finalScore += Math.min(25, complexityScore);
    finalScore += Math.min(25, specificityScore * 2);
    finalScore += Math.min(25, clarityScore * 1.5);

    // Reduce score for bad interview patterns
    if (badInterviewAnalysis.isBadInterview) {
      // Reduce score based on how bad the interview was
      const reduction = Math.min(50, Math.round(badInterviewAnalysis.badInterviewScore / 2));
      finalScore = Math.max(10, finalScore - reduction);
    }

    // Cap the score at 100
    finalScore = Math.min(100, Math.round(finalScore));

    // Determine level based on score
    let level = '';
    if (finalScore >= 85) level = 'Excellent';
    else if (finalScore >= 70) level = 'Very Good';
    else if (finalScore >= 60) level = 'Good';
    else if (finalScore >= 50) level = 'Average';
    else if (finalScore >= 40) level = 'Fair';
    else if (finalScore >= 20) level = 'Needs Improvement';
    else level = 'Poor';

    // Identify strengths
    const strengths = [];
    if (avgLength > 250) strengths.push('Detailed responses with good length');
    if (complexityScore > 12) strengths.push('Well-structured answers using the STAR method');
    if (specificityScore > 5) strengths.push('Good use of specific examples and metrics');
    if (clarityScore > 8) strengths.push('Clear and concise communication');

    // Identify weaknesses
    const weaknesses = [];
    if (avgLength < 150) weaknesses.push('Responses could be more detailed');
    if (complexityScore < 10) weaknesses.push('Limited use of the STAR method structure');
    if (specificityScore < 3) weaknesses.push('Lack of specific examples and metrics');
    if (clarityScore < 6) weaknesses.push('Communication could be clearer and more concise');

    // Add bad interview patterns to weaknesses
    if (badInterviewAnalysis.isBadInterview) {
      weaknesses.push(...badInterviewAnalysis.badPatterns);
    }

    // Generate recommendations
    const recommendations = [];
    if (avgLength < 200) recommendations.push('Provide more detailed responses with examples');
    if (complexityScore < 12) recommendations.push('Structure answers using the STAR method (Situation, Task, Action, Result)');
    if (specificityScore < 5) recommendations.push('Include specific metrics, numbers, and outcomes in your answers');
    if (clarityScore < 8) recommendations.push('Use clearer sentence structure and transition words');

    // Add recommendations for bad interview patterns
    if (badInterviewAnalysis.isBadInterview) {
      if (badInterviewAnalysis.badPatterns.includes('Too many short, incomplete answers')) {
        recommendations.push('Aim for answers that are at least 3-4 sentences long with specific details');
      }
      if (badInterviewAnalysis.badPatterns.includes('Use of unprofessional language')) {
        recommendations.push('Maintain professional language throughout the interview');
      }
      if (badInterviewAnalysis.badPatterns.includes('Tendency to answer questions with questions')) {
        recommendations.push('Answer questions directly before asking clarifying questions');
      }
      if (badInterviewAnalysis.badPatterns.includes('Repetitive answers without adding new information')) {
        recommendations.push('Provide unique information in each answer, avoiding repetition');
      }
    }

    return {
      score: finalScore,
      level,
      strengths,
      weaknesses,
      recommendations,
      isBadInterview: badInterviewAnalysis.isBadInterview
    };
  };

  const responseQuality = calculateResponseQuality();

  // Get question categories
  const getQuestionCategories = () => {
    const categories: Record<string, number> = {};

    interviewQuestions.forEach(q => {
      if (q.questionMetadata?.category) {
        const category = q.questionMetadata.category;
        categories[category] = (categories[category] || 0) + 1;
      }
    });

    return Object.entries(categories).map(([name, count]) => ({ name, count }));
  };

  const questionCategories = getQuestionCategories();

  // Get notable responses (placeholder)
  const getNotableResponses = () => {
    // In a real implementation, this would use NLP to find the best responses
    // For now, just return the longest response
    if (userMessages.length === 0) return [];

    return userMessages
      .sort((a, b) => b.message.length - a.message.length)
      .slice(0, 2)
      .map(msg => {
        // Find the most recent bot message before this user message
        const userMsgIndex = messages.indexOf(msg);
        const precedingBotMessages = messages
          .slice(0, userMsgIndex)
          .filter(m => m.id === 1)
          .reverse();

        // Try to find a preceding bot message that's marked as an interview question
        let questionMsg = precedingBotMessages.find(m => m.isInterviewQuestion);

        // If none found, just use the most recent bot message before the user message
        if (!questionMsg && precedingBotMessages.length > 0) {
          questionMsg = precedingBotMessages[0];
        }

        return {
          question: questionMsg?.message || "Unknown question",
          answer: msg.message
        };
      });
  };

  const notableResponses = getNotableResponses();

  return (
    <Box sx={{
      p: { xs: 2, md: 4 },
      bgcolor: theme.background,
      minHeight: '100vh',
      color: theme.text,
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      <Paper sx={{
        p: { xs: 2, md: 4 },
        bgcolor: theme.cardBg,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        mb: 4,
        transition: 'background-color 0.3s ease',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Session Summary
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => history.push('/')}
          >
            Back to Home
          </Button>
        </Box>

        <Typography variant="body1" sx={{ mb: 3, color: mode === 'dark' ? '#bbb' : '#666' }}>
          Session from {new Date(sessionData.lastUpdated || sessionData.timestamp || Date.now()).toLocaleString()}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: mode === 'dark' ? '#2a2a45' : '#f8f9fa', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Session Stats
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: mode === 'dark' ? '#aaa' : '#666', mb: 0.5 }}>
                    Questions Answered
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {interviewQuestions.length}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: mode === 'dark' ? '#aaa' : '#666', mb: 0.5 }}>
                    Total Exchanges
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {userMessages.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: mode === 'dark' ? '#aaa' : '#666', mb: 0.5 }}>
                    Session Duration
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {/* Calculate approximate duration based on message count */}
                    ~{Math.max(5, Math.round(messages.length * 1.5))} mins
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: mode === 'dark' ? '#2a2a45' : '#f8f9fa', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Response Quality
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h5" sx={{
                    fontWeight: 700,
                    mr: 2,
                    color: responseQuality.isBadInterview ?
                      (mode === 'dark' ? '#ff6b6b' : '#d32f2f') :
                      'inherit'
                  }}>
                    {responseQuality.level}
                    {responseQuality.isBadInterview && ' ⚠️'}
                  </Typography>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${responseQuality.score}/100`}
                    color={responseQuality.isBadInterview ? "error" : "primary"}
                    sx={{
                      bgcolor: responseQuality.isBadInterview ?
                        (mode === 'dark' ? '#d32f2f' : '#f44336') :
                        theme.primary,
                      color: '#fff',
                      fontWeight: 600
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={responseQuality.score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 2,
                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: responseQuality.isBadInterview ?
                        (mode === 'dark' ? '#d32f2f' : '#f44336') :
                        theme.primary
                    }
                  }}
                />
                <Typography variant="body2" sx={{
                  color: responseQuality.isBadInterview ?
                    (mode === 'dark' ? '#ff6b6b' : '#d32f2f') :
                    (mode === 'dark' ? '#bbb' : '#666'),
                  mb: 2,
                  fontWeight: responseQuality.isBadInterview ? 600 : 400
                }}>
                  {responseQuality.isBadInterview ?
                    'This interview shows significant issues that would likely result in a negative impression. Review the specific feedback below to improve your approach.' :
                    responseQuality.score > 80 ?
                    'Your responses demonstrate excellent structure and detail. You effectively use the STAR method and provide concrete examples.' :
                    responseQuality.score > 65 ?
                    'Your responses are good with clear examples. Consider adding more specific details and quantifiable achievements.' :
                    responseQuality.score > 0 ?
                    'Your responses could be improved by providing more structure, specific examples, and measurable outcomes.' :
                    'No responses to analyze yet.'}
                </Typography>

                {/* Strengths Section */}
                {responseQuality.strengths && responseQuality.strengths.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.success, mb: 1 }}>
                      Strengths:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {responseQuality.strengths.map((strength, idx) => (
                        <Typography component="li" key={idx} variant="body2" sx={{ mb: 0.5 }}>
                          {strength}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Weaknesses Section */}
                {responseQuality.weaknesses && responseQuality.weaknesses.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.warning, mb: 1 }}>
                      Areas for Improvement:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {responseQuality.weaknesses.map((weakness, idx) => (
                        <Typography component="li" key={idx} variant="body2" sx={{ mb: 0.5 }}>
                          {weakness}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Recommendations Section */}
                {responseQuality.recommendations && responseQuality.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.primary, mb: 1 }}>
                      Recommendations:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {responseQuality.recommendations.map((recommendation, idx) => (
                        <Typography component="li" key={idx} variant="body2" sx={{ mb: 0.5 }}>
                          {recommendation}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper sx={{
            p: 3,
            bgcolor: theme.cardBg,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            height: '100%',
            transition: 'background-color 0.3s ease',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon sx={{ mr: 1, color: theme.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Question Categories
              </Typography>
            </Box>

            {questionCategories.length > 0 ? (
              <Box>
                {questionCategories.map((category, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#aaa' : '#666' }}>
                        {category.count} questions
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(category.count / interviewQuestions.length) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor:
                            category.name.toLowerCase() === 'behavioral' ? theme.primary :
                            category.name.toLowerCase() === 'technical' ? theme.secondary :
                            category.name.toLowerCase() === 'situational' ? theme.warning :
                            theme.success
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: mode === 'dark' ? '#aaa' : '#666' }}>
                No categorized questions in this session.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{
            p: 3,
            bgcolor: theme.cardBg,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s ease',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FormatQuoteIcon sx={{ mr: 1, color: theme.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notable Responses
              </Typography>
            </Box>

            {notableResponses.length > 0 ? (
              <Box>
                {notableResponses.map((response, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: theme.primary
                    }}>
                      Q: {response.question}
                    </Typography>
                    <Typography variant="body2" sx={{
                      mb: 2,
                      color: mode === 'dark' ? '#ddd' : '#333',
                      fontStyle: 'italic'
                    }}>
                      "{response.answer.length > 150 ?
                        response.answer.substring(0, 150) + '...' :
                        response.answer}"
                    </Typography>
                    {index < notableResponses.length - 1 && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: mode === 'dark' ? '#aaa' : '#666' }}>
                No responses to analyze yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
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
      </Box>
    </Box>
  );
};

export default SessionProgress;
