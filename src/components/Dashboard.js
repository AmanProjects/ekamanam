import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Grid,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  LocalLibrary as LibraryIcon,
  School as SchoolIcon,
  TipsAndUpdates as TipsIcon,
  Speed as SpeedIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

function Dashboard({ onFileSelect, onOpenLibrary }) {
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#fafafa',
      py: 6
    }}>
      <Container maxWidth="md">
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

        {/* Main Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Upload PDF */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Upload PDF
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload a textbook and start learning with AI-powered explanations
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<UploadIcon />}
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleFileInputChange}
                  />
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* My Library */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <LibraryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  My Library
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Access your PDFs and continue from where you left off
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<LibraryIcon />}
                  onClick={onOpenLibrary}
                >
                  Open Library
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Features */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            Features
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Teacher Mode
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <TipsIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Smart Explain
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <LanguageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Multilingual
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Lightning Fast
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Free • Open Source • Privacy Focused
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;
