import React, { useState, useEffect, useRef } from 'react';
import VisualAidRenderer from './VisualAidRenderer';
import UpgradePrompt from './UpgradePrompt';
import { useAdminConfig, isTabEnabled } from '../hooks/useAdminConfig';
import { extractFromStructuredResponse } from '../utils/visualizationExtractor';
import { trackAIQueryUsage } from '../services/subscriptionService';
// v7.2.25: Circuit visualization components
import CircuitVisualizer, { LogicGate, GateGallery, InteractiveTruthTable, ROMVisualizer } from './LogicGateVisualizer';
import CircuitBuilder from './CircuitBuilder';
import CircuitSimulator from './CircuitSimulator';
import llmService, { PROVIDERS } from '../services/llmService';
// v7.2.32: Educational tools
import { MathTools, ChemistryTools, PhysicsSimulator, CodeEditor, GlobeViewer } from './tools';
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
  Tooltip,
  Chip,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Badge,
  Grid,
  Avatar,
  TextField,
  List,
  ListItem,
  Divider
} from '@mui/material';
import {
  Style as FlashcardIcon
} from '@mui/icons-material';
import {
  // v7.2.28: Updated icons for cleaner, more professional look
  AutoStories as LearnIcon,        // Learn tab (was TeacherIcon/School)
  Psychology as ExplainIcon,       // Explain tab (was Lightbulb) - brain/insight icon
  Sports as ActivitiesIcon,
  Note as NotesIcon,
  VolumeUp,
  Stop,
  Public as ResourcesIcon,
  Link as LinkIcon,
  MenuBook as ReadIcon,
  AddCircle as AddToNotesIcon,
  FactCheck as ExamIcon,           // Exam tab (was Quiz) - professional test icon
  Description as DescriptionIcon,
  Translate as TranslateIcon,
  Clear as ClearIcon,
  // v7.2.25: Circuit visualization icons
  Memory as CircuitIcon,
  Construction as ToolIcon,        // Tool tab (was BuildIcon) - professional tools icon
  Build as BuildIcon,              // Keep for Circuit Builder button
  Science as SimulateIcon,
  Send as SendIcon,
  Delete as ClearChatIcon
} from '@mui/icons-material';
import NotesEditor from './NotesEditor';
import { generateExplanation, generateTeacherMode, generateActivities, generateAdditionalResources, generateWordByWordAnalysis, generateExamPrep, generateLongAnswer, translateTeacherModeToEnglish } from '../services/geminiService';
import { extractFullPdfText } from '../services/pdfExtractor';
import { getBestVoice, getNaturalVoice, resetSpeechSynthesis, ensureVoicesLoaded } from '../services/voiceService';
import {
  getCachedData,
  saveCachedData,
  getPriorPagesContext,
  getCacheStats,
  clearPageCache
} from '../services/cacheService';
import { createFlashcard } from '../services/spacedRepetitionService';

/**
 * v10.1.1: Clean orphaned JSON artifacts from AI responses
 * Removes incomplete/orphaned brackets, truncated JSON, and other artifacts
 */
