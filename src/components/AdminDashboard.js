import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Button,
  Divider,
  Alert,
  Chip,
  FormControlLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  Close as CloseIcon,
  CloudUpload,
  Delete,
  Folder,
  Refresh,
  Visibility,
  ToggleOn,
  SmartToy,
  TextSnippet,
  ImportExport
} from '@mui/icons-material';
import libraryService, { saveExamPrepCache } from '../services/libraryService';
import zipHandler from '../services/zipHandler';
import { generateExamPrep } from '../services/geminiService';
import { extractFullPdfText } from '../services/pdfExtractor';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

const DEFAULT_CONFIG = {
  // Tab Visibility - Updated to match current app tabs
  tabs: {
    learn: { enabled: true, label: 'Learn' },
    explain: { enabled: true, label: 'Explain' },
    activities: { enabled: true, label: 'Activities' },
    exam: { enabled: true, label: 'Exam' },
    tools: { enabled: true, label: 'Tools' },
    vyonnAI: { enabled: true, label: 'Vyonn AI' }
  },
  
  // Feature Settings
  features: {
    caching: true,
    autoSave: true,
    speechSynthesis: true,
    visualAids: true,
    educationalTools: true
  },
  
  // AI Settings
  ai: {
    defaultProvider: 'groq', // groq, gemini, perplexity, mistral
    temperature: 0.7,
    maxTokens: {
      teacherMode: 4096,
      explain: 8192,
      activities: 4096,
      examPrep: 4096,
      longAnswer: 1536,
      wordAnalysis: 4096
    }
  },
  
  // Prompts (editable)
  prompts: {
    teacherMode: {
      name: 'Learn Mode',
      system: 'You are an expert teacher explaining educational content.',
      instructions: 'Provide a comprehensive explanation in the same language as the input.'
    },
    explain: {
      name: 'Smart Explain',
      system: 'You are a helpful tutor explaining concepts clearly.',
      instructions: 'Break down the concept with examples, analogies, and practice questions.'
    },
    examPrep: {
      name: 'Exam Preparation',
      system: 'You are an expert exam question creator.',
      instructions: 'Generate MCQs (Assertion & Reasoning), Short Answer, and Long Answer questions.'
    }
  }
};

// Navigation items for left pane
const NAV_ITEMS = [
  { id: 'tabs', label: 'Tab Visibility', icon: <Visibility /> },
  { id: 'features', label: 'Feature Settings', icon: <ToggleOn /> },
  { id: 'ai', label: 'AI Configuration', icon: <SmartToy /> },
  { id: 'prompts', label: 'AI Prompts', icon: <TextSnippet /> },
  { id: 'export', label: 'Export / Import', icon: <ImportExport /> }
];

// Hidden for now - Library Management
// { id: 'library', label: 'Library Management', icon: <Folder /> },

