import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Upgrade as UpgradeIcon,
  Star as StarIcon,
  Lock as LockIcon
} from '@mui/icons-material';

/**
 * Upgrade prompt component - shown when users hit free tier limits
 */
const UpgradePrompt = ({ 
  type = 'limit', // 'limit', 'feature', 'inline'
  feature = 'unlimited queries',
  onUpgrade,
  remainingQueries = 0,
  totalQueries = 5,
  sx = {}
}) => {
  if (type === 'limit') {
    // Shown when daily query limit is reached
    const percentage = (remainingQueries / totalQueries) * 100;
    const isNearLimit = percentage <= 40;
    const isAtLimit = remainingQueries === 0;

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: isAtLimit ? 'error.light' : isNearLimit ? 'warning.light' : 'primary.light',
          borderRadius: 2,
          background: isAtLimit 
            ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)'
            : isNearLimit
            ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.02) 100%)',
          ...sx
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {isAtLimit ? '🚫 Daily Limit Reached' : `⚡ ${remainingQueries} queries remaining today`}
          </Typography>
          <Chip
            label="FREE PLAN"
            size="small"
            sx={{ 
              fontWeight: 600,
              bgcolor: 'grey.200',
              color: 'grey.700'
            }}
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            mb: 1.5,
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': {
              bgcolor: isAtLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'primary.main',
              borderRadius: 3
            }
          }}
        />

        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}>
          {isAtLimit
            ? 'Upgrade to Student plan for unlimited AI queries and advanced features!'
            : 'Running low on queries? Upgrade for unlimited access to all AI features.'}
        </Typography>

        <Button
          fullWidth
          variant="contained"
          startIcon={<UpgradeIcon />}
          onClick={onUpgrade}
          sx={{
            fontWeight: 600,
            py: 1.2,
            borderRadius: 1.5,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          Upgrade
        </Button>
      </Paper>
    );
  }

  if (type === 'feature') {
    // Shown when trying to access premium features
    return (
      <Paper
        elevation={0}
        sx={{ 
          mb: 2, 
          p: 2,
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.02) 100%)',
          ...sx 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <LockIcon sx={{ color: 'primary.main', mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Premium Feature Locked
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Upgrade to unlock {feature} and more advanced features!
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<UpgradeIcon />}
              onClick={onUpgrade}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)'
                }
              }}
            >
              Upgrade Now
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  }

  if (type === 'inline') {
    // Inline prompt for subtle upgrade nudges
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: 1.5,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.02) 100%)',
          ...sx
        }}
      >
        <StarIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
          Want unlimited access? Upgrade now!
        </Typography>
        <Button
          size="small"
          variant="contained"
          onClick={onUpgrade}
          sx={{ 
            fontWeight: 600, 
            whiteSpace: 'nowrap',
            textTransform: 'none',
            borderRadius: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)'
            }
          }}
        >
          Upgrade
        </Button>
      </Box>
    );
  }

  return null;
};

export default UpgradePrompt;