function cleanJsonArtifacts(text) {
  if (!text || typeof text !== 'string') return text;
  
  let cleaned = text;
  
  // Remove orphaned opening braces at end of sentences (like "Let's pause for a moment. {")
  cleaned = cleaned.replace(/\s*\{\s*$/gm, '');
  
  // Remove incomplete JSON-like patterns at end of text
  cleaned = cleaned.replace(/\s*\{[^}]*$/g, '');
  
  // Remove orphaned JSON key patterns (like '"type":' without complete object)
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
 * v7.2.27: Render inline JSON visualizations (tables, K-maps, PLA, circuits)
 * Parses text containing JSON objects and renders them as visual components
 */
function renderWithInlineVisualizations(text, LogicGate, InteractiveTruthTable) {
  // Handle null/undefined
  if (!text) return null;
  
  // If text is an object (not a string), convert it properly
  if (typeof text !== 'string') {
    // If it's a React element, return as-is
    if (React.isValidElement(text)) return text;
    
    // If it's an object with expected explanation fields, extract the explanation
    if (typeof text === 'object' && text.explanation) {
      text = text.explanation;
    } else if (typeof text === 'object') {
      // Convert object to readable HTML (not raw JSON)
      console.warn('⚠️ renderWithInlineVisualizations received object, converting to string');
      // Don't render the raw JSON - just return a placeholder
      return <span style={{ color: 'red' }}>Error: Unexpected object in explanation. Please click Clear and regenerate.</span>;
    }
    
    // Still not a string? Return null
    if (typeof text !== 'string') return null;
  }
  
  // v10.1.1: Clean orphaned JSON artifacts before processing
  text = cleanJsonArtifacts(text);
  
  // Find all JSON objects in the text
  const parts = [];
  let lastIndex = 0;
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    // Look for JSON object start
    const jsonStart = text.indexOf('{"type":', currentIndex);
    const circuitStart = text.indexOf('{"circuitVisualization":', currentIndex);
    
    let startIdx = -1;
    if (jsonStart !== -1 && circuitStart !== -1) {
      startIdx = Math.min(jsonStart, circuitStart);
    } else if (jsonStart !== -1) {
      startIdx = jsonStart;
    } else if (circuitStart !== -1) {
      startIdx = circuitStart;
    }
    
    if (startIdx === -1) break;
    
    // Add text before JSON
    if (startIdx > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, startIdx) });
    }
    
    // Extract JSON using brace matching
    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === '{') depth++;
      if (text[i] === '}') depth--;
      if (depth === 0 && i > startIdx) {
        endIdx = i + 1;
        break;
      }
    }
    
    const jsonStr = text.slice(startIdx, endIdx);
    try {
      const jsonObj = JSON.parse(jsonStr);
      parts.push({ type: 'json', content: jsonObj, raw: jsonStr });
    } catch (e) {
      // If parsing fails, treat as text
      parts.push({ type: 'text', content: jsonStr });
    }
    
    lastIndex = endIdx;
    currentIndex = endIdx;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  // If no JSON found, render the HTML content properly
  if (parts.length === 0) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }
  if (parts.length === 1 && parts[0].type === 'text') {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }
  
  // Render parts
  return parts.map((part, idx) => {
    if (part.type === 'text') {
      return <span key={idx} dangerouslySetInnerHTML={{ __html: part.content }} />;
    }
    
    const json = part.content;
    
    // Render based on type
    if (json.type === 'table' && json.rows) {
      // Truth table or general table
      const headers = json.data ? Object.keys(json.data[0] || {}) : 
                      (json.rows[0] ? Object.keys(json.rows[0]) : []);
      return (
        <Box key={idx} sx={{ my: 2, overflowX: 'auto' }}>
          <table style={{ 
            borderCollapse: 'collapse', 
            width: '100%', 
            maxWidth: '600px',
            fontSize: '14px',
            backgroundColor: 'white',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {json.rows.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  {headers.map((h, colIdx) => (
                    <td key={colIdx} style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}>
                      {row[h] !== undefined ? String(row[h]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    }
    
    if (json.type === 'kmap' && json.data) {
      // K-map visualization
      return (
        <Box key={idx} sx={{ my: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            📊 Karnaugh Maps (K-maps):
          </Typography>
          {json.data.map((kmap, kmapIdx) => (
            <Box key={kmapIdx} sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {kmap.function}: Minterms = ∑m({kmap.minterms?.join(', ') || 'N/A'})
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    
    if (json.type === 'pla' && json.data) {
      // PLA implementation
      return (
        <Box key={idx} sx={{ my: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: '#e65100' }}>
            🔧 PLA Implementation:
          </Typography>
          {json.data.map((func, funcIdx) => (
            <Box key={funcIdx} sx={{ mb: 1, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                <strong>{func.function}</strong> = {func.expression}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    
    if (json.type === 'logic_circuit' || json.circuitVisualization) {
      // Logic circuit - completely hide from text, shown in dedicated visualization section
      return null;
    }
    
    // Unknown JSON type - show as formatted JSON
    return (
      <Box key={idx} sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
          📋 Structured Data:
        </Typography>
        <pre style={{ 
          margin: 0, 
          fontSize: '12px', 
          overflow: 'auto',
          maxHeight: '200px',
          backgroundColor: '#fafafa',
          padding: '8px',
          borderRadius: '4px'
        }}>
          {JSON.stringify(json, null, 2)}
        </pre>
      </Box>
    );
  });
}

/**
 * v7.2.26: Convert AI circuit response to React Flow format
 * Transforms the structured circuit data from AI into nodes and edges for the circuit builder
 */
function convertAICircuitToReactFlow(circuitData) {
  if (!circuitData) return null;
  
  const nodes = [];
  const edges = [];
  let yOffset = 50;
  
  // Gate type mapping for React Flow node types
  const gateTypeMap = {
    'AND': 'andGate',
    'OR': 'orGate',
    'NOT': 'notGate',
    'NAND': 'nandGate',
    'NOR': 'norGate',
    'XOR': 'xorGate',
    'XNOR': 'xnorGate'
  };
  
  // Create input nodes
  if (circuitData.inputs) {
    circuitData.inputs.forEach((input, idx) => {
      nodes.push({
        id: input.id,
        type: 'input',
        position: input.position || { x: 50, y: yOffset + idx * 100 },
        data: { label: input.label || input.id, value: 0 }
      });
    });
  }
  
  // Create gate nodes
  if (circuitData.gates) {
    circuitData.gates.forEach((gate, idx) => {
      const gateType = gateTypeMap[gate.type.toUpperCase()] || 'andGate';
      nodes.push({
        id: gate.id,
        type: gateType,
        position: gate.position || { x: 250, y: yOffset + idx * 100 },
        data: { label: gate.type, output: undefined }
      });
    });
  }
  
  // Create output nodes
  if (circuitData.outputs) {
    circuitData.outputs.forEach((output, idx) => {
      nodes.push({
        id: output.id,
        type: 'output',
        position: output.position || { x: 450, y: yOffset + idx * 100 },
        data: { label: output.label || output.id, value: 0 }
      });
    });
  }
  
  // Create edges from connections
  if (circuitData.connections) {
    circuitData.connections.forEach((conn, idx) => {
      // Parse connection format: "A" -> "g1.a" means from A's output to g1's input 'a'
      let sourceId = conn.from;
      let sourceHandle = 'out';
      let targetId = conn.to;
      let targetHandle = 'a';
      
      if (conn.from.includes('.')) {
        const parts = conn.from.split('.');
        sourceId = parts[0];
        sourceHandle = parts[1] === 'out' ? 'out' : parts[1];
      }
      
      if (conn.to.includes('.')) {
        const parts = conn.to.split('.');
        targetId = parts[0];
        targetHandle = parts[1];
      }
      
      edges.push({
        id: `edge-${idx}`,
        source: sourceId,
        sourceHandle: sourceHandle,
        target: targetId,
        targetHandle: targetHandle,
        markerEnd: { type: 'arrowclosed' },
        style: { strokeWidth: 2 }
      });
    });
  }
  
  return { nodes, edges };
}

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

function AIModePanel({ 
  currentPage, 
  totalPages, 
  pdfId, 
  selectedText, 
  pageText, 
  user, 
  pdfDocument,
  activeTab: externalActiveTab,
  onTabChange,
  vyonnQuery,
  onVyonnQueryUsed,
  subscription,
  onUpgrade,
  isMobile = false,  // v7.2.10: Mobile responsiveness
  onAIQuery,         // v7.2.24: Track AI queries for analytics
  pdfMetadata,       // v7.2.25: PDF metadata including class/grade for adaptive responses
  onOpenSettings     // v10.1: Open settings dialog for API key configuration
}) {
  // Use controlled state if provided, otherwise use internal state
  const [internalTab, setInternalTab] = useState(0);
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalTab;
  const setActiveTab = onTabChange || setInternalTab;
  const [editableSelectedText, setEditableSelectedText] = useState('');

  // Update editable text when selection changes
  useEffect(() => {
    setEditableSelectedText(selectedText || '');
  }, [selectedText]);

  // Handle Vyonn query - auto-populate and trigger Smart Explain
  // Smart Explain is typically tab index 2 (with all tabs enabled)
  useEffect(() => {
    if (vyonnQuery) {
      console.log('🔮 Vyonn query received, current tab:', activeTab);
      console.log('🔮 Setting query text:', vyonnQuery);
      setEditableSelectedText(vyonnQuery);
      
      // Mark query as used
      if (onVyonnQueryUsed) {
        onVyonnQueryUsed();
      }
      
      // Auto-trigger analysis after a short delay to ensure state is updated
      // Only if we're on what appears to be the Smart Explain tab
      setTimeout(() => {
        const analyzeButton = document.querySelector('[data-vyonn-trigger="explain"]');
        if (analyzeButton) {
          console.log('🔮 Auto-clicking analyze button');
          analyzeButton.click();
        } else {
          console.log('🔮 Analyze button not found - user can click manually');
        }
      }, 500);
    }
  }, [vyonnQuery, activeTab, onVyonnQueryUsed]);

  // Cleanup: Stop speech and clear data when page changes
  useEffect(() => {
    // Stop speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('🔇 Stopped speech on page change');
    }
    
    // Clear selected text when page changes
    setEditableSelectedText('');
    
    // Clear error when page changes
    setError(null);
    
    // Note: We don't clear the responses here, we just track the page
    // The rendering logic will check if data matches current page
  }, [currentPage]); // Re-run when page changes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacherResponse, setTeacherResponse] = useState('');
  const [teacherResponsePage, setTeacherResponsePage] = useState(null);
  const [teacherEnglish, setTeacherEnglish] = useState({});
  const [translatingSection, setTranslatingSection] = useState(null);
  const [usedCache, setUsedCache] = useState(false);
  const [teacherScope, setTeacherScope] = useState('page'); // 'page' or 'chapter' - default to 'page'
  const [showScopeSelector, setShowScopeSelector] = useState(true);
  const [cacheStats, setCacheStats] = useState(null);
  const [explainResponse, setExplainResponse] = useState('');
  
  // Flashcard notification state
  const [flashcardNotification, setFlashcardNotification] = useState({ open: false, count: 0 });
  const [explainResponsePage, setExplainResponsePage] = useState(null);
  const [explainEnglish, setExplainEnglish] = useState(null);
  const [translatingExplain, setTranslatingExplain] = useState(false);
  const [explainScope, setExplainScope] = useState('page'); // 'page' or 'chapter' - default to 'page'
  const [showExplainScopeSelector, setShowExplainScopeSelector] = useState(true);
  const [activitiesResponse, setActivitiesResponse] = useState(null);
  const [activitiesResponsePage, setActivitiesResponsePage] = useState(null);
  const [activitiesScope, setActivitiesScope] = useState('page'); // 'page' or 'chapter' - default to 'page'
  const [showActivitiesScopeSelector, setShowActivitiesScopeSelector] = useState(true);
  const [resourcesResponse, setResourcesResponse] = useState('');
  const [resourcesResponsePage, setResourcesResponsePage] = useState(null);
  
  // v7.2.25: Circuit visualization states
  const [showCircuitBuilder, setShowCircuitBuilder] = useState(false);
  const [showCircuitSimulator, setShowCircuitSimulator] = useState(false);
  const [circuitData, setCircuitData] = useState(null);
  
  // v7.2.32: Educational tools states
  const [showMathTools, setShowMathTools] = useState(false);
  const [showChemistryTools, setShowChemistryTools] = useState(false);
  const [showPhysicsSimulator, setShowPhysicsSimulator] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showGlobeViewer, setShowGlobeViewer] = useState(false);
  const [notes, setNotes] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [wordAnalysis, setWordAnalysis] = useState([]);
  const [wordAnalysisPage, setWordAnalysisPage] = useState(null);
  const [analyzingWords, setAnalyzingWords] = useState(false);
  const [wordBatch, setWordBatch] = useState(1); // Track which batch of words we're on
  const [speakingWordIndex, setSpeakingWordIndex] = useState(null);
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSection, setSpeakingSection] = useState(null); // Track which teacher section is speaking
  
  // Exam Prep state
  const [examPrepResponse, setExamPrepResponse] = useState(null);
  const [examPrepPage, setExamPrepPage] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [generatingExam, setGeneratingExam] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState(null);
  const [examChunkProgress, setExamChunkProgress] = useState(0);
  const [examTotalChunks, setExamTotalChunks] = useState(0);
  const [examCurrentTip, setExamCurrentTip] = useState(0);
  
  // v7.2.30: Vyonn Chat state (embedded in tab)
  const [vyonnMessages, setVyonnMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! I\'m Vyonn, your AI learning companion. 🎨 I can create 3D shapes, show molecules, display maps, and draw charts! Try asking me to "show a water molecule" or "draw a cube". How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [vyonnInput, setVyonnInput] = useState('');
  const [vyonnLoading, setVyonnLoading] = useState(false);
  const vyonnMessagesEndRef = useRef(null);
  
  // Progress tracking for chapter generation (Teacher, Explain, Activities)
  const [chapterProgress, setChapterProgress] = useState({ current: 0, total: 0, tipIndex: 0 });
  
  // Manual language selection (overrides auto-detection)
  const [manualLanguage, setManualLanguage] = useState(null);

  // v7.2.27: Auto-detect and extract circuit JSON from explainResponse
  useEffect(() => {
    if (!explainResponse || typeof explainResponse !== 'object') return;
    if (!explainResponse.explanation) return;
    
    const explanation = explainResponse.explanation;
    
    // Look for circuit JSON patterns
    const circuitPatterns = [
      '{"circuitVisualization"',
      '{"type":"logic_circuit"',
      '{"type": "logic_circuit"'
    ];
    
    let foundCircuit = null;
    let startIdx = -1;
    
    for (const pattern of circuitPatterns) {
      startIdx = explanation.indexOf(pattern);
      if (startIdx !== -1) break;
    }
    
    if (startIdx !== -1) {
      // Extract using brace matching
      let depth = 0;
      let endIdx = startIdx;
      for (let i = startIdx; i < explanation.length; i++) {
        if (explanation[i] === '{') depth++;
        if (explanation[i] === '}') depth--;
        if (depth === 0 && i > startIdx) {
          endIdx = i + 1;
          break;
        }
      }
      
      const jsonStr = explanation.slice(startIdx, endIdx);
      try {
        const parsed = JSON.parse(jsonStr);
        foundCircuit = parsed.circuitVisualization || parsed;
        console.log('🔌 [useEffect] Auto-extracted circuit:', foundCircuit?.title);
        
        // Set circuitData state for visualization
        if (foundCircuit && !circuitData) {
          setCircuitData(foundCircuit);
        }
      } catch (e) {
        console.warn('⚠️ [useEffect] Failed to parse circuit JSON:', e);
      }
    }
  }, [explainResponse, circuitData]);

  // Load saved language preference for this PDF
  useEffect(() => {
    if (pdfId) {
      const savedLang = localStorage.getItem(`pdf_language_${pdfId}`);
      if (savedLang) {
        setManualLanguage(savedLang);
      }
    }
  }, [pdfId]);

  // Helper function: Check if AI features should be disabled for FREE tier
  const isAIFeatureDisabled = () => {
    return subscription?.isFree && subscription?.remainingQueries === 0;
  };

  // Save language preference when changed
  const handleLanguageChange = (event) => {
    const selectedLang = event.target.value;
    const newManualLang = selectedLang === 'auto' ? null : selectedLang;
    setManualLanguage(newManualLang);
    
    if (pdfId) {
      if (selectedLang === 'auto') {
        localStorage.removeItem(`pdf_language_${pdfId}`);
      } else {
        localStorage.setItem(`pdf_language_${pdfId}`, selectedLang);
      }
    }
    
    console.log(`🔧 Language manually set to: ${selectedLang}`, {
      newManualLang,
      isEnglish: selectedLang === 'en',
      willEnableMultilingual: selectedLang !== 'en' && selectedLang !== 'auto'
    });
  };

  // Helper function to detect language and return details
  // v10.1.2: Improved detection with character counting for more accurate results
  const detectLanguage = (text) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      // v10.1.2: Return "Detecting..." instead of Unknown when no text yet
      return { language: 'Detecting...', emoji: '🔍', isEnglish: false, script: 'Unknown' };
    }
    
    // Count characters of each script type for more accurate detection
    const scripts = {
      devanagari: (text.match(/[\u0900-\u097F]/g) || []).length,
      telugu: (text.match(/[\u0C00-\u0C7F]/g) || []).length,
      tamil: (text.match(/[\u0B80-\u0BFF]/g) || []).length,
      bengali: (text.match(/[\u0980-\u09FF]/g) || []).length,
      gujarati: (text.match(/[\u0A80-\u0AFF]/g) || []).length,
      gurmukhi: (text.match(/[\u0A00-\u0A7F]/g) || []).length,
      oriya: (text.match(/[\u0B00-\u0B7F]/g) || []).length,
      malayalam: (text.match(/[\u0D00-\u0D7F]/g) || []).length,
      kannada: (text.match(/[\u0C80-\u0CFF]/g) || []).length,
      latin: (text.match(/[a-zA-Z]/g) || []).length
    };
    
    // Find the dominant script
    const totalNonLatin = scripts.devanagari + scripts.telugu + scripts.tamil + 
                          scripts.bengali + scripts.gujarati + scripts.gurmukhi + 
                          scripts.oriya + scripts.malayalam + scripts.kannada;
    
    // If significant non-Latin characters detected (>5% of text)
    if (totalNonLatin > text.length * 0.05) {
      // Return the language with most characters
      const maxScript = Object.entries(scripts)
        .filter(([key]) => key !== 'latin')
        .reduce((max, curr) => curr[1] > max[1] ? curr : max, ['none', 0]);
      
      const scriptToLanguage = {
        telugu: { language: 'Telugu (తెలుగు)', emoji: '🇮🇳', isEnglish: false, script: 'Telugu' },
        devanagari: { language: 'Hindi (हिंदी)', emoji: '🇮🇳', isEnglish: false, script: 'Devanagari' },
        tamil: { language: 'Tamil (தமிழ்)', emoji: '🇮🇳', isEnglish: false, script: 'Tamil' },
        kannada: { language: 'Kannada (ಕನ್ನಡ)', emoji: '🇮🇳', isEnglish: false, script: 'Kannada' },
        malayalam: { language: 'Malayalam (മലയാളം)', emoji: '🇮🇳', isEnglish: false, script: 'Malayalam' },
        bengali: { language: 'Bengali (বাংলা)', emoji: '🇮🇳', isEnglish: false, script: 'Bengali' },
        gujarati: { language: 'Gujarati (ગુજરાતી)', emoji: '🇮🇳', isEnglish: false, script: 'Gujarati' },
        gurmukhi: { language: 'Punjabi (ਪੰਜਾਬੀ)', emoji: '🇮🇳', isEnglish: false, script: 'Gurmukhi' },
        oriya: { language: 'Odia (ଓଡ଼ିଆ)', emoji: '🇮🇳', isEnglish: false, script: 'Odia' }
      };
      
      if (maxScript[0] !== 'none' && scriptToLanguage[maxScript[0]]) {
        return scriptToLanguage[maxScript[0]];
      }
    }
    
    // Default to English
    return { language: 'English', emoji: '🇬🇧', isEnglish: true, script: 'Latin' };
  };
  
  // Helper function to detect if content is in English (backward compatibility)
  const isEnglishContent = (text) => {
    return detectLanguage(text).isEnglish;
  };

  // Helper function to detect if text is likely regional language or garbled
  const isRegionalLanguageOrGarbled = (text) => {
    if (!text) return false;
    
    // Check for Devanagari (Hindi, Sanskrit, etc.)
    if (/[\u0900-\u097F]/.test(text)) return true;
    
    // Check for Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) return true;
    
    // Check for Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) return true;
    
    // Check for Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) return true;
    
    // Check for Malayalam
    if (/[\u0D00-\u0D7F]/.test(text)) return true;
    
    // Check for Bengali
    if (/[\u0980-\u09FF]/.test(text)) return true;
    
    // Check for Gujarati
    if (/[\u0A80-\u0AFF]/.test(text)) return true;
    
    // Check for Gurmukhi (Punjabi)
    if (/[\u0A00-\u0A7F]/.test(text)) return true;
    
    // Check for Oriya
    if (/[\u0B00-\u0B7F]/.test(text)) return true;
    
    // Check for garbled text (lots of special characters that aren't normal punctuation)
    const specialCharRatio = (text.match(/[^\w\s.,!?;:()\-'"]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) return true; // More than 30% special chars = likely garbled
    
    return false;
  };

  // Helper function to format markdown bold and italic to HTML
  const formatBoldText = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Replace **text** with <strong>text</strong> (bold)
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Replace *text* with <em>text</em> (italic) - but not if already part of **
    formatted = formatted.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    return formatted;
  };

  // v10.1: Check if API keys are configured
  const hasAnyApiKey = () => {
    return llmService.hasApiKey(PROVIDERS.GEMINI) || llmService.hasApiKey(PROVIDERS.GROQ);
  };

  // v10.1: Show API key configuration prompt
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);

  const handleTabChange = (event, newValue) => {
    // v10.1: Check for API keys before switching to AI-powered tabs
    // Notes tab (typically last) doesn't require API keys
    const notesTabIndex = tabIndices.notes;
    
    if (newValue !== notesTabIndex && !hasAnyApiKey()) {
      setShowApiKeyAlert(true);
      return; // Don't switch tabs
    }
    
    setActiveTab(newValue);
  };

  // Clear functions for each tab
  const clearTeacherMode = async () => {
    // v7.2.26: Also clear the cache so regeneration works
    if (pdfId && teacherResponsePage) {
      const cacheKey = teacherScope === 'chapter' ? 'teacherMode_chapter' : 'teacherMode';
      await clearPageCache(pdfId, teacherResponsePage, cacheKey);
      console.log('🗑️ Cleared Teacher Mode cache for page', teacherResponsePage);
    }
    
    setTeacherResponse('');
    setTeacherResponsePage(null);
    setTeacherEnglish({});
    setTranslatingSection(null);
    setUsedCache(false);
    setTeacherScope('page'); // Reset to 'page' instead of null
    setShowScopeSelector(true);
    setError(null);
  };

  const clearExplain = async () => {
    // v7.2.26: Also clear the cache so regeneration works
    // FIX: Use correct cache keys that match what's used in handleExplainText
    if (pdfId && explainResponsePage) {
      // Clear both page and chapter cache to ensure regeneration works
      await clearPageCache(pdfId, explainResponsePage, 'explain_fullpage');
      await clearPageCache(pdfId, explainResponsePage, 'explain_chapter');
      await clearPageCache(pdfId, explainResponsePage, 'explain_selection');
      console.log('🗑️ Cleared Smart Explain cache for page', explainResponsePage);
    }
    
    // Also clear circuitData since it might be stale
    setCircuitData(null);
    
    setExplainResponse('');
    setExplainResponsePage(null);
    setExplainEnglish(null);
    setTranslatingExplain(false);
    setUsedCache(false);
    setExplainScope('page'); // Reset to 'page' instead of null
    setShowExplainScopeSelector(true);
    setError(null);
  };

  const clearActivities = async () => {
    // v7.2.26: Also clear the cache so regeneration works
    // FIX: Use correct cache keys that match what's used in handleGenerateActivities
    if (pdfId && activitiesResponsePage) {
      await clearPageCache(pdfId, activitiesResponsePage, 'activities');
      await clearPageCache(pdfId, activitiesResponsePage, 'activities_chapter');
      console.log('🗑️ Cleared Activities cache for page', activitiesResponsePage);
    }
    
    setActivitiesResponse(null);
    setActivitiesResponsePage(null);
    setQuizAnswers({});
    setQuizResults(null);
    setUsedCache(false);
    setActivitiesScope('page'); // Reset to 'page' instead of null
    setShowActivitiesScopeSelector(true);
    setError(null);
  };

  const clearResources = async () => {
    // v7.2.26: Also clear the cache so regeneration works
    if (pdfId && resourcesResponsePage) {
      await clearPageCache(pdfId, resourcesResponsePage, 'resources');
      console.log('🗑️ Cleared Resources cache for page', resourcesResponsePage);
    }
    
    setResourcesResponse('');
    setResourcesResponsePage(null);
    setUsedCache(false);
    setError(null);
  };

  const clearWordAnalysis = async () => {
    // v7.2.26: Also clear the cache so regeneration works
    if (pdfId && wordAnalysisPage) {
      await clearPageCache(pdfId, wordAnalysisPage, 'wordAnalysis');
      console.log('🗑️ Cleared Word Analysis cache for page', wordAnalysisPage);
    }
    
    setWordAnalysis([]);
    setWordAnalysisPage(null);
    setWordBatch(1);
    setError(null);
  };

  // v7.2.30: Vyonn Chat handlers
  const handleVyonnSend = async () => {
    if (!vyonnInput.trim() || vyonnLoading) return;

    const userMessage = vyonnInput.trim();
    setVyonnInput('');
    setVyonnLoading(true);

    // Add user message
    const newMessages = [
      ...vyonnMessages,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }
    ];
    setVyonnMessages(newMessages);

    try {
      // Prepare context from PDF if available
      let contextInfo = '';
      if (pageText && pageText.trim()) {
        contextInfo = `\n\n[Context: Currently analyzing study material from page ${currentPage}. Available content: ${pageText.substring(0, 1500)}...]`;
      }

      // Vyonn's System Prompt with visualization capabilities
      const vyonnSystemPrompt = `You are Vyonn, a friendly AI learning assistant in the Ekamanam app.

IMPORTANT: You CAN display visualizations! When users ask to show something, output the JSON and the app will render it. Never say you cannot display things.

TEACHING STYLE:
- Explain concepts simply before calculations
- Use conversational language  
- Break down solutions step-by-step
- Be encouraging and supportive

VISUALIZATION COMMANDS (output JSON on one line, no code blocks):

3D SHAPES: {"type": "3d", "shapeType": "cube", "color": "#4FC3F7", "dimensions": {"width": 2, "height": 2, "depth": 2}, "title": "Cube", "rotate": true}
Options: cube, sphere, cone, cylinder, pyramid, torus

MOLECULES: {"type": "chemistry", "moleculeData": "water", "format": "name", "title": "Water"}
Options: water, caffeine, aspirin, glucose, benzene, methane, ammonia, ethanol

MAPS: {"type": "leaflet", "center": [28.704, 77.102], "zoom": 10, "markers": [{"position": [28.704, 77.102], "label": "Delhi", "popup": "Capital of India"}], "title": "Delhi"}
Cities: Delhi [28.704, 77.102], Mumbai [19.076, 72.877], Bangalore [12.971, 77.594], Panipat [29.387, 76.968], Agra [27.176, 78.008], Hyderabad [17.385, 78.486], Kolkata [22.572, 88.363], Chennai [13.082, 80.270]

For historical battles (Panipat, Plassey, etc.), ALWAYS show a map with the battle location.

CHARTS: {"type": "plotly", "data": [{"x": [1, 2, 3], "y": [10, 20, 15], "type": "bar"}], "layout": {"title": "Chart"}}

When showing visuals: First explain briefly, then output JSON on its own line.

${contextInfo ? `Context: Page ${currentPage}. ${contextInfo.substring(0, 500)}` : ''}

Question: ${userMessage}`;

      console.log('🔮 Vyonn: Processing query:', userMessage.substring(0, 50));

      // Check if API key is available
      const hasGeminiKey = llmService.hasApiKey(PROVIDERS.GEMINI);
      const hasGroqKey = llmService.hasApiKey(PROVIDERS.GROQ);
      
      if (!hasGeminiKey && !hasGroqKey) {
        throw new Error('No API key configured. Please go to Settings and add your Gemini or Groq API key.');
      }

      // Call LLM service
      const llmResponse = await llmService.callLLM(
        vyonnSystemPrompt,
        {
          feature: 'general',
          preferredProvider: hasGeminiKey ? PROVIDERS.GEMINI : PROVIDERS.GROQ,
          temperature: 0.8,
          maxTokens: 2000
        }
      );
      
      // Handle response (could be string or object with response property)
      const response = typeof llmResponse === 'string' ? llmResponse : (llmResponse?.response || String(llmResponse || ''));

      if (!response) {
        throw new Error('Empty response from AI');
      }

      // Track query for analytics
      if (onAIQuery) {
        onAIQuery('vyonn_chat', userMessage);
      }

      // Check for visualization JSON in response
      let visualAid = null;
      let finalResponse = String(response);
      
      const startMatch = finalResponse.match(/\{\s*"type"\s*:\s*"(3d|chemistry|plotly|leaflet)"/);
      if (startMatch) {
        const startIndex = finalResponse.indexOf(startMatch[0]);
        let braceCount = 0;
        let jsonEndIndex = -1;
        
        for (let i = startIndex; i < finalResponse.length; i++) {
          if (finalResponse[i] === '{') braceCount++;
          if (finalResponse[i] === '}') {
            braceCount--;
            if (braceCount === 0 && i > startIndex) {
              jsonEndIndex = i + 1;
              break;
            }
          }
        }
        
        if (jsonEndIndex > startIndex) {
          const jsonText = finalResponse.substring(startIndex, jsonEndIndex);
          try {
            visualAid = JSON.parse(jsonText);
            finalResponse = finalResponse.substring(0, startIndex).trim() + 
                           finalResponse.substring(jsonEndIndex).trim();
          } catch (e) {
            console.warn('Failed to parse visualization JSON:', e);
          }
        }
      }

      // Add assistant response
      setVyonnMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: finalResponse,
          timestamp: new Date(),
          visualAid: visualAid
        }
      ]);
    } catch (error) {
      console.error('⚠️ Vyonn: Error:', error);
      console.error('⚠️ Vyonn: Error message:', error.message);
      
      let errorMessage = 'I ran into a hiccup! Please try again.';
      if (error.message?.includes('API key') || error.message?.includes('No API key')) {
        errorMessage = '🔑 No API key found! Please go to Settings (gear icon) and add your Gemini API key.';
      } else if (error.message?.includes('401') || error.message?.includes('invalid')) {
        errorMessage = '🔑 Your API key seems invalid. Please check it in Settings.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = '📡 Network error. Please check your internet connection.';
      } else if (error.message?.includes('blocked') || error.message?.includes('safety')) {
        errorMessage = '⚠️ That content was blocked. Try rephrasing your question.';
      }
      
      setVyonnMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          error: true
        }
      ]);
    } finally {
      setVyonnLoading(false);
    }
  };

  const handleVyonnKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleVyonnSend();
    }
  };

  const clearVyonnChat = () => {
    setVyonnMessages([
      {
        role: 'assistant',
        content: 'Chat cleared! 🎨 Remember, I can show 3D shapes, molecules, maps, and charts! Ask me anything about your studies.',
        timestamp: new Date()
      }
    ]);
  };

  // Auto-scroll Vyonn messages
  useEffect(() => {
    vyonnMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [vyonnMessages]);

  // Add content to Notes
  const addToNotes = (content, title = 'AI Explanation') => {
    const timestamp = new Date().toLocaleString();
    const noteEntry = `
      <div style="border-left: 4px solid #1976d2; padding-left: 16px; margin-bottom: 24px;">
        <h3 style="color: #1976d2; margin-top: 0;">${title}</h3>
        <p style="color: #666; font-size: 0.875rem; margin: 4px 0 12px 0;">
          <em>📄 Page ${currentPage} • ${timestamp}</em>
        </p>
        ${content}
      </div>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
    `;
    
    // Get existing notes from localStorage
    if (pdfId) {
      const existingNotes = localStorage.getItem(`notes_${pdfId}`) || '';
      const updatedNotes = existingNotes + noteEntry;
      localStorage.setItem(`notes_${pdfId}`, updatedNotes);
      localStorage.setItem(`notes_${pdfId}_timestamp`, new Date().toISOString());
      
      // Trigger a custom event to notify NotesEditor to reload
      window.dispatchEvent(new CustomEvent('notesUpdated', { detail: { pdfId } }));
    }
    
    // Show success message and switch to Notes tab
    alert(`✅ Added to Notes! Switching to Notes tab...`);
    if (tabIndices.notes !== undefined) {
      setActiveTab(tabIndices.notes); // Switch to Notes tab (dynamic index)
    }
  };

  const handleTeacherMode = async (scope) => {
    if (!pageText && scope === 'page') {
      setError('No page content available. Please load a PDF page first.');
      return;
    }
    
    if (!pdfDocument && scope === 'chapter') {
      setError('PDF document not loaded. Please try again.');
      return;
    }

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      // Refresh usage counter
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    // V3.0.3: Store scope selection and hide selector
    setTeacherScope(scope);
    setShowScopeSelector(false);

    setLoading(true);
    setError(null);
    setTeacherEnglish({}); // Reset English translations
    setUsedCache(false);

    // Initialize progress tracking for chapter generation
    if (scope === 'chapter') {
      setChapterProgress({ current: 0, total: 3, tipIndex: 0 });
      // Simulate progress steps
      setTimeout(() => setChapterProgress(prev => ({ ...prev, current: 1 })), 1000);
      setTimeout(() => setChapterProgress(prev => ({ ...prev, current: 2 })), 3000);
    } else {
      setChapterProgress({ current: 0, total: 0, tipIndex: 0 });
    }

    try {
      let contentToAnalyze = '';
      let cacheKey = '';
      
      if (scope === 'page') {
        // 📄 CURRENT PAGE ONLY
        contentToAnalyze = pageText;
        cacheKey = 'teacherMode';
        
        // 🔍 DEBUG: Log page text extraction
        console.log('🔍 [Teacher Mode - Page Text Debug]', {
          pageTextLength: pageText?.length || 0,
          hasPageText: !!pageText,
          firstChars: pageText?.substring(0, 200) || '[NO TEXT]',
          lastChars: pageText?.substring(pageText.length - 100) || '[NO TEXT]',
          language: detectedLang.language,
          isEnglish: detectedLang.isEnglish
        });
        
        // Check cache for page
        if (pdfId && currentPage) {
          const cachedData = await getCachedData(pdfId, currentPage, cacheKey);
          if (cachedData) {
            console.log('⚡ Cache HIT: Using cached Teacher Mode (Page)');
            setTeacherResponse(cachedData);
            setUsedCache(true);
            
            // Update cache stats
            const stats = await getCacheStats(pdfId);
            setCacheStats(stats);
            console.log(`📊 Cache: ${stats.pagesCached} pages, ${stats.cacheSizeKB} KB`);
            
            setLoading(false);
            return;
          } else {
            console.log('📊 Cache MISS: Generating Teacher Mode for current page...');
          }
        }
      } else {
        // 📚 ENTIRE CHAPTER
        console.log('📖 Extracting full chapter text for comprehensive explanation...');
        contentToAnalyze = await extractFullPdfText(pdfDocument);
        
        // 🔍 DEBUG: Log chapter text extraction
        console.log('🔍 [Teacher Mode - Chapter Text Debug]', {
          fullTextLength: contentToAnalyze?.length || 0,
          hasText: !!contentToAnalyze,
          firstChars: contentToAnalyze?.substring(0, 200) || '[NO TEXT]',
          language: detectedLang.language,
          isEnglish: detectedLang.isEnglish
        });
        
        // Limit to first 30,000 characters to avoid token issues
        if (contentToAnalyze.length > 30000) {
          contentToAnalyze = contentToAnalyze.substring(0, 30000);
          console.log('⚠️ Chapter text truncated to 30,000 characters for processing');
        }
        
        cacheKey = 'teacherMode_chapter';
        console.log(`📊 Generating Teacher Mode for entire chapter (${contentToAnalyze.length} chars)...`);
      }

      // 📡 GENERATE NEW EXPLANATION
      // V3.0.3: Multi-provider system handles API keys automatically
      const finalLanguage = manualLanguage || detectedLang.language || 'English';
      
      // 🔍 DEBUG: Log what we're sending to AI
      console.log('🔍 [Teacher Mode - Sending to AI]', {
        contentLength: contentToAnalyze?.length || 0,
        language: finalLanguage,
        detectedLanguage: detectedLang.language,
        manualLanguage: manualLanguage,
        contentPreview: contentToAnalyze?.substring(0, 300) || '[NO CONTENT]'
      });
      
      const response = await generateTeacherMode(contentToAnalyze, null, finalLanguage);
      
      // Try to parse JSON response
      try {
        // Remove all markdown code blocks and extra whitespace
        let cleanResponse = response
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        // Extract JSON object using balanced brace matching
        let braceCount = 0;
        let jsonStart = -1;
        let jsonEnd = -1;
        
        for (let i = 0; i < cleanResponse.length; i++) {
          if (cleanResponse[i] === '{') {
            if (jsonStart === -1) jsonStart = i;
            braceCount++;
          }
          if (cleanResponse[i] === '}') {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
        
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error('No complete JSON object found in response');
        }
        
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
        
        console.log(`✅ Parsing Teacher Mode (${scope}) JSON, length: ${cleanResponse.length} chars`);
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(cleanResponse);
        } catch (firstParseError) {
          console.warn('⚠️ First parse failed, attempting JSON repair...');
          
          // v7.2.13: Escape literal newlines and control chars inside string values
          // This is the main cause of "Bad control character in string literal" errors
          let repairedJson = cleanResponse;
          
          // Step 1: Escape newlines, tabs, and other control characters inside strings
          // We need to find strings and escape control chars within them
          repairedJson = repairedJson.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
            // Escape unescaped control characters
            const escaped = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/[\x00-\x1F]/g, (char) => '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4));
            return `"${escaped}"`;
          });
          
          // Step 2: Fix other common JSON issues
          repairedJson = repairedJson
            // Fix truncated strings in arrays (missing quotes)
            .replace(/"([^"]*?)$/gm, '"$1"')
            // Fix missing commas before object/array elements
            .replace(/"\s*\n\s*"/g, '",\n"')
            .replace(/"\s*\n\s*\{/g, '",\n{')
            .replace(/\}\s*\n\s*\{/g, '},\n{')
            // Remove trailing commas
            .replace(/,\s*([}\]])/g, '$1');
          
          console.log('🔧 Attempting to parse repaired JSON...');
          try {
            parsedResponse = JSON.parse(repairedJson);
            console.log('✅ JSON repair successful!');
          } catch (secondParseError) {
            // Step 3: More aggressive repair - try to build a valid partial JSON
            console.warn('⚠️ Second parse failed, attempting aggressive repair...');
            
            // Try to extract and parse just the parts we can salvage
            const partialResponse = {};
            const fields = ['contentType', 'performanceStyle', 'summary', 'keyPoints', 'explanation', 'examples', 'exam'];
            
            for (const field of fields) {
              const regex = new RegExp(`"${field}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|\\[[^\\]]*\\])`, 's');
              const match = repairedJson.match(regex);
              if (match) {
                try {
                  partialResponse[field] = JSON.parse(match[1]);
                } catch {
                  // For arrays or complex values that failed, try simple string extraction
                  if (match[1].startsWith('"')) {
                    partialResponse[field] = match[1].slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"');
                  }
                }
              }
            }
            
            if (Object.keys(partialResponse).length > 0) {
              console.log('✅ Partial JSON recovery successful, fields:', Object.keys(partialResponse));
              parsedResponse = partialResponse;
            } else {
              throw secondParseError;
            }
          }
        }
        
        console.log(`✅ Successfully parsed Teacher Mode (${scope}) response`);
        
        // 🎨 Extract 3D visualizations from all text fields
        const { response: cleanedResponse, visualizations } = extractFromStructuredResponse(parsedResponse);
        
        console.log('🎨 [Teacher Mode] Extracted visualizations:', {
          count: visualizations.length,
          sections: visualizations.map(v => v.section)
        });
        
        // Add visualizations array to response for rendering
        cleanedResponse._visualizations = visualizations;
        
        setTeacherResponse(cleanedResponse);
        setTeacherResponsePage(currentPage); // Track which page this data is for

        // v7.2.24: Track AI query for analytics
        if (onAIQuery) {
          onAIQuery('teacher_mode', scope === 'chapter' ? 'Full chapter analysis' : 'Page analysis');
        }

        // 📚 AUTO-GENERATE FLASHCARDS from AI response
        if (cleanedResponse.flashcards && Array.isArray(cleanedResponse.flashcards) && cleanedResponse.flashcards.length > 0 && user?.uid) {
          console.log(`📚 Auto-generating ${cleanedResponse.flashcards.length} flashcards...`);
          let savedCount = 0;
          
          for (const card of cleanedResponse.flashcards) {
            try {
              if (card.front && card.back) {
                await createFlashcard(user.uid, {
                  front: card.front,
                  back: card.back,
                  chapter: cleanedResponse.contentType || 'General',
                  subject: pdfId ? `PDF Page ${currentPage}` : 'Unknown',
                  tags: card.tags || [],
                  source: 'ai_generated'
                });
                savedCount++;
              }
            } catch (cardError) {
              console.warn('⚠️ Failed to save flashcard:', cardError);
            }
          }
          
          if (savedCount > 0) {
            console.log(`✅ Created ${savedCount} flashcards from Teacher Mode`);
            setFlashcardNotification({ open: true, count: savedCount });
          }
        }

        // 💾 SAVE TO CACHE
        if (pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, cacheKey, cleanedResponse);
          console.log(`💾 Saved to cache: Teacher Mode (${scope})`);
          
          // Update cache stats
          const stats = await getCacheStats(pdfId);
          setCacheStats(stats);
          console.log(`📊 Cache: ${stats.pagesCached} pages, ${stats.cacheSizeKB} KB`);
        }
      } catch (parseError) {
        console.error('❌ JSON parse error (even after repair):', parseError);
        console.error('❌ Response was:', response.substring(0, 800));
        // If parsing fails, store as plain object with the raw response
        setTeacherResponse({ 
          explanation: '<div><h4>Raw Response (Parse Failed)</h4><pre>' + response + '</pre></div>',
          _parseError: true 
        });
        setTeacherResponsePage(currentPage);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateSection = async (sectionName, sectionContent) => {
    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    // V3.0.3: Use multi-provider system for translation
    setTranslatingSection(sectionName);
    setError(null);

    try {
      // Use the translation service from geminiService
      const translation = await translateTeacherModeToEnglish(sectionContent);
      
      // Store translation for this section
      setTeacherEnglish(prev => ({
        ...prev,
        [sectionName]: translation
      }));
      
    } catch (err) {
      console.error('Translation error:', err);
      setError(`Failed to translate ${sectionName}`);
    } finally {
      setTranslatingSection(null);
    }
  };

  // V3.0.3: Natural text-to-speech for Teacher Mode sections
  // v10.1.1: Fixed voice loading and Chrome bug workaround
  const handleSpeakSection = async (sectionName, htmlContent) => {
    // v10.1.1: Reset speech synthesis to fix Chrome bug
    resetSpeechSynthesis();
    
    // Ensure voices are loaded
    await ensureVoicesLoaded();

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    if (!plainText.trim()) {
      console.log('⚠️ No text to speak');
      return;
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(plainText);
    
    // V3.0.3: Use voice service for intelligent voice selection
    // Detect language and set voice based on user preference
    const isEnglish = detectedLang?.isEnglish || manualLanguage === 'English';
    const language = manualLanguage || detectedLang?.language || 'English';
    
    // Map detected language to language code
    const langCodes = {
      'English': 'en-US',
      'Telugu': 'te-IN',
      'Hindi': 'hi-IN',
      'Tamil': 'ta-IN',
      'Kannada': 'kn-IN',
      'Malayalam': 'ml-IN',
      'Bengali': 'bn-IN',
      'Marathi': 'mr-IN',
      'Gujarati': 'gu-IN'
    };
    
    const languageCode = isEnglish ? 'en-US' : (langCodes[language] || 'hi-IN');
    
    // Get best matching voice based on user preference
    const selectedVoice = getBestVoice(languageCode);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      console.log(`🔊 Using preferred voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      utterance.lang = languageCode;
      console.log(`🔊 Using default language: ${languageCode}`);
    }
    
    // Set speech parameters
    utterance.rate = isEnglish ? 0.95 : 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onstart = () => {
      setSpeakingSection(sectionName);
      setIsSpeaking(true);
      console.log(`🔊 Speaking section: ${sectionName}`);
    };

    utterance.onend = () => {
      setSpeakingSection(null);
      setIsSpeaking(false);
      console.log('🔇 Speech ended');
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      setSpeakingSection(null);
      setIsSpeaking(false);
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  };

  // v7.2.7: Enhanced musical singing for rhymes with pitch/rate variations
  // v7.2.8: Enhanced singing/recitation with natural voice and soothing rhythm
  const handleSingSection = (sectionName, text, contentType = 'rhyme') => {
    // Stop any current speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Extract plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    let plainText = tempDiv.textContent || tempDiv.innerText || '';

    if (!plainText.trim()) {
      console.log('⚠️ No text to sing');
      return;
    }

    console.log(`🎵 Starting soothing ${contentType} mode...`);

    // Split text into lines - preserve natural line breaks for rhythm
    const lines = plainText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Get language settings
    const isEnglish = detectedLang?.isEnglish || manualLanguage === 'English';
    const language = manualLanguage || detectedLang?.language || 'English';
    const langCodes = {
      'English': 'en-US', 'Telugu': 'te-IN', 'Hindi': 'hi-IN',
      'Tamil': 'ta-IN', 'Kannada': 'kn-IN', 'Malayalam': 'ml-IN',
      'Bengali': 'bn-IN', 'Marathi': 'mr-IN', 'Gujarati': 'gu-IN'
    };
    const languageCode = isEnglish ? 'en-US' : (langCodes[language] || 'hi-IN');
    
    // v7.2.8: Use the most natural-sounding voice available
    const selectedVoice = getNaturalVoice(languageCode) || getBestVoice(languageCode);

    // v7.2.8: Soothing parameters - slower, gentler, more pleasant
    const soothingParams = {
      rhyme: {
        baseRate: 0.75,      // Slower for gentle singing
        basePitch: 1.05,     // Slightly higher, child-friendly
        pauseBetweenLines: 600, // Longer pause for rhythm
        pattern: 'gentle-sway'  // Gentle up-down like a lullaby
      },
      poem: {
        baseRate: 0.7,       // Slow and thoughtful
        basePitch: 1.0,      // Natural pitch
        pauseBetweenLines: 800, // Dramatic pauses
        pattern: 'flowing'   // Smooth emotional flow
      },
      story: {
        baseRate: 0.85,      // Moderate storytelling pace
        basePitch: 1.0,      // Natural pitch
        pauseBetweenLines: 500, // Conversational pauses
        pattern: 'engaging'  // Engaging narration
      }
    };

    const params = soothingParams[contentType] || soothingParams.rhyme;
    let lineIndex = 0;

    // Function to speak each line with soothing variation
    const speakNextLine = () => {
      if (lineIndex >= lines.length) {
        setSpeakingSection(null);
        setIsSpeaking(false);
        console.log('🎵 Performance ended gracefully');
        return;
      }

      const line = lines[lineIndex].trim();
      if (!line) {
        lineIndex++;
        speakNextLine();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(line);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = languageCode;
      }

      // v7.2.8: Calculate gentle, soothing variations
      let pitch = params.basePitch;
      let rate = params.baseRate;
      
      if (params.pattern === 'gentle-sway') {
        // Gentle swaying like a lullaby - subtle variations
        const phase = (lineIndex % 4) / 4 * Math.PI * 2;
        pitch = params.basePitch + (Math.sin(phase) * 0.08); // ±8% pitch sway
        rate = params.baseRate + (Math.cos(phase) * 0.05);   // ±5% rate sway
      } else if (params.pattern === 'flowing') {
        // Flowing emotional arc - builds and releases
        const progress = lineIndex / Math.max(lines.length - 1, 1);
        // Bell curve: start gentle, peak at 60%, end gentle
        const intensity = Math.sin(progress * Math.PI);
        pitch = params.basePitch + (intensity * 0.1);
        rate = params.baseRate + (intensity * 0.08);
      } else if (params.pattern === 'engaging') {
        // Engaging storytelling - slight emphasis on key moments
        const isEmphasis = line.endsWith('!') || line.endsWith('?') || line.includes('"');
        pitch = isEmphasis ? params.basePitch + 0.1 : params.basePitch;
        rate = isEmphasis ? params.baseRate - 0.05 : params.baseRate;
      }

      // Apply parameters - keep within natural-sounding bounds
      utterance.pitch = Math.max(0.8, Math.min(1.3, pitch));
      utterance.rate = Math.max(0.6, Math.min(1.0, rate));
      utterance.volume = 1.0;

      console.log(`🎵 Line ${lineIndex + 1}/${lines.length}: pitch=${utterance.pitch.toFixed(2)}, rate=${utterance.rate.toFixed(2)}`);

      utterance.onend = () => {
        lineIndex++;
        // Longer pauses between lines for natural rhythm
        const pause = params.pauseBetweenLines;
        setTimeout(speakNextLine, pause);
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        setSpeakingSection(null);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Start the soothing performance
    setSpeakingSection(sectionName);
    setIsSpeaking(true);
    speakNextLine();
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingSection(null);
      setIsSpeaking(false);
      console.log('🔇 Speech stopped by user');
    }
  };

  // Removed performOCR - using Teacher Mode technique (pageText) instead

  const handleWordByWordAnalysis = async (isLoadMore = false) => {
    // V3.0.3: Removed API key check - multi-provider handles this
    console.log('🔍 [Multilingual] Button clicked:', { isLoadMore, hasPageText: !!pageText, pageTextLength: pageText?.length });

    if (!pageText) {
      setError('Please load a PDF page first');
      console.error('❌ [Multilingual] No pageText available');
      return;
    }

    // 🔒 Check subscription limits (only for new analysis, not for "Load More")
    if (!isLoadMore && user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    setAnalyzingWords(true);
    setError(null);
    setUsedCache(false);
    console.log('🔄 [Multilingual] Starting word analysis...');
    
    if (!isLoadMore) {
      setWordAnalysis([]);
      setWordBatch(1);

      // 🔍 CHECK CACHE FOR FIRST BATCH
      if (pdfId && currentPage) {
        const cachedData = await getCachedData(pdfId, currentPage, 'wordAnalysis');
        if (cachedData) {
          console.log('⚡ Cache HIT: Using cached Word Analysis');
          setWordAnalysis([cachedData]);
          setUsedCache(true);
          setAnalyzingWords(false);
          return;
        }
      }
    }

    try {
      // Get words already analyzed (to avoid duplicates)
      const existingWords = isLoadMore && wordAnalysis[0]?.words 
        ? wordAnalysis[0].words.map(w => w.word).join(', ')
        : '';
      
      const batchNumber = isLoadMore ? wordBatch + 1 : 1;
      
      // Use the SAME technique as Teacher Mode - analyze entire page at once
      const response = await generateWordByWordAnalysis(pageText, existingWords, batchNumber);
      
      // Parse JSON response (same as Teacher Mode)
      try {
        let cleanResponse = response
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          cleanResponse = jsonMatch[0];
        }
        
        const parsedResponse = JSON.parse(cleanResponse);
        
        // Validate the response structure
        if (!parsedResponse || typeof parsedResponse !== 'object') {
          throw new Error('Invalid response: not a valid object');
        }
        
        if (!parsedResponse.words || !Array.isArray(parsedResponse.words)) {
          console.warn('Response structure:', parsedResponse);
          throw new Error('Invalid response structure: words array is missing');
        }
        
        if (parsedResponse.words.length === 0) {
          throw new Error('No more words were found in the analysis');
        }
        
        // Merge with existing words if loading more
        if (isLoadMore && wordAnalysis[0]) {
          const mergedAnalysis = {
            ...wordAnalysis[0],
            words: [...wordAnalysis[0].words, ...parsedResponse.words]
          };
          setWordAnalysis([mergedAnalysis]);
        } else {
          // Store the complete analysis (Teacher Mode style - all at once)
          setWordAnalysis([parsedResponse]);
          setWordAnalysisPage(currentPage); // Track which page this data is for
        }
        
        setWordBatch(batchNumber);
        console.log(`Successfully analyzed ${parsedResponse.words.length} new words (batch ${batchNumber})`);

        // 💾 SAVE FIRST BATCH TO CACHE ONLY
        if (!isLoadMore && pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, 'wordAnalysis', parsedResponse);
          console.log('💾 Saved to cache: Word Analysis (batch 1)');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was:', response);
        setError(`Failed to parse word analysis: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error in Word Analysis:', error);
      setError(error.message || 'Failed to analyze words');
    } finally {
      setAnalyzingWords(false);
    }
  };

  // Stop all speech
  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentSpeakingId(null);
      setSpeakingWordIndex(null);
      console.log('🔇 Speech stopped');
    }
  };

  // Enhanced function to speak text naturally with proper language detection
  // v10.1.1: Fixed voice loading and Chrome bug workaround
  const handleSpeakText = async (text, language, id) => {
    if ('speechSynthesis' in window) {
      // If clicking the same button while speaking, stop
      if (currentSpeakingId === id) {
        handleStopSpeech();
        return;
      }
      
      // v10.1.1: Reset speech synthesis to fix Chrome bug
      resetSpeechSynthesis();
      
      // Ensure voices are loaded
      await ensureVoicesLoaded();
      
      // Strip HTML tags for speech
      const cleanText = text?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
      
      if (!cleanText) {
        console.log('⚠️ No text to speak');
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Map detected language to speech synthesis language codes
      const languageMap = {
        'Telugu': 'te-IN',
        'తెలుగు': 'te-IN',
        'Hindi': 'hi-IN',
        'हिंदी': 'hi-IN',
        'Tamil': 'ta-IN',
        'தமிழ்': 'ta-IN',
        'Kannada': 'kn-IN',
        'ಕನ್ನಡ': 'kn-IN',
        'Malayalam': 'ml-IN',
        'മലയാളം': 'ml-IN',
        'Bengali': 'bn-IN',
        'বাংলা': 'bn-IN',
        'English': 'en-US'
      };
      
      const langCode = languageMap[language] || 'en-US';
      utterance.lang = langCode;
      utterance.rate = 0.85; // Natural speaking pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // v10.1.1: Use voice service for better voice selection
      const selectedVoice = getBestVoice(langCode);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(`🔊 Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      }
      
      // Set speaking state
      setCurrentSpeakingId(id);
      if (id !== undefined) {
        setSpeakingWordIndex(id);
      }
      
      utterance.onend = () => {
        setCurrentSpeakingId(null);
        setSpeakingWordIndex(null);
      };
      
      utterance.onerror = (error) => {
        console.error('Speech error:', error);
        setCurrentSpeakingId(null);
        setSpeakingWordIndex(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setError('Text-to-speech is not supported in your browser');
    }
  };

  // Helper specifically for word pronunciation
  const handleSpeakWord = (word, language, index) => {
    handleSpeakText(word, language, index);
  };

  // Removed Read Text and Explain features - user requested to remove these functions

  // Fun exam prep tips for progress display
  const examPrepTips = [
    "Did you know? Active recall is proven to boost memory retention by 50%!",
    "Pro tip: Taking breaks every 25 minutes improves focus and retention!",
    "Fun fact: Teaching concepts to others is one of the best ways to learn!",
    "Remember: Practice questions are better than just reading for exams!",
    "Studies show spaced repetition is more effective than cramming!",
    "Tip: Writing answers by hand activates more brain regions than typing!",
    "Research suggests testing yourself is better than re-reading notes!",
    "Fun fact: Exercise before studying can boost memory by up to 20%!",
    "Remember: Consistency beats intensity when preparing for exams!",
    "Pro tip: Explaining concepts aloud helps identify knowledge gaps!",
    "Did you know? Handwritten notes lead to better conceptual understanding!",
    "Fun fact: Using multiple study methods creates stronger neural pathways!",
    "Tip: Getting enough sleep consolidates learning into long-term memory!",
    "🎨 Visual learners: Try creating mind maps to connect concepts!",
    "🔥 Remember: Short, focused study sessions are more effective than long ones!"
  ];

  // Rotate tips every 3 seconds during exam prep
  useEffect(() => {
    if (generatingExam && examTotalChunks > 0) {
      const interval = setInterval(() => {
        setExamCurrentTip((prev) => (prev + 1) % examPrepTips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [generatingExam, examTotalChunks, examPrepTips.length]);

  // Rotate tips every 3 seconds during chapter generation
  useEffect(() => {
    if (loading && chapterProgress.total > 0) {
      const interval = setInterval(() => {
        setChapterProgress(prev => ({ ...prev, tipIndex: (prev.tipIndex + 1) % examPrepTips.length }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading, chapterProgress.total, examPrepTips.length]);

  // Exam Preparation handlers
  const handleGenerateExamPrep = async () => {
    if (!pdfDocument) {
      setError('No PDF loaded');
      return;
    }

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    setGeneratingExam(true);
    setError(null);
    setExamChunkProgress(0);
    setExamCurrentTip(0);

    try {
      // Check cache first
      const cacheKey = `examPrep_full`;
      const cached = await getCachedData(pdfId, currentPage, cacheKey);
      if (cached) {
        console.log('⚡ Loading exam prep from cache');
        setExamPrepResponse(cached);
        setExamPrepPage(currentPage);
        setUsedCache(true);
        setGeneratingExam(false);
        setExamChunkProgress(0);
        setExamTotalChunks(0);
        return;
      }

      // Extract full PDF text
      console.log('📖 Extracting full PDF text for exam prep...');
      const fullText = await extractFullPdfText(pdfDocument);
      
      // Split into smaller chunks (3000 characters each for better token management)
      const chunkSize = 3000;
      const chunks = [];
      for (let i = 0; i < fullText.length; i += chunkSize) {
        chunks.push(fullText.substring(i, i + chunkSize));
      }
      
      const totalChunksToProcess = Math.min(chunks.length, 5);
      setExamTotalChunks(totalChunksToProcess);
      console.log(`📚 Processing ${totalChunksToProcess} chunks...`);
      
      // Process each chunk and merge results
      const mergedResponse = {
        mcqs: [],
        shortAnswer: [],
        longAnswer: []
      };
      
      for (let i = 0; i < totalChunksToProcess; i++) { // Process first 5 chunks
        setExamChunkProgress(i + 1);
        console.log(`🔄 Processing chunk ${i + 1}/${totalChunksToProcess}...`);
        
        try {
          const chunkResponse = await generateExamPrep(fullText, chunks[i], i + 1, chunks.length);
          
          if (chunkResponse.mcqs) mergedResponse.mcqs.push(...chunkResponse.mcqs);
          if (chunkResponse.shortAnswer) mergedResponse.shortAnswer.push(...chunkResponse.shortAnswer);
          if (chunkResponse.longAnswer) mergedResponse.longAnswer.push(...chunkResponse.longAnswer);
        } catch (chunkError) {
          console.warn(`⚠️ Chunk ${i + 1} failed:`, chunkError.message);
          // Continue with next chunk
          continue;
        }
      }
      
      setExamPrepResponse(mergedResponse);
      setExamPrepPage(currentPage);
      setUsedCache(false);
      
      // v7.2.24: Track AI query for analytics
      if (onAIQuery) {
        onAIQuery('exam_prep', 'Exam preparation');
      }
      
      // Cache the result
      await saveCachedData(pdfId, currentPage, cacheKey, mergedResponse);
      console.log('✅ Exam prep generated and cached');
      
    } catch (error) {
      console.error('Error generating exam prep:', error);
      setError(error.message || 'Failed to generate exam preparation');
    } finally {
      setGeneratingExam(false);
      setExamChunkProgress(0);
      setExamTotalChunks(0);
    }
  };

  const handleGenerateLongAnswer = async (questionIndex) => {
    if (!pdfDocument || !examPrepResponse) return;

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    setGeneratingAnswer(questionIndex);

    try {
      const question = examPrepResponse.longAnswer[questionIndex];
      const fullText = await extractFullPdfText(pdfDocument);
      
      console.log('📝 Generating long answer for question:', question.question);
      console.log('📚 Hints:', question.hints);
      console.log('📄 Page References:', question.pageReferences);
      
      const answer = await generateLongAnswer(
        question.question || question.original,
        fullText,
        question.pageReferences,
        question.hints
      );
      
      console.log('✅ Long answer generated (type):', typeof answer);
      console.log('✅ Long answer generated (value):', answer);
      
      // Handle different response types
      let finalAnswer = answer;
      
      if (typeof answer === 'object') {
        console.warn('⚠️ Answer is object, attempting to extract text...');
        // If it's an array, join it
        if (Array.isArray(answer)) {
          finalAnswer = answer.map(item => {
            if (typeof item === 'string') return item;
            if (item && item.text) return item.text;
            if (item && item.content) return item.content;
            return JSON.stringify(item);
          }).join('\n\n');
        } else if (answer && answer.text) {
          finalAnswer = answer.text;
        } else if (answer && answer.content) {
          finalAnswer = answer.content;
        } else {
          finalAnswer = JSON.stringify(answer, null, 2);
        }
      }
      
      console.log('✅ Final answer to display:', finalAnswer.substring(0, 100) + '...');
      
      setExamAnswers({
        ...examAnswers,
        [`long_answer_${questionIndex}`]: finalAnswer
      });
      
    } catch (error) {
      console.error('❌ Error generating long answer:', error);
      setError(`Failed to generate answer: ${error.message}`);
    } finally {
      setGeneratingAnswer(null);
    }
  };

  const evaluateExamMCQ = (selectedAnswers) => {
    if (!examPrepResponse || !examPrepResponse.mcqs) return;

    let correct = 0;
    const results = examPrepResponse.mcqs.map((mcq, index) => {
      const userAnswer = selectedAnswers[index];
      const isCorrect = userAnswer === mcq.correctAnswer;
      if (isCorrect) correct++;
      return {
        isCorrect,
        correctAnswer: mcq.correctAnswer,
        explanation: mcq.explanation
      };
    });

    return {
      score: (correct / examPrepResponse.mcqs.length) * 100,
      correct,
      total: examPrepResponse.mcqs.length,
      results
    };
  };

  const clearExamPrep = async () => {
    // v7.2.26: Also clear the cache so regeneration works
    if (pdfId && examPrepPage) {
      await clearPageCache(pdfId, examPrepPage, 'examPrep_full');
      console.log('🗑️ Cleared Exam Prep cache for page', examPrepPage);
    }
    
    setExamPrepResponse(null);
    setExamPrepPage(null);
    setExamAnswers({});
    setError(null);
  };

  const handleExplainText = async (scope) => {
    // V3.0.3: Support page/chapter scope selection
    if (!pageText && scope === 'page') {
      setError('Please load a PDF page first');
      return;
    }
    
    if (!pdfDocument && scope === 'chapter') {
      setError('PDF document not loaded. Please try again.');
      return;
    }

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    // Store scope selection and hide selector
    setExplainScope(scope);
    setShowExplainScopeSelector(false);

    // Determine text to analyze based on scope and selection
    let textToExplain;
    let cacheKey;
    
    if (editableSelectedText) {
      // If there's selected text, always use that regardless of scope
      textToExplain = editableSelectedText;
      cacheKey = 'explain_selection';
    } else if (scope === 'page') {
      textToExplain = pageText;
      cacheKey = 'explain_fullpage';
    } else {
      // Chapter mode: extract full text
      console.log('📖 Extracting full chapter text for Smart Explain...');
      textToExplain = await extractFullPdfText(pdfDocument);
      
      // Limit to first 25,000 characters
      if (textToExplain.length > 25000) {
        textToExplain = textToExplain.substring(0, 25000);
        console.log('⚠️ Chapter text truncated to 25,000 characters');
      }
      cacheKey = 'explain_chapter';
    }

    if (!textToExplain) {
      setError('No content available to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setUsedCache(false);
    
    // Initialize progress tracking (will be set to actual chunk count later)
    setChapterProgress({ current: 0, total: 0, tipIndex: 0 });
    
    console.log(`📝 [Smart Explain] Starting analysis (${scope}):`, {
      textLength: textToExplain.length,
      textPreview: textToExplain.substring(0, 100),
      isSelection: !!editableSelectedText,
      pageNumber: currentPage,
      scope
    });

    try {
      // 🔍 CHECK CACHE FIRST
      // Use different cache keys for selection vs full page vs chapter
      
      // Only use cache for full page, not selections (selections are dynamic)
      if (pdfId && currentPage && !editableSelectedText) {
        const cachedData = await getCachedData(pdfId, currentPage, cacheKey);
        if (cachedData) {
          console.log(`⚡ Cache HIT: Using cached Page Explanation`);
          setExplainResponse(cachedData);
          setExplainResponsePage(currentPage);
          setUsedCache(true);
          setLoading(false);
          return;
        } else {
          console.log(`📊 Cache MISS: Generating new explanation for page ${currentPage}`);
        }
      } else if (editableSelectedText) {
        console.log(`📝 Explaining selected text (not cached): "${editableSelectedText.substring(0, 50)}..."`);
      }

      // 📚 GET PRIOR CONTEXT FOR ANSWER CLUES
      let priorContext = [];
      if (pdfId && currentPage > 1) {
        priorContext = await getPriorPagesContext(pdfId, currentPage, 10);
        if (priorContext && priorContext.length > 0) {
          console.log(`📖 Using context from ${priorContext.length} prior pages for answer clues`);
        }
      }

      // 🧠 SMART CHUNKING: Check if text is too large
      const CHUNK_SIZE = 2000; // ~2000 characters per chunk
      const needsChunking = textToExplain.length > CHUNK_SIZE && !editableSelectedText;

      if (needsChunking) {
        console.log(`📦 Text is large (${textToExplain.length} chars), using smart chunking...`);
        
        // Split into chunks
        const chunks = [];
        for (let i = 0; i < textToExplain.length; i += CHUNK_SIZE) {
          chunks.push(textToExplain.substring(i, i + CHUNK_SIZE));
        }
        
        console.log(`📦 Processing ${chunks.length} chunks...`);
        
        // Set actual chunk count for progress tracking
        if (scope === 'chapter') {
          setChapterProgress({ current: 0, total: chunks.length, tipIndex: 0 });
        }
        
        // Process each chunk
        const chunkResults = [];
        for (let i = 0; i < chunks.length; i++) {
          try {
            console.log(`📦 Processing chunk ${i + 1}/${chunks.length}...`);
            
            // Update progress
            if (scope === 'chapter') {
              setChapterProgress(prev => ({ ...prev, current: i + 1 }));
            }
            
            const chunkResponse = await generateExplanation(chunks[i], priorContext, {
              educationalLevel: pdfMetadata?.class || pdfMetadata?.educationalLevel,
              subject: pdfMetadata?.subject
            });
            
            let cleanResponse = chunkResponse
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/g, '')
              .trim();
            
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
              cleanResponse = jsonMatch[0];
            }
            
            const parsedChunk = JSON.parse(cleanResponse);
            chunkResults.push(parsedChunk);
          } catch (chunkError) {
            console.error(`Error processing chunk ${i + 1}:`, chunkError);
            // Continue with other chunks even if one fails
          }
        }
        
        // 🔗 MERGE CHUNKS
        console.log(`🔗 Merging ${chunkResults.length} chunks...`);
        const mergedResponse = {
          contentType: chunkResults.find(r => r.contentType === 'exercise')?.contentType || 
                       chunkResults.find(r => r.contentType === 'mixed')?.contentType || 
                       chunkResults[0]?.contentType || 'regular',
          explanation: chunkResults.map(r => r.explanation).filter(Boolean).join('\n\n'),
          exercises: chunkResults.flatMap(r => r.exercises || []),
          importantNotes: chunkResults.flatMap(r => r.importantNotes || []),
          analogy: chunkResults.find(r => r.analogy)?.analogy || '',
          pyq: chunkResults.map(r => r.pyq).filter(Boolean).join('\n'),
          demo: chunkResults.find(r => r.demo)?.demo || ''
        };
        
        setExplainResponse(mergedResponse);
        setExplainResponsePage(currentPage); // Track page
        console.log(`✅ Smart chunking complete: ${chunkResults.length} chunks merged`);
        
        // v7.2.24: Track AI query for analytics
        if (onAIQuery) {
          onAIQuery('smart_explain_chunked', 'Chapter chunked explain');
        }

        // 💾 SAVE TO CACHE
        if (pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, cacheKey, mergedResponse);
          console.log('💾 Saved to cache: Explanation (chunked)');
        }
        
        setLoading(false);
        return;
      }

      // 📡 SINGLE CHUNK PROCESSING (original flow)
      console.log(`🔄 Analyzing ${selectedText ? 'selected text' : 'full page'} for exercises and notes...`);
      // v7.2.25: Pass educational level for adaptive responses
      const response = await generateExplanation(textToExplain, priorContext, {
        educationalLevel: pdfMetadata?.class || pdfMetadata?.educationalLevel,
        subject: pdfMetadata?.subject
      });
      
      console.log('📝 [Smart Explain] Raw AI response:', {
        length: response?.length || 0,
        preview: response?.substring(0, 200) || '[EMPTY]',
        hasContent: !!response
      });
      
      // Try to parse JSON response
      try {
        // v7.2.25: Enhanced cleaning - Remove ALL markdown code blocks and variations
        let cleanResponse = response
          .replace(/^```json\s*/gim, '')  // Start of string/line
          .replace(/```json\s*/gi, '')     // Anywhere in text
          .replace(/^```\s*json\s*/gim, '') // With space
          .replace(/```\s*$/gim, '')       // End code blocks
          .replace(/```/g, '')             // Any remaining backticks
          .trim();
        
        // Extract JSON using balanced brace matching
        let braceCount = 0;
        let jsonStart = -1;
        let jsonEnd = -1;
        
        for (let i = 0; i < cleanResponse.length; i++) {
          if (cleanResponse[i] === '{') {
            if (jsonStart === -1) jsonStart = i;
            braceCount++;
          }
          if (cleanResponse[i] === '}') {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
        
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error('No complete JSON object found in response');
        }
        
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
        
        console.log('📝 [Smart Explain] Attempting to parse JSON, length:', cleanResponse.length);
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(cleanResponse);
        } catch (firstParseError) {
          console.warn('⚠️ First parse failed, attempting JSON repair...');
          
          // v7.2.13: Escape literal newlines and control chars inside string values
          let repairedJson = cleanResponse;
          
          // Step 1: Escape newlines, tabs, and other control characters inside strings
          repairedJson = repairedJson.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
            const escaped = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/[\x00-\x1F]/g, (char) => '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4));
            return `"${escaped}"`;
          });
          
          // Step 2: Fix other common JSON issues
          repairedJson = repairedJson
            .replace(/"([^"]*?)$/gm, '"$1"')
            .replace(/"\s*\n\s*"/g, '",\n"')
            .replace(/"\s*\n\s*\{/g, '",\n{')
            .replace(/\}\s*\n\s*\{/g, '},\n{')
            .replace(/,\s*([}\]])/g, '$1');
          
          console.log('🔧 Attempting to parse repaired JSON...');
          try {
            parsedResponse = JSON.parse(repairedJson);
            console.log('✅ JSON repair successful!');
          } catch (secondParseError) {
            // Step 3: More aggressive repair - try to salvage partial response
            console.warn('⚠️ Second parse failed, attempting partial recovery...');
            
            const partialResponse = {};
            const fields = ['explanation', 'exercises', 'importantNotes', 'summary', 'realWorldExamples'];
            
            for (const field of fields) {
              const regex = new RegExp(`"${field}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|\\[[^\\]]*\\])`, 's');
              const match = repairedJson.match(regex);
              if (match) {
                try {
                  partialResponse[field] = JSON.parse(match[1]);
                } catch {
                  if (match[1].startsWith('"')) {
                    partialResponse[field] = match[1].slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"');
                  }
                }
              }
            }
            
            if (Object.keys(partialResponse).length > 0) {
              console.log('✅ Partial JSON recovery successful, fields:', Object.keys(partialResponse));
              parsedResponse = partialResponse;
            } else {
              throw secondParseError;
            }
          }
        }
        
        console.log('✅ [Smart Explain] Successfully parsed JSON:', {
          hasExplanation: !!parsedResponse.explanation,
          hasExercises: !!parsedResponse.exercises,
          hasImportantNotes: !!parsedResponse.importantNotes,
          exerciseCount: parsedResponse.exercises?.length || 0,
          keys: Object.keys(parsedResponse)
        });
        
        // v7.2.26: Extract and parse circuitVisualization from response
        // AI may return circuit data in multiple ways - handle all of them
        let circuitVisualization = null;
        
        // Case 1: Check if circuitVisualization is already in the response as a proper field
        if (parsedResponse.circuitVisualization) {
          if (typeof parsedResponse.circuitVisualization === 'string') {
            try {
              circuitVisualization = JSON.parse(parsedResponse.circuitVisualization);
              console.log('🔌 [Circuit] Parsed circuitVisualization from string field');
            } catch (e) {
              console.warn('⚠️ [Circuit] Failed to parse circuitVisualization string:', e);
            }
          } else {
            circuitVisualization = parsedResponse.circuitVisualization;
            console.log('🔌 [Circuit] Found circuitVisualization as object');
          }
        }
        
        // Case 2: Check if the entire parsedResponse IS the circuit visualization
        // (AI sometimes returns just the circuit JSON without the full response structure)
        if (!circuitVisualization && parsedResponse.type === 'logic_circuit') {
          circuitVisualization = parsedResponse;
          console.log('🔌 [Circuit] Entire response is circuit visualization');
          // Create a proper response structure with the circuit
          parsedResponse = {
            explanation: `<p>This circuit implements the function <strong>${circuitVisualization.title || 'Logic Circuit'}</strong>.</p>`,
            circuitVisualization: circuitVisualization
          };
        }
        
        // Case 3: Check if circuitVisualization JSON is embedded in the explanation text
        // Using brace-matching to properly handle nested JSON objects
        if (!circuitVisualization && parsedResponse.explanation) {
          const explanation = parsedResponse.explanation;
          
          // Helper function to extract JSON using brace matching
          const extractJsonAt = (text, startIdx) => {
            let depth = 0;
            let endIdx = startIdx;
            for (let i = startIdx; i < text.length; i++) {
              if (text[i] === '{') depth++;
              if (text[i] === '}') depth--;
              if (depth === 0 && i > startIdx) {
                endIdx = i + 1;
                break;
              }
            }
            return text.slice(startIdx, endIdx);
          };
          
          // Pattern 1: {"circuitVisualization": {...}}
          const circuitWrapperStart = explanation.indexOf('{"circuitVisualization"');
          if (circuitWrapperStart !== -1) {
            const fullMatch = extractJsonAt(explanation, circuitWrapperStart);
            try {
              const parsed = JSON.parse(fullMatch);
              circuitVisualization = parsed.circuitVisualization || parsed;
              parsedResponse.explanation = explanation.replace(fullMatch, '').trim();
              console.log('🔌 [Circuit] Extracted {"circuitVisualization":...} using brace matching');
            } catch (e) {
              console.warn('⚠️ [Circuit] Failed to parse circuitVisualization wrapper:', e, fullMatch.substring(0, 100));
            }
          }
          
          // Pattern 2: Standalone {"type":"logic_circuit",...}
          if (!circuitVisualization) {
            let startIdx = parsedResponse.explanation.indexOf('{"type":"logic_circuit"');
            if (startIdx === -1) {
              startIdx = parsedResponse.explanation.indexOf('{"type": "logic_circuit"');
            }
            if (startIdx !== -1) {
              const fullCircuitJson = extractJsonAt(parsedResponse.explanation, startIdx);
              try {
                circuitVisualization = JSON.parse(fullCircuitJson);
                parsedResponse.explanation = parsedResponse.explanation.replace(fullCircuitJson, '').trim();
                console.log('🔌 [Circuit] Extracted standalone circuit JSON');
              } catch (e) {
                console.warn('⚠️ [Circuit] Failed to parse standalone circuit:', e);
              }
            }
          }
        }
        
        // Add circuitVisualization to parsedResponse if found
        if (circuitVisualization) {
          parsedResponse.circuitVisualization = circuitVisualization;
          console.log('🔌 [Circuit] Circuit visualization ready:', {
            title: circuitVisualization.title,
            hasGates: !!(circuitVisualization.gates?.length),
            hasTruthTable: !!circuitVisualization.truthTable,
            hasROM: !!circuitVisualization.romContent
          });
        }
        
        // Note: Circuit JSON cleanup is done after extractFromStructuredResponse
        // using brace-matching for proper nested JSON handling
        
        // 🎨 Extract 3D visualizations from all text fields
        const { response: cleanedResponse, visualizations } = extractFromStructuredResponse(parsedResponse);
        
        console.log('🎨 [Smart Explain] Extracted visualizations:', {
          count: visualizations.length,
          sections: visualizations.map(v => v.section)
        });
        
        // Add visualizations array to response for rendering
        cleanedResponse._visualizations = visualizations;
        
        // v7.2.26: Ensure circuitVisualization is preserved AND clean JSON from explanation
        if (circuitVisualization) {
          cleanedResponse.circuitVisualization = circuitVisualization;
        }
        
        // v7.2.27: ALWAYS clean any remaining circuit JSON from explanation (even if no circuit was extracted)
        if (cleanedResponse.explanation) {
          let explanation = cleanedResponse.explanation;
          
          // Function to remove JSON object starting at a given index using brace matching
          const removeJsonAt = (text, startIdx) => {
            let depth = 0;
            let endIdx = startIdx;
            for (let i = startIdx; i < text.length; i++) {
              if (text[i] === '{') depth++;
              if (text[i] === '}') depth--;
              if (depth === 0 && i > startIdx) {
                endIdx = i + 1;
                break;
              }
            }
            return text.slice(0, startIdx) + text.slice(endIdx);
          };
          
          // Keep removing circuit JSON until none remain
          let maxIterations = 10; // Safety limit
          while (maxIterations > 0) {
            maxIterations--;
            
            // Look for {"circuitVisualization": wrapper
            let circuitStart = explanation.indexOf('{"circuitVisualization"');
            if (circuitStart !== -1) {
              console.log('🧹 [Circuit] Found {"circuitVisualization" at index', circuitStart);
              explanation = removeJsonAt(explanation, circuitStart);
              continue;
            }
            
            // Look for {"type":"logic_circuit" standalone
            circuitStart = explanation.indexOf('{"type":"logic_circuit"');
            if (circuitStart !== -1) {
              console.log('🧹 [Circuit] Found {"type":"logic_circuit" at index', circuitStart);
              explanation = removeJsonAt(explanation, circuitStart);
              continue;
            }
            
            // Look for {"type": "logic_circuit" with space
            circuitStart = explanation.indexOf('{"type": "logic_circuit"');
            if (circuitStart !== -1) {
              console.log('🧹 [Circuit] Found {"type": "logic_circuit" at index', circuitStart);
              explanation = removeJsonAt(explanation, circuitStart);
              continue;
            }
            
            // No more circuit JSON found
            break;
          }
          
          cleanedResponse.explanation = explanation.trim();
          
          // If explanation is now empty or just whitespace, add a placeholder
          if (!cleanedResponse.explanation || cleanedResponse.explanation.length < 10) {
            cleanedResponse.explanation = '<p>See the circuit visualization below for the implementation.</p>';
          }
          
          console.log('🧹 [Circuit] Final explanation length:', cleanedResponse.explanation.length);
        }
        
        setExplainResponse(cleanedResponse);
        setExplainResponsePage(currentPage); // ✅ Track which page this explanation is for
        
        // v7.2.27: Auto-detect any remaining circuit JSON and show visualization
        // This catches cases where cleanup failed
        if (cleanedResponse.explanation) {
          const expText = cleanedResponse.explanation;
          const circuitStart = expText.indexOf('{"circuitVisualization"');
          const altStart = expText.indexOf('{"type":"logic_circuit"') !== -1 
            ? expText.indexOf('{"type":"logic_circuit"') 
            : expText.indexOf('{"type": "logic_circuit"');
          
          const startIdx = circuitStart !== -1 ? circuitStart : altStart;
          if (startIdx !== -1) {
            // Extract using brace matching
            let depth = 0;
            let endIdx = startIdx;
            for (let i = startIdx; i < expText.length; i++) {
              if (expText[i] === '{') depth++;
              if (expText[i] === '}') depth--;
              if (depth === 0 && i > startIdx) {
                endIdx = i + 1;
                break;
              }
            }
            const jsonStr = expText.slice(startIdx, endIdx);
            try {
              const parsed = JSON.parse(jsonStr);
              const circuitObj = parsed.circuitVisualization || parsed;
              console.log('🔌 [Circuit] Auto-detected circuit in final response, setting circuitData');
              setCircuitData(circuitObj);
              // Also ensure it's in the response for rendering
              cleanedResponse.circuitVisualization = circuitObj;
              setExplainResponse({...cleanedResponse});
            } catch (e) {
              console.warn('⚠️ [Circuit] Failed to parse auto-detected circuit:', e);
            }
          }
        }

        // v7.2.24: Track AI query for analytics
        if (onAIQuery) {
          onAIQuery('smart_explain', editableSelectedText ? 'Selection explain' : 'Page explain');
        }

        // 💾 SAVE TO CACHE (only for full page, not selections)
        if (pdfId && currentPage && !editableSelectedText) {
          await saveCachedData(pdfId, currentPage, cacheKey, cleanedResponse);
          console.log('💾 Saved to cache: Explanation');
        } else if (editableSelectedText) {
          console.log('✅ Explanation generated for selected text (not cached)');
        }
      } catch (parseError) {
        console.error('❌ [Smart Explain] JSON parse error (even after repair):', parseError);
        console.error('❌ [Smart Explain] Response:', response?.substring(0, 800));
        
        // v7.2.25: Clean up the raw response before displaying
        let fallbackContent = (response || 'No response received')
          .replace(/^```json\s*/gim, '')
          .replace(/```json\s*/gi, '')
          .replace(/```\s*$/gim, '')
          .replace(/```/g, '')
          .trim();
        
        // If parsing fails, store as formatted plain text
        setExplainResponse({ 
          explanation: '<div style="white-space: pre-wrap; font-family: inherit;">' + 
            fallbackContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
            '</div>',
          _parseError: true
        });
        setExplainResponsePage(currentPage); // ✅ Still track the page
        console.log('⚠️ Stored as plain text due to parse error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActivities = async (scope = 'page') => {
    // V3.0.3: Support page/chapter scope selection
    if (!pageText && scope === 'page') {
      setError('No page content available. Please load a PDF page first.');
      return;
    }
    
    if (!pdfDocument && scope === 'chapter') {
      setError('PDF document not loaded. Please try again.');
      return;
    }

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    // Store scope selection and hide selector
    setActivitiesScope(scope);
    setShowActivitiesScopeSelector(false);

    // Determine text to analyze based on scope
    let contextText;
    let cacheKey;
    
    if (scope === 'page') {
      contextText = pageText;
      cacheKey = 'activities';
    } else {
      // Chapter mode: extract full text
      console.log('📖 Extracting full chapter text for Activities...');
      contextText = await extractFullPdfText(pdfDocument);
      
      // Limit to first 20,000 characters
      if (contextText.length > 20000) {
        contextText = contextText.substring(0, 20000);
        console.log('⚠️ Chapter text truncated to 20,000 characters');
      }
      cacheKey = 'activities_chapter';
    }

    // V3.0: Removed hardcoded API key check - multi-provider system handles this
    // Will try Groq first, then fall back to Gemini automatically

    setLoading(true);
    setError(null);
    setQuizAnswers({});
    setQuizResults(null);
    setUsedCache(false);
    
    // Initialize progress tracking for chapter generation
    if (scope === 'chapter') {
      setChapterProgress({ current: 0, total: 3, tipIndex: 0 });
      // Simulate progress steps
      setTimeout(() => setChapterProgress(prev => ({ ...prev, current: 1 })), 1000);
      setTimeout(() => setChapterProgress(prev => ({ ...prev, current: 2 })), 3000);
    } else {
      setChapterProgress({ current: 0, total: 0, tipIndex: 0 });
    }
    
    try {
      // 🔍 CHECK CACHE FIRST
      if (pdfId && currentPage) {
        const cachedData = await getCachedData(pdfId, currentPage, cacheKey);
        if (cachedData) {
          console.log(`⚡ Cache HIT: Using cached Activities (${scope})`);
          setActivitiesResponse(cachedData);
          setUsedCache(true);
          setLoading(false);
          return;
        }
      }

      // 📚 GET PRIOR CONTEXT FOR EXERCISES (only for page mode)
      if (scope === 'page' && pdfId && currentPage > 1) {
        const priorContext = await getPriorPagesContext(pdfId, currentPage, 5);
        if (priorContext && priorContext.length > 0) {
          console.log(`📖 Using context from ${priorContext.length} prior pages for exercises`);
          const contextSummary = priorContext
            .map(p => `Page ${p.pageNumber}: ${p.summary}`)
            .join('\n');
          contextText = `PRIOR CHAPTER CONTEXT:\n${contextSummary}\n\nCURRENT PAGE:\n${pageText}`;
        }
      }

      // 📡 GENERATE NEW WITH CONTEXT
      const response = await generateActivities(contextText);
      
      // Use robust JSON parsing with auto-repair
      try {
        console.log('✅ [Activities] Raw response, first 500 chars:', response?.substring(0, 500));
        
        // Step 1: Parse the raw JSON string from AI
        let parsedResponse;
        
        // Try to extract JSON from the response (it might have markdown or extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log('✅ [Activities] Successfully parsed JSON from response');
          } catch (e) {
            // v7.2.13: More robust JSON repair with control character escaping
            console.warn('⚠️ [Activities] First parse failed, attempting repair...');
            let fixedJson = jsonMatch[0];
            
            // Step 1: Escape control characters inside string values
            fixedJson = fixedJson.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
              const escaped = content
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/[\x00-\x1F]/g, (char) => '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4));
              return `"${escaped}"`;
            });
            
            // Step 2: Fix other common issues
            fixedJson = fixedJson
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']')
              .replace(/'/g, '"');
            
            try {
              parsedResponse = JSON.parse(fixedJson);
              console.log('✅ [Activities] Parsed JSON after repair');
            } catch (e2) {
              console.error('❌ [Activities] Repair failed, trying partial recovery...');
              
              // Step 3: Try to extract individual fields
              const partialResponse = { mcqs: [], practiceQuestions: [], handsOnActivities: [] };
              const arrayFields = ['mcqs', 'practiceQuestions', 'handsOnActivities', 'discussionPrompts', 'realWorldApplications'];
              
              for (const field of arrayFields) {
                const regex = new RegExp(`"${field}"\\s*:\\s*(\\[(?:[^\\[\\]]|\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])*\\])*\\])`, 's');
                const fmatch = fixedJson.match(regex);
                if (fmatch) {
                  try {
                    partialResponse[field] = JSON.parse(fmatch[1]);
                  } catch { /* skip */ }
                }
              }
              
              if (partialResponse.mcqs?.length > 0 || partialResponse.practiceQuestions?.length > 0) {
                console.log('✅ [Activities] Partial recovery successful');
                parsedResponse = partialResponse;
              } else {
                throw e2;
              }
            }
          }
        } else {
          throw new Error('No JSON object found in response');
        }
        
        // Step 2: Extract visualizations from the parsed object
        const { response: cleanedResponse, visualizations } = extractFromStructuredResponse(parsedResponse);
        
        // Store visualizations separately
        const finalParsedResponse = { ...cleanedResponse, _visualizations: visualizations };
        
        console.log('📦 [Activities] Final parsed response:', finalParsedResponse);
        console.log('📦 [Activities] Has MCQs:', !!finalParsedResponse.mcqs, 'Count:', finalParsedResponse.mcqs?.length || 0);
        console.log('📦 [Activities] Has practiceQuestions:', !!finalParsedResponse.practiceQuestions, 'Count:', finalParsedResponse.practiceQuestions?.length || 0);
        console.log('📦 [Activities] Has handsOnActivities:', !!finalParsedResponse.handsOnActivities, 'Count:', finalParsedResponse.handsOnActivities?.length || 0);
        console.log('📦 [Activities] Has visualizations:', finalParsedResponse._visualizations?.length || 0);
        
        setActivitiesResponse(finalParsedResponse);
        
        // v7.2.24: Track AI query for analytics
        if (onAIQuery) {
          onAIQuery('activities', scope === 'chapter' ? 'Chapter activities' : 'Page activities');
        }
        setActivitiesResponsePage(currentPage);

        // 💾 SAVE TO CACHE
        if (pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, cacheKey, finalParsedResponse);
          console.log(`💾 Saved to cache: Activities (${scope})`);
          const stats = await getCacheStats(pdfId);
          setCacheStats(stats);
          console.log(`📊 Cache: ${stats.pagesCached} pages, ${stats.cacheSizeKB} KB`);
        }
      } catch (parseError) {
        console.error('❌ [Activities] JSON parse error:', parseError);
        console.error('❌ [Activities] Response that failed to parse:', response?.substring(0, 1000));
        // Fallback to displaying raw text if all parsing/repair fails
        setActivitiesResponse({ error: 'Could not parse activities format. Displaying as plain text.', raw: response || 'No response received', _visualizations: [] });
        setActivitiesResponsePage(currentPage);
        console.log('⚠️ Stored as plain text due to parse error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswerChange = (questionIndex, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activitiesResponse?.mcqs) return;

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    // V3.0.3: Removed API key check - multi-provider handles this

    setSubmittingQuiz(true);
    setError(null);

    try {
      // Prepare quiz data for evaluation
      const quizData = activitiesResponse.mcqs.map((mcq, idx) => {
        const isObject = typeof mcq.question === 'object';
        const questionText = isObject ? mcq.question.english : mcq.question;
        const correctAns = isObject ? mcq.correctAnswer.english : mcq.correctAnswer;
        
        return {
          question: questionText,
          userAnswer: quizAnswers[idx] || 'Not answered',
          correctAnswer: correctAns,
          explanation: isObject ? mcq.explanation.english : mcq.explanation
        };
      });

      const prompt = `Evaluate this quiz submission and provide feedback.

Quiz Results:
${JSON.stringify(quizData, null, 2)}

Return ONLY this valid JSON:
{
  "score": "X/Y format",
  "percentage": number,
  "feedback": "Overall feedback message",
  "questionFeedback": [
    {
      "correct": true/false,
      "feedback": "Specific feedback for this question"
    }
  ]
}`;

      // Use multi-provider callLLM
      const { callLLM } = await import('../services/llmService');
      const resultText = await callLLM(prompt, {
        feature: 'quizEvaluation',
        temperature: 0.5,
        maxTokens: 2048
      });
      
      let cleanResponse = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      const results = JSON.parse(cleanResponse);
      setQuizResults(results);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError('Failed to evaluate quiz: ' + err.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleGenerateResources = async () => {
    // Use selected text if available, otherwise use page text
    const contentToAnalyze = selectedText || pageText;
    
    if (!contentToAnalyze) {
      setError('Please load a PDF page first');
      return;
    }

    // 🔒 Check subscription limits
    if (user && subscription) {
      const usageCheck = await trackAIQueryUsage(user.uid);
      if (!usageCheck.allowed) {
        setError(usageCheck.message || 'Daily limit reached. Please upgrade to continue.');
        return;
      }
      if (subscription.refreshUsage) {
        subscription.refreshUsage();
      }
    }

    // V3.0: Removed hardcoded API key check - multi-provider system handles this
    // Will try Groq first, then fall back to Gemini automatically

    setLoading(true);
    setError(null);
    try {
      const response = await generateAdditionalResources(contentToAnalyze, pageText);
      
      // Try to parse JSON response
      try {
        let cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        const parsedResponse = JSON.parse(cleanResponse);
        setResourcesResponse(parsedResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setResourcesResponse({ error: 'Could not parse resources' });
      }
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

  // Convert markdown text to HTML
  const markdownToHtml = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Convert italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Convert bullet points
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    
    // Wrap consecutive <li> tags in <ul>
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert line breaks to paragraphs  
    if (typeof html === 'string') {
      html = html.split('\n\n').map(para => {
      if (para.trim() && !para.startsWith('<h') && !para.startsWith('<ul') && !para.startsWith('<li')) {
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
      }
      return para;
    }).join('');
    }
    
    return html;
  };

  const formatMarkdown = (text) => {
    if (!text || typeof text !== 'string') return null;
    
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

  // Load admin configuration
  const adminConfig = useAdminConfig();
  
  // Language preference: manual override or auto-detection
  const languageOptions = {
    'auto': { language: 'Auto-Detect', emoji: '🔄', isEnglish: null, script: 'Auto' },
    'en': { language: 'English', emoji: '🇬🇧', isEnglish: true, script: 'Latin' },
    'te': { language: 'Telugu (తెలుగు)', emoji: '🇮🇳', isEnglish: false, script: 'Telugu' },
    'hi': { language: 'Hindi (हिंदी)', emoji: '🇮🇳', isEnglish: false, script: 'Devanagari' },
    'ta': { language: 'Tamil (தமிழ்)', emoji: '🇮🇳', isEnglish: false, script: 'Tamil' },
    'kn': { language: 'Kannada (ಕನ್ನಡ)', emoji: '🇮🇳', isEnglish: false, script: 'Kannada' },
    'ml': { language: 'Malayalam (മലയാളം)', emoji: '🇮🇳', isEnglish: false, script: 'Malayalam' },
    'bn': { language: 'Bengali (বাংলা)', emoji: '🇮🇳', isEnglish: false, script: 'Bengali' },
    'gu': { language: 'Gujarati (ગુજરાતી)', emoji: '🇮🇳', isEnglish: false, script: 'Gujarati' },
    'pa': { language: 'Punjabi (ਪੰਜਾਬੀ)', emoji: '🇮🇳', isEnglish: false, script: 'Gurmukhi' },
    'or': { language: 'Odia (ଓଡ଼ିଆ)', emoji: '🇮🇳', isEnglish: false, script: 'Odia' },
    'mr': { language: 'Marathi (मराठी)', emoji: '🇮🇳', isEnglish: false, script: 'Devanagari' }
  };
  
  // Detect language from page text (for auto mode)
  const autoDetectedLang = detectLanguage(pageText);
  
  // Use manual selection if set, otherwise use auto-detection
  // IMPORTANT: If 'auto' is selected, use auto-detection (don't use languageOptions['auto'])
  const detectedLang = (manualLanguage && manualLanguage !== 'auto') 
    ? languageOptions[manualLanguage] 
    : autoDetectedLang;
  const isEnglish = detectedLang.isEnglish;
  // v10.1.2: Read tab is always enabled - users may want word analysis even for English
  const readTabDisabled = false;
  const readTabTooltip = "Word-by-word analysis with pronunciation and meaning";
  
  // Debug logging for language detection
  console.log('🔍 [Language Detection]', {
    mode: manualLanguage ? 'Manual' : 'Auto',
    manualLanguage: manualLanguage || 'none',
    autoDetected: autoDetectedLang.language,
    finalLanguage: detectedLang.language,
    script: detectedLang.script,
    pageTextLength: pageText?.length || 0,
    isEnglish,
    readTabDisabled,
    currentPage
  });

  // Check tab visibility from admin config
  const showTeacherMode = isTabEnabled(adminConfig, 'teacherMode');
  const showMultilingual = isTabEnabled(adminConfig, 'multilingual');
  const showExplain = isTabEnabled(adminConfig, 'explain');
  const showActivities = isTabEnabled(adminConfig, 'activities');
  const showExamPrep = isTabEnabled(adminConfig, 'examPrep');
  const showNotes = isTabEnabled(adminConfig, 'notes');
  const showProTools = isTabEnabled(adminConfig, 'proTools'); // v7.2.28: Tools tab
  const showVyonn = isTabEnabled(adminConfig, 'vyonn'); // v7.2.30: Vyonn AI tab (always enabled by default)

  // Calculate dynamic tab indices based on which tabs are enabled
  const tabIndices = {};
  let currentIndex = 0;
  if (showTeacherMode) { tabIndices.teacher = currentIndex++; }
  if (showMultilingual) { tabIndices.multilingual = currentIndex++; }
  if (showExplain) { tabIndices.explain = currentIndex++; }
  if (showActivities) { tabIndices.activities = currentIndex++; }
  if (showExamPrep) { tabIndices.examPrep = currentIndex++; }
  if (showProTools) { tabIndices.proTools = currentIndex++; }
  if (showVyonn) { tabIndices.vyonn = currentIndex++; }
  if (showNotes) { tabIndices.notes = currentIndex++; }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Paper square elevation={1}>
        {/* Language Indicator & Selector */}
        <Box sx={{ 
          px: { xs: 1.5, md: 2 }, 
          py: { xs: 0.75, md: 1 }, 
          bgcolor: detectedLang.isEnglish ? 'info.lighter' : 'warning.lighter',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, md: 1.5 },
          flexWrap: 'wrap'
        }}>
          {/* Language Selector Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
              Language:
            </Typography>
            <Select
              value={manualLanguage || 'auto'}
              onChange={handleLanguageChange}
              size="small"
              variant="outlined"
              sx={{ 
                minWidth: { xs: 140, sm: 160, md: 180 },
                height: { xs: 28, md: 32 },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                '& .MuiSelect-select': {
                  py: { xs: 0.25, md: 0.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }
              }}
            >
              <MenuItem value="auto">🔄 Auto-Detect</MenuItem>
              <MenuItem value="en">🇬🇧 English</MenuItem>
              <MenuItem value="te">🇮🇳 Telugu (తెలుగు)</MenuItem>
              <MenuItem value="hi">🇮🇳 Hindi (हिंदी)</MenuItem>
              <MenuItem value="ta">🇮🇳 Tamil (தமிழ்)</MenuItem>
              <MenuItem value="kn">🇮🇳 Kannada (ಕನ್ನಡ)</MenuItem>
              <MenuItem value="ml">🇮🇳 Malayalam (മലയാളം)</MenuItem>
              <MenuItem value="bn">🇮🇳 Bengali (বাংলা)</MenuItem>
              <MenuItem value="gu">🇮🇳 Gujarati (ગુજરાતી)</MenuItem>
              <MenuItem value="pa">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</MenuItem>
              <MenuItem value="or">🇮🇳 Odia (ଓଡ଼ିଆ)</MenuItem>
              <MenuItem value="mr">🇮🇳 Marathi (मराठी)</MenuItem>
            </Select>
          </Box>
          
          {/* Current Detection Display */}
          {manualLanguage && (
            <Chip 
              label={`✓ ${detectedLang.language}`}
              size="small"
              color={detectedLang.isEnglish ? 'primary' : 'warning'}
              sx={{ fontWeight: 600 }}
            />
          )}
          
          {!manualLanguage && (
            <Chip 
              label={autoDetectedLang.language}
              size="small"
              color={autoDetectedLang.isEnglish ? 'primary' : 'warning'}
              variant="outlined"
              sx={{ 
                fontWeight: 500,
                height: { xs: 20, md: 24 },
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                '& .MuiChip-label': {
                  px: { xs: 0.75, md: 1 }
                }
              }}
            />
          )}
          
          {/* Provider Info */}
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              flex: 1,
              fontSize: { xs: '0.65rem', md: '0.75rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {detectedLang.isEnglish 
              ? '• Using Groq (Fast) for English'
              : `• Using Gemini (Better multilingual) for ${detectedLang.script}`
            }
          </Typography>
          
          {/* Bilingual Badge */}
          {!detectedLang.isEnglish && (
            <Chip 
              label="Bilingual Mode"
              size="small"
              variant="outlined"
              color="success"
              sx={{
                height: { xs: 20, md: 24 },
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                '& .MuiChip-label': {
                  px: { xs: 0.75, md: 1 }
                }
              }}
            />
          )}
        </Box>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{
            minHeight: { xs: 48, md: 64 },
            '& .MuiTab-root': {
              minHeight: { xs: 48, md: 64 },
              fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
              py: { xs: 1, md: 1.5 },
              px: { xs: 1, sm: 1.5, md: 2 },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.2rem', md: '1.5rem' }
              }
            }
          }}
        >
          {showTeacherMode && <Tab icon={<LearnIcon />} label="Learn" />}
          {showMultilingual && (
            <Tooltip 
              title={readTabTooltip} 
              arrow
              componentsProps={{
                tooltip: {
                  sx: { maxWidth: 300 }
                }
              }}
            >
              <span style={{ display: 'inline-flex' }}>
                <Tab icon={<ReadIcon />} label="Read" disabled={readTabDisabled} />
              </span>
            </Tooltip>
          )}
          {showExplain && <Tab icon={<ExplainIcon />} label="Explain" />}
          {showActivities && <Tab icon={<ActivitiesIcon />} label="Activities" />}
          {showExamPrep && <Tab icon={<ExamIcon />} label="Exam" />}
          {showProTools && <Tab icon={<ToolIcon />} label="Tools" />}
          {showVyonn && <Tab icon={
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/vyonn.png`}
              alt="Vyonn"
              sx={{
                width: 24,
                height: 24,
                filter: 'brightness(0) contrast(1.2)'
              }}
            />
          } label="Vyonn" />}
          {showNotes && <Tab icon={<NotesIcon />} label="Notes" />}
        </Tabs>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Teacher Mode Tab */}
        {showTeacherMode && <TabPanel value={activeTab} index={tabIndices.teacher}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
              {!teacherResponse ? (
                <>
                  <ToggleButtonGroup
                    value={teacherScope}
                    exclusive
                    onChange={(e, value) => value && setTeacherScope(value)}
                    fullWidth
                    size="large"
                    sx={{ mb: 2 }}
                  >
                    <ToggleButton value="page">
                      <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                      This Page
                    </ToggleButton>
                    <ToggleButton value="chapter">
                      <ReadIcon fontSize="small" sx={{ mr: 1 }} />
                      Entire Chapter
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<LearnIcon />}
                    onClick={() => handleTeacherMode(teacherScope)}
                    disabled={loading || !pageText || isAIFeatureDisabled()}
                    sx={{ mb: 1 }}
                  >
                    {loading ? 'Generating...' :
                     isAIFeatureDisabled() ? 'Upgrade to Continue' :
                     'Generate Explanation'}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                    AI-powered teacher-style explanation
                  </Typography>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {teacherScope === 'page' ? 'Page Explanation' : 'Chapter Explanation'}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearTeacherMode}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </Box>
              )}
            </Box>

            {/* Upgrade Prompt for Free Users - Only show when running low or exhausted */}
            {subscription && subscription.isFree && !subscription.loading &&
             subscription.remainingQueries !== undefined &&
             (subscription.remainingQueries === 0 ||
              (subscription.remainingQueries / subscription.usage.limit) <= 0.4) && (
              <UpgradePrompt
                type="limit"
                onUpgrade={onUpgrade}
                remainingQueries={subscription.remainingQueries}
                totalQueries={subscription.usage.limit}
              />
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Show page mismatch warning */}
            {teacherResponse && teacherResponsePage && teacherResponsePage !== currentPage && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Teacher Mode data is from page {teacherResponsePage}. You're viewing page {currentPage}.
                <Button size="small" onClick={clearTeacherMode} sx={{ ml: 1 }}>
                  Clear Old Data
                </Button>
              </Alert>
            )}
            
            {/* Progress Display for Chapter Generation */}
            {loading && teacherScope === 'chapter' && chapterProgress.total > 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={(chapterProgress.current / chapterProgress.total) * 100}
                    size={56}
                    thickness={5}
                    sx={{ color: 'primary.main' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Analyzing Entire Chapter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processing section {chapterProgress.current} of {chapterProgress.total}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {Math.round((chapterProgress.current / chapterProgress.total) * 100)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${(chapterProgress.current / chapterProgress.total) * 100}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        transition: 'width 0.4s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>

                <Alert 
                  severity="info" 
                  icon={false}
                  sx={{ mb: 0, '& .MuiAlert-message': { width: '100%', py: 0.5 } }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      lineHeight: 1.6,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'info.dark'
                    }}
                  >
                    {examPrepTips[chapterProgress.tipIndex]}
                  </Typography>
                </Alert>
              </Paper>
            )}
            
            {loading && (!teacherScope || teacherScope === 'page') && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {teacherResponse && teacherResponsePage === currentPage && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Teacher's Explanation</Typography>
                </Box>
                
                {/* Render structured content with optional English translation */}
                {typeof teacherResponse === 'object' && (teacherResponse.summary || teacherResponse.explanation) ? (
                  <Box>
                    {/* Content Type Badge - v7.2.5: Shows detected content type */}
                    {teacherResponse.contentType && (
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={
                            teacherResponse.contentType === 'rhyme' ? '🎵 Nursery Rhyme' :
                            teacherResponse.contentType === 'poem' ? '📝 Poem' :
                            teacherResponse.contentType === 'story' ? '📖 Story' :
                            teacherResponse.contentType === 'academic' ? '🔬 Academic' :
                            teacherResponse.contentType === 'historical' ? '📊 Historical' :
                            teacherResponse.contentType === 'creative' ? '🎨 Creative' :
                            `📚 ${teacherResponse.contentType}`
                          }
                          color={
                            teacherResponse.contentType === 'rhyme' ? 'secondary' :
                            teacherResponse.contentType === 'poem' ? 'primary' :
                            teacherResponse.contentType === 'story' ? 'success' :
                            'default'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    )}

                    {/* Performance Style - v7.2.5: How to deliver this content */}
                    {teacherResponse.performanceStyle && (
                      <Box sx={{ mb: 3 }}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            bgcolor: teacherResponse.contentType === 'rhyme' ? 'secondary.50' :
                                     teacherResponse.contentType === 'poem' ? 'primary.50' :
                                     teacherResponse.contentType === 'story' ? 'success.50' :
                                     'action.hover',
                            border: '2px dashed',
                            borderColor: teacherResponse.contentType === 'rhyme' ? 'secondary.main' :
                                         teacherResponse.contentType === 'poem' ? 'primary.main' :
                                         teacherResponse.contentType === 'story' ? 'success.main' :
                                         'divider',
                            borderRadius: 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} color={
                              teacherResponse.contentType === 'rhyme' ? 'secondary.main' :
                              teacherResponse.contentType === 'poem' ? 'primary.main' :
                              teacherResponse.contentType === 'story' ? 'success.main' :
                              'text.primary'
                            }>
                              {teacherResponse.contentType === 'rhyme' ? '🎤 How to Sing This Rhyme' :
                               teacherResponse.contentType === 'poem' ? '🎭 How to Recite This Poem' :
                               teacherResponse.contentType === 'story' ? '📢 How to Tell This Story' :
                               '💡 Performance Tips'}
                            </Typography>
                            {/* Listen button for performance style */}
                            <Button
                              size="small"
                              variant="outlined"
                              color={
                                teacherResponse.contentType === 'rhyme' ? 'secondary' :
                                teacherResponse.contentType === 'poem' ? 'primary' :
                                teacherResponse.contentType === 'story' ? 'success' :
                                'inherit'
                              }
                              onClick={() => handleSpeakSection('performanceStyle', teacherResponse.performanceStyle)}
                              startIcon={speakingSection === 'performanceStyle' ? <Stop /> : <VolumeUp />}
                              sx={{ ml: 'auto' }}
                            >
                              {speakingSection === 'performanceStyle' ? 'Stop' : 'Listen'}
                            </Button>
                          </Box>
                          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                            {teacherResponse.performanceStyle}
                          </Typography>
                        </Paper>
                      </Box>
                    )}

                    {/* Summary */}
                    {teacherResponse.summary && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            Summary
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Listen/Stop Button */}
                            {speakingSection === 'summary' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={handleStopSpeaking}
                                startIcon={<Stop />}
                              >
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSpeakSection('summary', teacherResponse.summary)}
                                startIcon={<VolumeUp />}
                              >
                                Listen
                              </Button>
                            )}
                            {/* Explain in English - Only for non-English content */}
                            {!detectedLang?.isEnglish && manualLanguage !== 'English' && !teacherEnglish.summary && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleTranslateSection('summary', teacherResponse.summary)}
                                disabled={translatingSection === 'summary'}
                                startIcon={translatingSection === 'summary' ? <CircularProgress size={14} /> : <TranslateIcon />}
                              >
                                English
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Box dangerouslySetInnerHTML={{ __html: cleanJsonArtifacts(teacherResponse.summary) }} />
                        </Paper>
                        {teacherEnglish.summary && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom display="block">
                              English Explanation:
                            </Typography>
                            <Box 
                              sx={{ '& p': { mb: 1 }, '& ul': { pl: 2, mb: 1 }, '& strong': { fontWeight: 600 } }}
                              dangerouslySetInnerHTML={{ __html: markdownToHtml(teacherEnglish.summary) }} 
                            />
                          </Paper>
                        )}
                      </Box>
                    )}

                    {/* Key Points */}
                    {teacherResponse.keyPoints && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            Key Points
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Listen/Stop Button */}
                            {speakingSection === 'keyPoints' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={handleStopSpeaking}
                                startIcon={<Stop />}
                              >
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSpeakSection('keyPoints', `<ul>${teacherResponse.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>`)}
                                startIcon={<VolumeUp />}
                              >
                                Listen
                              </Button>
                            )}
                            {/* Explain in English - Only for non-English content */}
                            {!detectedLang?.isEnglish && manualLanguage !== 'English' && !teacherEnglish.keyPoints && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleTranslateSection('keyPoints', teacherResponse.keyPoints.join('\n'))}
                                disabled={translatingSection === 'keyPoints'}
                                startIcon={translatingSection === 'keyPoints' ? <CircularProgress size={14} /> : <TranslateIcon />}
                              >
                                English
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {teacherResponse.keyPoints.map((point, idx) => (
                              <li key={idx} style={{ marginBottom: '8px' }}>{point}</li>
                            ))}
                          </ul>
                        </Paper>
                        {teacherEnglish.keyPoints && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom display="block">
                              English Explanation:
                            </Typography>
                            <Box 
                              sx={{ '& p': { mb: 1 }, '& ul': { pl: 2, mb: 1 }, '& strong': { fontWeight: 600 } }}
                              dangerouslySetInnerHTML={{ __html: markdownToHtml(teacherEnglish.keyPoints) }} 
                            />
                          </Paper>
                        )}
                      </Box>
                    )}

                    {/* Detailed Explanation */}
                    {teacherResponse.explanation && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            Detailed Explanation
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Listen/Stop Button */}
                            {speakingSection === 'explanation' ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={handleStopSpeaking}
                                startIcon={<Stop />}
                              >
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => handleSpeakSection('explanation', teacherResponse.explanation)}
                                startIcon={<VolumeUp />}
                              >
                                Listen
                              </Button>
                            )}
                            {/* Explain in English - Only for non-English content */}
                            {!detectedLang?.isEnglish && manualLanguage !== 'English' && !teacherEnglish.explanation && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={() => handleTranslateSection('explanation', teacherResponse.explanation)}
                                disabled={translatingSection === 'explanation'}
                                startIcon={translatingSection === 'explanation' ? <CircularProgress size={14} /> : <ExplainIcon />}
                              >
                                Explain in English
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Box dangerouslySetInnerHTML={{ __html: cleanJsonArtifacts(teacherResponse.explanation) }} />
                        </Paper>
                        {teacherEnglish.explanation && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom display="block">
                              English Explanation:
                            </Typography>
                            <Box 
                              sx={{ '& p': { mb: 1 }, '& ul': { pl: 2, mb: 1 }, '& strong': { fontWeight: 600 } }}
                              dangerouslySetInnerHTML={{ __html: markdownToHtml(teacherEnglish.explanation) }} 
                            />
                          </Paper>
                        )}
                      </Box>
                    )}

                    {/* Examples */}
                    {teacherResponse.examples && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            Examples
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Listen/Stop Button */}
                            {speakingSection === 'examples' ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={handleStopSpeaking}
                                startIcon={<Stop />}
                              >
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => handleSpeakSection('examples', teacherResponse.examples)}
                                startIcon={<VolumeUp />}
                              >
                                Listen
                              </Button>
                            )}
                            {/* Explain in English - Only for non-English content */}
                            {!detectedLang?.isEnglish && manualLanguage !== 'English' && !teacherEnglish.examples && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={() => handleTranslateSection('examples', teacherResponse.examples)}
                                disabled={translatingSection === 'examples'}
                                startIcon={translatingSection === 'examples' ? <CircularProgress size={14} /> : <ExplainIcon />}
                              >
                                Explain in English
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Box dangerouslySetInnerHTML={{ __html: teacherResponse.examples }} />
                        </Paper>
                        {teacherEnglish.examples && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom display="block">
                              English Explanation:
                            </Typography>
                            <Box 
                              sx={{ '& p': { mb: 1 }, '& ul': { pl: 2, mb: 1 }, '& strong': { fontWeight: 600 } }}
                              dangerouslySetInnerHTML={{ __html: markdownToHtml(teacherEnglish.examples) }} 
                            />
                          </Paper>
                        )}
                      </Box>
                    )}

                    {/* Exam Tips */}
                    {teacherResponse.exam && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            Exam Tips
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Listen/Stop Button */}
                            {speakingSection === 'exam' ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={handleStopSpeaking}
                                startIcon={<Stop />}
                              >
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleSpeakSection('exam', teacherResponse.exam)}
                                startIcon={<VolumeUp />}
                              >
                                Listen
                              </Button>
                            )}
                            {/* Explain in English - Only for non-English content */}
                            {!detectedLang?.isEnglish && manualLanguage !== 'English' && !teacherEnglish.exam && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={() => handleTranslateSection('exam', teacherResponse.exam)}
                                disabled={translatingSection === 'exam'}
                                startIcon={translatingSection === 'exam' ? <CircularProgress size={14} /> : <ExplainIcon />}
                              >
                                Explain in English
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Box dangerouslySetInnerHTML={{ __html: teacherResponse.exam }} />
                        </Paper>
                        {teacherEnglish.exam && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom display="block">
                              English Explanation:
                            </Typography>
                            <Box 
                              sx={{ '& p': { mb: 1 }, '& ul': { pl: 2, mb: 1 }, '& strong': { fontWeight: 600 } }}
                              dangerouslySetInnerHTML={{ __html: markdownToHtml(teacherEnglish.exam) }} 
                            />
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>{formatMarkdown(typeof teacherResponse === 'string' ? teacherResponse : JSON.stringify(teacherResponse))}</Box>
                )}
              </Paper>
            )}
          </Box>
        </TabPanel>}

        {/* Read & Understand Tab */}
        {showMultilingual && <TabPanel value={activeTab} index={tabIndices.multilingual}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ReadIcon />}
                onClick={() => handleWordByWordAnalysis(false)}
                disabled={analyzingWords || !pageText}
                sx={{ flex: 1 }}
              >
                {analyzingWords && wordBatch === 1 ? 'Analyzing...' : 'Start Analysis'}
              </Button>
              {wordAnalysis.length > 0 && wordAnalysisPage === currentPage && (
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  onClick={clearWordAnalysis}
                  disabled={analyzingWords}
                >
                  Clear
                </Button>
              )}
              
              {wordAnalysis.length > 0 && wordAnalysis[0]?.words?.length > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  onClick={() => handleWordByWordAnalysis(true)}
                  disabled={analyzingWords}
                  sx={{ flex: 1 }}
                >
                  {analyzingWords ? 'Loading...' : `Load More Words (Batch ${wordBatch + 1})`}
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', textAlign: 'center' }}>
              Get pronunciation guide and English meanings for key words • Click "Load More" for additional words
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Word Analysis Display */}
            {wordAnalysis.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Word-by-Word Analysis
                </Typography>
                
                {wordAnalysis[0] && (
                  <Box>
                    {/* Page Summary */}
                    {wordAnalysis[0].summary && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                          Page Summary:
                        </Typography>
                        <Typography variant="body2">
                          {wordAnalysis[0].summary}
                        </Typography>
                      </Paper>
                    )}
                    
                    {/* Language Badge */}
                    {wordAnalysis[0].language && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Language: {wordAnalysis[0].language}
                      </Typography>
                    )}

                    {/* Words */}
                    {wordAnalysis[0].words && Array.isArray(wordAnalysis[0].words) && wordAnalysis[0].words.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {wordAnalysis[0].words.map((word, idx) => (
                        <Paper 
                          key={idx}
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            bgcolor: speakingWordIndex === idx ? 'primary.light' : 'background.default',
                            borderLeft: '4px solid',
                            borderColor: speakingWordIndex === idx ? 'secondary.main' : 'primary.main',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Word in Original Language with Listen Button */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                  {word.word}
                                </Typography>
                                {word.partOfSpeech && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    ({word.partOfSpeech})
                                  </Typography>
                                )}
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                color={speakingWordIndex === idx ? "error" : "default"}
                                startIcon={speakingWordIndex === idx ? <Stop /> : <VolumeUp />}
                                onClick={() => handleSpeakWord(word.word, wordAnalysis[0].language, idx)}
                                sx={{ minWidth: 100 }}
                              >
                                {speakingWordIndex === idx ? 'Stop' : 'Listen'}
                              </Button>
                            </Box>

                            {/* Pronunciation Guide */}
                            <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                Pronunciation:
                              </Typography>
                              <Typography variant="body2" fontStyle="italic" color="text.secondary">
                                {word.pronunciation}
                              </Typography>
                            </Box>

                            {/* English Meaning */}
                            <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                English Meaning:
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {word.meaning}
                              </Typography>
                            </Box>

                          </Box>
                        </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Alert severity="info">
                        No words were found in the analysis. The page might be empty or the analysis failed. Please try again.
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>
            )}

            {analyzingWords && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </TabPanel>}

        {/* Explain Tab */}
        {showExplain && <TabPanel value={activeTab} index={tabIndices.explain}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              {/* Stop Speech Button (Global) */}
              {currentSpeakingId && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                  action={
                    <Button 
                      size="small" 
                      variant="outlined"
                      color="error"
                      onClick={handleStopSpeech}
                      startIcon={<Stop />}
                    >
                      Stop
                    </Button>
                  }
                >
                  Voice is playing...
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexDirection: 'column' }}>
                {!explainResponse ? (
                  <>
                    {!editableSelectedText && (
                      <ToggleButtonGroup
                        value={explainScope}
                        exclusive
                        onChange={(e, value) => value && setExplainScope(value)}
                        fullWidth
                        size="large"
                        sx={{ mb: 2 }}
                      >
                        <ToggleButton value="page">
                          <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                          This Page
                        </ToggleButton>
                        <ToggleButton value="chapter">
                          <ReadIcon fontSize="small" sx={{ mr: 1 }} />
                          Entire Chapter
                        </ToggleButton>
                      </ToggleButtonGroup>
                    )}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<ExplainIcon />}
                      onClick={() => handleExplainText(editableSelectedText ? 'page' : explainScope)}
                      disabled={loading || (!editableSelectedText && !pageText) || isAIFeatureDisabled()}
                      sx={{ mb: 1 }}
                      data-vyonn-trigger="explain"
                    >
                      {loading ? 'Analyzing...' :
                       isAIFeatureDisabled() ? 'Upgrade to Continue' :
                       editableSelectedText ? 'Explain Selection' : 'Analyze & Explain'}
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                      {editableSelectedText 
                        ? 'Get detailed explanation with exercises and solutions'
                        : 'AI-powered analysis with visual aids'}
                    </Typography>
                    
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {explainScope && (
                      <Typography variant="body2" color="text.secondary">
                        {explainScope === 'page' ? 'Page Explanation' : 'Chapter Explanation'}
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddToNotesIcon />}
                      onClick={() => {
                          let content = '';
                          if (typeof explainResponse === 'string') {
                            content = explainResponse;
                          } else {
                            content = `
                              ${explainResponse.explanation ? `<div><h4>Explanation</h4><p>${cleanJsonArtifacts(explainResponse.explanation)}</p></div>` : ''}
                              ${explainResponse.analogy ? `<div><h4>💡 Analogy</h4><p>${cleanJsonArtifacts(explainResponse.analogy)}</p></div>` : ''}
                              ${explainResponse.pyq ? `<div><h4>📝 Exam Question</h4><p>${cleanJsonArtifacts(explainResponse.pyq)}</p></div>` : ''}
                              ${explainResponse.exercises && explainResponse.exercises.length > 0 ? `
                                <div><h4>✏️ Exercises & Solutions</h4>
                                ${explainResponse.exercises.map((ex, idx) => `
                                  <div style="margin-bottom: 16px; border-left: 3px solid #1976d2; padding-left: 12px;">
                                    <p><strong>Question ${idx + 1}:</strong> ${ex.question || ex.question_english || ''}</p>
                                    ${ex.answer ? `<p><strong>Answer:</strong> ${ex.answer}</p>` : ''}
                                    ${ex.answer_english ? `<p><strong>Answer (English):</strong> ${ex.answer_english}</p>` : ''}
                                    ${ex.steps && ex.steps.length > 0 ? `
                                      <p><strong>Steps:</strong></p>
                                      <ol>${ex.steps.map(step => {
                                        const stepText = typeof step === 'string' ? step : (step?.text || step?.step || '');
                                        return `<li>${stepText}</li>`;
                                      }).join('')}</ol>
                                    ` : ''}
                                    ${ex.hints && ex.hints.length > 0 ? `
                                      <p><strong>Hints:</strong></p>
                                      <ul>${ex.hints.map(hint => `<li>${hint}</li>`).join('')}</ul>
                                    ` : ''}
                                  </div>
                                `).join('')}
                                </div>
                              ` : ''}
                              ${explainResponse.importantNotes && explainResponse.importantNotes.length > 0 ? `
                                <div><h4>📌 Important Notes</h4>
                                ${explainResponse.importantNotes.map((note, idx) => `
                                  <div style="margin-bottom: 12px; padding: 12px; background: #f5f5f5; border-left: 4px solid ${
                                    note.type === 'formula' ? '#9c27b0' :
                                    note.type === 'warning' ? '#f44336' :
                                    note.type === 'definition' ? '#2196f3' : '#757575'
                                  };">
                                    <p><strong>${note.title || `Note ${idx + 1}`}</strong></p>
                                    <p>${note.content || ''}</p>
                                  </div>
                                `).join('')}
                                </div>
                              ` : ''}
                            `;
                          }
                          addToNotes(content, `📚 Explanation - Page ${currentPage}`);
                        }}
                        disabled={loading}
                        sx={{ minWidth: '140px' }}
                      >
                        Add to Notes
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={clearExplain}
                        disabled={loading}
                      >
                        Clear
                      </Button>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                {editableSelectedText 
                  ? 'Analyzes selected text and detects exercises, notes, formulas, and important points'
                  : 'Smart AI analysis with exercise detection and answer guidance'}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Page mismatch warning */}
            {explainResponse && explainResponsePage && explainResponsePage !== currentPage && (
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
                action={
                  <Button size="small" variant="outlined" color="error" onClick={clearExplain}>
                    Clear
                  </Button>
                }
              >
                Explanation is from page {explainResponsePage}. You're viewing page {currentPage}.
              </Alert>
            )}
            
            {/* Progress Display for Chapter Generation */}
            {loading && explainScope === 'chapter' && chapterProgress.total > 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={(chapterProgress.current / chapterProgress.total) * 100}
                    size={56}
                    thickness={5}
                    sx={{ color: 'primary.main' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Analyzing Entire Chapter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processing section {chapterProgress.current} of {chapterProgress.total}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {Math.round((chapterProgress.current / chapterProgress.total) * 100)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${(chapterProgress.current / chapterProgress.total) * 100}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        transition: 'width 0.4s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>

                <Alert 
                  severity="info" 
                  icon={false}
                  sx={{ mb: 0, '& .MuiAlert-message': { width: '100%', py: 0.5 } }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      lineHeight: 1.6,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'info.dark'
                    }}
                  >
                    {examPrepTips[chapterProgress.tipIndex]}
                  </Typography>
                </Alert>
              </Paper>
            )}
            
            {loading && (!explainScope || explainScope === 'page' || editableSelectedText) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {explainResponse && explainResponsePage === currentPage && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                {typeof explainResponse === 'object' && (explainResponse.explanation || explainResponse.exercises || explainResponse.importantNotes) ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Header with Language Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={700}>
                          Analysis & Solutions
                        </Typography>
                        {explainResponse.language && (
                          <Chip 
                            label={explainResponse.language}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {explainResponse.contentType && (
                          <Chip 
                            label={
                              explainResponse.contentType === 'exercise' ? '📝 Exercises' :
                              explainResponse.contentType === 'notes' ? 'Notes' :
                              explainResponse.contentType === 'mixed' ? 'Mixed' : 'Content'
                            }
                            size="small"
                            color={explainResponse.contentType === 'exercise' ? 'warning' : 'default'}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* v7.2.26: Circuit Visualization - Auto-rendered from AI response or circuitData state */}
                    {(() => {
                      // Use either explainResponse.circuitVisualization or circuitData
                      const circuitViz = explainResponse.circuitVisualization || circuitData;
                      if (!circuitViz) return null;
                      
                      return (
                        <Paper 
                          elevation={3} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            bgcolor: '#f0f7ff',
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderRadius: 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <CircuitIcon color="primary" />
                            <Typography variant="h6" fontWeight={700} color="primary">
                              {circuitViz.title || 'Circuit Visualization'}
                            </Typography>
                            <Chip label="Auto-Generated" size="small" color="success" />
                          </Box>
                          
                          {/* Render Gates */}
                          {circuitViz.gates && circuitViz.gates.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Logic Gates:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', bgcolor: 'white', p: 2, borderRadius: 1 }}>
                                {circuitViz.gates.map((gate, idx) => (
                                  <Box key={idx} sx={{ textAlign: 'center' }}>
                                    <LogicGate 
                                      type={gate.type} 
                                      inputs={gate.inputs} 
                                      output={gate.output}
                                      showLabels={true}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {gate.id}: {gate.type}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                          
                          {/* Render Truth Table */}
                          {circuitViz.truthTable && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Truth Table:
                              </Typography>
                              <InteractiveTruthTable
                                inputs={circuitViz.truthTable.inputs || ['A', 'B']}
                                outputs={circuitViz.truthTable.outputs || ['F']}
                                truthTable={
                                  circuitViz.truthTable.rows?.map(row => [
                                    ...row.inputs,
                                    ...row.outputs
                                  ]) || []
                                }
                                highlightRows={circuitViz.truthTable.minterms || []}
                                title={`Truth Table${circuitViz.truthTable.minterms ? ` - Minterms: ∑m(${circuitViz.truthTable.minterms.join(', ')})` : ''}`}
                              />
                            </Box>
                          )}
                          
                          {/* Render ROM Content */}
                          {circuitViz.romContent && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                ROM Programming:
                              </Typography>
                              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, display: 'inline-block' }}>
                                <ROMVisualizer
                                  addressBits={circuitViz.romContent.addressBits || 2}
                                  outputs={circuitViz.romContent.content || []}
                                  title={circuitViz.title || 'ROM'}
                                />
                              </Box>
                            </Box>
                          )}
                          
                          {/* Interactive Tools */}
                          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<BuildIcon />}
                              onClick={() => {
                                setCircuitData(circuitViz);
                                setShowCircuitBuilder(true);
                              }}
                            >
                              Edit in Circuit Builder
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SimulateIcon />}
                              onClick={() => setShowCircuitSimulator(true)}
                            >
                              Open Simulator
                            </Button>
                          </Box>
                        </Paper>
                      );
                    })()}

                    {/* Exercises Section - Bilingual with Answers */}
                    {explainResponse.exercises && explainResponse.exercises.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'warning.dark' }}>
                          📝 Questions & Complete Solutions
                        </Typography>
                        {explainResponse.exercises.map((exercise, idx) => (
                          <Paper 
                            key={idx} 
                            elevation={2} 
                            sx={{ p: 3, mb: 3, bgcolor: 'background.default', border: '2px solid', borderColor: 'warning.light' }}
                          >
                            {/* Question - Bilingual */}
                            <Box sx={{ mb: 2 }}>
                              <Typography 
                                variant="h6" 
                                fontWeight={700} 
                                color="text.primary" 
                                gutterBottom
                                dangerouslySetInnerHTML={{ __html: `Q${idx + 1}. ${formatBoldText(exercise.question)}` }}
                              />
                              {exercise.question_english && exercise.question_english.trim() !== "" && exercise.question_english !== exercise.question && (
                                <Paper sx={{ p: 1.5, bgcolor: 'action.hover', mt: 1, borderLeft: '4px solid', borderColor: 'info.main' }}>
                                  <Typography 
                                    variant="body2" 
                                    color="info.dark"
                                    dangerouslySetInnerHTML={{ __html: `🌐 ${formatBoldText(exercise.question_english)}` }}
                                  />
                                </Paper>
                              )}
                              <Button
                                size="small"
                                variant={currentSpeakingId === `q${idx}` ? "contained" : "outlined"}
                                color={currentSpeakingId === `q${idx}` ? "secondary" : "primary"}
                                startIcon={currentSpeakingId === `q${idx}` ? "⏸️" : "🔊"}
                                onClick={() => handleSpeakText(exercise.question, explainResponse.language, `q${idx}`)}
                                sx={{ mt: 1 }}
                              >
                                {currentSpeakingId === `q${idx}` ? 'Stop' : 'Listen to Question'}
                              </Button>
                            </Box>

                            {/* Complete Answer - Bilingual - v7.2.25: Support HTML tables */}
                            {exercise.answer && (
                              <Box sx={{ mb: 2 }}>
                                <Paper sx={{ 
                                  p: 2, 
                                  bgcolor: 'success.lighter', 
                                  borderLeft: '4px solid', 
                                  borderColor: 'success.main',
                                  // v7.2.25: Table styling for engineering content
                                  '& table': {
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    my: 2,
                                    fontSize: '0.9rem',
                                    fontFamily: 'monospace'
                                  },
                                  '& th, & td': {
                                    border: '1px solid',
                                    borderColor: 'grey.400',
                                    p: 1,
                                    textAlign: 'center'
                                  },
                                  '& th': {
                                    bgcolor: 'success.light',
                                    fontWeight: 700
                                  },
                                  '& tr:nth-of-type(even)': {
                                    bgcolor: 'success.lighter'
                                  }
                                }}>
                                  <Typography variant="subtitle2" fontWeight={700} color="success.dark" gutterBottom>
                                    ✅ Complete Answer:
                                  </Typography>
                                  {exercise.answer.includes('<table') || exercise.answer.includes('<') ? (
                                    <Box 
                                      sx={{ whiteSpace: 'pre-wrap' }}
                                      dangerouslySetInnerHTML={{ __html: exercise.answer }} 
                                    />
                                  ) : (
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                      {exercise.answer}
                                    </Typography>
                                  )}
                                  <Button
                                    size="small"
                                    variant={currentSpeakingId === `a${idx}` ? "contained" : "outlined"}
                                    color={currentSpeakingId === `a${idx}` ? "secondary" : "primary"}
                                    startIcon={currentSpeakingId === `a${idx}` ? "⏸️" : "🔊"}
                                    onClick={() => handleSpeakText(exercise.answer, explainResponse.language, `a${idx}`)}
                                    sx={{ mt: 1 }}
                                  >
                                    {currentSpeakingId === `a${idx}` ? 'Stop' : 'Listen to Answer'}
                                  </Button>
                                </Paper>
                                
                                {exercise.answer_english && exercise.answer_english.trim() !== "" && exercise.answer_english !== exercise.answer && (
                                  <Paper sx={{ p: 2, mt: 1.5, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'info.main' }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="info.dark" gutterBottom>
                                      🌐 Answer in English:
                                    </Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                      {exercise.answer_english}
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant={currentSpeakingId === `ae${idx}` ? "contained" : "outlined"}
                                      color={currentSpeakingId === `ae${idx}` ? "secondary" : "primary"}
                                      startIcon={currentSpeakingId === `ae${idx}` ? "⏸️" : "🔊"}
                                      onClick={() => handleSpeakText(exercise.answer_english, 'English', `ae${idx}`)}
                                      sx={{ mt: 1 }}
                                    >
                                      {currentSpeakingId === `ae${idx}` ? 'Stop' : 'Listen in English'}
                                    </Button>
                                  </Paper>
                                )}
                              </Box>
                            )}

                            {/* Step-by-Step Solution - Bilingual with Visual Aids */}
                            {exercise.steps && exercise.steps.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                  Step-by-Step Solution:
                                </Typography>
                                <Paper sx={{ 
                                  p: 2, 
                                  bgcolor: 'background.paper',
                                  // v7.2.25: Table styling for steps
                                  '& table': {
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    my: 1,
                                    fontSize: '0.85rem',
                                    fontFamily: 'monospace'
                                  },
                                  '& th, & td': {
                                    border: '1px solid',
                                    borderColor: 'grey.400',
                                    p: 0.5,
                                    textAlign: 'center'
                                  },
                                  '& th': {
                                    bgcolor: 'grey.200',
                                    fontWeight: 700
                                  }
                                }}>
                                  {exercise.steps.map((step, stepIdx) => {
                                    // Handle both old format (string array) and new format (object array)
                                    const stepText = typeof step === 'string' ? step : (step?.text || '');
                                    const stepEnglish = typeof step === 'string' 
                                      ? (exercise.steps_english && exercise.steps_english[stepIdx]) 
                                      : (step?.text_english || '');
                                    const stepVisual = (typeof step === 'object' && step?.visualAid) ? step.visualAid : null;
                                    
                                    return (
                                      <Box key={stepIdx} sx={{ mb: 2, pb: 2, borderBottom: stepIdx < exercise.steps.length - 1 ? '1px dashed #e0e0e0' : 'none' }}>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ fontWeight: 500, mb: 0.5 }}
                                          dangerouslySetInnerHTML={{ __html: `${stepIdx + 1}. ${formatBoldText(stepText)}` }}
                                        />
                                        {stepEnglish && stepEnglish.trim() !== "" && stepEnglish !== stepText && (
                                          <Typography 
                                            variant="body2" 
                                            color="info.dark" 
                                            sx={{ ml: 2, fontStyle: 'italic', mb: 1 }}
                                            dangerouslySetInnerHTML={{ __html: formatBoldText(stepEnglish) }}
                                          />
                                        )}
                                        
                                        {/* Visual Aid for THIS specific step (if it has one and it's not empty) */}
                                        {stepVisual && stepVisual !== 'null' && stepVisual !== 'none' && (
                                          <VisualAidRenderer visualAid={typeof stepVisual === 'string' ? stepVisual : JSON.stringify(stepVisual)} />
                                        )}
                                      </Box>
                                    );
                                  })}
                                  <Button
                                    size="small"
                                    variant={currentSpeakingId === `s${idx}` ? "contained" : "outlined"}
                                    color={currentSpeakingId === `s${idx}` ? "secondary" : "primary"}
                                    startIcon={currentSpeakingId === `s${idx}` ? "⏸️" : "🔊"}
                                    onClick={() => handleSpeakText(exercise.steps.join('. '), explainResponse.language, `s${idx}`)}
                                    sx={{ mt: 1 }}
                                  >
                                    {currentSpeakingId === `s${idx}` ? 'Stop' : 'Listen to Steps'}
                                  </Button>
                                </Paper>
                              </Box>
                            )}

                            {/* Hints - Bilingual */}
                            {exercise.hints && exercise.hints.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="success.dark" gutterBottom>
                                  Helpful Hints:
                                </Typography>
                                  {exercise.hints.map((hint, hintIdx) => (
                                  <Box key={hintIdx} sx={{ mb: 0.5 }}>
                                    <Typography 
                                      variant="body2"
                                      dangerouslySetInnerHTML={{ __html: `• ${formatBoldText(hint)}` }}
                                    />
                                    {exercise.hints_english && exercise.hints_english[hintIdx] && exercise.hints_english[hintIdx].trim() !== "" && exercise.hints_english[hintIdx] !== hint && (
                                      <Typography 
                                        variant="body2" 
                                        color="info.dark" 
                                        sx={{ ml: 2, fontStyle: 'italic' }}
                                        dangerouslySetInnerHTML={{ __html: `🌐 ${formatBoldText(exercise.hints_english[hintIdx])}` }}
                                      />
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            )}

                            {/* Answer Location */}
                            {exercise.answerLocation && (
                              <Paper sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                <Typography variant="caption" fontWeight={700} color="info.dark">
                                  📍 {exercise.answerLocation}
                                </Typography>
                                {exercise.answerLocation_english && (
                                  <Typography variant="caption" display="block" color="info.dark" sx={{ mt: 0.5 }}>
                                    🌐 {exercise.answerLocation_english}
                                  </Typography>
                                )}
                              </Paper>
                            )}

                            {/* Key Terms */}
                            {exercise.keyTerms && exercise.keyTerms.length > 0 && (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" fontWeight={700}>🔑 Key Terms:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {exercise.keyTerms.map((term, termIdx) => (
                                    <Chip key={termIdx} label={term} size="small" />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    )}

                    {/* Important Notes - Bilingual */}
                    {explainResponse.importantNotes && explainResponse.importantNotes.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          📌 Important Notes
                        </Typography>
                        {explainResponse.importantNotes.map((note, idx) => (
                          <Paper 
                            key={idx}
                            sx={{ 
                              p: 2, 
                              mb: 1.5,
                              bgcolor: note.type === 'formula' ? 'secondary.lighter' :
                                       note.type === 'warning' ? 'error.lighter' :
                                       note.type === 'definition' ? 'info.lighter' : 'grey.100',
                              borderLeft: '4px solid',
                              borderColor: note.type === 'formula' ? 'secondary.main' :
                                          note.type === 'warning' ? 'error.main' :
                                          note.type === 'definition' ? 'info.main' : 'grey.500'
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                              {note.type === 'formula' && '📐 '}
                              {note.type === 'warning' && 'Warning: '}
                              {note.type === 'definition' && 'Definition: '}
                              {note.type === 'reminder' && 'Reminder: '}
                              {note.title}
                            </Typography>
                            <Typography variant="body2">{note.content}</Typography>
                            
                            {note.title_english && note.title_english !== note.title && (
                              <Paper sx={{ p: 1.5, mt: 1.5, bgcolor: 'background.paper' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="info.dark" gutterBottom>
                                  🌐 {note.title_english}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {note.content_english}
                                </Typography>
                              </Paper>
                            )}
                            
                            <Button
                              size="small"
                              startIcon="🔊"
                              onClick={() => handleSpeakText(note.content, explainResponse.language, `n${idx}`)}
                              sx={{ mt: 1 }}
                            >
                              Listen
                            </Button>
                          </Paper>
                        ))}
                      </Box>
                    )}

                    {/* Main Explanation - Bilingual */}
                    {explainResponse.explanation && (
                      <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          Detailed Explanation
                        </Typography>
                        {/* v7.2.28: Handle case where explanation might be malformed */}
                        {typeof explainResponse.explanation === 'object' ? (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            The explanation data is malformed. Please click "Clear" and regenerate.
                          </Alert>
                        ) : (
                        <>
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: 'background.default',
                          // v7.2.25: Table styling for engineering/university content
                          '& table': {
                            borderCollapse: 'collapse',
                            width: '100%',
                            my: 2,
                            fontSize: '0.9rem',
                            fontFamily: 'monospace'
                          },
                          '& th, & td': {
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 1,
                            textAlign: 'center'
                          },
                          '& th': {
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontWeight: 700
                          },
                          '& tr:nth-of-type(even)': {
                            bgcolor: 'action.hover'
                          },
                          '& pre, & code': {
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            overflowX: 'auto'
                          }
                        }}>
                          {/* v7.2.27: Render explanation with inline visualizations (tables, K-maps, PLA, circuits) */}
                          <Box>
                            {renderWithInlineVisualizations(explainResponse.explanation, LogicGate, InteractiveTruthTable)}
                          </Box>
                          <Button
                            size="small"
                            startIcon="🔊"
                            onClick={() => handleSpeakText(cleanJsonArtifacts(explainResponse.explanation)?.replace(/\{[^}]+\}/g, ''), explainResponse.language, 'exp')}
                            sx={{ mt: 1 }}
                          >
                            Listen to Explanation
                          </Button>
                        </Paper>
                        
                        {/* 🎨 Render 3D Visualizations from Explanation */}
                        {explainResponse._visualizations && explainResponse._visualizations.filter(v => v.section === 'explanation').map((viz, idx) => (
                          <Box key={idx} sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                              🎨 Interactive Visualization:
                            </Typography>
                            <VisualAidRenderer visualAid={JSON.stringify(viz.visualAid)} />
                          </Box>
                        ))}
                        
                        {explainResponse.explanation_english && explainResponse.explanation_english !== explainResponse.explanation && (
                          <Paper sx={{ p: 2, mt: 1.5, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'info.main' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="info.dark" gutterBottom>
                              🌐 Explanation in English:
                            </Typography>
                            <Typography variant="body1">{explainResponse.explanation_english}</Typography>
                            <Button
                              size="small"
                              startIcon="🔊"
                              onClick={() => handleSpeakText(explainResponse.explanation_english, 'English', 'exp_en')}
                              sx={{ mt: 1 }}
                            >
                              Listen in English
                            </Button>
                          </Paper>
                        )}
                        </>
                        )}
                      </Box>
                    )}
                    
                    {/* Analogy Section - Bilingual */}
                    {explainResponse.analogy && (
                      <Paper sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Helpful Analogy:
                        </Typography>
                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                          {explainResponse.analogy}
                        </Typography>
                        {explainResponse.analogy_english && explainResponse.analogy_english !== explainResponse.analogy && (
                          <Typography variant="body1" color="info.dark" sx={{ mt: 1, fontStyle: 'italic' }}>
                            🌐 {explainResponse.analogy_english}
                          </Typography>
                        )}
                        <Button
                          size="small"
                          startIcon="🔊"
                          onClick={() => handleSpeakText(explainResponse.analogy, explainResponse.language, 'analogy')}
                          sx={{ mt: 1 }}
                        >
                          Listen
                        </Button>
                      </Paper>
                    )}
                    
                    {/* Exam Corner (PYQ) - Bilingual */}
                    {explainResponse.pyq && (
                      <Paper sx={{ p: 2, bgcolor: 'error.lighter' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="error.dark" gutterBottom>
                          📝 Potential Exam Question:
                        </Typography>
                        <Box dangerouslySetInnerHTML={{ __html: explainResponse.pyq }} />
                        {explainResponse.pyq_english && explainResponse.pyq_english !== explainResponse.pyq && (
                          <Box sx={{ mt: 1, color: 'info.dark' }} dangerouslySetInnerHTML={{ __html: explainResponse.pyq_english }} />
                        )}
                        <Button
                          size="small"
                          startIcon="🔊"
                          onClick={() => handleSpeakText(explainResponse.pyq, explainResponse.language, 'pyq')}
                          sx={{ mt: 1 }}
                        >
                          Listen
                        </Button>
                      </Paper>
                    )}
                    
                    {/* Visual Diagram */}
                    {explainResponse.visual && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Visual Diagram
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            bgcolor: 'background.default',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre',
                            overflow: 'auto',
                            fontSize: '0.9rem',
                            lineHeight: 1.2
                          }}
                        >
                          {explainResponse.visual}
                        </Paper>
                      </Box>
                    )}
                    
                    {/* Interactive Demo */}
                    {explainResponse.demo && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Interactive Demo
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            bgcolor: 'background.default',
                            minHeight: 200,
                            overflow: 'hidden',
                            borderRadius: 2
                          }}
                        >
                          <iframe
                            sandbox="allow-scripts"
                            srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      box-sizing: border-box;
    }
    * {
      box-sizing: border-box;
    }
    button {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    button:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  ${explainResponse.demo}
</body>
</html>`}
                            style={{
                              width: '100%',
                              height: '200px',
                              border: 'none',
                              display: 'block'
                            }}
                            title="Interactive Demo"
                          />
                        </Paper>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Explanation</Typography>
                    <Box>{formatMarkdown(explainResponse)}</Box>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </TabPanel>}

        {/* Activities Tab */}
        {showActivities && <TabPanel value={activeTab} index={tabIndices.activities}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
              {!activitiesResponse ? (
                <>
                  <ToggleButtonGroup
                    value={activitiesScope}
                    exclusive
                    onChange={(e, value) => value && setActivitiesScope(value)}
                    fullWidth
                    size="large"
                    sx={{ mb: 2 }}
                  >
                    <ToggleButton value="page">
                      <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                      This Page
                    </ToggleButton>
                    <ToggleButton value="chapter">
                      <ReadIcon fontSize="small" sx={{ mr: 1 }} />
                      Entire Chapter
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<ActivitiesIcon />}
                    onClick={() => handleGenerateActivities(activitiesScope)}
                    disabled={loading || !pageText || isAIFeatureDisabled()}
                    sx={{ mb: 1 }}
                  >
                    {loading ? 'Generating...' :
                     isAIFeatureDisabled() ? 'Upgrade to Continue' :
                     'Generate Activities'}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                    Interactive activities and practice questions
                  </Typography>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {activitiesScope && (
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      {activitiesScope === 'page' ? 'Page Activities' : 'Chapter Activities'}
                    </Typography>
                  )}
                  {activitiesResponse && activitiesResponsePage === currentPage && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={clearActivities}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Show page mismatch warning */}
            {activitiesResponse && activitiesResponsePage && activitiesResponsePage !== currentPage && (
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
                action={
                  <Button size="small" variant="outlined" color="error" onClick={clearActivities}>
                    Clear
                  </Button>
                }
              >
                Activities are from page {activitiesResponsePage}. You're viewing page {currentPage}.
              </Alert>
            )}

            {/* Progress Display for Chapter Generation */}
            {loading && activitiesScope === 'chapter' && chapterProgress.total > 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={(chapterProgress.current / chapterProgress.total) * 100}
                    size={56}
                    thickness={5}
                    sx={{ color: 'primary.main' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Generating Activities for Chapter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processing section {chapterProgress.current} of {chapterProgress.total}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {Math.round((chapterProgress.current / chapterProgress.total) * 100)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${(chapterProgress.current / chapterProgress.total) * 100}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        transition: 'width 0.4s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>

                <Alert 
                  severity="info" 
                  icon={false}
                  sx={{ mb: 0, '& .MuiAlert-message': { width: '100%', py: 0.5 } }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      lineHeight: 1.6,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'info.dark'
                    }}
                  >
                    {examPrepTips[chapterProgress.tipIndex]}
                  </Typography>
                </Alert>
              </Paper>
            )}

            {loading && (!activitiesScope || activitiesScope === 'page') && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}
            
            {activitiesResponse && activitiesResponsePage === currentPage && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                {activitiesResponse.error ? (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Activities</Typography>
                    <Typography color="error">{activitiesResponse.error}</Typography>
                    <Box sx={{ mt: 2 }}>{formatMarkdown(activitiesResponse.raw || '')}</Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* 🎵 Sing Along / Listen Section - v7.2.8: Simplified with soothing speech */}
                    {activitiesResponse.singAlongText && activitiesResponse.contentType && 
                     ['rhyme', 'poem', 'story'].includes(activitiesResponse.contentType) && (
                      <Paper 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          background: activitiesResponse.contentType === 'rhyme' 
                            ? 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)'
                            : activitiesResponse.contentType === 'poem'
                            ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                            : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                          borderRadius: 3,
                          border: '2px solid',
                          borderColor: activitiesResponse.contentType === 'rhyme' 
                            ? 'secondary.main'
                            : activitiesResponse.contentType === 'poem'
                            ? 'primary.main'
                            : 'success.main'
                        }}
                      >
                        {/* Header with Content Type Badge */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <Chip 
                            label={
                              activitiesResponse.contentType === 'rhyme' ? '🎵 Nursery Rhyme' :
                              activitiesResponse.contentType === 'poem' ? '📝 Poem' :
                              '📖 Story'
                            }
                            color={
                              activitiesResponse.contentType === 'rhyme' ? 'secondary' :
                              activitiesResponse.contentType === 'poem' ? 'primary' :
                              'success'
                            }
                            sx={{ fontWeight: 700, fontSize: '1rem', py: 2.5, px: 1 }}
                          />
                          <Typography variant="h5" fontWeight={700} sx={{ 
                            color: activitiesResponse.contentType === 'rhyme' ? 'secondary.dark' :
                                   activitiesResponse.contentType === 'poem' ? 'primary.dark' :
                                   'success.dark'
                          }}>
                            {activitiesResponse.contentType === 'rhyme' ? '🎤 Listen & Sing Along!' :
                             activitiesResponse.contentType === 'poem' ? '🎭 Listen & Recite!' :
                             '📢 Listen to the Story!'}
                          </Typography>
                        </Box>

                        {/* Performance Instructions */}
                        {activitiesResponse.performanceInstructions && (
                          <Alert 
                            severity="info" 
                            icon={activitiesResponse.contentType === 'rhyme' ? '🎵' : 
                                  activitiesResponse.contentType === 'poem' ? '💫' : '🎬'}
                            sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.7)' }}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              {activitiesResponse.performanceInstructions}
                            </Typography>
                          </Alert>
                        )}

                        {/* v7.2.8: Simple Listen Button with soothing speech */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Button
                            variant="contained"
                            size="large"
                            color={
                              activitiesResponse.contentType === 'rhyme' ? 'secondary' :
                              activitiesResponse.contentType === 'poem' ? 'primary' :
                              'success'
                            }
                            startIcon={speakingSection === 'singAlong' ? <Stop /> : <VolumeUp />}
                            onClick={() => {
                              if (speakingSection === 'singAlong') {
                                handleStopSpeaking();
                              } else {
                                handleSingSection('singAlong', activitiesResponse.singAlongText, activitiesResponse.contentType);
                              }
                            }}
                            sx={{ 
                              py: 2, 
                              px: 4, 
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              borderRadius: 3,
                              boxShadow: 4,
                              animation: speakingSection === 'singAlong' ? 'pulse 1s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': { transform: 'scale(1)' },
                                '50%': { transform: 'scale(1.03)' },
                                '100%': { transform: 'scale(1)' }
                              }
                            }}
                          >
                            {speakingSection === 'singAlong' 
                              ? '⏹️ Stop' 
                              : activitiesResponse.contentType === 'rhyme' 
                                ? '🎵 Listen & Sing Along' 
                                : activitiesResponse.contentType === 'poem'
                                  ? '🎭 Listen & Recite'
                                  : '📖 Listen to Story'}
                          </Button>
                          
                          {/* Soothing indicator */}
                          {speakingSection === 'singAlong' && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              🎧 Playing with soothing rhythm...
                            </Typography>
                          )}
                        </Box>

                        {/* Helpful Tip */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          💡 Uses a natural voice with gentle rhythm and pauses for a pleasant listening experience.
                        </Typography>

                        {/* The Sing Along / Story Text */}
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            bgcolor: 'rgba(255,255,255,0.9)',
                            borderRadius: 2,
                            maxHeight: 300,
                            overflow: 'auto'
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              whiteSpace: 'pre-line',
                              lineHeight: 2,
                              fontSize: activitiesResponse.contentType === 'rhyme' ? '1.2rem' : '1.1rem',
                              fontFamily: activitiesResponse.contentType === 'poem' ? '"Georgia", serif' : 'inherit'
                            }}
                          >
                            {activitiesResponse.singAlongText}
                          </Typography>
                        </Paper>
                      </Paper>
                    )}

                    {/* MCQ Quiz Section */}
                    {activitiesResponse.mcqs && activitiesResponse.mcqs.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Multiple Choice Quiz
                        </Typography>
                        {activitiesResponse.mcqs.map((mcq, idx) => {
                          // Handle both bilingual object format and simple string format
                          const isObject = typeof mcq.question === 'object';
                          const questionOriginal = isObject ? mcq.question.original : '';
                          const questionEnglish = isObject ? mcq.question.english : mcq.question;
                          const optionsOriginal = isObject && mcq.options.original ? mcq.options.original : [];
                          const optionsEnglish = isObject && mcq.options.english ? mcq.options.english : mcq.options;
                          const correctAnswerEnglish = isObject && mcq.correctAnswer.english ? mcq.correctAnswer.english : mcq.correctAnswer;
                          const explanationOriginal = isObject && mcq.explanation.original ? mcq.explanation.original : '';
                          const explanationEnglish = isObject && mcq.explanation.english ? mcq.explanation.english : mcq.explanation;
                          
                          return (
                            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: quizResults ? (quizResults.questionFeedback[idx]?.correct ? 'success.light' : 'error.light') : 'background.default' }}>
                              {/* Question - Bilingual in same box */}
                              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                  {idx + 1}. {questionOriginal || questionEnglish}
                                </Typography>
                                {questionOriginal && (
                                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                      English:
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={500} color="text.secondary">
                                      {questionEnglish}
                                    </Typography>
                                  </Box>
                                )}
                              </Paper>
                              
                              {/* Options - Bilingual */}
                              <FormControl component="fieldset" sx={{ width: '100%' }} disabled={quizResults !== null}>
                                <RadioGroup
                                  value={quizAnswers[idx] || ''}
                                  onChange={(e) => handleQuizAnswerChange(idx, e.target.value)}
                                >
                                  {optionsEnglish.map((optionEng, optIdx) => {
                                    const optionOrig = optionsOriginal[optIdx] || '';
                                    const isCorrect = quizResults && (optionEng === correctAnswerEnglish);
                                    
                                    return (
                                      <Paper 
                                        key={optIdx}
                                        variant="outlined" 
                                        sx={{ 
                                          mb: 1,
                                          bgcolor: isCorrect ? 'success.lighter' : 'white',
                                          border: isCorrect ? '2px solid' : '1px solid',
                                          borderColor: isCorrect ? 'success.main' : 'divider'
                                        }}
                                      >
                                        <Box sx={{ p: 1 }}>
                                          <FormControlLabel
                                            value={optionEng}
                                            control={<Radio />}
                                            label={
                                              <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                  {optionOrig || optionEng}
                                                </Typography>
                                                {optionOrig && (
                                                  <Box sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid', borderColor: 'info.main' }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                                      🌐 English:
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                      {optionEng}
                                                    </Typography>
                                                  </Box>
                                                )}
                                              </Box>
                                            }
                                            sx={{ width: '100%', alignItems: 'flex-start' }}
                                          />
                                        </Box>
                                      </Paper>
                                    );
                                  })}
                                </RadioGroup>
                              </FormControl>
                              
                              {/* Explanation after submission */}
                              {quizResults && (
                                <Box sx={{ mt: 2 }}>
                                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: quizResults.questionFeedback[idx]?.correct ? 'success.lighter' : 'error.lighter', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={700} display="block" gutterBottom sx={{ color: quizResults.questionFeedback[idx]?.correct ? 'success.dark' : 'error.dark' }}>
                                      {quizResults.questionFeedback[idx]?.correct ? '✓ Correct Answer!' : '✗ Incorrect Answer'}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500} gutterBottom>
                                      {explanationOriginal || explanationEnglish}
                                    </Typography>
                                    {explanationOriginal && (
                                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                          English Explanation:
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {explanationEnglish}
                                        </Typography>
                                      </Box>
                                    )}
                                    {quizResults.questionFeedback[idx]?.feedback && (
                                      <Typography variant="body2" sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider', fontStyle: 'italic' }}>
                                        {quizResults.questionFeedback[idx].feedback}
                                      </Typography>
                                    )}
                                  </Paper>
                                </Box>
                              )}
                            </Paper>
                          );
                        })}
                        
                        {!quizResults ? (
                          <Button
                            variant="contained"
                            onClick={handleSubmitQuiz}
                            disabled={submittingQuiz || Object.keys(quizAnswers).length < activitiesResponse.mcqs.length}
                            startIcon={submittingQuiz ? <CircularProgress size={20} /> : null}
                            sx={{ mt: 1 }}
                          >
                            {submittingQuiz ? 'Evaluating...' : 'Submit Quiz'}
                          </Button>
                        ) : (
                          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              Quiz Results: {quizResults.score} ({quizResults.percentage}%)
                            </Typography>
                            <Typography variant="body1">{quizResults.feedback}</Typography>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setQuizResults(null);
                                setQuizAnswers({});
                              }}
                              sx={{ mt: 2 }}
                            >
                              Retake Quiz
                            </Button>
                          </Paper>
                        )}
                      </Box>
                    )}

                    {/* Practice Questions */}
                    {activitiesResponse.practiceQuestions && activitiesResponse.practiceQuestions.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          📝 Practice Questions
                        </Typography>
                        <Box component="ol" sx={{ pl: 2 }}>
                          {activitiesResponse.practiceQuestions.map((question, idx) => {
                            const isObject = typeof question === 'object';
                            const originalText = isObject ? question.original : '';
                            const englishText = isObject ? question.english : question;
                            
                            return (
                              <Box component="li" key={idx} sx={{ mb: 2 }}>
                                {originalText && (
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {originalText}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                  {originalText && (
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                      English:
                                    </Typography>
                                  )}
                                  <Typography variant="body2">
                                    {englishText}
                                  </Typography>
                                </Paper>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Hands-On Activities */}
                    {activitiesResponse.handsOnActivities && activitiesResponse.handsOnActivities.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          🔬 Hands-On Activities
                        </Typography>
                        <Box component="ol" sx={{ pl: 2 }}>
                          {activitiesResponse.handsOnActivities.map((activity, idx) => {
                            const isObject = typeof activity === 'object';
                            const original = isObject ? activity.original : '';
                            const english = isObject ? activity.english : activity;
                            
                            return (
                              <Box component="li" key={idx} sx={{ mb: 2 }}>
                                {original && (
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {original}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                  {original && (
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                      English:
                                    </Typography>
                                  )}
                                  <Typography variant="body2">
                                    {english}
                                  </Typography>
                                </Paper>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Discussion Prompts */}
                    {activitiesResponse.discussionPrompts && activitiesResponse.discussionPrompts.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          💬 Discussion Prompts
                        </Typography>
                        <Box component="ol" sx={{ pl: 2 }}>
                          {activitiesResponse.discussionPrompts.map((prompt, idx) => {
                            const isObject = typeof prompt === 'object';
                            const original = isObject ? prompt.original : '';
                            const english = isObject ? prompt.english : prompt;
                            
                            return (
                              <Box component="li" key={idx} sx={{ mb: 2 }}>
                                {original && (
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {original}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                  {original && (
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                      English:
                                    </Typography>
                                  )}
                                  <Typography variant="body2">
                                    {english}
                                  </Typography>
                                </Paper>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Real-World Applications */}
                    {activitiesResponse.realWorldApplications && activitiesResponse.realWorldApplications.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          🌍 Real-World Applications
                        </Typography>
                        <Box component="ol" sx={{ pl: 2 }}>
                          {activitiesResponse.realWorldApplications.map((application, idx) => {
                            const isObject = typeof application === 'object';
                            const original = isObject ? application.original : '';
                            const english = isObject ? application.english : application;
                            
                            return (
                              <Box component="li" key={idx} sx={{ mb: 2 }}>
                                {original && (
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {original}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                  {original && (
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                      English:
                                    </Typography>
                                  )}
                                  <Typography variant="body2">
                                    {english}
                                  </Typography>
                                </Paper>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* 3D Visualizations & Maps */}
                    {activitiesResponse._visualizations && activitiesResponse._visualizations.length > 0 && (
                      <Box sx={{ mt: 2, mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          🎨 Visualizations:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {activitiesResponse._visualizations.map((visualAid, idx) => (
                            <Box key={idx} sx={{ flexBasis: { xs: '100%', sm: '48%', md: '32%' } }}>
                              <VisualAidRenderer visualAid={JSON.stringify(visualAid.visualAid)} />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Fallback message when no activities are present */}
                    {!activitiesResponse.mcqs && 
                     !activitiesResponse.practiceQuestions && 
                     !activitiesResponse.handsOnActivities && 
                     !activitiesResponse.discussionPrompts && 
                     !activitiesResponse.realWorldApplications && 
                     (!activitiesResponse._visualizations || activitiesResponse._visualizations.length === 0) && (
                      <Alert severity="info">
                        <Typography variant="body2">
                          No activities were generated for this content. The AI response may not have contained structured activity data.
                        </Typography>
                        {activitiesResponse.raw && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Raw Response:
                            </Typography>
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {JSON.stringify(activitiesResponse, null, 2)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </TabPanel>}

        {/* Exam Prep Tab */}
        {showExamPrep && <TabPanel value={activeTab} index={tabIndices.examPrep}>
          <Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGenerateExamPrep}
              disabled={generatingExam || !pdfDocument || isAIFeatureDisabled()}
              startIcon={generatingExam ? null : <ExamIcon />}
              sx={{ mb: 1 }}
            >
              {generatingExam ? 'Processing...' :
               isAIFeatureDisabled() ? 'Upgrade to Continue' :
               'Generate Exam Questions'}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
              AI-generated MCQs, short answers, and long answer questions
            </Typography>

            {/* Professional Progress Display */}
            {generatingExam && examTotalChunks > 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                {/* Progress Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={(examChunkProgress / examTotalChunks) * 100}
                    size={56}
                    thickness={5}
                    sx={{ 
                      color: 'primary.main'
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Generating Exam Questions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processing section {examChunkProgress} of {examTotalChunks}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {Math.round((examChunkProgress / examTotalChunks) * 100)}%
                  </Typography>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mb: 2.5 }}>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${(examChunkProgress / examTotalChunks) * 100}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        transition: 'width 0.4s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>

                {/* Rotating Tips */}
                <Alert 
                  severity="info" 
                  icon={false}
                  sx={{ 
                    mb: 0,
                    '& .MuiAlert-message': { 
                      width: '100%',
                      py: 0.5
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      lineHeight: 1.6,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      animation: 'fadeIn 0.4s ease-in',
                      color: 'info.dark'
                    }}
                  >
                    {examPrepTips[examCurrentTip]}
                  </Typography>
                </Alert>

                {/* CSS Animations */}
                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                `}</style>
              </Paper>
            )}

            {examPrepResponse && examPrepPage === currentPage && (
              <Box>
                {/* MCQs - Assertion & Reasoning */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    MCQs (Assertion & Reasoning)
                  </Typography>
                  
                  {examPrepResponse.mcqs?.map((mcq, index) => {
                    // V3.0.3: Handle bilingual content (regional + English)
                    const isBilingual = typeof mcq.assertion === 'object' && mcq.assertion.original && mcq.assertion.english;
                    const assertionText = isBilingual ? mcq.assertion.original : mcq.assertion;
                    const assertionEnglish = isBilingual ? mcq.assertion.english : '';
                    const reasonText = isBilingual ? mcq.reason.original : mcq.reason;
                    const reasonEnglish = isBilingual ? mcq.reason.english : '';
                    const explanationText = isBilingual ? mcq.explanation.original : mcq.explanation;
                    const explanationEnglish = isBilingual ? mcq.explanation.english : '';
                    
                    return (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Question {index + 1}
                      </Typography>
                      
                      <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.lighter' }}>
                        <Typography variant="body2" fontWeight={600}>
                          Assertion (A): {assertionText}
                        </Typography>
                        {isBilingual && assertionEnglish && (
                          <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: 'info.main' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                              🌐 English:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {assertionEnglish}
                            </Typography>
                          </Box>
                        )}
                        
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 2 }}>
                          Reason (R): {reasonText}
                        </Typography>
                        {isBilingual && reasonEnglish && (
                          <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: 'info.main' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                              🌐 English:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {reasonEnglish}
                            </Typography>
                          </Box>
                        )}
                      </Paper>

                      <FormControl component="fieldset">
                        <RadioGroup
                          value={examAnswers[`mcq_${index}`] !== undefined ? String(examAnswers[`mcq_${index}`]) : ''}
                          onChange={(e) => setExamAnswers({
                            ...examAnswers,
                            [`mcq_${index}`]: parseInt(e.target.value)
                          })}
                        >
                          <FormControlLabel
                            value="0"
                            control={<Radio />}
                            label="Both A and R are true, and R is the correct explanation of A"
                          />
                          <FormControlLabel
                            value="1"
                            control={<Radio />}
                            label="Both A and R are true, but R is NOT the correct explanation of A"
                          />
                          <FormControlLabel
                            value="2"
                            control={<Radio />}
                            label="A is true, but R is false"
                          />
                          <FormControlLabel
                            value="3"
                            control={<Radio />}
                            label="A is false, but R is true"
                          />
                        </RadioGroup>
                      </FormControl>

                      {examAnswers[`mcq_result_${index}`] !== undefined && (
                        <Paper sx={{ 
                          p: 2, 
                          mt: 2, 
                          bgcolor: examAnswers[`mcq_result_${index}`] ? 'success.lighter' : 'error.lighter' 
                        }}>
                          <Typography variant="body2" fontWeight={600}>
                            {examAnswers[`mcq_result_${index}`] ? '✅ Correct!' : '❌ Incorrect'}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {explanationText}
                          </Typography>
                          {isBilingual && explanationEnglish && (
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                🌐 English:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {explanationEnglish}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      )}
                    </Paper>
                  );
                  })}

                  <Button
                    variant="contained"
                    onClick={() => {
                      examPrepResponse.mcqs.forEach((mcq, index) => {
                        const userAnswer = examAnswers[`mcq_${index}`];
                        const isCorrect = userAnswer === mcq.correctAnswer;
                        setExamAnswers(prev => ({
                          ...prev,
                          [`mcq_result_${index}`]: isCorrect
                        }));
                      });
                    }}
                  >
                    Evaluate MCQs
                  </Button>
                </Paper>

                {/* Short Answer Questions */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    ✍️ Short Answer Questions
                  </Typography>
                  
                  {examPrepResponse.shortAnswer?.map((qa, index) => {
                    // V3.0.3: Handle bilingual content
                    const isBilingual = typeof qa.question === 'object' && qa.question.original && qa.question.english;
                    const questionText = isBilingual ? qa.question.original : qa.question;
                    const questionEnglish = isBilingual ? qa.question.english : '';
                    const answerText = isBilingual ? qa.answer.original : qa.answer;
                    const answerEnglish = isBilingual ? qa.answer.english : '';
                    
                    return (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="body1" fontWeight={600}>
                          Q{index + 1}. {questionText}
                        </Typography>
                        {isBilingual && questionEnglish && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                              🌐 English:
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              {questionEnglish}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                      
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Answer:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {answerText}
                        </Typography>
                        {isBilingual && answerEnglish && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                              🌐 English:
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                              {answerEnglish}
                            </Typography>
                          </Box>
                        )}
                        
                        {qa.keywords && qa.keywords.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" fontWeight={600}>Keywords:</Typography>
                            {qa.keywords.map((keyword, kidx) => (
                              <Chip key={kidx} label={keyword} size="small" />
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </Paper>
                  );
                  })}
                </Paper>

                {/* Long Answer Questions */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Long Answer Questions
                  </Typography>
                  
                  {examPrepResponse.longAnswer?.map((q, index) => {
                    // V3.0.3: Handle bilingual content
                    const isBilingual = typeof q.question === 'object' && q.question.original && q.question.english;
                    const questionText = isBilingual ? q.question.original : q.question;
                    const questionEnglish = isBilingual ? q.question.english : '';
                    
                    return (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="body1" fontWeight={600}>
                          Q{index + 1}. {questionText}
                        </Typography>
                        {isBilingual && questionEnglish && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                              🌐 English:
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              {questionEnglish}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                      
                      {q.hints && q.hints.length > 0 && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter' }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Hints:
                          </Typography>
                          {q.hints.map((hint, hidx) => {
                            const hintIsBilingual = typeof hint === 'object' && hint.original && hint.english;
                            const hintText = hintIsBilingual ? hint.original : hint;
                            const hintEnglish = hintIsBilingual ? hint.english : '';
                            return (
                            <Box key={hidx} sx={{ ml: 2, mb: 1 }}>
                              <Typography variant="body2">
                                • {hintText}
                              </Typography>
                              {hintIsBilingual && hintEnglish && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'block' }}>
                                  🌐 {hintEnglish}
                                </Typography>
                              )}
                            </Box>
                            );
                          })}
                        </Paper>
                      )}
                      
                      {q.pageReferences && q.pageReferences.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          📄 Refer to pages: {q.pageReferences.join(', ')}
                        </Typography>
                      )}

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleGenerateLongAnswer(index)}
                        disabled={generatingAnswer === index || isAIFeatureDisabled()}
                        startIcon={generatingAnswer === index ? <CircularProgress size={16} /> : null}
                      >
                        {generatingAnswer === index ? 'Generating...' :
                         isAIFeatureDisabled() ? 'Upgrade to Continue' :
                         'Generate Answer'}
                      </Button>

                      {examAnswers[`long_answer_${index}`] && (
                        <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Model Answer:
                          </Typography>
                          <Box sx={{ whiteSpace: 'pre-wrap' }}>
                            {formatMarkdown(examAnswers[`long_answer_${index}`])}
                          </Box>
                        </Paper>
                      )}
                    </Paper>
                  );
                  })}
                </Paper>
              </Box>
            )}
          </Box>
        </TabPanel>}

        {/* v7.2.32: Tools Tab - Full Educational Toolkit */}
        {showProTools && <TabPanel value={activeTab} index={tabIndices.proTools}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Tool Grid */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 1.5
            }}>
              {/* Math Tools */}
              <Paper 
                elevation={0}
                onClick={() => setShowMathTools(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#1976d2',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>📐</Typography>
                <Typography variant="body2" fontWeight={700}>Math Tools</Typography>
                <Typography variant="caption" color="text.secondary">LaTeX · Graphing</Typography>
              </Paper>

              {/* Chemistry */}
              <Paper 
                elevation={0}
                onClick={() => setShowChemistryTools(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#4caf50',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(76, 175, 80, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>🧪</Typography>
                <Typography variant="body2" fontWeight={700}>Chemistry</Typography>
                <Typography variant="caption" color="text.secondary">3D Molecules</Typography>
              </Paper>

              {/* Physics */}
              <Paper 
                elevation={0}
                onClick={() => setShowPhysicsSimulator(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#6c5ce7',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(108, 92, 231, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(108, 92, 231, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>⚡</Typography>
                <Typography variant="body2" fontWeight={700}>Physics Lab</Typography>
                <Typography variant="caption" color="text.secondary">Simulations</Typography>
              </Paper>

              {/* Code Editor */}
              <Paper 
                elevation={0}
                onClick={() => setShowCodeEditor(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#2d3436',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(45, 52, 54, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(45, 52, 54, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>💻</Typography>
                <Typography variant="body2" fontWeight={700}>Code Editor</Typography>
                <Typography variant="caption" color="text.secondary">JS · Python · Java</Typography>
              </Paper>

              {/* Globe */}
              <Paper 
                elevation={0}
                onClick={() => setShowGlobeViewer(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#0984e3',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(9, 132, 227, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(9, 132, 227, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>🌍</Typography>
                <Typography variant="body2" fontWeight={700}>Globe Explorer</Typography>
                <Typography variant="caption" color="text.secondary">3D Geography</Typography>
              </Paper>

              {/* Circuit Builder */}
              <Paper 
                elevation={0}
                onClick={() => setShowCircuitBuilder(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#00b894',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(0, 184, 148, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(0, 184, 148, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>🔌</Typography>
                <Typography variant="body2" fontWeight={700}>Circuit Builder</Typography>
                <Typography variant="caption" color="text.secondary">Logic Gates</Typography>
              </Paper>

              {/* Circuit Simulator */}
              <Paper 
                elevation={0}
                onClick={() => setShowCircuitSimulator(true)}
                sx={{ 
                  p: 2,
                  border: '2px solid',
                  borderColor: '#fdcb6e',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(253, 203, 110, 0.04)',
                  '&:hover': { 
                    bgcolor: 'rgba(253, 203, 110, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography fontSize="1.5rem" mb={0.5}>⚙️</Typography>
                <Typography variant="body2" fontWeight={700}>Simulator</Typography>
                <Typography variant="caption" color="text.secondary">CircuitJS</Typography>
              </Paper>
            </Box>
          </Box>
        </TabPanel>}

        {/* v7.2.30: Vyonn AI Chat Tab */}
        {showVyonn && <TabPanel value={activeTab} index={tabIndices.vyonn}>
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 200px)'
          }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              pb: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/vyonn.png`}
                  alt="Vyonn"
                  sx={{ 
                    width: 40, 
                    height: 40,
                    filter: 'brightness(0) contrast(1.2)'
                  }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Vyonn AI
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your learning companion
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Clear chat">
                <IconButton 
                  size="small" 
                  onClick={clearVyonnChat}
                  sx={{ color: 'text.secondary' }}
                >
                  <ClearChatIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Context Indicator */}
            {pageText && (
              <Chip
                label={`Context: Page ${currentPage}`}
                size="small"
                variant="outlined"
                sx={{ 
                  mt: 1.5, 
                  alignSelf: 'flex-start',
                  fontSize: '0.7rem',
                  height: 24,
                  bgcolor: 'action.hover'
                }}
              />
            )}

            {/* Messages */}
            <List sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              py: 2,
              '& .MuiListItem-root': { px: 0 }
            }}>
              {vyonnMessages.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
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
                            : 'action.hover',
                        color: message.role === 'user' 
                          ? 'primary.contrastText' 
                          : 'text.primary',
                        borderRadius: 2,
                        border: message.role === 'assistant' && !message.error ? '1px solid' : 'none',
                        borderColor: 'divider'
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
                        {message.timestamp.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Paper>
                    
                    {/* Visualization if present */}
                    {message.visualAid && (
                      <Box sx={{ mt: 1.5, width: '100%' }}>
                        <VisualAidRenderer visualAid={JSON.stringify(message.visualAid)} />
                      </Box>
                    )}
                  </Box>
                </ListItem>
              ))}
              {vyonnLoading && (
                <ListItem sx={{ justifyContent: 'center', py: 2, px: 0 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={24} sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Box>
                </ListItem>
              )}
              <div ref={vyonnMessagesEndRef} />
            </List>

            <Divider />

            {/* Input */}
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ask me anything about your studies..."
                value={vyonnInput}
                onChange={(e) => setVyonnInput(e.target.value)}
                onKeyPress={handleVyonnKeyPress}
                disabled={vyonnLoading}
                size="small"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleVyonnSend}
                      disabled={!vyonnInput.trim() || vyonnLoading}
                      color="primary"
                      sx={{
                        bgcolor: vyonnInput.trim() && !vyonnLoading ? 'primary.main' : 'transparent',
                        color: vyonnInput.trim() && !vyonnLoading ? '#fff' : 'inherit',
                        '&:hover': {
                          bgcolor: vyonnInput.trim() && !vyonnLoading ? 'primary.dark' : 'transparent'
                        }
                      }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ 
                  display: 'block', 
                  mt: 0.5, 
                  textAlign: 'center',
                  fontSize: '0.7rem'
                }}
              >
                Enter to send · Shift+Enter for new line
              </Typography>
            </Box>
          </Box>
        </TabPanel>}

        {/* Notes Tab */}
        {showNotes && <TabPanel value={activeTab} index={tabIndices.notes}>
          <NotesEditor pdfId={pdfId} />
        </TabPanel>}
      </Box>
      
      {/* Flashcard Notification Snackbar */}
      <Snackbar
        open={flashcardNotification.open}
        autoHideDuration={5000}
        onClose={() => setFlashcardNotification({ open: false, count: 0 })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setFlashcardNotification({ open: false, count: 0 })}
          severity="success"
          icon={<FlashcardIcon />}
          sx={{ 
            width: '100%',
            backgroundColor: 'success.light',
            '& .MuiAlert-icon': { color: 'success.dark' }
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            📚 {flashcardNotification.count} Flashcard{flashcardNotification.count !== 1 ? 's' : ''} Created!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Review them in your Dashboard → Flashcard Review
          </Typography>
        </Alert>
      </Snackbar>
      
      {/* v7.2.25: Circuit Builder Dialog */}
      <CircuitBuilder
        open={showCircuitBuilder}
        onClose={() => {
          setShowCircuitBuilder(false);
          setCircuitData(null);
        }}
        initialCircuit={circuitData ? convertAICircuitToReactFlow(circuitData) : null}
        title={circuitData?.title || "Interactive Circuit Builder"}
      />
      
      {/* v7.2.25: Circuit Simulator Dialog */}
      <CircuitSimulator
        open={showCircuitSimulator}
        onClose={() => setShowCircuitSimulator(false)}
        title="Circuit Simulator (Falstad)"
      />

      {/* v7.2.32: Educational Tools Dialogs */}
      <MathTools
        open={showMathTools}
        onClose={() => setShowMathTools(false)}
      />
      <ChemistryTools
        open={showChemistryTools}
        onClose={() => setShowChemistryTools(false)}
      />
      <PhysicsSimulator
        open={showPhysicsSimulator}
        onClose={() => setShowPhysicsSimulator(false)}
        user={user}
      />
      <CodeEditor
        open={showCodeEditor}
        onClose={() => setShowCodeEditor(false)}
      />
      <GlobeViewer
        open={showGlobeViewer}
        onClose={() => setShowGlobeViewer(false)}
      />

      {/* v10.1: API Key Configuration Alert */}
      <Snackbar
        open={showApiKeyAlert}
        autoHideDuration={8000}
        onClose={() => setShowApiKeyAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowApiKeyAlert(false)} 
          severity="warning"
          sx={{ width: '100%' }}
          action={
            onOpenSettings && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  setShowApiKeyAlert(false);
                  onOpenSettings();
                }}
              >
                Open Settings
              </Button>
            )
          }
        >
          Please configure your API keys in Settings to use AI features.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AIModePanel;


