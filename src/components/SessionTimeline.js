import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  PlayArrow as PlayIcon,
  Close as CloseIcon,
  Speed as SpeedIcon,
  Psychology as BrainIcon,
  QuestionAnswer as QuestionIcon,
  LocalCafe as BreakIcon,
  EmojiEvents as TrophyIcon,
  AccessTime as TimeIcon,
  MenuBook as BookIcon
} from '@mui/icons-material';
import { getSessionHistory, getSessionDetails } from '../services/sessionHistoryService';

/**
 * Session Timeline Component
 *
 * Visualizes learning sessions as interactive timelines.
 * Shows all events, statistics, and progress for any past session.
 */
function SessionTimeline({ open, onClose, userId }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = List, 1 = Timeline

  // Load sessions on mount
  useEffect(() => {
    if (open && userId) {
      loadSessions();
    }
  }, [open, userId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const fetchedSessions = await getSessionHistory(userId, 20);
      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load session details
  const handleSelectSession = async (session) => {
    setDetailsLoading(true);
    try {
      const details = await getSessionDetails(session.id);
      setSelectedSession(details);
      setActiveTab(1); // Switch to timeline view
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  // Format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Get event description
  const getEventDescription = (event) => {
    const { type, data } = event;

    switch (type) {
      case 'page_view':
        return `Viewed page ${data.pageNumber}`;
      case 'ai_query':
        return `Asked AI: ${data.queryType}`;
      case 'flashcard_review':
        return `Reviewed flashcard: ${data.concept} (${data.wasCorrect ? 'Correct' : 'Incorrect'})`;
      case 'doubt_submitted':
        return `Submitted doubt: ${data.concept}`;
      case 'break_taken':
        return `Took ${formatDuration(data.duration)} break`;
      case 'cognitive_load_spike':
        return `Cognitive load spike: ${Math.round(data.cognitiveLoad)}%`;
      case 'concept_mastered':
        return `Mastered: ${data.concept}`;
      case 'chapter_completed':
        return `Completed chapter!`;
      default:
        return type;
    }
  };

  // Get icon for event type
  const getEventIcon = (type) => {
    const icons = {
      page_view: <BookIcon />,
      ai_query: <QuestionIcon />,
      flashcard_review: <SpeedIcon />,
      doubt_submitted: <QuestionIcon />,
      break_taken: <BreakIcon />,
      cognitive_load_spike: <BrainIcon />,
      concept_mastered: <TrophyIcon />,
      chapter_completed: <TrophyIcon />
    };
    return icons[type] || <TimeIcon />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
          <TimeIcon color="primary" />
          <Typography variant="h6" component="span">
            Learning Journey
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="All Sessions" />
          <Tab label="Timeline" disabled={!selectedSession} />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', p: 3 }}>
        {/* Tab 0: Sessions List */}
        {activeTab === 0 && (
          <>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && sessions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TimeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No sessions yet. Start studying to track your journey!
                </Typography>
              </Box>
            )}

            {!loading && sessions.length > 0 && (
              <Grid container spacing={2}>
                {sessions.map((session) => (
                  <Grid item xs={12} sm={6} md={4} key={session.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleSelectSession(session)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
                          {session.chapter || session.pdfName}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          {formatTimestamp(session.startTime)}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          <Chip
                            icon={<TimeIcon />}
                            label={formatDuration(session.duration)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<BookIcon />}
                            label={`${session.stats.pagesViewed?.length || 0} pages`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<BrainIcon />}
                            label={`${session.stats.avgCognitiveLoad || 0}% load`}
                            size="small"
                            variant="outlined"
                            color={
                              session.stats.avgCognitiveLoad > 70
                                ? 'error'
                                : session.stats.avgCognitiveLoad > 40
                                ? 'primary'
                                : 'success'
                            }
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {session.stats.totalAIQueries || 0} AI queries
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.stats.conceptsMastered?.length || 0} concepts
                          </Typography>
                        </Box>

                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<PlayIcon />}
                          sx={{ mt: 2 }}
                        >
                          View Timeline
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Tab 1: Timeline View */}
        {activeTab === 1 && (
          <>
            {detailsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!detailsLoading && selectedSession && (
              <>
                {/* Session summary */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedSession.chapter || selectedSession.pdfName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {formatTimestamp(selectedSession.startTime)}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary.main" fontWeight={600}>
                          {formatDuration(selectedSession.duration)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Duration
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary.main" fontWeight={600}>
                          {selectedSession.stats.pagesViewed?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pages Viewed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary.main" fontWeight={600}>
                          {selectedSession.stats.avgCognitiveLoad || 0}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Load
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary.main" fontWeight={600}>
                          {selectedSession.eventCount || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Events
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Timeline */}
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Session Timeline
                </Typography>

                {selectedSession.events && selectedSession.events.length > 0 ? (
                  <Timeline position="right">
                    {selectedSession.events.map((event, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
                          <Typography variant="caption">
                            {Math.floor(event.relativeTime / 1000)}s
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot sx={{ bgcolor: event.color || '#2196F3' }}>
                            {getEventIcon(event.type)}
                          </TimelineDot>
                          {index < selectedSession.events.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {getEventDescription(event)}
                            </Typography>
                            {event.data?.cognitiveLoad && (
                              <Chip
                                label={`Load: ${Math.round(event.data.cognitiveLoad)}%`}
                                size="small"
                                sx={{ mt: 1 }}
                                color={
                                  event.data.cognitiveLoad > 70
                                    ? 'error'
                                    : event.data.cognitiveLoad > 40
                                    ? 'primary'
                                    : 'success'
                                }
                              />
                            )}
                          </Paper>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No events recorded for this session.
                  </Typography>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeTab === 1 && (
          <Button onClick={() => setActiveTab(0)} variant="outlined">
            Back to Sessions
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionTimeline;
