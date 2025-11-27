# 🤖 Multi-LLM Integration Guide for Ekamanam

## 📊 FREE & EDUCATIONAL LLM OPTIONS (November 2024)

### ✅ **Tier 1: Generous Free Tiers (Recommended)**

#### 1. **Google Gemini** (Current) ⭐
- **Free Tier**: 1,500 requests/day (Flash), 15 requests/minute
- **Educational**: No specific program, but free tier is generous
- **Models**: Gemini 2.5 Flash, Gemini 1.5 Pro
- **Best For**: General education, multilingual, fast responses
- **Cost**: FREE up to limit, then $0.35/1M tokens
- **Status**: ✅ CURRENTLY INTEGRATED

#### 2. **Groq** ⚡ (FASTEST)
- **Free Tier**: 14,400 requests/day, 30 requests/minute
- **Educational**: No specific program, but free tier is excellent
- **Models**: Llama 3.1 70B, Mixtral 8x7B, Gemma 7B
- **Best For**: Real-time responses (ultra-fast), chat
- **Cost**: FREE up to limit
- **Speed**: 300+ tokens/second (vs. 40-60 for others)
- **Status**: 🔥 HIGHLY RECOMMENDED

#### 3. **Perplexity AI** 🔍
- **Free Tier**: 5 searches/day (limited)
- **Educational**: Request access to education program
- **Models**: pplx-7b-online, pplx-70b-online
- **Best For**: Web-connected research, citations, additional resources
- **Cost**: $20/month for 600 queries (paid)
- **Status**: ⚠️ LIMITED FREE TIER

#### 4. **Anthropic Claude** (via Poe/API)
- **Free Tier**: Limited (via Poe: 10 messages/day)
- **Educational**: Must apply for education credits
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus
- **Best For**: Long-context tasks, reasoning, safety
- **Cost**: $3-$15 per 1M tokens (paid)
- **Status**: ⚠️ PAID OPTION

#### 5. **Mistral AI**
- **Free Tier**: Via Hugging Face or local deployment
- **Educational**: Open-source models (free)
- **Models**: Mistral 7B, Mixtral 8x7B
- **Best For**: Privacy-focused, can run locally
- **Cost**: FREE (open-source), or $0.25/1M tokens (API)
- **Status**: ✅ OPEN-SOURCE OPTION

#### 6. **Cohere**
- **Free Tier**: 100 API calls/month (very limited)
- **Educational**: Must apply for education credits
- **Models**: Command, Command-Light, Embed
- **Best For**: Embeddings, classification
- **Cost**: FREE trial, then $0.40-$2/1M tokens
- **Status**: ⚠️ LIMITED FREE TIER

---

## 🎓 EDUCATIONAL PROGRAMS & GRANTS

