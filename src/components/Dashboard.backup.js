// BACKUP: Dashboard before full redesign (v7.2.22)
// To revert: Copy this file's content to Dashboard.js

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
  Upgrade as UpgradeIcon,
  CheckCircle as CheckIcon,
  Style as FlashcardIcon,
  Timeline as TimelineIcon,
  QuestionAnswer as DoubtIcon
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
      minHeight: 'calc(100vh - 64px)',
      bgcolor: 'background.default',
      py: { xs: 2, md: 2.5 },
      display: 'flex',
      alignItems: 'flex-start'
    }}>
      <Container maxWidth="lg">
        {/* Top Row: Subscription + My Library */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Subscription Status - Compact */}
          {subscription && !subscription.loading && (
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: subscription.isPaid ? 'transparent' : 'divider',
                  borderRadius: 1.5,
                  background: subscription.isPaid
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)'
                    : 'background.paper',
                  ...(subscription.isPaid && {
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 1.5,
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {subscription.tierDetails.name} Plan
                      </Typography>
                      {subscription.isPaid && (
                        <Chip icon={<CheckIcon />} label="Active" color="success" size="small" sx={{ height: 24, '& .MuiChip-label': { px: 1 } }} />
                      )}
                    </Box>
                    {subscription.isFree && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">AI Queries:</Typography>
                        <Chip
                          label={`${subscription.usage.count}/${subscription.usage.limit}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            bgcolor: subscription.isLimitReached ? 'error.light' : 'primary.light',
                            color: subscription.isLimitReached ? 'error.dark' : 'primary.dark'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  {subscription.isFree && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<UpgradeIcon />}
                      onClick={onUpgrade}
                      sx={{ fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap' }}
                    >
                      Upgrade
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* My Library - Compact CTA */}
          <Grid item xs={12} md={subscription && !subscription.loading ? 7 : 12}>
            <Paper 
              elevation={0}
              onClick={onOpenLibrary}
              sx={{ 
                p: 2,
                height: '100%',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.04) 0%, rgba(25, 118, 210, 0.08) 100%)',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <LibraryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  My Library
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Access your PDFs and continue learning
                </Typography>
              </Box>
              <Button variant="contained" size="small" sx={{ fontWeight: 600 }}>
                Open
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Tools Section */}
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Tools
        </Typography>
        <Grid container spacing={2}>
          {/* Shared card styles */}
          {[
            {
              key: 'flashcards',
              onClick: onOpenFlashcards,
              icon: <FlashcardIcon sx={{ fontSize: 44, color: '#6366f1' }} />,
              title: 'Flashcard Review',
              subtitle: 'Spaced repetition',
              badge: dueCardCount > 0 ? `${dueCardCount} due` : null
            },
            {
              key: 'journey',
              onClick: onOpenTimeline,
              icon: <TimelineIcon sx={{ fontSize: 44, color: '#0ea5e9' }} />,
              title: 'Learning Journey',
              subtitle: 'Session history'
            },
            {
              key: 'doubts',
              onClick: onOpenDoubtLibrary,
              icon: <DoubtIcon sx={{ fontSize: 44, color: '#f43f5e' }} />,
              title: 'Doubt Library',
              subtitle: 'Crowdsourced Q&A'
            },
            {
              key: 'vyonn',
              onClick: () => {
                const vyonnButton = document.querySelector('[aria-label="chat with Vyonn"]');
                if (vyonnButton) vyonnButton.click();
              },
              icon: (
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/vyonn.png`}
                  alt="Vyonn AI"
                  sx={{ 
                    width: 44, 
                    height: 44,
                    filter: 'brightness(0) contrast(2) drop-shadow(0 0 0 #000)'
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ),
              title: 'Vyonn AI',
              subtitle: 'AI Assistant'
            }
          ].map((tool) => (
            <Grid item xs={6} sm={3} key={tool.key}>
              <Paper
                elevation={0}
                onClick={tool.onClick}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  bgcolor: 'background.paper',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    transform: 'translateY(-3px)', 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
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
                      top: 8, 
                      right: 8, 
                      height: 22, 
                      fontSize: '0.7rem', 
                      fontWeight: 700 
                    }}
                  />
                )}
                <Box sx={{ mb: 1.5 }}>{tool.icon}</Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {tool.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tool.subtitle}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Footer - Minimal */}
        <Box sx={{ textAlign: 'center', mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 <a href="https://www.linkedin.com/in/amantalwar/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Amandeep Singh Talwar</a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;

