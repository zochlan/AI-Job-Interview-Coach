import React, { useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { Box, Typography, CircularProgress, Alert, AlertTitle } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { setProfileToStorage } from '../utils/profileUtils';
import { CVAnalysis } from '../types/profileTypes';
import { useCVContext } from '../contexts/CVContext';
import { saveCVAnalysis } from '../utils/indexedDB';

interface CVUploadProps {
  onProfileParsed: (profile: CVAnalysis) => void;
}

// Regular functional component
const CVUpload: React.FC<CVUploadProps> = ({ onProfileParsed }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Get the CV context
  const { setCVData } = useCVContext();

  // Using useCallback to memoize the event handler
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Reset states
    setUploading(true);
    setError(null);
    setWarning(null);
    setProgress(0);
    setUploadSuccess(false);

    // Create form data
    const formData = new FormData();
    formData.append('cv', file);

    try {
      // Use axios with upload progress
      const res = await axios.post<any>('/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setProgress(percentCompleted);
        },
        timeout: 60000, // 60 second timeout
      } as any);

      // Check for warnings in the response
      if (res.data.warning) {
        setWarning(res.data.warning);
      }

      // Create a profile object with essential fields
      const profileData = {
        name: res.data.name || 'User',
        email: res.data.email || '',
        phone: res.data.phone || '',
        location: res.data.location || '',
        skills: res.data.skills || [],
        education: res.data.education || '',
        experience: res.data.experience || '',
        summary: res.data.summary || '',
        uploaded: true,
        lastUpdated: new Date().toISOString(),
        complex_format_detected: res.data.complex_format_detected || false
      };

      // Save both the full CV analysis and the profile using our utility function
      localStorage.setItem('cv-analysis', JSON.stringify(res.data));
      setProfileToStorage(profileData);

      // Save to IndexedDB for persistence
      try {
        await saveCVAnalysis(res.data);
        console.log('CV data saved to IndexedDB');
      } catch (indexedDBErr) {
        console.warn('Failed to save CV data to IndexedDB:', indexedDBErr);
      }

      // Update the CV context
      setCVData(res.data);

      // Also try to save to server session
      try {
        await axios.post('/save-profile', {
          profile: profileData,
          cvAnalysis: res.data
        }, { withCredentials: true });
      } catch (sessionErr) {
        console.warn('Failed to save profile to server session, but local storage succeeded');
      }

      // Pass the data to the parent component
      onProfileParsed(res.data);
      setUploadSuccess(true);

    } catch (err: any) {
      console.error('CV upload error:', err);

      // Extract error message from response if available
      let errorMessage = 'Failed to parse CV. Please try again.';

      if (err.response) {
        // Server responded with an error
        if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;

          // If there are more details, add them
          if (err.response.data.details) {
            errorMessage += `: ${err.response.data.details}`;
          }

          // If there are suggestions, add them
          if (err.response.data.suggestions && Array.isArray(err.response.data.suggestions)) {
            errorMessage += ` Try: ${err.response.data.suggestions.join(', ')}`;
          }
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection.';
      } else if (err.message) {
        // Something else happened
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Create a minimal profile anyway so the user can still use the app
      const minimalProfile = {
        name: 'User',
        email: '',
        phone: '',
        location: '',
        skills: [],
        education: [],
        experience: [],
        summary: '',
        uploaded: true,
        lastUpdated: new Date().toISOString(),
        complex_format_detected: false
      };

      // Save to localStorage
      localStorage.setItem('parsed-profile', JSON.stringify(minimalProfile));

      // Save to IndexedDB for persistence
      try {
        await saveCVAnalysis(minimalProfile);
        console.log('Minimal CV data saved to IndexedDB');
      } catch (indexedDBErr) {
        console.warn('Failed to save minimal CV data to IndexedDB:', indexedDBErr);
      }

      // Update the CV context
      setCVData(minimalProfile);

    } finally {
      setUploading(false);
      // Reset the file input so the same file can be selected again
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  }, [onProfileParsed, setCVData]); // Add dependency array for useCallback

  return (
    <Box
      className="cv-upload"
      sx={{
        my: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 500,
        mx: 'auto'
      }}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        ref={fileInput}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        sx={{
          fontWeight: 700,
          borderRadius: 2,
          minWidth: 180,
          py: 1.5,
          px: 3,
          fontSize: '1rem',
          mb: (error || warning || uploadSuccess) ? 3 : 0,
          background: theme => theme.palette.mode === 'dark'
            ? 'linear-gradient(45deg, #4f8cff 10%, #6a9fff 90%)'
            : 'linear-gradient(45deg, #2979ff 10%, #5393ff 90%)',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(106, 159, 255, 0.4)'
            : '0 4px 20px rgba(41, 121, 255, 0.25)',
          transition: 'all 0.3s ease',
          // Simplified hover effect for better performance
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 4px 15px rgba(106, 159, 255, 0.5)'
              : '0 4px 15px rgba(41, 121, 255, 0.35)',
          },
          '&:active': {
            transform: 'translateY(-1px)',
          },
          '&:disabled': {
            background: theme => theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, rgba(79, 140, 255, 0.5) 10%, rgba(106, 159, 255, 0.5) 90%)'
              : 'linear-gradient(45deg, rgba(41, 121, 255, 0.5) 10%, rgba(83, 147, 255, 0.5) 90%)',
            color: theme => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.8)',
          }
        }}
        startIcon={uploading ? <CircularProgress size={22} color="inherit" /> : <UploadFileIcon />}
      >
        {uploading ? `Uploading ${progress}%` : 'Upload CV'}
      </Button>

      {uploadSuccess && !error && (
        <Alert
          severity="success"
          sx={{
            mt: 2,
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 200, 83, 0.15)',
            // Simplified animation for better performance
            animation: 'fadeIn 0.3s ease-out forwards',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>Success</AlertTitle>
          Your CV has been successfully uploaded and analyzed.
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 2,
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)',
            // Simplified animation for better performance
            animation: 'fadeIn 0.3s ease-out forwards',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {warning && !error && (
        <Alert
          severity="warning"
          sx={{
            mt: 2,
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(237, 108, 2, 0.15)',
            // Simplified animation for better performance
            animation: 'fadeIn 0.3s ease-out forwards',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>Warning</AlertTitle>
          {warning}
        </Alert>
      )}

      {uploading && (
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            // Simplified animation for better performance
            animation: 'fadeIn 0.3s ease-out forwards'
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: 8,
              bgcolor: 'rgba(0,0,0,0.1)',
              borderRadius: 4,
              mb: 1,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${progress}%`,
                bgcolor: theme => theme.palette.primary.main,
                borderRadius: 4,
                // Smoother transition for progress bar
                transition: 'width 0.2s linear',
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #4f8cff, #6a9fff)'
                  : 'linear-gradient(90deg, #2979ff, #5393ff)',
                boxShadow: '0 0 10px rgba(41, 121, 255, 0.5)',
              }}
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            Processing your CV... {progress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CVUpload;
