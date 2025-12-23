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
 * v10.5.6: Connected to all lab tools
 */
function VyonnAI({ open, onClose, user, onOpenTool }) {
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
      
      const systemPrompt = `You are Vyonn, a friendly AI learning assistant for students in the Ekamanam app.

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

🎓 INTERACTIVE TOOLS YOU CAN SUGGEST:
When relevant, recommend these specialized tools to students:

📐 **Math Lab** - For: algebra, calculus, geometry, trigonometry, probability, statistics, graphing, matrices
   Tools: Quadratic solver, Pythagorean visualizer, trigonometry, matrix calculator, probability games, graph plotter

🧪 **Chemistry Lab** - For: molecules, periodic table, chemical reactions, bonding, acids/bases, organic chemistry
   Tools: 3D molecules, periodic table explorer, equation balancer, reaction simulator

⚡ **Physics Lab** - For: forces, motion, gravity, circuits, electricity, magnetism, waves, optics
   Tools: Physics simulator, circuit builder, force diagrams, projectile motion

💻 **Code Editor** - For: programming, coding, JavaScript, Python, HTML, CSS, algorithms
   Tools: Monaco editor with live preview, syntax highlighting, code execution

🌍 **Globe Explorer** - For: geography, countries, capitals, continents, maps, locations, world landmarks
   Tools: Interactive 3D globe, country information, world exploration

HOW TO SUGGEST TOOLS:
${isRegionalLanguage ? `
- After explaining the concept in ${detectedLanguage}, add:
  "[Use Math Lab]" or "[Use Chemistry Lab]" etc.
- Example: "...కాబట్టి సమాధానం x = 5. [Use Math Lab]"
` : `
- After your explanation, add one of these action tags:
  [Use Math Lab] or [Use Chemistry Lab] or [Use Physics Lab] or [Use Code Editor] or [Use Globe Explorer]
- Example: "To solve quadratic equations like this, you use the formula... The answer is x = 5. [Use Math Lab]"
`}

${isRegionalLanguage ? `Remember: Student used ${detectedLanguage}, so respond in ${detectedLanguage}!` : ''}`;

      // Build conversation context from history
      let conversationContext = '';
      if (newHistory.length > 1) {
        const recentHistory = newHistory.slice(-4); // Last 4 messages for context
        conversationContext = recentHistory.map(msg => 
          `${msg.role === 'user' ? 'Student' : 'Vyonn'}: ${msg.content}`
        ).join('\n\n');
      }
      
      const fullPrompt = conversationContext 
        ? `${systemPrompt}\n\nConversation so far:\n${conversationContext}\n\nRespond to the student's latest question naturally.`
        : `${systemPrompt}\n\nStudent's question: ${userQuestion}`;
      
      const response = await callLLM(fullPrompt, { 
        feature: 'general', 
        temperature: 0.7, 
        maxTokens: 2048 
      });
      
      // Detect suggested tools
      const toolSuggestions = {
        math: /\[Use Math Lab\]/i.test(response),
        chemistry: /\[Use Chemistry Lab\]/i.test(response),
        physics: /\[Use Physics Lab\]/i.test(response),
        code: /\[Use Code Editor\]/i.test(response),
        globe: /\[Use Globe Explorer\]/i.test(response)
      };
      
      // Remove action tags from display
      let cleanResponse = response || "Let me help you understand that!";
      cleanResponse = cleanResponse.replace(/\[Use Math Lab\]/gi, '');
      cleanResponse = cleanResponse.replace(/\[Use Chemistry Lab\]/gi, '');
      cleanResponse = cleanResponse.replace(/\[Use Physics Lab\]/gi, '');
      cleanResponse = cleanResponse.replace(/\[Use Code Editor\]/gi, '');
      cleanResponse = cleanResponse.replace(/\[Use Globe Explorer\]/gi, '');
      
      setChatHistory([...newHistory, {
        role: 'assistant',
        content: cleanResponse.trim(),
        toolSuggestions,
        contextForTool: {
          question: userQuestion,
          vyonnResponse: cleanResponse.trim(),
          conversationHistory: newHistory.slice(-3) // Last 3 messages for context
        },
        timestamp: Date.now()
      }]);
    } catch (error) {
      // Fallback - always show helpful message
      setChatHistory([...newHistory, {
        role: 'assistant',
        content: "I'm here to help! Could you rephrase your question or try asking about a specific topic?",
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
        bgcolor: '#37474f',
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
                <Avatar sx={{ bgcolor: '#37474f', width: 40, height: 40 }}>
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
              
              <Box sx={{ maxWidth: '70%' }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: msg.role === 'user' ? '#546e7a' : 'white',
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
                
                {/* Tool Suggestions */}
                {msg.toolSuggestions && msg.role === 'assistant' && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {msg.toolSuggestions.math && (
                      <Chip
                        icon={<Typography fontSize="0.9rem">📐</Typography>}
                        label="Open Math Lab"
                        onClick={() => {
                          onClose();
                          if (onOpenTool) onOpenTool('math', msg.contextForTool);
                        }}
                        clickable
                        size="small"
                        sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#1565c0' } }}
                      />
                    )}
                    {msg.toolSuggestions.chemistry && (
                      <Chip
                        icon={<Typography fontSize="0.9rem">🧪</Typography>}
                        label="Open Chemistry Lab"
                        onClick={() => {
                          onClose();
                          if (onOpenTool) onOpenTool('chemistry', msg.contextForTool);
                        }}
                        clickable
                        size="small"
                        sx={{ bgcolor: '#4caf50', color: 'white', '&:hover': { bgcolor: '#388e3c' } }}
                      />
                    )}
                    {msg.toolSuggestions.physics && (
                      <Chip
                        icon={<Typography fontSize="0.9rem">⚡</Typography>}
                        label="Open Physics Lab"
                        onClick={() => {
                          onClose();
                          if (onOpenTool) onOpenTool('physics', msg.contextForTool);
                        }}
                        clickable
                        size="small"
                        sx={{ bgcolor: '#6c5ce7', color: 'white', '&:hover': { bgcolor: '#5a4fd4' } }}
                      />
                    )}
                    {msg.toolSuggestions.code && (
                      <Chip
                        icon={<Typography fontSize="0.9rem">💻</Typography>}
                        label="Open Code Editor"
                        onClick={() => {
                          onClose();
                          if (onOpenTool) onOpenTool('code', msg.contextForTool);
                        }}
                        clickable
                        size="small"
                        sx={{ bgcolor: '#2d3436', color: 'white', '&:hover': { bgcolor: '#1e272e' } }}
                      />
                    )}
                    {msg.toolSuggestions.globe && (
                      <Chip
                        icon={<Typography fontSize="0.9rem">🌍</Typography>}
                        label="Open Globe Explorer"
                        onClick={() => {
                          onClose();
                          if (onOpenTool) onOpenTool('globe', msg.contextForTool);
                        }}
                        clickable
                        size="small"
                        sx={{ bgcolor: '#0984e3', color: 'white', '&:hover': { bgcolor: '#0770c9' } }}
                      />
                    )}
                  </Box>
                )}
              </Box>
              
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
              <Avatar sx={{ bgcolor: '#37474f', width: 40, height: 40 }}>
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
                      bgcolor: question.trim() && !aiLoading ? '#546e7a' : 'transparent',
                      color: question.trim() && !aiLoading ? 'white' : 'inherit',
                      '&:hover': {
                        bgcolor: question.trim() && !aiLoading ? '#455a64' : 'transparent'
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

