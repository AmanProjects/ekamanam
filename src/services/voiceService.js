// Voice Preference Service
// Manages text-to-speech voice selection across the application
// Enhanced with natural-sounding Indian voices

// v10.1.1: Cache for loaded voices
let cachedVoices = [];
let voicesLoaded = false;

// v10.1.1: Initialize voices asynchronously
const initVoices = () => {
  return new Promise((resolve) => {
    const loadVoices = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      if (cachedVoices.length > 0) {
        voicesLoaded = true;
        console.log(`🔊 Loaded ${cachedVoices.length} voices`);
        resolve(cachedVoices);
      }
    };
    
    // Try immediately
    loadVoices();
    
    // Also listen for voiceschanged event (Chrome/Edge need this)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    }
    
    // Fallback timeout
    setTimeout(() => {
      if (!voicesLoaded) {
        loadVoices();
        resolve(cachedVoices);
      }
    }, 500);
  });
};

// Initialize on module load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  initVoices();
}

export const VOICE_OPTIONS = {
  INDIAN_ENGLISH_FEMALE: 'indian_english_female',
  INDIAN_ENGLISH_MALE: 'indian_english_male',
  INDIAN_HINDI_FEMALE: 'indian_hindi_female',
  INDIAN_HINDI_MALE: 'indian_hindi_male',
  INDIAN_TELUGU_FEMALE: 'indian_telugu_female',
  INDIAN_TAMIL_FEMALE: 'indian_tamil_female',
};

export const VOICE_LABELS = {
  [VOICE_OPTIONS.INDIAN_ENGLISH_FEMALE]: '🇮🇳 Indian English (Female)',
  [VOICE_OPTIONS.INDIAN_ENGLISH_MALE]: '🇮🇳 Indian English (Male)',
  [VOICE_OPTIONS.INDIAN_HINDI_FEMALE]: '🇮🇳 Hindi (Female)',
  [VOICE_OPTIONS.INDIAN_HINDI_MALE]: '🇮🇳 Hindi (Male)',
  [VOICE_OPTIONS.INDIAN_TELUGU_FEMALE]: '🇮🇳 Telugu (Female)',
  [VOICE_OPTIONS.INDIAN_TAMIL_FEMALE]: '🇮🇳 Tamil (Female)',
};

// Voice name patterns for better matching (for different browsers/OS)
const VOICE_PATTERNS = {
  [VOICE_OPTIONS.INDIAN_ENGLISH_FEMALE]: [
    'Veena', 'en-IN-Wavenet', 'en-IN-Standard', 'Google हिन्दी',
    'Microsoft Heera', 'Rishi', 'Neerja', 'en_IN',
    'English India', 'Indian English'
  ],
  [VOICE_OPTIONS.INDIAN_ENGLISH_MALE]: [
    'Ravi', 'en-IN-Wavenet', 'en-IN-Standard',
    'Microsoft Ravi', 'en_IN',
    'English India', 'Indian English'
  ],
  [VOICE_OPTIONS.INDIAN_HINDI_FEMALE]: [
    'hi-IN-Wavenet', 'hi-IN-Standard', 'Google हिन्दी',
    'Microsoft Swara', 'Lekha', 'Hindi',
    'hi_IN', 'hi-IN'
  ],
  [VOICE_OPTIONS.INDIAN_HINDI_MALE]: [
    'hi-IN-Wavenet', 'hi-IN-Standard',
    'Microsoft Hemant', 'Hindi',
    'hi_IN', 'hi-IN'
  ],
  [VOICE_OPTIONS.INDIAN_TELUGU_FEMALE]: [
    'te-IN', 'Telugu', 'Microsoft Shruti',
    'te-IN-Wavenet', 'te-IN-Standard'
  ],
  [VOICE_OPTIONS.INDIAN_TAMIL_FEMALE]: [
    'ta-IN', 'Tamil', 'Microsoft Valluvar',
    'ta-IN-Wavenet', 'ta-IN-Standard'
  ],
};

// Get user's voice preference
export const getVoicePreference = () => {
  const saved = localStorage.getItem('voice_preference');
  return saved || VOICE_OPTIONS.INDIAN_ENGLISH_FEMALE; // Default to Indian English Female
};

// Save user's voice preference
export const saveVoicePreference = (voiceOption) => {
  localStorage.setItem('voice_preference', voiceOption);
  console.log(`🔊 Voice preference saved: ${VOICE_LABELS[voiceOption]}`);
};

// v7.2.8: Enhanced voice quality indicators
// These keywords indicate higher-quality, more natural-sounding voices
const PREMIUM_VOICE_INDICATORS = [
  'Enhanced', 'Premium', 'Neural', 'Natural', 'Wavenet', 
  'Google', 'Microsoft', 'Samantha', 'Karen', 'Moira', 
  'Fiona', 'Daniel', 'Alex', 'Siri'
];

// Check if a voice is likely high-quality/natural sounding
const isHighQualityVoice = (voice) => {
  const name = voice.name.toLowerCase();
  return PREMIUM_VOICE_INDICATORS.some(indicator => 
    name.includes(indicator.toLowerCase())
  ) || voice.localService === false; // Cloud voices are often higher quality
};