### 1. **Google for Education**
- **Gemini**: No specific program yet, but generous free tier
- **Workspace**: Education discounts available
- **Contact**: [Google Education](https://edu.google.com/)

### 2. **Anthropic Education Program**
- **Claude**: Apply for education credits
- **Requirements**: Valid .edu email, educational use case
- **Application**: [Anthropic Education](https://www.anthropic.com/education)

### 3. **OpenAI Education Credits**
- **GPT-4**: $100-$500 credits for educators
- **Requirements**: Valid .edu email, detailed proposal
- **Application**: [OpenAI Educator Access](https://openai.com/educators)

### 4. **Microsoft Azure for Students**
- **Azure OpenAI**: $100 free credits for students
- **Requirements**: Student verification
- **Application**: [Azure for Students](https://azure.microsoft.com/en-us/free/students/)

### 5. **Hugging Face Education**
- **Free Tier**: Unlimited access to open-source models
- **Pro Account**: $9/month for students (70% off)
- **Models**: 100,000+ open-source models
- **Application**: [Hugging Face](https://huggingface.co/pricing)

---

## 🏗️ RECOMMENDED ARCHITECTURE FOR EKAMANAM

### **Multi-LLM Strategy:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        EKAMANAM APP                             │
├─────────────────────────────────────────────────────────────────┤
│                    LLM Provider Manager                         │
│                   (src/services/llmService.js)                  │
├─────────────────────────────────────────────────────────────────┤
│  Primary     │  Fallback   │  Specialized │  Research          │
├──────────────┼─────────────┼──────────────┼────────────────────┤
│  Gemini      │  Groq       │  Perplexity  │  Mistral           │
│  Flash       │  Llama 3.1  │  (Web)       │  (Local)           │
│              │             │              │                    │
│  General     │  Speed      │  Citations   │  Privacy           │
│  Education   │  Backup     │  Resources   │  Offline           │
└──────────────┴─────────────┴──────────────┴────────────────────┘
```

### **Use Case Allocation:**

| Feature | Primary LLM | Fallback | Reason |
|---------|------------|----------|--------|
| Teacher Mode | Gemini Flash | Groq Llama | Long context, multilingual |
| Explain Tab | Gemini Flash | Groq Llama | Detailed explanations |
| Activities | Gemini Flash | Groq Llama | Creative content |
| Word Analysis | Gemini Flash | Groq Llama | Language processing |
| Additional Resources | **Perplexity** | Gemini | Web search, citations |
| Practice Tests | Groq Llama | Gemini | Speed for real-time |
| Notes Summary | Groq Llama | Gemini | Fast processing |

---

## 💰 COST COMPARISON (1000 Students, 10 queries/day)

### **Monthly Usage:**
- 1000 students × 10 queries × 30 days = **300,000 queries/month**
- Average: 2000 tokens input + 1000 tokens output per query

### **Cost Breakdown:**

| Provider | Free Tier | Paid Cost (if exceeded) | Monthly Estimate |
|----------|-----------|------------------------|------------------|
| **Gemini** | 45,000/month | $0.35/1M tokens | **$315/month** |
| **Groq** | 432,000/month | FREE | **$0** ✅ |
| **Perplexity** | 150/month | $20/month/student | **$20,000** ❌ |
| **OpenAI GPT-4** | 0 | $30/1M tokens | **$2,700/month** |
| **Claude** | 300/month | $3/1M tokens | **$810/month** |
| **Mistral** | Unlimited (OSS) | $0.25/1M tokens | **$67.5/month** |

### **Recommended Mix: $0-50/month**
- **Primary**: Groq (FREE, covers 90% of queries)
- **Fallback**: Gemini (FREE tier for remaining 10%)
- **Specialized**: Perplexity (only for "Additional Resources" tab, ~5%)
- **Total Cost**: **$0-50/month** for 1000 active students

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 1: Multi-Provider Architecture** ✅

Create a unified LLM service that abstracts providers:

**File: `src/services/llmService.js`** (NEW)

```javascript
// Multi-LLM Provider Manager
const PROVIDERS = {
  GEMINI: 'gemini',
  GROQ: 'groq',
  PERPLEXITY: 'perplexity',
  MISTRAL: 'mistral',
  OPENAI: 'openai',
  CLAUDE: 'claude'
};

const PROVIDER_ENDPOINTS = {
  [PROVIDERS.GEMINI]: 'https://generativelanguage.googleapis.com/v1beta/models/',
  [PROVIDERS.GROQ]: 'https://api.groq.com/openai/v1/chat/completions',
  [PROVIDERS.PERPLEXITY]: 'https://api.perplexity.ai/chat/completions',
  [PROVIDERS.MISTRAL]: 'https://api.mistral.ai/v1/chat/completions',
  [PROVIDERS.OPENAI]: 'https://api.openai.com/v1/chat/completions',
  [PROVIDERS.CLAUDE]: 'https://api.anthropic.com/v1/messages'
};

// Feature-to-Provider mapping
const FEATURE_PROVIDERS = {
  teacherMode: [PROVIDERS.GEMINI, PROVIDERS.GROQ],
  explain: [PROVIDERS.GEMINI, PROVIDERS.GROQ],
  activities: [PROVIDERS.GEMINI, PROVIDERS.GROQ],
  resources: [PROVIDERS.PERPLEXITY, PROVIDERS.GEMINI], // Perplexity for web search
  wordAnalysis: [PROVIDERS.GEMINI, PROVIDERS.GROQ]
};

async function callLLM(prompt, config = {}) {
  const {
    feature = 'general',
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt = null
  } = config;

  // Get provider list for this feature
  const providers = FEATURE_PROVIDERS[feature] || [PROVIDERS.GEMINI];
  
  // Try each provider in order (with fallback)
  for (let i = 0; i < providers.length; i++) {
    try {
      const provider = providers[i];
      console.log(`🤖 Trying ${provider} for ${feature}...`);
      
      const response = await callProvider(provider, prompt, {
        temperature,
        maxTokens,
        systemPrompt
      });
      
      console.log(`✅ ${provider} succeeded for ${feature}`);
      return response;
      
    } catch (error) {
      console.error(`❌ ${providers[i]} failed:`, error.message);
      
      // If last provider, throw error
      if (i === providers.length - 1) {
        throw new Error(`All providers failed for ${feature}: ${error.message}`);
      }
      
      // Otherwise, continue to next provider
      console.log(`🔄 Falling back to ${providers[i + 1]}...`);
    }
  }
}

async function callProvider(provider, prompt, config) {
  const apiKey = getApiKey(provider);
  
  if (!apiKey) {
    throw new Error(`No API key configured for ${provider}`);
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

function getApiKey(provider) {
  // Load from localStorage or environment
  const keyMap = {
    [PROVIDERS.GEMINI]: 'gemini_pat',
    [PROVIDERS.GROQ]: 'groq_api_key',
    [PROVIDERS.PERPLEXITY]: 'perplexity_api_key',
    [PROVIDERS.MISTRAL]: 'mistral_api_key',
    [PROVIDERS.OPENAI]: 'openai_api_key',
    [PROVIDERS.CLAUDE]: 'claude_api_key'
  };
  
  return localStorage.getItem(keyMap[provider]) || null;
}

// Provider-specific implementations
async function callGemini(prompt, apiKey, config) {
  // Use existing implementation
  const model = 'gemini-2.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens
        }
      })
    }
  );
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callGroq(prompt, apiKey, config) {
  const model = 'llama-3.1-70b-versatile'; // or mixtral-8x7b-32768
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Groq API failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callPerplexity(prompt, apiKey, config) {
  const model = 'llama-3.1-sonar-large-128k-online'; // Web-connected
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: config.systemPrompt || 'You are a helpful educational assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      search_recency_filter: 'month' // Use recent web data
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Perplexity API failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callMistral(prompt, apiKey, config) {
  const model = 'mistral-large-latest';
  
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Mistral API failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

export { callLLM, PROVIDERS, FEATURE_PROVIDERS };
```

---

### **Phase 2: Settings UI Update** ✅

Update `SettingsDialog.js` to support multiple API keys:

```javascript
// Add state for multiple API keys
const [providers, setProviders] = useState({
  gemini: '',
  groq: '',
  perplexity: '',
  mistral: ''
});

// UI with tabs or accordions for each provider
<Accordion>
  <AccordionSummary>
    <Typography>Google Gemini (Primary)</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <TextField
      label="Gemini API Key"
      value={providers.gemini}
      onChange={(e) => setProviders({...providers, gemini: e.target.value})}
    />
    <Link href="https://makersuite.google.com/app/apikey" target="_blank">
      Get Free Key
    </Link>
  </AccordionDetails>
</Accordion>

<Accordion>
  <AccordionSummary>
    <Typography>Groq (Fast Fallback) ⚡</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <TextField
      label="Groq API Key"
      value={providers.groq}
      onChange={(e) => setProviders({...providers, groq: e.target.value})}
    />
    <Link href="https://console.groq.com/keys" target="_blank">
      Get Free Key (14,400/day)
    </Link>
  </AccordionDetails>
</Accordion>

<Accordion>
  <AccordionSummary>
    <Typography>Perplexity (Web Research) 🔍</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <TextField
      label="Perplexity API Key"
      value={providers.perplexity}
      onChange={(e) => setProviders({...providers, perplexity: e.target.value})}
    />
    <Link href="https://www.perplexity.ai/settings/api" target="_blank">
      Get API Key
    </Link>
  </AccordionDetails>
</Accordion>
```

---

### **Phase 3: Feature Integration** ✅

Update existing functions to use the new `callLLM` service:

**Before:**
```javascript
// geminiService.js
export async function generateTeacherMode(pageText, apiKey) {
  return await callGeminiAPI(prompt, apiKey, config);
}
```

**After:**
```javascript
// llmService.js
export async function generateTeacherMode(pageText) {
  return await callLLM(prompt, {
    feature: 'teacherMode',
    temperature: 0.7,
    maxTokens: 4096
  });
}
```

---

## 📈 MONITORING & ANALYTICS

Track usage across providers:

```javascript
// src/services/analyticsService.js
const usageStats = {
  gemini: { requests: 0, tokens: 0, cost: 0 },
  groq: { requests: 0, tokens: 0, cost: 0 },
  perplexity: { requests: 0, tokens: 0, cost: 0 }
};

function trackUsage(provider, tokens) {
  usageStats[provider].requests++;
  usageStats[provider].tokens += tokens;
  usageStats[provider].cost = calculateCost(provider, tokens);
  
  // Save to localStorage or Firebase
  localStorage.setItem('llm_usage', JSON.stringify(usageStats));
}

function showUsageDashboard() {
  // Display in Settings dialog
  return usageStats;
}
```

---

## 🎯 RECOMMENDED SETUP FOR EKAMANAM

### **For Individual Students (FREE):**
1. **Gemini** (Primary): 1,500 requests/day
2. **Groq** (Backup): 14,400 requests/day
3. **Total**: ~16,000 queries/day (more than enough)
4. **Cost**: $0

### **For Classrooms (10-50 students):**
1. **Groq** (Primary): Covers all needs with speed
2. **Gemini** (Fallback): For overflow
3. **Perplexity**: Optional for research features
4. **Cost**: $0-20/month

### **For Schools (100+ students):**
1. **Groq** (Primary): Fast, free, generous limits
2. **Gemini** (Fallback): Multilingual support
3. **Perplexity** (Optional): For citations
4. **Apply for**: Education grants from Anthropic, OpenAI
5. **Cost**: $0-100/month

---

## 🚀 NEXT STEPS

1. **Immediate**: Add Groq API support (fastest, free)
2. **Short-term**: Multi-provider architecture
3. **Medium-term**: Apply for education grants
4. **Long-term**: Consider self-hosted Mistral for privacy

---

## 📞 GETTING API KEYS

### **Groq (Recommended First)**
1. Visit: https://console.groq.com/
2. Sign up (free)
3. Go to: API Keys
4. Generate key
5. **Limit**: 14,400 requests/day, 30/minute
6. **Models**: Llama 3.1 70B, Mixtral 8x7B, Gemma 7B

### **Perplexity (For Research)**
1. Visit: https://www.perplexity.ai/
2. Sign up
3. Go to: Settings → API
4. Generate key
5. **Limit**: 5 free searches/day (limited)
6. **Paid**: $20/month for 600 queries

### **Mistral (Open Source)**
1. Visit: https://console.mistral.ai/
2. Sign up
3. Get API key
4. **Free Tier**: Via Hugging Face or local deployment

---

## ⚠️ IMPORTANT NOTES

1. **Rate Limits**: Always implement retry logic and exponential backoff
2. **API Keys**: NEVER commit keys to Git, use environment variables
3. **Costs**: Monitor usage to avoid surprises
4. **Privacy**: For sensitive data, consider self-hosted options
5. **Compliance**: Check FERPA/COPPA compliance for student data

---

## 🏆 BEST PRACTICES

1. **Start Free**: Use Gemini + Groq (covers 99% of needs)
2. **Monitor Usage**: Track which provider is used most
3. **Optimize Costs**: Route expensive queries to free providers
4. **Apply for Grants**: Education programs can provide significant credits
5. **Plan for Scale**: If you reach 1000+ students, consider enterprise deals

---

**TLDR**: Use **Groq + Gemini** for free, unlimited education AI. Add **Perplexity** only if you need web-connected research. Total cost: **$0-20/month** for 1000 students.

