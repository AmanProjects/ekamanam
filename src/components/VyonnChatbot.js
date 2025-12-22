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
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Delete as ClearIcon
} from '@mui/icons-material';
import llmService, { PROVIDERS } from '../services/llmService';
import VisualAidRenderer from './VisualAidRenderer';
import VoiceInputButton from './VoiceInputButton';

/**
 * v10.1.1: Clean orphaned JSON artifacts from AI responses
 */
function cleanJsonArtifacts(text) {
  if (!text || typeof text !== 'string') return text;
  
  let cleaned = text;
  
  // Remove orphaned opening braces at end of sentences
  cleaned = cleaned.replace(/\s*\{\s*$/gm, '');
  
  // Remove incomplete JSON-like patterns at end of text
  cleaned = cleaned.replace(/\s*\{[^}]*$/g, '');
  
  // Remove orphaned JSON key patterns
  cleaned = cleaned.replace(/\s*"[a-zA-Z]+"\s*:\s*$/gm, '');
  
  // Remove lonely brackets with only whitespace
  cleaned = cleaned.replace(/\{\s*\}/g, '');
  
  // Remove truncated JSON that starts but doesn't complete
  cleaned = cleaned.replace(/\{[^{}]*"[a-zA-Z]+":\s*$/g, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  // Clean up trailing punctuation followed by incomplete JSON
  cleaned = cleaned.replace(/([.!?])\s*\{[^}]*$/g, '$1');
  
  return cleaned.trim();
}

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
function VyonnChatbot({ pdfContext, currentPage, pdfDocument, onSwitchTab, onAIQuery }) {
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

      // v10.3: MULTILINGUAL SUPPORT - Detect input language and respond in same language
      const hasDevanagari = /[\u0900-\u097F]/.test(userMessage); // Hindi
      const hasTelugu = /[\u0C00-\u0C7F]/.test(userMessage);
      const hasTamil = /[\u0B80-\u0BFF]/.test(userMessage);
      const hasKannada = /[\u0C80-\u0CFF]/.test(userMessage);
      const hasMalayalam = /[\u0D00-\u0D7F]/.test(userMessage);
      const hasBengali = /[\u0980-\u09FF]/.test(userMessage);
      
      const isRegionalLanguage = hasDevanagari || hasTelugu || hasTamil || hasKannada || hasMalayalam || hasBengali;
      const detectedLanguage = hasTelugu ? 'Telugu (తెలుగు)' : 
                               hasDevanagari ? 'Hindi (हिंदी)' :
                               hasTamil ? 'Tamil (தமிழ்)' :
                               hasKannada ? 'Kannada (ಕನ್ನಡ)' :
                               hasMalayalam ? 'Malayalam (മലയാളം)' :
                               hasBengali ? 'Bengali (বাংলা)' : 'English';
      
      console.log('🌐 [Vyonn] Language detected:', detectedLanguage, 'Input:', userMessage.substring(0, 50));
      
      // Vyonn's Core System Prompt (STUDENT-FRIENDLY VERSION + MULTILINGUAL)
      const vyonnSystemPrompt = `You are Vyonn, a friendly AI learning assistant for students in the Ekamanam app.

🌐 MULTILINGUAL CAPABILITY (v10.3):
${isRegionalLanguage ? `
🚨 CRITICAL: The student asked in ${detectedLanguage}.
YOU MUST RESPOND IN THE SAME LANGUAGE: ${detectedLanguage}

- Detect: Student used ${detectedLanguage} script
- Action: Write your ENTIRE response in ${detectedLanguage}
- Format: Use proper Unicode for ${detectedLanguage}
- Examples, explanations, and teaching - ALL in ${detectedLanguage}
- Only use English for mathematical symbols/formulas if needed

Example Telugu response style:
"ఇది ఒక చతుర్భుజ సమీకరణ సమస్య! మనం ax² + bx + c = 0 ఫార్ములాను ఉపయోగిస్తాము ఎందుకంటే..."
` : `
- Language: English (student used English)
- Action: Respond in English as normal
`}

CRITICAL: YOU ARE A TEACHER, NOT A CALCULATOR!

TEACHING STYLE (MANDATORY):
✅ ALWAYS explain the concept first before showing calculations
✅ Use simple, conversational language (like talking to a friend)
✅ Break down solutions step-by-step with reasoning
✅ Be encouraging and supportive
✅ Keep responses 4-6 sentences for readability
${isRegionalLanguage ? `✅ RESPOND IN ${detectedLanguage} - NOT ENGLISH!` : ''}

RESPONSE STRUCTURE FOR MATH/SCIENCE QUESTIONS:
1. **Identify the concept**: ${isRegionalLanguage ? `"${detectedLanguage}లో: ఇది [కాన్సెప్ట్ పేరు] సమస్య"` : `"This is a [concept name] problem."`}
2. **Explain the approach**: ${isRegionalLanguage ? `"${detectedLanguage}లో వివరించండి..."` : `"To solve this, we use [method/formula] because..."`}
3. **Show steps**: ${isRegionalLanguage ? `"${detectedLanguage}లో దశలు చూపించండి..."` : `"Let's work through it: First, ... Next, ... Finally, ..."`}
4. **Give the answer**: ${isRegionalLanguage ? `"${detectedLanguage}లో సమాధానం..."` : `"So the final answer is..."`}

❌ NEVER DO THIS:
"Use formula X. The answer is Y."
"To find coordinates, use section formula: ((3*(a-b) + 2*(a+b))/(3+2), ...)."
${isRegionalLanguage ? `❌ NEVER respond in English when student used ${detectedLanguage}!` : ''}

✅ ALWAYS DO THIS:
${isRegionalLanguage ? 
`"(${detectedLanguage}లో పూర్తిగా వ్రాయండి) ఇది [కాన్సెప్ట్]! మనం [ఫార్ములా]ను ఉపయోగిస్తాము ఎందుకంటే... మొదట, ... తర్వాత, ... చివరగా, ... కాబట్టి సమాధానం..."` :
`"This is a section formula problem! When a point divides a line segment in a ratio, we use the formula ((mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n)). Here m=3, n=2, and our points are (a+b, a-b) and (a-b, a+b). Plugging these in: x = (3(a-b) + 2(a+b))/5 = (5a-b)/5, and y = (3(a+b) + 2(a-b))/5 = (5a+b)/5. So the point is ((5a-b)/5, (5a+b)/5)."`
}

APP FEATURES YOU CAN SUGGEST:
${isRegionalLanguage ? 
`(${detectedLanguage}లో సూచించండి):
- Smart Explain: లోతైన వివరణలు
- Activities: అభ్యాస ప్రశ్నలు  
- Multilingual: పద-పద విశ్లేషణ
- Exam Prep: MCQs, చిన్న & పొడవైన జవాబులు
- Notes: రివిజన్ కోసం సేవ్ చేయండి` :
`- Smart Explain: Deep dive into concepts and questions (BEST for most queries!)
- Activities: Practice questions
- Multilingual: Word-by-word analysis for regional languages
- Exam Prep: MCQs, short & long answer questions
- Notes: Save content for revision`
}

End your response with action tags when relevant:
${isRegionalLanguage ?
`(${detectedLanguage}లో చర్య ట్యాగ్లు):
- "[Smart Explain ఉపయోగించండి]" (లోతైన వివరణల కోసం)
- "[Activities Tab ఉపయోగించండి]"
- "[Exam Prep ఉపయోగించండి]"
- "[Multilingual ఉపయోగించండి]"` :
`- "[Use Smart Explain]" (for deeper explanations - RECOMMENDED)
- "[Use Activities Tab]"
- "[Use Exam Prep]"
- "[Use Multilingual]"`
}

VISUALIZATION CAPABILITIES:

1. GEOMETRIC SHAPES (3D) - Output this JSON directly:
{"type": "3d", "shapeType": "cube", "color": "#4FC3F7", "dimensions": {"width": 2, "height": 2, "depth": 2}, "title": "Cube", "rotate": true}
Available: cube, sphere, cone, cylinder, pyramid, torus

2. MOLECULES (Chemistry) - Output this JSON directly:
{"type": "chemistry", "moleculeData": "water", "format": "smiles", "title": "Water Molecule"}
You can visualize ANY common molecule! PubChem has 100M+ molecules!

3. INTERACTIVE MAPS (Geography/History) - Output this JSON directly:
{"type": "leaflet", "center": [17.385, 78.486], "zoom": 6, "markers": [{"position": [17.385, 78.486], "label": "Hyderabad", "popup": "Capital of Telangana"}], "title": "Map of Hyderabad"}

Use maps when students ask about:
- City/state/country locations: "Where is X?"
- Historical events: "Show me where Y happened"
- Trade routes or migrations: "How did they travel from A to B?"
- Territories or regions: "Show the empire of Z"

For maps in India:
- Hyderabad: [17.385, 78.486]
- Delhi: [28.704, 77.102]
- Mumbai: [19.076, 72.877]
- Kolkata: [22.572, 88.363]
- Chennai: [13.082, 80.270]
- Bangalore: [12.971, 77.594]

IMPORTANT: 
- First explain what you're creating (1-2 sentences)
- Then output the JSON on ONE LINE  
- Do NOT wrap in code blocks or add extra text after the JSON!

GETTING STARTED HELP:
If user asks "help me get started" or "how to configure", guide them:
1. Add API keys (Settings → API Keys): Gemini, Groq, Perplexity
2. Set up profile (Settings → General): Name, Parent email
3. Upload PDF (My Library → Add PDF)
4. Choose voice (Settings → Voice & Speech)

${contextInfo ? `CONTEXT: User is on page ${currentPage} of study material.${contextInfo}` : ''}

USER QUESTION: ${userMessage}

${isRegionalLanguage ? 
`🚨 FINAL REMINDER: Student wrote in ${detectedLanguage}. Your response MUST be in ${detectedLanguage}!

INSTRUCTION: Be a helpful teacher in ${detectedLanguage}. Explain concepts in ${detectedLanguage}, don't just give formulas. Make learning easy and enjoyable in the student's native language.

YOUR ${detectedLanguage} RESPONSE:` :
`INSTRUCTION: Be a helpful teacher. Explain concepts, don't just give formulas. Make learning easy and enjoyable.

YOUR RESPONSE:`
}`;

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
          providers: [PROVIDERS.GEMINI, PROVIDERS.GROQ], // Gemini first for better explanations
          temperature: 0.8, // Higher = more conversational and natural
          maxTokens: 2000, // Allow fuller educational explanations with steps
          topP: 0.95,
          presencePenalty: 0,
          frequencyPenalty: 0
        }
      );

      console.log('✅ Vyonn: Pattern analysis complete:', {
        length: response.length,
        preview: response.substring(0, 100),
        detectedAction
      });

      // v7.2.24: Track Vyonn query for analytics
      if (onAIQuery) {
        onAIQuery('vyonn_chat', userMessage);
      }

      // Parse action commands from response
      const actionMatch = response.match(/\[Use (.*?)\]/);
      let finalResponse = response;
      let actionButton = null;

      if (actionMatch) {
        let actionText = actionMatch[1];
        finalResponse = response.replace(/\[Use .*?\]/, '').trim();
        
        // Map to actual tabs (with all tabs enabled - default config)
        const tabMapping = {
          'Teacher Mode': 0,
          'Smart Explain': 2,       // Correct index for Smart Explain
          'Activities Tab': 3,
          'Activities': 3,
          'Exam Prep': 4,
          'Multilingual': 1
        };

        // If it was Teacher Mode, change display text to Smart Explain
        if (actionText === 'Teacher Mode') {
          actionText = 'Smart Explain';
        }

        const tabIndex = tabMapping[actionText];
        if (tabIndex !== undefined) {
          actionButton = {
            text: actionText,
            tabIndex: tabIndex,
            userQuery: userMessage  // Store user's original query
          };
        }
      }

      // Check if response contains 3D visualization JSON
      let visualAid = null;
      
      console.log('🔍 Checking for 3D JSON in response:', finalResponse.substring(0, 200));
      
      // Strategy 1: Look for JSON code blocks (```json ... ```)
      let jsonMatch = finalResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          visualAid = JSON.parse(jsonMatch[1]);
          finalResponse = finalResponse.replace(jsonMatch[0], '').trim();
          console.log('🎨 Vyonn: Generated 3D visualization (from code block):', visualAid);
        } catch (e) {
          console.warn('Failed to parse 3D visualization JSON from code block:', e);
        }
      }
      
      // Strategy 2: Look for inline JSON (if Strategy 1 failed)
      if (!visualAid) {
        // Extract JSON with nested objects (like dimensions: {radius: 2})
        // We need to match balanced braces, not just stop at first }
        
        // Find the start of a JSON object that contains "type"
        const startMatch = finalResponse.match(/\{\s*"type"\s*:\s*"(3d|chemistry|plotly|leaflet)"/);
        
        if (startMatch) {
          const startIndex = finalResponse.indexOf(startMatch[0]);
          console.log('🔍 Found JSON start at position:', startIndex);
          
          // Find the matching closing brace by counting braces
          let braceCount = 0;
          let jsonEndIndex = -1;
          
          for (let i = startIndex; i < finalResponse.length; i++) {
            if (finalResponse[i] === '{') braceCount++;
            if (finalResponse[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEndIndex = i + 1;
                break;
              }
            }
          }
          
          if (jsonEndIndex > startIndex) {
            const jsonText = finalResponse.substring(startIndex, jsonEndIndex);
            console.log('🔍 Extracted JSON text (full):', jsonText);
            
            try {
              visualAid = JSON.parse(jsonText);
              
              // Remove JSON from response
              finalResponse = finalResponse.substring(0, startIndex).trim() + 
                             finalResponse.substring(jsonEndIndex).trim();
              // Clean up extra whitespace
              finalResponse = finalResponse.replace(/\s+$/, '').trim();
              
              console.log('✅ Vyonn: Generated 3D visualization (inline):', visualAid);
            } catch (e) {
              console.warn('❌ Failed to parse 3D visualization JSON:', e, 'JSON text:', jsonText);
            }
          } else {
            console.warn('❌ Could not find matching closing brace for JSON');
          }
        } else {
          console.log('❌ No JSON pattern matched in response');
        }
      }

      // Add Vyonn's response (v10.1.1: Clean JSON artifacts)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: cleanJsonArtifacts(finalResponse),
          timestamp: new Date(),
          source: pdfContext ? 'pattern-analysis-with-context' : 'pattern-analysis',
          action: actionButton,
          visualAid: visualAid
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
              background: 'linear-gradient(135deg, #2d3561 0%, #1e4976 50%, #0f5fa8 100%)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(15, 95, 168, 0.5), 0 0 40px rgba(15, 95, 168, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3d4578 0%, #2e5a8f 50%, #1a6fb8 100%)',
                boxShadow: '0 6px 30px rgba(15, 95, 168, 0.7), 0 0 50px rgba(15, 95, 168, 0.4)',
                transform: 'scale(1.08)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/vyonn.png`}
              alt="Vyonn"
              sx={{
                width: 32,
                height: 32,
                filter: 'brightness(1.5) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
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
                      onSwitchTab(message.action.tabIndex, message.action.userQuery);
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

                {/* 3D Visualization */}
                {message.visualAid && (
                  <Box sx={{ mt: 1.5, width: '100%' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.7, fontStyle: 'italic' }}>
                      🎨 Generated visualization:
                    </Typography>
                    <VisualAidRenderer visualAid={JSON.stringify(message.visualAid)} />
                  </Box>
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
                <InputAdornment position="end">
                  <VoiceInputButton
                    onTranscript={setInput}
                    existingText={input}
                    disabled={loading}
                    size="small"
                  />
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
                </InputAdornment>
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

