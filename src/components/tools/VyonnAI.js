import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Psychology as VyonnIconMui
} from '@mui/icons-material';
import { callLLM } from '../../services/llmService';
import { markdownToHtml } from '../../utils/markdownRenderer';
import VoiceInputButton from '../VoiceInputButton';

/**
 * Vyonn AI - Standalone Chat Interface
 * Consistent with Chemistry/Math/Physics AI labs
 * v10.5.6
 */
function VyonnAI({ open, onClose, user }) {
  const [question, setQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m Vyonn, your AI learning assistant. I can help you with any subject - math, science, history, languages, and more. What would you like to learn about today?',
      timestamp: Date.now()
    }
  ]);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Ask Vyonn AI
  const askVyonnAI = async () => {
    if (!question.trim()) return;
    
    setAiLoading(true);
    const userQuestion = question;
    setQuestion('');
    
    const newHistory = [...chatHistory, {
      role: 'user',
      content: userQuestion,
      timestamp: Date.now()
    }];
    setChatHistory(newHistory);
    
    try {
      // Detect language
      const hasDevanagari = /[\u0900-\u097F]/.test(userQuestion);
      const hasTelugu = /[\u0C00-\u0C7F]/.test(userQuestion);
      const hasTamil = /[\u0B80-\u0BFF]/.test(userQuestion);
      const hasKannada = /[\u0C80-\u0CFF]/.test(userQuestion);
      const hasMalayalam = /[\u0D00-\u0D7F]/.test(userQuestion);
      const hasBengali = /[\u0980-\u09FF]/.test(userQuestion);
      
      const isRegionalLanguage = hasDevanagari || hasTelugu || hasTamil || hasKannada || hasMalayalam || hasBengali;
      const detectedLanguage = hasTelugu ? 'Telugu (తెలుగు)' : 
                               hasDevanagari ? 'Hindi (हिंदी)' :
                               hasTamil ? 'Tamil (தமிழ்)' :
                               hasKannada ? 'Kannada (ಕನ್ನಡ)' :
                               hasMalayalam ? 'Malayalam (മലയാളം)' :
                               hasBengali ? 'Bengali (বাংলা)' : 'English';
      
      const systemPrompt = `You are Vyonn, a friendly AI learning assistant for students.

${isRegionalLanguage ? `
🚨 CRITICAL: The student asked in ${detectedLanguage}.
YOU MUST RESPOND IN THE SAME LANGUAGE: ${detectedLanguage}

- Write your ENTIRE response in ${detectedLanguage}
- Use proper Unicode for ${detectedLanguage}
- Examples, explanations, teaching - ALL in ${detectedLanguage}
` : ''}

TEACHING STYLE:
✅ Explain concepts clearly and simply
✅ Use examples to illustrate ideas
✅ Break down complex topics step-by-step
✅ Be encouraging and supportive
✅ Keep responses concise (4-6 sentences)
${isRegionalLanguage ? `✅ RESPOND IN ${detectedLanguage} - NOT ENGLISH!` : ''}

For math/science questions:
1. Identify the concept
2. Explain the approach
3. Show steps clearly
4. Give the final answer

${isRegionalLanguage ? `Remember: Student used ${detectedLanguage}, so respond in ${detectedLanguage}!` : ''}`;

      const messages = newHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await callLLM(messages, systemPrompt);
      
      setChatHistory([...newHistory, {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('[Vyonn AI] Error:', error);
      setChatHistory([...newHistory, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try asking your question again.',
        timestamp: Date.now()
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askVyonnAI();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', bgcolor: '#f5f5f5' }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        bgcolor: '#6366f1',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img 
            src="/vyonn.png" 
            alt="Vyonn AI" 
            style={{ 
              height: '32px', 
              width: 'auto',
              filter: 'brightness(2) saturate(0) contrast(10)'
            }} 
          />
          <Typography variant="h6" fontWeight={600}>
            Vyonn AI Assistant
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Chat Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {chatHistory.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 1
              }}
            >
              {msg.role === 'assistant' && (
                <Avatar sx={{ bgcolor: '#6366f1', width: 40, height: 40 }}>
                  <img 
                    src="/vyonn.png" 
                    alt="Vyonn" 
                    style={{ 
                      height: '24px', 
                      width: 'auto',
                      filter: 'brightness(2) saturate(0) contrast(10)'
                    }} 
                  />
                </Avatar>
              )}
              
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.role === 'user' ? '#6366f1' : 'white',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                />
              </Paper>
              
              {msg.role === 'user' && user && (
                <Avatar 
                  src={user.photoURL} 
                  alt={user.displayName}
                  sx={{ width: 40, height: 40 }}
                >
                  {user.displayName?.[0]}
                </Avatar>
              )}
            </Box>
          ))}
          
          {aiLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#6366f1', width: 40, height: 40 }}>
                <img 
                  src="/vyonn.png" 
                  alt="Vyonn" 
                  style={{ 
                    height: '24px', 
                    width: 'auto',
                    filter: 'brightness(2) saturate(0) contrast(10)'
                  }} 
                />
              </Avatar>
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
          
          <div ref={chatEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'white',
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask me anything... (supports voice input & multilingual)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={aiLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <VoiceInputButton
                    onTranscript={setQuestion}
                    existingText={question}
                    disabled={aiLoading}
                    size="small"
                  />
                  <IconButton
                    onClick={askVyonnAI}
                    disabled={!question.trim() || aiLoading}
                    color="primary"
                    sx={{
                      bgcolor: question.trim() && !aiLoading ? '#6366f1' : 'transparent',
                      color: question.trim() && !aiLoading ? 'white' : 'inherit',
                      '&:hover': {
                        bgcolor: question.trim() && !aiLoading ? '#5558e3' : 'transparent'
                      }
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f5f5f5'
              }
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, textAlign: 'center' }}
          >
            Press Enter to send • Shift+Enter for new line • Click mic for voice input
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

export default VyonnAI;

