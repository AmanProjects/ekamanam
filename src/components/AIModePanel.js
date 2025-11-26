import React, { useState, useEffect } from 'react';
import VisualAidRenderer from './VisualAidRenderer';
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
  FormControlLabel
} from '@mui/material';
import { 
  School as TeacherIcon,
  Lightbulb as ExplainIcon,
  Sports as ActivitiesIcon,
  Note as NotesIcon,
  VolumeUp,
  Stop,
  Public as ResourcesIcon,
  Link as LinkIcon,
  MenuBook as ReadIcon,
  AddCircle as AddToNotesIcon
} from '@mui/icons-material';
import NotesEditor from './NotesEditor';
import { generateExplanation, generateTeacherMode, generateActivities, generateAdditionalResources, generateWordByWordAnalysis } from '../services/geminiService';
import {
  getCachedData,
  saveCachedData,
  isPageCached,
  getPriorPagesContext,
  getCacheStats,
  clearPDFCache
} from '../services/cacheService';

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

function AIModePanel({ currentPage, totalPages, pdfId, selectedText, pageText, user, pdfDocument }) {
  const [activeTab, setActiveTab] = useState(0);

  // Cleanup: Stop speech and clear data when page changes
  useEffect(() => {
    // Stop speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('🔇 Stopped speech on page change');
    }
    
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
  const [cacheStats, setCacheStats] = useState(null);
  const [explainResponse, setExplainResponse] = useState('');
  const [explainResponsePage, setExplainResponsePage] = useState(null);
  const [explainEnglish, setExplainEnglish] = useState(null);
  const [translatingExplain, setTranslatingExplain] = useState(false);
  const [activitiesResponse, setActivitiesResponse] = useState(null);
  const [activitiesResponsePage, setActivitiesResponsePage] = useState(null);
  const [resourcesResponse, setResourcesResponse] = useState('');
  const [resourcesResponsePage, setResourcesResponsePage] = useState(null);
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

  // Helper function to detect if content is in English
  const isEnglishContent = (text) => {
    if (!text || typeof text !== 'string') return true; // Default to English
    
    // Check for regional language scripts
    const hasDevanagari = /[\u0900-\u097F]/.test(text); // Hindi, Sanskrit
    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    const hasTamil = /[\u0B80-\u0BFF]/.test(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
    const hasGurmukhi = /[\u0A00-\u0A7F]/.test(text); // Punjabi
    const hasOriya = /[\u0B00-\u0B7F]/.test(text);
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(text);
    const hasKannada = /[\u0C80-\u0CFF]/.test(text);
    
    // If any regional script detected, it's NOT English
    if (hasDevanagari || hasTelugu || hasTamil || hasBengali || hasGujarati || 
        hasGurmukhi || hasOriya || hasMalayalam || hasKannada) {
      return false;
    }
    
    // Otherwise, assume English
    return true;
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Clear functions for each tab
  const clearTeacherMode = () => {
    setTeacherResponse('');
    setTeacherResponsePage(null);
    setTeacherEnglish({});
    setTranslatingSection(null);
    setUsedCache(false);
    setError(null);
  };

  const clearExplain = () => {
    setExplainResponse('');
    setExplainResponsePage(null);
    setExplainEnglish(null);
    setTranslatingExplain(false);
    setUsedCache(false);
    setError(null);
  };

  const clearActivities = () => {
    setActivitiesResponse(null);
    setActivitiesResponsePage(null);
    setQuizAnswers({});
    setQuizResults(null);
    setUsedCache(false);
    setError(null);
  };

  const clearResources = () => {
    setResourcesResponse('');
    setResourcesResponsePage(null);
    setUsedCache(false);
    setError(null);
  };

  const clearWordAnalysis = () => {
    setWordAnalysis([]);
    setWordAnalysisPage(null);
    setWordBatch(1);
    setError(null);
  };

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
    setActiveTab(5); // Switch to Notes tab (index 5)
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
    setTeacherEnglish({}); // Reset English translations
    setUsedCache(false);

    try {
      // 🔍 CHECK CACHE FIRST
      if (pdfId && currentPage) {
        const cachedData = await getCachedData(pdfId, currentPage, 'teacherMode');
        if (cachedData) {
          console.log('⚡ Cache HIT: Using cached Teacher Mode data');
          setTeacherResponse(cachedData);
          setUsedCache(true);
          
          // Update cache stats
          const stats = await getCacheStats(pdfId);
          setCacheStats(stats);
          console.log(`📊 Cache: ${stats.pagesCached} pages, ${stats.cacheSizeKB} KB`);
          
          setLoading(false);
          return;
        } else {
          console.log('❌ Cache MISS: Generating new data...');
        }
      }

      // 📡 NO CACHE - GENERATE NEW
      const response = await generateTeacherMode(pageText, apiKey);
      
      // Try to parse JSON response
      try {
        // Remove all markdown code blocks and extra whitespace
        let cleanResponse = response
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        // Extract JSON object - handle multi-line JSON
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        cleanResponse = jsonMatch[0];
        
        // Clean up any remaining artifacts
        cleanResponse = cleanResponse
          .replace(/\n\s*\n/g, '\n') // Remove empty lines
          .trim();
        
        console.log('Parsing Teacher Mode JSON, first 200 chars:', cleanResponse.substring(0, 200));
        const parsedResponse = JSON.parse(cleanResponse);
        console.log('Successfully parsed Teacher Mode response');
        setTeacherResponse(parsedResponse);
        setTeacherResponsePage(currentPage); // Track which page this data is for

        // 💾 SAVE TO CACHE
        if (pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, 'teacherMode', parsedResponse);
          console.log('💾 Saved to cache: Teacher Mode');
          
          // Update cache stats
          const stats = await getCacheStats(pdfId);
          setCacheStats(stats);
          console.log(`📊 Cache: ${stats.pagesCached} pages, ${stats.cacheSizeKB} KB`);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was:', response.substring(0, 500));
        // If parsing fails, store as plain object
        setTeacherResponse({ explanation: response });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateSection = async (sectionName, sectionContent) => {
    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    setTranslatingSection(sectionName);
    setError(null);
    
    try {
      // Create a simple translation prompt for just this section
      const prompt = `Translate the following text to English:

${sectionContent}

Return ONLY the English translation, no extra text.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translation = data.candidates[0]?.content?.parts[0]?.text || '';
      
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

  // Removed performOCR - using Teacher Mode technique (pageText) instead

  const handleWordByWordAnalysis = async (isLoadMore = false) => {
    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    if (!pageText) {
      setError('Please load a PDF page first');
      return;
    }

    setAnalyzingWords(true);
    setError(null);
    setUsedCache(false);
    
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
      const response = await generateWordByWordAnalysis(pageText, apiKey, existingWords, batchNumber);
      
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
  const handleSpeakText = (text, language, id) => {
    if ('speechSynthesis' in window) {
      // If clicking the same button while speaking, stop
      if (currentSpeakingId === id) {
        handleStopSpeech();
        return;
      }
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Strip HTML tags for speech
      const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
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
      
      utterance.lang = languageMap[language] || 'en-US';
      utterance.rate = 0.85; // Natural speaking pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Load voices and find the best match
      const voices = window.speechSynthesis.getVoices();
      const targetLang = (utterance.lang || 'en').split('-')[0];
      
      // Try to find a native voice for the language
      const nativeVoice = voices.find(voice => 
        voice.lang.startsWith(targetLang) && voice.localService
      ) || voices.find(voice => 
        voice.lang.startsWith(targetLang)
      );
      
      if (nativeVoice) {
        utterance.voice = nativeVoice;
        console.log(`🔊 Using voice: ${nativeVoice.name} (${nativeVoice.lang})`);
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

  const handleExplainText = async () => {
    // Use selected text if available, otherwise use full page text
    const textToExplain = selectedText || pageText;
    
    if (!textToExplain) {
      setError('Please load a PDF page first');
      return;
    }

    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    setLoading(true);
    setError(null);
    setUsedCache(false);

    try {
      // 🔍 CHECK CACHE FIRST
      // Use different cache keys for selection vs full page
      const cacheKey = selectedText 
        ? `explain_selection_${selectedText.substring(0, 50)}`
        : `explain_fullpage`;
      
      if (pdfId && currentPage) {
        const cachedData = await getCachedData(pdfId, currentPage, cacheKey);
        if (cachedData) {
          console.log(`⚡ Cache HIT: Using cached ${selectedText ? 'Selection' : 'Page'} Explanation`);
          setExplainResponse(cachedData);
          setUsedCache(true);
          setLoading(false);
          return;
        }
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
      const needsChunking = textToExplain.length > CHUNK_SIZE && !selectedText;

      if (needsChunking) {
        console.log(`📦 Text is large (${textToExplain.length} chars), using smart chunking...`);
        
        // Split into chunks
        const chunks = [];
        for (let i = 0; i < textToExplain.length; i += CHUNK_SIZE) {
          chunks.push(textToExplain.substring(i, i + CHUNK_SIZE));
        }
        
        console.log(`📦 Processing ${chunks.length} chunks...`);
        
        // Process each chunk
        const chunkResults = [];
        for (let i = 0; i < chunks.length; i++) {
          try {
            console.log(`📦 Processing chunk ${i + 1}/${chunks.length}...`);
            const chunkResponse = await generateExplanation(chunks[i], priorContext, apiKey);
            
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
      const response = await generateExplanation(textToExplain, priorContext, apiKey);
      
      // Try to parse JSON response
      try {
        // Remove markdown code blocks if present
        let cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Try to extract JSON if there's extra text
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        
        const parsedResponse = JSON.parse(cleanResponse);
        setExplainResponse(parsedResponse);

        // 💾 SAVE TO CACHE
        if (pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, cacheKey, parsedResponse);
          console.log('💾 Saved to cache: Explanation');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // If parsing fails, store as plain text
        setExplainResponse({ explanation: response });
      }
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
    setQuizAnswers({});
    setQuizResults(null);
    setUsedCache(false);
    
    try {
      // 🔍 CHECK CACHE FIRST
      if (pdfId && currentPage) {
        const cachedData = await getCachedData(pdfId, currentPage, 'activities');
        if (cachedData) {
          console.log('⚡ Cache HIT: Using cached Activities');
          setActivitiesResponse(cachedData);
          setUsedCache(true);
          setLoading(false);
          return;
        }
      }

      // 📚 GET PRIOR CONTEXT FOR EXERCISES
      let contextText = pageText;
      if (pdfId && currentPage > 1) {
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
      const response = await generateActivities(contextText, apiKey);
      
      // Try to parse JSON response
      try {
        let cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        const parsedResponse = JSON.parse(cleanResponse);
        setActivitiesResponse(parsedResponse);

        // 💾 SAVE TO CACHE
        if (pdfId && currentPage) {
          await saveCachedData(pdfId, currentPage, 'activities', parsedResponse);
          console.log('💾 Saved to cache: Activities');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Fallback to plain text
        setActivitiesResponse({ error: 'Could not parse activities', raw: response });
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

    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
        })
      });

      if (!response.ok) throw new Error('Quiz evaluation failed');

      const data = await response.json();
      const resultText = data.candidates[0]?.content?.parts[0]?.text || '';
      
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

    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await generateAdditionalResources(contentToAnalyze, pageText, apiKey);
      
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

  // Check if Read & Understand should be disabled (English content)
  const isEnglish = isEnglishContent(pageText);
  const readTabDisabled = isEnglish;
  const readTabTooltip = readTabDisabled 
    ? "📖 This tab is for regional languages (Hindi, Telugu, Tamil, etc.). English PDFs don't need word-by-word analysis."
    : "📚 Word-by-word analysis with pronunciation and meaning";

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Paper square elevation={1}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<TeacherIcon />} label="Teacher Mode" />
          <Tooltip title={readTabTooltip} arrow>
            <span>
              <Tab icon={<ReadIcon />} label="Read & Understand" disabled={readTabDisabled} />
            </span>
          </Tooltip>
          <Tab icon={<ExplainIcon />} label="Explain" />
          <Tab icon={<ActivitiesIcon />} label="Activities" />
          <Tab icon={<ResourcesIcon />} label="Resources" />
          <Tab icon={<NotesIcon />} label="Notes" />
        </Tabs>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Teacher Mode Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
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
                {teacherResponse && teacherResponsePage === currentPage && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    onClick={clearTeacherMode}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Get a comprehensive teacher-style explanation of the current page
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Show page mismatch warning */}
            {teacherResponse && teacherResponsePage && teacherResponsePage !== currentPage && (
              <Alert severity="info" sx={{ mb: 2 }}>
                📄 Teacher Mode data is from page {teacherResponsePage}. You're on page {currentPage}. 
                <Button size="small" onClick={clearTeacherMode} sx={{ ml: 1 }}>
                  Clear Old Data
                </Button>
              </Alert>
            )}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {teacherResponse && teacherResponsePage === currentPage && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>Teacher's Explanation</Typography>
                    {usedCache && teacherResponse && (
                      <Chip 
                        label="⚡ Cached" 
                        color="success" 
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Tooltip title={isSpeaking ? "Stop" : "Listen"}>
                    <IconButton onClick={() => handleSpeak(typeof teacherResponse === 'string' ? teacherResponse : JSON.stringify(teacherResponse))} color="primary">
                      {isSpeaking ? <Stop /> : <VolumeUp />}
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {/* Render structured content with optional English translation */}
                {typeof teacherResponse === 'object' && (teacherResponse.summary || teacherResponse.explanation) ? (
                  <Box>
                    {/* Summary */}
                    {teacherResponse.summary && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="overline" color="primary" fontWeight={700}>
                            📝 Summary
                          </Typography>
                          {!teacherEnglish.summary && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              onClick={() => handleTranslateSection('summary', teacherResponse.summary)}
                              disabled={translatingSection === 'summary'}
                              startIcon={translatingSection === 'summary' ? <CircularProgress size={14} /> : <ExplainIcon />}
                            >
                              Explain in English
                            </Button>
                          )}
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box dangerouslySetInnerHTML={{ __html: teacherResponse.summary }} />
                        </Paper>
                        {teacherEnglish.summary && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'info.lighter' }}>
                            <Typography variant="caption" color="info.main" fontWeight={600} gutterBottom display="block">
                              🌐 English Explanation:
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="overline" color="secondary" fontWeight={700}>
                            🎯 Key Points
                          </Typography>
                          {!teacherEnglish.keyPoints && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              onClick={() => handleTranslateSection('keyPoints', teacherResponse.keyPoints.join('\n'))}
                              disabled={translatingSection === 'keyPoints'}
                              startIcon={translatingSection === 'keyPoints' ? <CircularProgress size={14} /> : <ExplainIcon />}
                            >
                              Explain in English
                            </Button>
                          )}
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {teacherResponse.keyPoints.map((point, idx) => (
                              <li key={idx} style={{ marginBottom: '8px' }}>{point}</li>
                            ))}
                          </ul>
                        </Paper>
                        {teacherEnglish.keyPoints && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'info.lighter' }}>
                            <Typography variant="caption" color="info.main" fontWeight={600} gutterBottom display="block">
                              🌐 English Explanation:
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="overline" color="success.main" fontWeight={700}>
                            📚 Detailed Explanation
                          </Typography>
                          {!teacherEnglish.explanation && (
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
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box dangerouslySetInnerHTML={{ __html: teacherResponse.explanation }} />
                        </Paper>
                        {teacherEnglish.explanation && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'info.lighter' }}>
                            <Typography variant="caption" color="info.main" fontWeight={600} gutterBottom display="block">
                              🌐 English Explanation:
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="overline" color="warning.main" fontWeight={700}>
                            💡 Examples
                          </Typography>
                          {!teacherEnglish.examples && (
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
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box dangerouslySetInnerHTML={{ __html: teacherResponse.examples }} />
                        </Paper>
                        {teacherEnglish.examples && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'info.lighter' }}>
                            <Typography variant="caption" color="info.main" fontWeight={600} gutterBottom display="block">
                              🌐 English Explanation:
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="overline" color="error.main" fontWeight={700}>
                            🎓 Exam Tips
                          </Typography>
                          {!teacherEnglish.exam && (
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
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box dangerouslySetInnerHTML={{ __html: teacherResponse.exam }} />
                        </Paper>
                        {teacherEnglish.exam && (
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'info.lighter' }}>
                            <Typography variant="caption" color="info.main" fontWeight={600} gutterBottom display="block">
                              🌐 English Explanation:
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
        </TabPanel>

        {/* Read & Understand Tab */}
        <TabPanel value={activeTab} index={1}>
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
                {analyzingWords && wordBatch === 1 ? 'Analyzing...' : '📚 Start Word Analysis'}
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
                  {analyzingWords ? 'Loading...' : `📖 Load More Words (Batch ${wordBatch + 1})`}
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
                  📚 Word-by-Word Analysis
                </Typography>
                
                {wordAnalysis[0] && (
                  <Box>
                    {/* Page Summary */}
                    {wordAnalysis[0].summary && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
                        <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                          📄 Page Summary:
                        </Typography>
                        <Typography variant="body2">
                          {wordAnalysis[0].summary}
                        </Typography>
                      </Paper>
                    )}
                    
                    {/* Language Badge */}
                    {wordAnalysis[0].language && (
                      <Chip 
                        label={`Language: ${wordAnalysis[0].language}`}
                        color="primary"
                        size="small"
                        sx={{ mb: 2 }}
                      />
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
                            bgcolor: speakingWordIndex === idx ? 'primary.lighter' : 'grey.50',
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
                                  <Chip 
                                    label={word.partOfSpeech}
                                    size="small"
                                    color="secondary"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                              <Button
                                size="small"
                                variant={speakingWordIndex === idx ? "contained" : "outlined"}
                                color="secondary"
                                startIcon={speakingWordIndex === idx ? '⏸️' : '🔊'}
                                onClick={() => handleSpeakWord(word.word, wordAnalysis[0].language, idx)}
                                sx={{ minWidth: 100 }}
                              >
                                {speakingWordIndex === idx ? 'Speaking...' : 'Listen'}
                              </Button>
                            </Box>

                            {/* Pronunciation Guide */}
                            <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                🗣️ Pronunciation Guide:
                              </Typography>
                              <Typography variant="body2" fontStyle="italic" color="text.secondary">
                                {word.pronunciation}
                              </Typography>
                            </Box>

                            {/* English Meaning */}
                            <Box sx={{ bgcolor: 'info.lighter', p: 1.5, borderRadius: 1 }}>
                              <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                🌐 English Meaning:
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
        </TabPanel>

        {/* Explain Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              {/* Stop Speech Button (Global) */}
              {currentSpeakingId && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleStopSpeech}
                      startIcon="⏹️"
                    >
                      Stop Speaking
                    </Button>
                  }
                >
                  🔊 Voice is playing...
                </Alert>
              )}
              
              {selectedText && !isRegionalLanguageOrGarbled(selectedText) && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Selected Text:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    "{selectedText}"
                  </Typography>
                </Paper>
              )}
              {selectedText && isRegionalLanguageOrGarbled(selectedText) && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'info.lighter' }}>
                  <Typography variant="caption" color="info.main" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>ℹ️</span> Regional Language Text Selected
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {selectedText.length} characters selected. Click below to get explanation.
                  </Typography>
                </Paper>
              )}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<ExplainIcon />}
                  onClick={handleExplainText}
                  disabled={loading || (!selectedText && !pageText)}
                >
                  {loading ? 'Analyzing...' : 
                   selectedText ? 'Explain Selected Text' : 
                   '📝 Analyze This Page'}
                </Button>
                {explainResponse && explainResponsePage === currentPage && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={() => {
                          let content = '';
                          if (typeof explainResponse === 'string') {
                            content = explainResponse;
                          } else {
                            content = `
                              ${explainResponse.explanation ? `<div><h4>📖 Explanation</h4><p>${explainResponse.explanation}</p></div>` : ''}
                              ${explainResponse.analogy ? `<div><h4>💡 Analogy</h4><p>${explainResponse.analogy}</p></div>` : ''}
                              ${explainResponse.pyq ? `<div><h4>📝 Exam Question</h4><p>${explainResponse.pyq}</p></div>` : ''}
                              ${explainResponse.exercises && explainResponse.exercises.length > 0 ? `
                                <div><h4>✏️ Exercises & Solutions</h4>
                                ${explainResponse.exercises.map((ex, idx) => `
                                  <div style="margin-bottom: 16px; border-left: 3px solid #1976d2; padding-left: 12px;">
                                    <p><strong>Question ${idx + 1}:</strong> ${ex.question || ex.question_english || ''}</p>
                                    <p><strong>Answer:</strong> ${ex.answer || ex.answer_english || ''}</p>
                                    ${ex.steps && ex.steps.length > 0 ? `
                                      <p><strong>Steps:</strong></p>
                                      <ol>${ex.steps.map(step => `<li>${step.step || step.step_english || ''}</li>`).join('')}</ol>
                                    ` : ''}
                                  </div>
                                `).join('')}
                                </div>
                              ` : ''}
                            `;
                          }
                          addToNotes(content, `📚 Explanation - Page ${currentPage}`);
                        }}
                        disabled={loading}
                        startIcon={<AddToNotesIcon />}
                        sx={{ minWidth: '140px' }}
                      >
                        Add to Notes
                      </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={() => {
                        setExplainResponse(null);
                        setExplainResponsePage(null);
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {selectedText 
                  ? '🔍 Analyzes selected text and detects: exercises, important notes, formulas, warnings'
                  : '🤖 Smart AI Analysis: Automatically detects exercises, notes, and provides answer clues with page references'}
              </Typography>
              <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                💡 Tip: For best results on large pages, select specific sections (exercises, notes, etc.)
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {explainResponse && explainResponsePage === currentPage && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                {typeof explainResponse === 'object' && explainResponse.explanation ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Header with Language Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={700}>
                          💡 Analysis & Solutions
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
                              explainResponse.contentType === 'notes' ? '📌 Notes' :
                              explainResponse.contentType === 'mixed' ? '📝📌 Mixed' : '📖 Content'
                            }
                            size="small"
                            color={explainResponse.contentType === 'exercise' ? 'warning' : 'default'}
                          />
                        )}
                      </Box>
                    </Box>

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
                            sx={{ p: 3, mb: 3, bgcolor: 'grey.50', border: '2px solid', borderColor: 'warning.light' }}
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
                                <Paper sx={{ p: 1.5, bgcolor: 'info.lighter', mt: 1, borderLeft: '4px solid', borderColor: 'info.main' }}>
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

                            {/* Complete Answer - Bilingual */}
                            {exercise.answer && (
                              <Box sx={{ mb: 2 }}>
                                <Paper sx={{ p: 2, bgcolor: 'success.lighter', borderLeft: '4px solid', borderColor: 'success.main' }}>
                                  <Typography variant="subtitle2" fontWeight={700} color="success.dark" gutterBottom>
                                    ✅ Complete Answer:
                                  </Typography>
                                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {exercise.answer}
                                  </Typography>
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
                                  <Paper sx={{ p: 2, mt: 1.5, bgcolor: 'info.lighter', borderLeft: '4px solid', borderColor: 'info.main' }}>
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
                                  📋 Step-by-Step Solution:
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: 'white' }}>
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
                                            dangerouslySetInnerHTML={{ __html: `🌐 ${formatBoldText(stepEnglish)}` }}
                                          />
                                        )}
                                        
                                        {/* Visual Aid for THIS specific step (if it has one and it's not empty) */}
                                        <VisualAidRenderer visualAid={stepVisual} />
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
                                  💡 Helpful Hints:
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
                              <Paper sx={{ p: 1.5, bgcolor: 'info.lighter' }}>
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
                              {note.type === 'warning' && '⚠️ '}
                              {note.type === 'definition' && '📖 '}
                              {note.type === 'reminder' && '💭 '}
                              {note.title}
                            </Typography>
                            <Typography variant="body2">{note.content}</Typography>
                            
                            {note.title_english && note.title_english !== note.title && (
                              <Paper sx={{ p: 1.5, mt: 1.5, bgcolor: 'white' }}>
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
                          💡 Detailed Explanation
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box dangerouslySetInnerHTML={{ __html: explainResponse.explanation }} />
                          <Button
                            size="small"
                            startIcon="🔊"
                            onClick={() => handleSpeakText(explainResponse.explanation, explainResponse.language, 'exp')}
                            sx={{ mt: 1 }}
                          >
                            Listen to Explanation
                          </Button>
                        </Paper>
                        
                        {explainResponse.explanation_english && explainResponse.explanation_english !== explainResponse.explanation && (
                          <Paper sx={{ p: 2, mt: 1.5, bgcolor: 'info.lighter', borderLeft: '4px solid', borderColor: 'info.main' }}>
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
                      </Box>
                    )}
                    
                    {/* Analogy Section - Bilingual */}
                    {explainResponse.analogy && (
                      <Paper sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          💡 Helpful Analogy:
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
                        <Typography variant="overline" color="info.main" fontWeight={700} gutterBottom>
                          Visual Diagram
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            bgcolor: 'grey.50',
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
                        <Typography variant="overline" color="secondary" fontWeight={700} gutterBottom>
                          Interactive Demo
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            bgcolor: 'grey.50',
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
        </TabPanel>

        {/* Activities Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
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
                {activitiesResponse && activitiesResponsePage === currentPage && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    onClick={clearActivities}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Generate RBL, CBL, and SEA activities based on current page content
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Show page mismatch warning */}
            {activitiesResponse && activitiesResponsePage && activitiesResponsePage !== currentPage && (
              <Alert severity="info" sx={{ mb: 2 }}>
                📄 Activities are from page {activitiesResponsePage}. You're on page {currentPage}. 
                <Button size="small" onClick={clearActivities} sx={{ ml: 1 }}>
                  Clear Old Data
                </Button>
              </Alert>
            )}

            {loading && (
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
                    {/* MCQ Quiz Section */}
                    {activitiesResponse.mcqs && activitiesResponse.mcqs.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          📝 Multiple Choice Quiz
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
                            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: quizResults ? (quizResults.questionFeedback[idx]?.correct ? 'success.lighter' : 'error.lighter') : 'grey.50' }}>
                              {/* Question - Bilingual in same box */}
                              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'white' }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                  {idx + 1}. {questionOriginal || questionEnglish}
                                </Typography>
                                {questionOriginal && (
                                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                    <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                      🌐 English:
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
                                                    <Typography variant="caption" color="info.main" fontWeight={600} display="block">
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
                                        <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                          🌐 English Explanation:
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {explanationEnglish}
                                        </Typography>
                                      </Box>
                                    )}
                                    {quizResults.questionFeedback[idx]?.feedback && (
                                      <Typography variant="body2" sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider', fontStyle: 'italic' }}>
                                        💡 {quizResults.questionFeedback[idx].feedback}
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
                            color="primary"
                            onClick={handleSubmitQuiz}
                            disabled={submittingQuiz || Object.keys(quizAnswers).length < activitiesResponse.mcqs.length}
                            startIcon={submittingQuiz ? <CircularProgress size={20} /> : null}
                            sx={{ mt: 1 }}
                          >
                            {submittingQuiz ? 'Evaluating...' : 'Submit Quiz'}
                          </Button>
                        ) : (
                          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'primary.lighter' }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              📊 Quiz Results: {quizResults.score} ({quizResults.percentage}%)
                            </Typography>
                            <Typography variant="body1">{quizResults.feedback}</Typography>
                            <Button
                              variant="outlined"
                              color="primary"
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
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {originalText}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.lighter' }}>
                                  {originalText && (
                                    <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                      🌐 English:
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
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {original}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.lighter' }}>
                                  {original && (
                                    <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                      🌐 English:
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
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {original}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.lighter' }}>
                                  {original && (
                                    <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                      🌐 English:
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
                                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {original}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.lighter' }}>
                                  {original && (
                                    <Typography variant="caption" color="info.main" fontWeight={600} display="block" gutterBottom>
                                      🌐 English:
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
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Additional Resources Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              {selectedText && !isRegionalLanguageOrGarbled(selectedText) && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'info.lighter' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Selected Text:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    "{selectedText}"
                  </Typography>
                </Paper>
              )}
              {selectedText && isRegionalLanguageOrGarbled(selectedText) && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.lighter' }}>
                  <Typography variant="caption" color="success.main" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>✓</span> Regional Language Text Selected
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {selectedText.length} characters selected. Resources will be in the appropriate language.
                  </Typography>
                </Paper>
              )}
              {!selectedText && pageText && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                    📄 Using Current Page Content
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No text selected. Will analyze the entire current page for resources.
                  </Typography>
                </Paper>
              )}

              <Button
                fullWidth
                variant="contained"
                color="info"
                size="large"
                startIcon={<ResourcesIcon />}
                onClick={handleGenerateResources}
                disabled={loading || (!selectedText && !pageText)}
              >
                {loading ? 'Generating...' : selectedText ? 'Find Resources for Selection' : 'Find Resources for Current Page'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {selectedText 
                  ? 'Discover resources related to your selected text'
                  : 'Discover web resources and related topics for this page'
                }
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {resourcesResponse && !loading && (
              <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                {resourcesResponse.error ? (
                  <Typography color="error">{resourcesResponse.error}</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Web Resources */}
                    {resourcesResponse.webResources && resourcesResponse.webResources.length > 0 && (
                      <Box>
                        <Typography variant="overline" color="primary" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LinkIcon /> Recommended Resources
                        </Typography>
                        {resourcesResponse.webResources.map((resource, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={600} 
                              color="primary"
                              component="a"
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ 
                                textDecoration: 'none', 
                                '&:hover': { textDecoration: 'underline' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              {resource.title}
                              <LinkIcon sx={{ fontSize: 16 }} />
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {resource.type} • {resource.url}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {resource.description}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}

                    {/* Related Topics */}
                    {resourcesResponse.relatedTopics && resourcesResponse.relatedTopics.length > 0 && (
                      <Box>
                        <Typography variant="overline" color="secondary" fontWeight={700}>
                          Related Topics
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {resourcesResponse.relatedTopics.map((topic, idx) => (
                            <Typography key={idx} variant="body2" sx={{ px: 2, py: 1, bgcolor: 'secondary.lighter', borderRadius: 1 }}>
                              {topic}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={activeTab} index={5}>
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

        {/* Notes Tab */}
        <TabPanel value={activeTab} index={5}>
          <NotesEditor pdfId={pdfId} />
        </TabPanel>
      </Box>
    </Box>
  );
}

export default AIModePanel;

