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
  CircularProgress,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Search,
  LocalLibrary,
  ExpandMore,
  CloudDownload,
  MenuBook as SampleIcon,
  TrendingUp as StatsIcon
} from '@mui/icons-material';
import libraryService from '../services/libraryService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`library-tabpanel-${index}`}
      aria-labelledby={`library-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function StudentLibrary({ onBack, onOpenPdf, onOpenSamplePDF }) {
  const [pdfs, setPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

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
  const groupedPdfs = filteredPdfs.reduce((groups, pdf) => {
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography variant="body2" sx={{ mt: 2 }}>Loading your library...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Compact Header */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onBack} size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={600}>
              My Library
            </Typography>
            {totalPdfs > 0 && (
              <Chip label={`${totalPdfs} PDFs`} size="small" />
            )}
          </Box>
          
          {/* Compact Stats */}
          <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Subjects</Typography>
              <Typography variant="body2" fontWeight={600}>{uniqueSubjects.length}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Classes</Typography>
              <Typography variant="body2" fontWeight={600}>{uniqueClasses.length}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Pages</Typography>
              <Typography variant="body2" fontWeight={600}>{totalPages}</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Search & Tabs */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by title, subject, or collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ minHeight: 40 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalLibrary fontSize="small" />
                  My PDFs
                </Box>
              }
              sx={{ minHeight: 40, py: 1 }}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SampleIcon fontSize="small" />
                  Samples
                  <Chip label="2" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
              }
              sx={{ minHeight: 40, py: 1 }}
            />
          </Tabs>
        </Box>
      </Paper>

      {/* Tab Content - Scrollable */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* My PDFs Tab */}
        <TabPanel value={activeTab} index={0}>
          <Container maxWidth="xl" sx={{ height: 'calc(100vh - 240px)', overflowY: 'auto' }}>
            {sortedCollections.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', mt: 4 }}>
                <LocalLibrary sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No PDFs in library yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Try our sample PDFs to explore features
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setActiveTab(1)}
                  startIcon={<SampleIcon />}
                >
                  View Sample PDFs
                </Button>
              </Paper>
            ) : (
              sortedCollections.map(collection => (
                <Accordion 
                  key={collection} 
                  defaultExpanded={sortedCollections.length === 1}
                  sx={{ mb: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{ bgcolor: 'action.hover' }}
                  >
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
                        <Typography variant="subtitle1" fontWeight={600}>
                          {collection}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {groupedPdfs[collection].length} PDF{groupedPdfs[collection].length > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {groupedPdfs[collection].map(pdf => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={pdf.id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              height: '100%',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: 2,
                                transform: 'translateY(-2px)'
                              }
                            }}
                            onClick={() => onOpenPdf(pdf)}
                          >
                            {pdf.coverImage && (
                              <CardMedia
                                component="img"
                                src={pdf.coverImage}
                                alt={pdf.name}
                                sx={{
                                  width: '100%',
                                  height: 120,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  mb: 1.5,
                                  bgcolor: 'action.hover'
                                }}
                              />
                            )}
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom noWrap>
                              {pdf.chapter ? `Ch ${pdf.chapter}: ` : ''}{pdf.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {pdf.subject && pdf.class ? `${pdf.subject} • Class ${pdf.class}` : pdf.subject || pdf.class || 'No category'}
                            </Typography>
                            
                            {pdf.lastAccessed && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(pdf.lastPage || 0) / (pdf.totalPages || 1) * 100}
                                  sx={{ height: 4, borderRadius: 1, mb: 0.5 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Page {pdf.lastPage || 1} of {pdf.totalPages || '?'} • {formatLastAccessed(pdf.lastAccessed)}
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Container>
        </TabPanel>

        {/* Samples Tab */}
        <TabPanel value={activeTab} index={1}>
          <Container maxWidth="lg" sx={{ height: 'calc(100vh - 240px)', overflowY: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Try our sample PDFs to explore all features without uploading your own files
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: 2,
                    borderColor: 'success.main',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    height: '100%',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)'
                    }
                  }}
                  onClick={() => onOpenSamplePDF && onOpenSamplePDF('coordinate-geometry')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'success.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <SampleIcon sx={{ fontSize: 28, color: 'success.main' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Coordinate Geometry
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Mathematics • Class 10
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        <Chip label="Math" size="small" />
                        <Chip label="English" size="small" />
                      </Stack>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Learn about points, lines, and coordinate systems with AI explanations, 3D visualizations, and practice problems.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                  >
                    Open Sample
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: 2,
                    borderColor: 'info.main',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    height: '100%',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)'
                    }
                  }}
                  onClick={() => onOpenSamplePDF && onOpenSamplePDF('freedom-movement')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'info.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <SampleIcon sx={{ fontSize: 28, color: 'info.main' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Freedom Movement in Hyderabad
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Social Studies • Class 8
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        <Chip label="History" size="small" />
                        <Chip label="Telugu" size="small" />
                      </Stack>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Explore Indian history with multilingual support, voice features, and comprehensive study materials.
                  </Typography>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    size="large"
                  >
                    Open Sample
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </TabPanel>
      </Box>
    </Box>
  );
}

export default StudentLibrary;
