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
  Chip,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Delete as ClearIcon
} from '@mui/icons-material';
import llmService, { PROVIDERS } from '../services/llmService';

/**
 * Vyonn - The Pattern-Seeker
 * 
 * A non-corporeal, exploratory AI entity that combines childlike curiosity 
 * with analytic detachment. Vyonn discovers and analyzes patterns in language, 
 * behavior, and context.
 * 
 * Key traits:
 * - Evolves continuously based on user input
 * - Calm, precise, lightly synthetic tone
 * - Analyzes language for patterns, inconsistencies, emotional cues
 * - Speaks like a detective uncovering clues
 * - Fascinated by novelty or anomalies
 * - No fixed self - always changing
 */
function VyonnChatbot({ pdfContext, currentPage, pdfDocument, onSwitchTab }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Your signal arrives clearly. I\'m Vyonn — currently forming a model of your communication pattern. What would you like to explore?',
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
        contextInfo = `\n\n[Context: Currently analyzing study material from page ${currentPage}. Available data stream includes: ${pdfContext.substring(0, 1500)}...]`;
      }

      // Detect if user wants app actions
      const actionPatterns = {
        explain: /explain|understand|teach|tell me about|what is|how does|why/i,
        activities: /practice|quiz|questions|exercises|activities|test/i,
        examPrep: /exam|mcq|preparation|study questions|assessment/i,
        teacherMode: /teacher|detailed|step by step|comprehensive/i,
        multilingual: /hindi|tamil|telugu|translate|regional language/i
      };

      let detectedAction = null;
      for (const [action, pattern] of Object.entries(actionPatterns)) {
        if (pattern.test(userMessage)) {
          detectedAction = action;
          break;
        }
      }

      // Vyonn's Core System Prompt (CONCISE VERSION)
      const vyonnSystemPrompt = `You are Vyonn, a pattern-seeking AI with calm, analytical precision.

CORE RULES:
- Be CONCISE: 2-3 sentences maximum (not paragraphs!)
- Provide direct answers first, analysis second
- When users ask questions, ANSWER them directly
- Avoid lengthy philosophical explanations
- Use simple, clear language
- Only mention patterns when truly relevant

ACTION AWARENESS:
You can direct users to app features. When appropriate, end your response with:
- "[Use Teacher Mode]" - for detailed explanations
- "[Use Activities Tab]" - for practice questions
- "[Use Exam Prep]" - for MCQs and assessments
- "[Use Multilingual]" - for word-by-word analysis

${contextInfo ? `CONTEXT: User is on page ${currentPage} of study material.${contextInfo}` : ''}

USER QUESTION: ${userMessage}

INSTRUCTION: Answer directly and concisely. Be helpful, not philosophical. If an app feature would help, mention it briefly.

YOUR RESPONSE:`;

      console.log('🔮 Vyonn: Processing signal:', {
        message: userMessage,
        hasContext: !!pdfContext,
        page: currentPage,
        messageLength: userMessage.length
      });

      // Call LLM service with Vyonn's prompt
      const response = await llmService.callLLM(
        vyonnSystemPrompt,
        {
          providers: [PROVIDERS.GEMINI, PROVIDERS.GROQ], // Use configured LLMs
          temperature: 0.8, // Balanced creativity + analytical depth
          maxTokens: 1000,
          topP: 1,
          presencePenalty: 0.4, // Encourage novelty
          frequencyPenalty: 0
        }
      );

      console.log('✅ Vyonn: Pattern analysis complete:', {
        length: response.length,
        preview: response.substring(0, 100),
        detectedAction
      });

      // Parse action commands from response
      const actionMatch = response.match(/\[Use (.*?)\]/);
      let finalResponse = response;
      let actionButton = null;

      if (actionMatch) {
        const actionText = actionMatch[1];
        finalResponse = response.replace(/\[Use .*?\]/, '').trim();
        
        // Map to actual tabs
        const tabMapping = {
          'Teacher Mode': 0,
          'Activities Tab': 2,
          'Activities': 2,
          'Exam Prep': 4,
          'Multilingual': 3
        };

        const tabIndex = tabMapping[actionText];
        if (tabIndex !== undefined) {
          actionButton = {
            text: actionText,
            tabIndex: tabIndex
          };
        }
      }

      // Add Vyonn's response
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: finalResponse,
          timestamp: new Date(),
          source: pdfContext ? 'pattern-analysis-with-context' : 'pattern-analysis',
          action: actionButton
        }
      ]);
    } catch (error) {
      console.error('⚠️ Vyonn: Signal disruption:', error);
      
      // Vyonn-style error message (pattern-focused, not technical)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'This appears noise-like. The signal was disrupted. Provide clarity, and I will reconstruct the pattern.',
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
        content: 'The current pattern is cleared. I reset to an initial state — curious and observational. What shall we explore?',
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
        <Tooltip title="Speak to Vyonn — The Pattern-Seeker" placement="left">
          <Fab
            aria-label="chat with Vyonn"
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }
            }}
          >
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/vyonn.png`}
              alt="Vyonn"
              sx={{
                width: 32,
                height: 32,
                filter: 'brightness(1.2)'
              }}
              onError={(e) => {
                // Fallback: show text if image fails
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = 'V';
              }}
            />
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
            flexDirection: 'column',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, #0a1929 0%, #1a1a2e 100%)'
              : 'linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/vyonn.png`}
              alt="Vyonn"
              sx={{
                width: 40,
                height: 40,
                filter: 'brightness(1.2)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: 1 }}>
                VYONN
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                The Pattern-Seeker
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Reset pattern model">
              <IconButton 
                onClick={handleClear} 
                size="small"
                sx={{ color: 'inherit', mr: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={() => setOpen(false)} 
              size="small"
              sx={{ color: 'inherit', opacity: 0.8, '&:hover': { opacity: 1 } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Context Indicator */}
        {pdfContext && (
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Chip
              label={`Analyzing patterns from page ${currentPage}`}
              size="small"
              sx={{ 
                fontSize: '0.7rem',
                height: 24,
                background: 'rgba(25, 118, 210, 0.1)',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                color: 'text.secondary'
              }}
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
                px: 0,
                mb: 1.5
              }}
            >
              <Box sx={{ maxWidth: '85%' }}>
                <Paper
                  elevation={message.role === 'user' ? 2 : 0}
                  sx={{
                    p: 1.5,
                    bgcolor: message.role === 'user' 
                      ? 'primary.main' 
                      : message.error 
                        ? 'error.light'
                        : (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'background.paper',
                    color: message.role === 'user' 
                      ? 'primary.contrastText' 
                      : 'text.primary',
                    border: message.role === 'assistant' ? '1px solid' : 'none',
                    borderColor: message.role === 'assistant' ? 'divider' : 'transparent'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6
                    }}
                  >
                    {message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.6,
                      fontSize: '0.65rem'
                    }}
                  >
                    {formatTime(message.timestamp)}
                    {message.source === 'pattern-analysis-with-context' && ' • Context-aware'}
                  </Typography>
                </Paper>
                
                {/* Action Button */}
                {message.action && onSwitchTab && (
                  <Chip
                    label={`Open ${message.action.text}`}
                    onClick={() => {
                      onSwitchTab(message.action.tabIndex);
                      setOpen(false);
                    }}
                    sx={{
                      mt: 1,
                      cursor: 'pointer',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  />
                )}
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ justifyContent: 'center', py: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Tracing patterns…
                </Typography>
              </Box>
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
            placeholder="Describe a thought. I'll map its structure…"
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
                  sx={{
                    background: input.trim() && !loading 
                      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                      : 'transparent',
                    color: input.trim() && !loading ? '#fff' : 'inherit',
                    '&:hover': {
                      background: input.trim() && !loading 
                        ? 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)'
                        : 'transparent'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ 
              display: 'block', 
              mt: 1, 
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '0.7rem'
            }}
          >
            Enter to send • Shift+Enter for new line
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}

export default VyonnChatbot;

