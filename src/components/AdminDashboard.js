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
  Grid
} from '@mui/material';
import {
  ExpandMore,
  Settings as SettingsIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

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
  }, []);

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

  if (!open) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </Box>
        </Box>

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuration saved successfully! Refresh the page to apply changes.
          </Alert>
        )}

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
      </Paper>
    </Box>
  );
}

export default AdminDashboard;

