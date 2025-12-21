import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Switch,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
  IconButton,
  Alert,
  Chip,
  TextField,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  AppBar
} from '@mui/material';
import {
  Close,
  Palette,
  VolumeUp,
  Key,
  Info,
  Person,
  PlayArrow,
  ArrowBack
} from '@mui/icons-material';
import { getThemePreference, saveThemePreference } from '../theme.js';
import { 
  VOICE_OPTIONS, 
  VOICE_LABELS, 
  getVoicePreference, 
  saveVoicePreference,
  testVoice 
} from '../services/voiceService';
import {
  getProfile,
  saveProfile
} from '../services/profileService';
import MultiProviderSettings from './MultiProviderSettings';

function EnhancedSettingsDialog({ open, onClose, user, onThemeChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedOption, setSelectedOption] = useState('general');
  const [darkMode, setDarkMode] = useState(false);
  const [voicePreference, setVoicePreference] = useState(VOICE_OPTIONS.INDIAN_ENGLISH_FEMALE);
  
  // Profile state
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Load preferences
  useEffect(() => {
    if (open) {
      const theme = getThemePreference();
      setDarkMode(theme === 'dark');
      setVoicePreference(getVoicePreference());
      
      // Load profile
      const profile = getProfile();
      setStudentName(profile.studentName || '');
      setParentName(profile.parentName || '');
      setParentEmail(profile.parentEmail || '');
      setProfileSaved(false);
    }
  }, [open]);

  const handleThemeToggle = (event) => {
    const isDark = event.target.checked;
    setDarkMode(isDark);
    const newMode = isDark ? 'dark' : 'light';
    saveThemePreference(newMode);
    if (onThemeChange) {
      onThemeChange(newMode);
    }
  };

  const handleVoiceChange = (event) => {
    const newVoice = event.target.value;
    setVoicePreference(newVoice);
    saveVoicePreference(newVoice);
  };

  const handleTestVoice = () => {
    const testText = voicePreference.includes('hindi') 
      ? "नमस्ते! यह मेरी आवाज़ है।" 
      : voicePreference.includes('telugu')
      ? "హలో! ఇది నా వాయిస్."
      : voicePreference.includes('tamil')
      ? "வணக்கம்! இது என் குரல்."
      : "Hello! This is how I sound. I hope you like my voice!";
    testVoice(voicePreference, testText);
  };

  const handleSaveProfile = () => {
    saveProfile({
      studentName,
      parentName,
      parentEmail
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const settingsOptions = [
    {
      id: 'general',
      label: 'General',
      icon: <Person />,
      description: 'Student and parent information'
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Palette />,
      description: 'Theme and display settings'
    },
    {
      id: 'voice',
      label: 'Voice & Speech',
      icon: <VolumeUp />,
      description: 'Natural Indian voices'
    },
    {
      id: 'ai',
      label: 'AI Providers',
      icon: <Key />,
      description: 'Configure AI API keys'
    },
    {
      id: 'about',
      label: 'About',
      icon: <Info />,
      description: 'Version and information'
    }
  ];

  const renderContent = () => {
    switch (selectedOption) {
      case 'general':
        return (
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} gutterBottom>
              General Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Set up student and parent information. Parent email will be used for Admin Dashboard OTP verification.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 3, mt: isMobile ? 2 : 3 }}>
              <TextField
                label="Student Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="The name of the student using Ekamanam"
                size={isSmallMobile ? 'small' : 'medium'}
              />

              <TextField
                label="Parent Name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Parent/guardian's full name"
                size={isSmallMobile ? 'small' : 'medium'}
              />

              <TextField
                label="Parent Email"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="This email will receive OTP for Admin Dashboard access"
                required
                error={parentEmail && !parentEmail.includes('@')}
                size={isSmallMobile ? 'small' : 'medium'}
              />

              <Button 
                variant="contained" 
                onClick={handleSaveProfile}
                sx={{ alignSelf: isMobile ? 'stretch' : 'flex-start' }}
                disabled={!studentName || !parentName || !parentEmail || !parentEmail.includes('@')}
                size={isMobile ? 'large' : 'medium'}
              >
                Save Profile
              </Button>

              {profileSaved && (
                <Alert severity="success">
                  ✅ Profile saved successfully! Parent email will be used for Admin Dashboard OTP.
                </Alert>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  📧 Important: Admin Dashboard Access
                </Typography>
                <Typography variant="body2">
                  The parent email address will receive OTP codes for accessing the Admin Dashboard. 
                  Only parents should have access to configure prompts, settings, and manage content.
                </Typography>
              </Alert>
            </Box>
          </Box>
        );

      case 'appearance':
        return (
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize how Ekamanam looks to reduce eye strain and match your preference.
            </Typography>

            <Box sx={{ mt: isMobile ? 2 : 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: isSmallMobile ? 'column' : 'row',
                gap: isSmallMobile ? 1 : 0
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Dark Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {darkMode ? 'Dark theme is easier on the eyes in low light' : 'Light theme works great in bright environments'}
                  </Typography>
                </Box>
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                  color="primary"
                  sx={{ alignSelf: isSmallMobile ? 'flex-end' : 'center' }}
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  💡 <strong>Tip:</strong> Dark mode reduces eye strain during long study sessions, especially at night.
                </Typography>
              </Alert>
            </Box>
          </Box>
        );

      case 'voice':
        return (
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} gutterBottom>
              Voice & Speech Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose your preferred voice for all text-to-speech features across the app.
            </Typography>

            <FormControl component="fieldset" sx={{ mt: isMobile ? 2 : 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2, fontSize: isMobile ? '0.875rem' : '1rem' }}>
                Select Voice Type
              </FormLabel>
              <RadioGroup value={voicePreference} onChange={handleVoiceChange}>
                {Object.entries(VOICE_LABELS).map(([key, label]) => (
                  <Box 
                    key={key}
                    sx={{
                      mb: 1,
                      p: isMobile ? 1 : 1.5,
                      border: '1px solid',
                      borderColor: voicePreference === key ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      bgcolor: voicePreference === key ? 'action.selected' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <FormControlLabel
                      value={key}
                      control={<Radio />}
                      label={
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          width: '100%',
                          gap: 1
                        }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant={isMobile ? 'body2' : 'body1'} 
                              fontWeight={voicePreference === key ? 600 : 400}
                              sx={{ wordBreak: 'break-word' }}
                            >
                              {label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {key.includes('english') && 'Clear Indian English accent'}
                              {key.includes('hindi') && 'Natural Hindi pronunciation'}
                              {key.includes('telugu') && 'Native Telugu speaker'}
                              {key.includes('tamil') && 'Native Tamil speaker'}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const testText = key.includes('hindi') 
                                ? "नमस्ते! यह मेरी आवाज़ है।" 
                                : key.includes('telugu')
                                ? "హలో! ఇది నా వాయిస్."
                                : key.includes('tamil')
                                ? "வணக்கம்! இது என் குரல்."
                                : "Hello! This is how I sound. Clear and natural!";
                              testVoice(key, testText);
                            }}
                            color="primary"
                            sx={{ flexShrink: 0 }}
                          >
                            <VolumeUp fontSize={isMobile ? 'small' : 'medium'} />
                          </IconButton>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Box>
                ))}
              </RadioGroup>

              <Button
                variant="contained"
                startIcon={<VolumeUp />}
                onClick={handleTestVoice}
                sx={{ mt: 1.5 }}
                fullWidth
                size={isMobile ? 'large' : 'medium'}
              >
                Test Voice
              </Button>

              <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
                <Typography variant="caption" display="block">
                  <strong>Natural Indian Voices</strong> • Adapts to PDF language • Chrome/Edge recommended
                </Typography>
              </Alert>
            </FormControl>
          </Box>
        );

      case 'ai':
        return (
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} gutterBottom>
              AI Provider Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure your AI API keys for explanations, activities, and exam preparation.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant={isMobile ? 'caption' : 'body2'}>
                <strong>🆕 Multi-Provider Support:</strong> Add multiple AI providers for automatic fallback and better reliability.
                <br />
                <strong>Recommended:</strong> Gemini + Groq for 16,000 free queries/day!
              </Typography>
            </Alert>

            <MultiProviderSettings />
          </Box>
        );

      case 'about':
        return (
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} gutterBottom>
              About Ekamanam
            </Typography>
            
            <Box sx={{ mt: isMobile ? 2 : 3 }}>
              <Typography variant={isMobile ? 'subtitle2' : 'subtitle1'} fontWeight={600} gutterBottom>
                The Art of Focused Learning
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ekamanam helps students learn better with AI-powered explanations, interactive activities, 
                and personalized study tools.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1,
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: isMobile ? 1 : 0
              }}>
                <Typography variant="body2">Version:</Typography>
                <Chip label="3.3.3" size="small" color="primary" />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 1,
                flexDirection: isSmallMobile ? 'column' : 'row',
                gap: isSmallMobile ? 0.5 : 0
              }}>
                <Typography variant="body2">Account:</Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    wordBreak: 'break-word',
                    textAlign: isSmallMobile ? 'left' : 'right'
                  }}
                >
                  {user ? user.email : 'Not signed in'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary" display="block" align="center">
                © 2025 <a href="https://www.linkedin.com/in/amantalwar/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Amandeep Singh Talwar</a>
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100vh' : '85vh',
          maxHeight: isMobile ? '100vh' : '85vh',
          m: isMobile ? 0 : 2
        }
      }}
    >
      <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
        {/* Header with Close Button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: isMobile ? 1.5 : 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          {isMobile && (
            <IconButton onClick={onClose} size="small" edge="start">
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} sx={{ flex: 1, ml: isMobile ? 1 : 0 }}>
            Settings
          </Typography>
          {!isMobile && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Box>

        {/* Mobile: Top Tab Bar */}
        {isMobile && (
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'divider',
              borderRadius: '2px',
            }
          }}>
            <Tabs
              value={selectedOption}
              onChange={(e, newValue) => setSelectedOption(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: isSmallMobile ? 48 : 56,
                '& .MuiTab-root': {
                  minHeight: isSmallMobile ? 48 : 56,
                  fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
                  minWidth: isSmallMobile ? 80 : 100,
                  px: isSmallMobile ? 1 : 2
                }
              }}
            >
              {settingsOptions.map((option) => (
                <Tab
                  key={option.id}
                  value={option.id}
                  icon={option.icon}
                  iconPosition="start"
                  label={option.label}
                />
              ))}
            </Tabs>
          </Box>
        )}

        <Box sx={{ 
          display: 'flex', 
          height: isMobile ? 'calc(100% - 120px)' : 'calc(100% - 64px)',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Desktop: Left Panel - Options */}
          {!isMobile && (
            <Box
              sx={{
                width: 200,
                borderRight: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
              }}
            >
              {/* Options List */}
              <List sx={{ py: 0 }}>
                {settingsOptions.map((option) => (
                  <ListItem 
                    key={option.id} 
                    disablePadding 
                    id={`settings-tab-${option.id}`}
                  >
                    <ListItemButton
                    selected={selectedOption === option.id}
                    onClick={() => setSelectedOption(option.id)}
                    sx={{
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        borderRight: 3,
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {option.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={option.label}
                      secondary={option.description}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          )}

          {/* Content Panel */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Content Area */}
            <DialogContent sx={{ 
              flex: 1, 
              overflow: 'auto',
              p: isMobile ? (isSmallMobile ? 2 : 2.5) : 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'divider',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }
            }}>
              {renderContent()}
            </DialogContent>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

export default EnhancedSettingsDialog;

