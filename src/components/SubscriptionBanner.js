/**
 * Subscription Banner Component - v11.0.4
 * 
 * Displays subscription status prominently:
 * - Mobile: Full-width banner under header
 * - Desktop: Compact badge in header
 */

import React, { useState } from 'react';
import {
  Box,
  Chip,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Star as StarIcon,
  Warning as WarningIcon,
  ShoppingCart as CartIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';

function SubscriptionBanner({ subscription, onUpgrade, isMobile, isLoggedIn, user }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignIn = async () => {
    if (!isFirebaseConfigured) {
      window.confirm(
        "🔧 Firebase Not Configured\n\n" +
        "Google Sign-In requires Firebase setup. You have two options:\n\n" +
        "1. Continue WITHOUT Sign-In (Recommended for quick start)\n" +
        "   - App works fully\n" +
        "   - Store API key locally\n" +
        "   - Notes saved in browser\n\n" +
        "2. Set up Firebase (For cloud sync)\n" +
        "   - Enable Google Sign-In\n" +
        "   - Sync across devices\n\n" +
        "Click OK to continue without sign-in."
      );
      return;
    }

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        console.log('✅ Signed in successfully');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the sign-in popup");
      } else if (error.code === 'auth/popup-blocked') {
        alert("🚫 Popup Blocked\n\nYour browser blocked the sign-in popup.\n\nTo fix:\n1. Allow popups for this site\n2. Try again");
      } else {
        alert('Failed to sign in: ' + error.message);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('google_access_token');
      await signOut(auth);
      handleMenuClose();
    } catch (error) {
      console.error('Sign-out error:', error);
      alert('Failed to sign out: ' + error.message);
    }
  };

  if (subscription?.loading) return null;

  // Not logged in state
  if (!isLoggedIn) {
    // Desktop version - Sign In button
    if (!isMobile) {
      return (
        <Button
          variant="outlined"
          size="small"
          startIcon={<LoginIcon />}
          onClick={handleSignIn}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderColor: '#4caf50',
            color: '#4caf50',
            '&:hover': {
              borderColor: '#45a049',
              bgcolor: 'rgba(76, 175, 80, 0.04)'
            }
          }}
        >
          Sign In
        </Button>
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
            startIcon={<LoginIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={handleSignIn}
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
        <>
          <Box
            onClick={onUpgrade}
            onContextMenu={(e) => {
              e.preventDefault();
              handleMenuOpen(e);
            }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e);
              }}
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.75rem',
                bgcolor: '#4caf50',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
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
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon sx={{ minWidth: 36, color: '#d32f2f' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2" sx={{ color: '#d32f2f' }}>Sign Out</Typography>
            </MenuItem>
          </Menu>
        </>
      );
    } else {
      // Free tier with user menu
      return (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
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
            <Avatar
              src={user?.photoURL}
              alt={getUserFirstName()}
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e);
              }}
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.75rem',
                bgcolor: isOutOfQueries ? '#c62828' : isLowOnQueries ? '#e65100' : '#1565c0',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              {getUserInitials()}
            </Avatar>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon sx={{ minWidth: 36, color: '#d32f2f' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2" sx={{ color: '#d32f2f' }}>Sign Out</Typography>
            </MenuItem>
          </Menu>
        </>
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
            <Avatar
              src={user?.photoURL}
              alt={getUserFirstName()}
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.75rem',
                bgcolor: '#4caf50'
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box>
              <Typography variant="caption" fontWeight={600} color="#2e7d32" display="block">
                {getUserFirstName()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {daysRemaining} days to renew
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              Renew
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleSignOut}
              startIcon={<LogoutIcon sx={{ fontSize: '0.8rem' }} />}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1,
                color: '#2e7d32',
                minWidth: 'auto'
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      ) : (
        // Free tier banner
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={user?.photoURL}
                alt={getUserFirstName()}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  bgcolor: isOutOfQueries ? '#c62828' : isLowOnQueries ? '#e65100' : '#1565c0'
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  color={isOutOfQueries ? '#c62828' : isLowOnQueries ? '#e65100' : '#1565c0'} 
                  display="block"
                >
                  {getUserFirstName()} - {isOutOfQueries ? 'No Queries Left' : 'Free Plan'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {remainingQueries || 0} of {usage?.limit || 3} queries remaining today
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
              <Button
                size="small"
                variant="text"
                onClick={handleSignOut}
                startIcon={<LogoutIcon sx={{ fontSize: '0.8rem' }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                  color: isOutOfQueries ? '#c62828' : isLowOnQueries ? '#e65100' : '#1565c0',
                  minWidth: 'auto'
                }}
              >
                Sign Out
              </Button>
            </Box>
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

