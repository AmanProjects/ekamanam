import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  IconButton,
  Badge,
  Divider,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  School as SchoolIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  PersonAdd as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { findPeerMatches, sendPeerRequest, getPeerLearningStats } from '../services/peerLearningService';

/**
 * Peer Matching Dialog
 *
 * Shows peer matches categorized by:
 * - Helpers (can teach you)
 * - Peers (same level)
 * - Learners (you can teach)
 */
function PeerMatchingDialog({ open, onClose, userId, concept, subject }) {
  const [activeTab, setActiveTab] = useState(0); // 0 = Helpers, 1 = Peers, 2 = Learners
  const [matches, setMatches] = useState({ helpers: [], peers: [], learners: [] });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(new Set());

  // Load matches and stats
  useEffect(() => {
    if (open && userId && concept) {
      loadMatches();
      loadStats();
    }
  }, [open, userId, concept]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const fetchedMatches = await findPeerMatches(userId, subject, concept);
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const fetchedStats = await getPeerLearningStats(userId);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Handle send request
  const handleSendRequest = async () => {
    if (!selectedPeer || !requestMessage.trim()) return;

    setSendingRequest(true);
    try {
      await sendPeerRequest(userId, selectedPeer.userId, concept, requestMessage.trim());
      setRequestSent(prev => new Set([...prev, selectedPeer.userId]));
      setSelectedPeer(null);
      setRequestMessage('');
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSendingRequest(false);
    }
  };

  // Get skill level label
  const getSkillLabel = (level) => {
    const labels = {
      1: 'Beginner',
      2: 'Intermediate',
      3: 'Advanced',
      4: 'Expert'
    };
    return labels[level] || 'Unknown';
  };

  // Get skill level color
  const getSkillColor = (level) => {
    const colors = {
      1: 'default',
      2: 'primary',
      3: 'warning',
      4: 'success'
    };
    return colors[level] || 'default';
  };

  // Render peer card
  const renderPeerCard = (peer) => (
    <Grid item xs={12} sm={6} md={4} key={peer.userId}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              {peer.userName?.charAt(0) || '?'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {peer.userName || 'Anonymous'}
              </Typography>
              <Chip
                label={getSkillLabel(peer.skillLevel)}
                size="small"
                color={getSkillColor(peer.skillLevel)}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${peer.matchScore}% match`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<StarIcon />}
              label={`${peer.reputation} rep`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<PeopleIcon />}
              label={`Helped ${peer.helpedCount}`}
              size="small"
              variant="outlined"
            />
          </Box>

          {peer.confidenceScore && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Confidence: {peer.confidenceScore}%
              </Typography>
              <Box sx={{
                width: '100%',
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  width: `${peer.confidenceScore}%`,
                  height: '100%',
                  bgcolor: 'success.main',
                  transition: 'width 0.3s'
                }} />
              </Box>
            </Box>
          )}

          {peer.commonStrengths?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Common strengths:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {peer.commonStrengths.slice(0, 3).map((strength, idx) => (
                  <Chip
                    key={idx}
                    label={strength}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          {requestSent.has(peer.userId) ? (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CheckIcon />}
              disabled
              color="success"
            >
              Request Sent
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedPeer(peer);
                setRequestMessage(`Hi! I'd like to learn about ${concept}. Can you help?`);
              }}
            >
              Connect
            </Button>
          )}
        </CardActions>
      </Card>
    </Grid>
  );

  // Get current tab matches
  const getCurrentMatches = () => {
    if (activeTab === 0) return matches.helpers;
    if (activeTab === 1) return matches.peers;
    return matches.learners;
  };

  const currentMatches = getCurrentMatches();

  return (
    <>
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
            <PeopleIcon color="primary" />
            <Typography variant="h6" component="span">
              Find Peer Learners
            </Typography>
            <Chip label={concept} size="small" color="primary" variant="outlined" />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Stats banner */}
        {stats && (
          <Box sx={{ px: 3, py: 2, bgcolor: 'primary.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" fontWeight={600}>
                    {stats.reputation}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reputation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" fontWeight={600}>
                    {stats.helpedCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Helped Others
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" fontWeight={600}>
                    {stats.strengths}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Strengths
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" fontWeight={600}>
                    {stats.expertConcepts}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Expert In
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
            <Tab
              label={
                <Badge badgeContent={matches.helpers.length} color="primary">
                  <Box sx={{ pr: 2 }}>Can Help You</Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={matches.peers.length} color="primary">
                  <Box sx={{ pr: 2 }}>Same Level</Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={matches.learners.length} color="primary">
                  <Box sx={{ pr: 2 }}>You Can Help</Box>
                </Badge>
              }
            />
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* Info message */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {activeTab === 0 && 'These students have strong knowledge and can help you learn.'}
              {activeTab === 1 && 'These students are at your level - perfect for collaborative learning!'}
              {activeTab === 2 && 'These students are learning this concept - you can help them!'}
            </Typography>
          </Alert>

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Empty state */}
          {!loading && currentMatches.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No matches found yet.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Check back later as more students join!
              </Typography>
            </Box>
          )}

          {/* Matches grid */}
          {!loading && currentMatches.length > 0 && (
            <Grid container spacing={2}>
              {currentMatches.map(peer => renderPeerCard(peer))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request message dialog */}
      <Dialog
        open={!!selectedPeer}
        onClose={() => setSelectedPeer(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Connection Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Send a message to {selectedPeer?.userName}:
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Introduce yourself and explain what you need help with..."
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPeer(null)} disabled={sendingRequest}>
            Cancel
          </Button>
          <Button
            onClick={handleSendRequest}
            variant="contained"
            disabled={sendingRequest || !requestMessage.trim()}
          >
            {sendingRequest ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PeerMatchingDialog;
