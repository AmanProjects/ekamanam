import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CardMedia,
  Button,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Search,
  LocalLibrary,
  ExpandMore,
  CloudDownload,
  MenuBook as SampleIcon
} from '@mui/icons-material';
import libraryService from '../services/libraryService';

function StudentLibrary({ onBack, onOpenPdf, onOpenSamplePDF }) {
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
    } finally {
      setLoading(false);
    }
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pdf.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pdf.collection?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper functions
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatLastAccessed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Calculate stats
  const totalPdfs = pdfs.length;
  const uniqueSubjects = [...new Set(pdfs.map(p => p.subject).filter(Boolean))];
  const uniqueClasses = [...new Set(pdfs.map(p => p.class).filter(Boolean))];
  const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);

  // Group PDFs by collection
  const groupedPdfs = pdfs.reduce((groups, pdf) => {
    const collection = pdf.collection || 'Uncategorized';
    if (!groups[collection]) {
      groups[collection] = [];
    }
    groups[collection].push(pdf);
    return groups;
  }, {});

  // Sort collections and PDFs within each collection
  const sortedCollections = Object.keys(groupedPdfs).sort();
  sortedCollections.forEach(collection => {
    groupedPdfs[collection].sort((a, b) => {
      const chapterA = a.chapter || 0;
      const chapterB = b.chapter || 0;
      return chapterA - chapterB;
    });
  });

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Loading your library...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} color="primary">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            My Library
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="h6" fontWeight={600}>{totalPdfs}</Typography>
            <Typography variant="caption" color="text.secondary">PDFs</Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item>
            <Typography variant="h6" fontWeight={600}>{uniqueSubjects.length}</Typography>
            <Typography variant="caption" color="text.secondary">Subjects</Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item>
            <Typography variant="h6" fontWeight={600}>{uniqueClasses.length}</Typography>
            <Typography variant="caption" color="text.secondary">Classes</Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item>
            <Typography variant="h6" fontWeight={600}>{totalPages}</Typography>
            <Typography variant="caption" color="text.secondary">Total Pages</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by title, subject, or collection..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {/* Sample PDFs Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SampleIcon sx={{ color: 'success.main' }} />
          Sample PDFs
          <Chip label="Try Features" size="small" color="success" sx={{ ml: 1 }} />
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '2px dashed',
                borderColor: 'success.main',
                borderRadius: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'success.lighter',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '100%',
                '&:hover': {
                  borderColor: 'success.dark',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => onOpenSamplePDF && onOpenSamplePDF('coordinate-geometry')}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <SampleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="success.dark">
                    Coordinate Geometry
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Mathematics • Class 10
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                Learn about points, lines, and coordinate systems with AI explanations
              </Typography>
              <Chip label="Math" size="small" sx={{ mr: 0.5 }} />
              <Chip label="English" size="small" />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '2px dashed',
                borderColor: 'info.main',
                borderRadius: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'info.lighter',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '100%',
                '&:hover': {
                  borderColor: 'info.dark',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => onOpenSamplePDF && onOpenSamplePDF('freedom-movement')}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <SampleIcon sx={{ fontSize: 32, color: 'info.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="info.dark">
                    Freedom Movement in Hyderabad
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Social Studies • Class 8
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                Explore Indian history with multilingual support and voice features
              </Typography>
              <Chip label="History" size="small" sx={{ mr: 0.5 }} />
              <Chip label="Telugu" size="small" />
            </Paper>
          </Grid>
        </Grid>
        <Divider sx={{ mt: 4, mb: 3 }} />
      </Box>

      {/* PDF Collections */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
        {sortedCollections.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <LocalLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No PDFs in library
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contact your administrator to add learning materials
            </Typography>
          </Paper>
        ) : (
          sortedCollections.map(collection => (
            <Accordion key={collection} defaultExpanded={sortedCollections.length === 1}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {groupedPdfs[collection][0]?.coverImage && (
                    <CardMedia
                      component="img"
                      src={groupedPdfs[collection][0].coverImage}
                      alt={collection}
                      sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {collection}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {groupedPdfs[collection].length} PDFs • {groupedPdfs[collection].reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0)} pages
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                {groupedPdfs[collection]
                  .filter(pdf =>
                    pdf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    pdf.subject?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(pdf => (
                    <Paper
                      key={pdf.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      {/* Thumbnail */}
                      <CardMedia
                        component="img"
                        src={pdf.thumbnailUrl || pdf.coverImage || '/placeholder.png'}
                        alt={pdf.name}
                        sx={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 1 }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="80"%3E%3Crect fill="%23e0e0e0" width="60" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="24"%3E📄%3C/text%3E%3C/svg%3E';
                        }}
                      />

                      {/* Info */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {pdf.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          {pdf.subject && <Chip label={pdf.subject} size="small" color="primary" variant="outlined" />}
                          {pdf.class && <Chip label={`Class ${pdf.class}`} size="small" color="secondary" variant="outlined" />}
                          <Chip label={`${pdf.totalPages || 0} pages`} size="small" variant="outlined" />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {formatSize(pdf.size)} • Last accessed: {formatLastAccessed(pdf.lastOpened)}
                        </Typography>
                        {pdf.lastPage > 1 && (
                          <LinearProgress
                            variant="determinate"
                            value={(pdf.lastPage / (pdf.totalPages || 1)) * 100}
                            sx={{ mt: 1, height: 6, borderRadius: 1 }}
                          />
                        )}
                      </Box>

                      {/* Actions */}
                      <Button
                        variant="contained"
                        startIcon={<CloudDownload />}
                        onClick={() => onOpenPdf(pdf)}
                      >
                        Open
                      </Button>
                    </Paper>
                  ))}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Container>
  );
}

export default StudentLibrary;

