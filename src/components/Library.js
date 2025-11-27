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
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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
  
  // Upload dialog state
  const [uploadDialog, setUploadDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    subject: '',
    class: '',
    customSubject: ''
  });

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }
    
    // Open dialog for metadata
    setPendingFile(file);
    setUploadMetadata({
      subject: '',
      class: '',
      customSubject: ''
    });
    setUploadDialog(true);
  };
  
  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    
    const subject = uploadMetadata.subject === 'Other' 
      ? uploadMetadata.customSubject || 'General'
      : uploadMetadata.subject || 'General';
    
    console.log('📄 Adding PDF to library:', pendingFile.name);
    
    try {
      const libraryItem = await libraryService.addPDFToLibrary(pendingFile, {
        name: pendingFile.name.replace('.pdf', ''),
        subject: subject,
        class: uploadMetadata.class || null,
        workspace: 'My Files'
      });
      console.log('✅ PDF added successfully:', libraryItem);
      await loadLibrary();
      setUploadDialog(false);
      setPendingFile(null);
      alert(`✅ "${pendingFile.name}" added to library!`);
    } catch (error) {
      console.error('❌ Failed to add PDF:', error);
      alert(`Failed to add PDF to library:\n${error.message}\n\nPlease try again.`);
    }
  };
  
  const handleCancelUpload = () => {
    setUploadDialog(false);
    setPendingFile(null);
    setUploadMetadata({ subject: '', class: '', customSubject: '' });
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);
  const avgProgress = pdfs.length > 0
    ? pdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / pdfs.length
    : 0;
  
  // Get unique subjects and classes
  const uniqueSubjects = [...new Set(pdfs.map(pdf => pdf.subject).filter(Boolean))];
  const uniqueClasses = [...new Set(pdfs.map(pdf => pdf.class).filter(Boolean))];
  
  // Subject and class distribution
  const subjectCounts = pdfs.reduce((acc, pdf) => {
    if (pdf.subject) {
      acc[pdf.subject] = (acc[pdf.subject] || 0) + 1;
    }
    return acc;
  }, {});
  
  const classCounts = pdfs.reduce((acc, pdf) => {
    if (pdf.class) {
      acc[pdf.class] = (acc[pdf.class] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={600}>
              My Library
            </Typography>
          </Box>
          
          {/* Quick Stats */}
          {pdfs.length > 0 && (
            <Box sx={{ ml: 7, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                📚 {pdfs.length} {pdfs.length === 1 ? 'PDF' : 'PDFs'}
              </Typography>
              {uniqueSubjects.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  • 📖 {uniqueSubjects.length} {uniqueSubjects.length === 1 ? 'Subject' : 'Subjects'}
                </Typography>
              )}
              {uniqueClasses.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  • 🎓 {uniqueClasses.length} {uniqueClasses.length === 1 ? 'Class' : 'Classes'}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                • 📄 {totalPages.toLocaleString()} Total Pages
              </Typography>
            </Box>
          )}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredPdfs.map((pdf) => {
              // Format size
              const formatSize = (bytes) => {
                if (!bytes) return 'Unknown';
                if (bytes < 1024) return `${bytes} B`;
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
              };

              // Format last accessed
              const formatLastAccessed = (isoString) => {
                if (!isoString) return 'Never';
                const date = new Date(isoString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHours < 24) return `${diffHours}h ago`;
                if (diffDays < 7) return `${diffDays}d ago`;
                return date.toLocaleDateString();
              };

              return (
                <Card 
                  key={pdf.id}
                  elevation={0}
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  {/* Book Cover */}
                  <Box
                    sx={{
                      width: 80,
                      height: 100,
                      flexShrink: 0,
                      bgcolor: '#f5f5f5',
                      backgroundImage: pdf.thumbnailUrl ? `url(${pdf.thumbnailUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      cursor: 'pointer',
                      mr: 2
                    }}
                    onClick={() => onOpenPdf(pdf)}
                  >
                    {!pdf.thumbnailUrl && (
                      <MenuBook sx={{ fontSize: 40, color: 'text.disabled' }} />
                    )}
                  </Box>

                  {/* PDF Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* PDF Name */}
                    <Typography 
                      variant="body1" 
                      fontWeight={600}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5
                      }}
                    >
                      {pdf.name}
                    </Typography>

                    {/* Subject & Class */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      {pdf.subject && (
                        <Chip 
                          label={pdf.subject} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: 'primary.main',
                            color: 'white'
                          }} 
                        />
                      )}
                      {pdf.class && (
                        <Chip 
                          label={`Class ${pdf.class}`} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: 'secondary.main',
                            color: 'white'
                          }} 
                        />
                      )}
                    </Box>

                    {/* Metadata Row */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        📦 {formatSize(pdf.size)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        🕐 {formatLastAccessed(pdf.lastOpened)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📄 {pdf.totalPages || '?'} pages
                      </Typography>
                      {pdf.storageType === 'indexeddb' && (
                        <Chip 
                          label="Cached" 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '0.65rem',
                            bgcolor: 'success.light',
                            color: 'success.dark'
                          }} 
                        />
                      )}
                      {pdf.lastPage > 1 && (
                        <Typography variant="caption" color="primary.main" fontWeight={500}>
                          Page {pdf.lastPage}
                        </Typography>
                      )}
                    </Box>

                    {/* Progress Bar (if started reading) */}
                    {pdf.progress > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={pdf.progress || 0}
                          sx={{ height: 3, borderRadius: 2 }}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
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
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Upload Metadata Dialog */}
      <Dialog open={uploadDialog} onClose={handleCancelUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Add PDF to Library</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              📄 {pendingFile?.name}
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={uploadMetadata.subject}
                label="Subject"
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, subject: e.target.value })}
              >
                <MenuItem value="Mathematics">Mathematics</MenuItem>
                <MenuItem value="Science">Science</MenuItem>
                <MenuItem value="Physics">Physics</MenuItem>
                <MenuItem value="Chemistry">Chemistry</MenuItem>
                <MenuItem value="Biology">Biology</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Hindi">Hindi</MenuItem>
                <MenuItem value="Social Science">Social Science</MenuItem>
                <MenuItem value="History">History</MenuItem>
                <MenuItem value="Geography">Geography</MenuItem>
                <MenuItem value="Economics">Economics</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Other">Other (Specify below)</MenuItem>
              </Select>
            </FormControl>
            
            {uploadMetadata.subject === 'Other' && (
              <TextField
                fullWidth
                label="Custom Subject"
                placeholder="Enter subject name"
                value={uploadMetadata.customSubject}
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, customSubject: e.target.value })}
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel>Class/Grade (Optional)</InputLabel>
              <Select
                value={uploadMetadata.class}
                label="Class/Grade (Optional)"
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, class: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="1">Class 1</MenuItem>
                <MenuItem value="2">Class 2</MenuItem>
                <MenuItem value="3">Class 3</MenuItem>
                <MenuItem value="4">Class 4</MenuItem>
                <MenuItem value="5">Class 5</MenuItem>
                <MenuItem value="6">Class 6</MenuItem>
                <MenuItem value="7">Class 7</MenuItem>
                <MenuItem value="8">Class 8</MenuItem>
                <MenuItem value="9">Class 9</MenuItem>
                <MenuItem value="10">Class 10</MenuItem>
                <MenuItem value="11">Class 11</MenuItem>
                <MenuItem value="12">Class 12</MenuItem>
                <MenuItem value="College">College</MenuItem>
                <MenuItem value="University">University</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpload}>Cancel</Button>
          <Button 
            onClick={handleConfirmUpload} 
            variant="contained"
            disabled={!uploadMetadata.subject || (uploadMetadata.subject === 'Other' && !uploadMetadata.customSubject)}
          >
            Add to Library
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Library;
