import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Tooltip,
  Paper,
  Chip
} from '@mui/material';
import {
  Psychology as BrainIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as NeutralIcon
} from '@mui/icons-material';
import { LOAD_ZONES } from '../services/cognitiveLoadService';

/**
 * Cognitive Load Gauge Component
 *
 * Displays real-time cognitive load score with visual indicator.
 * Shows load zone (Underutilized/Optimal/Overloaded) with color coding.
 */
function CognitiveLoadGauge({ cognitiveLoad, showDetails = true, size = 'normal' }) {
  // Determine load zone
  const getLoadZone = (load) => {
    if (load <= LOAD_ZONES.UNDERUTILIZED.max) {
      return LOAD_ZONES.UNDERUTILIZED;
    } else if (load <= LOAD_ZONES.OPTIMAL.max) {
      return LOAD_ZONES.OPTIMAL;
    } else {
      return LOAD_ZONES.OVERLOADED;
    }
  };

  const zone = getLoadZone(cognitiveLoad);

  // Get color for progress bar
  const getProgressColor = () => {
    if (zone.label === 'Too Easy') return 'success';
    if (zone.label === 'Perfect!') return 'primary';
    return 'error';
  };

  // Get icon based on load
  const getIcon = () => {
    if (zone.label === 'Too Easy') return <TrendingDownIcon />;
    if (zone.label === 'Perfect!') return <NeutralIcon />;
    return <TrendingUpIcon />;
  };

  // Get recommendation text
  const getRecommendation = () => {
    if (zone.label === 'Too Easy') {
      return 'Content seems easy. AI will add challenge questions!';
    } else if (zone.label === 'Struggling') {
      return 'Detecting difficulty. AI will simplify explanations.';
    } else {
      return 'You\'re in the perfect learning zone!';
    }
  };

  // Compact view (for header)
  if (size === 'compact') {
    return (
      <Tooltip title={getRecommendation()}>
        <Chip
          icon={<BrainIcon />}
          label={`${Math.round(cognitiveLoad)}%`}
          size="small"
          sx={{
            bgcolor: zone.color,
            color: 'white',
            fontWeight: 600
          }}
        />
      </Tooltip>
    );
  }

  // Normal view (detailed)
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <BrainIcon sx={{ color: zone.color }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Cognitive Load
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label={zone.label}
          size="small"
          sx={{
            bgcolor: zone.color,
            color: 'white',
            fontWeight: 600
          }}
        />
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={cognitiveLoad}
        color={getProgressColor()}
        sx={{
          height: 10,
          borderRadius: 5,
          mb: 1,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5
          }
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600} color={zone.color}>
          {Math.round(cognitiveLoad)}/100
        </Typography>
        {getIcon()}
      </Box>

      {showDetails && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {getRecommendation()}
        </Typography>
      )}
    </Paper>
  );
}

export default CognitiveLoadGauge;
