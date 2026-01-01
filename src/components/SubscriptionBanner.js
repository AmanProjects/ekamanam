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
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Star as StarIcon,
  Warning as WarningIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

function SubscriptionBanner({ subscription, onUpgrade, isMobile, isLoggedIn, user }) {
  if (subscription?.loading) return null;

  // Not logged in state
  if (!isLoggedIn) {
    // Desktop version - Compact chip
    if (!isMobile) {
      return (
        <Chip
          label="Subscribe"
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
            '&:hover': { bgcolor: '#45a049' }
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
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
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
              Free & Premium plans available
            </Typography>
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
              bgcolor: 'white',
              color: '#2e7d32',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
          >
            Subscribe
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.displayName) {
      const names = user.displayName.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserFirstName = () => {
    if (!user) return 'User';
    if (user.displayName) {
      return user.displayName.split(' ')[0];
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Desktop version - Compact chip in header
  if (!isMobile) {
    if (isPaid) {
      return (
        <Box
          onClick={onUpgrade}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid #4caf50',
            '&:hover': {
              bgcolor: '#c8e6c9',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#2e7d32', lineHeight: 1 }}>
              Student
            </Typography>
          </Box>
          <Avatar
            src={user?.photoURL}
            alt={getUserFirstName()}
            sx={{
              width: 28,
              height: 28,
              fontSize: '0.75rem',
              bgcolor: '#4caf50',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1b5e20', lineHeight: 1.2 }}>
              {getUserFirstName()}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#388e3c', lineHeight: 1.2 }}>
              {daysRemaining}d to renew
            </Typography>
          </Box>
        </Box>
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
        // Student subscription banner
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon sx={{ color: '#4caf50', fontSize: '1.25rem' }} />
            <Box>
              <Typography variant="caption" fontWeight={600} color="#2e7d32" display="block">
                Student Subscription Active
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {daysRemaining} days to renew
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

