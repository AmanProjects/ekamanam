import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  LocalLibrary as LibraryIcon,
  Upgrade as UpgradeIcon,
  CheckCircle as CheckIcon,
  Style as FlashcardIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayIcon,
  MenuBook as BookIcon,
  LocalFireDepartment as StreakIcon,
  ArrowForward as ArrowIcon,
  Construction as ToolIcon
} from '@mui/icons-material';
import AdminOTPDialog from './AdminOTPDialog';
import { isAuthorizedAdmin } from '../services/otpService';

/**
 * Dashboard Component - v7.2.28
 * 
 * Clean, organized layout with:
 * - Welcome header with subscription status
 * - Quick stats row (PDFs, Cards Due, Streak)
 * - Primary CTA for Library
 * - Learning Tools in clean 3-column grid
 * - Pro Tools control (OTP protected)
 */
function Dashboard({
  onOpenLibrary,
  subscription,
  onUpgrade,
  onOpenFlashcards,
  onOpenTimeline,
  onOpenDoubtLibrary,
  dueCardCount = 0,
  user,
  pdfCount = 0,
  currentStreak = 0
}) {
  // v7.2.28: Pro Tools state and OTP control
  const [proToolsEnabled, setProToolsEnabled] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showProSettings, setShowProSettings] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Load Pro Tools state from admin config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('ekamanam_admin_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setProToolsEnabled(config?.tabs?.proTools?.enabled || false);
      } catch (e) {
        console.error('Failed to parse admin config:', e);
      }
    }
  }, []);

  const handleProToolsToggle = () => {
    // Check if already authorized
    if (isAuthorizedAdmin()) {
      toggleProTools();
    } else {
      // Need OTP verification
      setPendingAction(!proToolsEnabled ? 'enable' : 'disable');
      setShowOTPDialog(true);
    }
  };

  const toggleProTools = () => {
    const newState = !proToolsEnabled;
    setProToolsEnabled(newState);
    
    // Update admin config in localStorage
    const savedConfig = localStorage.getItem('ekamanam_admin_config');
    let config = {};
    try {
      config = savedConfig ? JSON.parse(savedConfig) : {};
    } catch (e) {
      config = {};
    }
    
    if (!config.tabs) config.tabs = {};
    config.tabs.proTools = { enabled: newState, name: 'Pro Tools' };
    
    localStorage.setItem('ekamanam_admin_config', JSON.stringify(config));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('adminConfigUpdated'));
    
    console.log(`🧰 Tools tab ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleOTPSuccess = () => {
    toggleProTools();
    setShowOTPDialog(false);
    setPendingAction(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tools = [
    {
      key: 'flashcards',
      onClick: onOpenFlashcards,
      icon: <FlashcardIcon />,
      iconColor: '#6366f1',
      iconBg: 'rgba(99, 102, 241, 0.1)',
      title: 'Flashcard Review',
      subtitle: 'Spaced repetition',
      badge: dueCardCount > 0 ? `${dueCardCount} due` : null
    },
    {
      key: 'journey',
      onClick: onOpenTimeline,
      icon: <TimelineIcon />,
      iconColor: '#0ea5e9',
      iconBg: 'rgba(14, 165, 233, 0.1)',
      title: 'Learning Journey',
      subtitle: 'Track progress'
    },
    {
      key: 'tools',
      onClick: handleProToolsToggle,
      icon: <ToolIcon />,
      iconColor: proToolsEnabled ? '#10b981' : '#64748b',
      iconBg: proToolsEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
      title: 'Tools',
      subtitle: proToolsEnabled ? 'Enabled' : 'Disabled',
      badge: proToolsEnabled ? '✓' : null,
      isToggle: true
    }
  ];

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.02) 0%, rgba(255,255,255,0) 40%)',
      py: { xs: 2, md: 3 }
    }}>
      <Container maxWidth="sm">
        {/* Welcome Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography 
              variant="h5" 
              sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}
            >
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}!
            </Typography>
            
            {subscription && !subscription.loading && (
              subscription.isPaid ? (
                <Chip
                  icon={<CheckIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={subscription.daysRemaining ? `${subscription.daysRemaining}d left` : 'Active'}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600, height: 24 }}
                />
              ) : (
                <Button
                  variant="text"
                  size="small"
                  onClick={onUpgrade}
                  sx={{ fontWeight: 600, textTransform: 'none', color: 'primary.main', minWidth: 'auto' }}
                >
                  Upgrade
                </Button>
              )
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Ready to learn something new?
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          {[
            { icon: <BookIcon />, value: pdfCount, label: 'PDFs', color: '#1976d2', onClick: onOpenLibrary },
            { icon: <FlashcardIcon />, value: dueCardCount, label: 'Due', color: dueCardCount > 0 ? '#f59e0b' : '#6366f1', onClick: onOpenFlashcards, highlight: dueCardCount > 0 },
            { icon: <StreakIcon />, value: currentStreak, label: 'Streak', color: currentStreak > 0 ? '#ef4444' : '#9ca3af' }
          ].map((stat, i) => (
            <Paper
              key={i}
              elevation={0}
              onClick={stat.onClick}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: stat.highlight ? 'warning.light' : 'divider',
                bgcolor: stat.highlight ? 'warning.lighter' : 'background.paper',
                textAlign: 'center',
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': stat.onClick ? { borderColor: 'primary.light', bgcolor: 'action.hover' } : {}
              }}
            >
              <Box sx={{ color: stat.color, mb: 0.5, '& svg': { fontSize: 22 } }}>
                {stat.icon}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Primary CTA - My Library */}
        <Paper
          elevation={0}
          onClick={onOpenLibrary}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(25, 118, 210, 0.25)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <LibraryIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} color="white">
                {pdfCount > 0 ? 'Continue Learning' : 'Start Learning'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>
                {pdfCount > 0 ? `${pdfCount} PDF${pdfCount !== 1 ? 's' : ''} in library` : 'Add PDFs to begin'}
              </Typography>
            </Box>
            <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <PlayIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Learning Tools */}
        <Typography 
          variant="overline" 
          sx={{ 
            display: 'block', 
            mb: 1.5, 
            color: 'text.secondary', 
            fontWeight: 600,
            letterSpacing: 1.5
          }}
        >
          Learning Tools
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          {tools.map((tool) => (
            <Paper
              key={tool.key}
              elevation={0}
              onClick={tool.onClick}
              sx={{
                flex: 1,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                bgcolor: 'background.paper',
                '&:hover': { 
                  borderColor: 'primary.light',
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              {tool.badge && (
                <Chip
                  label={tool.badge}
                  size="small"
                  color="warning"
                  sx={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -4, 
                    height: 18, 
                    fontSize: '0.6rem', 
                    fontWeight: 700,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: tool.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  color: tool.iconColor,
                  '& svg': { fontSize: 24 }
                }}
              >
                {tool.icon}
              </Box>
              <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ lineHeight: 1.2, mb: 0.25 }}>
                {tool.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {tool.subtitle}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* AI Queries Usage - For Free Users */}
        {subscription && subscription.isFree && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>
                  AI Queries Today
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((subscription.usage.count / subscription.usage.limit) * 100, 100)}
                    sx={{
                      flex: 1,
                      maxWidth: 120,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'grey.100',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: subscription.isLimitReached ? 'error.main' : 'primary.main',
                        borderRadius: 3
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {subscription.usage.count}/{subscription.usage.limit}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={onUpgrade}
                sx={{ fontWeight: 600, textTransform: 'none', ml: 2 }}
              >
                Unlimited
              </Button>
            </Box>
          </Paper>
        )}

        {/* OTP Dialog */}
        <AdminOTPDialog
          open={showOTPDialog}
          onClose={() => {
            setShowOTPDialog(false);
            setPendingAction(null);
          }}
          onSuccess={handleOTPSuccess}
        />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 2, mt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            © 2025{' '}
            <a 
              href="https://www.linkedin.com/in/amantalwar/" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Amandeep Singh Talwar
            </a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;
