import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Container,
  Typography,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { setProfileToStorage } from '../utils/profileUtils';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const UserPage: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, logout } = useAuth();

  // File upload reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State management
  const [cvStatus, setCvStatus] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile>({});
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Interface definitions
  interface Education {
    institution?: string;
    degree?: string;
    dates?: string;
    location?: string;
    description?: string;
  }

  interface Experience {
    company?: string;
    title?: string;
    dates?: string;
    location?: string;
    description?: string;
    achievements?: string[];
  }

  interface UserProfile {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    skills?: string[];
    education?: string | Education | Education[];
    experience?: string | Experience | Experience[];
    summary?: string;
    jobTitle?: string;
    uploaded?: boolean;
    complex_format_detected?: boolean;
    lastUpdated?: string;
    [key: string]: any;
  }

  interface CVAnalysis {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    skills?: string[];
    education?: string | Education | Education[];
    experience?: string | Experience | Experience[];
    summary?: string;
    recommendations?: string[];
    section_scores?: Record<string, Record<string, number>>;
    ats_report?: Record<string, any>;
    bias_report?: Record<string, any>;
    language_report?: Record<string, any>;
    target_job?: string;
    uploaded?: boolean;
    complex_format_detected?: boolean;
    lastUpdated?: string;
    raw_text?: string;
    [key: string]: any;
  }

  interface InterviewSession {
    id: string;
    session_type: string;
    start_time?: string;
    end_time?: string;
    date?: string;
    [key: string]: any;
  }

  // Initialize state from localStorage
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('parsed-profile');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(() => {
    try {
      const stored = localStorage.getItem('cv-analysis');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Interview sessions state
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Load interview sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        // Try to load from localStorage first (for offline mode)
        const storedSessions = localStorage.getItem('interview-sessions');
        if (storedSessions) {
          try {
            const parsedSessions = JSON.parse(storedSessions);
            if (Array.isArray(parsedSessions)) {
              setSessions(Object.values(parsedSessions));
              setSessionsLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse stored sessions:', e);
          }
        }

        // Fall back to API if localStorage doesn't have valid data
        const res = await fetch('/sessions', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.sessions) {
          setSessions(data.sessions);
        } else {
          setSessionsError(data.error || 'Failed to load sessions.');
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
        setSessionsError('Error loading sessions.');
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Handle file upload and CV analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('cv', file);
    setCvStatus('Uploading...');
    setCvAnalysis(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/upload-cv', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setCvStatus('Analysis complete!');
        setCvAnalysis(data);
        localStorage.setItem('cv-analysis', JSON.stringify(data));

        // Create or update profile with CV data
        // Convert complex education and experience objects to strings if needed
        let educationData = data?.education || profile.education || '';
        let experienceData = data?.experience || profile.experience || '';

        // Format education data if it's an object
        if (typeof educationData === 'object' && educationData !== null) {
          if (Array.isArray(educationData)) {
            // Handle array of education objects
            educationData = (educationData as Education[]).map((edu) =>
              `${edu.institution || ''} - ${edu.degree || ''} ${edu.dates || ''}`).join('\n');
          } else {
            // Handle single education object
            const edu = educationData as Education;
            educationData = `${edu.institution || ''} - ${edu.degree || ''} ${edu.dates || ''}`;
          }
        }

        // Format experience data if it's an object
        if (typeof experienceData === 'object' && experienceData !== null) {
          if (Array.isArray(experienceData)) {
            // Handle array of experience objects
            experienceData = (experienceData as Experience[]).map((exp) =>
              `${exp.company || ''} - ${exp.title || ''} ${exp.dates || ''}`).join('\n');
          } else {
            // Handle single experience object
            const exp = experienceData as Experience;
            experienceData = `${exp.company || ''} - ${exp.title || ''} ${exp.dates || ''}`;
          }
        }

        const profileObj = {
          ...profile,
          name: data?.name || profile.name || 'User',
          email: data?.email || profile.email || '',
          phone: data?.phone || profile.phone || '',
          location: data?.location || profile.location || '',
          skills: data?.skills || profile.skills || [],
          education: educationData,
          experience: experienceData,
          summary: data?.summary || profile.summary || '',
          uploaded: true,
          complex_format_detected: data?.complex_format_detected || false,
          lastUpdated: data?.lastUpdated || new Date().toISOString()
        };

        setProfile(profileObj);
        localStorage.setItem('parsed-profile', JSON.stringify(profileObj));
      } else {
        setCvStatus((data && data.error) ? data.error : 'Upload failed.');
      }
    } catch (err) {
      console.error('CV upload error:', err);
      setCvStatus('Upload error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile editing handlers
  const handleEditProfile = () => {
    setEditingProfile({...profile});
    setEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    setIsLoading(true);

    // Update profile state
    setProfile(editingProfile);

    // Save to storage
    setProfileToStorage(editingProfile);

    // Try to save to server
    fetch('/api/save-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        profile: editingProfile,
        cvAnalysis: cvAnalysis
      }),
    })
    .then(res => {
      if (!res.ok) {
        console.warn('Server returned error when saving profile');
      }
    })
    .catch(err => console.warn('Failed to save profile to server:', err))
    .finally(() => {
      setIsLoading(false);
      setEditDialogOpen(false);
    });
  };

  // Skills management
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;

    const updatedSkills = [...(editingProfile.skills || [])];
    if (!updatedSkills.includes(newSkill)) {
      updatedSkills.push(newSkill);
      setEditingProfile({...editingProfile, skills: updatedSkills});
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = (editingProfile.skills || []).filter(
      skill => skill !== skillToRemove
    );
    setEditingProfile({...editingProfile, skills: updatedSkills});
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme => theme.palette.background.default }}>
        <Paper elevation={4} sx={{ p: 5, borderRadius: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" sx={{ mb: 2, color: theme => theme.palette.error.main }}>
            You must be logged in to view this page.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please log in or register to access your profile and interview history.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'
        : 'linear-gradient(135deg, #4f8cff 0%, #e3f2fd 100%)',
      backgroundAttachment: 'fixed',
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
        backgroundImage: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 25% 25%, rgba(106, 159, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 90, 140, 0.15) 0%, transparent 50%)'
          : 'radial-gradient(circle at 25% 25%, rgba(41, 121, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 64, 129, 0.1) 0%, transparent 50%)',
        zIndex: 0,
      }
    }}>
      <Container maxWidth="md" disableGutters sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Profile Section */}
        <Paper elevation={6} sx={{
          maxWidth: 680,
          width: '100%',
          p: { xs: 3, md: 5 },
          bgcolor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(37, 37, 54, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          color: (theme) => theme.palette.text.primary,
          borderRadius: 4,
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 40px 0 rgba(79,140,255,0.15)'
            : '0 8px 40px 0 rgba(79,140,255,0.2)',
          backdropFilter: 'blur(16px)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1.5px solid rgba(79,140,255,0.15)'
            : '1.5px solid rgba(79,140,255,0.15)',
          position: 'relative',
          mb: 4,
          animation: 'fadeInUp 0.8s ease-out forwards',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 12px 40px 0 rgba(79,140,255,0.25)'
              : '0 12px 40px 0 rgba(79,140,255,0.3)',
          },
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #4f8cff 0%, #ff4081 100%)'
              : 'linear-gradient(90deg, #1565c0 0%, #ff4081 100%)',
          }} />

          {/* Profile Header with Background */}
          <Box
            sx={{
              position: 'relative',
              mt: -5,
              mx: -5,
              mb: 4,
              height: 120,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(79,140,255,0.2) 0%, rgba(255,64,129,0.2) 100%)'
                : 'linear-gradient(135deg, rgba(41,121,255,0.1) 0%, rgba(255,64,129,0.1) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              justifyContent: 'center',
              borderBottom: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)'}`
            }}
          >
            {/* Decorative elements */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.5,
              background: theme.palette.mode === 'dark'
                ? 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
                : 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
              backgroundSize: '80px 80px',
            }} />
          </Box>

          <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ position: 'relative', mt: -12 }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #4f8cff 0%, #ff4081 100%)'
                  : 'linear-gradient(135deg, #1565c0 0%, #ff4081 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 24px rgba(0,0,0,0.4), 0 0 0 4px rgba(79,140,255,0.3)'
                  : '0 8px 24px rgba(0,0,0,0.1), 0 0 0 4px rgba(41,121,255,0.2)',
                mb: 1,
                animation: 'pulse 3s infinite ease-in-out',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05) rotate(5deg)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 12px 28px rgba(0,0,0,0.5), 0 0 0 6px rgba(79,140,255,0.4)'
                    : '0 12px 28px rgba(0,0,0,0.15), 0 0 0 6px rgba(41,121,255,0.3)',
                }
              }}
            >
              {/* Avatar or Icon here */}
              <span
                role="img"
                aria-label="profile"
                style={{
                  fontSize: 64,
                  animation: 'bounce 2s infinite'
                }}
              >
                👨‍💼
              </span>
            </Box>

            {/* User Name */}
            <Typography variant="h5" sx={{
              fontWeight: 700,
              textAlign: 'center',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, #6a9fff, #ff5a8c)'
                : 'linear-gradient(90deg, #2979ff, #ff4081)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              animation: 'fadeInUp 0.8s ease-out forwards',
            }}>
              {profile.name || 'Your Profile'}
            </Typography>

            {/* Job Title */}
            {profile.jobTitle && (
              <Typography variant="subtitle1" sx={{
                color: 'text.secondary',
                textAlign: 'center',
                mt: -1,
                mb: 1,
                animation: 'fadeInUp 0.8s ease-out forwards',
                animationDelay: '100ms'
              }}>
                {profile.jobTitle}
              </Typography>
            )}

            {/* Profile Info */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              width: '100%',
              mb: 3,
              animation: 'fadeInUp 0.8s ease-out forwards',
              animationDelay: '200ms'
            }}>
              {profile.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{profile.email}</Typography>
                </Box>
              )}

              {profile.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{profile.location}</Typography>
                </Box>
              )}

              {profile.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{profile.phone}</Typography>
                </Box>
              )}

              {profile.education && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    {typeof profile.education === 'object'
                      ? (Array.isArray(profile.education)
                          ? (profile.education as Education[]).map((edu) => edu.institution || edu.degree).join(', ')
                          : ((profile.education as Education).institution || (profile.education as Education).degree || 'Education details'))
                      : profile.education}
                  </Typography>
                </Box>
              )}

              {profile.experience && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon color="primary" fontSize="small" />
                  <Typography variant="body2" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {typeof profile.experience === 'object'
                      ? (Array.isArray(profile.experience)
                          ? (profile.experience as Experience[]).map((exp) => exp.company || exp.title).join(', ')
                          : ((profile.experience as Experience).company || (profile.experience as Experience).title || 'Experience details'))
                      : profile.experience}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Summary */}
            {profile.summary && (
              <Box sx={{
                width: '100%',
                mb: 3,
                animation: 'fadeInUp 0.8s ease-out forwards',
                animationDelay: '250ms'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Professional Summary
                </Typography>
                <Typography variant="body2" sx={{
                  lineHeight: 1.6,
                  color: theme.palette.text.secondary,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                }}>
                  {profile.summary}
                </Typography>
              </Box>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Box sx={{
                width: '100%',
                mb: 3,
                animation: 'fadeInUp 0.8s ease-out forwards',
                animationDelay: '300ms'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      size="small"
                      color="primary"
                      variant={index % 2 === 0 ? "filled" : "outlined"}
                      sx={{
                        borderRadius: '4px',
                        animation: `fadeIn 0.5s ease-out forwards ${index * 100}ms`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              mt: 1,
              width: '100%',
              justifyContent: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEditProfile}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                  py: 1.2,
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  animationDelay: '200ms',
                  transition: 'all 0.3s ease',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #4f8cff 30%, #6a9fff 90%)'
                    : 'linear-gradient(45deg, #1c54b2 30%, #2979ff 90%)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 15px rgba(79,140,255,0.4)'
                  }
                }}
                className="animate-fadeInUp delay-200"
              >
                Edit Profile
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={async () => {
                  try {
                    // Save to localStorage first to ensure it's available immediately
                    setProfileToStorage(profile);
                    localStorage.setItem('cv-analysis', JSON.stringify(cvAnalysis));

                    // Then try to save to the server session
                    const res = await fetch('/api/save-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ profile, cvAnalysis }),
                    });

                    if (res.ok) {
                      alert('Profile and CV analysis saved!');
                    } else {
                      const data = await res.json();
                      if (data.error === 'Authentication required') {
                        alert('Please log in to save your profile to the server. Your profile has been saved locally.');
                      } else {
                        alert('Profile saved locally, but server save failed: ' + (data.error || 'Unknown error'));
                      }
                    }
                  } catch (err) {
                    alert('Profile saved locally, but server save failed. You can still use the chatbot.');
                  }
                }}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                  py: 1.2,
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  animationDelay: '400ms',
                  transition: 'all 0.3s ease',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #5183e0 30%, #4f8cff 90%)'
                    : 'linear-gradient(45deg, #1976d2 30%, #1c54b2 90%)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 15px rgba(79,140,255,0.4)'
                  }
                }}
                className="animate-fadeInUp delay-400"
              >
                Save Data
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={async () => {
                  if (window.confirm('Are you sure you want to clear your profile? This cannot be undone.')) {
                    localStorage.removeItem('parsed-profile');
                    localStorage.removeItem('cv-analysis');
                    setProfile({});
                    setCvAnalysis(null);
                    try {
                      await fetch('/api/clear-profile', { method: 'POST', credentials: 'include' });
                    } catch {}
                    alert('Profile cleared.');
                  }
                }}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                  py: 1.2,
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  animationDelay: '600ms',
                  transition: 'all 0.3s ease',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 15px rgba(233,30,99,0.3)'
                  }
                }}
                className="animate-fadeInUp delay-600"
              >
                Clear Profile
              </Button>
            </Box>

            {/* Logout Button */}
            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
              mb: 3,
              animation: 'fadeInUp 0.8s ease-out forwards',
              animationDelay: '800ms'
            }}>
              <Button
                variant="contained"
                color="error"
                onClick={async () => {
                  try {
                    await logout();
                    // Use window.location to ensure a full page reload after logout
                    window.location.href = '/login';
                  } catch (err: any) {
                    alert(err.message || 'Logout failed. Please try again.');
                  }
                }}
                sx={{
                  py: 1.2,
                  px: 4,
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #f44336 30%, #ff5252 90%)'
                    : 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 15px rgba(244,67,54,0.4)'
                  }
                }}
                className="animate-fadeInUp delay-800"
              >
                Logout
              </Button>
            </Box>

            {/* Profile Edit Dialog */}
            <Dialog
              open={editDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle>Edit Your Profile</DialogTitle>
              <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Name"
                      fullWidth
                      value={editingProfile.name || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      fullWidth
                      value={editingProfile.email || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, email: e.target.value})}
                      margin="normal"
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Job Title"
                      fullWidth
                      value={editingProfile.jobTitle || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, jobTitle: e.target.value})}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Location"
                      fullWidth
                      value={editingProfile.location || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, location: e.target.value})}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      fullWidth
                      value={editingProfile.phone || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, phone: e.target.value})}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Education"
                      fullWidth
                      value={typeof editingProfile.education === 'object'
                        ? (Array.isArray(editingProfile.education)
                            ? (editingProfile.education as Education[]).map((edu) =>
                                `${edu.institution || ''} - ${edu.degree || ''} ${edu.dates || ''}`).join('\n')
                            : `${(editingProfile.education as Education).institution || ''} - ${(editingProfile.education as Education).degree || ''} ${(editingProfile.education as Education).dates || ''}`)
                        : (editingProfile.education || '')}
                      onChange={(e) => setEditingProfile({...editingProfile, education: e.target.value})}
                      margin="normal"
                      variant="outlined"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Experience"
                      fullWidth
                      value={typeof editingProfile.experience === 'object'
                        ? (Array.isArray(editingProfile.experience)
                            ? (editingProfile.experience as Experience[]).map((exp) =>
                                `${exp.company || ''} - ${exp.title || ''} ${exp.dates || ''}`).join('\n')
                            : `${(editingProfile.experience as Experience).company || ''} - ${(editingProfile.experience as Experience).title || ''} ${(editingProfile.experience as Experience).dates || ''}`)
                        : (editingProfile.experience || '')}
                      onChange={(e) => setEditingProfile({...editingProfile, experience: e.target.value})}
                      margin="normal"
                      variant="outlined"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Summary"
                      fullWidth
                      value={editingProfile.summary || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, summary: e.target.value})}
                      margin="normal"
                      variant="outlined"
                      multiline
                      rows={4}
                      helperText="A brief professional summary about yourself"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Skills</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {(editingProfile.skills || []).map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            onDelete={() => handleRemoveSkill(skill)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          label="Add Skill"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                          variant="outlined"
                          size="small"
                        />
                        <Button
                          variant="contained"
                          onClick={handleAddSkill}
                          disabled={!newSkill.trim()}
                        >
                          Add
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditDialogOpen(false)} color="secondary">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} color="primary" variant="contained">
                  Save Profile
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Paper>

        {/* CV Upload and Analysis Section */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 3,
            maxWidth: 680,
            width: '100%',
            animation: 'fadeInUp 0.8s ease-out forwards',
            animationDelay: '300ms',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(37, 37, 54, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 28px rgba(79,140,255,0.2)'
                : '0 12px 28px rgba(41,121,255,0.15)'
            }
          }}
          className="animate-fadeInUp delay-300"
        >
          {/* Decorative top bar */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #ff4081 0%, #4f8cff 100%)'
              : 'linear-gradient(90deg, #ff4081 0%, #1565c0 100%)',
          }} />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <DescriptionIcon
              color="secondary"
              sx={{
                fontSize: 28,
                mr: 1.5,
                animation: 'pulse 2s infinite ease-in-out'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                animation: 'fadeInLeft 0.8s ease-out forwards',
                animationDelay: '500ms',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #ff5a8c, #6a9fff)'
                  : 'linear-gradient(90deg, #ff4081, #2979ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              className="animate-fadeInLeft delay-500"
            >
              CV Upload and Analysis
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 3,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(41,121,255,0.03)',
            border: `1px dashed ${theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(41,121,255,0.2)'}`,
          }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="contained"
              color="secondary"
              startIcon={<UploadFileIcon />}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: 16,
                flex: { xs: '1 1 100%', sm: 'initial' },
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #ff5a8c 30%, #ff80ab 90%)'
                  : 'linear-gradient(45deg, #ff4081 30%, #f48fb1 90%)',
                color: '#fff',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 15px rgba(233,30,99,0.4)'
                },
                transition: 'all 0.3s ease'
              }}
              disabled={!isAuthenticated || isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isLoading ? 'Uploading...' : 'Upload CV'}
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{
              flex: { xs: '1 1 100%', sm: 1 },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              Upload your CV in PDF, DOC, or DOCX format to get personalized interview questions and feedback.
            </Typography>
          </Box>

          {isLoading && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress
                color="secondary"
                sx={{
                  height: 6,
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #ff4081, #4f8cff)'
                  }
                }}
              />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                Analyzing your CV... This may take a moment.
              </Typography>
            </Box>
          )}

          {cvStatus && !isLoading && (
            <Box sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: cvStatus.includes('error') || cvStatus.includes('fail')
                ? theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.1)' : 'rgba(244,67,54,0.05)'
                : theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.05)',
              border: `1px solid ${cvStatus.includes('error') || cvStatus.includes('fail')
                ? theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.3)' : 'rgba(244,67,54,0.2)'
                : theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.2)'}`
            }}>
              {cvStatus.includes('error') || cvStatus.includes('fail')
                ? <ErrorIcon color="error" />
                : <CheckCircleIcon color="success" />}
              <Typography sx={{
                color: cvStatus.includes('error') || cvStatus.includes('fail')
                  ? theme.palette.error.main
                  : theme.palette.success.main
              }}>
                {cvStatus}
              </Typography>
            </Box>
          )}

          {!cvAnalysis && !cvStatus?.startsWith('Uploading') && !isLoading && (
            <Box sx={{
              textAlign: 'center',
              py: 3,
              opacity: 0.7
            }}>
              <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No CV analysis found. Please upload your CV to get started.
              </Typography>
            </Box>
          )}

          {cvAnalysis && (
            <Box sx={{
              mt: 2,
              animation: 'fadeIn 0.8s ease-out forwards',
            }}>
              {cvAnalysis.summary && (
                <Paper elevation={0} sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(41,121,255,0.03)',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(41,121,255,0.1)'}`,
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                    Summary
                  </Typography>
                  <Typography variant="body2">
                    {cvAnalysis.summary}
                  </Typography>
                </Paper>
              )}

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{
                    p: 2,
                    height: '100%',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(41,121,255,0.03)',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(41,121,255,0.1)'}`,
                  }}>
                    {cvAnalysis.education && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span role="img" aria-label="education">🎓</span> Education
                        </Typography>
                        <Typography variant="body2">
                          {typeof cvAnalysis.education === 'object'
                            ? (Array.isArray(cvAnalysis.education)
                                ? (cvAnalysis.education as Education[]).map((edu) =>
                                    `${edu.institution || ''} - ${edu.degree || ''} ${edu.dates || ''}`).join(', ')
                                : `${(cvAnalysis.education as Education).institution || ''} - ${(cvAnalysis.education as Education).degree || ''} ${(cvAnalysis.education as Education).dates || ''}`)
                            : cvAnalysis.education}
                        </Typography>
                      </Box>
                    )}

                    {cvAnalysis.experience && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span role="img" aria-label="experience">💼</span> Experience
                        </Typography>
                        <Typography variant="body2">
                          {typeof cvAnalysis.experience === 'object'
                            ? (Array.isArray(cvAnalysis.experience)
                                ? (cvAnalysis.experience as Experience[]).map((exp) =>
                                    `${exp.company || ''} - ${exp.title || ''} ${exp.dates || ''}`).join(', ')
                                : `${(cvAnalysis.experience as Experience).company || ''} - ${(cvAnalysis.experience as Experience).title || ''} ${(cvAnalysis.experience as Experience).dates || ''}`)
                            : cvAnalysis.experience}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

              </Grid>

              {cvAnalysis.recommendations && cvAnalysis.recommendations.length > 0 && (
                <Paper elevation={0} sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(41,121,255,0.03)',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(41,121,255,0.1)'}`,
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span role="img" aria-label="recommendations">💡</span> Recommendations
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {cvAnalysis.recommendations.map((rec: string, idx: number) => (
                      <Box
                        component="li"
                        key={idx}
                        sx={{
                          mb: 0.5,
                          animation: `fadeInLeft 0.5s ease-out forwards ${idx * 100}ms`,
                        }}
                      >
                        <Typography variant="body2">{rec}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/cv-analysis"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.2,
                    px: 3,
                    fontWeight: 600,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #4f8cff 30%, #6a9fff 90%)'
                      : 'linear-gradient(45deg, #1c54b2 30%, #2979ff 90%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 15px rgba(79,140,255,0.4)'
                    }
                  }}
                >
                  View Full CV Analysis
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Interview History Section */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 3,
            maxWidth: 680,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(37, 37, 54, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            animation: 'fadeInUp 0.8s ease-out forwards',
            animationDelay: '400ms',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 28px rgba(79,140,255,0.2)'
                : '0 12px 28px rgba(41,121,255,0.15)'
            }
          }}
          className="animate-fadeInUp delay-400"
        >
          {/* Decorative top bar */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #6a9fff 0%, #ff5a8c 100%)'
              : 'linear-gradient(90deg, #2979ff 0%, #ff4081 100%)',
          }} />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HistoryIcon
              color="primary"
              sx={{
                fontSize: 28,
                mr: 1.5,
                animation: 'pulse 2s infinite ease-in-out'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                animation: 'fadeInLeft 0.8s ease-out forwards',
                animationDelay: '600ms',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #6a9fff, #ff5a8c)'
                  : 'linear-gradient(90deg, #2979ff, #ff4081)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              className="animate-fadeInLeft delay-600"
            >
              Interview History
            </Typography>
          </Box>

          {sessionsLoading && (
            <Box sx={{ width: '100%', mb: 3, mt: 4 }}>
              <LinearProgress
                color="primary"
                sx={{
                  height: 6,
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #6a9fff, #ff5a8c)'
                  }
                }}
              />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                Loading your interview sessions...
              </Typography>
            </Box>
          )}

          {sessionsError && (
            <Box mb={3}>
              <Paper elevation={0} sx={{
                p: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.1)' : 'rgba(244,67,54,0.05)',
                borderRadius: 2,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.3)' : 'rgba(244,67,54,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <ErrorIcon color="error" sx={{ fontSize: 24 }} />
                <Typography sx={{ color: theme.palette.error.main }}>
                  {sessionsError}
                </Typography>
              </Paper>
            </Box>
          )}

          {!sessionsLoading && !sessionsError && (
            sessions.length === 0 ? (
              <Box sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(41,121,255,0.03)',
                borderRadius: 2,
                border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(41,121,255,0.1)'}`,
                mt: 2,
                animation: 'fadeIn 0.8s ease-out forwards',
              }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(41,121,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <span role="img" aria-label="No sessions" style={{ fontSize: 40 }}>🗂️</span>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  No Interview Sessions Yet
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  Start a new interview session to track your progress and improve your skills.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/interview"
                  startIcon={<span role="img" aria-label="start">🚀</span>}
                  sx={{
                    py: 1.2,
                    px: 3,
                    fontWeight: 600,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #4f8cff 30%, #6a9fff 90%)'
                      : 'linear-gradient(45deg, #1c54b2 30%, #2979ff 90%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 15px rgba(79,140,255,0.4)'
                    }
                  }}
                >
                  Start New Interview
                </Button>
              </Box>
            ) : (
              <Box sx={{
                animation: 'fadeIn 0.8s ease-out forwards',
              }}>
                <Grid container spacing={2}>
                  {sessions.map((session, index) => (
                    <Grid item xs={12} key={session.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(41,121,255,0.03)',
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(41,121,255,0.1)'}`,
                          transition: 'all 0.3s ease',
                          animation: `fadeInUp 0.5s ease-out forwards ${index * 100}ms`,
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 6px 16px rgba(79,140,255,0.15)'
                              : '0 6px 16px rgba(41,121,255,0.1)',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(41,121,255,0.05)',
                          }
                        }}
                      >
                        <Box sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: session.session_type === 'Technical'
                            ? theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #4f8cff, #6a9fff)' : 'linear-gradient(135deg, #1c54b2, #2979ff)'
                            : theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #ff5a8c, #ff80ab)' : 'linear-gradient(135deg, #ff4081, #f48fb1)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}>
                          <span role="img" aria-label="Interview" style={{ fontSize: 30, color: '#fff' }}>
                            {session.session_type === 'Technical' ? '💻' : session.session_type === 'Behavioral' ? '🗣️' : '🎤'}
                          </span>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{
                            fontWeight: 700,
                            mb: 0.5,
                            color: session.session_type === 'Technical'
                              ? 'primary.main'
                              : 'secondary.main'
                          }}>
                            {session.session_type} Interview
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 10,
                              bgcolor: session.end_time
                                ? theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.1)'
                                : theme.palette.mode === 'dark' ? 'rgba(255,152,0,0.1)' : 'rgba(255,152,0,0.1)',
                              border: `1px solid ${session.end_time
                                ? theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.3)'
                                : theme.palette.mode === 'dark' ? 'rgba(255,152,0,0.3)' : 'rgba(255,152,0,0.3)'}`,
                            }}>
                              {session.end_time
                                ? <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                                : <span role="img" aria-label="in-progress" style={{ fontSize: 16, marginRight: 4 }}>⏳</span>
                              }
                              <Typography variant="caption" sx={{
                                fontWeight: 600,
                                color: session.end_time
                                  ? 'success.main'
                                  : 'warning.main'
                              }}>
                                {session.end_time ? 'Completed' : 'In Progress'}
                              </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              {session.start_time ? new Date(session.start_time).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : (session.date || new Date().toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }))}
                            </Typography>
                          </Box>

                          {session.questions_count && (
                            <Typography variant="body2" color="text.secondary">
                              Questions: {session.questions_count}
                            </Typography>
                          )}
                        </Box>

                        <Button
                          variant="outlined"
                          color={session.session_type === 'Technical' ? "primary" : "secondary"}
                          size="small"
                          component={Link}
                          to={`/session/${session.id}`}
                          endIcon={<ArrowForwardIcon />}
                          sx={{
                            borderRadius: 2,
                            minWidth: 100,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          {session.end_time ? 'View' : 'Continue'}
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/interview"
                    startIcon={<AddIcon />}
                    sx={{
                      py: 1.2,
                      px: 3,
                      fontWeight: 600,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #4f8cff 30%, #6a9fff 90%)'
                        : 'linear-gradient(45deg, #1c54b2 30%, #2979ff 90%)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 15px rgba(79,140,255,0.4)'
                      }
                    }}
                  >
                    New Interview
                  </Button>
                </Box>
              </Box>
            )
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default UserPage;