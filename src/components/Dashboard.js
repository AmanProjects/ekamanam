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
  Construction as ToolIcon,
  Calculate as MathIcon,
  Science as ChemistryIcon,
  Bolt as PhysicsIcon,
  Code as CodeIcon,
  Public as GlobeIcon,
  Psychology as VyonnIconMui,
  Close as CloseIcon
} from '@mui/icons-material';
import AdminOTPDialog from './AdminOTPDialog';
import { isAuthorizedAdmin } from '../services/otpService';
import llmService, { PROVIDERS } from '../services/llmService';
import { Snackbar, Alert } from '@mui/material';

// Import educational tools
import { MathTools, ChemistryTools, PhysicsSimulator, CodeEditor, GlobeViewer, VyonnAI } from './tools';

/**
 * Dashboard Component - v10.5.6
 * 
 * Clean, organized layout with:
 * - Welcome header with subscription status
 * - Primary CTA for Library
 * - Unified Tools section (8 tools in 4-column grid):
 *   * Vyonn AI, Flashcards, Journey, Math, Chemistry, Physics, Code, Globe
 * - Pro Tools toggle (moved to footer, OTP protected)
 * - Upgrade CTA for free users
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
  currentStreak = 0,
  onOpenSettings  // v10.1: Open settings for API key configuration
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
  const [showVyonnAI, setShowVyonnAI] = useState(false);
  
  // v10.1: API key configuration alert
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);

  // v10.1: Check if API keys are configured
  const hasAnyApiKey = () => {
    return llmService.hasApiKey(PROVIDERS.GEMINI) || llmService.hasApiKey(PROVIDERS.GROQ);
  };

  // v10.1: Wrapper to check API keys before opening AI-powered tools
  const openToolWithApiCheck = (toolSetter) => {
    if (!hasAnyApiKey()) {
      setShowApiKeyAlert(true);
      return;
    }
    toolSetter(true);
  };

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
              subscription.subscription?.isDemo ? (
                // Demo account badge
                <Chip
                  icon={<CheckIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label="DEMO (Full Access)"
                  size="small"
                  color="warning"
                  sx={{ 
                    fontWeight: 700, 
                    height: 24,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              ) : subscription.isPaid ? (
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
        </Box>

        {/* Primary CTA - My Library */}
        <Paper 
          elevation={0}
          onClick={() => onOpenLibrary(subscription?.isFree ? 1 : 0)}
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

        {/* Unified Tools Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography 
            variant="overline" 
            sx={{
              color: 'text.secondary', 
              fontWeight: 600,
              letterSpacing: 1.5
            }}
          >
            Tools
          </Typography>
        </Box>
        
        {/* Check if user has paid subscription */}
        {subscription && subscription.isPaid ? (
          // Paid users - Show all tools in a grid
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 1.5, 
            mb: 3 
          }}>
            {[
              { key: 'vyonn', icon: <VyonnIconMui />, label: 'Vyonn AI', color: '#6366f1', onClick: () => openToolWithApiCheck(setShowVyonnAI), isImage: true },
              { key: 'flashcards', icon: <FlashcardIcon />, label: 'Flashcards', color: '#6366f1', onClick: onOpenFlashcards, badge: dueCardCount > 0 ? `${dueCardCount}` : null },
              { key: 'journey', icon: <TimelineIcon />, label: 'Journey', color: '#0ea5e9', onClick: onOpenTimeline },
              { key: 'math', icon: <MathIcon />, label: 'Math', color: '#1976d2', onClick: () => openToolWithApiCheck(setShowMathTools) },
              { key: 'chemistry', icon: <ChemistryIcon />, label: 'Chemistry', color: '#4caf50', onClick: () => openToolWithApiCheck(setShowChemistryTools) },
              { key: 'physics', icon: <PhysicsIcon />, label: 'Physics', color: '#6c5ce7', onClick: () => openToolWithApiCheck(setShowPhysicsSimulator) },
              { key: 'code', icon: <CodeIcon />, label: 'Code', color: '#2d3436', onClick: () => openToolWithApiCheck(setShowCodeEditor) },
              { key: 'globe', icon: <GlobeIcon />, label: 'Globe', color: '#0984e3', onClick: () => openToolWithApiCheck(setShowGlobeViewer) }
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
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  bgcolor: 'background.paper',
                  '&:hover': {
                    borderColor: tool.color,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${tool.color}20`
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
                {tool.isImage ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mb: 0.5,
                    height: '2rem'
                  }}>
                    <img 
                      src="/vyonn.png" 
                      alt="Vyonn AI" 
                      style={{ 
                        height: '32px', 
                        width: 'auto',
                        filter: 'brightness(0.2) saturate(1.5) contrast(1.2)',
                        objectFit: 'contain'
                      }} 
                    />
                  </Box>
                ) : (
                  <Box sx={{ 
                    color: tool.color,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 0.5,
                    '& svg': { fontSize: 32 }
                  }}>
                    {tool.icon}
                  </Box>
                )}
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  sx={{ 
                    color: 'text.primary',
                    fontSize: '0.7rem'
                  }}
                >
                  {tool.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        ) : (
          // Free users - Compelling upgrade message
              <Paper
            elevation={2}
                sx={{
              p: 0,
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
                  border: '1px solid',
              borderColor: '#1976d2'
            }}
          >
            {/* Header */}
            <Box sx={{ 
              bgcolor: '#1976d2', 
              color: 'white', 
              px: 2, 
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Student Plan Benefits
              </Typography>
              <Chip 
                label="Most Popular" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600
                }} 
              />
            </Box>
            
            {/* Content */}
            <Box sx={{ p: 2 }}>
              {/* Benefits Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 1.5, 
                mb: 2 
              }}>
                {[
                  { icon: <VyonnIconMui />, text: 'Vyonn AI Assistant', isImage: true, color: '#6366f1' },
                  { icon: <FlashcardIcon />, text: 'Flashcards & Spaced Repetition', color: '#6366f1' },
                  { icon: <TimelineIcon />, text: 'Learning Journey Tracker', color: '#0ea5e9' },
                  { icon: <MathIcon />, text: 'Math Lab (Class 1-12)', color: '#1976d2' },
                  { icon: <ChemistryIcon />, text: 'Chemistry Lab', color: '#4caf50' },
                  { icon: <PhysicsIcon />, text: 'Physics & Circuit Simulator', color: '#6c5ce7' },
                  { icon: <CodeIcon />, text: 'Code Editor with AI', color: '#2d3436' },
                  { icon: <GlobeIcon />, text: 'Interactive Globe Explorer', color: '#0984e3' },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      bgcolor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      color: item.color,
                      '& svg': { fontSize: 16 }
                    }}>
                      {item.isImage ? (
                        <img 
                          src="/vyonn.png" 
                          alt="Vyonn" 
                          style={{ 
                            height: '18px', 
                            width: 'auto',
                            filter: 'brightness(0.2) saturate(1.5) contrast(1.2)',
                            objectFit: 'contain'
                          }} 
                        />
                      ) : (
                        item.icon
                      )}
                    </Box>
                    <Typography variant="caption" color="text.primary" fontWeight={500}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              {/* CTA */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ lineHeight: 1 }}>
                    ₹299
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      /month
                    </Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Cancel anytime
                </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={onUpgrade}
                sx={{
                    textTransform: 'none', 
                    fontWeight: 600,
                    px: 3,
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#1565c0' }
                  }}
                >
                  Upgrade Now
                </Button>
              </Box>
            </Box>
              </Paper>
        )}

        {/* AI Queries Usage - Hidden per user request */}

        {/* OTP Dialog */}
        <AdminOTPDialog
          open={showOTPDialog}
          onClose={() => {
            setShowOTPDialog(false);
            setPendingAction(null);
          }}
          onSuccess={handleOTPSuccess}
        />

        {/* Tool Dialogs - All consistent with Chemistry AI structure */}
        <VyonnAI 
          open={showVyonnAI} 
          onClose={() => setShowVyonnAI(false)} 
          user={user}
          onOpenTool={(tool) => {
            // Close Vyonn AI and open the requested tool
            setShowVyonnAI(false);
            switch(tool) {
              case 'math':
                openToolWithApiCheck(setShowMathTools);
                break;
              case 'chemistry':
                openToolWithApiCheck(setShowChemistryTools);
                break;
              case 'physics':
                openToolWithApiCheck(setShowPhysicsSimulator);
                break;
              case 'code':
                openToolWithApiCheck(setShowCodeEditor);
                break;
              case 'globe':
                openToolWithApiCheck(setShowGlobeViewer);
                break;
              default:
                break;
            }
          }}
        />
        <MathTools open={showMathTools} onClose={() => setShowMathTools(false)} user={user} />
        <ChemistryTools open={showChemistryTools} onClose={() => setShowChemistryTools(false)} user={user} />
        <PhysicsSimulator open={showPhysicsSimulator} onClose={() => setShowPhysicsSimulator(false)} user={user} />
        <CodeEditor open={showCodeEditor} onClose={() => setShowCodeEditor(false)} user={user} />
        <GlobeViewer open={showGlobeViewer} onClose={() => setShowGlobeViewer(false)} user={user} />

        {/* Pro Tools Toggle - Admin Only (moved to footer) */}
        {subscription && subscription.isPaid && (
          <Box sx={{ textAlign: 'center', pt: 2, mt: 2, borderTop: 1, borderColor: 'divider', mb: 2 }}>
            <Button
              size="small"
              variant="text"
              onClick={handleProToolsToggle}
              startIcon={<ToolIcon />}
              sx={{
                textTransform: 'none',
                color: proToolsEnabled ? 'success.main' : 'text.secondary',
                fontSize: '0.75rem',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              Pro Tools: {proToolsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </Box>
        )}

        {/* Footer with Copyright and Disclaimer */}
        <Box sx={{ textAlign: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            © 2025{' '}
            <a 
              href="https://www.linkedin.com/in/amantalwar/" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Amandeep Singh Talwar
            </a>
            . All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1.3, px: 2, display: 'block' }}>
            Disclaimer: This application provides AI-powered learning assistance. All PDF copyrights belong to their respective owners. For personal educational use only.
          </Typography>
        </Box>

        {/* v10.1: API Key Configuration Alert */}
        <Snackbar
          open={showApiKeyAlert}
          autoHideDuration={8000}
          onClose={() => setShowApiKeyAlert(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowApiKeyAlert(false)} 
            severity="warning"
            sx={{ width: '100%' }}
            action={
              onOpenSettings && (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => {
                    setShowApiKeyAlert(false);
                    onOpenSettings();
                  }}
                >
                  Open Settings
                </Button>
              )
            }
          >
            Please configure your API keys in Settings to use AI-powered tools.
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Dashboard;
