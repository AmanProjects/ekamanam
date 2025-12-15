import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Close as CloseIcon,
  TrendingUp as TrendingIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';
import { generatePreEmptiveExplanation } from '../services/doubtPredictionService';

/**
 * Doubt Prediction Dialog
 *
 * Proactively shows concepts that might confuse the student BEFORE they read.
 * Displays common doubts from other students and AI-generated explanations.
 */
function DoubtPredictionDialog({ open, onClose, hotspots, pageNumber }) {
  const [expandedConcept, setExpandedConcept] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanations, setLoadingExplanations] = useState({});

  // Generate pre-emptive explanation when accordion is expanded
  const handleAccordionChange = async (concept) => {
    if (expandedConcept === concept) {
      setExpandedConcept(null);
      return;
    }

    setExpandedConcept(concept);

    // If explanation already generated, skip
    if (explanations[concept]) return;

    // Generate explanation
    const hotspot = hotspots.find(h => h.concept === concept);
    if (!hotspot) return;

    setLoadingExplanations(prev => ({ ...prev, [concept]: true }));

    try {
      const explanation = await generatePreEmptiveExplanation(
        concept,
        hotspot.commonDoubts
      );

      setExplanations(prev => ({ ...prev, [concept]: explanation }));
    } catch (error) {
      console.error('Error generating explanation:', error);
      setExplanations(prev => ({
        ...prev,
        [concept]: 'Sorry, I couldn\'t generate an explanation. Please try again.'
      }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [concept]: false }));
    }
  };

  // Get color for confusion rate
  const getConfusionColor = (rate) => {
    if (rate >= 0.8) return 'error';
    if (rate >= 0.6) return 'warning';
    return 'info';
  };

  // Get warning level text
  const getWarningLevel = (rate) => {
    if (rate >= 0.8) return 'Very Confusing';
    if (rate >= 0.6) return 'Confusing';
    return 'Moderately Confusing';
  };

  if (!hotspots || hotspots.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BrainIcon color="warning" />
          <Typography variant="h6" component="span">
            Confusion Alert!
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Header message */}
        <Alert severity="info" icon={<LightbulbIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>
            Page {pageNumber} contains concepts that confused other students.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Read these explanations BEFORE you continue to avoid confusion!
          </Typography>
        </Alert>

        {/* Statistics */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2
        }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h4" color="warning.main" fontWeight={600}>
              {hotspots.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Confusing Concepts
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h4" color="primary.main" fontWeight={600}>
              {hotspots.reduce((sum, h) => sum + h.totalStudents, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Students Analyzed
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {Math.round(hotspots.reduce((sum, h) => sum + h.confusionRate, 0) / hotspots.length * 100)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Confusion Rate
            </Typography>
          </Box>
        </Box>

        {/* Confusion hotspots */}
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          <TrendingIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
          Top Confusing Concepts:
        </Typography>

        {hotspots.map((hotspot, index) => (
          <Accordion
            key={hotspot.concept}
            expanded={expandedConcept === hotspot.concept}
            onChange={() => handleAccordionChange(hotspot.concept)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                width: '100%',
                pr: 2
              }}>
                <Chip
                  label={`#${index + 1}`}
                  size="small"
                  color={getConfusionColor(hotspot.confusionRate)}
                />
                <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
                  {hotspot.concept}
                </Typography>
                <Chip
                  icon={<WarningIcon />}
                  label={getWarningLevel(hotspot.confusionRate)}
                  size="small"
                  color={getConfusionColor(hotspot.confusionRate)}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(hotspot.confusionRate * 100)}% confused
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {loadingExplanations[hotspot.concept] ? (
                <Box sx={{ py: 2 }}>
                  <LinearProgress />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                  >
                    Generating pre-emptive explanation...
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Common doubts */}
                  {hotspot.commonDoubts.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Common questions from students:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {hotspot.commonDoubts.map((doubt, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 1.5,
                              bgcolor: 'grey.50',
                              borderRadius: 1,
                              borderLeft: 3,
                              borderColor: 'warning.main'
                            }}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              {doubt.question}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doubt.upvotes} student{doubt.upvotes !== 1 ? 's' : ''} asked this
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* AI explanation */}
                  {explanations[hotspot.concept] && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'primary.50',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'primary.main'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LightbulbIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                          Pre-emptive Explanation
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-line',
                          lineHeight: 1.6
                        }}
                      >
                        {explanations[hotspot.concept]}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Helpful tip */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Pro Tip:</strong> Read these explanations now to save time later.
            Research shows pre-emptive learning reduces confusion by 50%!
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Skip for Now
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Got it! Continue Reading
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DoubtPredictionDialog;
