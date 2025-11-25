import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School as TeacherIcon,
  Lightbulb as ExplainIcon,
  Sports as ActivitiesIcon,
  Note as NotesIcon,
  VolumeUp,
  Stop
} from '@mui/icons-material';
import { generateExplanation, generateTeacherMode, generateActivities } from '../services/geminiService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-mode-tabpanel-${index}`}
      aria-labelledby={`ai-mode-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>{children}</Box>}
    </div>
  );
}

function AIModePanel({ currentPage, selectedText, pageText, user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacherResponse, setTeacherResponse] = useState('');
  const [explainResponse, setExplainResponse] = useState('');
  const [activitiesResponse, setActivitiesResponse] = useState('');
  const [notes, setNotes] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTeacherMode = async () => {
    if (!pageText) {
      setError('No page content available. Please load a PDF page first.');
      return;
    }

    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await generateTeacherMode(pageText, apiKey);
      setTeacherResponse(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainText = async () => {
    if (!selectedText) {
      setError('Please select text from the PDF first');
      return;
    }

    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await generateExplanation(selectedText, pageText, apiKey);
      setExplainResponse(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActivities = async () => {
    if (!pageText) {
      setError('No page content available. Please load a PDF page first.');
      return;
    }

    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await generateActivities(pageText, apiKey);
      setActivitiesResponse(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const formatMarkdown = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('###')) {
        return <Typography key={i} variant="h6" gutterBottom fontWeight={600}>{line.replace(/^###\s*/, '')}</Typography>;
      }
      if (line.startsWith('##')) {
        return <Typography key={i} variant="h5" gutterBottom fontWeight={700}>{line.replace(/^##\s*/, '')}</Typography>;
      }
      
      // Bold
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <Typography key={i} variant="body1" paragraph>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </Typography>
        );
      }
      
      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <Typography key={i} variant="body2" sx={{ ml: 2, mb: 0.5 }}>• {line.replace(/^[-*]\s*/, '')}</Typography>;
      }
      
      // Regular paragraph
      if (line.trim()) {
        return <Typography key={i} variant="body1" paragraph>{line}</Typography>;
      }
      
      return <br key={i} />;
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Paper square elevation={1}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<TeacherIcon />} label="Teacher Mode" />
          <Tab icon={<ExplainIcon />} label="Explain" />
          <Tab icon={<ActivitiesIcon />} label="Activities" />
          <Tab icon={<NotesIcon />} label="Notes" />
        </Tabs>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Teacher Mode Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={<TeacherIcon />}
                onClick={handleTeacherMode}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Explain This Page'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Get a comprehensive teacher-style explanation of the current page
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {teacherResponse && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Teacher's Explanation</Typography>
                  <Tooltip title={isSpeaking ? "Stop" : "Listen"}>
                    <IconButton onClick={() => handleSpeak(teacherResponse)} color="primary">
                      {isSpeaking ? <Stop /> : <VolumeUp />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box>{formatMarkdown(teacherResponse)}</Box>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Explain Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              {selectedText && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Selected Text:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    "{selectedText}"
                  </Typography>
                </Paper>
              )}
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ExplainIcon />}
                onClick={handleExplainText}
                disabled={loading || !selectedText}
              >
                {loading ? 'Generating...' : 'Explain Selected Text'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Select any text from the PDF and click to get detailed explanation
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {explainResponse && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Explanation</Typography>
                <Box>{formatMarkdown(explainResponse)}</Box>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Activities Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<ActivitiesIcon />}
                onClick={handleGenerateActivities}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Activities'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Generate RBL, CBL, and SEA activities based on current page content
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {activitiesResponse && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Activities</Typography>
                <Box>{formatMarkdown(activitiesResponse)}</Box>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>My Notes</Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                flexGrow: 1, 
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your notes here..."
                style={{
                  width: '100%',
                  flexGrow: 1,
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  resize: 'none',
                  padding: '8px'
                }}
              />
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Notes are saved automatically
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}

export default AIModePanel;

