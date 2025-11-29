import { createTheme } from '@mui/material/styles';

// Light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#c51162',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
      lighter: '#ffebee',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00',
      lighter: '#fff3e0',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#0288d1',
      lighter: '#e3f2fd',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c',
      lighter: '#e8f5e9',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#a6d4fa',
      dark: '#6fa8dc',
    },
    secondary: {
      main: '#f48fb1',
      light: '#f6a5c0',
      dark: '#e97ca6',
    },
    background: {
      default: '#0a1929',  // Darker, more professional
      paper: '#1a2332',    // Card backgrounds
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b8c1',
    },
    divider: '#2d3843',
    action: {
      active: '#90caf9',
      hover: '#1e2732',
      selected: '#2d3843',
      disabled: '#4b5563',
      disabledBackground: '#1e2732',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
      lighter: 'rgba(244, 67, 54, 0.15)',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00',
      lighter: 'rgba(255, 167, 38, 0.15)',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#0288d1',
      lighter: 'rgba(41, 182, 246, 0.15)',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c',
      lighter: 'rgba(102, 187, 106, 0.15)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Get user's theme preference
export const getThemePreference = () => {
  const saved = localStorage.getItem('theme_mode');
  return saved || 'light';
};

// Save user's theme preference
export const saveThemePreference = (mode) => {
  localStorage.setItem('theme_mode', mode);
};
