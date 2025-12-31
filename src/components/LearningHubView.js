/**
 * Learning Hub View - v10.6.0
 * 
 * NotebookLM-inspired interface for a single Learning Hub
 * Layout: Sources (left) | Chat (center) | Materials & Labs (right)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  Avatar,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Divider,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Send as SendIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Style as FlashcardIcon,
  Timeline as TimelineIcon,
  QuestionAnswer as FaqIcon,
  Calculate as MathIcon,
  Science as ChemistryIcon,
  Bolt as PhysicsIcon,
  Code as CodeIcon,
  Public as GlobeIcon,
  Psychology as VyonnIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import learningHubService from '../services/learningHubService';
import libraryService from '../services/libraryService';
import llmService from '../services/llmService';
import { renderMarkdown } from '../utils/markdownRenderer';

function LearningHubView({ 
  hub, 
  onBack, 
  onOpenPdf, 
  onOpenFlashcards,
  onOpenTimeline,
  onOpenLab 
}) {
  const [hubData, setHubData] = useState(hub);
  const [hubPdfs, setHubPdfs] = useState([]);
  const [allPdfs, setAllPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // Add PDFs dialog
  const [addPdfDialogOpen, setAddPdfDialogOpen] = useState(false);
  const [availablePdfs, setAvailablePdfs] = useState([]);
  
  // PDF context menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    loadHubData();
    // Mark hub as accessed
    learningHubService.markHubAccessed(hub.id);
  }, [hub.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHubData = async () => {
    setLoading(true);
    try {
      const [updatedHub, allLibraryPdfs] = await Promise.all([
        learningHubService.getLearningHub(hub.id),
        libraryService.getAllLibraryItems()
      ]);
      
      setHubData(updatedHub);
      setAllPdfs(allLibraryPdfs);
      
      // Filter PDFs that belong to this hub
      const pdfsInHub = allLibraryPdfs.filter(pdf => 
        updatedHub.pdfIds.includes(pdf.id)
      );
      setHubPdfs(pdfsInHub);
      
      // Get available PDFs not in this hub
      const pdfsNotInHub = allLibraryPdfs.filter(pdf => 
        !updatedHub.pdfIds.includes(pdf.id)
      );
      setAvailablePdfs(pdfsNotInHub);
      
    } catch (error) {
      console.error('❌ Failed to load hub data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Build context from all PDFs in hub
      const hubContext = hubPdfs.length > 0 
        ? `You are helping with a Learning Hub called "${hubData.name}". ${
            hubData.description ? `Description: ${hubData.description}. ` : ''
          }This hub contains ${hubPdfs.length} PDF(s): ${
            hubPdfs.map(p => p.name).join(', ')
          }. The user's question may relate to any of these materials.`
        : `You are helping with a Learning Hub called "${hubData.name}". There are no PDFs in this hub yet.`;

      // Build conversation history
      const conversationContext = messages.length > 0
        ? messages.slice(-4).map(m => 
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
          ).join('\n')
        : '';

      const systemPrompt = `You are Vyonn AI, an intelligent learning assistant. ${hubContext}

You have access to these interactive labs and tools:
- Math Lab: For calculations, equations, graphing
- Chemistry Tools: 3D molecules, periodic table, reactions
- Physics Simulator: Circuits, mechanics, waves
- Code Editor: Programming practice
- Globe Viewer: Geography, maps

If the user's question would benefit from using a specific lab or tool, mention it naturally in your response.

Recent conversation:
${conversationContext}

User's question: ${userMessage}

Provide a helpful, clear, and educational response.`;

      const response = await llmService.callLLM(systemPrompt);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please make sure you have configured your API keys in Settings.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddPdf = async (pdfId) => {
    try {
      await learningHubService.addPdfToHub(hubData.id, pdfId);
      setAddPdfDialogOpen(false);
      loadHubData();
    } catch (error) {
      console.error('❌ Failed to add PDF:', error);
      alert('Failed to add PDF to hub');
    }
  };

  const handleRemovePdf = async (pdfId) => {
    if (!window.confirm('Remove this PDF from the hub?')) return;
    
    try {
      await learningHubService.removePdfFromHub(hubData.id, pdfId);
      loadHubData();
      setMenuAnchor(null);
    } catch (error) {
      console.error('❌ Failed to remove PDF:', error);
      alert('Failed to remove PDF');
    }
  };

  const handleMenuOpen = (event, pdf) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedPdf(pdf);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPdf(null);
  };

  // Calculate hub statistics
  const totalPages = hubPdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);
  const avgProgress = hubPdfs.length > 0
    ? Math.round(hubPdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / hubPdfs.length)
    : 0;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid #e0e0e0', zIndex: 10 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: hubData.color, mr: 2 }}>
              {hubData.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {hubData.name}
              </Typography>
              {hubData.description && (
                <Typography variant="body2" color="text.secondary">
                  {hubData.description}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip label={`${hubPdfs.length} PDFs`} />
              <Chip label={`${totalPages} pages`} />
              <Chip label={`${avgProgress}% complete`} color="primary" />
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Main Content - 3 Column Layout */}
      <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', gap: 2, py: 3, overflow: 'hidden' }}>
        {/* LEFT: Sources Panel */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Sources ({hubPdfs.length})
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddPdfDialogOpen(true)}
              fullWidth
              variant="outlined"
            >
              Add PDF
            </Button>
          </Box>
          
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {hubPdfs.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No PDFs yet. Click "Add PDF" to get started.
                </Typography>
              </Box>
            )}
            {hubPdfs.map((pdf) => (
              <React.Fragment key={pdf.id}>
                <ListItem disablePadding secondaryAction={
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, pdf)}>
                    <MoreIcon fontSize="small" />
                  </IconButton>
                }>
                  <ListItemButton onClick={() => onOpenPdf(pdf)}>
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ bgcolor: '#f5f5f5' }}>
                        <PdfIcon color="error" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={pdf.name}
                      secondary={`${pdf.totalPages} pages • ${pdf.progress}%`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* CENTER: Chat Panel */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Hub Chat
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ask questions about any PDFs in this hub
            </Typography>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <VyonnIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Ready to help you learn!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask me anything about your materials in this hub
                </Typography>
              </Box>
            )}
            
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: '#616161', mr: 1, width: 32, height: 32 }}>
                    <VyonnIcon fontSize="small" />
                  </Avatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: msg.role === 'user' ? '#2196F3' : '#f5f5f5',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2
                  }}
                >
                  {msg.role === 'user' ? (
                    <Typography variant="body2">{msg.content}</Typography>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  )}
                </Paper>
                {msg.role === 'user' && (
                  <Avatar sx={{ bgcolor: '#2196F3', ml: 1, width: 32, height: 32 }}>U</Avatar>
                )}
              </Box>
            ))}
            
            {chatLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: '#616161', width: 32, height: 32 }}>
                  <VyonnIcon fontSize="small" />
                </Avatar>
                <CircularProgress size={20} />
              </Box>
            )}
            
            <div ref={chatEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              placeholder="Ask a question about your materials..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={chatLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!input.trim() || chatLoading}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Paper>

        {/* RIGHT: Materials & Labs Panel */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'auto',
            p: 2,
            gap: 2
          }}
        >
          {/* Study Materials */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Study Materials
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FlashcardIcon />}
                  onClick={onOpenFlashcards}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Flashcards
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  onClick={onOpenTimeline}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Timeline
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FaqIcon />}
                  sx={{ justifyContent: 'flex-start' }}
                  disabled
                >
                  FAQ (Coming Soon)
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Interactive Labs */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Interactive Labs
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MathIcon />}
                  onClick={() => onOpenLab('math')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Math Lab
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ChemistryIcon />}
                  onClick={() => onOpenLab('chemistry')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Chemistry
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PhysicsIcon />}
                  onClick={() => onOpenLab('physics')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Physics
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CodeIcon />}
                  onClick={() => onOpenLab('code')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Code Editor
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GlobeIcon />}
                  onClick={() => onOpenLab('globe')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Globe Viewer
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      {/* PDF Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { onOpenPdf(selectedPdf); handleMenuClose(); }}>
          <PdfIcon sx={{ mr: 1 }} fontSize="small" />
          Open PDF
        </MenuItem>
        <MenuItem
          onClick={() => { handleRemovePdf(selectedPdf.id); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Remove from Hub
        </MenuItem>
      </Menu>

      {/* Add PDF Dialog */}
      <Dialog
        open={addPdfDialogOpen}
        onClose={() => setAddPdfDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add PDF to Hub</DialogTitle>
        <DialogContent>
          {availablePdfs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              All your PDFs are already in this hub!
            </Typography>
          ) : (
            <List>
              {availablePdfs.map((pdf) => (
                <ListItem
                  key={pdf.id}
                  secondaryAction={
                    <Button size="small" onClick={() => handleAddPdf(pdf.id)}>
                      Add
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded">
                      <PdfIcon color="error" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={pdf.name}
                    secondary={`${pdf.totalPages} pages`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPdfDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LearningHubView;

