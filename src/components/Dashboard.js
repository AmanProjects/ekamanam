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
  MenuBook,
  Description,
  Bolt,
  CenterFocusStrong,
  Close
} from '@mui/icons-material';

function Dashboard({ onFileSelect, onStartReading, selectedFile }) {
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
      bgcolor: 'background.default',
      py: 4
    }}>
      <Container maxWidth="md">
        {/* Welcome Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome to Ekamanam
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            The Art of Focused Learning
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, opacity: 0.95 }}>
            Upload your NCERT textbook and experience AI-powered learning with instant explanations,
            interactive demos, and focus monitoring.
          </Typography>
        </Paper>

        {/* File Upload Section */}
        <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            My Books
          </Typography>
          
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
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileUpload sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    Select Your PDF Textbook
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click here to browse and select a PDF file
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<FolderOpen />}
                    sx={{ mt: 2 }}
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
            startIcon={<MenuBook />}
            sx={{ 
              mt: 3,
              py: 1.5,
              background: selectedFile 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : undefined
            }}
          >
            Start Reading
          </Button>
        </Paper>

        {/* Feature Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Description color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Any PDF
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload any textbook or document
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Bolt color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  AI Powered
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Instant explanations & demos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <CenterFocusStrong color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Stay Focused
                </Typography>
                <Typography variant="body2" color="text.secondary">
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

