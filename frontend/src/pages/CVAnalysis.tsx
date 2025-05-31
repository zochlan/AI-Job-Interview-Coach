import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { useHistory, Link } from 'react-router-dom';
import CVUpload from '../components/CVUpload';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import { Global } from '@emotion/react';
// Auth context is imported but not used in the component logic
import { useAuth } from '../context/AuthContext';
// Import shared interfaces and utilities
import { UserProfile, CVAnalysis as CVAnalysisType } from '../types/profileTypes';
import { formatEducation, formatExperience } from '../utils/profileUtils';

// EditableProfile sub-component
const EditableProfile: React.FC<{ cvAnalysis: CVAnalysisType; setProfile: (p: CVAnalysisType) => void }> = ({ cvAnalysis, setProfile }) => {
  const theme = useTheme();
  const [edit, setEdit] = React.useState<CVAnalysisType>({ ...cvAnalysis });
  const [dirty, setDirty] = React.useState(false);
  const [activeField, setActiveField] = React.useState<string | null>(null);

  // We're now using the imported formatEducation and formatExperience functions

  // Save edits to localStorage and update parent state
  const handleSave = () => {
    setProfile(edit);
    localStorage.setItem('parsed-cvAnalysis', JSON.stringify(edit));
    setDirty(false);
  };

  // Reset edits to last parsed values
  const handleReset = () => {
    const stored = localStorage.getItem('parsed-cvAnalysis');
    const parsed = stored ? JSON.parse(stored) : cvAnalysis;
    setEdit(parsed);
    setDirty(false);
  };

  // Handle field changes
  const handleChange = (field: string, value: string) => {
    setEdit((prev: CVAnalysisType) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  // Common TextField props for dark mode support with enhanced styling
  const textFieldProps = {
    variant: "outlined" as const,
    size: "small" as const,
    fullWidth: true,
    sx: {
      mb: 1.5,
      '& .MuiOutlinedInput-root': {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 45, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.mode === 'dark' ? 'rgba(95, 159, 255, 0.5)' : theme.palette.primary.light,
          borderWidth: '2px',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: '2px',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 8px rgba(95, 159, 255, 0.3)'
            : '0 0 8px rgba(41, 121, 255, 0.2)',
        },
      },
      '& .MuiInputLabel-root': {
        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined,
        fontWeight: 500,
        transition: 'all 0.3s ease',
        '&.Mui-focused': {
          color: theme.palette.primary.main,
          fontWeight: 600,
        },
      },
      '& .MuiOutlinedInput-input': {
        color: theme.palette.text.primary,
        padding: '12px 14px',
      },
      '& .MuiFormHelperText-root': {
        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined,
        marginLeft: '4px',
        fontSize: '0.75rem',
      }
    }
  };

  return (
    <form
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 16,
        padding: '8px 4px'
      }}
      onSubmit={e => { e.preventDefault(); handleSave(); }}
    >
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
        mb: 2
      }}>
        <TextField
          label="Name"
          value={edit.name || ''}
          onChange={e => handleChange('name', e.target.value)}
          onFocus={() => setActiveField('name')}
          onBlur={() => setActiveField(null)}
          InputProps={{
            sx: {
              transition: 'transform 0.2s ease',
              transform: activeField === 'name' ? 'translateY(-2px)' : 'none',
            }
          }}
          {...textFieldProps}
        />
        <TextField
          label="Email"
          value={edit.email || ''}
          onChange={e => handleChange('email', e.target.value)}
          onFocus={() => setActiveField('email')}
          onBlur={() => setActiveField(null)}
          InputProps={{
            sx: {
              transition: 'transform 0.2s ease',
              transform: activeField === 'email' ? 'translateY(-2px)' : 'none',
            }
          }}
          {...textFieldProps}
        />
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
        mb: 2
      }}>
        <TextField
          label="Phone"
          value={edit.phone || ''}
          onChange={e => handleChange('phone', e.target.value)}
          onFocus={() => setActiveField('phone')}
          onBlur={() => setActiveField(null)}
          InputProps={{
            sx: {
              transition: 'transform 0.2s ease',
              transform: activeField === 'phone' ? 'translateY(-2px)' : 'none',
            }
          }}
          {...textFieldProps}
        />
        <TextField
          label="Location"
          value={edit.location || ''}
          onChange={e => handleChange('location', e.target.value)}
          onFocus={() => setActiveField('location')}
          onBlur={() => setActiveField(null)}
          InputProps={{
            sx: {
              transition: 'transform 0.2s ease',
              transform: activeField === 'location' ? 'translateY(-2px)' : 'none',
            }
          }}
          {...textFieldProps}
        />
      </Box>

      <TextField
        label="Target Job"
        value={edit.target_job || ''}
        onChange={e => handleChange('target_job', e.target.value)}
        onFocus={() => setActiveField('target_job')}
        onBlur={() => setActiveField(null)}
        InputProps={{
          sx: {
            transition: 'transform 0.2s ease',
            transform: activeField === 'target_job' ? 'translateY(-2px)' : 'none',
          }
        }}
        {...textFieldProps}
      />

      <TextField
        label="Summary"
        value={edit.summary || ''}
        onChange={e => handleChange('summary', e.target.value)}
        onFocus={() => setActiveField('summary')}
        onBlur={() => setActiveField(null)}
        multiline
        minRows={3}
        InputProps={{
          sx: {
            transition: 'transform 0.2s ease',
            transform: activeField === 'summary' ? 'translateY(-2px)' : 'none',
          }
        }}
        {...textFieldProps}
      />

      <TextField
        label="Skills"
        value={Array.isArray(edit.skills) ? edit.skills.join(', ') : (edit.skills || '')}
        onChange={e => handleChange('skills', e.target.value)}
        onFocus={() => setActiveField('skills')}
        onBlur={() => setActiveField(null)}
        helperText="Comma-separated list of skills"
        InputProps={{
          sx: {
            transition: 'transform 0.2s ease',
            transform: activeField === 'skills' ? 'translateY(-2px)' : 'none',
          }
        }}
        {...textFieldProps}
      />

      <TextField
        label="Education"
        value={formatEducation(edit.education)}
        onChange={e => handleChange('education', e.target.value)}
        onFocus={() => setActiveField('education')}
        onBlur={() => setActiveField(null)}
        multiline
        minRows={2}
        helperText="Format: Institution - Degree Dates"
        InputProps={{
          sx: {
            transition: 'transform 0.2s ease',
            transform: activeField === 'education' ? 'translateY(-2px)' : 'none',
          }
        }}
        {...textFieldProps}
      />

      <TextField
        label="Experience"
        value={formatExperience(edit.experience)}
        onChange={e => handleChange('experience', e.target.value)}
        onFocus={() => setActiveField('experience')}
        onBlur={() => setActiveField(null)}
        multiline
        minRows={2}
        helperText="Format: Company - Title Dates"
        InputProps={{
          sx: {
            transition: 'transform 0.2s ease',
            transform: activeField === 'experience' ? 'translateY(-2px)' : 'none',
          }
        }}
        {...textFieldProps}
      />

      {/* Form buttons removed to avoid duplication with the main Save Data button */}
      <Box sx={{
        display: 'none' // Hide the buttons as we'll use the main Save Data button instead
      }}>
        <Button type="submit" disabled={!dirty}>Save</Button>
        <Button onClick={handleReset} disabled={!dirty}>Reset</Button>
      </Box>
    </form>
  );
};

