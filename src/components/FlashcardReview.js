import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Chip,
  Fade,
  Stack,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  getDueCards,
  reviewFlashcard,
  getStreakInfo,
  getFlashcardStats
} from '../services/spacedRepetitionService';

/**
 * Flashcard Review Component
 *
 * Main interface for reviewing flashcards using spaced repetition.
 * Shows one card at a time with quality-based rating.
 */
function FlashcardReview({ open, userId, onClose, fullScreen = false }) {
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [streakInfo, setStreakInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    incorrect: 0
  });

  // Load due cards on mount
  useEffect(() => {
    if (open && userId) {
      loadDueCards();
      loadStreakInfo();
      loadStats();
    }
  }, [open, userId]);

  const loadDueCards = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const cards = await getDueCards(userId, 20);
      setDueCards(cards);

      if (cards.length === 0) {
        // No cards due
        console.log('🎉 No cards due for review!');
      }
    } catch (error) {
      console.error('Error loading due cards:', error);
      alert('Failed to load flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStreakInfo = async () => {
    if (!userId) return;

    try {
      const streak = await getStreakInfo(userId);
      setStreakInfo(streak);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const loadStats = async () => {
    if (!userId) return;

    try {
      const flashcardStats = await getFlashcardStats(userId);
      setStats(flashcardStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRate = async (quality) => {
    if (reviewing || dueCards.length === 0) return;

    setReviewing(true);
    const currentCard = dueCards[currentCardIndex];

    try {
      const result = await reviewFlashcard(currentCard.id, quality);

      // Update session stats
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: result.wasCorrect ? prev.correct + 1 : prev.correct,
        incorrect: !result.wasCorrect ? prev.incorrect + 1 : prev.incorrect
      }));

      // Show feedback briefly
      setTimeout(() => {
        // Move to next card or finish
        if (currentCardIndex < dueCards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
          setShowAnswer(false);
        } else {
          // Session complete
          finishSession();
        }
        setReviewing(false);
      }, 500);

    } catch (error) {
      console.error('Error reviewing card:', error);
      alert('Failed to review card. Please try again.');
      setReviewing(false);
    }
  };

  const finishSession = () => {
    // Reload streak and stats
    loadStreakInfo();
    loadStats();

    // Show completion message
    alert(`🎉 Review session complete!

Reviewed: ${sessionStats.reviewed + 1} cards
Correct: ${sessionStats.correct + (showAnswer ? 1 : 0)}
Accuracy: ${Math.round(((sessionStats.correct + 1) / (sessionStats.reviewed + 1)) * 100)}%`);

    // Close or refresh
    if (onClose) {
      onClose();
    } else {
      // Reload cards
      loadDueCards();
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 });
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleSkip = () => {
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const currentCard = dueCards[currentCardIndex];
  const progress = dueCards.length > 0 ? ((currentCardIndex + 1) / dueCards.length) * 100 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: { minHeight: fullScreen ? '100%' : '70vh', maxHeight: fullScreen ? '100%' : '90vh', height: fullScreen ? '100%' : 'auto' }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Typography variant="h6" color="text.secondary">
              Loading flashcards...
            </Typography>
          </Box>
        )}

        {!loading && dueCards.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              All caught up! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              No flashcards due for review right now.
              {stats && stats.newCards > 0 && (
                <>
                  <br />
                  You have {stats.newCards} new cards to learn.
                </>
              )}
            </Typography>

            {/* Streak Info */}
            {streakInfo && streakInfo.currentStreak > 0 && (
              <Chip
                icon={<FireIcon />}
                label={`${streakInfo.currentStreak} day streak!`}
                color="warning"
                size="large"
                sx={{ fontSize: '1.1rem', py: 3 }}
              />
            )}

            <Box sx={{ mt: 4 }}>
              <Button variant="outlined" onClick={onClose || loadDueCards} startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            </Box>
          </Box>
        )}

        {!loading && dueCards.length > 0 && (
          <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            📚 Flashcard Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Card {currentCardIndex + 1} of {dueCards.length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Streak */}
          {streakInfo && streakInfo.currentStreak > 0 && (
            <Tooltip title={`${streakInfo.longestStreak} day longest streak`}>
              <Chip
                icon={<FireIcon />}
                label={`${streakInfo.currentStreak} 🔥`}
                color="warning"
                size="small"
              />
            </Tooltip>
          )}

          {/* Close button */}
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 4, height: 8, borderRadius: 4 }}
      />

      {/* Session Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
        <Chip
          label={`Reviewed: ${sessionStats.reviewed}`}
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<CheckIcon />}
          label={`Correct: ${sessionStats.correct}`}
          color="success"
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<CancelIcon />}
          label={`Incorrect: ${sessionStats.incorrect}`}
          color="error"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Flashcard */}
      <Paper elevation={6} sx={{ minHeight: 400, p: 4, position: 'relative', bgcolor: 'background.paper' }}>
        {/* Card metadata */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip label={currentCard.chapter} size="small" color="primary" variant="outlined" />
          {currentCard.subject && (
            <Chip label={currentCard.subject} size="small" variant="outlined" />
          )}
          {currentCard.source === 'ai_generated' && (
            <Chip label="AI Generated" size="small" color="secondary" variant="outlined" />
          )}
        </Box>

        {/* Question (Front) */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Question:
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
            {currentCard.front}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Answer (Back) */}
        {showAnswer ? (
          <Fade in={showAnswer} timeout={300}>
            <Box>
              <Typography variant="h6" color="primary" gutterBottom>
                Answer:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.6, color: 'primary.main' }}>
                {currentCard.back}
              </Typography>

              {/* Rating buttons */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  How well did you know this?
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    size="large"
                    onClick={() => handleRate(0)}
                    disabled={reviewing}
                    startIcon={<CancelIcon />}
                  >
                    ❌ Forgot Completely
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    size="large"
                    onClick={() => handleRate(3)}
                    disabled={reviewing}
                  >
                    😐 Hard (Struggled)
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    size="large"
                    onClick={() => handleRate(4)}
                    disabled={reviewing}
                  >
                    🙂 Good (Some hesitation)
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    onClick={() => handleRate(5)}
                    disabled={reviewing}
                    startIcon={<CheckIcon />}
                  >
                    ✅ Easy (Perfect recall!)
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleShowAnswer}
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              Show Answer
            </Button>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="text"
                size="small"
                onClick={handleSkip}
                color="inherit"
              >
                Skip this card
              </Button>
            </Box>
          </Box>
        )}

        {/* Card stats (small text at bottom) */}
        <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <Typography variant="caption" color="text.secondary">
            Reviewed {currentCard.totalReviews} times •
            {currentCard.correctCount > 0 && ` ${Math.round((currentCard.correctCount / currentCard.totalReviews) * 100)}% accuracy •`}
            {currentCard.correctStreak > 0 && ` ${currentCard.correctStreak} correct streak 🔥`}
          </Typography>
        </Box>
      </Paper>

      {/* Helper text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        💡 Tip: Be honest with your rating. The algorithm works best when you accurately assess your knowledge.
      </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FlashcardReview;
