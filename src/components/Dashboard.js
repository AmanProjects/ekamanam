import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  IconButton
} from '@mui/material';
import {
  FileUpload,
  FolderOpen,
  Book,
  Description,
  FlashOn,
  CenterFocusWeak,
  Close
} from '@mui/icons-material';

function Dashboard({ onFileSelect, onStartReading, selectedFile, onViewLibrary }) {
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto', 
      bgcolor: '#f8fafc',
      py: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="lg">
        {/* Logo and Title Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 3,
            bgcolor: 'white',
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/Ekamanam_logo.png`}
            alt="Ekamanam"
            sx={{
              width: { xs: 120, sm: 160, md: 200 },
              height: { xs: 120, sm: 160, md: 200 },
              mx: 'auto',
              mb: 2,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
              color: '#1f2937'
            }}
          >
            Ekamanam
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#6b7280',
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
              mb: 2
            }}
          >
            AI-Powered Study Companion
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 2, 
              color: '#4b5563',
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Upload your textbook and experience AI-powered learning with instant explanations,
            interactive demos, and focus monitoring.
          </Typography>
        </Paper>

        {/* File Upload Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 3,
            bgcolor: 'white',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'primary.main',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'primary.dark',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            
            {!selectedFile ? (
              <label htmlFor="pdf-file-input" style={{ cursor: 'pointer' }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2 
                }}>
                  <Box 
                    sx={{ 
                      width: { xs: 64, md: 80 }, 
                      height: { xs: 64, md: 80 }, 
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <FileUpload sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                  >
                    Select Your PDF Textbook
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Click here to browse and select a PDF file
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<FolderOpen />}
                    sx={{ 
                      mt: 2,
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                      }
                    }}
                  >
                    Browse Files
                  </Button>
                </Box>
              </label>
            ) : (
              <Box sx={{ animation: 'fadeIn 0.3s ease-in' }}>
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <Description sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  File Selected!
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 400,
                    mx: 'auto'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Description color="success" />
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onFileSelect(null)}
                  >
                    <Close />
                  </IconButton>
                </Paper>
                <label htmlFor="pdf-file-input">
                  <Button 
                    variant="text" 
                    size="small" 
                    sx={{ mt: 2 }}
                    component="span"
                  >
                    Choose a different file
                  </Button>
                </label>
              </Box>
            )}
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={!selectedFile}
            onClick={onStartReading}
            startIcon={<Book />}
            sx={{ 
              mt: 3,
              py: 1.5,
              fontSize: { xs: '0.875rem', md: '1rem' },
              background: selectedFile 
                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                : undefined,
              '&:hover': {
                background: selectedFile 
                  ? 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)'
                  : undefined,
              }
            }}
          >
            Start Reading
          </Button>
        </Paper>

        {/* Feature Cards */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Description 
                  sx={{ 
                    fontSize: { xs: 32, md: 40 }, 
                    mb: 1.5, 
                    color: 'primary.main' 
                  }} 
                />
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  fontWeight={600}
                  sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                >
                  Any PDF
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Upload any textbook or document
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: '4px solid',
                borderLeftColor: 'secondary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <FlashOn 
                  sx={{ 
                    fontSize: { xs: 32, md: 40 }, 
                    mb: 1.5, 
                    color: 'secondary.main' 
                  }} 
                />
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  fontWeight={600}
                  sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                >
                  AI Powered
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Instant explanations & demos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: '4px solid',
                borderLeftColor: 'success.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <CenterFocusWeak 
                  sx={{ 
                    fontSize: { xs: 32, md: 40 }, 
                    mb: 1.5, 
                    color: 'success.main' 
                  }} 
                />
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  fontWeight={600}
                  sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                >
                  Stay Focused
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Smart focus monitoring
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;

