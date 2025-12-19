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
  IconButton,
  Dialog
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
  Construction as ToolIcon,
  Calculate as MathIcon,
  Science as ChemistryIcon,
  Bolt as PhysicsIcon,
  Code as CodeIcon,
  Public as GlobeIcon
} from '@mui/icons-material';
import AdminOTPDialog from './AdminOTPDialog';
import { isAuthorizedAdmin } from '../services/otpService';

// Import educational tools
import { MathTools, ChemistryTools, PhysicsSimulator, CodeEditor, GlobeViewer } from './tools';

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

  // v8.1: Educational Tools dialogs
  const [showMathTools, setShowMathTools] = useState(false);
  const [showChemistryTools, setShowChemistryTools] = useState(false);
  const [showPhysicsSimulator, setShowPhysicsSimulator] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showGlobeViewer, setShowGlobeViewer] = useState(false);

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
      onClick: subscription?.isPaid ? handleProToolsToggle : onUpgrade,
      icon: <ToolIcon />,
      iconColor: subscription?.isPaid && proToolsEnabled ? '#10b981' : '#64748b',
      iconBg: subscription?.isPaid && proToolsEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
      title: 'Tools',
      subtitle: subscription?.isPaid ? (proToolsEnabled ? 'Enabled' : 'Disabled') : 'Upgrade',
      badge: subscription?.isPaid && proToolsEnabled ? '✓' : null,
      isToggle: subscription?.isPaid,
      isLocked: !subscription?.isPaid
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

        {/* Educational Tools - Quick Access */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 600,
              letterSpacing: 1.5
            }}
          >
            Educational Tools
          </Typography>
          <Chip 
            label="NEW" 
            size="small" 
            sx={{ 
              height: 18, 
              fontSize: '0.6rem', 
              fontWeight: 700, 
              bgcolor: '#ff4757', 
              color: 'white',
              '& .MuiChip-label': { px: 0.8 }
            }} 
          />
        </Box>
        
        {/* Check if user has paid subscription */}
        {subscription && subscription.isPaid ? (
          // Paid users - Show interactive tools
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: 1, 
            mb: 3 
          }}>
            {[
              { key: 'math', icon: '📐', label: 'Math', color: '#1976d2', onClick: () => setShowMathTools(true) },
              { key: 'chemistry', icon: '🧪', label: 'Chemistry', color: '#4caf50', onClick: () => setShowChemistryTools(true) },
              { key: 'physics', icon: '⚡', label: 'Physics', color: '#6c5ce7', onClick: () => setShowPhysicsSimulator(true) },
              { key: 'code', icon: '💻', label: 'Code', color: '#2d3436', onClick: () => setShowCodeEditor(true) },
              { key: 'globe', icon: '🌍', label: 'Globe', color: '#0984e3', onClick: () => setShowGlobeViewer(true) }
            ].map((tool) => (
              <Paper
                key={tool.key}
                elevation={0}
                onClick={tool.onClick}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: 'background.paper',
                  '&:hover': { 
                    borderColor: tool.color,
                    transform: 'translateY(-2px)', 
                    boxShadow: `0 4px 12px ${tool.color}20`
                  }
                }}
              >
                <Typography fontSize="1.5rem" sx={{ mb: 0.5, lineHeight: 1 }}>
                  {tool.icon}
                </Typography>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  sx={{ 
                    color: 'text.primary',
                    fontSize: '0.65rem'
                  }}
                >
                  {tool.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        ) : (
          // Free users - Show marketing message
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
              border: '1px dashed',
              borderColor: '#667eea50'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                fontSize: '1.2rem',
                opacity: 0.6,
                filter: 'grayscale(0.5)'
              }}>
                📐🧪⚡💻🌍
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                  🔒 Unlock Educational Tools
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                  Get access to <strong>AI-powered Math Games</strong>, <strong>Chemistry Lab</strong>, 
                  <strong>Physics Simulator</strong>, <strong>Code Editor</strong>, and <strong>Interactive Globe</strong>. 
                  Perfect for students who want to excel!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onUpgrade}
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)'
                      }
                    }}
                  >
                    Upgrade to Student Plan
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    ₹299/month • Cancel anytime
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

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

        {/* Educational Tool Dialogs */}
        <MathTools open={showMathTools} onClose={() => setShowMathTools(false)} />
        <ChemistryTools open={showChemistryTools} onClose={() => setShowChemistryTools(false)} user={user} />
        <PhysicsSimulator open={showPhysicsSimulator} onClose={() => setShowPhysicsSimulator(false)} user={user} />
        <CodeEditor open={showCodeEditor} onClose={() => setShowCodeEditor(false)} />
        <GlobeViewer open={showGlobeViewer} onClose={() => setShowGlobeViewer(false)} />

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
