import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Delete,
  CloudUpload,
  MenuBook
} from '@mui/icons-material';
import libraryService from '../services/libraryService';

function Library({ onBack, onOpenPdf }) {
  const [pdfs, setPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const allPdfs = await libraryService.getAllLibraryItems();
      setPdfs(allPdfs);
    } catch (error) {
      console.error('❌ Failed to load library:', error);
      alert(`Failed to load library:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, title) => {
    if (window.confirm(`Remove "${title}" from library?`)) {
      try {
        await libraryService.removePDFFromLibrary(id);
        await loadLibrary();
      } catch (error) {
        console.error('❌ Failed to remove PDF:', error);
        alert(`Failed to remove PDF:\n${error.message}`);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }
    
    console.log('📄 Adding PDF to library:', file.name);
    
    try {
      const libraryItem = await libraryService.addPDFToLibrary(file, {
        name: file.name.replace('.pdf', ''),
        subject: 'General',
        workspace: 'My Files'
      });
      console.log('✅ PDF added successfully:', libraryItem);
      await loadLibrary();
      alert(`✅ "${file.name}" added to library!`);
    } catch (error) {
      console.error('❌ Failed to add PDF:', error);
      alert(`Failed to add PDF to library:\n${error.message}\n\nPlease try again.`);
    }
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);
  const avgProgress = pdfs.length > 0
    ? pdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / pdfs.length
    : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            My Library
          </Typography>
        </Box>

        {/* Stats & Search */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {pdfs.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDFs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {totalPages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Pages
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {avgProgress.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Progress
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component="label"
                variant="contained"
                fullWidth
                startIcon={<CloudUpload />}
                size="small"
              >
                Add PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search library..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* PDF Grid - Compact Design */}
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading library...</Typography>
          </Box>
        ) : filteredPdfs.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <MenuBook sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm ? 'No PDFs found' : 'Your library is empty'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ? 'Try a different search term' : 'Upload your first PDF to get started'}
            </Typography>
            {!searchTerm && (
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
              >
                Upload PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={handleFileUpload}
                />
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredPdfs.map((pdf) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={pdf.id}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      bgcolor: '#f5f5f5',
                      backgroundImage: pdf.thumbnailUrl ? `url(${pdf.thumbnailUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => onOpenPdf(pdf)}
                  >
                    {!pdf.thumbnailUrl && (
                      <MenuBook sx={{ fontSize: 48, color: 'text.disabled' }} />
                    )}
                  </CardMedia>

                  <CardContent sx={{ p: 2 }}>
                    {/* Title */}
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.5em',
                        mb: 1
                      }}
                    >
                      {pdf.name}
                    </Typography>

                    {/* Progress */}
                    {pdf.progress > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Page {pdf.lastPage || 1} of {pdf.totalPages || '?'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pdf.progress?.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={pdf.progress || 0}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={() => onOpenPdf(pdf)}
                      >
                        Open
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(pdf.id, pdf.name)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default Library;
