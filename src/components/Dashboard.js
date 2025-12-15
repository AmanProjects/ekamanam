import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip
} from '@mui/material';
import {
  LocalLibrary as LibraryIcon,
  School as SchoolIcon,
  TipsAndUpdates as TipsIcon,
  AssignmentTurnedIn as ExamIcon,
  Language as LanguageIcon,
  Upgrade as UpgradeIcon,
  CheckCircle as CheckIcon,
  Style as FlashcardIcon,
  Timeline as TimelineIcon,
  QuestionAnswer as DoubtIcon,
  People as PeerIcon
} from '@mui/icons-material';

function Dashboard({
  onOpenLibrary,
  subscription,
  onUpgrade,
  onOpenFlashcards,
  onOpenTimeline,
  onOpenDoubtLibrary,
  dueCardCount = 0
}) {
  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 80px)',
      bgcolor: 'background.default',
      py: 4,
      display: 'flex',
      alignItems: 'center',
      '@keyframes pulse': {
        '0%, 100%': {
          opacity: 1,
          transform: 'scale(1)'
        },
        '50%': {
          opacity: 0.6,
          transform: 'scale(1.2)'
        }
      }
    }}>
      <Container maxWidth="md">
        {/* Subscription Status */}
        {subscription && !subscription.loading && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: subscription.isPaid ? 'transparent' : 'divider',
              borderRadius: 2,
              background: subscription.isPaid
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)'
                : 'background.paper',
              boxShadow: subscription.isPaid 
                ? '0 4px 20px rgba(102, 126, 234, 0.1)' 
                : '0 2px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: subscription.isPaid
                  ? '0 6px 24px rgba(102, 126, 234, 0.15)'
                  : '0 4px 16px rgba(0, 0, 0, 0.1)'
              },
              ...(subscription.isPaid && {
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 2,
                  padding: '1px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none'
                }
              })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary'
                    }}
                  >
                    {subscription.tierDetails.name} Plan
                  </Typography>
                  {subscription.tierDetails.popular && (
                    <Chip 
                      label="POPULAR" 
                      size="small" 
                      color="primary"
                      sx={{ 
                        height: 20,
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }} 
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.875rem', mt: 0.5 }}>
                  {subscription.tierDetails.description}
                </Typography>
                
                {/* Usage indicator for free tier */}
                {subscription.isFree && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', minWidth: 120 }}>
                      AI Queries Today
                    </Typography>
                    <Chip
                      label={`${subscription.usage.count}/${subscription.usage.limit}`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: subscription.isLimitReached 
                          ? 'error.light' 
                          : subscription.usage.count > subscription.usage.limit * 0.6 
                          ? 'warning.light' 
                          : 'primary.light',
                        color: subscription.isLimitReached 
                          ? 'error.dark' 
                          : subscription.usage.count > subscription.usage.limit * 0.6 
                          ? 'warning.dark' 
                          : 'primary.dark'
                      }}
                    />
                  </Box>
                )}
              </Box>
              
              {subscription.isFree && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<UpgradeIcon />}
                  onClick={onUpgrade}
                  sx={{
                    fontWeight: 700,
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upgrade Now
                </Button>
              )}
              
              {subscription.isPaid && (
                <Chip
                  icon={<CheckIcon />}
                  label="Active"
                  color="success"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    height: 36,
                    '& .MuiChip-icon': {
                      fontSize: '1.1rem'
                    }
                  }}
                />
              )}
            </Box>
          </Paper>
        )}

        {/* Primary CTA - My Library */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            border: '2px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            mb: 3,
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }
          }}
        >
          <LibraryIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            My Library
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 500, mx: 'auto' }}>
            Access your PDFs, track progress, and continue learning from where you left off
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LibraryIcon />}
              onClick={onOpenLibrary}
              sx={{
                py: 1.75,
                px: 4,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              My Library
            </Button>
          </Box>
        </Paper>

        {/* Learning Features */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Learning Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Teacher Mode
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <TipsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Smart Explain
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <LanguageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Multilingual
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <ExamIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Exam Prep
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => {
                  // Trigger Vyonn FAB button click
                  const vyonnButton = document.querySelector('[aria-label="chat with Vyonn"]');
                  if (vyonnButton) {
                    vyonnButton.click();
                  }
                }}
              >
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/vyonn.png`}
                  alt="Vyonn AI"
                  sx={{
                    width: 48,
                    height: 48,
                    mb: 1,
                    filter: (theme) => theme.palette.mode === 'dark' 
                      ? 'brightness(0.3) saturate(1.3) contrast(1.2)' 
                      : 'brightness(0.2) saturate(1.4) contrast(1.3)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <Typography variant="body2" fontWeight={500}>
                  Vyonn AI
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* New Revolutionary Features */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            🚀 New Features
            <Chip
              label="NEW"
              size="small"
              color="error"
              sx={{ ml: 1, fontWeight: 700 }}
            />
          </Typography>
          <Grid container spacing={2}>
            {/* Flashcard Review */}
            <Grid item xs={6} sm={3}>
              <Paper
                elevation={0}
                onClick={onOpenFlashcards}
                sx={{
                  p: 2.5,
                  border: '2px solid',
                  borderColor: dueCardCount > 0 ? 'warning.main' : 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {dueCardCount > 0 && (
                  <Chip
                    label={`${dueCardCount} due`}
                    size="small"
                    color="warning"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontWeight: 700
                    }}
                  />
                )}
                <FlashcardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  Flashcard Review
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Spaced repetition
                </Typography>
              </Paper>
            </Grid>

            {/* Learning Journey */}
            <Grid item xs={6} sm={3}>
              <Paper
                elevation={0}
                onClick={onOpenTimeline}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <TimelineIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  Learning Journey
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Session history
                </Typography>
              </Paper>
            </Grid>

            {/* Doubt Library */}
            <Grid item xs={6} sm={3}>
              <Paper
                elevation={0}
                onClick={onOpenDoubtLibrary}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <DoubtIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  Doubt Library
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Crowdsourced Q&A
                </Typography>
              </Paper>
            </Grid>

            {/* Coming Soon - Peer Learning */}
            <Grid item xs={6} sm={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  opacity: 0.6
                }}
              >
                <PeerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  Peer Learning
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Coming soon
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 <a href="https://www.linkedin.com/in/amantalwar/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Amandeep Singh Talwar</a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;
