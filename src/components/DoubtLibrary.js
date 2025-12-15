import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Collapse,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  QuestionAnswer as QuestionIcon,
  TrendingUp as TrendingIcon,
  History as RecentIcon,
  Lightbulb as AnswerIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import {
  getPopularDoubts,
  upvoteDoubt,
  getDoubtAnswer,
  submitDoubt
} from '../services/doubtPredictionService';

/**
 * Doubt Library
 *
 * Browse all crowdsourced doubts from other students.
 * Upvote relevant doubts and get AI answers on-demand.
 */
function DoubtLibrary({ open, onClose, chapter, userId }) {
  const [activeTab, setActiveTab] = useState(0); // 0 = Popular, 1 = Recent
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDoubt, setExpandedDoubt] = useState(null);
  const [loadingAnswer, setLoadingAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [upvotedDoubts, setUpvotedDoubts] = useState(new Set());

  // Submission form state
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newDoubtConcept, setNewDoubtConcept] = useState('');
  const [newDoubtQuestion, setNewDoubtQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load doubts on mount and tab change
  useEffect(() => {
    if (open && chapter) {
      loadDoubts();
    }
  }, [open, chapter, activeTab]);

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const fetchedDoubts = await getPopularDoubts(chapter, 20);
      setDoubts(fetchedDoubts);
    } catch (error) {
      console.error('Error loading doubts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle upvote
  const handleUpvote = async (doubtId) => {
    if (upvotedDoubts.has(doubtId)) return;

    try {
      await upvoteDoubt(doubtId);
      setUpvotedDoubts(prev => new Set([...prev, doubtId]));

      // Update local state
      setDoubts(prev => prev.map(d =>
        d.id === doubtId ? { ...d, upvotes: d.upvotes + 1 } : d
      ));
    } catch (error) {
      console.error('Error upvoting doubt:', error);
    }
  };

  // Handle expand doubt (to show/generate answer)
  const handleExpandDoubt = async (doubt) => {
    if (expandedDoubt === doubt.id) {
      setExpandedDoubt(null);
      return;
    }

    setExpandedDoubt(doubt.id);

    // If answer already loaded, skip
    if (answers[doubt.id]) return;

    // Generate answer
    setLoadingAnswer(doubt.id);

    try {
      const answer = await getDoubtAnswer(
        doubt.question,
        doubt.concept,
        doubt.chapter
      );

      setAnswers(prev => ({ ...prev, [doubt.id]: answer }));
    } catch (error) {
      console.error('Error generating answer:', error);
      setAnswers(prev => ({
        ...prev,
        [doubt.id]: 'Sorry, I couldn\'t generate an answer. Please try again.'
      }));
    } finally {
      setLoadingAnswer(null);
    }
  };

  // Handle submit new doubt
  const handleSubmitDoubt = async () => {
    if (!newDoubtConcept.trim() || !newDoubtQuestion.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await submitDoubt(
        userId,
        newDoubtConcept.trim(),
        newDoubtQuestion.trim(),
        0, // pageNumber (unknown in library context)
        chapter
      );

      // Reset form
      setNewDoubtConcept('');
      setNewDoubtQuestion('');
      setShowSubmitForm(false);

      // Reload doubts
      await loadDoubts();

      // Show success message (could add Snackbar)
      console.log('✅ Doubt submitted successfully!');
    } catch (error) {
      console.error('Error submitting doubt:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter doubts by search query
  const filteredDoubts = doubts.filter(doubt =>
    doubt.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doubt.concept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuestionIcon color="primary" />
          <Typography variant="h6" component="span">
            Doubt Library
          </Typography>
          <Chip label={chapter} size="small" color="primary" variant="outlined" />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
            <Tab
              icon={<TrendingIcon />}
              iconPosition="start"
              label="Popular"
            />
            <Tab
              icon={<RecentIcon />}
              iconPosition="start"
              label="Recent"
            />
          </Tabs>
        </Box>

        {/* Search bar */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search doubts by concept or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Submit new doubt button */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowSubmitForm(!showSubmitForm)}
          >
            Submit Your Doubt
          </Button>

          {/* Submit form */}
          <Collapse in={showSubmitForm}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Have a doubt? Share it with the community!
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Concept"
                placeholder="e.g., Photosynthesis"
                value={newDoubtConcept}
                onChange={(e) => setNewDoubtConcept(e.target.value)}
                sx={{ mt: 1 }}
              />

              <TextField
                fullWidth
                size="small"
                label="Your Question"
                placeholder="e.g., Why do plants need chlorophyll?"
                value={newDoubtQuestion}
                onChange={(e) => setNewDoubtQuestion(e.target.value)}
                multiline
                rows={2}
                sx={{ mt: 1 }}
              />

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  onClick={() => setShowSubmitForm(false)}
                  size="small"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSubmitDoubt}
                  disabled={submitting || !newDoubtConcept.trim() || !newDoubtQuestion.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>

        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty state */}
        {!loading && filteredDoubts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <QuestionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {searchQuery ? 'No doubts match your search.' : 'No doubts yet for this chapter.'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Be the first to submit a doubt!
            </Typography>
          </Box>
        )}

        {/* Doubts list */}
        {!loading && filteredDoubts.length > 0 && (
          <List sx={{ flex: 1, overflow: 'auto', px: 2 }}>
            {filteredDoubts.map((doubt) => (
              <Box key={doubt.id} sx={{ mb: 1 }}>
                <ListItem
                  disablePadding
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: expandedDoubt === doubt.id ? 'primary.50' : 'background.paper'
                  }}
                >
                  <ListItemButton onClick={() => handleExpandDoubt(doubt)}>
                    <Box sx={{ width: '100%' }}>
                      {/* Header */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 1
                      }}>
                        <Chip
                          label={doubt.concept}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ flexShrink: 0 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {doubt.question}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Footer */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(doubt.id);
                          }}
                          disabled={upvotedDoubts.has(doubt.id)}
                          sx={{
                            color: upvotedDoubts.has(doubt.id) ? 'primary.main' : 'text.secondary'
                          }}
                        >
                          <Badge badgeContent={doubt.upvotes} color="primary">
                            {upvotedDoubts.has(doubt.id) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                          </Badge>
                        </IconButton>

                        <Typography variant="caption" color="text.secondary">
                          {doubt.upvotes} student{doubt.upvotes !== 1 ? 's' : ''} found this helpful
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>

                {/* Answer (expanded) */}
                <Collapse in={expandedDoubt === doubt.id}>
                  <Box sx={{
                    p: 2,
                    border: 1,
                    borderTop: 0,
                    borderColor: 'divider',
                    borderRadius: '0 0 8px 8px',
                    bgcolor: 'grey.50',
                    mt: -1
                  }}>
                    {loadingAnswer === doubt.id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Generating answer...
                        </Typography>
                      </Box>
                    ) : answers[doubt.id] ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AnswerIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                            AI Answer
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {answers[doubt.id]}
                        </Typography>
                      </>
                    ) : null}
                  </Box>
                </Collapse>
              </Box>
            ))}
          </List>
        )}

        {/* Info footer */}
        <Box sx={{ p: 2, bgcolor: 'primary.50' }}>
          <Alert severity="info" sx={{ py: 0 }}>
            <Typography variant="caption">
              💡 All doubts are crowdsourced from students like you. Upvote helpful questions!
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DoubtLibrary;
