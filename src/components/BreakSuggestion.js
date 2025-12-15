import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  SelfImprovement as MeditateIcon,
  LocalCafe as CoffeeIcon,
  DirectionsWalk as WalkIcon,
  Visibility as EyeIcon
} from '@mui/icons-material';

/**
 * Break Suggestion Dialog
 *
 * Suggests breaks when cognitive load is high or session is long.
 * Includes timer countdown and break activities.
 */
function BreakSuggestion({ open, onClose, onTakeBreak, suggestedDuration = 5, reason }) {
  const [breakActive, setBreakActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(suggestedDuration * 60); // seconds

  useEffect(() => {
    if (!breakActive) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          // Break complete
          setBreakActive(false);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breakActive, onClose]);

  const handleTakeBreak = () => {
    setBreakActive(true);
    if (onTakeBreak) onTakeBreak();
  };

  const handleSkip = () => {
    setBreakActive(false);
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((suggestedDuration * 60 - remainingTime) / (suggestedDuration * 60)) * 100;

  return (
    <Dialog open={open} onClose={handleSkip} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        {breakActive ? '⏰ Break Time!' : '🧠 Time for a Break?'}
      </DialogTitle>

      <DialogContent>
        {!breakActive ? (
          <>
            <Typography variant="body1" gutterBottom textAlign="center">
              {reason}
            </Typography>

            <Box sx={{ my: 3, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="primary" gutterBottom>
                {suggestedDuration} minutes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Suggested break duration
              </Typography>
            </Box>

            {/* Break activities */}
            <Typography variant="subtitle2" gutterBottom>
              What to do during your break:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Chip
                icon={<WalkIcon />}
                label="Walk around (get blood flowing)"
                variant="outlined"
              />
              <Chip
                icon={<EyeIcon />}
                label="Look away from screen (20-20-20 rule)"
                variant="outlined"
              />
              <Chip
                icon={<CoffeeIcon />}
                label="Drink water or have a snack"
                variant="outlined"
              />
              <Chip
                icon={<MeditateIcon />}
                label="Stretch or take deep breaths"
                variant="outlined"
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              💡 Research shows that breaks improve retention and reduce mental fatigue.
            </Typography>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MeditateIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />

              <Typography variant="h3" fontWeight={600} color="primary" gutterBottom>
                {formatTime(remainingTime)}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Relax and recharge your mind
              </Typography>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mt: 3, height: 8, borderRadius: 4 }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              Stretch, look away from the screen, or walk around. You'll be back to studying soon!
            </Typography>
          </>
        )}
      </DialogContent>

      {!breakActive && (
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={handleSkip} color="inherit">
            Not Now
          </Button>
          <Button
            onClick={handleTakeBreak}
            variant="contained"
            color="primary"
            size="large"
          >
            Take Break
          </Button>
        </DialogActions>
      )}

      {breakActive && (
        <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 2 }}>
          <Button onClick={handleSkip} variant="outlined" size="small">
            End Break Early
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default BreakSuggestion;
