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
  IconButton,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Alert
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
  MenuBook as BookIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getSessionHistory, getSessionDetails } from '../services/sessionHistoryService';

/**
 * Session Timeline Component - v7.2.11
 * 
 * Redesigned with:
 * - Compact row-based layout instead of cards
 * - Sessions grouped by book/PDF name
 * - More information visible at a glance
 */
function SessionTimeline({ open, onClose, userId }) {
  const [sessions, setSessions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState({});
  const [expandedBooks, setExpandedBooks] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  // Load sessions on mount
  useEffect(() => {
    if (open && userId) {
      loadSessions();
    }
  }, [open, userId]);

  // Group sessions by book when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      const grouped = sessions.reduce((acc, session) => {
        const bookName = session.pdfName || 'Unknown Book';
        if (!acc[bookName]) {
          acc[bookName] = [];
        }
        acc[bookName].push(session);
        return acc;
      }, {});
      
      setGroupedSessions(grouped);
      
      // Auto-expand all books initially
      const expanded = {};
      Object.keys(grouped).forEach(book => {
        expanded[book] = true;
      });
      setExpandedBooks(expanded);
    }
  }, [sessions]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📚 Loading sessions for user:', userId);
      const fetchedSessions = await getSessionHistory(userId, 50);
      console.log('📚 Loaded sessions:', fetchedSessions.length);
      setSessions(fetchedSessions);
      
      if (fetchedSessions.length === 0) {
        setError('No sessions found. Open a PDF and read for at least 30 seconds to create a session.');
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(`Failed to load sessions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session) => {
    setDetailsLoading(true);
    try {
      const details = await getSessionDetails(session.id);
      setSelectedSession(details || session);
      setActiveTab(1);
    } catch (err) {
      console.error('Error loading session details:', err);
      setSelectedSession(session); // Use basic session data
      setActiveTab(1);
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleBook = (bookName) => {
    setExpandedBooks(prev => ({
      ...prev,
      [bookName]: !prev[bookName]
    }));
  };

  // Format timestamp - more compact
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDuration = (ms) => {
    if (!ms || ms < 1000) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getEventDescription = (event) => {
    const { type, data } = event;
    switch (type) {
      case 'page_view':
        return `Viewed page ${data?.pageNumber || '?'}`;
      case 'ai_query':
        return `AI: ${data?.queryType || 'query'}`;
      case 'flashcard_review':
        return `Flashcard: ${data?.concept || ''}`;
      case 'break_taken':
        return `Break: ${formatDuration(data?.duration)}`;
      case 'cognitive_load_spike':
        return `Load spike: ${Math.round(data?.cognitiveLoad || 0)}%`;
      case 'concept_mastered':
        return `Mastered: ${data?.concept || ''}`;
      case 'chapter_completed':
        return 'Chapter completed!';
      default:
        return type;
    }
  };

  const getEventIcon = (type) => {
    const icons = {
      page_view: <BookIcon fontSize="small" />,
      ai_query: <QuestionIcon fontSize="small" />,
      flashcard_review: <SpeedIcon fontSize="small" />,
      break_taken: <BreakIcon fontSize="small" />,
      cognitive_load_spike: <BrainIcon fontSize="small" />,
      concept_mastered: <TrophyIcon fontSize="small" />,
      chapter_completed: <TrophyIcon fontSize="small" />
    };
    return icons[type] || <TimeIcon fontSize="small" />;
  };

  // Calculate totals for a book
  const getBookTotals = (bookSessions) => {
    return {
      totalTime: bookSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      totalPages: new Set(bookSessions.flatMap(s => s.stats?.pagesViewed || [])).size,
      totalSessions: bookSessions.length,
      avgLoad: Math.round(
        bookSessions.reduce((sum, s) => sum + (s.stats?.avgCognitiveLoad || 0), 0) / bookSessions.length
      ) || 0
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh', maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon color="primary" />
          <Typography variant="h6">Learning Journey</Typography>
          {sessions.length > 0 && (
            <Chip label={`${sessions.length} sessions`} size="small" />
          )}
        </Box>
        <Box>
          <IconButton onClick={loadSessions} size="small" title="Refresh">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="All Sessions" />
          <Tab label="Session Details" disabled={!selectedSession} />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ p: 2 }}>
        {/* Tab 0: Sessions List - Grouped by Book */}
        {activeTab === 0 && (
          <>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && !loading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!loading && sessions.length === 0 && !error && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TimeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No sessions yet. Start studying to track your journey!
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Sessions are saved every 30 seconds while reading.
                </Typography>
              </Box>
            )}

            {!loading && Object.keys(groupedSessions).length > 0 && (
              <Box>
                {Object.entries(groupedSessions).map(([bookName, bookSessions]) => {
                  const totals = getBookTotals(bookSessions);
                  const isExpanded = expandedBooks[bookName];
                  
                  return (
                    <Paper key={bookName} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
                      {/* Book Header - Clickable to expand/collapse */}
                      <Box
                        onClick={() => toggleBook(bookName)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.selected' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                          <BookIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 300 }}>
                            {bookName}
                          </Typography>
                        </Box>
                        
                        {/* Book Summary Stats */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Chip 
                            size="small" 
                            label={`${totals.totalSessions} sessions`}
                            variant="outlined"
                          />
                          <Chip 
                            size="small" 
                            icon={<TimeIcon />}
                            label={formatDuration(totals.totalTime)}
                          />
                          <Chip 
                            size="small" 
                            icon={<BookIcon />}
                            label={`${totals.totalPages} pages`}
                          />
                          <Chip 
                            size="small"
                            icon={<BrainIcon />}
                            label={`${totals.avgLoad}%`}
                            color={totals.avgLoad > 70 ? 'error' : totals.avgLoad > 40 ? 'primary' : 'success'}
                          />
                        </Box>
                      </Box>
                      
                      {/* Sessions Table */}
                      <Collapse in={isExpanded}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ fontWeight: 600, width: 100 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 80 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 70 }}>Pages</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 70 }}>Load</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 70 }}>AI Qs</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 70 }}>Events</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Chapter/Subject</TableCell>
                                <TableCell sx={{ width: 80 }}></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bookSessions.map((session) => (
                                <TableRow 
                                  key={session.id}
                                  hover
                                  sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                  onClick={() => handleSelectSession(session)}
                                >
                                  <TableCell>
                                    <Typography variant="body2">
                                      {formatDate(session.startTime)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                      {formatDuration(session.duration)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {session.stats?.pagesViewed?.length || 0}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={`${session.stats?.avgCognitiveLoad || 0}%`}
                                      color={
                                        (session.stats?.avgCognitiveLoad || 0) > 70 ? 'error' :
                                        (session.stats?.avgCognitiveLoad || 0) > 40 ? 'primary' : 'success'
                                      }
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {session.stats?.totalAIQueries || 0}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {session.eventCount || 0}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                                      {session.chapter || '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <IconButton size="small" color="primary">
                                      <PlayIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </>
        )}

        {/* Tab 1: Session Details */}
        {activeTab === 1 && (
          <>
            {detailsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!detailsLoading && selectedSession && (
              <>
                {/* Session Summary */}
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {selectedSession.pdfName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedSession.chapter || 'No chapter'} • {formatDate(selectedSession.startTime)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h5" color="primary.main" fontWeight={600}>
                        {formatDuration(selectedSession.duration)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Duration</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                      <Typography variant="h5" color="primary.main" fontWeight={600}>
                        {selectedSession.stats?.pagesViewed?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Pages</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                      <Typography variant="h5" color="primary.main" fontWeight={600}>
                        {selectedSession.stats?.avgCognitiveLoad || 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Avg Load</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                      <Typography variant="h5" color="primary.main" fontWeight={600}>
                        {selectedSession.eventCount || selectedSession.events?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Events</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                      <Typography variant="h5" color="primary.main" fontWeight={600}>
                        {selectedSession.stats?.totalAIQueries || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">AI Queries</Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Timeline */}
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Session Timeline
                </Typography>

                {selectedSession.events && selectedSession.events.length > 0 ? (
                  <Timeline position="right" sx={{ p: 0 }}>
                    {selectedSession.events.slice(0, 50).map((event, index) => (
                      <TimelineItem key={index} sx={{ minHeight: 50 }}>
                        <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.15, py: 0.5 }}>
                          <Typography variant="caption">
                            {Math.floor((event.relativeTime || 0) / 1000)}s
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot 
                            sx={{ 
                              bgcolor: event.type === 'cognitive_load_spike' ? 'error.main' : 'primary.main',
                              my: 0.5
                            }}
                          >
                            {getEventIcon(event.type)}
                          </TimelineDot>
                          {index < Math.min(selectedSession.events.length, 50) - 1 && (
                            <TimelineConnector />
                          )}
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: 0.5 }}>
                          <Typography variant="body2">
                            {getEventDescription(event)}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Alert severity="info">
                    No detailed events recorded for this session. Events are recorded when you navigate pages, use AI features, or take breaks.
                  </Alert>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        {activeTab === 1 && (
          <Button onClick={() => setActiveTab(0)} variant="outlined" size="small">
            ← Back to Sessions
          </Button>
        )}
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionTimeline;
