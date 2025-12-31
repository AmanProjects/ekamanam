/**
 * Subscription Banner Component - v11.0.4
 * 
 * Displays subscription status prominently:
 * - Mobile: Full-width banner under header
 * - Desktop: Compact badge in header
 */

import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Typography,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Star as StarIcon,
  Warning as WarningIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

function SubscriptionBanner({ subscription, onUpgrade, isMobile, isLoggedIn, onSignIn }) {
  if (subscription?.loading) return null;

  // Not logged in state
  if (!isLoggedIn) {
    // Desktop version - Compact chip
    if (!isMobile) {
      return (
        <Chip
          label="Try Free"
          size="small"
          onClick={onSignIn}
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            bgcolor: '#2196f3',
            color: 'white',
            '& .MuiChip-label': { px: 1 },
            '&:hover': { bgcolor: '#1976d2' }
          }}
        />
      );
    }

    // Mobile version - Full banner
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          px: 2,
          py: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" fontWeight={600} color="white" display="block">
              Start Learning Today
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.9)' }}>
              Sign in to access 3 free AI queries daily
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={onSignIn}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              bgcolor: 'white',
              color: '#667eea',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    );
  }

  const { isPaid, isFree, daysRemaining, remainingQueries, usage, tier } = subscription;

  // Calculate progress for free tier
  const freeProgress = isFree && usage ? ((usage.count / usage.limit) * 100) : 0;
  const isLowOnQueries = isFree && remainingQueries !== null && remainingQueries <= 1;
  const isOutOfQueries = isFree && remainingQueries === 0;

  // Desktop version - Compact chip in header
  if (!isMobile) {
    if (isPaid) {
      return (
        <Chip
          icon={<StarIcon sx={{ fontSize: '0.9rem' }} />}
          label={`Premium: ${daysRemaining}d left`}
          size="small"
          onClick={onUpgrade}
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            bgcolor: '#4caf50',
            color: 'white',
            '& .MuiChip-label': { px: 1 },
            '& .MuiChip-icon': { color: 'white', ml: 0.5 },
            '&:hover': { bgcolor: '#45a049' }
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={isOutOfQueries ? <WarningIcon sx={{ fontSize: '0.9rem' }} /> : undefined}
          label={`Free: ${remainingQueries || 0}/${usage?.limit || 3} left`}
          size="small"
          onClick={onUpgrade}
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            bgcolor: isOutOfQueries ? '#ffebee' : isLowOnQueries ? '#fff3e0' : '#e3f2fd',
            color: isOutOfQueries ? '#c62828' : isLowOnQueries ? '#e65100' : '#1565c0',
            border: '1px solid',
            borderColor: isOutOfQueries ? '#ef5350' : isLowOnQueries ? '#ff9800' : '#42a5f5',
            '& .MuiChip-label': { px: 1 },
            '& .MuiChip-icon': { 
              color: isOutOfQueries ? '#c62828' : '#e65100', 
              ml: 0.5 
            },
            '&:hover': { opacity: 0.9 }
          }}
        />
      );
    }
  }

  // Mobile version - Full banner under header
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 0,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: isPaid ? '#e8f5e9' : isOutOfQueries ? '#ffebee' : isLowOnQueries ? '#fff3e0' : '#e3f2fd',
        px: 2,
        py: 1.5
      }}
    >
      {isPaid ? (
        // Premium banner
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon sx={{ color: '#4caf50', fontSize: '1.25rem' }} />
            <Box>
              <Typography variant="caption" fontWeight={600} color="#2e7d32" display="block">
                {tier} Subscription Active
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {daysRemaining} days remaining
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={onUpgrade}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': {
                borderColor: '#45a049',
                bgcolor: 'rgba(76, 175, 80, 0.04)'
              }
            }}
          >
            Details
          </Button>
        </Box>
      ) : (
        // Free tier banner
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isOutOfQueries && <WarningIcon sx={{ color: '#d32f2f', fontSize: '1.25rem' }} />}
              <Box>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  color={isOutOfQueries ? '#c62828' : isLowOnQueries ? '#e65100' : '#1565c0'} 
                  display="block"
                >
                  {isOutOfQueries ? 'No Queries Left' : 'Free Plan'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {remainingQueries || 0} of {usage?.limit || 3} queries remaining today
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              variant="contained"
              startIcon={<CartIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={onUpgrade}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                bgcolor: isOutOfQueries ? '#d32f2f' : '#1976d2',
                '&:hover': {
                  bgcolor: isOutOfQueries ? '#c62828' : '#1565c0'
                }
              }}
            >
              Upgrade
            </Button>
          </Box>
          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={freeProgress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: isOutOfQueries ? '#d32f2f' : isLowOnQueries ? '#ff9800' : '#1976d2'
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
}

export default SubscriptionBanner;

