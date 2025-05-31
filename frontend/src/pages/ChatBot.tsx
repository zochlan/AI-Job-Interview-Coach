import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  GlobalStyles,
  Chip
} from '@mui/material';
import { css } from '@emotion/react';
import ReactMarkdown from 'react-markdown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SaveIcon from '@mui/icons-material/Save';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SendIcon from '@mui/icons-material/Send';
import { useThemeContext } from '../contexts/ThemeContext';
import { useCVContext } from '../contexts/CVContext';
import { useMobile } from '../hooks/useMobile';
import SessionsSidebar from '../components/SessionsSidebar';
import ModelSelector from '../components/ModelSelector';
import { ChatMessage } from '../types/chatTypes';
import { saveSession, getSessionById, updateSession, getSavedSessions } from '../utils/sessionUtils';
import { mapCategoryToQuestionType } from '../utils/questionTypeUtils';

// Import the global styles
const globalStyles = css`
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100%;
    width: 100%;
  }

  #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;


function ChatBot() {
  const { mode, theme } = useThemeContext();
  const { cvData, isCVLoaded } = useCVContext();
  const history = useHistory();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('llama3-8b-8192');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Close sidebar by default on mobile

  // Get session ID and CV usage from URL if present
  const urlParams = new URLSearchParams(location.search);
  const sessionId = urlParams.get('sessionId');
  const usesCV = urlParams.get('usesCV') === 'true';

  // Handle menu open/close
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load session data if sessionId is present
  useEffect(() => {
    if (sessionId) {
      const savedSession = getSessionById(sessionId);
      if (savedSession) {
        // Coach mode has been removed, always using interview mode
        // No need to set interview mode based on session type

        // Set the messages from the saved session
        setMessages(savedSession.messages);

        // Store the current session ID in session storage
        window.sessionStorage.setItem('currentSessionId', sessionId);

        // Update URL with CV usage from session metadata if not already in URL
        if (urlParams.get('usesCV') === null && savedSession.metadata?.usesCV !== undefined) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('usesCV', savedSession.metadata.usesCV.toString());
          window.history.replaceState({}, '', newUrl.toString());
        }
      } else {
        // If session ID is invalid, initialize with a greeting message
        initializeWithGreeting().catch(error => {
          console.error('Error initializing with greeting:', error);
        });
      }
    } else {
      // No session ID, initialize with a greeting message
      initializeWithGreeting().catch(error => {
        console.error('Error initializing with greeting:', error);
      });
    }

    // Profile check removed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Remove interviewMode from dependencies to prevent re-initialization

  // Helper function to generate a specific fallback message with CV data
  const generateSpecificFallbackWithCV = (cvData: any): string => {
    if (!cvData) return "Hello! I've reviewed your CV. Could you tell me about a challenging project you've worked on recently?";

    // Extract data from CV
    const skills = cvData.skills || [];
    const targetJob = cvData.target_job || cvData.jobRole || 'this position';
    const experience = cvData.experience || '';
    const education = cvData.education || '';

    // Create a more specific question based on available CV data

    // If we have skills, always reference a specific one
    if (skills.length > 0) {
      // Use the first two skills for more specificity
      const skill1 = skills[0];
      const skill2 = skills.length > 1 ? skills[1] : null;

      if (skill2) {
        return `Hello! I've reviewed your CV and noticed your experience with both ${skill1} and ${skill2}. Could you describe a specific project where you had to use these skills together and what challenges you faced?`;
      } else {
        return `Hello! I've reviewed your CV and noticed your experience with ${skill1}. Could you tell me about a specific challenging project where you applied this skill and what obstacles you had to overcome?`;
      }
    }

    // If we have experience but no skills
    if (experience) {
      return `Hello! I've reviewed your CV and noticed your professional experience. Could you tell me about a specific challenge you faced in your most recent role and how you approached solving it?`;
    }

    // If we have education but no skills or experience
    if (education) {
      return `Hello! I've reviewed your CV and noticed your educational background. Could you tell me about a specific project or coursework that prepared you for the ${targetJob} role you're pursuing?`;
    }

    // If we have a target job but limited other information
    if (targetJob) {
      return `Hello! I've reviewed your CV and see you're interested in a ${targetJob} role. What specific skills or experiences do you think make you particularly well-suited for this position?`;
    }

    // Most generic fallback with CV acknowledgment, but still asking for specifics
    return "Hello! I've reviewed your CV. Could you tell me about a specific challenging project you've worked on recently and how you approached solving any obstacles you encountered?";
  };

  // Helper function to initialize with greeting - wrapped in useCallback to prevent recreation on every render
  const initializeWithGreeting = useCallback(async () => {
    // Clear any existing session ID when starting fresh
    if (!sessionId) {
      window.sessionStorage.removeItem('currentSessionId');
    }

    // Check if CV data is available and CV usage is enabled
    const cvDataAvailable = isCVLoaded && usesCV;

    setLoading(true);

    try {
      // Import the Groq API module dynamically
      const groqApiModule = await import('../utils/groqApi');

      // Generate the initial question using the Groq API with enhanced sequencing
      // Set a flag in sessionStorage to indicate this is a new session
      window.sessionStorage.setItem('isNewSession', 'true');

      const generatedQuestion = await groqApiModule.generateQuestion(
        [], // Empty chat history for initial message
        cvDataAvailable ? cvData : null,
        selectedModel,
        true // This is a new session - explicitly set to true
      );

      // Create a more structured initial message with enhanced metadata
      const initialMsg: ChatMessage = {
        id: 1,
        message: generatedQuestion.text,
        timestamp: new Date().toLocaleTimeString(),
        isInterviewQuestion: true,
        questionType: 'introductory' as 'introductory', // First questions are always introductory - use type assertion
        questionMetadata: {
          id: generatedQuestion.id,
          category: generatedQuestion.category || 'initial',
          difficulty: generatedQuestion.difficulty || 'easy',
          isAIGenerated: true,
          interviewStage: 'initial' // Mark this as the initial stage
        }
      };

      setMessages([initialMsg]);
    } catch (error) {
      console.error('Error generating initial question:', error);

      // Fallback to a more realistic greeting if API fails
      const fallbackMsg: ChatMessage = {
        id: 1,
        message: cvDataAvailable ?
          generateSpecificFallbackWithCV(cvData) :
          "Hello! I'm Sarah, and I'll be conducting your interview today. Thank you for joining us. To get started, could you please tell me a bit about yourself and what position you're interviewing for?",
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages([fallbackMsg]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, usesCV, selectedModel, cvData, isCVLoaded]);

  // Ensure we have an initial message when component mounts
  useEffect(() => {
    // If there are no messages, initialize with a greeting
    if (messages.length === 0) {
      // Call the async function without awaiting it in useEffect
      initializeWithGreeting().catch(error => {
        console.error('Error initializing with greeting:', error);
      });
    }
  }, [messages.length, initializeWithGreeting]);

  // Log CV usage status for debugging
  useEffect(() => {
    // Get CV analysis from context if CV usage is enabled
    let cvAnalysis = null;
    if (usesCV && isCVLoaded) {
      cvAnalysis = cvData;
    }

    console.log('CV usage status:', usesCV ? (cvAnalysis ? 'Using CV data' : 'CV usage enabled but no CV data found') : 'Not using CV data');

    // Show warning in console if CV usage is enabled but no data is available
    if (usesCV && !cvAnalysis) {
      console.warn('CV usage is enabled but no CV data was found');
    }
  }, [usesCV, isCVLoaded, cvData]);

  // Feedback functionality has been removed

  // Render feedback for bot messages - removed as per user request
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderBotFeedback = (_msg: ChatMessage, _idx: number) => {
    // Feedback functionality has been removed
    return null;
  };

  // Send message function
  const sendMessage = async (userMsg?: ChatMessage) => {
    if (loading) return;

    if (!userMsg && !input.trim()) return;

    setLoading(true);

    const userMessage: ChatMessage = userMsg || {
      id: 0,
      message: input,
      timestamp: new Date().toLocaleTimeString()
    };

    // Add user message to chat
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Import the Groq API module dynamically for enhanced question generation
      const groqApiModule = await import('../utils/groqApi');

      // Get CV analysis from context if CV usage is enabled
      let cvAnalysis = null;
      if (usesCV && isCVLoaded) {
        cvAnalysis = cvData;
      }

      // Generate the next question using the enhanced Groq API with adaptive sequencing
      const nextQuestion = await groqApiModule.generateQuestion(
        updatedMessages, // Include all previous messages for context
        cvAnalysis,      // Include CV data if available
        selectedModel,   // Use the selected model
        false            // Not a new session
      );

      // Analyze the user's response to provide better follow-up questions
      let responseAnalysis = null;
      if (updatedMessages.length > 1) {
        try {
          // Get the last bot question
          const lastBotMessage = updatedMessages
            .filter(msg => msg.id === 1)
            .pop();

          if (lastBotMessage) {
            // Analyze the user's response to the last question
            responseAnalysis = await groqApiModule.analyzeResponse(
              lastBotMessage.message,
              userMessage.message,
              selectedModel,
              updatedMessages.slice(0, -1) // All messages except the current user message
            );

            console.log('Response analysis:', responseAnalysis);
          }
        } catch (error) {
          console.error('Error analyzing response:', error);
        }
      }

      // Using the imported mapCategoryToQuestionType utility function

      // Create the bot response with enhanced metadata
      const botResponse: ChatMessage = {
        id: 1,
        message: nextQuestion.text,
        timestamp: new Date().toLocaleTimeString(),
        isInterviewQuestion: true,
        questionType: mapCategoryToQuestionType(nextQuestion.category || 'general'),
        key_topics: responseAnalysis?.key_topics || [],
        follow_up_suggestions: responseAnalysis?.follow_up_suggestions || [],
        questionMetadata: {
          id: nextQuestion.id || `question-${Date.now()}`,
          category: nextQuestion.category || 'general',
          difficulty: nextQuestion.difficulty || 'medium',
          isAIGenerated: true,
          interviewStage: nextQuestion.category || 'middle' // Use the category as the interview stage
        }
      };

      // If we have analysis data, add it to the user's message
      if (responseAnalysis) {
        userMessage.analysis = responseAnalysis.completeness;
        userMessage.strengths = responseAnalysis.strengths;
        userMessage.improvement_tips = responseAnalysis.improvement_tips;
        userMessage.star_score = responseAnalysis.star_rating;
        userMessage.is_behavioral_question = responseAnalysis.is_behavioral_question;
        userMessage.star_analysis = responseAnalysis.star_analysis;
      }

      // Add the bot response to the chat
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, botResponse];

        // Save the updated messages to the session
        const currentSessionId = window.sessionStorage.getItem('currentSessionId');
        if (currentSessionId) {
          // Update existing session
          const updated = updateSession(currentSessionId, newMessages, 'interview', { usesCV });
          if (!updated) {
            console.log('Session not updated - likely no user responses yet');

            // Try to create a new session if update failed
            const newSessionId = saveSession(newMessages, 'interview', false, { usesCV });
            if (newSessionId) {
              console.log('Created new session after update failure:', newSessionId);
              window.sessionStorage.setItem('currentSessionId', newSessionId);

              // Update URL with session ID and CV usage
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('sessionId', newSessionId);
              newUrl.searchParams.set('usesCV', usesCV.toString());
              window.history.replaceState({}, '', newUrl.toString());
            }
          }
        } else {
          // Create a new session
          const newSessionId = saveSession(newMessages, 'interview', false, { usesCV });

          // Only update session storage and URL if a session was actually created
          if (newSessionId) {
            console.log('Created new session:', newSessionId);
            window.sessionStorage.setItem('currentSessionId', newSessionId);

            // No need to save to localStorage again as saveSession already does this
            // This was causing duplicate sessions

            // Update URL with session ID and CV usage
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('sessionId', newSessionId);
            newUrl.searchParams.set('usesCV', usesCV.toString());
            window.history.replaceState({}, '', newUrl.toString());
          } else {
            console.log('Session not created - likely no user responses yet');
          }
        }

        // Check if this is the final message (interview complete)
        const isComplete = botResponse.questionMetadata?.isComplete === true;

        // Check if we've reached the maximum number of questions (15)
        // Each exchange is 2 messages (user + bot), so 30 messages = 15 exchanges
        const questionCount = Math.floor(newMessages.length / 2);
        const maxQuestionsReached = questionCount >= 15;

        // Log the question count for debugging
        console.log(`Current question count: ${questionCount}/15`);

        // If we're approaching the end (13+ questions), add a note to the bot's response
        if (questionCount >= 13 && questionCount < 15 && !isComplete) {
          // Add a note about approaching the end of the interview
          const remainingQuestions = 15 - questionCount;
          botResponse.message += `\n\n(${remainingQuestions} more question${remainingQuestions > 1 ? 's' : ''} remaining in this interview session)`;
        }

        if (isComplete || maxQuestionsReached) {
          // If we've reached the maximum questions, mark the last message as complete
          if (maxQuestionsReached && !isComplete) {
            console.log('Maximum question count reached (15). Redirecting to session analysis.');

            // Add a conclusive message to the bot's response
            botResponse.message += `\n\nThank you for completing this interview session! We've reached the end of our structured interview questions. I'll now provide you with a comprehensive analysis of your performance.`;

            // Mark the message as complete
            if (botResponse.questionMetadata) {
              botResponse.questionMetadata.isComplete = true;
            }
          }

          setTimeout(() => {
            try {
              // Clear current session ID to force creating a new session
              window.sessionStorage.removeItem('currentSessionId');

              // Save the session and navigate to the summary page
              const newSessionId = saveSession(newMessages, 'interview', true);
              if (newSessionId) {
                console.log('Interview complete, navigating to session summary:', newSessionId);

                // Save to localStorage as a backup
                localStorage.setItem(`session_${newSessionId}`, JSON.stringify({
                  id: newSessionId,
                  messages: newMessages,
                  type: 'interview',
                  usesCV: usesCV,
                  completed: true,
                  completedAt: new Date().toISOString()
                }));

                // Note: We don't need to manually add to interview-sessions collection
                // as saveSession() already does this. This was causing duplicate sessions.

                // Navigate to the session summary page
                history.push(`/session/${newSessionId}`);
              } else {
                console.error('Failed to save session for summary view');
                // Try one more time with a different approach
                try {
                  const backupSessionId = `session-${Date.now()}`;
                  localStorage.setItem(`session_${backupSessionId}`, JSON.stringify({
                    id: backupSessionId,
                    messages: newMessages,
                    type: 'interview',
                    usesCV: usesCV,
                    completed: true,
                    completedAt: new Date().toISOString()
                  }));

                  console.log('Created backup session:', backupSessionId);
                  history.push(`/session/${backupSessionId}`);
                } catch (e) {
                  console.error('Backup session creation failed:', e);
                  // Fallback to home page if all session saving fails
                  history.push('/');
                }
              }
            } catch (error) {
              console.error('Error during session completion:', error);
              // Fallback to home page if there's an error
              history.push('/');
            }
          }, 3000); // 3 second delay to allow reading the final message
        }

        return newMessages;
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles styles={globalStyles} />
      <Box sx={{
        height: '100vh',
        width: '100vw',
        background: theme.containerBg,
        display: 'flex',
        pt: { xs: 0, md: 0 },
        pb: { xs: 0, md: 0 },
        transition: 'background 0.3s ease',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Sessions Sidebar */}
        <SessionsSidebar
          currentSessionId={sessionId || ''}
          onSessionSelect={(id) => {
            history.push(`/chatbot?sessionId=${id}`);
          }}
          mode={mode}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <Box sx={{
          flexGrow: 1,
          ml: { xs: 0, md: sidebarOpen ? '280px' : '0px' },
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          width: '100%',
          transition: 'margin 0.3s ease',
          bgcolor: mode === 'dark' ? '#1a1a2e' : '#ffffff',
          overflow: 'hidden',
        }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100vh',
              pt: 0,
              pb: 0,
              overflow: 'hidden'
            }}
          >
            <Paper elevation={0} sx={{
              p: 0, // Remove padding from container
              borderRadius: 0, // No border radius for main container
              boxShadow: 'none', // No shadow for main container
              bgcolor: mode === 'dark' ? '#1e1e2d' : '#ffffff',
              width: '100%', // Full width
              maxWidth: '100%', // Full width
              mx: 0,
              height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 64px)' },
              mt: '64px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between', // Space between for fixed header and footer
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeIn 0.5s ease-out forwards',
              border: 'none', // No border
              overflowX: 'hidden',
              flexGrow: 1 // Make sure it grows to fill available space
            }}>
              {/* Mode and CV Indicators Container */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  zIndex: 10,
                }}
              >
                {/* Top container for indicators and progress bar */}
                <Box sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mt: 1.5,
                  mb: 2,
                  gap: 2
                }}>
                  {/* Mode Indicators Row */}
                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>

                    {/* CV Data Indicator */}
                    <Box
                      sx={{
                        bgcolor: usesCV
                          ? (mode === 'dark' ? 'rgba(95, 159, 255, 0.12)' : 'rgba(79, 140, 255, 0.12)')
                          : (mode === 'dark' ? 'rgba(255, 95, 95, 0.12)' : 'rgba(255, 79, 79, 0.12)'),
                        color: usesCV
                          ? (mode === 'dark' ? '#82b1ff' : '#1565c0')
                          : (mode === 'dark' ? '#ff9d9d' : '#d32f2f'),
                        px: 2,
                        py: 0.5,
                        borderRadius: 16,
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        border: usesCV
                          ? `1px solid ${mode === 'dark' ? 'rgba(95, 159, 255, 0.2)' : 'rgba(79, 140, 255, 0.2)'}`
                          : `1px solid ${mode === 'dark' ? 'rgba(255, 95, 95, 0.2)' : 'rgba(255, 79, 79, 0.2)'}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <span role="img" aria-label="CV" style={{ fontSize: '0.9rem' }}>📄</span>
                      {usesCV ? 'CV Analysis Active' : 'CV Analysis Inactive'}
                    </Box>
                  </Box>

                  {/* Model Selector - Moved to a better position */}
                  <Box sx={{
                    position: 'absolute',
                    top: 15,
                    right: 20,
                    width: '180px',
                    zIndex: 1300 // Higher z-index to ensure it's above everything
                  }}>
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Session Progress Bar */}
                <Box sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                }}>
                  <Box sx={{
                    width: '100%',
                    maxWidth: '1000px',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'transparent',
                    px: 3,
                  }}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.8,
                      px: 1
                    }}>
                      <Tooltip
                        title="The interview consists of 15 questions across different stages: introductory (1), warm-up (2), behavioral (4), technical (4), strategic (3), and closing (1). Questions adapt based on your previous answers."
                        arrow
                        placement="bottom"
                      >
                        <Typography sx={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'help'
                        }}>
                          Interview Progress (15 questions total)
                          <Box component="span" sx={{
                            display: 'inline-flex',
                            ml: 0.5,
                            color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            fontSize: '0.9rem'
                          }}>
                            ⓘ
                          </Box>
                        </Typography>
                      </Tooltip>
                      <Typography sx={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                        ...(Math.min(Math.floor(messages.length / 2), 15) >= 15 && {
                          color: mode === 'dark' ? '#ff9d9d' : '#d32f2f',
                          fontWeight: 700
                        })
                      }}>
                        {Math.min(Math.floor(messages.length / 2), 15)} / 15 questions
                        {Math.min(Math.floor(messages.length / 2), 15) >= 15 && ' (Complete)'}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: '100%',
                      height: '12px',
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                      display: 'flex',
                      position: 'relative',
                    }}>
                      {/* Progress bar with stages */}
                      <Box sx={{
                        width: `${Math.min(Math.floor(messages.length / 2) / 15 * 100, 100)}%`,
                        height: '100%',
                        bgcolor: messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete
                          ? '#4caf50' // Green for completed interview
                          : '#e91e63', // Pink for in-progress
                        borderRadius: '3px',
                        transition: 'width 0.3s ease, background-color 0.5s ease',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1
                      }} />

                      {/* Stage markers */}
                      <Tooltip title="Introductory" arrow placement="top">
                        <Box sx={{
                          width: '6.67%', // 1/15 of total width
                          height: '100%',
                          borderRight: `2px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                          position: 'relative',
                          zIndex: 2
                        }} />
                      </Tooltip>

                      <Tooltip title="Warm-up" arrow placement="top">
                        <Box sx={{
                          width: '13.33%', // 2/15 of total width
                          height: '100%',
                          borderRight: `2px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                          position: 'relative',
                          zIndex: 2
                        }} />
                      </Tooltip>

                      <Tooltip title="Behavioral" arrow placement="top">
                        <Box sx={{
                          width: '26.67%', // 4/15 of total width
                          height: '100%',
                          borderRight: `2px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                          position: 'relative',
                          zIndex: 2
                        }} />
                      </Tooltip>

                      <Tooltip title="Technical" arrow placement="top">
                        <Box sx={{
                          width: '26.67%', // 4/15 of total width
                          height: '100%',
                          borderRight: `2px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                          position: 'relative',
                          zIndex: 2
                        }} />
                      </Tooltip>

                      <Tooltip title="Strategic" arrow placement="top">
                        <Box sx={{
                          width: '20%', // 3/15 of total width
                          height: '100%',
                          borderRight: `2px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                          position: 'relative',
                          zIndex: 2
                        }} />
                      </Tooltip>

                      <Tooltip title="Closing" arrow placement="top">
                        <Box sx={{
                          width: '6.67%', // 1/15 of total width
                          height: '100%',
                          position: 'relative',
                          zIndex: 2
                        }} />
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>

              {/* Chat messages container */}
              <Box sx={{
                flexGrow: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                mt: 10, // Reduced margin top to account for new progress bar position
                display: 'flex',
                flexDirection: 'column',
                gap: 0, // No gap between message groups
                pb: 4, // Add padding at bottom to ensure last message is visible
                width: '100%',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                }
              }}>
                {messages.map((msg, idx) => (
                  <Box
                    key={`${msg.id}-${idx}`}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      py: 4, // Vertical padding between message groups
                      px: { xs: 4, md: 8 }, // Horizontal padding
                      bgcolor: msg.id === 1
                        ? mode === 'dark' ? 'rgba(52, 53, 65, 0.7)' : 'rgba(247, 247, 248, 0.7)'
                        : 'transparent',
                      borderTop: msg.id === 1 && idx > 0 ? `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                      borderBottom: msg.id === 0 ? `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                      animation: 'fadeIn 0.3s ease-out forwards',
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '1000px',
                        width: '100%',
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 3,
                      }}
                    >
                      {/* Avatar/Icon for the message */}
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: msg.id === 0
                            ? mode === 'dark' ? 'rgba(95, 159, 255, 0.2)' : 'rgba(79, 140, 255, 0.15)'
                            : mode === 'dark' ? '#10a37f' : '#10a37f',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                          alignSelf: 'flex-start', // Align to the top of the message
                          mt: 0.5,
                        }}
                      >
                        {msg.id === 0 ? 'U' : 'AI'}
                      </Box>

                      {/* Message content */}
                      <Box
                        sx={{
                          flex: 1,
                        }}
                    >
                      {/* Display AI indicator if it's an AI-generated question */}
                      {msg.id === 1 && msg.questionMetadata?.isAIGenerated && (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 1,
                          gap: 0.5
                        }}>
                          <Chip
                            size="small"
                            label="AI Generated"
                            sx={{
                              bgcolor: mode === 'dark' ? 'rgba(156, 39, 176, 0.15)' : 'rgba(156, 39, 176, 0.1)',
                              color: '#9c27b0',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              height: '20px',
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            This question was generated by AI
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.text,
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.id === 0 ? (
                          msg.message
                        ) : (
                          <ReactMarkdown>
                            {/* Remove [AI] prefix if present */}
                            {msg.message.startsWith('[AI]')
                              ? msg.message.substring(4).trim()
                              : msg.message
                            }
                          </ReactMarkdown>
                        )}
                      </Typography>

                      {/* Timestamp */}
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1.5,
                          color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {msg.timestamp}
                      </Typography>

                      {/* Feedback for bot messages */}
                      {msg.id !== 0 && renderBotFeedback(msg, idx)}
                    </Box>
                  </Box>
                  </Box>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      py: 4,
                      px: { xs: 4, md: 8 },
                      bgcolor: mode === 'dark' ? 'rgba(52, 53, 65, 0.7)' : 'rgba(247, 247, 248, 0.7)',
                      borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '1000px',
                        width: '100%',
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 3,
                      }}
                    >
                      {/* Avatar for loading */}
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: mode === 'dark' ? '#10a37f' : '#10a37f',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                          alignSelf: 'flex-start', // Align to the top of the message
                          mt: 0.5,
                        }}
                      >
                        AI
                      </Box>

                      {/* Loading animation */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{
                          display: 'flex',
                          gap: 1,
                          alignItems: 'center',
                          '& span': {
                            width: '8px',
                            height: '8px',
                            backgroundColor: mode === 'dark' ? '#10a37f' : '#10a37f',
                            borderRadius: '50%',
                            display: 'inline-block',
                            margin: '0 2px',
                            opacity: 0.7,
                            animation: 'pulse 1.5s infinite ease-in-out',
                            '&:nth-of-type(1)': { animationDelay: '0s' },
                            '&:nth-of-type(2)': { animationDelay: '0.2s' },
                            '&:nth-of-type(3)': { animationDelay: '0.4s' },
                          },
                          '@keyframes pulse': {
                            '0%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
                            '50%': { transform: 'scale(1.2)', opacity: 1 },
                          }
                        }}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Interview Complete Indicator */}
                {messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete && (
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      py: 4,
                      px: { xs: 4, md: 8 },
                      bgcolor: mode === 'dark' ? 'rgba(52, 53, 65, 0.7)' : 'rgba(247, 247, 248, 0.7)',
                      borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '1000px',
                        width: '100%',
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 2,
                        animation: 'fadeIn 0.5s ease-out forwards'
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#4caf50',
                          color: '#fff',
                          fontSize: '20px',
                          fontWeight: 'bold',
                        }}
                      >
                        ✓
                      </Box>
                      <Typography sx={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#4caf50'
                      }}>
                        Interview Complete!
                      </Typography>
                      <Typography sx={{
                        fontSize: '16px',
                        maxWidth: '600px',
                        color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                      }}>
                        You will be redirected to the session summary page in a few seconds...
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Reference for scrolling to bottom */}
                <div ref={messagesEndRef} />
              </Box>

              {/* Streamlined action buttons */}
              <Box sx={{
                px: 3,
                py: 2,
                borderTop: `1px solid ${theme.border}`,
                bgcolor: theme.background,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'center',
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
              }}>
                {/* Next Question Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    // Don't do anything if we've reached the maximum number of questions
                    if (Math.floor(messages.length / 2) >= 15) {
                      return;
                    }

                    setLoading(true);

                    try {
                      // Get CV analysis from context if CV usage is enabled
                      const cvAnalysis = usesCV && isCVLoaded ? cvData : null;

                      // We'll always use the Groq API for question generation

                      // Import the Groq API module dynamically
                      const groqApiModule = await import('../utils/groqApi');

                      // Get the next structured question based on conversation history
                      let nextQuestion = await groqApiModule.generateQuestion(
                        messages,
                        cvAnalysis,
                        selectedModel,
                        false
                      );

                      // Check if this question was already asked (as a safety measure)
                      const botMessages = messages.filter(msg => msg.id === 1);
                      let attempts = 0;
                      const maxAttempts = 5;

                      // Try to find a unique question if the first one is a duplicate
                      while (attempts < maxAttempts) {
                        // Store current question properties to avoid closure issues
                        const currentQuestionId = nextQuestion.id;
                        const currentQuestionText = nextQuestion.text.substring(0, 30);

                        // eslint-disable-next-line no-loop-func
                        const isDuplicate = botMessages.some(msg =>
                          msg.questionMetadata?.id === currentQuestionId ||
                          msg.message.includes(currentQuestionText)
                        );

                        if (!isDuplicate) {
                          break;
                        }

                        // Try another question with different parameters
                        nextQuestion = await groqApiModule.generateQuestion(
                          messages,
                          cvAnalysis,
                          selectedModel,
                          false
                        );
                        attempts++;

                        // If we've tried several times and still getting duplicates,
                        // add a prefix to make it clear we're moving to a new topic
                        if (attempts === maxAttempts - 1) {
                          nextQuestion.text = "Let's explore a different topic. " + nextQuestion.text;
                          break;
                        }
                      }

                      // Check if it's an AI-generated question
                      const isAIGenerated = nextQuestion.isAIGenerated === true;

                      // Check if this is the final question (interview complete)
                      let isComplete = nextQuestion.isComplete === true;

                      // If this would be the 15th question, mark it as complete
                      const questionCount = Math.floor((messages.length + 1) / 2); // +1 for the new bot message
                      if (questionCount >= 15 && !isComplete) {
                        console.log('This is the 15th question. Marking it as complete.');
                        isComplete = true;
                      }

                      // If this is the final question, disable the Next Question button after adding it
                      if (isComplete) {
                        // Save the session since the interview is complete
                        // If we already have a session ID, update that session
                        if (sessionId) {
                          updateSession(sessionId, messages, 'interview');
                        } else {
                          // Otherwise create a new session
                          const newSessionId = saveSession(messages, 'interview', true);
                          if (newSessionId) {
                            // Update URL with session ID without reloading the page
                            const newUrl = `${window.location.pathname}?sessionId=${newSessionId}`;
                            window.history.pushState({ path: newUrl }, '', newUrl);
                          }
                        }
                      }

                      // Using the imported mapCategoryToQuestionType utility function

                      // Create a bot message with the structured question
                      const botMsg: ChatMessage = {
                        id: 1,
                        message: nextQuestion.text,
                        timestamp: new Date().toLocaleTimeString(),
                        isInterviewQuestion: true,
                        questionType: mapCategoryToQuestionType(nextQuestion.category || 'general'),
                        // Store metadata about the question for future reference
                        questionMetadata: {
                          id: nextQuestion.id,
                          category: nextQuestion.category || 'general',
                          difficulty: nextQuestion.difficulty || 'medium',
                          isAIGenerated: isAIGenerated,
                          isComplete: isComplete
                        }
                      };

                      // Add the message to the chat without saving a new session
                      setMessages(prevMessages => {
                        const updatedMessages = [...prevMessages, botMsg];

                        // Only update existing session if we have a sessionId
                        if (sessionId) {
                          updateSession(sessionId, updatedMessages, 'interview');
                        }

                        // If this is the final question (interview complete), automatically navigate to the summary page
                        // after a short delay to allow the user to see the final message
                        if (isComplete) {
                          setTimeout(() => {
                            try {
                              // Clear current session ID to force creating a new session
                              window.sessionStorage.removeItem('currentSessionId');

                              // Save the session and navigate to the summary page
                              const newSessionId = saveSession(updatedMessages, 'interview', true);
                              if (newSessionId) {
                                console.log('Interview complete, navigating to session summary:', newSessionId);
                                // Navigate to the session summary page
                                history.push(`/session/${newSessionId}`);
                              } else {
                                console.error('Failed to save session for summary view');
                                // Fallback to home page if session saving fails
                                history.push('/');
                              }
                            } catch (error) {
                              console.error('Error during session completion:', error);
                              // Fallback to home page if there's an error
                              history.push('/');
                            }
                          }, 5000); // 5 second delay to allow reading the final message
                        }

                        return updatedMessages;
                      });
                    } catch (error) {
                      console.error('Error generating next question:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || (messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete) || Math.floor(messages.length / 2) >= 15}
                  sx={{
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    px: 2,
                    py: 0.5,
                    borderColor: '#2196f3',
                    color: '#2196f3',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      borderColor: '#1976d2',
                    },
                    ...((messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete) || Math.floor(messages.length / 2) >= 15 ? {
                      borderColor: '#9e9e9e',
                      color: '#9e9e9e',
                      cursor: 'not-allowed',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        borderColor: '#9e9e9e',
                      }
                    } : {})
                  }}
                >
                  Next Question
                </Button>

                {/* Menu button for additional options */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleMenuClick}
                  disabled={loading}
                  endIcon={<MoreVertIcon />}
                  sx={{
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    px: 2,
                    py: 0.5,
                    borderColor: theme.border,
                    color: theme.text,
                    '&:hover': {
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }
                  }}
                >
                  More Options
                </Button>

                {/* Dropdown Menu */}
                <Menu
                  anchorEl={menuAnchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  slotProps={{
                    paper: {
                      elevation: 3,
                      sx: {
                        mt: 1.5,
                        minWidth: 200,
                        borderRadius: 2,
                        bgcolor: mode === 'dark' ? '#1e1e2d' : '#ffffff',
                        boxShadow: mode === 'dark'
                          ? '0 8px 16px rgba(0,0,0,0.4)'
                          : '0 8px 16px rgba(0,0,0,0.1)',
                        '& .MuiMenuItem-root': {
                          py: 1.2,
                          px: 2,
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem
                    onClick={async () => {
                      // Don't do anything if interview is complete or we've reached the maximum number of questions
                      if ((messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete) || Math.floor(messages.length / 2) >= 15) {
                        return;
                      }

                      handleMenuClose();
                      setLoading(true);

                      try {
                        // Get CV analysis from context if CV usage is enabled
                        const cvAnalysis = usesCV && isCVLoaded ? cvData : null;

                        // Import the Groq API module dynamically
                        const groqApiModule = await import('../utils/groqApi');

                        // Get a random AI-generated question
                        const randomQuestion = await groqApiModule.generateQuestion(
                          messages,
                          cvAnalysis,
                          selectedModel,
                          false
                        );

                        // Using the imported mapCategoryToQuestionType utility function

                        // Create a bot message with the new question and metadata
                        const botMsg: ChatMessage = {
                          id: 1,
                          message: "Let's try a different question. " + randomQuestion.text,
                          timestamp: new Date().toLocaleTimeString(),
                          isInterviewQuestion: true,
                          questionType: mapCategoryToQuestionType(randomQuestion.category || 'general'),
                          questionMetadata: {
                            id: randomQuestion.id,
                            category: randomQuestion.category || 'general',
                            difficulty: randomQuestion.difficulty || 'medium',
                            isAIGenerated: true,
                            isComplete: randomQuestion.isComplete
                          }
                        };

                        // Add the message to the chat without saving a new session
                        setMessages(prevMessages => {
                          const updatedMessages = [...prevMessages, botMsg];

                          // Only update existing session if we have a sessionId
                          if (sessionId) {
                            updateSession(sessionId, updatedMessages, 'interview');
                          }

                          return updatedMessages;
                        });
                      } catch (error) {
                        console.error('Error generating random question:', error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={(messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete) || Math.floor(messages.length / 2) >= 15}
                    sx={{
                      ...((messages.length > 0 && messages[messages.length - 1]?.questionMetadata?.isComplete) || Math.floor(messages.length / 2) >= 15 ? {
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      } : {})
                    }}
                  >
                    <ListItemIcon>
                      <QuestionAnswerIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText>
                      Get Random Question
                    </ListItemText>
                  </MenuItem>

                  <MenuItem onClick={() => {
                    handleMenuClose();
                    setInput("What are common interview mistakes?");
                    setTimeout(() => sendMessage(), 100);
                  }}>
                    <ListItemIcon>
                      <TipsAndUpdatesIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText>
                      Interview Tips
                    </ListItemText>
                  </MenuItem>

                  <MenuItem onClick={() => {
                    handleMenuClose();
                    // Check if there are any user responses in the messages
                    const hasUserResponses = messages.some(msg => msg.id === 0);

                    if (!hasUserResponses) {
                      alert("Please respond to at least one question before saving the session.");
                      return;
                    }

                    if (messages.length > 2) {
                      // Clear current session ID to force creating a new session
                      window.sessionStorage.removeItem('currentSessionId');

                      // Save as a new session
                      // First, check if this session already exists to avoid duplicates
                      const existingSessions = getSavedSessions();
                      const isDuplicate = existingSessions.some((session: any) => {
                        // Check if messages are similar (same length and first/last messages match)
                        if (!session.messages || session.messages.length !== messages.length) return false;

                        // Compare first and last messages
                        const firstMatch = session.messages[0]?.message === messages[0]?.message;
                        const lastMatch = session.messages[session.messages.length - 1]?.message ===
                                         messages[messages.length - 1]?.message;

                        return firstMatch && lastMatch;
                      });

                      if (isDuplicate) {
                        alert('This session is already saved. No need to save it again.');
                        return;
                      }

                      const newSessionId = saveSession(messages, 'interview', true);
                      if (newSessionId) {
                        // Update URL with session ID without reloading the page
                        const newUrl = `${window.location.pathname}?sessionId=${newSessionId}`;
                        window.history.pushState({ path: newUrl }, '', newUrl);
                        // Show confirmation
                        alert('Session saved as new! You can now bookmark this page to return to this conversation later.');
                      } else {
                        alert("Could not save the session. Please make sure you've responded to at least one question.");
                      }
                    } else {
                      alert("Please have a conversation first before saving.");
                    }
                  }}>
                    <ListItemIcon>
                      <SaveIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText>
                      Save Session
                    </ListItemText>
                  </MenuItem>

                  <MenuItem onClick={() => {
                    handleMenuClose();
                    // Check if there are any user responses in the messages
                    const hasUserResponses = messages.some(msg => msg.id === 0);

                    if (!hasUserResponses) {
                      alert("Please respond to at least one question before ending the session.");
                      return;
                    }

                    if (messages.length > 2) {
                      try {
                        // Clear current session ID to force creating a new session
                        window.sessionStorage.removeItem('currentSessionId');

                        // Save the session and navigate to the summary page
                        const newSessionId = saveSession(messages, 'interview', true);
                        if (newSessionId) {
                          console.log('Manually ending session, navigating to summary:', newSessionId);
                          // Navigate to the session summary page
                          history.push(`/session/${newSessionId}`);
                        } else {
                          console.error('Failed to save session when manually ending');
                          alert("Could not save the session. Please make sure you've responded to at least one question.");
                        }
                      } catch (error) {
                        console.error('Error when manually ending session:', error);
                        alert("An error occurred while ending the session. Please try again.");
                      }
                    } else {
                      alert("Please have a conversation first before ending the session.");
                    }
                  }}>
                    <ListItemIcon>
                      <AssessmentIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText>
                      End Session & View Progress
                    </ListItemText>
                  </MenuItem>
                </Menu>
              </Box>

              {/* Fixed Input area at bottom */}
              <Box sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                p: { xs: 1.5, md: 2 },
                pt: { xs: 2, md: 2.5 },
                pb: { xs: 2, md: 2.5 },
                borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                bgcolor: mode === 'dark' ? '#1a1a2e' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                transition: 'background-color 0.3s ease',
                zIndex: 10,
                boxShadow: '0 0 15px rgba(0,0,0,0.1)'
              }}>
                <Box sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center', // Center alignment instead of bottom
                  width: '100%',
                  maxWidth: '1000px',
                  mx: 'auto',
                }}>
                  <TextField
                    fullWidth
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      // Only send on Enter without Shift key
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent new line
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    variant="outlined"
                    size="medium"
                    multiline
                    minRows={1}
                    maxRows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: mode === 'dark' ? '#252836' : '#ffffff',
                        color: theme.text,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                        '&:hover': {
                          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(16, 163, 127, 0.6)',
                          border: '1px solid rgba(16, 163, 127, 0.8)'
                        },
                        '& fieldset': { border: 'none' }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 14px',
                        fontSize: '1rem',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        opacity: 1,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    sx={{
                      minWidth: 'auto',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      bgcolor: mode === 'dark' ? '#6a9fff' : '#2979ff',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        bgcolor: mode === 'dark' ? '#5183e0' : '#1c54b2',
                      },
                      '&:disabled': {
                        bgcolor: mode === 'dark' ? 'rgba(106, 159, 255, 0.3)' : 'rgba(41, 121, 255, 0.3)',
                        color: 'rgba(255,255,255,0.5)'
                      }
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </Button>
                </Box>

                {/* Combined disclaimer and helper text */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '1000px',
                  mx: 'auto',
                  mt: 0.75
                }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      fontSize: '0.7rem',
                      fontStyle: 'italic'
                    }}
                  >
                    Press Shift+Enter for a new line
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      fontSize: '0.7rem',
                    }}
                  >
                    AI Job Interview Coach may produce inaccurate information
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default ChatBot;