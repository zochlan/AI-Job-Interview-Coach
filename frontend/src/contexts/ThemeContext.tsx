import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme as MuiTheme, PaletteMode } from '@mui/material';

// Extended theme interface with custom properties
export interface Theme extends MuiTheme {
  containerBg: string;
  paperBg: string;
  paperShadow: string;
  paperBorder: string;
  text: string;
  link: string;
  border: string;
  input: string;
  background: string;
}

// Define the context type
interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  theme: Theme;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Props for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme Provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the user's preferred color scheme from localStorage or system preference
  const getInitialMode = (): PaletteMode => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      return savedMode;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  // State to track the current theme mode
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  // Function to toggle between light and dark mode
  const toggleColorMode = () => {
    console.log('toggleColorMode called, current mode before toggle:', mode);

    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      console.log('Theme mode toggled to:', newMode);

      // Force update document body background
      document.body.style.backgroundColor = newMode === 'dark' ? '#1a1a2e' : '#e8f5ff';
      document.body.style.color = newMode === 'dark' ? '#f5f5f5' : '#1a237e';

      // Add a data attribute to the body for debugging
      document.body.setAttribute('data-theme-mode', newMode);

      // Log the current document body styles
      console.log('Body background color set to:', document.body.style.backgroundColor);
      console.log('Body color set to:', document.body.style.color);

      return newMode;
    });

    // Log after state update (this will show the previous state due to React's asynchronous state updates)
    console.log('toggleColorMode completed, mode after toggle (may still show previous value):', mode);
  };

  // Create the theme based on the current mode
  const theme = React.useMemo(() => {
    // Create base MUI theme
    const muiTheme = createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'light' ? '#1976d2' : '#90caf9',
        },
        secondary: {
          main: mode === 'light' ? '#f50057' : '#f48fb1',
        },
        background: {
          default: mode === 'light' ? '#f5f5f5' : '#121212',
          paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
      },
    });

    // Extend with custom properties
    return {
      ...muiTheme,
      containerBg: mode === 'light' ? '#f5f5f5' : '#121212',
      paperBg: mode === 'light' ? '#ffffff' : '#1e1e2d',
      paperShadow: mode === 'light'
        ? '0 4px 20px rgba(0,0,0,0.08)'
        : '0 4px 20px rgba(0,0,0,0.5)',
      paperBorder: mode === 'light'
        ? 'rgba(0,0,0,0.05)'
        : 'rgba(255,255,255,0.05)',
      text: mode === 'light' ? '#333333' : '#e0e0e0',
      link: mode === 'light' ? '#1976d2' : '#90caf9',
      border: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
      input: mode === 'light' ? '#ffffff' : '#252836',
      background: mode === 'light' ? '#ffffff' : '#1a1a2e',
    } as Theme;
  }, [mode]);

  // Effect to update the body background color when theme changes
  useEffect(() => {
    console.log('Theme changed, updating body styles. Current mode:', mode);

    // Set explicit colors instead of using theme properties to avoid gradient issues
    const bgColor = mode === 'dark' ? '#1a1a2e' : '#e8f5ff';
    const textColor = mode === 'dark' ? '#f5f5f5' : '#1a237e';

    console.log('Setting body background color to:', bgColor);
    console.log('Setting body text color to:', textColor);

    document.body.style.backgroundColor = bgColor;
    document.body.style.color = textColor;

    // Add a class to the body for additional theme-specific styling
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${mode}-mode`);

    // Add a data attribute to the body for debugging
    document.body.setAttribute('data-theme-mode', mode);

    // Log the current document body styles after setting
    console.log('Body background color is now:', document.body.style.backgroundColor);
    console.log('Body color is now:', document.body.style.color);
    console.log('Body classes are now:', document.body.className);
  }, [mode, theme]);

  // Provide the theme context to children
  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode, theme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
