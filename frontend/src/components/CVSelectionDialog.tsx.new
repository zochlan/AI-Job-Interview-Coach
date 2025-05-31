import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useHistory } from 'react-router-dom';
import { hasCVDataAvailable } from '../utils/storage';

interface CVSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectOption: (includeCV: boolean) => void;
}

const CVSelectionDialog: React.FC<CVSelectionDialogProps> = ({
  open,
  onClose,
  onSelectOption
}) => {
  const theme = useTheme();
  const history = useHistory();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State to track which option is selected and if confirmation is shown
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check if CV data is available using our utility function
  const hasCVData = hasCVDataAvailable();

  // Navigate to CV Analysis page
  const goToCVAnalysis = () => {
    onClose();
    history.push('/cv-analysis');
  };
  
  // Handle option selection
  const handleOptionSelect = (includeCV: boolean) => {
    setSelectedOption(includeCV);
    setShowConfirmation(true);
  };
  
  // Handle final confirmation
  const handleConfirm = () => {
    if (selectedOption !== null) {
      onSelectOption(selectedOption);
    }
  };
  
  // Reset state when dialog closes
  const handleClose = () => {
    setSelectedOption(null);
    setShowConfirmation(false);
    onClose();
  };

  // Option 1 box styles
  const includeBoxStyles = {
    flex: 1,
    border: `2px solid ${hasCVData
      ? theme.palette.primary.main
      : theme.palette.action.disabled}`,
    borderRadius: 2,
    p: 2,
    cursor: hasCVData ? 'pointer' : 'not-allowed',
    opacity: hasCVData ? 1 : 0.6,
    transition: 'all 0.2s ease',
    '&:hover': hasCVData ? {
      bgcolor: theme.palette.mode === 'dark'
        ? 'rgba(79,140,255,0.1)'
        : 'rgba(79,140,255,0.05)',
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    } : {},
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...(selectedOption === true ? {
      bgcolor: theme.palette.mode === 'dark'
        ? 'rgba(79,140,255,0.2)'
        : 'rgba(79,140,255,0.1)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateY(-4px)'
    } : {})
  };

  // Option 2 box styles
  const skipBoxStyles = {
    flex: 1,
    border: `2px solid ${theme.palette.secondary.main}`,
    borderRadius: 2,
    p: 2,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: theme.palette.mode === 'dark'
        ? 'rgba(233,30,99,0.1)'
        : 'rgba(233,30,99,0.05)',
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...(selectedOption === false ? {
      bgcolor: theme.palette.mode === 'dark'
        ? 'rgba(233,30,99,0.2)'
        : 'rgba(233,30,99,0.1)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateY(-4px)'
    } : {})
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.1)',
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(30,30,45,0.95)'
            : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.05)'}`,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        pt: 3,
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '1.5rem'
      }}>
        Interview Personalization
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{
          textAlign: 'center',
          mb: 3,
          color: theme.palette.text.secondary
        }}>
          Would you like to include your CV data in this interview session?
          {!hasCVData && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 1, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
            >
              <span role="img" aria-label="Warning">⚠️</span>
              No CV data found. You can upload your CV in the CV Analysis page.
            </Typography>
          )}
        </DialogContentText>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 2
        }}>
          {/* Option 1: Include CV */}
          <Box
            onClick={() => hasCVData && handleOptionSelect(true)}
            sx={includeBoxStyles}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CheckCircleIcon
                color={hasCVData ? "primary" : "disabled"}
                sx={{ fontSize: 48, mb: 1 }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Include CV
              </Typography>
              <Typography variant="body2" color="textSecondary">
                The AI will personalize questions based on your experience, skills, and background.
              </Typography>
            </Box>
          </Box>

          {/* Option 2: Don't Include CV */}
          <Box
            onClick={() => handleOptionSelect(false)}
            sx={skipBoxStyles}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CancelIcon
                color="secondary"
                sx={{ fontSize: 48, mb: 1 }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Skip CV
              </Typography>
              <Typography variant="body2" color="textSecondary">
                The AI will ask general interview questions without personalization.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(0,0,0,0.2)'
            : 'rgba(0,0,0,0.03)',
          p: 2,
          borderRadius: 1
        }}>
          <DescriptionIcon color="info" />
          <Typography variant="body2" color="textSecondary">
            Your choice will be saved with the session and displayed in the interview interface.
          </Typography>
        </Box>

        {/* Confirmation button that appears after selection */}
        <Fade in={showConfirmation}>
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            justifyContent: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleConfirm}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(79,140,255,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 16px rgba(79,140,255,0.4)'
                }
              }}
            >
              Start Interview
            </Button>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: !hasCVData ? 'space-between' : 'flex-end' }}>
        {!hasCVData && (
          <Button
            startIcon={<UploadFileIcon />}
            onClick={goToCVAnalysis}
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 500 }}
          >
            Upload CV
          </Button>
        )}
        <Button
          onClick={handleClose}
          color="inherit"
          sx={{ fontWeight: 500 }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVSelectionDialog;
