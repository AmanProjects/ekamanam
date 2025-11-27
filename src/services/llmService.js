/**
 * 🤖 Multi-LLM Provider Manager for Ekamanam
 * 
 * Supports multiple LLM providers with automatic fallback:
 * - Google Gemini (primary)
 * - Groq (fast, generous free tier)
 * - Perplexity (web-connected research)
 * - Mistral (open-source option)
 */

// ===== PROVIDER DEFINITIONS =====
export const PROVIDERS = {
  GEMINI: 'gemini',
  GROQ: 'groq',
  PERPLEXITY: 'perplexity',
  MISTRAL: 'mistral'
};

const PROVIDER_ENDPOINTS = {
  [PROVIDERS.GEMINI]: 'https://generativelanguage.googleapis.com/v1beta/models/',
  [PROVIDERS.GROQ]: 'https://api.groq.com/openai/v1/chat/completions',
  [PROVIDERS.PERPLEXITY]: 'https://api.perplexity.ai/chat/completions',
  [PROVIDERS.MISTRAL]: 'https://api.mistral.ai/v1/chat/completions'
};

// Feature-to-Provider mapping (with fallbacks)
// OPTIMIZED: Groq first for speed (300+ tokens/s vs 40-60 for Gemini)
const FEATURE_PROVIDERS = {
  teacherMode: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Groq first for speed
  explain: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Groq first for speed
  activities: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Groq first for speed
  resources: [PROVIDERS.PERPLEXITY, PROVIDERS.GROQ, PROVIDERS.GEMINI], // Perplexity for web search
  wordAnalysis: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Groq first for speed
  general: [PROVIDERS.GROQ, PROVIDERS.GEMINI] // Groq first for speed
};

