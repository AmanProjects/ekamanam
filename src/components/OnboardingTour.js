import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { Button, Box, Link } from '@mui/material';
import { PlayCircleOutline, Replay } from '@mui/icons-material';

/**
 * OnboardingTour Component - v10.1.3
 * Clean, professional guided tour for first-time users
 */

// Tour steps - clean, professional text with proper targeting
const getTourSteps = () => [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Welcome to Ekamanam',
    content: 'Your AI-powered learning companion. This quick setup takes about 3 minutes.',
  },
  {
    target: '#settings-button',
    placement: 'bottom-end',
    disableBeacon: true,
    title: 'Open Settings',
    content: 'Click the Settings button to configure your AI and profile.',
    spotlightClicks: true,
    spotlightPadding: 8,
  },
  {
    target: '#settings-tab-ai',
    placement: 'right',
    disableBeacon: true,
    title: 'Click AI Providers',
    content: 'Click this tab to configure your AI API keys.',
    spotlightClicks: true,
    spotlightPadding: 4,
  },
  {
    target: '#settings-tab-ai',
    placement: 'right',
    disableBeacon: true,
    title: 'Add Gemini API Key',
    content: (
      <Box>
        <Box sx={{ mb: 1 }}>Expand the Gemini section, then:</Box>
        <Box component="ul" sx={{ m: 0, pl: 2, mb: 1 }}>
          <li>Sign in with your Google account</li>
          <li>Click "Create API Key"</li>
          <li>Copy the key and paste it</li>
          <li>Click Save</li>
        </Box>
        <Box sx={{ mb: 1, fontSize: 13, color: '#666' }}>This provides 1,500 free requests per day.</Box>
        <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" sx={{ fontSize: 13 }}>
          Open Gemini API Key Page →
        </Link>
      </Box>
    ),
  },
  {
    target: '#settings-tab-ai',
    placement: 'right',
    disableBeacon: true,
    title: 'Add Groq API Key',
    content: (
      <Box>
        <Box sx={{ mb: 1 }}>Expand the Groq section, then:</Box>
        <Box component="ul" sx={{ m: 0, pl: 2, mb: 1 }}>
          <li>Create a free Groq account</li>
          <li>Go to API Keys section</li>
          <li>Create and copy your key</li>
          <li>Paste it and click Save</li>
        </Box>
        <Box sx={{ mb: 1, fontSize: 13, color: '#666' }}>This adds 14,400 backup requests per day.</Box>
        <Link href="https://console.groq.com/keys" target="_blank" rel="noopener" sx={{ fontSize: 13 }}>
          Open Groq API Key Page →
        </Link>
      </Box>
    ),
  },
  {
    target: '#settings-tab-general',
    placement: 'right',
    disableBeacon: true,
    title: 'Click General Tab',
    content: 'Click this tab to add your profile information.',
    spotlightClicks: true,
    spotlightPadding: 4,
  },
  {
    target: '#settings-tab-general',
    placement: 'right',
    disableBeacon: true,
    title: 'Add Your Profile',
    content: (
      <Box>
        <Box sx={{ mb: 1 }}>Enter your details:</Box>
        <Box component="ul" sx={{ m: 0, pl: 2, mb: 1 }}>
          <li>Student Name</li>
          <li>Parent Name</li>
          <li><strong>Parent Email</strong> - Receives OTP codes for Admin Dashboard access</li>
        </Box>
        <Box sx={{ fontSize: 13 }}>Click "Save Profile" when done.</Box>
      </Box>
    ),
  },
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Close Settings',
    content: 'Close the Settings dialog by clicking the X button in the top right corner.',
  },
  {
    target: '#library-button',
    placement: 'bottom-end',
    disableBeacon: true,
    title: 'Open Your Library',
    content: 'Click My Library to access PDFs. Try the sample textbooks or upload your own.',
    spotlightClicks: true,
    spotlightPadding: 8,
  },
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Setup Complete',
    content: 'You\'re ready! Open any PDF to use:\n\n• Learn - Summaries and key points\n• Explain - Detailed explanations\n• Activities - Practice questions\n• Exam - Test preparation\n• Tools - Educational tools\n• Vyonn - AI assistant',
  }
];

function OnboardingTour({ 
  run, 
  onComplete, 
  stepIndex = 0,
  onStepChange,
  onOpenSettings,
  onCloseSettings
}) {
  const [steps] = useState(() => getTourSteps());

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // Auto-open Settings when moving to step 2 (AI Providers tab)
      if (nextIndex === 2 && onOpenSettings) {
        onOpenSettings();
      }
      
      // Auto-close Settings when moving to step 8 (Library button)
      if (nextIndex === 8 && onCloseSettings) {
        onCloseSettings();
      }
      
      if (onStepChange) {
        onStepChange(nextIndex);
      }
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('ekamanam_tour_completed', 'true');
      if (onCloseSettings) {
        onCloseSettings();
      }
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      scrollToFirstStep
      callback={handleJoyrideCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip'
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#1976d2',
          textColor: '#333',
          backgroundColor: '#fff',
          arrowColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltip: {
          borderRadius: 4,
          fontSize: 14,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 10,
          color: '#1a1a1a',
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
        },
        buttonNext: {
          backgroundColor: '#1976d2',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 500,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#666',
          fontSize: 13,
          marginRight: 10,
        },
        buttonSkip: {
          color: '#999',
          fontSize: 13,
        },
        buttonClose: {
          color: '#666',
        },
        spotlight: {
          borderRadius: 4,
        },
      }}
      floaterProps={{
        offset: 12,
        disableAnimation: true,
      }}
    />
  );
}

// Clean button without animation
export function FirstTimeUserButton({ onClick }) {
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('ekamanam_tour_completed');
    setHasCompletedTour(completed === 'true');
  }, []);

  return (
    <Button
      variant={hasCompletedTour ? "outlined" : "contained"}
      size="small"
      startIcon={hasCompletedTour ? <Replay sx={{ fontSize: 16 }} /> : <PlayCircleOutline sx={{ fontSize: 16 }} />}
      onClick={onClick}
      sx={{
        bgcolor: hasCompletedTour ? 'transparent' : '#1976d2',
        color: hasCompletedTour ? '#1976d2' : 'white',
        borderColor: '#1976d2',
        fontWeight: 500,
        fontSize: '0.8rem',
        borderRadius: 1,
        px: 1.5,
        py: 0.5,
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': {
          bgcolor: hasCompletedTour ? 'rgba(25, 118, 210, 0.04)' : '#1565c0',
          borderColor: '#1976d2',
          boxShadow: 'none',
        },
      }}
    >
      {hasCompletedTour ? 'Restart Tour' : 'Getting Started'}
    </Button>
  );
}

export default OnboardingTour;
