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
      main: '#64b5f6',
      light: '#90caf9',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#f6a5c0',
      dark: '#e97ca6',
    },
    background: {
      default: '#121212',    // Pure dark background
      paper: '#1e1e1e',      // Slightly lighter for cards
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: '#90caf9',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
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
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#424242 #121212",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#121212",
            width: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#424242",
            minHeight: 24,
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#616161",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
        },
        elevation2: {
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.5)',
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
            boxShadow: '0px 2px 4px rgba(0,0,0,0.6)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.23)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.40)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#2c2c2c',
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.23)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.40)',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
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
