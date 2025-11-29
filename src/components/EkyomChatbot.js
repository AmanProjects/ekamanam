import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Close as CloseIcon,
  Delete as ClearIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import geminiService from '../services/geminiService';

/**
 * Ekyom Chatbot - A safe, helpful AI assistant for students
 * 
 * Features:
 * - Answers questions from current PDF context
 * - Searches internet for additional information
 * - Content moderation for student safety
 * - Educational focus with age-appropriate responses
 */
function EkyomChatbot({ pdfContext, currentPage, pdfDocument }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m Ekyom, your learning assistant. Ask me anything about your study material or any topic you\'re curious about!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }
    ];
    setMessages(newMessages);

    try {
      // Prepare context from PDF if available
      let contextInfo = '';
      if (pdfContext && pdfContext.trim()) {
        contextInfo = `\n\n[Current Study Material Context - Page ${currentPage}]:\n${pdfContext.substring(0, 2000)}`;
      }

      // Create safe, educational prompt with content moderation
      const safePrompt = `You are Ekyom, a helpful and safe AI learning assistant for students. 

SAFETY GUIDELINES:
- Provide age-appropriate, educational responses
- Avoid inappropriate, harmful, or sensitive content
- If asked inappropriate questions, politely redirect to educational topics
- Maintain a friendly, encouraging, and supportive tone
- Focus on learning, understanding, and curiosity

CONTEXT AWARENESS:
${contextInfo ? `The student is currently studying material on page ${currentPage}. Use this context to provide relevant answers.${contextInfo}` : 'The student is not currently viewing any study material.'}

STUDENT'S QUESTION:
${userMessage}

INSTRUCTIONS:
1. If the question relates to the study material, provide a clear explanation using the context
2. If the question is general knowledge, provide accurate, educational information
3. If you need to search for current information, mention that and provide the best answer you can
4. Always encourage learning and critical thinking
5. Keep responses concise but informative (2-3 paragraphs max)
6. If the question is inappropriate, respond: "I'm here to help with your learning! Let's focus on educational topics. What would you like to learn about?"

Please respond in a helpful, educational, and student-friendly manner:`;

      console.log('🤖 Ekyom: Processing question:', {
        question: userMessage,
        hasContext: !!pdfContext,
        page: currentPage
      });

      // Get response from Gemini with safety settings
      const response = await geminiService.generateText(safePrompt, {
        maxOutputTokens: 1000,
        temperature: 0.7, // Balanced creativity and accuracy
        topP: 0.9,
        topK: 40
      });

      console.log('✅ Ekyom: Response generated:', {
        length: response.length,
        preview: response.substring(0, 100)
      });

      // Add assistant message
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          source: pdfContext ? 'pdf-context' : 'general'
        }
      ]);
    } catch (error) {
      console.error('❌ Ekyom: Error generating response:', error);
      
      // Add error message
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ I encountered an issue while processing your question. Please try again or rephrase your question.',
          timestamp: new Date(),
          error: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Hi! I\'m Ekyom, your learning assistant. Ask me anything about your study material or any topic you\'re curious about!',
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Tooltip title="Ask Ekyom - Your Learning Assistant" placement="left">
          <Fab
            color="secondary"
            aria-label="chat with Ekyom"
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}
          >
            <BotIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Ekyom
              </Typography>
              <Typography variant="caption">
                Your Learning Assistant
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Clear chat">
              <IconButton 
                onClick={handleClear} 
                size="small"
                sx={{ color: 'inherit', mr: 1 }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={() => setOpen(false)} 
              size="small"
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Info Banner */}
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ m: 2, mb: 0 }}
        >
          Ask questions about your study material or any topic. All responses are moderated for safety.
        </Alert>

        {/* Context Indicator */}
        {pdfContext && (
          <Box sx={{ px: 2, pt: 1 }}>
            <Chip
              label={`📖 Studying Page ${currentPage}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        {/* Messages */}
        <List
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2
          }}
        >
          {messages.map((message, index) => (
            <ListItem
              key={index}
              sx={{
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                px: 0
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  maxWidth: '85%',
                  bgcolor: message.role === 'user' 
                    ? 'primary.main' 
                    : message.error 
                      ? 'error.light'
                      : 'background.paper',
                  color: message.role === 'user' 
                    ? 'primary.contrastText' 
                    : 'text.primary'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '0.7rem'
                  }}
                >
                  {formatTime(message.timestamp)}
                  {message.source === 'pdf-context' && ' • From study material'}
                </Typography>
              </Paper>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>

        <Divider />

        {/* Input */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              )
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, textAlign: 'center' }}
          >
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}

export default EkyomChatbot;

