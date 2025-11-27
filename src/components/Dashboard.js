import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  alpha
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  LocalLibrary as LibraryIcon,
  AutoStories as BookIcon,
  TipsAndUpdates as TipsIcon,
  School as SchoolIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

function Dashboard({ onFileSelect, onOpenLibrary }) {
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 8,
      pb: 6
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mb: 2
          }}>
            <img 
              src={`${process.env.PUBLIC_URL}/Ekamanaml.png`}
              alt="Ekamanam Logo" 
              style={{ 
                height: '80px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
            />
          </Box>
          
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 700, 
              color: 'white',
              mb: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Ekamanam
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              mb: 1,
              fontWeight: 300
            }}
          >
            एकमनम् | ఏకమనం | ஏகமனம் | One Mind
          </Typography>
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              maxWidth: 600,
              mx: 'auto',
              fontSize: '1.1rem'
            }}
          >
            The Art of Focused Learning
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip 
              label="AI-Powered" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Chip 
              label="Multilingual" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Chip 
              label="100% Free" 
              sx={{ 
                bgcolor: 'rgba(76,175,80,0.9)', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>
        </Box>

        {/* Main Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Quick Start Card */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={8}
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h5" fontWeight={600}>
                    Quick Start
                  </Typography>
                </Box>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Upload a PDF textbook and start learning with AI-powered explanations, 
                  interactive visualizations, and bilingual support.
                </Typography>

                <Box sx={{ 
                  bgcolor: alpha('#667eea', 0.05),
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  border: '2px dashed',
                  borderColor: 'primary.main'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Supports:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="📚 PDF Files" size="small" variant="outlined" />
                    <Chip label="🌐 All Languages" size="small" variant="outlined" />
                    <Chip label="📊 Visual Learning" size="small" variant="outlined" />
                  </Box>
                </Box>

                <Button
                  component="label"
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ 
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    }
                  }}
                >
                  Upload PDF & Start Learning
                  <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleFileSelect}
                  />
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* My Library Card */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={8}
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LibraryIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h5" fontWeight={600}>
                    My Library
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                  Access your collection of PDFs, track your reading progress, 
                  and pick up right where you left off. All your study materials 
                  in one place.
                </Typography>

                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    <strong>Library Features:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">✓ Auto-save reading progress</Typography>
                    <Typography variant="body2">✓ Quick search & access</Typography>
                    <Typography variant="body2">✓ Thumbnail previews</Typography>
                    <Typography variant="body2">✓ Offline storage (IndexedDB)</Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<LibraryIcon />}
                  onClick={onOpenLibrary}
                  sx={{ 
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    bgcolor: 'white',
                    color: '#f5576c',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  Open My Library
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Features Grid */}
        <Paper 
          elevation={4}
          sx={{ 
            p: 4, 
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography 
            variant="h5" 
            fontWeight={600} 
            gutterBottom 
            sx={{ 
              textAlign: 'center',
              mb: 3,
              color: 'text.primary'
            }}
          >
            Powerful Learning Tools
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Teacher Mode
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get explanations like a teacher would explain - clear, structured, 
                  with examples and exam tips
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <TipsIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Smart Explain
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detects exercises, provides step-by-step solutions with visuals, 
                  and answers your questions
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <BookIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Word Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Learn vocabulary with pronunciation, meaning, and bilingual explanations 
                  for regional languages
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Lightning Fast
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Powered by Groq's LPU technology - get AI responses in 3-5 seconds, 
                  5-7x faster than traditional models
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Quick Tips */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
              💡 Pro Tips
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>For Best Results:</strong> Select specific sections or questions 
                  instead of full pages
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Multilingual Support:</strong> Works with Hindi, Telugu, Tamil, 
                  English, and more
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Free Forever:</strong> No sign-up required, bring your own API key 
                  (or use ours for limited use)
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Footer CTA */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Transform your learning experience with AI-powered study tools
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;
