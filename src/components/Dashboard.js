import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Grid
} from '@mui/material';
import {
  LocalLibrary as LibraryIcon,
  School as SchoolIcon,
  TipsAndUpdates as TipsIcon,
  AssignmentTurnedIn as ExamIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

function Dashboard({ onOpenLibrary }) {
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
            Open My Library
          </Button>
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
                      ? 'brightness(0.8) saturate(0.7)' 
                      : 'brightness(0) saturate(0%) opacity(0.54)'
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
