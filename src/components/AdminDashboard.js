import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  FormControlLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore,
  Settings as SettingsIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  Close as CloseIcon,
  CloudUpload,
  Delete,
  Folder,
  Refresh
} from '@mui/icons-material';
import libraryService from '../services/libraryService';
import zipHandler from '../services/zipHandler';

const DEFAULT_CONFIG = {
  // Tab Visibility
  tabs: {
    teacherMode: { enabled: true, label: 'Teacher Mode' },
    multilingual: { enabled: true, label: 'Multilingual', autoDisableForEnglish: true },
    explain: { enabled: true, label: 'Smart Explain' },
    activities: { enabled: true, label: 'Activities' },
    examPrep: { enabled: true, label: 'Exam Prep' },
    resources: { enabled: true, label: 'Resources' },
    notes: { enabled: true, label: 'Notes' }
  },
  
  // Feature Settings
  features: {
    caching: true,
    autoSave: true,
    speechSynthesis: true,
    visualAids: true,
    bilingualMode: true
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
      name: 'Teacher Mode',
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

function AdminDashboard({ open, onClose }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  
  // Library management state
  const [pdfs, setPdfs] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    subject: '',
    class: '',
    bookName: ''
  });

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ekamanam_admin_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Failed to load admin config:', error);
      }
    }
    
    // Load library
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
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadingPdf(true);
    
    try {
      // Check if ZIP
      if (zipHandler.isZipFile(file)) {
        const extracted = await zipHandler.extractZipFile(file, (current, total, message) => {
          console.log(`Progress: ${current}/${total} - ${message}`);
        });
        
        // Add all PDFs from ZIP
        for (const pdfData of extracted.pdfFiles) {
          await libraryService.addPDFToLibrary(pdfData.file, {
            name: pdfData.metadata.title || pdfData.filename,
            subject: uploadMetadata.subject || pdfData.metadata.subject,
            class: uploadMetadata.class || pdfData.metadata.class,
            collection: uploadMetadata.bookName || pdfData.metadata.collection,
            chapter: pdfData.metadata.chapter,
            chapterTitle: pdfData.metadata.title,
            totalPages: pdfData.metadata.totalPages,
            pdfTitle: pdfData.metadata.pdfTitle
          });
        }
        
        alert(`✅ Added ${extracted.pdfFiles.length} PDFs from ZIP`);
      } else {
        // Single PDF
        await libraryService.addPDFToLibrary(file, {
          name: file.name.replace('.pdf', ''),
          subject: uploadMetadata.subject,
          class: uploadMetadata.class,
          collection: uploadMetadata.bookName || 'Uncategorized'
        });
        
        alert(`✅ Added ${file.name}`);
      }
      
      await loadLibrary();
      setUploadMetadata({ subject: '', class: '', bookName: '' });
      
    } catch (error) {
      console.error('Failed to upload:', error);
      alert(`❌ Failed to upload: ${error.message}`);
    } finally {
      setUploadingPdf(false);
    }
  };
  
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              🛠️ Admin Dashboard
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
      
      <DialogContent dividers sx={{ p: 3 }}>

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuration saved successfully! Refresh the page to apply changes.
          </Alert>
        )}

        {/* Library Management Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Folder color="primary" />
              <Typography variant="h6">📚 Library Management</Typography>
              <Chip label={`${pdfs.length} PDFs`} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Admin Only:</strong> Only admins can add or remove PDFs. Students can only view and use PDFs from the library.
            </Alert>
            
            {/* Upload Section */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Add PDFs to Library
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Subject"
                    value={uploadMetadata.subject}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Mathematics"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Class"
                    value={uploadMetadata.class}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, class: e.target.value }))}
                    placeholder="e.g., 10"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Book Name"
                    value={uploadMetadata.bookName}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, bookName: e.target.value }))}
                    placeholder="e.g., Geometry"
                  />
                </Grid>
              </Grid>
              
              <Button
                variant="contained"
                component="label"
                startIcon={uploadingPdf ? <CircularProgress size={20} /> : <CloudUpload />}
                disabled={uploadingPdf}
                fullWidth
              >
                {uploadingPdf ? 'Uploading...' : 'Upload PDF or ZIP'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.zip"
                  onChange={handleFileUpload}
                />
              </Button>
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Upload a single PDF or ZIP file containing multiple chapter PDFs
              </Typography>
            </Paper>
            
            {/* PDF List */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Current Library ({pdfs.length} PDFs)
              </Typography>
              <IconButton onClick={loadLibrary} disabled={loadingLibrary}>
                <Refresh />
              </IconButton>
            </Box>
            
            {loadingLibrary ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : pdfs.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography color="text.secondary">
                  No PDFs in library. Upload PDFs to get started.
                </Typography>
              </Paper>
            ) : (
              <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {pdfs.map(pdf => (
                  <ListItem
                    key={pdf.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleDeletePdf(pdf.id, pdf.name)}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={pdf.name}
                      secondary={
                        <Box component="span">
                          {pdf.subject && <Chip label={pdf.subject} size="small" sx={{ mr: 0.5 }} />}
                          {pdf.class && <Chip label={`Class ${pdf.class}`} size="small" sx={{ mr: 0.5 }} />}
                          {pdf.collection && <Chip label={pdf.collection} size="small" sx={{ mr: 0.5 }} />}
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {pdf.totalPages || 0} pages • {((pdf.size || 0) / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Tab Visibility */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight={600}>
              📑 Tab Visibility
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(config.tabs).map(([key, tab]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tab.enabled}
                          onChange={(e) => updateTabEnabled(key, e.target.checked)}
                        />
                      }
                      label={tab.label}
                    />
                    {tab.autoDisableForEnglish && (
                      <Chip label="Auto-disable for English" size="small" sx={{ mt: 1 }} />
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Feature Toggles */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight={600}>
              ⚙️ Feature Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(config.features).map(([key, enabled]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enabled}
                          onChange={(e) => updateFeature(key, e.target.checked)}
                        />
                      }
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* AI Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight={600}>
              🤖 AI Configuration
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Default Provider
              </Typography>
              <TextField
                select
                fullWidth
                value={config.ai.defaultProvider}
                onChange={(e) => updateAISetting('defaultProvider', e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="groq">Groq (Fast)</option>
                <option value="gemini">Gemini (Balanced)</option>
                <option value="perplexity">Perplexity (Research)</option>
                <option value="mistral">Mistral (Privacy)</option>
              </TextField>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Temperature: {config.ai.temperature}
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={config.ai.temperature}
                onChange={(e) => updateAISetting('temperature', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            </Box>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Max Tokens (per feature)
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(config.ai.maxTokens).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
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
          </AccordionDetails>
        </Accordion>

        {/* Prompts */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight={600}>
              📝 AI Prompts (Advanced)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {Object.entries(config.prompts).map(([key, prompt]) => (
              <Box key={key} sx={{ mb: 3 }}>
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
                />
                <TextField
                  label="Instructions"
                  fullWidth
                  multiline
                  rows={3}
                  value={prompt.instructions}
                  onChange={(e) => updatePrompt(key, 'instructions', e.target.value)}
                />
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Export/Import Config */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight={600}>
              💾 Export / Import
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
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
          </AccordionDetails>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

export default AdminDashboard;

