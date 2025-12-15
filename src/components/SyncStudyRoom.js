import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Divider,
  Badge,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Settings as SettingsIcon,
  ExitToApp as LeaveIcon,
  Brightness1 as OnlineIcon
} from '@mui/icons-material';
import {
  subscribeToRoom,
  subscribeToRoomMembers,
  subscribeToRoomChat,
  subscribeToRoomAnnotations,
  changeRoomPage,
  sendRoomChatMessage,
  leaveStudyRoom
} from '../services/syncStudyService';

/**
 * Sync Study Room
 *
 * Real-time collaborative study room with:
 * - Synchronized PDF navigation
 * - Live member list
 * - Real-time chat
 * - Shared annotations
 */
function SyncStudyRoom({ open, onClose, roomId, userId, userName, onPageChange }) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [chatMessages, setMessages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);

  // Subscribe to room updates
  useEffect(() => {
    if (!open || !roomId) return;

    const unsubscribeRoom = subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);

      // Sync page navigation
      if (roomData.currentPage && onPageChange) {
        onPageChange(roomData.currentPage);
      }
    });

    const unsubscribeMembers = subscribeToRoomMembers(roomId, (membersData) => {
      setMembers(membersData);
    });

    const unsubscribeChat = subscribeToRoomChat(roomId, (messagesData) => {
      setMessages(messagesData);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMembers();
      unsubscribeChat();
    };
  }, [open, roomId]);

  // Subscribe to annotations for current page
  useEffect(() => {
    if (!open || !roomId || !room?.currentPage) return;

    const unsubscribe = subscribeToRoomAnnotations(roomId, room.currentPage, (annotationsData) => {
      setAnnotations(annotationsData);
    });

    return () => unsubscribe();
  }, [open, roomId, room?.currentPage]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendRoomChatMessage(roomId, userId, userName, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle page navigation
  const handlePageNavigation = async (direction) => {
    if (!room) return;

    const newPage = direction === 'next'
      ? room.currentPage + 1
      : Math.max(1, room.currentPage - 1);

    try {
      await changeRoomPage(roomId, userId, newPage);
    } catch (error) {
      console.error('Error changing page:', error);
    }
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
    try {
      await leaveStudyRoom(userId, roomId);
      onClose();
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  if (!room) {
    return null;
  }

  const isHost = room.hostUserId === userId;

  return (
    <Dialog
      open={open}
      onClose={handleLeaveRoom}
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
        pb: 1,
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge
            badgeContent={members.length}
            color="error"
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <PeopleIcon />
          </Badge>
          <Box>
            <Typography variant="h6" component="div">
              {room.name}
            </Typography>
            <Typography variant="caption">
              {room.chapter} • Page {room.currentPage}
              {isHost && <Chip label="HOST" size="small" sx={{ ml: 1, bgcolor: 'white', color: 'primary.main' }} />}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleLeaveRoom} sx={{ color: 'white' }}>
          <LeaveIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', height: '100%' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Main content area */}
          <Grid item xs={showChat ? 8 : 12} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Navigation controls */}
            <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PrevIcon />}
                    onClick={() => handlePageNavigation('prev')}
                    disabled={room.currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    endIcon={<NextIcon />}
                    onClick={() => handlePageNavigation('next')}
                  >
                    Next
                  </Button>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {room.settings.syncNavigation ? '🔄 Synchronized Navigation' : '🔓 Free Navigation'}
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => setShowChat(!showChat)}
                >
                  {showChat ? 'Hide' : 'Show'} Chat
                </Button>
              </Box>
            </Paper>

            {/* Study area info */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Collaborative Study Mode Active
                </Typography>
                <Typography variant="caption">
                  {members.length} student{members.length !== 1 ? 's' : ''} studying together.
                  Page changes are synchronized for everyone.
                </Typography>
              </Alert>

              {/* Active members */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Members
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {members.map((member) => (
                      <Tooltip key={member.userId} title={member.userName}>
                        <Chip
                          avatar={
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={<OnlineIcon sx={{ fontSize: 10, color: 'success.main' }} />}
                            >
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                {member.userName?.charAt(0) || '?'}
                              </Avatar>
                            </Badge>
                          }
                          label={member.userName}
                          size="small"
                          color={member.userId === room.hostUserId ? 'primary' : 'default'}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Annotations info */}
              {annotations.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Shared Annotations on This Page
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} from group members
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>

          {/* Chat sidebar */}
          {showChat && (
            <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', borderLeft: 1, borderColor: 'divider', height: '100%' }}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  <ChatIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Group Chat
                </Typography>
              </Box>

              {/* Chat messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <List>
                  {chatMessages.map((message) => {
                    const isOwnMessage = message.userId === userId;

                    return (
                      <ListItem
                        key={message.id}
                        alignItems="flex-start"
                        sx={{
                          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                          px: 0
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: isOwnMessage ? 0 : 40, ml: isOwnMessage ? 1 : 0, mr: isOwnMessage ? 0 : 1 }}>
                          <Avatar sx={{ bgcolor: isOwnMessage ? 'primary.main' : 'grey.400', width: 32, height: 32 }}>
                            {message.userName?.charAt(0) || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
                            maxWidth: '75%',
                            bgcolor: isOwnMessage ? 'primary.50' : 'grey.100',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {message.userName}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, wordWrap: 'break-word' }}>
                            {message.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {message.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Paper>
                      </ListItem>
                    );
                  })}
                  <div ref={chatEndRef} />
                </List>
              </Box>

              {/* Chat input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={3}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

export default SyncStudyRoom;
