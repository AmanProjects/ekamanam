/**
 * Learning Hubs List - v10.6.0
 * 
 * NotebookLM-inspired clean interface for managing Learning Hubs
 * Shows all hubs, allows creating new ones, displays stats
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Menu,
  MenuItem,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderIcon,
  ArrowBack as BackIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import learningHubService from '../services/learningHubService';
import libraryService from '../services/libraryService';

// Hub icon options
const HUB_ICONS = ['📚', '🎓', '🔬', '📖', '💡', '🎯', '🚀', '⚡', '🌟', '🧠'];
const HUB_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#FF5722', '#3F51B5'];

// Sample hubs for free users
const SAMPLE_HUBS = [
  {
    id: 'sample-geometry',
    name: 'Geometry Fundamentals',
    description: 'Learn coordinate geometry with sample materials',
    icon: '📐',
    color: '#2196F3',
    pdfIds: ['sample-coordinate-geometry'],
    isSample: true,
    pdfCount: 1,
    lastAccessed: Date.now()
  },
  {
    id: 'sample-history',
    name: 'Indian History',
    description: 'Explore freedom movement in Hyderabad',
    icon: '📜',
    color: '#FF9800',
    pdfIds: ['sample-freedom-movement'],
    isSample: true,
    pdfCount: 1,
    lastAccessed: Date.now()
  }
];

function LearningHubsList({ onBack, onOpenHub, user, subscription, onUpgrade }) {
  const [hubs, setHubs] = useState([]);
  const [allPdfs, setAllPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHub, setEditingHub] = useState(null);
  const [hubForm, setHubForm] = useState({ name: '', description: '', icon: '📚', color: '#2196F3', pdfIds: [] });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);
  const [showPdfSelector, setShowPdfSelector] = useState(false); // v10.6.2: PDF selection dialog
  
  // Check if user is free tier
  const isFreeUser = subscription && !subscription.isPaid;

  useEffect(() => {
    loadData();
    // Fix missing page counts in background
    fixPageCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription]); // Re-load when subscription changes

  const fixPageCounts = async () => {
    try {
      console.log('🔧 Checking for PDFs with missing page counts...');
      const result = await libraryService.fixMissingPageCounts();
      if (result.success && result.fixed > 0) {
        console.log(`✅ Fixed ${result.fixed} PDFs`);
        // Reload data to show updated page counts
        loadData();
      }
    } catch (error) {
      console.error('⚠️ Error fixing page counts:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedHubs, loadedPdfs] = await Promise.all([
        learningHubService.getAllLearningHubs(),
        libraryService.getAllLibraryItems()
      ]);
      
      // For free users, only show sample hubs
      console.log('🔍 Subscription status:', { subscription, isFreeUser, isPaid: subscription?.isPaid });
      if (isFreeUser) {
        console.log('✅ Loading sample hubs for free user');
        setHubs(SAMPLE_HUBS);
      } else {
        console.log('✅ Loading user hubs:', loadedHubs.length);
        setHubs(loadedHubs);
      }
      setAllPdfs(loadedPdfs);
    } catch (error) {
      console.error('❌ Failed to load hubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHub = async () => {
    if (!hubForm.name.trim()) {
      alert('Please enter a hub name');
      return;
    }

    try {
      await learningHubService.createLearningHub(hubForm);
      setCreateDialogOpen(false);
      setHubForm({ name: '', description: '', icon: '📚', color: '#2196F3', pdfIds: [] });
      loadData();
    } catch (error) {
      console.error('❌ Failed to create hub:', error);
      alert('Failed to create Learning Hub');
    }
  };

  const handleEditHub = async () => {
    if (!hubForm.name.trim()) {
      alert('Please enter a hub name');
      return;
    }

    try {
      await learningHubService.updateLearningHub(editingHub.id, hubForm);
      setEditDialogOpen(false);
      setEditingHub(null);
      setHubForm({ name: '', description: '', icon: '📚', color: '#2196F3', pdfIds: [] });
      loadData();
    } catch (error) {
      console.error('❌ Failed to update hub:', error);
      alert('Failed to update Learning Hub');
    }
  };

  const handleDeleteHub = async (hubId) => {
    if (!window.confirm('Delete this Learning Hub? (PDFs will not be deleted)')) return;

    try {
      await learningHubService.deleteLearningHub(hubId);
      loadData();
    } catch (error) {
      console.error('❌ Failed to delete hub:', error);
      alert('Failed to delete Learning Hub');
    }
  };

  const openEditDialog = (hub) => {
    setEditingHub(hub);
    setHubForm({
      name: hub.name,
      description: hub.description,
      icon: hub.icon,
      color: hub.color,
      pdfIds: hub.pdfIds || []
    });
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };
  
  const togglePdfSelection = (pdfId) => {
    setHubForm(prev => ({
      ...prev,
      pdfIds: prev.pdfIds.includes(pdfId)
        ? prev.pdfIds.filter(id => id !== pdfId)
        : [...prev.pdfIds, pdfId]
    }));
  };

  const handleMenuOpen = (event, hub) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedHub(hub);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedHub(null);
  };

  // Get stats for a hub
  const getHubStats = (hub) => {
    return learningHubService.getHubStats(hub, allPdfs);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between', 
            mb: 1.5,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton onClick={onBack} sx={{ bgcolor: 'background.paper' }} size="small">
                <BackIcon />
              </IconButton>
              <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {isFreeUser ? 'Sample Learning Hubs' : 'My Learning Hubs'}
              </Typography>
              {isFreeUser && (
                <Chip
                  label="Free Preview"
                  size="small"
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => isFreeUser ? onUpgrade() : setCreateDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: 1,
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {isFreeUser ? (
                <>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Upgrade to Create Hubs</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Upgrade</Box>
                </>
              ) : (
                <>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Create New Hub</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>New Hub</Box>
                </>
              )}
            </Button>
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              maxWidth: '800px'
            }}
          >
            {isFreeUser 
              ? 'Explore these sample hubs and experience the power of organized learning. Upgrade to create unlimited personalized Learning Hubs!'
              : 'Organize your study materials into focused Learning Hubs. Group related PDFs together for efficient, structured learning.'
            }
          </Typography>
        </Box>

        {/* Empty State */}
        {!loading && hubs.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 5, sm: 8 },
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.paper',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <FolderIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
            <Typography 
              variant="h5" 
              fontWeight={600} 
              gutterBottom 
              sx={{ fontSize: '1.375rem', mb: 1.5 }}
            >
              Start Your Learning Journey
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 4, 
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                px: { xs: 0, sm: 4 }
              }}
            >
              Create your first Learning Hub to group related study materials together. 
              Organize PDFs by subject, topic, or course for a structured learning experience.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                px: 4,
                py: 1.25,
                fontSize: '0.9375rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Create Your First Hub
            </Button>
          </Paper>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <Grid container spacing={{ xs: 2, sm: 2.5 }}>
            {[1, 2, 3, 4].map((n) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2.5
                  }}
                >
                  <CardContent sx={{ p: 2.5, pt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 1.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="70%" height={24} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="90%" height={20} />
                        <Skeleton variant="text" width="85%" height={20} />
                      </Box>
                    </Box>
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
                        <Skeleton variant="rounded" width={60} height={24} />
                        <Skeleton variant="rounded" width={70} height={24} />
                      </Box>
                      <Skeleton variant="rounded" width="100%" height={40} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Hubs Grid */}
        {!loading && hubs.length > 0 && (
          <Grid container spacing={{ xs: 2, sm: 2.5 }}>
            {hubs.map((hub) => {
              const stats = getHubStats(hub);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={hub.id}>
                  <Card
                    elevation={0}
                    onClick={() => onOpenHub(hub)}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2.5,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: (theme) => theme.palette.mode === 'dark' 
                          ? '0 8px 24px rgba(0,0,0,0.4)' 
                          : '0 8px 24px rgba(0,0,0,0.12)',
                        transform: 'translateY(-4px)',
                        '& .hub-open-button': {
                          bgcolor: 'primary.dark'
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        bgcolor: hub.color,
                        opacity: 0.8
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5, pt: 3 }}>
                      {/* Hub Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: hub.color,
                            width: 48,
                            height: 48,
                            fontSize: '1.5rem',
                            mr: 1.5,
                            boxShadow: (theme) => theme.palette.mode === 'dark'
                              ? '0 2px 8px rgba(0,0,0,0.3)'
                              : '0 2px 8px rgba(0,0,0,0.08)'
                          }}
                        >
                          {hub.icon}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                              fontSize: '1rem',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              mb: 0.5,
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {hub.name}
                          </Typography>
                          {hub.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.8125rem',
                                lineHeight: 1.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {hub.description}
                            </Typography>
                          )}
                        </Box>
                        {/* Only show menu for non-sample hubs */}
                        {!hub.isSample && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, hub);
                            }}
                            sx={{ 
                              ml: 0.5,
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      {/* Stats */}
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={`${stats.pdfCount} ${stats.pdfCount === 1 ? 'PDF' : 'PDFs'}`}
                            size="small"
                            sx={{ 
                              bgcolor: 'action.hover', 
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                          <Chip
                            label={`${stats.totalPages || 0} pages`}
                            size="small"
                            sx={{ 
                              bgcolor: 'action.hover', 
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                          {hub.isSample && (
                            <Chip
                              label="Sample"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24
                              }}
                            />
                          )}
                        </Box>
                        {stats.pdfCount > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                                Progress
                              </Typography>
                              <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.6875rem' }}>
                                {stats.avgProgress}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={stats.avgProgress}
                              sx={{ height: 5, borderRadius: 1 }}
                            />
                          </Box>
                        )}
                        
                        {/* v10.6.3: Open Hub Button */}
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenHub(hub);
                          }}
                          size="medium"
                          className="hub-open-button"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            py: 1,
                            boxShadow: 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 2
                            }
                          }}
                        >
                          Open Hub
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography color="text.secondary">Loading your Learning Hubs...</Typography>
          </Box>
        )}
      </Container>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { openEditDialog(selectedHub); }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Hub
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteHub(selectedHub.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Hub
        </MenuItem>
      </Menu>

      {/* Create Hub Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Create New Learning Hub</DialogTitle>
        <DialogContent sx={{ pb: { xs: 1, sm: 2 } }}>
          <TextField
            autoFocus
            label="Hub Name"
            fullWidth
            value={hubForm.name}
            onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            placeholder="e.g., Physics - Class 12"
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={hubForm.description}
            onChange={(e) => setHubForm({ ...hubForm, description: e.target.value })}
            sx={{ mb: 3 }}
            placeholder="Brief description of what you'll study in this hub"
          />
          
          {/* Icon Selection */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
            Choose an Icon
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, mb: 3, flexWrap: 'wrap' }}>
            {HUB_ICONS.map((icon) => (
              <IconButton
                key={icon}
                onClick={() => setHubForm({ ...hubForm, icon })}
                sx={{
                  border: hubForm.icon === icon ? '2px solid' : '1px solid',
                  borderColor: hubForm.icon === icon ? 'primary.main' : 'divider',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  width: { xs: 42, sm: 48 },
                  height: { xs: 42, sm: 48 }
                }}
              >
                {icon}
              </IconButton>
            ))}
          </Box>

          {/* Color Selection */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
            Choose a Color
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, mb: 3, flexWrap: 'wrap' }}>
            {HUB_COLORS.map((color) => (
              <IconButton
                key={color}
                onClick={() => setHubForm({ ...hubForm, color })}
                sx={{
                  bgcolor: color,
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  border: hubForm.color === color ? '3px solid black' : 'none',
                  '&:hover': { bgcolor: color, opacity: 0.8 }
                }}
              >
                {hubForm.color === color && '✓'}
              </IconButton>
            ))}
          </Box>

          {/* PDF Selection */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
            Add PDFs to Hub (optional)
          </Typography>
          <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
            {allPdfs.length > 0 ? (
              <List dense>
                {allPdfs.map((pdf) => (
                  <ListItem
                    key={pdf.id}
                    button
                    onClick={() => togglePdfSelection(pdf.id)}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                      <IconButton size="small" sx={{ pointerEvents: 'none' }}>
                        {hubForm.pdfIds.includes(pdf.id) ? (
                          <CheckBoxIcon color="primary" />
                        ) : (
                          <CheckBoxOutlineBlankIcon />
                        )}
                      </IconButton>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pdf.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pdf.totalPages || pdf.pageCount || pdf.numPages || '?'} pages
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No PDFs in library yet. Add some from My Library first!
                </Typography>
              </Box>
            )}
          </Paper>
          {hubForm.pdfIds.length > 0 && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
              ✓ {hubForm.pdfIds.length} PDF{hubForm.pdfIds.length !== 1 ? 's' : ''} selected
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateHub}>
            Create Hub
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Hub Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Edit Learning Hub</DialogTitle>
        <DialogContent sx={{ pb: { xs: 1, sm: 2 } }}>
          <TextField
            autoFocus
            label="Hub Name"
            fullWidth
            value={hubForm.name}
            onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={hubForm.description}
            onChange={(e) => setHubForm({ ...hubForm, description: e.target.value })}
            sx={{ mb: 3 }}
          />
          
          {/* Icon Selection */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
            Choose an Icon
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, mb: 3, flexWrap: 'wrap' }}>
            {HUB_ICONS.map((icon) => (
              <IconButton
                key={icon}
                onClick={() => setHubForm({ ...hubForm, icon })}
                sx={{
                  border: hubForm.icon === icon ? '2px solid' : '1px solid',
                  borderColor: hubForm.icon === icon ? 'primary.main' : 'divider',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  width: { xs: 42, sm: 48 },
                  height: { xs: 42, sm: 48 }
                }}
              >
                {icon}
              </IconButton>
            ))}
          </Box>

          {/* Color Selection */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
            Choose a Color
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, mb: 3, flexWrap: 'wrap' }}>
            {HUB_COLORS.map((color) => (
              <IconButton
                key={color}
                onClick={() => setHubForm({ ...hubForm, color })}
                sx={{
                  bgcolor: color,
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  border: hubForm.color === color ? '3px solid black' : 'none',
                  '&:hover': { bgcolor: color, opacity: 0.8 }
                }}
              >
                {hubForm.color === color && '✓'}
              </IconButton>
            ))}
          </Box>

          {/* PDF Selection */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
            Manage PDFs in Hub
          </Typography>
          <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
            {allPdfs.length > 0 ? (
              <List dense>
                {allPdfs.map((pdf) => (
                  <ListItem
                    key={pdf.id}
                    button
                    onClick={() => togglePdfSelection(pdf.id)}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                      <IconButton size="small" sx={{ pointerEvents: 'none' }}>
                        {hubForm.pdfIds.includes(pdf.id) ? (
                          <CheckBoxIcon color="primary" />
                        ) : (
                          <CheckBoxOutlineBlankIcon />
                        )}
                      </IconButton>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pdf.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pdf.totalPages || pdf.pageCount || pdf.numPages || '?'} pages
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No PDFs in library yet
                </Typography>
              </Box>
            )}
          </Paper>
          {hubForm.pdfIds.length > 0 && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
              ✓ {hubForm.pdfIds.length} PDF{hubForm.pdfIds.length !== 1 ? 's' : ''} selected
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditHub}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LearningHubsList;

