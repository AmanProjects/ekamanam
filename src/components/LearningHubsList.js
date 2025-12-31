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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import learningHubService from '../services/learningHubService';
import libraryService from '../services/libraryService';

// Hub icon options
const HUB_ICONS = ['📚', '🎓', '🔬', '📖', '💡', '🎯', '🚀', '⚡', '🌟', '🧠'];
const HUB_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#FF5722', '#3F51B5'];

function LearningHubsList({ onBack, onOpenPdf }) {
  const [hubs, setHubs] = useState([]);
  const [allPdfs, setAllPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHub, setExpandedHub] = useState(null); // v10.6.2: Track expanded hub
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHub, setEditingHub] = useState(null);
  const [hubForm, setHubForm] = useState({ name: '', description: '', icon: '📚', color: '#2196F3', pdfIds: [] });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);
  const [showPdfSelector, setShowPdfSelector] = useState(false); // v10.6.2: PDF selection dialog

  useEffect(() => {
    loadData();
  }, []);

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={onBack} sx={{ bgcolor: 'white' }}>
                <BackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={600}>
                My Learning Hubs
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: 2
              }}
            >
              Create New Hub
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Organize your PDFs into focused Learning Hubs for better learning
          </Typography>
        </Box>

        {/* Empty State */}
        {!loading && hubs.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              border: '2px dashed #e0e0e0',
              borderRadius: 3,
              bgcolor: 'white'
            }}
          >
            <FolderIcon sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Learning Hubs Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first Learning Hub to organize your study materials
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
            >
              Create Your First Hub
            </Button>
          </Paper>
        )}

        {/* Hubs Grid */}
        {!loading && hubs.length > 0 && (
          <Grid container spacing={3}>
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
                    <CardActionArea onClick={() => setExpandedHub(expandedHub === hub.id ? null : hub.id)}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Hub Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: hub.color,
                              width: 56,
                              height: 56,
                              fontSize: '2rem',
                              mr: 2
                            }}
                          >
                            {hub.icon}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              sx={{
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
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {expandedHub === hub.id ? (
                              <ExpandLessIcon sx={{ color: 'action.active' }} />
                            ) : (
                              <ExpandMoreIcon sx={{ color: 'action.active' }} />
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, hub)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Stats */}
                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f0f0f0' }}>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Chip
                              label={`${stats.pdfCount} ${stats.pdfCount === 1 ? 'PDF' : 'PDFs'}`}
                              size="small"
                              sx={{ bgcolor: '#f5f5f5' }}
                            />
                            <Chip
                              label={`${stats.totalPages} pages`}
                              size="small"
                              sx={{ bgcolor: '#f5f5f5' }}
                            />
                          </Box>
                          {stats.pdfCount > 0 && (
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="caption" fontWeight={600}>
                                  {stats.avgProgress}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={stats.avgProgress}
                                sx={{ height: 6, borderRadius: 1 }}
                              />
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                    
                    {/* v10.6.2: Expanded PDFs list */}
                    {expandedHub === hub.id && (
                      <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #f0f0f0' }}>
                        {stats.pdfs.length > 0 ? (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Click a PDF to start learning:
                            </Typography>
                            {stats.pdfs.map((pdf) => (
                              <Paper
                                key={pdf.id}
                                elevation={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenPdf(pdf, hub);
                                }}
                                sx={{
                                  p: 1.5,
                                  mb: 1,
                                  cursor: 'pointer',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: '#f5f5f5',
                                    transform: 'translateX(4px)'
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">📄</Typography>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {pdf.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {pdf.totalPages} pages • {pdf.progress}% complete
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            ))}
                          </>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              📭 This hub is empty
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                              Add PDFs to this hub from My Library
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('To add PDFs to this hub:\n\n1. Go back to Dashboard\n2. Click "My Library"\n3. Open any PDF\n4. The PDF will automatically be available to add to hubs\n\nFull "Add PDFs to Hub" feature coming in next update!');
                              }}
                            >
                              How to Add PDFs
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
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
      >
        <DialogTitle>Create New Learning Hub</DialogTitle>
        <DialogContent>
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
          <Typography variant="subtitle2" gutterBottom>
            Choose an Icon
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {HUB_ICONS.map((icon) => (
              <IconButton
                key={icon}
                onClick={() => setHubForm({ ...hubForm, icon })}
                sx={{
                  border: hubForm.icon === icon ? '2px solid #2196F3' : '1px solid #e0e0e0',
                  fontSize: '1.5rem',
                  width: 48,
                  height: 48
                }}
              >
                {icon}
              </IconButton>
            ))}
          </Box>

          {/* Color Selection */}
          <Typography variant="subtitle2" gutterBottom>
            Choose a Color
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            {HUB_COLORS.map((color) => (
              <IconButton
                key={color}
                onClick={() => setHubForm({ ...hubForm, color })}
                sx={{
                  bgcolor: color,
                  width: 40,
                  height: 40,
                  border: hubForm.color === color ? '3px solid black' : 'none',
                  '&:hover': { bgcolor: color, opacity: 0.8 }
                }}
              >
                {hubForm.color === color && '✓'}
              </IconButton>
            ))}
          </Box>

          {/* PDF Selection */}
          <Typography variant="subtitle2" gutterBottom>
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
                        {pdf.totalPages} pages
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
      >
        <DialogTitle>Edit Learning Hub</DialogTitle>
        <DialogContent>
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
          <Typography variant="subtitle2" gutterBottom>
            Choose an Icon
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {HUB_ICONS.map((icon) => (
              <IconButton
                key={icon}
                onClick={() => setHubForm({ ...hubForm, icon })}
                sx={{
                  border: hubForm.icon === icon ? '2px solid #2196F3' : '1px solid #e0e0e0',
                  fontSize: '1.5rem',
                  width: 48,
                  height: 48
                }}
              >
                {icon}
              </IconButton>
            ))}
          </Box>

          {/* Color Selection */}
          <Typography variant="subtitle2" gutterBottom>
            Choose a Color
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            {HUB_COLORS.map((color) => (
              <IconButton
                key={color}
                onClick={() => setHubForm({ ...hubForm, color })}
                sx={{
                  bgcolor: color,
                  width: 40,
                  height: 40,
                  border: hubForm.color === color ? '3px solid black' : 'none',
                  '&:hover': { bgcolor: color, opacity: 0.8 }
                }}
              >
                {hubForm.color === color && '✓'}
              </IconButton>
            ))}
          </Box>

          {/* PDF Selection */}
          <Typography variant="subtitle2" gutterBottom>
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
                        {pdf.totalPages} pages
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

