/**
 * Experiment Library
 * 
 * Global "My Experiments" library showing all saved experiments
 * across all labs (Physics, Chemistry, Math, Code, Globe).
 * 
 * Features:
 * - Browse all experiments
 * - Filter by lab
 * - Search by title/tags
 * - Download JSON (share with friends)
 * - Upload JSON (import from friends)
 * - Open in respective lab
 * - Delete experiments
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Science as PhysicsIcon,
  Biotech as ChemistryIcon,
  Calculate as MathIcon,
  Code as CodeIcon,
  Public as GlobeIcon,
  PlayArrow as OpenIcon,
  CloudDownload as CloudDownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import experimentService from '../services/experimentService';
import { LAB_TYPES } from '../schemas/experimentSchema';

function ExperimentLibrary({ open, onClose, user, onOpenExperiment }) {
  const [experiments, setExperiments] = useState([]);
  const [filteredExperiments, setFilteredExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 = All, 1 = Physics, etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Load experiments on mount
  useEffect(() => {
    if (open) {
      loadExperiments();
    }
  }, [open]);

  // Filter experiments when tab or search changes
  useEffect(() => {
    filterExperiments();
  }, [experiments, activeTab, searchQuery]);

  const loadExperiments = async () => {
    setLoading(true);
    const result = await experimentService.getAllExperiments();
    const statsResult = await experimentService.getExperimentStats();
    
    if (result.success) {
      setExperiments(result.experiments);
      setStats(statsResult.stats);
    }
    setLoading(false);
  };

  const filterExperiments = () => {
    let filtered = [...experiments];

    // Filter by lab (tab)
    if (activeTab !== 0) {
      const labType = Object.values(LAB_TYPES)[activeTab - 1];
      filtered = filtered.filter(exp => exp.metadata.lab === labType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.metadata.title.toLowerCase().includes(query) ||
        exp.metadata.description?.toLowerCase().includes(query) ||
        exp.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredExperiments(filtered);
  };

  const handleDownload = async (experimentId) => {
    const result = await experimentService.downloadExperiment(experimentId);
    if (result.success) {
      setMessage({ type: 'success', text: `Downloaded ${result.filename}!` });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const result = await experimentService.uploadExperiment(file, user?.uid);
    
    if (result.success) {
      setMessage({ type: 'success', text: `Imported "${result.experiment.metadata.title}"!` });
      loadExperiments(); // Refresh list
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    
    setUploading(false);
    event.target.value = ''; // Reset input
  };

  const handleDelete = async (experimentId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    const result = await experimentService.deleteExperiment(experimentId);
    if (result.success) {
      setMessage({ type: 'success', text: `Deleted "${title}"` });
      loadExperiments(); // Refresh list
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleOpen = (experiment) => {
    if (onOpenExperiment) {
      onOpenExperiment(experiment);
      onClose();
    }
  };

  const getLabIcon = (lab) => {
    switch (lab) {
      case 'physics': return <PhysicsIcon />;
      case 'chemistry': return <ChemistryIcon />;
      case 'math': return <MathIcon />;
      case 'code': return <CodeIcon />;
      case 'globe': return <GlobeIcon />;
      default: return null;
    }
  };

  const getLabColor = (lab) => {
    switch (lab) {
      case 'physics': return '#1976d2';
      case 'chemistry': return '#4caf50';
      case 'math': return '#9c27b0';
      case 'code': return '#ff9800';
      case 'globe': return '#00bcd4';
      default: return '#757575';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      {/* Header */}
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhysicsIcon />
          <Box>
            <Typography variant="h6">My Experiments</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {stats ? `${stats.total} experiments across ${Object.values(stats.byLab).filter(c => c > 0).length} labs` : 'Loading...'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Upload Experiment JSON">
            <IconButton
              color="inherit"
              component="label"
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={24} /> : <UploadIcon />}
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleUpload}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sync from Google Drive">
            <IconButton
              color="inherit"
              onClick={async () => {
                setLoading(true);
                await experimentService.loadExperimentsFromDrive();
                loadExperiments();
              }}
            >
              <CloudDownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Message Alert */}
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ m: 2, mb: 0 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
            <Tab label={`All (${stats?.total || 0})`} />
            <Tab icon={<PhysicsIcon />} label={`Physics (${stats?.byLab.physics || 0})`} iconPosition="start" />
            <Tab icon={<ChemistryIcon />} label={`Chemistry (${stats?.byLab.chemistry || 0})`} iconPosition="start" />
            <Tab icon={<MathIcon />} label={`Math (${stats?.byLab.math || 0})`} iconPosition="start" />
            <Tab icon={<CodeIcon />} label={`Code (${stats?.byLab.code || 0})`} iconPosition="start" />
            <Tab icon={<GlobeIcon />} label={`Globe (${stats?.byLab.globe || 0})`} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search experiments by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Experiments Grid */}
        <Box sx={{ p: 2, pt: 1, overflow: 'auto', flex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : filteredExperiments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery ? 'No experiments match your search' : 'No experiments yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'Try a different search term' : 'Generate experiments from your labs and save them here!'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredExperiments.map(exp => (
                <Grid item xs={12} sm={6} md={4} key={exp.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      {/* Lab Badge */}
                      <Chip
                        icon={getLabIcon(exp.metadata.lab)}
                        label={exp.metadata.lab}
                        size="small"
                        sx={{
                          bgcolor: getLabColor(exp.metadata.lab),
                          color: 'white',
                          mb: 1
                        }}
                      />

                      {/* Title */}
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {exp.metadata.title}
                      </Typography>

                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40 }}>
                        {exp.metadata.description || 'No description'}
                      </Typography>

                      {/* Tags */}
                      {exp.metadata.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {exp.metadata.tags.slice(0, 3).map((tag, i) => (
                            <Chip key={i} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}

                      {/* PDF Context */}
                      {exp.metadata.pdfContext && (
                        <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          📄 From: {exp.metadata.pdfContext.hubName}
                        </Typography>
                      )}

                      {/* Date */}
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Modified: {formatDate(exp.modified)}
                      </Typography>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<OpenIcon />}
                        onClick={() => handleOpen(exp)}
                      >
                        Open
                      </Button>
                      <Box>
                        <Tooltip title="Download JSON">
                          <IconButton size="small" onClick={() => handleDownload(exp.id)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(exp.id, exp.metadata.title)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ExperimentLibrary;

