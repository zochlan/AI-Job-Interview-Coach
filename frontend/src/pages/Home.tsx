import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { saveSession } from '../utils/sessionUtils';
import CVSelectionDialog from '../components/CVSelectionDialog';



const Home: React.FC = () => {
  const history = useHistory();
  const { isAuthenticated } = useAuth();
  const { mode } = useThemeContext();

  // State for CV selection dialog
  const [cvDialogOpen, setCvDialogOpen] = useState(false);

  const features = [
    {
      icon: <EmojiObjectsIcon />,
      title: 'AI-Powered Analysis',
      description: 'Get instant feedback on your interview responses using advanced NLP technology'
    },
    {
      icon: <SchoolIcon />,
      title: 'Practice Makes Perfect',
      description: 'Practice both technical and behavioral interviews in a realistic setting'
    },
    {
      icon: <AssessmentIcon />,
      title: 'Detailed Feedback',
      description: 'Receive comprehensive feedback on tone, clarity, and content of your responses'
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Track Progress',
      description: 'Monitor your improvement over time with detailed session history'
    }
  ];

  const profile = (() => {
    try {
      const stored = localStorage.getItem('parsed-profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: mode === 'dark'
        ? 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'
        : 'linear-gradient(135deg, #2979ff 0%, #e8f5ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: { xs: 6, md: 10 },
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: mode === 'dark'
          ? 'radial-gradient(circle at 25% 25%, rgba(106, 159, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(106, 159, 255, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(circle at 25% 25%, rgba(41, 121, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(41, 121, 255, 0.1) 0%, transparent 50%)',
        zIndex: 0,
      },
    }}>
      <Container maxWidth="md" disableGutters sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          position: 'relative',
          zIndex: 1,
        }}>
        <Paper elevation={3} sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 1, // Reduced border radius for more box-like appearance
          boxShadow: mode === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 8px 24px rgba(41,121,255,0.15), 0 2px 8px rgba(41,121,255,0.1)',
          bgcolor: mode === 'dark'
            ? 'rgba(37, 37, 54, 0.85)'
            : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          border: mode === 'dark'
            ? '1px solid rgba(106,159,255,0.15)'
            : '1px solid rgba(41,121,255,0.15)',
          width: { xs: '97vw', sm: '90vw', md: '75vw' },
          maxWidth: 900,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          color: (theme: any) => theme.palette.text.primary,
          marginBottom: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: mode === 'dark'
            ? 'linear-gradient(rgba(26, 26, 46, 0.8), rgba(37, 37, 54, 0.8)), url(https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=1200&q=80)'
            : 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=1200&q=80)',
          minHeight: 480,
          overflow: 'hidden',
          animation: 'fadeIn 0.8s ease-out forwards',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(106,159,255,0.05) 0%, transparent 100%)'
              : 'linear-gradient(135deg, rgba(41,121,255,0.05) 0%, transparent 100%)',
            zIndex: 0,
          },
        }}
        aria-label="Hero Section"
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(0,0,0,0.65)'
                : 'rgba(255,255,255,0.65)',
          }}
        />
        <Grid container spacing={2} alignItems="center" style={{ minHeight: '480px', zIndex: 1, position: 'relative' }}>
          <Grid item xs={12} md={7}>
            <Box style={{ padding: 40 }}>
              <Typography
                component="h1"
                variant="h3"
                color="inherit"
                gutterBottom
                className="animate-fadeInLeft"
                sx={{
                  animation: 'fadeInLeft 0.8s ease-out forwards',
                  fontWeight: 800,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  lineHeight: 1.2,
                  mb: 2,
                  background: mode === 'dark'
                    ? 'linear-gradient(45deg, #8bb5ff 0%, #6a9fff 100%)'
                    : 'linear-gradient(45deg, #1c54b2 0%, #2979ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: mode === 'dark'
                    ? '0 2px 10px rgba(106, 159, 255, 0.3)'
                    : '0 2px 10px rgba(41, 121, 255, 0.2)',
                }}
              >
                Your Authentic AI Interview Coach
              </Typography>
              <Typography
                variant="h5"
                color="inherit"
                paragraph
                className="animate-fadeInLeft delay-200"
                sx={{
                  animation: 'fadeInLeft 0.8s ease-out forwards',
                  animationDelay: '200ms',
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  mb: 3,
                  maxWidth: '90%',
                  fontWeight: 500,
                  color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                }}
              >
                Upload your CV, and let our advanced AI interviewer analyze your background and simulate a real, human-like interview experience—personalized to your actual career goals.
              </Typography>
              <Box style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      aria-label="Start Interview"
                      sx={{
                        fontWeight: 600,
                        borderRadius: 1, // Reduced border radius for more box-like appearance
                        marginBottom: 2,
                        minWidth: 160,
                        padding: '10px 24px',
                        fontSize: '1rem',
                        animation: 'fadeInUp 0.8s ease-out forwards',
                        animationDelay: '400ms',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 5px rgba(79,140,255,0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)', // Reduced transform for subtler effect
                          boxShadow: '0 3px 8px rgba(79,140,255,0.4)'
                        }
                      }}
                      onClick={() => {
                        // Open the CV selection dialog instead of directly starting the interview
                        setCvDialogOpen(true);
                      }}
                      className="animate-fadeInUp delay-400"
                    >
                      Start Interview
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      aria-label="Go to CV Analysis"
                      sx={{
                        fontWeight: 600,
                        borderRadius: 1, // Reduced border radius for more box-like appearance
                        marginBottom: 2,
                        padding: '9px 24px',
                        fontSize: '1rem',
                        animation: 'fadeInUp 0.8s ease-out forwards',
                        animationDelay: '600ms',
                        transition: 'all 0.3s ease',
                        border: '2px solid',
                        '&:hover': {
                          transform: 'translateY(-2px)', // Reduced transform for subtler effect
                          boxShadow: '0 3px 8px rgba(79,140,255,0.2)',
                          border: '2px solid'
                        }
                      }}
                      onClick={() => history.push('/cv-analysis')}
                      className="animate-fadeInUp delay-600"
                    >
                      Go to CV Analysis
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      aria-label="Go to My Profile"
                      sx={{
                        fontWeight: 600,
                        borderRadius: 1, // Reduced border radius for more box-like appearance
                        marginBottom: 2,
                        padding: '10px 24px',
                        fontSize: '1rem',
                        animation: 'fadeInUp 0.8s ease-out forwards',
                        animationDelay: '800ms',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 5px rgba(233,30,99,0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)', // Reduced transform for subtler effect
                          boxShadow: '0 3px 8px rgba(233,30,99,0.4)'
                        }
                      }}
                      onClick={() => history.push('/user')}
                      className="animate-fadeInUp delay-800"
                    >
                      Go to My Profile
                    </Button>
                    {profile && (
                      <div style={{ color: '#4caf50', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="18" height="18" fill="#4caf50" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.285 2.859l-11.285 11.285-5.285-5.285-1.415 1.414 6.7 6.7 12.7-12.7z"/></svg>
                        CV Uploaded
                      </div>
                    )}
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    aria-label="Login or Register"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 1, // Reduced border radius for more box-like appearance
                      mb: 2,
                      padding: '10px 24px',
                      minWidth: 160,
                      boxShadow: '0 2px 5px rgba(79,140,255,0.3)',
                      bgcolor: (theme: any) => theme.palette.primary.main,
                      color: (theme: any) => theme.palette.primary.contrastText,
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.primary.dark,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 3px 8px rgba(79,140,255,0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => history.push('/login')}
                  >
                    Log In / Register
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
      <Container style={{ paddingTop: 80, paddingBottom: 80 }} maxWidth="lg">
        {/* Features Section */}
        <Typography
          variant="h4"
          component="h2"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            mb: 4,
            position: 'relative',
            display: 'inline-block',
            left: '50%',
            transform: 'translateX(-50%)',
            background: mode === 'dark'
              ? 'linear-gradient(45deg, #8bb5ff 0%, #6a9fff 100%)'
              : 'linear-gradient(45deg, #1c54b2 0%, #2979ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: mode === 'dark'
                ? 'linear-gradient(45deg, #6a9fff 0%, #5183e0 100%)'
                : 'linear-gradient(45deg, #2979ff 0%, #1c54b2 100%)',
            }
          }}
        >
          Key Features
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            mb: 5,
            maxWidth: '700px',
            mx: 'auto',
            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          Our AI Interview Coach provides everything you need to prepare for your next job interview with confidence and professionalism.
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  p: 4,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  bgcolor: (theme: any) => theme.palette.background.paper,
                  boxShadow: mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)'
                    : '0 4px 20px rgba(41,121,255,0.1), 0 2px 8px rgba(41,121,255,0.05)',
                  borderRadius: 1, // Reduced border radius for more box-like appearance
                  minHeight: 240,
                  animation: `fadeInUp 0.8s ease-out forwards ${index * 200 + 200}ms`,
                  transition: 'all 0.3s ease',
                  border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.1)' : 'rgba(41,121,255,0.05)'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: mode === 'dark'
                      ? 'linear-gradient(90deg, #6a9fff, #5183e0)'
                      : 'linear-gradient(90deg, #2979ff, #1c54b2)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: mode === 'dark'
                      ? '0 8px 30px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.3)'
                      : '0 8px 30px rgba(41,121,255,0.15), 0 4px 10px rgba(41,121,255,0.1)',
                    '&::before': {
                      opacity: 1,
                    }
                  }
                }}
                elevation={0}
                className={`animate-fadeInUp delay-${index * 200 + 200}`}
              >
                <Box sx={{
                  color: mode === 'dark' ? '#6a9fff' : '#2979ff',
                  mb: 3,
                  fontSize: 48,
                  background: mode === 'dark'
                    ? 'linear-gradient(45deg, #8bb5ff 0%, #6a9fff 100%)'
                    : 'linear-gradient(45deg, #5393ff 0%, #2979ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}>
                  {feature.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: '1.2rem',
                    color: mode === 'dark' ? '#fff' : '#1c54b2',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                  }}
                >
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      </Grid>
      </Paper>
      </Container>
      <Container style={{ paddingTop: 80, paddingBottom: 80 }} maxWidth="lg">
        {/* Benefits Section */}
        <Typography
          variant="h4"
          component="h2"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            mb: 4,
            position: 'relative',
            display: 'inline-block',
            left: '50%',
            transform: 'translateX(-50%)',
            background: mode === 'dark'
              ? 'linear-gradient(45deg, #8bb5ff 0%, #6a9fff 100%)'
              : 'linear-gradient(45deg, #1c54b2 0%, #2979ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: mode === 'dark'
                ? 'linear-gradient(45deg, #6a9fff 0%, #5183e0 100%)'
                : 'linear-gradient(45deg, #2979ff 0%, #1c54b2 100%)',
            }
          }}
        >
          Why Choose AI Interview Coach?
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            mb: 5,
            maxWidth: '700px',
            mx: 'auto',
            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          Our platform offers unique advantages to help you succeed in your next interview and advance your career.
        </Typography>
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: { xs: 3, md: 5 },
            borderRadius: 1, // Reduced border radius for more box-like appearance
            boxShadow: mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)'
              : '0 8px 24px rgba(41,121,255,0.1), 0 4px 12px rgba(41,121,255,0.05)',
            animation: 'fadeIn 0.8s ease-out forwards',
            overflow: 'hidden',
            border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.1)' : 'rgba(41,121,255,0.05)'}`,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(37, 37, 54, 0.8) 0%, rgba(45, 45, 68, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 251, 255, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: mode === 'dark'
                ? 'linear-gradient(90deg, #6a9fff, #5183e0)'
                : 'linear-gradient(90deg, #2979ff, #1c54b2)',
            }
          }}
        >
          <List>
            <ListItem sx={{
              animation: 'fadeInLeft 0.8s ease-out forwards',
              animationDelay: '200ms',
              transition: 'all 0.3s ease',
              borderRadius: 1, // Added border radius for slight curves
              mb: 2, // Increased margin bottom for spacing
              p: 2, // Added padding for more space
              border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.15)' : 'rgba(41,121,255,0.1)'}`,
              backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.03)' : 'rgba(41,121,255,0.02)',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.08)' : 'rgba(41,121,255,0.05)',
                transform: 'translateX(8px)',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)'
                  : '0 4px 12px rgba(41,121,255,0.1), 0 2px 4px rgba(41,121,255,0.05)'
              }
            }}>
              <ListItemIcon>
                <CheckCircleIcon
                  color="primary"
                  sx={{
                    animation: 'pulse 2s infinite ease-in-out',
                    fontSize: 28,
                    color: mode === 'dark' ? '#6a9fff' : '#2979ff',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      mb: 0.5,
                      color: mode === 'dark' ? '#fff' : '#1c54b2',
                    }}
                  >
                    Real-time Feedback
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Get instant analysis of your responses to improve on the spot
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{
              animation: 'fadeInLeft 0.8s ease-out forwards',
              animationDelay: '400ms',
              transition: 'all 0.3s ease',
              borderRadius: 1, // Added border radius for slight curves
              mb: 2, // Increased margin bottom for spacing
              p: 2, // Added padding for more space
              border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.15)' : 'rgba(41,121,255,0.1)'}`,
              backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.03)' : 'rgba(41,121,255,0.02)',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.08)' : 'rgba(41,121,255,0.05)',
                transform: 'translateX(8px)',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)'
                  : '0 4px 12px rgba(41,121,255,0.1), 0 2px 4px rgba(41,121,255,0.05)'
              }
            }}>
              <ListItemIcon>
                <CheckCircleIcon
                  color="primary"
                  sx={{
                    animation: 'pulse 2s infinite ease-in-out',
                    animationDelay: '0.3s',
                    fontSize: 28,
                    color: mode === 'dark' ? '#6a9fff' : '#2979ff',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      mb: 0.5,
                      color: mode === 'dark' ? '#fff' : '#1c54b2',
                    }}
                  >
                    Comprehensive Analysis
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Evaluate tone, clarity, professionalism, and content completeness
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{
              animation: 'fadeInLeft 0.8s ease-out forwards',
              animationDelay: '600ms',
              transition: 'all 0.3s ease',
              borderRadius: 1, // Added border radius for slight curves
              mb: 2, // Increased margin bottom for spacing
              p: 2, // Added padding for more space
              border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.15)' : 'rgba(41,121,255,0.1)'}`,
              backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.03)' : 'rgba(41,121,255,0.02)',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.08)' : 'rgba(41,121,255,0.05)',
                transform: 'translateX(8px)',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)'
                  : '0 4px 12px rgba(41,121,255,0.1), 0 2px 4px rgba(41,121,255,0.05)'
              }
            }}>
              <ListItemIcon>
                <CheckCircleIcon
                  color="primary"
                  sx={{
                    animation: 'pulse 2s infinite ease-in-out',
                    animationDelay: '0.6s',
                    fontSize: 28,
                    color: mode === 'dark' ? '#6a9fff' : '#2979ff',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      mb: 0.5,
                      color: mode === 'dark' ? '#fff' : '#1c54b2',
                    }}
                  >
                    Flexible Practice
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Choose between technical and behavioral interviews at your convenience
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{
              animation: 'fadeInLeft 0.8s ease-out forwards',
              animationDelay: '800ms',
              transition: 'all 0.3s ease',
              borderRadius: 1, // Added border radius for slight curves
              mb: 2, // Increased margin bottom for spacing
              p: 2, // Added padding for more space
              border: `1px solid ${mode === 'dark' ? 'rgba(106,159,255,0.15)' : 'rgba(41,121,255,0.1)'}`,
              backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.03)' : 'rgba(41,121,255,0.02)',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(106,159,255,0.08)' : 'rgba(41,121,255,0.05)',
                transform: 'translateX(8px)',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)'
                  : '0 4px 12px rgba(41,121,255,0.1), 0 2px 4px rgba(41,121,255,0.05)'
              }
            }}>
              <ListItemIcon>
                <CheckCircleIcon
                  color="primary"
                  sx={{
                    animation: 'pulse 2s infinite ease-in-out',
                    animationDelay: '0.9s',
                    fontSize: 28,
                    color: mode === 'dark' ? '#6a9fff' : '#2979ff',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      mb: 0.5,
                      color: mode === 'dark' ? '#fff' : '#1c54b2',
                    }}
                  >
                    Progress Tracking
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Monitor your improvement with detailed session history and analytics
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Paper>
      </Container>

      {/* CV Selection Dialog */}
      <CVSelectionDialog
        open={cvDialogOpen}
        onClose={() => setCvDialogOpen(false)}
        onSelectOption={(includeCV) => {
          // Close the dialog
          setCvDialogOpen(false);

          // Clear any existing session ID from sessionStorage to ensure a new session is created
          window.sessionStorage.removeItem('currentSessionId');

          // Create a new interview session before navigating
          const initialMsg = {
            id: 1,
            message: "Hello! I'm your AI Interview Coach. I'll be simulating a job interview to help you practice your responses. Let's start with a brief introduction. Could you tell me a little about yourself and your professional background?",
            timestamp: new Date().toLocaleTimeString(),
            isInterviewQuestion: true,
            questionType: 'introductory' as 'introductory', // Use type assertion to match the expected literal type
            questionMetadata: {
              id: `question-${Date.now()}`,
              category: 'initial',
              difficulty: 'easy',
              isAIGenerated: true,
              interviewStage: 'initial',
              // Add these properties to match the ChatMessage type from chatTypes.ts
              isNewSession: true // This will be handled by the backend
            }
          };

          // Create a new session with interview mode, forcing a new session
          // Include the CV preference in the metadata
          const sessionId = saveSession(
            [initialMsg],
            'interview',
            true,
            { usesCV: includeCV }
          );

          // Navigate to the chatbot with the new session ID and CV preference
          history.push(`/chatbot?sessionId=${sessionId}&usesCV=${includeCV}`);
        }}
      />
    </Box>
  );
};

export default Home;
