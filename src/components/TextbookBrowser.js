import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  MenuBook as BookIcon,
  School as SchoolIcon,
  Close as CloseIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

import {
  getAllBoards,
  getAvailableClasses,
  getSubjectsForClass,
  getTextbooks,
  getTextbooksBySubject,
  getTextbookPdfUrl,
  downloadTextbookPdf,
  getBoardInfo,
  searchTextbooks
} from '../services/textbookBoardsService';

/**
 * Textbook Browser Component
 *
 * Browse and download textbooks from multiple education boards:
 * - CBSE/NCERT
 * - Telangana State Board
 * - (More boards can be added)
 */
export default function TextbookBrowser({ open, onClose, onSelectPdf }) {
  const [selectedBoard, setSelectedBoard] = useState('ncert');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const boards = getAllBoards();
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Update available classes when board changes
  useEffect(() => {
    if (selectedBoard) {
      const classes = getAvailableClasses(selectedBoard);
      setAvailableClasses(classes);
      setSelectedClass('');
      setSelectedSubject('');
      setTextbooks([]);
    }
  }, [selectedBoard]);

  // Update available subjects when class changes
  useEffect(() => {
    if (selectedBoard && selectedClass) {
      const subjects = getSubjectsForClass(selectedBoard, parseInt(selectedClass));
      setAvailableSubjects(subjects);
      setSelectedSubject('');
    }
  }, [selectedBoard, selectedClass]);

  // Load textbooks when filters change
  useEffect(() => {
    if (selectedBoard && selectedClass) {
      loadTextbooks();
    }
  }, [selectedBoard, selectedClass, selectedSubject]);

  const loadTextbooks = () => {
    setLoading(true);
    setError(null);

    try {
      let books;
      if (selectedSubject) {
        books = getTextbooksBySubject(selectedBoard, parseInt(selectedClass), selectedSubject);
      } else {
        books = getTextbooks(selectedBoard, parseInt(selectedClass));
      }
      setTextbooks(books);
    } catch (err) {
      console.error('Error loading textbooks:', err);
      setError('Failed to load textbooks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      if (selectedBoard && selectedClass) {
        loadTextbooks();
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = searchTextbooks(searchQuery, selectedBoard);
      setTextbooks(results);
    } catch (err) {
      console.error('Error searching textbooks:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAndOpen = async (book) => {
    setDownloading(book.code);
    setError(null);

    try {
      const pdfUrl = getTextbookPdfUrl(selectedBoard, book);

      if (!pdfUrl) {
        throw new Error('PDF URL not available for this textbook');
      }

      console.log('📥 Downloading textbook:', book.title);
      console.log('📍 URL:', pdfUrl);

      const pdfBlob = await downloadTextbookPdf(pdfUrl);

      // Create a File object from the blob
      const pdfFile = new File([pdfBlob], `${book.title}.pdf`, { type: 'application/pdf' });

      // Call parent handler to open PDF in the viewer
      if (onSelectPdf) {
        onSelectPdf(pdfFile, {
          title: book.title,
          board: getBoardInfo(selectedBoard)?.name,
          class: book.class,
          subject: book.subject,
          language: book.language,
          source: 'textbook_browser'
        });
      }

      onClose();
    } catch (err) {
      console.error('Error downloading textbook:', err);
      setError(`Failed to download ${book.title}. ${err.message || 'Please try again.'}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenInNewTab = (book) => {
    const pdfUrl = getTextbookPdfUrl(selectedBoard, book);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const formatSubjectName = (subject) => {
    return subject
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '900px'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookIcon />
          <Typography variant="h6">Textbook Library</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            {/* Board Selection */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Education Board</InputLabel>
                <Select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  label="Education Board"
                  startAdornment={<SchoolIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {boards.map((board) => (
                    <MenuItem key={board.id} value={board.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {board.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {board.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Class Selection */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" disabled={!selectedBoard}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Class"
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {availableClasses.map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      Class {cls}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Subject Selection */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" disabled={!selectedClass}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {availableSubjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {formatSubjectName(subject)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Search */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search textbooks by title, subject, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => {
                        setSearchQuery('');
                        loadTextbooks();
                      }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Textbook Grid */}
        <Box sx={{ minHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : textbooks.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: 400,
              color: 'text.secondary'
            }}>
              <BookIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom>
                No textbooks found
              </Typography>
              <Typography variant="body2">
                {selectedBoard && selectedClass
                  ? 'Try selecting a different class or subject'
                  : 'Please select a board and class to browse textbooks'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {textbooks.map((book) => (
                <Grid item xs={12} sm={6} md={4} key={book.code}>
                  <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={`Class ${book.class}`}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={book.language}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="h6" gutterBottom sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        minHeight: 48
                      }}>
                        {book.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatSubjectName(book.subject)}
                      </Typography>

                      {book.chapters && (
                        <Typography variant="caption" color="text.secondary">
                          {book.chapters} chapters
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Tooltip title="Download and open in Ekamanam">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={downloading === book.code ? <CircularProgress size={16} /> : <DownloadIcon />}
                          onClick={() => handleDownloadAndOpen(book)}
                          disabled={downloading === book.code}
                          sx={{ flexGrow: 1, mr: 1 }}
                        >
                          {downloading === book.code ? 'Loading...' : 'Open'}
                        </Button>
                      </Tooltip>

                      <Tooltip title="Open PDF in new tab">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenInNewTab(book)}
                          color="primary"
                        >
                          <OpenIcon />
                        </IconButton>
                      </Tooltip>
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
