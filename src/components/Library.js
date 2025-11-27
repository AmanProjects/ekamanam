import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import LibraryCard from './LibraryCard';
import { 
  getAllLibraryItems, 
  removePDFFromLibrary,
  searchLibrary,
  getLibraryStats
} from '../services/libraryService';

/**
 * Library - Main library view component
 * 
 * Props:
 * - onOpenPDF: Function to open a PDF from library
 * - onAddPDF: Function to add new PDF
 */
const Library = ({ onOpenPDF, onAddPDF }) => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  // Load library on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  // Filter items when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredItems(libraryItems);
    }
  }, [searchQuery, libraryItems]);

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, libraryStats] = await Promise.all([
        getAllLibraryItems(),
        getLibraryStats()
      ]);
      setLibraryItems(items);
      setFilteredItems(items);
      setStats(libraryStats);
    } catch (err) {
      console.error('Error loading library:', err);
      setError('Failed to load library. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setFilteredItems(libraryItems);
      return;
    }
    
    try {
      const results = await searchLibrary(query);
      setFilteredItems(results);
    } catch (err) {
      console.error('Error searching library:', err);
    }
  };

  const handleRemove = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const confirmRemove = async () => {
    const { item } = deleteDialog;
    if (!item) return;

    try {
      await removePDFFromLibrary(item.id);
      setLibraryItems(prev => prev.filter(i => i.id !== item.id));
      setDeleteDialog({ open: false, item: null });
    } catch (err) {
      console.error('Error removing PDF:', err);
      setError('Failed to remove PDF. Please try again.');
    }
  };

  const handleOpen = (item) => {
    onOpenPDF(item);
  };

  // Format stats
  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          📚 My Library
        </Typography>
        
        {/* Stats */}
        {stats && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={`${stats.totalPDFs} file${stats.totalPDFs !== 1 ? 's' : ''}`} 
              color="primary" 
            />
            {stats.totalPages > 0 && (
              <Chip 
                label={`${stats.totalPages} pages`} 
                variant="outlined"
              />
            )}
            {stats.totalSize > 0 && (
              <Chip 
                label={formatSize(stats.totalSize)} 
                variant="outlined"
              />
            )}
            {stats.inProgressPDFs > 0 && (
              <Chip 
                label={`${stats.inProgressPDFs} in progress`} 
                color="warning"
                variant="outlined"
              />
            )}
            {stats.completedPDFs > 0 && (
              <Chip 
                label={`${stats.completedPDFs} completed`} 
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        )}

        {/* Search and Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search library..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: '250px' }}
          />
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddPDF}
          >
            Add PDF
          </Button>
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && libraryItems.length === 0 && (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            bgcolor: 'background.default',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom color="text.secondary">
            📚 Your Library is Empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add your first PDF to get started with organized learning
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<AddIcon />}
            onClick={onAddPDF}
          >
            Add Your First PDF
          </Button>
        </Paper>
      )}

      {/* Library Grid */}
      {!loading && filteredItems.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredItems.length} of {libraryItems.length} file{libraryItems.length !== 1 ? 's' : ''}
          </Typography>
          
          <Grid container spacing={3}>
            {filteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <LibraryCard
                  item={item}
                  onOpen={handleOpen}
                  onRemove={handleRemove}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* No Search Results */}
      {!loading && searchQuery && filteredItems.length === 0 && libraryItems.length > 0 && (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            bgcolor: 'background.default',
            mt: 3
          }}
        >
          <Typography variant="h6" gutterBottom color="text.secondary">
            No results found for "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different search term
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
      >
        <DialogTitle>Remove PDF from Library?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{deleteDialog.item?.name}</strong> from your library?
            <br /><br />
            This will delete:
            <br />• The PDF file
            <br />• All reading progress
            <br />• All notes and bookmarks
            <br /><br />
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            Cancel
          </Button>
          <Button 
            onClick={confirmRemove} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Library;

