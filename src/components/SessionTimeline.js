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
  Alert,
  LinearProgress,
  Grid
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
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  AutoAwesome as StarIcon
} from '@mui/icons-material';
import { getSessionHistory, getSessionDetails } from '../services/sessionHistoryService';

/**
 * Session Timeline Component - v7.2.23
 *
 * Redesigned with excellent analytics:
 * - Overview dashboard with key metrics
 * - Weekly progress visualization
 * - Insights and recommendations
 * - Clean data presentation (no 0s where data doesn't exist)
 */
function SessionTimeline({ open, onClose, userId, onOpenPdfAtPage, fullScreen = false }) {
  const [sessions, setSessions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState({});
  const [expandedBooks, setExpandedBooks] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Load sessions on mount
  useEffect(() => {
    if (open && userId) {
      loadSessions();
    }
  }, [open, userId]);

  // Calculate analytics when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      calculateAnalytics(sessions);
      
      // Group sessions by book
      const grouped = sessions.reduce((acc, session) => {
        const bookName = session.bookTitle || session.pdfName || 'Unknown Book';
        if (!acc[bookName]) {
          acc[bookName] = [];
        }
        acc[bookName].push(session);
        return acc;
      }, {});
      
      setGroupedSessions(grouped);
      
      // Auto-expand first book only
      const expanded = {};
      const books = Object.keys(grouped);
      if (books.length > 0) {
        expanded[books[0]] = true;
      }
      setExpandedBooks(expanded);
    }
  }, [sessions]);

  // Calculate comprehensive analytics
  const calculateAnalytics = (sessions) => {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Filter sessions by time period
    const thisWeek = sessions.filter(s => {
      const date = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime);
      return date >= weekAgo;
    });
    
    const thisMonth = sessions.filter(s => {
      const date = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime);
      return date >= monthAgo;
    });

    // Calculate totals
    const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const weeklyStudyTime = thisWeek.reduce((sum, s) => sum + (s.duration || 0), 0);
    const monthlyStudyTime = thisMonth.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // Unique pages across all sessions
    const allPages = new Set();
    sessions.forEach(s => {
      if (s.stats?.pagesViewed && Array.isArray(s.stats.pagesViewed)) {
        s.stats.pagesViewed.forEach(p => allPages.add(`${s.pdfId || s.pdfName}-${p}`));
      }
    });

    // Calculate average session length
    const avgSessionLength = sessions.length > 0 
      ? Math.round(totalStudyTime / sessions.length) 
      : 0;

    // Calculate daily activity (last 7 days)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = sessions.filter(s => {
        const sDate = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime);
        return sDate.toISOString().split('T')[0] === dateStr;
      });
      
      dailyActivity.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en', { weekday: 'short' }),
        sessions: daySessions.length,
        minutes: Math.round(daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60000)
      });
    }

    // Find streak (consecutive days)
    let currentStreak = 0;
    for (let i = 0; i < dailyActivity.length; i++) {
      const day = dailyActivity[dailyActivity.length - 1 - i];
      if (day.sessions > 0) {
        currentStreak++;
      } else if (i > 0) { // Allow today to have no sessions
        break;
      }
    }

    // Books studied
    const booksStudied = new Set(sessions.map(s => s.bookTitle || s.pdfName)).size;

    // AI queries
    const totalAIQueries = sessions.reduce((sum, s) => sum + (s.stats?.totalAIQueries || 0), 0);

    setAnalytics({
      totalSessions: sessions.length,
      totalStudyTime,
      weeklyStudyTime,
      monthlyStudyTime,
      avgSessionLength,
      totalPages: allPages.size,
      booksStudied,
      currentStreak,
      dailyActivity,
      thisWeekSessions: thisWeek.length,
      totalAIQueries
    });
  };

  const handleOpenAtPage = (session, pageNumber) => {
    if (onOpenPdfAtPage && session.pdfId) {
      onOpenPdfAtPage(session.pdfId, pageNumber);
      onClose();
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedSessions = await getSessionHistory(userId, 100);
      setSessions(fetchedSessions);
      
      if (fetchedSessions.length === 0) {
        setError('No study sessions yet. Start reading to track your progress!');
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
      setActiveTab(2);
    } catch (err) {
      setSelectedSession(session);
      setActiveTab(2);
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

  const formatDuration = (ms) => {
    if (!ms || ms < 1000) return '-';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getEventDescription = (event) => {
    const { type, data } = event;
    switch (type) {
      case 'page_view': return `Viewed page ${data?.pageNumber || '?'}`;
      case 'ai_query': return `AI: ${data?.queryType || 'query'}`;
      case 'break_taken': return `Break: ${formatDuration(data?.duration)}`;
      case 'cognitive_load_spike': return `Focus spike: ${Math.round(data?.cognitiveLoad || 0)}%`;
      default: return type;
    }
  };

  const getEventIcon = (type) => {
    const icons = {
      page_view: <BookIcon fontSize="small" />,
      ai_query: <QuestionIcon fontSize="small" />,
      break_taken: <BreakIcon fontSize="small" />,
      cognitive_load_spike: <BrainIcon fontSize="small" />
    };
    return icons[type] || <TimeIcon fontSize="small" />;
  };

  const getBookTotals = (bookSessions) => ({
    totalTime: bookSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalSessions: bookSessions.length
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { height: fullScreen ? '100%' : '90vh', maxHeight: fullScreen ? '100%' : '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h6">Learning Journey</Typography>
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
          <Tab label="Overview" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Sessions" icon={<CalendarIcon />} iconPosition="start" />
          <Tab label="Details" disabled={!selectedSession} icon={<BookIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ p: 2 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

        {/* Tab 0: Overview Dashboard */}
        {activeTab === 0 && !loading && (
          <>
            {sessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <StarIcon sx={{ fontSize: 80, color: 'primary.light', mb: 2 }} />
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Start Your Learning Journey
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                  Open a PDF and study for at least 30 seconds. Your progress will be tracked automatically!
                </Typography>
              </Box>
            ) : analytics && (
              <>
                {/* Key Metrics */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {formatDuration(analytics.totalStudyTime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Study Time</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {analytics.totalSessions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Study Sessions</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter', borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="warning.dark">
                        {analytics.booksStudied}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Books Studied</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.lighter', borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="error.main">
                        {analytics.currentStreak}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Day Streak 🔥</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Weekly Activity */}
                <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    This Week's Activity
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 2 }}>
                    {analytics.dailyActivity.map((day, index) => {
                      const maxMinutes = Math.max(...analytics.dailyActivity.map(d => d.minutes), 1);
                      const height = day.minutes > 0 ? Math.max(20, (day.minutes / maxMinutes) * 100) : 8;
                      const isToday = index === analytics.dailyActivity.length - 1;
                      
                      return (
                        <Box key={day.date} sx={{ flex: 1, textAlign: 'center' }}>
                          <Box sx={{ height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 1 }}>
                            <Box
                              sx={{
                                width: '70%',
                                height: `${height}%`,
                                bgcolor: day.minutes > 0 ? (isToday ? 'primary.main' : 'primary.light') : 'grey.200',
                                borderRadius: 1,
                                transition: 'height 0.3s ease'
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color={isToday ? 'primary.main' : 'text.secondary'} fontWeight={isToday ? 600 : 400}>
                            {day.dayName}
                          </Typography>
                          {day.minutes > 0 && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {day.minutes}m
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={600} color="primary.main">
                        {formatDuration(analytics.weeklyStudyTime)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">This Week</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={600} color="primary.main">
                        {analytics.thisWeekSessions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Sessions</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={600} color="primary.main">
                        {formatDuration(analytics.avgSessionLength)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Avg Session</Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Quick Insights */}
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    💡 Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {analytics.currentStreak >= 3 && (
                      <Alert severity="success" icon={<TrophyIcon />}>
                        Amazing! You're on a {analytics.currentStreak}-day streak. Keep it up!
                      </Alert>
                    )}
                    {analytics.currentStreak === 0 && analytics.totalSessions > 0 && (
                      <Alert severity="info" icon={<CalendarIcon />}>
                        Study today to start a new streak!
                      </Alert>
                    )}
                    {analytics.avgSessionLength > 0 && analytics.avgSessionLength < 600000 && (
                      <Alert severity="info" icon={<TimeIcon />}>
                        Your average session is {formatDuration(analytics.avgSessionLength)}. Try 15-20 minute focused sessions for better retention.
                      </Alert>
                    )}
                    {analytics.totalAIQueries > 5 && (
                      <Alert severity="success" icon={<QuestionIcon />}>
                        You've used AI assistance {analytics.totalAIQueries} times. Great use of learning tools!
                      </Alert>
                    )}
                  </Box>
                </Paper>
              </>
            )}
          </>
        )}

        {/* Tab 1: Sessions List */}
        {activeTab === 1 && !loading && (
          <>
            {sessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No sessions recorded yet.
                </Typography>
              </Box>
            ) : (
              <Box>
                {Object.entries(groupedSessions).map(([bookName, bookSessions]) => {
                  const totals = getBookTotals(bookSessions);
                  const isExpanded = expandedBooks[bookName];
                  
                  return (
                    <Paper key={bookName} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                      <Box
                        onClick={() => toggleBook(bookName)}
                      sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          bgcolor: 'action.hover',
                        cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.selected' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                          <BookIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 350 }}>
                            {bookName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Chip size="small" label={`${totals.totalSessions} sessions`} variant="outlined" />
                          <Chip size="small" icon={<TimeIcon />} label={formatDuration(totals.totalTime)} color="primary" />
                        </Box>
                        </Box>

                      <Collapse in={isExpanded}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Chapter</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bookSessions.map((session) => (
                                <TableRow 
                                  key={session.id}
                                  hover
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => handleSelectSession(session)}
                                >
                                  <TableCell>{formatDate(session.startTime)}</TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                      {formatDuration(session.duration)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                      {session.chapterTitle || session.chapter || '-'}
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

        {/* Tab 2: Session Details */}
        {activeTab === 2 && (
          <>
            {detailsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!detailsLoading && selectedSession && (
              <>
                <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {selectedSession.bookTitle || selectedSession.pdfName}
                  </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedSession.chapterTitle || selectedSession.chapter || 'Study Session'} • {formatDate(selectedSession.startTime)}
                  </Typography>
                    </Box>
                    {selectedSession.pdfId && onOpenPdfAtPage && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => handleOpenAtPage(selectedSession, 1)}
                      >
                        Continue
                      </Button>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight={700} color="primary.main">
                          {formatDuration(selectedSession.duration)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.lighter', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight={700} color="success.main">
                          {selectedSession.stats?.pagesViewed?.length || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Pages Read</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight={700} color="warning.dark">
                          {selectedSession.stats?.totalAIQueries || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">AI Queries</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Timeline */}
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Session Activity
                </Typography>

                {selectedSession.events && selectedSession.events.length > 0 ? (
                  <Timeline position="right" sx={{ p: 0 }}>
                    {selectedSession.events.slice(0, 30).map((event, index) => (
                      <TimelineItem key={index} sx={{ minHeight: 50 }}>
                        <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.15, py: 0.5 }}>
                          <Typography variant="caption">
                            {Math.floor((event.relativeTime || 0) / 1000)}s
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color="primary" sx={{ my: 0.5 }}>
                            {getEventIcon(event.type)}
                          </TimelineDot>
                          {index < Math.min(selectedSession.events.length, 30) - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: 0.5 }}>
                          <Typography variant="body2">{getEventDescription(event)}</Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Session recorded successfully. Detailed activity tracking is available in future sessions.
                  </Alert>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        {activeTab === 2 && (
          <Button onClick={() => setActiveTab(1)} variant="outlined" size="small">
            ← Back
          </Button>
        )}
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
      
      {/* Footer */}
      <Box sx={{ 
        py: 1, 
        px: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
        bgcolor: 'grey.50'
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', lineHeight: 1.4 }}>
          © 2025 Amandeep Singh Talwar | PDF copyrights belong to respective owners | For personal educational use only
        </Typography>
      </Box>
    </Dialog>
  );
}

export default SessionTimeline;
