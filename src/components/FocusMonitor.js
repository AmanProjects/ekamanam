import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  IconButton, 
  Typography,
  Tooltip,
  Fade
} from '@mui/material';
import {
  CenterFocusStrong,
  Close,
  Minimize
} from '@mui/icons-material';

function FocusMonitor({ onAlert }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [focusScore, setFocusScore] = useState(100);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setIsActive(true);
      
      // Simple focus simulation (in production, you'd use face-api.js or similar)
      const interval = setInterval(() => {
        const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
        setFocusScore(randomScore);
        
        if (randomScore < 75 && onAlert) {
          onAlert(true);
        }
      }, 10000); // Check every 10 seconds
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  const handleToggle = () => {
    if (isActive) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  if (!isActive) {
    return (
      <Tooltip title="Start Focus Monitoring">
        <Paper
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: 3,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
            },
            zIndex: 1000
          }}
          onClick={handleToggle}
        >
          <CenterFocusStrong sx={{ color: 'white', fontSize: 30 }} />
        </Paper>
      </Tooltip>
    );
  }

  return (
    <Fade in={isActive}>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: isMinimized ? 200 : 300,
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 1000
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Focus Monitor
          </Typography>
          <Box>
            <IconButton 
              size="small" 
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ color: 'white' }}
            >
              <Minimize fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={stopMonitoring}
              sx={{ color: 'white' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        {!isMinimized && (
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '75%',
                bgcolor: 'black',
                borderRadius: 1,
                overflow: 'hidden',
                mb: 2
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                Focus Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Box
                  sx={{
                    flexGrow: 1,
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${focusScore}%`,
                      height: '100%',
                      bgcolor: focusScore > 75 ? 'success.main' : 'warning.main',
                      transition: 'width 0.3s'
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {focusScore}%
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Fade>
  );
}

export default FocusMonitor;

