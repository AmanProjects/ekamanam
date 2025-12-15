/**
 * 🤖 Multi-LLM Provider Manager for Ekamanam
 *
 * Supports multiple LLM providers with automatic fallback:
 * - Google Gemini (primary)
 * - Groq (fast, generous free tier)
 * - Perplexity (web-connected research)
 * - Mistral (open-source option)
 *
 * v7.1.0: Intelligent AI caching via Google Drive
 * - Caches responses per PDF page to avoid redundant API calls
 * - Similarity matching finds related cached queries
 * - Significant cost savings and faster responses
 */

import {
  hasDrivePermissions,
  getPageCache,
  saveToCache,
  findSimilarQuery
} from './aiCacheService';

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

// Helper: Detect if text contains regional Indian languages (Unicode detection)
const hasRegionalLanguage = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Check for Indian regional language Unicode ranges
  const hasDevanagari = /[\u0900-\u097F]/.test(text); // Hindi, Sanskrit, Marathi
  const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
  const hasTamil = /[\u0B80-\u0BFF]/.test(text);
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
  const hasGurmukhi = /[\u0A00-\u0A7F]/.test(text); // Punjabi
  const hasOriya = /[\u0B00-\u0B7F]/.test(text); // Odia
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(text);
  const hasKannada = /[\u0C80-\u0CFF]/.test(text);
  
  return hasDevanagari || hasTelugu || hasTamil || hasBengali || hasGujarati || 
         hasGurmukhi || hasOriya || hasMalayalam || hasKannada;
};

// Feature-to-Provider mapping (with fallbacks)
// V3.0.3: For REGIONAL LANGUAGES (Telugu/Hindi/Tamil), Gemini is PRIORITIZED
//         (better Unicode support, better multilingual understanding)
// V3.0.3: For ENGLISH content, Groq is prioritized (10x faster, 90% cheaper)
// The callLLM function will auto-detect language and swap order
const FEATURE_PROVIDERS = {
  teacherMode: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  explain: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  activities: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  resources: [PROVIDERS.PERPLEXITY, PROVIDERS.GROQ, PROVIDERS.GEMINI], // Perplexity first
  wordAnalysis: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  examPrep: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  longAnswer: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  quizEvaluation: [PROVIDERS.GROQ, PROVIDERS.GEMINI], // Swapped for regional languages
  general: [PROVIDERS.GROQ, PROVIDERS.GEMINI] // Swapped for regional languages
};

// ===== MAIN API CALL FUNCTION =====
export async function callLLM(prompt, config = {}) {
  const {
    feature = 'general',
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt = null,
    preferredProvider = null, // Allow manual override
    // v7.1.0: Cache parameters
    pdfId = null,
    pdfName = null,
    page = null,
    pageContent = null,
    context = null, // Selected text
    skipCache = false // Force fresh API call
  } = config;

  // v7.1.0: Check cache first (if Drive connected and cache params provided)
  if (!skipCache && pdfId && page && hasDrivePermissions()) {
    try {
      console.log(`💾 [${feature}] Checking cache for PDF ${pdfId}, page ${page}...`);
      const cachedData = await getPageCache(pdfId, page);

      if (cachedData && cachedData.queries.length > 0) {
        // Look for similar query in cache
        const similarQuery = findSimilarQuery(
          cachedData.queries,
          prompt,
          context || '',
          0.7 // 70% similarity threshold
        );

        if (similarQuery) {
          console.log(`✅ [${feature}] Cache HIT! Using cached response (${Math.round(similarQuery.similarity * 100)}% match)`);
          return {
            response: similarQuery.response,
            fromCache: true,
            cacheMatch: similarQuery.similarity,
            tokensUsed: 0 // No API call
          };
        } else {
          console.log(`ℹ️ [${feature}] Cache MISS - no similar query found`);
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache check failed (continuing with API call):', cacheError);
      // Continue to API call
    }
  }

  // Get provider list for this feature
  let providers = preferredProvider
    ? [preferredProvider, ...(FEATURE_PROVIDERS[feature] || [PROVIDERS.GEMINI])]
    : (FEATURE_PROVIDERS[feature] || [PROVIDERS.GEMINI]);

  // V3.0.3: AUTO-DETECT REGIONAL LANGUAGES → PRIORITIZE GEMINI
  // Check if prompt contains Telugu/Hindi/Tamil/etc Unicode characters
  if (!preferredProvider && hasRegionalLanguage(prompt)) {
    // Swap provider order: Gemini first for regional languages
    const hasGroq = providers.includes(PROVIDERS.GROQ);
    const hasGemini = providers.includes(PROVIDERS.GEMINI);

    if (hasGroq && hasGemini) {
      // Swap: put Gemini before Groq
      providers = providers.filter(p => p !== PROVIDERS.GROQ && p !== PROVIDERS.GEMINI);
      providers.unshift(PROVIDERS.GEMINI, PROVIDERS.GROQ); // Gemini first!
      console.log(`🌐 [${feature}] Regional language detected → Using Gemini first`);
    }
  }

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

      // v7.1.0: Save to cache (if Drive connected and cache params provided)
      if (pdfId && page && pageContent && hasDrivePermissions()) {
        try {
          await saveToCache(
            pdfId,
            pdfName || 'Unknown PDF',
            page,
            pageContent,
            {
              question: prompt,
              mode: feature,
              context: context || '',
              response: typeof response === 'string' ? response : response.response,
              tokensUsed: maxTokens
            }
          );
          console.log(`💾 [${feature}] Response cached for future use`);
        } catch (cacheError) {
          console.warn('⚠️ Failed to save to cache:', cacheError);
          // Don't throw - API call succeeded
        }
      }

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
  
  // Extract text from parts (handle single or multiple parts)
  const parts = candidate.content.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No text in Gemini response');
  }
  
  // If multiple parts, join them
  if (parts.length > 1) {
    return parts.map(part => part.text || '').join('\n');
  }
  
  return parts[0].text || '';
}

/**
 * Groq API (OpenAI-compatible, ultra-fast)
 * V3.0.1: Updated to current supported model
 */
async function callGroq(prompt, apiKey, config) {
  const model = 'llama-3.3-70b-versatile'; // V3.0.1: Updated (llama-3.1 decommissioned)
  // Alternative models: 'mixtral-8x7b-32768' for longer context, 'llama-3.1-8b-instant' for speed
  
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

