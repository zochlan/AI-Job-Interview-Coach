import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useThemeContext } from '../contexts/ThemeContext';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  isLink?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true, isLink = true }) => {
  const { mode } = useThemeContext();

  // Define sizes
  const sizes = {
    small: { icon: 28, text: '1.05rem', spacing: 0.75 },
    medium: { icon: 36, text: '1.35rem', spacing: 1 },
    large: { icon: 52, text: '1.65rem', spacing: 1.5 },
  };

  // Get current size
  const currentSize = sizes[size];

  return (
    <Box
      component={isLink ? RouterLink : 'div'}
      {...(isLink ? { to: "/" } : {})}
      sx={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
        animation: 'fadeIn 0.5s ease-out',
      }}
      className="animate-fadeIn"
    >
      {/* Logo Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: currentSize.icon,
          height: currentSize.icon,
          borderRadius: '50%',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #5183e0 0%, #6a9fff 100%)'
            : 'linear-gradient(135deg, #1c54b2 0%, #2979ff 100%)',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: currentSize.icon * 0.45,
          mr: currentSize.spacing,
          transition: 'all 0.3s ease',
          boxShadow: mode === 'dark'
            ? '0 0 12px rgba(106, 159, 255, 0.6)'
            : '0 0 12px rgba(41, 121, 255, 0.5)',
          border: '2px solid',
          borderColor: mode === 'dark'
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            boxShadow: mode === 'dark'
              ? '0 0 18px rgba(106, 159, 255, 0.8)'
              : '0 0 18px rgba(41, 121, 255, 0.7)',
            transform: 'scale(1.05) rotate(5deg)',
          },
          animation: 'pulse 3s infinite ease-in-out',
        }}
        className="animate-pulse"
      >
        AI
      </Box>

      {/* Logo Text */}
      {showText && (
        <Typography
          variant={size === 'large' ? 'h5' : size === 'medium' ? 'h6' : 'body1'}
          sx={{
            fontWeight: 800,
            fontSize: currentSize.text,
            letterSpacing: '0.5px',
            background: mode === 'dark'
              ? 'linear-gradient(45deg, #8bb5ff 30%, #6a9fff 90%)'
              : 'linear-gradient(45deg, #2979ff 30%, #5393ff 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transition: 'all 0.3s ease',
            textShadow: mode === 'dark'
              ? '0 0 20px rgba(106, 159, 255, 0.3)'
              : '0 0 20px rgba(41, 121, 255, 0.2)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-2px',
              left: '0',
              width: '0%',
              height: '2px',
              background: mode === 'dark'
                ? 'linear-gradient(45deg, #8bb5ff 30%, #6a9fff 90%)'
                : 'linear-gradient(45deg, #2979ff 30%, #5393ff 90%)',
              transition: 'width 0.3s ease',
              opacity: 0,
            },
            '&:hover::after': {
              width: '100%',
              opacity: 0.7,
            }
          }}
        >
          Interview Coach
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
