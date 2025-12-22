/**
 * Voice Input Button Component
 * Reusable button for speech-to-text input across the application
 * 
 * Usage:
 * <VoiceInputButton 
 *   onTranscript={(text) => setInput(text)}
 *   language="te-IN"
 *   existingText={input}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  Badge
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  detectLanguageForRecognition
} from '../services/speechRecognitionService';

function VoiceInputButton({ 
  onTranscript, 
  language = 'en-IN',
  existingText = '',
  disabled = false,
  size = 'medium',
  color = 'primary'
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const [isSupported] = useState(isSpeechRecognitionSupported());
  const recognitionRef = useRef(null);

  // Auto-detect language from existing text
  const detectedLanguage = existingText ? detectLanguageForRecognition(existingText) : language;

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError(null);
    setInterimText('');

    // Create recognition instance
    recognitionRef.current = createSpeechRecognition({
      language: detectedLanguage,
      continuous: false, // Stop after one phrase
      interimResults: true,
      onResult: ({ finalTranscript, interimTranscript, isFinal }) => {
        if (isFinal && finalTranscript) {
          // Append to existing text if any
          const newText = existingText ? `${existingText} ${finalTranscript}` : finalTranscript;
          onTranscript(newText);
          setInterimText('');
          setIsListening(false);
        } else {
          setInterimText(interimTranscript);
        }
      },
      onError: ({ message }) => {
        setError(message);
        setIsListening(false);
        setInterimText('');
      },
      onStart: () => {
        setIsListening(true);
        console.log('🎤 Voice input started');
      },
      onEnd: () => {
        setIsListening(false);
        setInterimText('');
        console.log('🛑 Voice input ended');
      }
    });

    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Tooltip title="Voice input not supported in this browser">
        <span>
          <IconButton disabled size={size}>
            <MicOffIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  const tooltipTitle = isListening 
    ? `Listening... (${getLanguageName(detectedLanguage)})` 
    : `Click to speak (${getLanguageName(detectedLanguage)})`;

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <span>
          <IconButton
            onClick={handleClick}
            disabled={disabled}
            size={size}
            color={isListening ? 'error' : color}
            sx={{
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' }
              }
            }}
          >
            {isListening ? (
              <Badge
                badgeContent={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      animation: 'blink 1s ease-in-out infinite',
                      '@keyframes blink': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.3 }
                      }
                    }}
                  />
                }
                color="error"
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MicIcon />
              </Badge>
            ) : (
              <MicIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {/* Interim text display */}
      {interimText && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            bgcolor: 'info.light',
            color: 'info.dark',
            px: 2,
            py: 1,
            borderRadius: 1,
            mb: 1,
            fontSize: '0.875rem',
            fontStyle: 'italic',
            boxShadow: 1,
            zIndex: 10
          }}
        >
          Listening: "{interimText}..."
        </Box>
      )}

      {/* Error snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

// Helper function to get readable language name
function getLanguageName(languageCode) {
  const languageNames = {
    'en-IN': 'English',
    'te-IN': 'Telugu',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
    'bn-IN': 'Bengali',
    'mr-IN': 'Marathi',
    'gu-IN': 'Gujarati',
    'pa-IN': 'Punjabi'
  };
  return languageNames[languageCode] || 'English';
}

export default VoiceInputButton;