const CVAnalysis: React.FC = () => {
  const theme = useTheme();
  const history = useHistory();

  // Add global animations - optimized for performance
  const globalStyles = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Reduced animation complexity */
    @keyframes bounce {
      0%, 50%, 100% { transform: translateY(0); }
      25% { transform: translateY(-5px); }
      75% { transform: translateY(-3px); }
    }
  `;
  // We don't need to use auth variables as auth is handled by the router
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const auth = useAuth(); // Auth context is available if needed later
  const [cvAnalysis, setCvAnalysis] = React.useState<CVAnalysisType | null>(() => {
    try {
      // First try to get from cv-analysis
      const stored = localStorage.getItem('cv-analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Make sure the parsed data has the uploaded flag set
        if (parsed) {
          // Ensure the profile in localStorage has the uploaded flag set to true
          try {
            const profileData = JSON.parse(localStorage.getItem('parsed-profile') || '{}');
            profileData.uploaded = true;
            localStorage.setItem('parsed-profile', JSON.stringify(profileData));
          } catch (e) {
            console.error('Error updating parsed-profile:', e);
          }
          return parsed;
        }
      }

      // If not found, try to get from parsed-profile
      const parsedProfile = localStorage.getItem('parsed-profile');
      if (parsedProfile) {
        const profile = JSON.parse(parsedProfile);
        if (profile && profile.uploaded) {
          // If we have a profile with uploaded flag, use it as a minimal CV analysis
          return {
            name: profile.name || 'User',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            skills: profile.skills || [],
            education: profile.education || '',
            experience: profile.experience || '',
            summary: profile.summary || '',
            uploaded: true,
            complex_format_detected: profile.complex_format_detected || false,
            lastUpdated: profile.lastUpdated || new Date().toISOString()
          };
        }
      }

      return null;
    } catch (e) {
      console.error('Error loading CV analysis:', e);
      return null;
    }
  });

  // We don't need to check auth here as it's already handled by the AuthContext

  if (!cvAnalysis) {
    return (
      <>
        <Global styles={globalStyles} />
        <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #121212 100%)'
            : 'linear-gradient(135deg, #4f8cff 0%, #e3f2fd 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 6, md: 10 },
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 20% 30%, rgba(106, 159, 255, 0.15) 0%, rgba(30, 30, 45, 0) 50%)'
              : 'radial-gradient(circle at 20% 30%, rgba(79, 140, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)',
            zIndex: 0,
            // Removed animation for better performance
            // animation: 'pulse 15s infinite alternate ease-in-out',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 80% 70%, rgba(106, 159, 255, 0.12) 0%, rgba(30, 30, 45, 0) 50%)'
              : 'radial-gradient(circle at 80% 70%, rgba(79, 140, 255, 0.15) 0%, rgba(255, 255, 255, 0) 50%)',
            zIndex: 0,
            // Removed animation for better performance
            // animation: 'pulse 20s infinite alternate-reverse ease-in-out',
          }
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              textAlign: 'center',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(30,30,45,0.9)'
                : 'rgba(255,255,255,0.9)',
              color: theme.palette.text.primary,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 50px 0 rgba(0,0,0,0.5), 0 1px 10px rgba(106, 159, 255, 0.1)'
                : '0 10px 50px 0 rgba(79,140,255,0.2), 0 1px 10px rgba(79,140,255,0.1)',
              border: '2px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(106, 159, 255, 0.2)'
                : 'rgba(79,140,255,0.15)',
              width: '100%',
              maxWidth: 500,
              mx: 'auto',
              transition: 'all 0.4s ease',
              animation: 'fadeInUp 0.8s ease-out forwards',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 15px 60px 0 rgba(0,0,0,0.6), 0 1px 15px rgba(106, 159, 255, 0.15)'
                  : '0 15px 60px 0 rgba(79,140,255,0.25), 0 1px 15px rgba(79,140,255,0.15)',
                transform: 'translateY(-5px)',
              }
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(106, 159, 255, 0.2)'
                  : 'rgba(79, 140, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                border: '2px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(106, 159, 255, 0.3)'
                  : 'rgba(79, 140, 255, 0.2)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 0 20px rgba(106, 159, 255, 0.3)'
                  : '0 0 20px rgba(79, 140, 255, 0.2)',
                // Removed animation for better performance
              // animation: 'pulse 2s infinite ease-in-out'
              }}
            >
              <DescriptionIcon
                sx={{
                  fontSize: 40,
                  color: theme.palette.primary.main
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                mb: 2,
                color: theme.palette.primary.main,
                fontWeight: 800,
                letterSpacing: 0.5
              }}
            >
              No CV Analysis Found
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 4,
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                px: 1
              }}
            >
              Please upload your CV on your profile page to receive a detailed analysis report of your resume.
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => history.push('/user')}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #4f8cff 10%, #6a9fff 90%)'
                  : 'linear-gradient(45deg, #2979ff 10%, #5393ff 90%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(106, 159, 255, 0.4)'
                  : '0 4px 20px rgba(41, 121, 255, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(106, 159, 255, 0.5)'
                    : '0 6px 25px rgba(41, 121, 255, 0.35)',
                },
                '&:active': {
                  transform: 'translateY(-1px)',
                }
              }}
              startIcon={<PersonIcon />}
            >
              Go to Profile
            </Button>
          </Paper>
        </Container>
      </Box>
      </>
    );
  }

  return (
    <>
      <Global styles={globalStyles} />
      <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a2e 0%, #121212 100%)'
          : 'linear-gradient(135deg, #4f8cff 0%, #e3f2fd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 30%, rgba(106, 159, 255, 0.15) 0%, rgba(30, 30, 45, 0) 50%)'
            : 'radial-gradient(circle at 20% 30%, rgba(79, 140, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)',
          zIndex: 0,
          animation: 'pulse 15s infinite alternate ease-in-out',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 80% 70%, rgba(106, 159, 255, 0.12) 0%, rgba(30, 30, 45, 0) 50%)'
            : 'radial-gradient(circle at 80% 70%, rgba(79, 140, 255, 0.15) 0%, rgba(255, 255, 255, 0) 50%)',
          zIndex: 0,
          animation: 'pulse 20s infinite alternate-reverse ease-in-out',
        }
      }}
    >
      <Container
        maxWidth="md"
        disableGutters
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 50px 0 rgba(0,0,0,0.5), 0 1px 10px rgba(106, 159, 255, 0.1)'
              : '0 10px 50px 0 rgba(79,140,255,0.2), 0 1px 10px rgba(79,140,255,0.1)',
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(30,30,45,0.9)'
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            border: '2px solid',
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(106, 159, 255, 0.2)'
              : 'rgba(79,140,255,0.15)',
            width: { xs: '97vw', sm: '90vw', md: '75vw' },
            maxWidth: 900,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: theme.palette.text.primary,
            transition: 'all 0.4s ease',
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark'
                ? '0 15px 60px 0 rgba(0,0,0,0.6), 0 1px 15px rgba(106, 159, 255, 0.15)'
                : '0 15px 60px 0 rgba(79,140,255,0.25), 0 1px 15px rgba(79,140,255,0.15)',
              transform: 'translateY(-5px)',
            }
          }}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 900,
              letterSpacing: 0.5,
              textAlign: 'center',
              mb: 1,
              animation: 'fadeInDown 0.8s ease-out forwards'
            }}
            className="animate-fadeInDown"
          >
            CV Analysis
          </Typography>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              textAlign: 'center',
              color: theme.palette.text.secondary,
              mb: 3,
              animation: 'fadeInUp 0.8s ease-out forwards',
              animationDelay: '200ms'
            }}
            className="animate-fadeInUp delay-200"
          >
            Upload your CV to get a detailed analysis and see how your experience, skills, and education are interpreted by our AI.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, width: '100%' }}>
            <CVUpload onProfileParsed={setCvAnalysis} />
          </Box>
          {cvAnalysis && (
            <Box sx={{
              background: theme.palette.mode === 'dark'
                ? 'rgba(30,30,45,0.95)'
                : 'rgba(255,255,255,0.95)',
              color: theme.palette.text.primary,
              borderRadius: 4,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.4)'
                : 2,
              p: { xs: 2, md: 4 },
              mt: 5,
              mb: 3,
              maxWidth: 780,
              width: '100%',
              mx: 'auto',
              border: '1.5px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(95,159,255,0.2)'
                : '#e3f2fd',
              animation: 'fadeInUp 0.8s ease-out forwards',
              animationDelay: '400ms',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 30px rgba(95,159,255,0.2)'
                  : '0 8px 30px rgba(79,140,255,0.2)'
              }
            }}
            className="animate-fadeInUp delay-400"
            >
              <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: 20, mb: 2, textAlign: 'center', letterSpacing: 0.2 }}>
                Profile parsed from your CV (editable):
              </Typography>
              <EditableProfile cvAnalysis={cvAnalysis} setProfile={setCvAnalysis} />
              <Box sx={{ display: 'flex', gap: 2, my: 3, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    try {
                      // Make sure the CV analysis has the uploaded flag set
                      const updatedCVAnalysis = {
                        ...cvAnalysis,
                        uploaded: true
                      };

                      // Save to localStorage first to ensure it's available immediately
                      localStorage.setItem('cv-analysis', JSON.stringify(updatedCVAnalysis));

                      // Create a minimal profile if none exists
                      let profile = {};
                      try {
                        profile = JSON.parse(localStorage.getItem('parsed-profile') || '{}');
                      } catch (e) {
                        profile = {};
                      }

                      // Update profile with CV data
                      if (updatedCVAnalysis) {
                        // Create a properly typed UserProfile object
                        const userProfile: UserProfile = {
                          ...(profile as UserProfile),
                          // Use optional chaining to safely access properties that might not exist
                          name: (updatedCVAnalysis as any).name || (profile as any).name || 'User',
                          email: (updatedCVAnalysis as any).email || (profile as any).email || '',
                          phone: (updatedCVAnalysis as any).phone || (profile as any).phone || '',
                          location: (updatedCVAnalysis as any).location || (profile as any).location || '',
                          skills: updatedCVAnalysis.skills || (profile as any).skills || [],
                          education: updatedCVAnalysis.education || (profile as any).education || '',
                          experience: updatedCVAnalysis.experience || (profile as any).experience || '',
                          summary: (updatedCVAnalysis as any).summary || (profile as any).summary || '',
                          uploaded: true,
                          complex_format_detected: (updatedCVAnalysis as any).complex_format_detected || false,
                          lastUpdated: new Date().toISOString()
                        };

                        profile = userProfile;
                        localStorage.setItem('parsed-profile', JSON.stringify(profile));
                      }

                      // Try to save to server
                      const res = await fetch('/save-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ profile, cvAnalysis: updatedCVAnalysis }),
                      });

                      if (res.ok) {
                        // Update the state with the saved data
                        setCvAnalysis(updatedCVAnalysis);
                        alert('Profile and CV analysis saved!');
                      } else {
                        alert('Failed to save profile to server, but saved locally.');
                      }
                    } catch (err) {
                      console.error('Error saving profile:', err);
                      alert('Error saving profile to server, but saved locally.');
                    }
                  }}
                  sx={{
                    animation: 'fadeInUp 0.8s ease-out forwards',
                    animationDelay: '600ms',
                    transition: 'all 0.3s ease',
                    py: 1.5,
                    px: 4,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #4f8cff 10%, #6a9fff 90%)'
                      : 'linear-gradient(45deg, #2979ff 10%, #5393ff 90%)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(106, 159, 255, 0.4)'
                      : '0 4px 20px rgba(41, 121, 255, 0.25)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(106, 159, 255, 0.5)'
                        : '0 6px 25px rgba(41, 121, 255, 0.35)',
                    }
                  }}
                  className="animate-fadeInUp delay-600"
                >
                  Save Data
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear your profile? This action cannot be undone.')) {
                      localStorage.removeItem('parsed-profile');
                      localStorage.removeItem('cv-analysis');
                      setCvAnalysis(null);
                      try {
                        await fetch('/clear-profile', { method: 'POST', credentials: 'include' });
                        alert('Profile cleared successfully.');
                      } catch (err) {
                        console.error('Error clearing profile on server:', err);
                        alert('Profile cleared locally. Server update may have failed.');
                      }
                    }
                  }}
                  sx={{
                    animation: 'fadeInUp 0.8s ease-out forwards',
                    animationDelay: '800ms',
                    transition: 'all 0.3s ease',
                    py: 1.5,
                    px: 4,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    borderWidth: '2px',
                    borderColor: theme.palette.secondary.main,
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 15px rgba(233,30,99,0.3)',
                      borderWidth: '2px',
                    }
                  }}
                  className="animate-fadeInUp delay-800"
                >
                  Clear Profile
                </Button>
              </Box>
              {/* Section-by-section scores */}
              {cvAnalysis.section_scores && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(20, 20, 35, 0.5)'
                      : 'rgba(240, 247, 255, 0.7)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(106, 159, 255, 0.15)'
                      : 'rgba(79, 140, 255, 0.15)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(79, 140, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.25)'
                        : '0 6px 25px rgba(79, 140, 255, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: theme.palette.secondary.main,
                        marginRight: 1.5,
                        boxShadow: `0 0 10px ${theme.palette.secondary.main}`
                      }
                    }}
                  >
                    Section Scores
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                    {Object.entries(cvAnalysis.section_scores).map(([section, scores]: any) => (
                      <Box
                        key={section}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(30, 30, 45, 0.7)'
                            : 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(106, 159, 255, 0.1)'
                            : 'rgba(79, 140, 255, 0.1)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            mb: 1.5,
                            textTransform: 'capitalize',
                            color: theme.palette.mode === 'dark'
                              ? theme.palette.secondary.light
                              : theme.palette.secondary.dark,
                            borderBottom: '2px solid',
                            borderColor: theme.palette.mode === 'dark'
                              ? 'rgba(244, 143, 177, 0.3)'
                              : 'rgba(244, 143, 177, 0.2)',
                            pb: 0.5
                          }}
                        >
                          {section}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {Object.entries(scores).map(([metric, value]: any) => {
                            // Calculate color based on value
                            const scoreColor = value >= 0.7
                              ? theme.palette.success.main
                              : value >= 0.4
                                ? theme.palette.warning.main
                                : theme.palette.error.main;

                            return (
                              <Box key={metric} sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                    {metric.replace(/_/g, ' ')}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: scoreColor, fontWeight: 700 }}>
                                    {value}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 6,
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(255, 255, 255, 0.1)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: '100%',
                                      width: `${value * 100}%`,
                                      bgcolor: scoreColor,
                                      borderRadius: 3,
                                      transition: 'width 1s ease-in-out',
                                      boxShadow: `0 0 8px ${scoreColor}`
                                    }}
                                  />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {/* ATS Report */}
              {cvAnalysis.ats_report && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(20, 20, 35, 0.5)'
                      : 'rgba(240, 247, 255, 0.7)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(106, 159, 255, 0.15)'
                      : 'rgba(79, 140, 255, 0.15)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(79, 140, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.25)'
                        : '0 6px 25px rgba(79, 140, 255, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: theme.palette.secondary.main,
                        marginRight: 1.5,
                        boxShadow: `0 0 10px ${theme.palette.secondary.main}`
                      }
                    }}
                  >
                    ATS Compatibility
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                      gap: 2
                    }}
                  >
                    {Object.entries(cvAnalysis.ats_report).map(([key, value]: any) => {
                      const isPositive = !!value;
                      return (
                        <Box
                          key={key}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            borderRadius: 2,
                            background: theme.palette.mode === 'dark'
                              ? isPositive
                                ? 'rgba(46, 125, 50, 0.15)'
                                : 'rgba(211, 47, 47, 0.15)'
                              : isPositive
                                ? 'rgba(46, 125, 50, 0.08)'
                                : 'rgba(211, 47, 47, 0.08)',
                            border: '1px solid',
                            borderColor: isPositive
                              ? theme.palette.mode === 'dark'
                                ? 'rgba(76, 175, 80, 0.3)'
                                : 'rgba(76, 175, 80, 0.2)'
                              : theme.palette.mode === 'dark'
                                ? 'rgba(244, 67, 54, 0.3)'
                                : 'rgba(244, 67, 54, 0.2)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              background: isPositive
                                ? theme.palette.success.main
                                : theme.palette.error.main,
                              color: '#fff',
                              fontSize: '1rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {isPositive ? '✓' : '✗'}
                          </Box>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                color: theme.palette.text.primary
                              }}
                            >
                              {key.replace(/_/g, ' ')}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isPositive
                                  ? theme.palette.success.main
                                  : theme.palette.error.main,
                                fontWeight: 600,
                                display: 'block'
                              }}
                            >
                              {isPositive ? 'Passed' : 'Failed'}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
              {/* Bias & Inclusion Report */}
              {cvAnalysis.bias_report && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(20, 20, 35, 0.5)'
                      : 'rgba(240, 247, 255, 0.7)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(106, 159, 255, 0.15)'
                      : 'rgba(79, 140, 255, 0.15)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(79, 140, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.25)'
                        : '0 6px 25px rgba(79, 140, 255, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: theme.palette.secondary.main,
                        marginRight: 1.5,
                        boxShadow: `0 0 10px ${theme.palette.secondary.main}`
                      }
                    }}
                  >
                    Bias & Inclusion Check
                  </Typography>

                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? cvAnalysis.bias_report.bias_terms_found && cvAnalysis.bias_report.bias_terms_found.length > 0
                          ? 'rgba(211, 47, 47, 0.15)'
                          : 'rgba(46, 125, 50, 0.15)'
                        : cvAnalysis.bias_report.bias_terms_found && cvAnalysis.bias_report.bias_terms_found.length > 0
                          ? 'rgba(211, 47, 47, 0.08)'
                          : 'rgba(46, 125, 50, 0.08)',
                      border: '1px solid',
                      borderColor: cvAnalysis.bias_report.bias_terms_found && cvAnalysis.bias_report.bias_terms_found.length > 0
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(244, 67, 54, 0.3)'
                          : 'rgba(244, 67, 54, 0.2)'
                        : theme.palette.mode === 'dark'
                          ? 'rgba(76, 175, 80, 0.3)'
                          : 'rgba(76, 175, 80, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
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
                        background: cvAnalysis.bias_report.bias_terms_found && cvAnalysis.bias_report.bias_terms_found.length > 0
                          ? theme.palette.error.main
                          : theme.palette.success.main,
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}
                    >
                      {cvAnalysis.bias_report.bias_terms_found && cvAnalysis.bias_report.bias_terms_found.length > 0 ? '!' : '✓'}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      {cvAnalysis.bias_report.bias_terms_found && cvAnalysis.bias_report.bias_terms_found.length > 0 ? (
                        <>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: theme.palette.error.main,
                              fontWeight: 700,
                              mb: 0.5
                            }}
                          >
                            Biased or gendered language detected
                          </Typography>
                          <Typography variant="body2">
                            The following terms may be considered biased or gendered:
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                              mt: 1
                            }}
                          >
                            {cvAnalysis.bias_report.bias_terms_found.map((term: string, index: number) => (
                              <Box
                                key={index}
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 10,
                                  bgcolor: theme.palette.mode === 'dark'
                                    ? 'rgba(211, 47, 47, 0.2)'
                                    : 'rgba(211, 47, 47, 0.1)',
                                  border: '1px solid',
                                  borderColor: theme.palette.mode === 'dark'
                                    ? 'rgba(244, 67, 54, 0.3)'
                                    : 'rgba(244, 67, 54, 0.2)',
                                  color: theme.palette.error.main,
                                  fontWeight: 600,
                                  fontSize: '0.8rem'
                                }}
                              >
                                {term}
                              </Box>
                            ))}
                          </Box>
                        </>
                      ) : (
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 700
                          }}
                        >
                          No biased or gendered language detected in your CV.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
              {/* Language Quality Report */}
              {cvAnalysis.language_report && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(20, 20, 35, 0.5)'
                      : 'rgba(240, 247, 255, 0.7)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(106, 159, 255, 0.15)'
                      : 'rgba(79, 140, 255, 0.15)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(79, 140, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.25)'
                        : '0 6px 25px rgba(79, 140, 255, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: theme.palette.secondary.main,
                        marginRight: 1.5,
                        boxShadow: `0 0 10px ${theme.palette.secondary.main}`
                      }
                    }}
                  >
                    Language Quality
                  </Typography>

                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 45, 0.7)'
                        : 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(106, 159, 255, 0.1)'
                        : 'rgba(79, 140, 255, 0.1)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 2.5
                      }}
                    >
                      {Object.entries(cvAnalysis.language_report).map(([key, value]: any) => {
                        // Determine if this is a numeric value that could be represented as a gauge
                        const isNumeric = !isNaN(parseFloat(value as string)) && isFinite(Number(value));
                        const numericValue = isNumeric ? parseFloat(value as string) : 0;

                        // Determine color based on metric type
                        let color = theme.palette.info.main;
                        let gaugePercentage = 0;

                        if (isNumeric) {
                          if (key.includes('count') || key.includes('length')) {
                            // For counts, we'll use a neutral color
                            color = theme.palette.primary.main;
                            // For counts, set a reasonable scale (0-100 for counts, 0-50 for lengths)
                            const maxValue = key.includes('count') ? 100 : 50;
                            gaugePercentage = Math.min(100, (numericValue / maxValue) * 100);
                          } else if (key.includes('error') || key.includes('mistake')) {
                            // For errors, lower is better
                            color = numericValue <= 1
                              ? theme.palette.success.main
                              : numericValue <= 3
                                ? theme.palette.warning.main
                                : theme.palette.error.main;
                            // Invert the scale for errors (0 is 100%, 10+ is 0%)
                            gaugePercentage = Math.max(0, 100 - (numericValue * 10));
                          } else if (key.includes('readability')) {
                            // Special case for readability which might be 0-1 or 0-100
                            const normalizedValue = numericValue > 1 ? numericValue / 100 : numericValue;
                            color = normalizedValue >= 0.7
                              ? theme.palette.success.main
                              : normalizedValue >= 0.4
                                ? theme.palette.warning.main
                                : theme.palette.error.main;
                            gaugePercentage = normalizedValue * 100;
                          } else {
                            // For other metrics like polarity, higher is generally better
                            color = numericValue >= 0.7
                              ? theme.palette.success.main
                              : numericValue >= 0.4
                                ? theme.palette.warning.main
                                : theme.palette.error.main;
                            gaugePercentage = numericValue * 100;
                          }
                        }

                        return (
                          <Box
                            key={key}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              background: theme.palette.mode === 'dark'
                                ? 'rgba(30, 30, 45, 0.5)'
                                : 'rgba(240, 247, 255, 0.5)',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark'
                                ? 'rgba(106, 159, 255, 0.1)'
                                : 'rgba(79, 140, 255, 0.1)',
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                textTransform: 'capitalize',
                                color: theme.palette.text.secondary
                              }}
                            >
                              {key.replace(/_/g, ' ')}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  color: isNumeric ? color : theme.palette.text.primary
                                }}
                              >
                                {value}
                              </Typography>

                              {isNumeric && (
                                <Box
                                  sx={{
                                    width: '60%',
                                    height: 6,
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(255, 255, 255, 0.1)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    ml: 1
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: '100%',
                                      width: `${gaugePercentage}%`,
                                      bgcolor: color,
                                      borderRadius: 3,
                                      transition: 'width 1s ease-in-out'
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              )}
              {/* Recommendations */}
              {cvAnalysis.recommendations && cvAnalysis.recommendations.length > 0 && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(20, 20, 35, 0.5)'
                      : 'rgba(240, 247, 255, 0.7)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(106, 159, 255, 0.15)'
                      : 'rgba(79, 140, 255, 0.15)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(79, 140, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.25)'
                        : '0 6px 25px rgba(79, 140, 255, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: theme.palette.secondary.main,
                        marginRight: 1.5,
                        boxShadow: `0 0 10px ${theme.palette.secondary.main}`
                      }
                    }}
                  >
                    Recommendations
                  </Typography>

                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 45, 0.7)'
                        : 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(106, 159, 255, 0.1)'
                        : 'rgba(79, 140, 255, 0.1)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {cvAnalysis.recommendations.map((rec: string, idx: number) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            p: 1.5,
                            borderRadius: 2,
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 45, 0.5)'
                              : 'rgba(240, 247, 255, 0.5)',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark'
                              ? 'rgba(106, 159, 255, 0.1)'
                              : 'rgba(79, 140, 255, 0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            },
                            // Limit animations to first 3 items for better performance
                            animation: idx < 3 ? `fadeInLeft 0.5s ease-out forwards ${idx * 100}ms` : 'none'
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor: theme.palette.info.main,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {idx + 1}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.info.main,
                              fontWeight: 500,
                              lineHeight: 1.5
                            }}
                          >
                            {rec}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
              {/* Summary */}
              {cvAnalysis.summary && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(20, 20, 35, 0.5)'
                      : 'rgba(240, 247, 255, 0.7)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(106, 159, 255, 0.15)'
                      : 'rgba(79, 140, 255, 0.15)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(79, 140, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.25)'
                        : '0 6px 25px rgba(79, 140, 255, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: theme.palette.secondary.main,
                        marginRight: 1.5,
                        boxShadow: `0 0 10px ${theme.palette.secondary.main}`
                      }
                    }}
                  >
                    Summary
                  </Typography>

                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 45, 0.7)'
                        : 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(106, 159, 255, 0.1)'
                        : 'rgba(79, 140, 255, 0.1)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.primary,
                        lineHeight: 1.7,
                        fontWeight: 500,
                        fontStyle: 'italic',
                        position: 'relative',
                        pl: 2,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          borderRadius: 4,
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(to bottom, rgba(106, 159, 255, 0.7), rgba(106, 159, 255, 0.2))'
                            : 'linear-gradient(to bottom, rgba(41, 121, 255, 0.7), rgba(41, 121, 255, 0.2))',
                        }
                      }}
                    >
                      {cvAnalysis.summary}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          <Button
            sx={{
              mt: 5,
              mb: 2,
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: 2,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #4f8cff 10%, #6a9fff 90%)'
                : 'linear-gradient(45deg, #2979ff 10%, #5393ff 90%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(106, 159, 255, 0.4)'
                : '0 4px 20px rgba(41, 121, 255, 0.25)',
              transition: 'all 0.3s ease',
              // Removed continuous animation for better performance
              // animation: 'pulse 3s infinite ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 15px rgba(106, 159, 255, 0.5)'
                  : '0 6px 15px rgba(41, 121, 255, 0.35)',
              },
              '&:active': {
                transform: 'translateY(-1px)',
              }
            }}
            variant="contained"
            color="primary"
            component={Link}
            to="/"
            className="animate-pulse"
            startIcon={<HomeIcon />}
          >
            Back to Home
          </Button>
        </Paper>
      </Container>
    </Box>
    </>
  );
};

export default CVAnalysis;
