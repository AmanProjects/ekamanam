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
  Stack,
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
  LocalLibrary,
  ExpandMore,
  CloudDownload,
  MenuBook as SampleIcon,
  TrendingUp as StatsIcon,
  Edit as EditIcon
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

// v7.2.25: Educational level options
const EDUCATION_LEVELS = [
  { value: '', label: 'Not specified' },
  { value: '1', label: 'Class 1' },
  { value: '2', label: 'Class 2' },
  { value: '3', label: 'Class 3' },
  { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11 / Jr. College' },
  { value: '12', label: 'Class 12 / Sr. College' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'B.Tech', label: 'B.Tech / B.E.' },
  { value: 'M.Tech', label: 'M.Tech / M.E.' },
  { value: 'University', label: 'University (Other)' }
];

const SUBJECTS = [
  { value: '', label: 'Not specified' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Science', label: 'Science' },
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Social Science', label: 'Social Science' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Electrical', label: 'Electrical Engineering' },
  { value: 'Mechanical', label: 'Mechanical Engineering' },
  { value: 'Civil', label: 'Civil Engineering' },
  { value: 'Digital Electronics', label: 'Digital Electronics' },
  { value: 'Circuit Theory', label: 'Circuit Theory' },
  { value: 'Other', label: 'Other' }
];

function StudentLibrary({ onBack, onOpenPdf, onOpenSamplePDF }) {
  const [pdfs, setPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // v7.2.25: Edit metadata dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState(null);
  const [editForm, setEditForm] = useState({ class: '', subject: '', collection: '' });
  const [saving, setSaving] = useState(false);

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

  // v7.2.25: Handle edit metadata
  const handleEditClick = (e, pdf) => {
    e.stopPropagation(); // Prevent opening PDF
    setEditingPdf(pdf);
    setEditForm({
      class: pdf.class || '',
      subject: pdf.subject || '',
      collection: pdf.collection || pdf.name || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveMetadata = async () => {
    if (!editingPdf) return;
    
    // v7.2.26: Prevent editing sample PDFs
    if (editingPdf.type === 'sample' || editingPdf.id?.startsWith('sample-')) {
      alert('Sample PDFs cannot be edited. Please upload your own PDF to customize metadata.');
      setEditDialogOpen(false);
      return;
    }
    
    setSaving(true);
    try {
      await libraryService.updateLibraryItem(editingPdf.id, {
        class: editForm.class,
        subject: editForm.subject,
        collection: editForm.collection
      });
      
      // Refresh library
      await loadLibrary();
      setEditDialogOpen(false);
      setEditingPdf(null);
      console.log('✅ PDF metadata updated successfully');
    } catch (error) {
      console.error('❌ Failed to update metadata:', error);
      // v7.2.26: More specific error message
      if (error.message?.includes('not found')) {
        alert('This PDF was not found in your library. It may have been deleted or is a sample PDF.');
      } else {
        alert('Failed to update metadata. Please make sure you are signed in and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // v7.2.26: Filter out sample PDFs from My PDFs tab - they should only show in Samples tab
  const userPdfs = pdfs.filter(pdf => pdf.type !== 'sample' && !pdf.id?.startsWith('sample-'));
  
  const filteredPdfs = userPdfs.filter(pdf =>
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
  // v7.2.26: Stats should only count user PDFs, not samples
  const totalPdfs = userPdfs.length;
  const uniqueSubjects = [...new Set(userPdfs.map(p => p.subject).filter(Boolean))];
  const uniqueClasses = [...new Set(userPdfs.map(p => p.class).filter(Boolean))];
  const totalPages = userPdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);

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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom noWrap sx={{ flex: 1 }}>
                                {pdf.chapter ? `Ch ${pdf.chapter}: ` : ''}{pdf.name}
                              </Typography>
                              {/* v7.2.26: Only show edit button for user PDFs, not samples */}
                              {pdf.type !== 'sample' && !pdf.id?.startsWith('sample-') && (
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleEditClick(e, pdf)}
                                  sx={{ 
                                    ml: 0.5, 
                                    mt: -0.5,
                                    opacity: 0.6,
                                    '&:hover': { opacity: 1, bgcolor: 'primary.light' }
                                  }}
                                  title="Edit metadata"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {pdf.subject && pdf.class ? `${pdf.subject} • Class ${pdf.class}` : pdf.subject || (pdf.class ? `Class ${pdf.class}` : 'No category')}
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

      {/* v7.2.25: Edit Metadata Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit PDF Metadata
          {editingPdf && (
            <Typography variant="body2" color="text.secondary">
              {editingPdf.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Educational Level / Class</InputLabel>
              <Select
                value={editForm.class}
                label="Educational Level / Class"
                onChange={(e) => setEditForm(prev => ({ ...prev, class: e.target.value }))}
              >
                {EDUCATION_LEVELS.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={editForm.subject}
                label="Subject"
                onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
              >
                {SUBJECTS.map(subject => (
                  <MenuItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Book / Collection Name"
              value={editForm.collection}
              onChange={(e) => setEditForm(prev => ({ ...prev, collection: e.target.value }))}
              helperText="Group related PDFs under a common book name"
            />

            <Paper sx={{ p: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" color="info.dark">
                <strong>Why set educational level?</strong><br />
                The AI adapts its explanations based on your level. University/Engineering students get more detailed, technical responses with derivations and theory.
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveMetadata}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentLibrary;
