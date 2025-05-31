import React from 'react';
import { Box, Typography, LinearProgress, Paper, Grid, useTheme, Tooltip, Fade } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface StarScoreDisplayProps {
  scores: {
    Situation?: number;
    Task?: number;
    Action?: number;
    Result?: number;
  };
  overallScore?: number | null;
  showScores?: boolean;
}

// STAR component descriptions for tooltips
const componentDescriptions = {
  Situation: "Describes the context, background, or challenge you faced",
  Task: "Explains your specific responsibility or objective in that situation",
  Action: "Details the specific steps you took to address the situation",
  Result: "Highlights the outcomes, achievements, and impact of your actions"
};

// Score level descriptions
const scoreLevelDescriptions = {
  high: "Excellent - Very well articulated and comprehensive",
  medium: "Good - Adequately addressed but could be improved",
  low: "Needs improvement - Consider expanding this section"
};

const StarScoreDisplay: React.FC<StarScoreDisplayProps> = ({ scores, overallScore, showScores = false }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Define colors based on score ranges with improved contrast
  const getScoreColor = (score: number) => {
    if (score >= 8) return isDarkMode ? '#66bb6a' : '#2e7d32'; // Green for high scores
    if (score >= 5) return isDarkMode ? '#ffb74d' : '#e65100'; // Orange for medium scores
    return isDarkMode ? '#ef5350' : '#c62828'; // Red for low scores
  };

  // Get score level description
  const getScoreLevelDescription = (score: number) => {
    if (score >= 8) return scoreLevelDescriptions.high;
    if (score >= 5) return scoreLevelDescriptions.medium;
    return scoreLevelDescriptions.low;
  };

  // Ensure scores object has valid values
  const validScores = { ...scores };

  // Add default values for missing STAR components
  if (!validScores.Situation && validScores.Situation !== 0) validScores.Situation = 7;
  if (!validScores.Task && validScores.Task !== 0) validScores.Task = 7;
  if (!validScores.Action && validScores.Action !== 0) validScores.Action = 7;
  if (!validScores.Result && validScores.Result !== 0) validScores.Result = 7;

  // Calculate average score if overall is not provided
  const calculatedOverall = overallScore ??
    Object.values(validScores).reduce((sum, score) => sum + (score || 0), 0) /
    (Object.values(validScores).filter(score => score !== undefined).length || 1);

  if (!showScores) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        mt: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
        transition: 'all 0.3s ease',
        boxShadow: isDarkMode
          ? '0 4px 20px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{
        fontWeight: 600,
        color: isDarkMode ? '#fff' : '#333',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
        pb: 1.5,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>STAR Framework Analysis</span>
        <Tooltip
          title="The STAR method helps structure interview answers: Situation, Task, Action, Result"
          placement="top"
          TransitionComponent={Fade}
          TransitionProps={{ timeout: 600 }}
        >
          <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, opacity: 0.7, cursor: 'help' }} />
        </Tooltip>
      </Typography>

      <Grid container spacing={2.5}>
        {Object.entries(validScores).map(([category, score]) => (
          score !== undefined && (
            <Grid item xs={12} sm={6} key={category}>
              <Tooltip
                title={`${componentDescriptions[category as keyof typeof componentDescriptions]}: ${getScoreLevelDescription(score)}`}
                placement="top"
                arrow
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
              >
                <Box sx={{
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                  transition: 'all 0.2s ease',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" sx={{
                      fontWeight: 600,
                      color: isDarkMode ? '#ddd' : '#555',
                      fontSize: '0.9rem',
                    }}>
                      {category}
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontWeight: 700,
                      color: getScoreColor(score),
                      fontSize: '0.9rem',
                    }}>
                      {score}/10
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={score * 10}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(score),
                        borderRadius: 5,
                        transition: 'transform 1s ease-in-out',
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
          )
        ))}
      </Grid>

      {/* Overall Score */}
      <Box sx={{
        mt: 2.5,
        pt: 2,
        borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
        textAlign: 'center',
      }}>
        <Typography variant="body1" sx={{
          fontWeight: 600,
          color: isDarkMode ? '#fff' : '#333',
          mb: 1,
        }}>
          Overall Performance
        </Typography>

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          mb: 1,
        }}>
          <Box sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `8px solid ${getScoreColor(calculatedOverall)}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            boxShadow: `0 0 15px ${getScoreColor(calculatedOverall)}40`,
            transition: 'all 0.3s ease',
          }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: getScoreColor(calculatedOverall),
            }}>
              {Math.round(calculatedOverall * 10) / 10}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{
          color: getScoreColor(calculatedOverall),
          fontWeight: 500,
          mt: 1,
        }}>
          {calculatedOverall >= 8 ? 'Excellent Response' :
           calculatedOverall >= 6 ? 'Good Response' :
           calculatedOverall >= 4 ? 'Average Response' : 'Needs Improvement'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default StarScoreDisplay;