// ===== MAIN API CALL FUNCTION =====
export async function callLLM(prompt, config = {}) {
  const {
    feature = 'general',
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt = null,
    preferredProvider = null // Allow manual override
  } = config;

  // Get provider list for this feature
  let providers = preferredProvider 
    ? [preferredProvider, ...(FEATURE_PROVIDERS[feature] || [PROVIDERS.GEMINI])]
    : (FEATURE_PROVIDERS[feature] || [PROVIDERS.GEMINI]);
  
  // Remove duplicates
  providers = [...new Set(providers)];
  
  // Try each provider in order (with fallback)
  let lastError = null;
  
  for (let i = 0; i < providers.length; i++) {
    try {
      const provider = providers[i];
      console.log(`🤖 [${feature}] Trying ${provider}...`);
      
      const startTime = Date.now();
      const response = await callProvider(provider, prompt, {
        temperature,
        maxTokens,
        systemPrompt
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ [${feature}] ${provider} succeeded in ${duration}ms`);
      
      // Track usage
      trackUsage(provider, feature, maxTokens, duration);
      
      return response;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ [${feature}] ${providers[i]} failed:`, error.message);
      
      // If last provider, throw error
      if (i === providers.length - 1) {
        throw new Error(`All providers failed for ${feature}: ${error.message}`);
      }
      
      // Otherwise, continue to next provider
      console.log(`🔄 [${feature}] Falling back to ${providers[i + 1]}...`);
    }
  }
  
  throw lastError || new Error(`No providers available for ${feature}`);
}

// ===== PROVIDER ROUTER =====
async function callProvider(provider, prompt, config) {
  const apiKey = getApiKey(provider);
  
  if (!apiKey) {
    throw new Error(`No API key configured for ${provider}. Please add it in Settings.`);
  }
  
  switch (provider) {
    case PROVIDERS.GEMINI:
      return callGemini(prompt, apiKey, config);
    case PROVIDERS.GROQ:
      return callGroq(prompt, apiKey, config);
    case PROVIDERS.PERPLEXITY:
      return callPerplexity(prompt, apiKey, config);
    case PROVIDERS.MISTRAL:
      return callMistral(prompt, apiKey, config);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ===== API KEY MANAGEMENT =====
function getApiKey(provider) {
  const keyMap = {
    [PROVIDERS.GEMINI]: 'gemini_pat',
    [PROVIDERS.GROQ]: 'groq_api_key',
    [PROVIDERS.PERPLEXITY]: 'perplexity_api_key',
    [PROVIDERS.MISTRAL]: 'mistral_api_key'
  };
  
  return localStorage.getItem(keyMap[provider]) || null;
}

export function setApiKey(provider, key) {
  const keyMap = {
    [PROVIDERS.GEMINI]: 'gemini_pat',
    [PROVIDERS.GROQ]: 'groq_api_key',
    [PROVIDERS.PERPLEXITY]: 'perplexity_api_key',
    [PROVIDERS.MISTRAL]: 'mistral_api_key'
  };
  
  if (key && key.trim()) {
    localStorage.setItem(keyMap[provider], key.trim());
  } else {
    localStorage.removeItem(keyMap[provider]);
  }
}

export function hasApiKey(provider) {
  return !!getApiKey(provider);
}

export function getAvailableProviders() {
  return Object.values(PROVIDERS).filter(provider => hasApiKey(provider));
}

// ===== PROVIDER IMPLEMENTATIONS =====

/**
 * Google Gemini API
 */
async function callGemini(prompt, apiKey, config) {
  const model = 'gemini-2.5-flash';
  const url = `${PROVIDER_ENDPOINTS[PROVIDERS.GEMINI]}${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API failed');
  }
  
  const data = await response.json();
  
  // Validate response
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('Invalid response from Gemini');
  }
  
  const candidate = data.candidates[0];
  
  // Check for safety blocks
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Content blocked by safety filters');
  }
  
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn('⚠️ Gemini response truncated due to token limit');
    throw new Error('Response truncated - increase maxOutputTokens');
  }
  
  return candidate.content.parts[0].text;
}

/**
 * Groq API (OpenAI-compatible, ultra-fast)
 */
async function callGroq(prompt, apiKey, config) {
  const model = 'llama-3.1-70b-versatile'; // Fast & powerful
  // Alternative: 'mixtral-8x7b-32768' for longer context
  
  const messages = [
    ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
    { role: 'user', content: prompt }
  ];
  
  const response = await fetch(PROVIDER_ENDPOINTS[PROVIDERS.GROQ], {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Groq API failed (${response.status})`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from Groq');
  }
  
  return data.choices[0].message.content;
}

/**
 * Perplexity API (Web-connected, with citations)
 */
async function callPerplexity(prompt, apiKey, config) {
  const model = 'llama-3.1-sonar-large-128k-online'; // Web-connected
  
  const messages = [
    { 
      role: 'system', 
      content: config.systemPrompt || 'You are a helpful educational assistant with access to the web. Provide citations when possible.'
    },
    { role: 'user', content: prompt }
  ];
  
  const response = await fetch(PROVIDER_ENDPOINTS[PROVIDERS.PERPLEXITY], {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      search_recency_filter: 'month', // Use recent web data
      return_citations: true
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Perplexity API failed (${response.status})`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from Perplexity');
  }
  
  // Perplexity includes citations in the response
  return data.choices[0].message.content;
}

/**
 * Mistral API
 */
async function callMistral(prompt, apiKey, config) {
  const model = 'mistral-large-latest';
  
  const messages = [
    ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
    { role: 'user', content: prompt }
  ];
  
  const response = await fetch(PROVIDER_ENDPOINTS[PROVIDERS.MISTRAL], {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Mistral API failed (${response.status})`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from Mistral');
  }
  
  return data.choices[0].message.content;
}

// ===== USAGE TRACKING =====
function trackUsage(provider, feature, tokens, duration) {
  try {
    const stats = JSON.parse(localStorage.getItem('llm_usage') || '{}');
    
    if (!stats[provider]) {
      stats[provider] = { requests: 0, tokens: 0, totalDuration: 0, features: {} };
    }
    
    stats[provider].requests++;
    stats[provider].tokens += tokens;
    stats[provider].totalDuration += duration;
    
    if (!stats[provider].features[feature]) {
      stats[provider].features[feature] = 0;
    }
    stats[provider].features[feature]++;
    
    localStorage.setItem('llm_usage', JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

export function getUsageStats() {
  try {
    return JSON.parse(localStorage.getItem('llm_usage') || '{}');
  } catch {
    return {};
  }
}

export function clearUsageStats() {
  localStorage.removeItem('llm_usage');
}

// ===== PROVIDER INFO =====
export const PROVIDER_INFO = {
  [PROVIDERS.GEMINI]: {
    name: 'Google Gemini',
    description: 'Fast, multilingual, generous free tier',
    freeLimit: '1,500 requests/day',
    signupUrl: 'https://makersuite.google.com/app/apikey',
    status: 'recommended',
    badge: '⭐ Primary'
  },
  [PROVIDERS.GROQ]: {
    name: 'Groq',
    description: 'Ultra-fast inference, excellent free tier',
    freeLimit: '14,400 requests/day',
    signupUrl: 'https://console.groq.com/keys',
    status: 'recommended',
    badge: '⚡ Fastest'
  },
  [PROVIDERS.PERPLEXITY]: {
    name: 'Perplexity AI',
    description: 'Web-connected with citations',
    freeLimit: '5 searches/day (limited)',
    signupUrl: 'https://www.perplexity.ai/settings/api',
    status: 'optional',
    badge: '🔍 Research'
  },
  [PROVIDERS.MISTRAL]: {
    name: 'Mistral AI',
    description: 'Open-source, privacy-focused',
    freeLimit: 'Via Hugging Face (unlimited)',
    signupUrl: 'https://console.mistral.ai/',
    status: 'optional',
    badge: '🔓 Open'
  }
};

export default {
  callLLM,
  setApiKey,
  hasApiKey,
  getAvailableProviders,
  getUsageStats,
  clearUsageStats,
  PROVIDERS,
  PROVIDER_INFO
};

