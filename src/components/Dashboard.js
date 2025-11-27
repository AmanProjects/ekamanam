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
  Speed as SpeedIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

function Dashboard({ onOpenLibrary }) {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#fafafa',
      py: 6
    }}>
      <Container maxWidth="sm">
        {/* Logo and Title */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/Ekamanam_logo.png`}
            alt="Ekamanam"
            sx={{
              maxWidth: 200,
              height: 'auto',
              mx: 'auto',
              mb: 2,
              display: 'block'
            }}
          />
          <Typography variant="h3" fontWeight={600} gutterBottom sx={{ color: '#1a1a1a' }}>
            Ekamanam
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            एकमनम् | ఏకమనం | ஏகமனம்
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={300}>
            AI-Powered Learning Platform
          </Typography>
        </Box>

        {/* Main Action - My Library */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            mb: 4,
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }
          }}
        >
          <LibraryIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            My Library
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Access your PDFs, track progress, and continue learning from where you left off
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LibraryIcon />}
            onClick={onOpenLibrary}
            sx={{ 
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Open My Library
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Add PDFs, manage your collection, and resume reading
          </Typography>
        </Paper>

        {/* Features */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
            Learning Features
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="caption" fontWeight={500}>
                  Teacher Mode
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <TipsIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="caption" fontWeight={500}>
                  Smart Explain
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <LanguageIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="caption" fontWeight={500}>
                  Multilingual
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="caption" fontWeight={500}>
                  Lightning Fast
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Free • Open Source • Privacy Focused
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;
