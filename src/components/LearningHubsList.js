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
  ListItem
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

function LearningHubsList({ onBack, onOpenHub }) {
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

  useEffect(() => {
    loadData();
    // Fix missing page counts in background
    fixPageCounts();
  }, []);

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
      setHubs(loadedHubs);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between', 
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <IconButton onClick={onBack} sx={{ bgcolor: 'white' }} size="small">
                <BackIcon />
              </IconButton>
              <Typography variant={{ xs: 'h5', sm: 'h4' }} fontWeight={600}>
                My Learning Hubs
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                boxShadow: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Create New Hub</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>New Hub</Box>
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Organize your PDFs into focused Learning Hubs for better learning
          </Typography>
        </Box>

        {/* Empty State */}
        {!loading && hubs.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 8 },
              textAlign: 'center',
              border: '2px dashed #e0e0e0',
              borderRadius: 3,
              bgcolor: 'white'
            }}
          >
            <FolderIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              No Learning Hubs Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
              Create your first Learning Hub to organize your study materials
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              Create Your First Hub
            </Button>
          </Paper>
        )}

        {/* Hubs Grid */}
        {!loading && hubs.length > 0 && (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {hubs.map((hub) => {
              const stats = getHubStats(hub);
              return (
                <Grid item xs={12} sm={6} md={4} key={hub.id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid #e0e0e0',
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      {/* Hub Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: hub.color,
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            fontSize: { xs: '1.75rem', sm: '2rem' },
                            mr: { xs: 1.5, sm: 2 }
                          }}
                        >
                          {hub.icon}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {hub.name}
                          </Typography>
                          {hub.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, hub)}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Stats */}
                      <Box sx={{ mt: { xs: 2, sm: 3 }, pt: 2, borderTop: '1px solid #f0f0f0' }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={`${stats.pdfCount} ${stats.pdfCount === 1 ? 'PDF' : 'PDFs'}`}
                            size="small"
                            sx={{ bgcolor: '#f5f5f5', fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                          />
                          <Chip
                            label={`${stats.totalPages || 0} pages`}
                            size="small"
                            sx={{ bgcolor: '#f5f5f5', fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                          />
                        </Box>
                        {stats.pdfCount > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                Progress
                              </Typography>
                              <Typography variant="caption" fontWeight={600} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                {stats.avgProgress}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={stats.avgProgress}
                              sx={{ height: { xs: 5, sm: 6 }, borderRadius: 1 }}
                            />
                          </Box>
                        )}
                        
                        {/* v10.6.3: Open Hub Button */}
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => onOpenHub(hub)}
                          size="medium"
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            py: { xs: 0.75, sm: 1 }
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
                  border: hubForm.icon === icon ? '2px solid #2196F3' : '1px solid #e0e0e0',
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
                  border: hubForm.icon === icon ? '2px solid #2196F3' : '1px solid #e0e0e0',
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

