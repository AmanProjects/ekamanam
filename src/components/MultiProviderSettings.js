/**
 * 🔑 Multi-Provider API Key Settings Component
 * 
 * Allows users to configure multiple LLM providers with fallback support
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Link,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { 
  PROVIDERS, 
  PROVIDER_INFO, 
  setApiKey, 
  hasApiKey,
  getAvailableProviders,
  getUsageStats
} from '../services/llmService';

function MultiProviderSettings() {
  const [keys, setKeys] = useState({
    [PROVIDERS.GEMINI]: '',
    [PROVIDERS.GROQ]: '',
    [PROVIDERS.PERPLEXITY]: '',
    [PROVIDERS.MISTRAL]: ''
  });
  
  const [showKeys, setShowKeys] = useState({
    [PROVIDERS.GEMINI]: false,
    [PROVIDERS.GROQ]: false,
    [PROVIDERS.PERPLEXITY]: false,
    [PROVIDERS.MISTRAL]: false
  });
  
  const [saved, setSaved] = useState({});
  const [usageStats, setUsageStats] = useState({});

  // Load existing keys on mount
  useEffect(() => {
    const loadedKeys = {};
    Object.values(PROVIDERS).forEach(provider => {
      const keyMap = {
        [PROVIDERS.GEMINI]: 'gemini_pat',
        [PROVIDERS.GROQ]: 'groq_api_key',
        [PROVIDERS.PERPLEXITY]: 'perplexity_api_key',
        [PROVIDERS.MISTRAL]: 'mistral_api_key'
      };
      const key = localStorage.getItem(keyMap[provider]);
      if (key) {
        loadedKeys[provider] = key;
      }
    });
    setKeys(loadedKeys);
    setUsageStats(getUsageStats());
  }, []);

  const handleSaveKey = (provider) => {
    const key = keys[provider];
    if (key && key.trim()) {
      setApiKey(provider, key.trim());
      setSaved({ ...saved, [provider]: true });
      
      // Reset saved state after 2 seconds
      setTimeout(() => {
        setSaved({ ...saved, [provider]: false });
      }, 2000);
    }
  };

  const handleRemoveKey = (provider) => {
    setApiKey(provider, '');
    setKeys({ ...keys, [provider]: '' });
  };

  const toggleShowKey = (provider) => {
    setShowKeys({ ...showKeys, [provider]: !showKeys[provider] });
  };

  const availableProviders = getAvailableProviders();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🤖 AI Provider Settings
        <Tooltip title="Configure multiple AI providers for redundancy and cost optimization">
          <InfoIcon fontSize="small" color="action" />
        </Tooltip>
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Multi-Provider Setup:</strong> Configure multiple AI providers for automatic fallback.
          <br />
          ✅ <strong>{availableProviders.length}</strong> provider{availableProviders.length !== 1 ? 's' : ''} configured
          {availableProviders.length === 0 && ' - Add at least one to get started!'}
        </Typography>
      </Alert>

      {/* Gemini Provider */}
      <Accordion defaultExpanded={!hasApiKey(PROVIDERS.GEMINI)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {PROVIDER_INFO[PROVIDERS.GEMINI].name}
            </Typography>
            <Chip 
              label={PROVIDER_INFO[PROVIDERS.GEMINI].badge} 
              size="small" 
              color="primary" 
            />
            {hasApiKey(PROVIDERS.GEMINI) && (
              <Chip 
                icon={<CheckIcon />} 
                label="Active" 
                size="small" 
                color="success" 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {PROVIDER_INFO[PROVIDERS.GEMINI].description}
              <br />
              <strong>Free Tier:</strong> {PROVIDER_INFO[PROVIDERS.GEMINI].freeLimit}
            </Typography>
            
            <TextField
              fullWidth
              type={showKeys[PROVIDERS.GEMINI] ? 'text' : 'password'}
              label="Gemini API Key"
              placeholder="AIza..."
              value={keys[PROVIDERS.GEMINI] || ''}
              onChange={(e) => setKeys({ ...keys, [PROVIDERS.GEMINI]: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => toggleShowKey(PROVIDERS.GEMINI)} edge="end">
                    {showKeys[PROVIDERS.GEMINI] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleSaveKey(PROVIDERS.GEMINI)}
                disabled={!keys[PROVIDERS.GEMINI] || saved[PROVIDERS.GEMINI]}
                startIcon={saved[PROVIDERS.GEMINI] ? <CheckIcon /> : null}
              >
                {saved[PROVIDERS.GEMINI] ? 'Saved' : 'Save'}
              </Button>
              
              {hasApiKey(PROVIDERS.GEMINI) && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleRemoveKey(PROVIDERS.GEMINI)}
                >
                  Remove
                </Button>
              )}
            </Box>
            
            <Link 
              href={PROVIDER_INFO[PROVIDERS.GEMINI].signupUrl} 
              target="_blank" 
              variant="body2"
            >
              Get Free API Key →
            </Link>
            
            {usageStats[PROVIDERS.GEMINI] && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Usage:</strong> {usageStats[PROVIDERS.GEMINI].requests} requests
                  ({(usageStats[PROVIDERS.GEMINI].totalDuration / 1000).toFixed(1)}s total)
                </Typography>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Groq Provider */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {PROVIDER_INFO[PROVIDERS.GROQ].name}
            </Typography>
            <Chip 
              label={PROVIDER_INFO[PROVIDERS.GROQ].badge} 
              size="small" 
              color="warning" 
            />
            {hasApiKey(PROVIDERS.GROQ) && (
              <Chip 
                icon={<CheckIcon />} 
                label="Active" 
                size="small" 
                color="success" 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {PROVIDER_INFO[PROVIDERS.GROQ].description}
              <br />
              <strong>Free Tier:</strong> {PROVIDER_INFO[PROVIDERS.GROQ].freeLimit}
            </Typography>
            
            <TextField
              fullWidth
              type={showKeys[PROVIDERS.GROQ] ? 'text' : 'password'}
              label="Groq API Key"
              placeholder="gsk_..."
              value={keys[PROVIDERS.GROQ] || ''}
              onChange={(e) => setKeys({ ...keys, [PROVIDERS.GROQ]: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => toggleShowKey(PROVIDERS.GROQ)} edge="end">
                    {showKeys[PROVIDERS.GROQ] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleSaveKey(PROVIDERS.GROQ)}
                disabled={!keys[PROVIDERS.GROQ] || saved[PROVIDERS.GROQ]}
                startIcon={saved[PROVIDERS.GROQ] ? <CheckIcon /> : null}
              >
                {saved[PROVIDERS.GROQ] ? 'Saved' : 'Save'}
              </Button>
              
              {hasApiKey(PROVIDERS.GROQ) && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleRemoveKey(PROVIDERS.GROQ)}
                >
                  Remove
                </Button>
              )}
            </Box>
            
            <Link 
              href={PROVIDER_INFO[PROVIDERS.GROQ].signupUrl} 
              target="_blank" 
              variant="body2"
            >
              Get Free API Key (14,400/day!) →
            </Link>
            
            {usageStats[PROVIDERS.GROQ] && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Usage:</strong> {usageStats[PROVIDERS.GROQ].requests} requests
                  ({(usageStats[PROVIDERS.GROQ].totalDuration / 1000).toFixed(1)}s total)
                </Typography>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Perplexity Provider */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {PROVIDER_INFO[PROVIDERS.PERPLEXITY].name}
            </Typography>
            <Chip 
              label={PROVIDER_INFO[PROVIDERS.PERPLEXITY].badge} 
              size="small" 
              color="info" 
            />
            {hasApiKey(PROVIDERS.PERPLEXITY) && (
              <Chip 
                icon={<CheckIcon />} 
                label="Active" 
                size="small" 
                color="success" 
              />
            )}
            <Chip label="Optional" size="small" variant="outlined" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {PROVIDER_INFO[PROVIDERS.PERPLEXITY].description}
              <br />
              <strong>Free Tier:</strong> {PROVIDER_INFO[PROVIDERS.PERPLEXITY].freeLimit}
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="caption">
                Perplexity has a very limited free tier. Only configure if you need web-connected research for the "Additional Resources" feature.
              </Typography>
            </Alert>
            
            <TextField
              fullWidth
              type={showKeys[PROVIDERS.PERPLEXITY] ? 'text' : 'password'}
              label="Perplexity API Key"
              placeholder="pplx-..."
              value={keys[PROVIDERS.PERPLEXITY] || ''}
              onChange={(e) => setKeys({ ...keys, [PROVIDERS.PERPLEXITY]: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => toggleShowKey(PROVIDERS.PERPLEXITY)} edge="end">
                    {showKeys[PROVIDERS.PERPLEXITY] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleSaveKey(PROVIDERS.PERPLEXITY)}
                disabled={!keys[PROVIDERS.PERPLEXITY] || saved[PROVIDERS.PERPLEXITY]}
                startIcon={saved[PROVIDERS.PERPLEXITY] ? <CheckIcon /> : null}
              >
                {saved[PROVIDERS.PERPLEXITY] ? 'Saved' : 'Save'}
              </Button>
              
              {hasApiKey(PROVIDERS.PERPLEXITY) && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleRemoveKey(PROVIDERS.PERPLEXITY)}
                >
                  Remove
                </Button>
              )}
            </Box>
            
            <Link 
              href={PROVIDER_INFO[PROVIDERS.PERPLEXITY].signupUrl} 
              target="_blank" 
              variant="body2"
            >
              Get API Key →
            </Link>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Mistral Provider */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {PROVIDER_INFO[PROVIDERS.MISTRAL].name}
            </Typography>
            <Chip 
              label={PROVIDER_INFO[PROVIDERS.MISTRAL].badge} 
              size="small" 
              color="secondary" 
            />
            {hasApiKey(PROVIDERS.MISTRAL) && (
              <Chip 
                icon={<CheckIcon />} 
                label="Active" 
                size="small" 
                color="success" 
              />
            )}
            <Chip label="Optional" size="small" variant="outlined" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {PROVIDER_INFO[PROVIDERS.MISTRAL].description}
              <br />
              <strong>Free Tier:</strong> {PROVIDER_INFO[PROVIDERS.MISTRAL].freeLimit}
            </Typography>
            
            <TextField
              fullWidth
              type={showKeys[PROVIDERS.MISTRAL] ? 'text' : 'password'}
              label="Mistral API Key"
              placeholder="..."
              value={keys[PROVIDERS.MISTRAL] || ''}
              onChange={(e) => setKeys({ ...keys, [PROVIDERS.MISTRAL]: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => toggleShowKey(PROVIDERS.MISTRAL)} edge="end">
                    {showKeys[PROVIDERS.MISTRAL] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleSaveKey(PROVIDERS.MISTRAL)}
                disabled={!keys[PROVIDERS.MISTRAL] || saved[PROVIDERS.MISTRAL]}
                startIcon={saved[PROVIDERS.MISTRAL] ? <CheckIcon /> : null}
              >
                {saved[PROVIDERS.MISTRAL] ? 'Saved' : 'Save'}
              </Button>
              
              {hasApiKey(PROVIDERS.MISTRAL) && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleRemoveKey(PROVIDERS.MISTRAL)}
                >
                  Remove
                </Button>
              )}
            </Box>
            
            <Link 
              href={PROVIDER_INFO[PROVIDERS.MISTRAL].signupUrl} 
              target="_blank" 
              variant="body2"
            >
              Get API Key →
            </Link>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      <Alert severity="success">
        <Typography variant="body2">
          <strong>💡 Recommended Setup (100% FREE):</strong>
          <br />
          1. Add <strong>Gemini</strong> (Primary) - 1,500 requests/day
          <br />
          2. Add <strong>Groq</strong> (Fallback) - 14,400 requests/day
          <br />
          <br />
          This gives you <strong>~16,000 free queries/day</strong> with automatic fallback!
        </Typography>
      </Alert>
    </Box>
  );
}

export default MultiProviderSettings;