function AdminDashboard({ open, onClose }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('tabs');
  
  // Library management state (hidden but kept)
  const [pdfs, setPdfs] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  
  // Upload dialog state
  const [uploadDialog, setUploadDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    subject: '',
    class: '',
    customSubject: '',
    bookName: ''
  });
  
  // ZIP extraction state
  const [zipExtracting, setZipExtracting] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0, message: '' });
  const [extractedPdfs, setExtractedPdfs] = useState([]);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ekamanam_admin_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        
        // Only keep tabs that exist in DEFAULT_CONFIG (filter out stale entries)
        const validTabs = {};
        Object.keys(DEFAULT_CONFIG.tabs).forEach(key => {
          if (parsed.tabs && parsed.tabs[key]) {
            validTabs[key] = { ...DEFAULT_CONFIG.tabs[key], ...parsed.tabs[key] };
          } else {
            validTabs[key] = DEFAULT_CONFIG.tabs[key];
          }
        });
        
        // Only keep features that exist in DEFAULT_CONFIG
        const validFeatures = {};
        Object.keys(DEFAULT_CONFIG.features).forEach(key => {
          validFeatures[key] = parsed.features && parsed.features[key] !== undefined 
            ? parsed.features[key] 
            : DEFAULT_CONFIG.features[key];
        });
        
        setConfig({
          ...DEFAULT_CONFIG,
          ...parsed,
          tabs: validTabs,
          features: validFeatures,
          ai: { ...DEFAULT_CONFIG.ai, ...(parsed.ai || {}) },
          prompts: { ...DEFAULT_CONFIG.prompts, ...(parsed.prompts || {}) }
        });
      } catch (error) {
        console.error('Failed to load admin config:', error);
      }
    }
    
    // Load library (kept for future use)
    if (open) {
      loadLibrary();
    }
  }, [open]);
  
  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const allPdfs = await libraryService.getAllLibraryItems();
      setPdfs(allPdfs);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };
  
  // eslint-disable-next-line no-unused-vars
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if it's a ZIP file
    if (zipHandler.isZipFile(file)) {
      await handleZipUpload(file);
      return;
    }
    
    // Regular PDF upload
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF or ZIP file');
      return;
    }
    
    // Open dialog for metadata
    setPendingFile(file);
    setUploadMetadata({
      subject: '',
      class: '',
      customSubject: '',
      bookName: ''
    });
    setUploadDialog(true);
  };
  
  const handleZipUpload = async (zipFile) => {
    setZipExtracting(true);
    setZipProgress({ current: 0, total: 0, message: 'Reading ZIP file...' });
    
    try {
      // Extract all PDFs from ZIP
      const pdfFiles = await zipHandler.extractZipFile(
        zipFile,
        (current, total, message) => {
          setZipProgress({ current, total, message });
        }
      );
      
      if (pdfFiles.length === 0) {
        alert('No PDF files found in the ZIP archive');
        setZipExtracting(false);
        return;
      }
      
      // Show metadata confirmation dialog
      setExtractedPdfs(pdfFiles);
      const detectedMetadata = pdfFiles[0].metadata;
      
      // Ensure we have a collection name
      let bookName = detectedMetadata.collection || zipFile.name.replace('.zip', '');
      
      // If bookName looks like a code (e.g., "hecu1dd"), make it more readable
      if (bookName.length < 10 && /^[a-z0-9]+$/i.test(bookName)) {
        bookName = bookName.toUpperCase();
      }
      
      setUploadMetadata({
        subject: detectedMetadata.subject || '',
        class: detectedMetadata.class || '',
        customSubject: '',
        bookName: bookName
      });
      setZipExtracting(false);
      setUploadDialog(true);
      
    } catch (error) {
      console.error('❌ ZIP extraction error:', error);
      alert(`Failed to extract ZIP file:\n${error.message}`);
      setZipExtracting(false);
    }
  };
  
  const handleConfirmUpload = async () => {
    const subject = uploadMetadata.subject === 'Other' 
      ? uploadMetadata.customSubject || 'General'
      : uploadMetadata.subject || 'General';
    
    // Batch upload from ZIP
    if (extractedPdfs.length > 0) {
      setZipExtracting(true);
      setZipProgress({ current: 0, total: extractedPdfs.length, message: 'Adding PDFs to library...' });
      
      try {
        let successCount = 0;
        
        for (let i = 0; i < extractedPdfs.length; i++) {
          const pdfData = extractedPdfs[i];
          setZipProgress({ 
            current: i + 1, 
            total: extractedPdfs.length, 
            message: `Adding ${pdfData.filename}...` 
          });
          
          // Determine collection name with priority
          const collectionName = uploadMetadata.bookName || pdfData.metadata.collection || 'Book Collection';
          
          const pdfName = pdfData.metadata.type === 'chapter'
            ? `${collectionName} - ${pdfData.metadata.title}`
            : `${collectionName} - ${pdfData.metadata.title}`;
          
          const libraryItem = await libraryService.addPDFToLibrary(pdfData.file, {
            name: pdfName,
            subject: subject,
            class: uploadMetadata.class || null,
            workspace: 'My Files',
            collection: collectionName,
            chapter: pdfData.metadata.chapter,
            chapterTitle: pdfData.metadata.title,
            totalPages: pdfData.metadata.totalPages || 0,
            pdfTitle: pdfData.metadata.pdfTitle
          });
          
          // Store thumbnail (individual PDF thumbnail or cover image)
          const thumbnailToStore = pdfData.metadata.thumbnail || pdfData.metadata.coverImage;
          if (thumbnailToStore) {
            try {
              await libraryService.storeThumbnail(libraryItem.id, thumbnailToStore);
            } catch (error) {
              console.warn('⚠️ Failed to store thumbnail:', error);
            }
          }
          
          successCount++;
        }
        
        await loadLibrary();
        setUploadDialog(false);
        setExtractedPdfs([]);
        setZipExtracting(false);
        alert(`✅ Successfully added ${successCount} PDFs to library!`);
        
      } catch (error) {
        console.error('❌ Failed to add PDFs from ZIP:', error);
        alert(`Failed to add some PDFs:\n${error.message}`);
        setZipExtracting(false);
      }
      return;
    }
    
    // Single PDF upload
    if (!pendingFile) return;
    
    try {
      const libraryItem = await libraryService.addPDFToLibrary(pendingFile, {
        name: pendingFile.name.replace('.pdf', ''),
        subject: subject,
        class: uploadMetadata.class || null,
        workspace: 'My Files',
        collection: uploadMetadata.bookName || 'Uncategorized'
      });
      
      await loadLibrary();
      setUploadDialog(false);
      setPendingFile(null);
      alert(`✅ "${pendingFile.name}" added to library!`);
      
      // V3.0: Generate exam prep in background
      generateExamPrepInBackground(libraryItem.id, pendingFile);
      
    } catch (error) {
      console.error('❌ Failed to add PDF:', error);
      alert(`Failed to add PDF to library:\n${error.message}\n\nPlease try again.`);
    }
  };
  
  /**
   * V3.0: Generate exam prep in background after PDF upload
   * Runs asynchronously without blocking the UI
   */
  const generateExamPrepInBackground = async (pdfId, file) => {
    try {
      console.log('🎓 [V3.0] Starting background exam prep generation for:', pdfId);
      
      // Load PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract text
      const fullText = await extractFullPdfText(pdf);
      
      // Generate exam prep (Groq will make this fast!)
      const chunks = [];
      const CHUNK_SIZE = 3000;
      for (let i = 0; i < fullText.length && i < 15000; i += CHUNK_SIZE) {  // Max 5 chunks
        chunks.push(fullText.substring(i, i + CHUNK_SIZE));
      }
      
      const mergedResponse = {
        mcqs: [],
        shortAnswer: [],
        longAnswer: []
      };
      
      for (let i = 0; i < Math.min(chunks.length, 3); i++) {  // Process max 3 chunks
        try {
          const chunkResponse = await generateExamPrep(fullText, chunks[i], i + 1, chunks.length);
          if (chunkResponse.mcqs) mergedResponse.mcqs.push(...chunkResponse.mcqs);
          if (chunkResponse.shortAnswer) mergedResponse.shortAnswer.push(...chunkResponse.shortAnswer);
          if (chunkResponse.longAnswer) mergedResponse.longAnswer.push(...chunkResponse.longAnswer);
        } catch (chunkError) {
          console.warn(`⚠️ Chunk ${i + 1} failed:`, chunkError.message);
        }
      }
      
      // Cache the generated exam prep
      await saveExamPrepCache(pdfId, mergedResponse);
      console.log('✅ [V3.0] Exam prep cached successfully!', {
        mcqs: mergedResponse.mcqs.length,
        shortAnswer: mergedResponse.shortAnswer.length,
        longAnswer: mergedResponse.longAnswer.length
      });
      
    } catch (error) {
      console.error('❌ Background exam prep generation failed:', error);
      // Don't show error to user - this is background
    }
  };
  
  const handleCancelUpload = () => {
    setUploadDialog(false);
    setPendingFile(null);
    setExtractedPdfs([]);
    setUploadMetadata({ subject: '', class: '', customSubject: '', bookName: '' });
  };
  
  // eslint-disable-next-line no-unused-vars
  const handleDeletePdf = async (id, name) => {
    if (window.confirm(`Delete "${name}" from library? This cannot be undone.`)) {
      try {
        await libraryService.removePDFFromLibrary(id);
        await loadLibrary();
        alert(`✅ Deleted ${name}`);
      } catch (error) {
        console.error('Failed to delete:', error);
        alert(`❌ Failed to delete: ${error.message}`);
      }
    }
  };

  const handleSave = () => {
    localStorage.setItem('ekamanam_admin_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('adminConfigUpdated', { detail: config }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('ekamanam_admin_config');
  };

  const updateTabEnabled = (tabKey, enabled) => {
    setConfig({
      ...config,
      tabs: {
        ...config.tabs,
        [tabKey]: { ...config.tabs[tabKey], enabled }
      }
    });
  };

  const updateFeature = (featureKey, enabled) => {
    setConfig({
      ...config,
      features: { ...config.features, [featureKey]: enabled }
    });
  };

  const updatePrompt = (promptKey, field, value) => {
    setConfig({
      ...config,
      prompts: {
        ...config.prompts,
        [promptKey]: { ...config.prompts[promptKey], [field]: value }
      }
    });
  };

  const updateAISetting = (key, value) => {
    setConfig({
      ...config,
      ai: { ...config.ai, [key]: value }
    });
  };

  const updateMaxTokens = (key, value) => {
    setConfig({
      ...config,
      ai: {
        ...config.ai,
        maxTokens: { ...config.ai.maxTokens, [key]: parseInt(value) || 0 }
      }
    });
  };

  // Render the content for each section
  const renderContent = () => {
    switch (activeSection) {
      case 'tabs':
  return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Tab Visibility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Control which tabs are visible in the PDF reader view.
              </Typography>
            <Grid container spacing={2}>
              {Object.entries(config.tabs)
                .filter(([key, tab]) => tab && tab.label && DEFAULT_CONFIG.tabs[key]) // Only show valid tabs
                .map(([key, tab]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>{tab.label}</Typography>
                        <Switch
                          checked={tab.enabled}
                          onChange={(e) => updateTabEnabled(key, e.target.checked)}
                      color="primary"
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'features':
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Feature Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enable or disable application features.
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(config.features)
                .filter(([key]) => DEFAULT_CONFIG.features.hasOwnProperty(key)) // Only show valid features
                .map(([key, enabled]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                        <Switch
                          checked={enabled}
                          onChange={(e) => updateFeature(key, e.target.checked)}
                      color="primary"
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'ai':
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              AI Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure AI provider settings and token limits.
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Default Provider
              </Typography>
              <TextField
                select
                fullWidth
                value={config.ai.defaultProvider}
                onChange={(e) => updateAISetting('defaultProvider', e.target.value)}
                SelectProps={{ native: true }}
                size="small"
              >
                <option value="groq">Groq (Fast)</option>
                <option value="gemini">Gemini (Balanced)</option>
                <option value="perplexity">Perplexity (Research)</option>
                <option value="mistral">Mistral (Privacy)</option>
              </TextField>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Temperature: {config.ai.temperature}
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={config.ai.temperature}
                onChange={(e) => updateAISetting('temperature', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                size="small"
              />
            </Box>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Max Tokens (per feature)
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(config.ai.maxTokens).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type="number"
                    fullWidth
                    value={value}
                    onChange={(e) => updateMaxTokens(key, e.target.value)}
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'prompts':
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              AI Prompts (Advanced)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize the system prompts and instructions for AI responses.
            </Typography>
            {Object.entries(config.prompts).map(([key, prompt]) => (
              <Paper key={key} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {prompt.name}
                </Typography>
                <TextField
                  label="System Prompt"
                  fullWidth
                  multiline
                  rows={2}
                  value={prompt.system}
                  onChange={(e) => updatePrompt(key, 'system', e.target.value)}
                  sx={{ mb: 2 }}
                  size="small"
                />
                <TextField
                  label="Instructions"
                  fullWidth
                  multiline
                  rows={3}
                  value={prompt.instructions}
                  onChange={(e) => updatePrompt(key, 'instructions', e.target.value)}
                  size="small"
                />
              </Paper>
            ))}
          </Box>
        );

      case 'export':
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Export / Import Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Backup or restore your admin configuration.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ImportExport />}
                onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ekamanam-config.json';
                  a.click();
                }}
              >
                Export Configuration
              </Button>
              <Button
                variant="outlined"
                component="label"
              >
                Import Configuration
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const importedConfig = JSON.parse(event.target.result);
                          setConfig(importedConfig);
                        } catch (error) {
                          alert('Invalid configuration file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </Button>
            </Box>
          </Box>
        );

      /* Library Management - Hidden for now
      case 'library':
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Library Management
            </Typography>
            ... library content would go here ...
          </Box>
        );
      */

      default:
        return null;
    }
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '85vh' }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Admin Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleReset}
              color="warning"
              size="small"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="small"
            >
              Save
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex' }}>
        {/* Left Navigation Pane */}
        <Box sx={{ 
          width: 220, 
          borderRight: 1, 
          borderColor: 'divider',
          bgcolor: 'grey.50',
          flexShrink: 0
        }}>
          <List sx={{ py: 1 }}>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.id}
                selected={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontSize: '0.875rem',
                    fontWeight: activeSection === item.id ? 600 : 400
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Right Content Pane */}
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
          {saved && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Configuration saved successfully! Refresh the page to apply changes.
            </Alert>
          )}
          {renderContent()}
        </Box>
      </DialogContent>
    </Dialog>
    
    {/* Upload Metadata Dialog - kept for future use */}
    <Dialog open={uploadDialog} onClose={handleCancelUpload} maxWidth="sm" fullWidth>
      <DialogTitle>
        {extractedPdfs.length > 0 
          ? `Add ${extractedPdfs.length} PDFs to Library` 
          : 'Add PDF to Library'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {extractedPdfs.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Found {extractedPdfs.length} PDFs in ZIP file. Please confirm the metadata:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default', mt: 1 }}>
                <Typography variant="caption" display="block">
                  <strong>Detected Collection:</strong> {uploadMetadata.bookName || 'None'}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Files:</strong> {extractedPdfs.map(p => p.filename).join(', ')}
                </Typography>
              </Paper>
              
              <TextField
                fullWidth
                label="Book/Collection Name"
                placeholder="e.g., Grade 10 Science"
                value={uploadMetadata.bookName}
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, bookName: e.target.value })}
                sx={{ mt: 2 }}
                helperText="This name will be used to group all chapters together"
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Selected: <strong>{pendingFile?.name}</strong>
            </Typography>
          )}
          
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={uploadMetadata.subject}
              label="Subject"
              onChange={(e) => setUploadMetadata({ ...uploadMetadata, subject: e.target.value })}
            >
              <MenuItem value="Mathematics">Mathematics</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
              <MenuItem value="Physics">Physics</MenuItem>
              <MenuItem value="Chemistry">Chemistry</MenuItem>
              <MenuItem value="Biology">Biology</MenuItem>
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="History">History</MenuItem>
              <MenuItem value="Geography">Geography</MenuItem>
              <MenuItem value="Computer Science">Computer Science</MenuItem>
              <MenuItem value="Economics">Economics</MenuItem>
              <MenuItem value="Other">Other (Specify below)</MenuItem>
            </Select>
          </FormControl>
          
          {uploadMetadata.subject === 'Other' && (
            <TextField
              fullWidth
              label="Custom Subject"
              placeholder="Enter subject name"
              value={uploadMetadata.customSubject}
              onChange={(e) => setUploadMetadata({ ...uploadMetadata, customSubject: e.target.value })}
            />
          )}
          
          <FormControl fullWidth>
            <InputLabel>Class/Grade (Optional)</InputLabel>
            <Select
              value={uploadMetadata.class}
              label="Class/Grade (Optional)"
              onChange={(e) => setUploadMetadata({ ...uploadMetadata, class: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="1">Class 1</MenuItem>
              <MenuItem value="2">Class 2</MenuItem>
              <MenuItem value="3">Class 3</MenuItem>
              <MenuItem value="4">Class 4</MenuItem>
              <MenuItem value="5">Class 5</MenuItem>
              <MenuItem value="6">Class 6</MenuItem>
              <MenuItem value="7">Class 7</MenuItem>
              <MenuItem value="8">Class 8</MenuItem>
              <MenuItem value="9">Class 9</MenuItem>
              <MenuItem value="10">Class 10</MenuItem>
              <MenuItem value="11">Class 11</MenuItem>
              <MenuItem value="12">Class 12</MenuItem>
              <MenuItem value="University">University</MenuItem>
            </Select>
          </FormControl>
          
          {zipExtracting && (
            <Box>
              <Typography variant="body2" gutterBottom>
                {zipProgress.message}
              </Typography>
              <LinearProgress 
                variant={zipProgress.total > 0 ? "determinate" : "indeterminate"}
                value={zipProgress.total > 0 ? (zipProgress.current / zipProgress.total) * 100 : 0}
              />
              {zipProgress.total > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {zipProgress.current} / {zipProgress.total}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelUpload} disabled={zipExtracting}>Cancel</Button>
        <Button 
          onClick={handleConfirmUpload} 
          variant="contained"
          disabled={!uploadMetadata.subject || (uploadMetadata.subject === 'Other' && !uploadMetadata.customSubject) || zipExtracting}
        >
          {zipExtracting ? 'Adding...' : 'Add to Library'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default AdminDashboard;