// Get the best matching voice from browser
export const getBestVoice = (languageCode = 'en-IN', voicePreference = null) => {
  // v10.1.1: Use cached voices or fetch fresh
  let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  
  // Update cache if we got voices
  if (voices.length > 0 && cachedVoices.length === 0) {
    cachedVoices = voices;
    voicesLoaded = true;
  }
  
  if (voices.length === 0) {
    console.warn('⚠️ No voices available yet. Triggering voice load...');
    // Trigger voice loading
    window.speechSynthesis.getVoices();
    return null;
  }

  const pref = voicePreference || getVoicePreference();
  const patterns = VOICE_PATTERNS[pref] || [];

  console.log(`🔍 Looking for voice preference: ${VOICE_LABELS[pref]}`);
  console.log(`📋 Available voices:`, voices.map(v => `${v.name} (${v.lang}) [${isHighQualityVoice(v) ? 'HQ' : 'std'}]`));

  // v7.2.8: Priority 1 - Find premium/enhanced voices matching language
  const langCode = languageCode.split('-')[0]; // 'en' from 'en-IN'
  const premiumVoices = voices.filter(v => 
    v.lang.startsWith(langCode) && isHighQualityVoice(v)
  );
  
  if (premiumVoices.length > 0) {
    // Prefer female voices for children's content (more soothing)
    const femaleVoice = premiumVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      ['samantha', 'karen', 'moira', 'fiona', 'veena', 'neerja', 'zira', 'hazel'].some(n => 
        v.name.toLowerCase().includes(n)
      )
    );
    const selected = femaleVoice || premiumVoices[0];
    console.log(`✅ Found premium voice: ${selected.name} (${selected.lang})`);
    return selected;
  }

  // Try to find best match using patterns
  for (const pattern of patterns) {
    const match = voices.find(v => 
      v.name.includes(pattern) || 
      v.lang.includes(pattern.replace('-', '_'))
    );
    if (match) {
      console.log(`✅ Found matching voice: ${match.name} (${match.lang})`);
      return match;
    }
  }

  // Fallback 1: Try language code matching, prefer high quality
  let fallback;
  const langVoices = voices.filter(v => v.lang.startsWith(langCode));
  if (langVoices.length > 0) {
    // Sort by quality (high quality first)
    langVoices.sort((a, b) => isHighQualityVoice(b) - isHighQualityVoice(a));
    fallback = langVoices[0];
  }
  
  if (!fallback) {
    if (pref.includes('english')) {
      fallback = voices.find(v => v.lang.startsWith('en-IN')) || voices.find(v => v.lang.startsWith('en'));
    } else if (pref.includes('hindi')) {
      fallback = voices.find(v => v.lang.startsWith('hi-IN') || v.lang.startsWith('hi'));
    } else if (pref.includes('telugu')) {
      fallback = voices.find(v => v.lang.startsWith('te-IN') || v.lang.startsWith('te'));
    } else if (pref.includes('tamil')) {
      fallback = voices.find(v => v.lang.startsWith('ta-IN') || v.lang.startsWith('ta'));
    }
  }

  if (fallback) {
    console.log(`⚠️ Using fallback voice: ${fallback.name} (${fallback.lang})`);
    return fallback;
  }

  // Fallback 2: Use provided language code
  fallback = voices.find(v => v.lang.startsWith(languageCode));
  if (fallback) {
    console.log(`⚠️ Using language fallback: ${fallback.name} (${fallback.lang})`);
    return fallback;
  }

  // Fallback 3: First available high-quality voice, or just the first voice
  const anyPremium = voices.find(v => isHighQualityVoice(v));
  if (anyPremium) {
    console.log(`⚠️ Using any premium voice: ${anyPremium.name}`);
    return anyPremium;
  }
  
  console.warn(`⚠️ No suitable voice found, using first available: ${voices[0].name}`);
  return voices[0];
};

// v7.2.8: Get the most natural-sounding voice for singing/reciting
export const getNaturalVoice = (languageCode = 'en-US') => {
  // v10.1.1: Use cached voices
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  
  const langCode = languageCode.split('-')[0];
  
  // For singing/reciting, prefer these specific natural-sounding voices
  const preferredNames = [
    // macOS/iOS premium voices
    'Samantha (Enhanced)', 'Samantha', 'Karen (Enhanced)', 'Karen',
    'Moira (Enhanced)', 'Moira', 'Fiona (Enhanced)', 'Fiona',
    // Windows premium voices
    'Microsoft Zira', 'Microsoft Hazel', 'Microsoft Susan',
    // Google voices
    'Google US English', 'Google UK English Female',
    // Indian voices
    'Veena', 'Lekha', 'Neerja'
  ];
  
  // Find preferred voice matching language
  for (const prefName of preferredNames) {
    const voice = voices.find(v => 
      v.name.includes(prefName) && v.lang.startsWith(langCode)
    );
    if (voice) {
      console.log(`🎵 Found natural voice for singing: ${voice.name}`);
      return voice;
    }
  }
  
  // Fall back to any premium voice
  return getBestVoice(languageCode);
};

// Get available voices for testing
export const getAvailableVoices = () => {
  return cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
};

// v10.1.1: Chrome bug workaround - speech synthesis can get stuck
// This function ensures speech synthesis is reset before each use
export const resetSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    // Chrome workaround: pause and resume to unstick
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }
};

// v10.1.1: Ensure voices are loaded (call this before speaking)
export const ensureVoicesLoaded = async () => {
  if (voicesLoaded && cachedVoices.length > 0) {
    return cachedVoices;
  }
  return initVoices();
};

// Test voice by speaking sample text
export const testVoice = (voiceOption, text = "Hello! This is how I sound.") => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestVoice('en-US', voiceOption);
  
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    console.log(`🔊 Testing voice: ${voice.name}`);
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('No suitable voice found');
  }
};

export default {
  VOICE_OPTIONS,
  VOICE_LABELS,
  getVoicePreference,
  saveVoicePreference,
  getBestVoice,
  getNaturalVoice,
  getAvailableVoices,
  testVoice,
  resetSpeechSynthesis,
  ensureVoicesLoaded
};

