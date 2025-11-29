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
  TextField
} from '@mui/material';
import {
  Close,
  Palette,
  VolumeUp,
  Key,
  Info,
  Person,
  PlayArrow
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              General Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Set up student and parent information. Parent email will be used for Admin Dashboard OTP verification.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
              <TextField
                label="Student Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="The name of the student using Ekamanam"
              />

              <TextField
                label="Parent Name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Parent/guardian's full name"
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
              />

              <Button 
                variant="contained" 
                onClick={handleSaveProfile}
                sx={{ alignSelf: 'flex-start' }}
                disabled={!studentName || !parentName || !parentEmail || !parentEmail.includes('@')}
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize how Ekamanam looks to reduce eye strain and match your preference.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Voice & Speech Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose your preferred voice for all text-to-speech features across the app.
            </Typography>

            <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Select Voice Type
              </FormLabel>
              <RadioGroup value={voicePreference} onChange={handleVoiceChange}>
                <FormControlLabel
                  value={VOICE_OPTIONS.FEMALE_US}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography>{VOICE_LABELS[VOICE_OPTIONS.FEMALE_US]}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Clear, natural American English (Recommended)
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
                <FormControlLabel
                  value={VOICE_OPTIONS.MALE_US}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography>{VOICE_LABELS[VOICE_OPTIONS.MALE_US]}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Professional American English voice
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
                <FormControlLabel
                  value={VOICE_OPTIONS.FEMALE_INDIAN}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography>{VOICE_LABELS[VOICE_OPTIONS.FEMALE_INDIAN]}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Indian English accent for regional content
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
                <FormControlLabel
                  value={VOICE_OPTIONS.MALE_INDIAN}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography>{VOICE_LABELS[VOICE_OPTIONS.MALE_INDIAN]}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Male Indian English voice
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
              </RadioGroup>

              <Button
                variant="outlined"
                startIcon={<VolumeUp />}
                onClick={handleTestVoice}
                sx={{ mt: 2 }}
                fullWidth
              >
                Test Selected Voice
              </Button>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  🎤 <strong>Note:</strong> Voice availability depends on your device and browser. 
                  The app will automatically select the best matching voice.
                </Typography>
              </Alert>
            </FormControl>
          </Box>
        );

      case 'ai':
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              AI Provider Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure your AI API keys for explanations, activities, and exam preparation.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              About Ekamanam
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                The Art of Focused Learning
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ekamanam helps students learn better with AI-powered explanations, interactive activities, 
                and personalized study tools.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Version:</Typography>
                <Chip label="3.2.0" size="small" color="primary" />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Account:</Typography>
                <Typography variant="body2" color="text.secondary">
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
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 600
        }
      }}
    >
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Left Panel - Options */}
        <Box
          sx={{
            width: 240,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600}>
              Settings
            </Typography>
          </Box>

          {/* Options List */}
          <List sx={{ flex: 1, py: 0 }}>
            {settingsOptions.map((option) => (
              <ListItem key={option.id} disablePadding>
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

        {/* Right Panel - Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Close Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Content Area */}
          <DialogContent sx={{ flex: 1, pt: 0 }}>
            {renderContent()}
          </DialogContent>
        </Box>
      </Box>
    </Dialog>
  );
}

export default EnhancedSettingsDialog;

