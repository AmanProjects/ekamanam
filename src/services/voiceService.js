// Voice Preference Service
// Manages text-to-speech voice selection across the application
// Enhanced with natural-sounding Indian voices

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

// Get the best matching voice from browser
export const getBestVoice = (languageCode = 'en-IN', voicePreference = null) => {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    console.warn('⚠️ No voices available yet. Browser might still be loading voices.');
    return null;
  }

  const pref = voicePreference || getVoicePreference();
  const patterns = VOICE_PATTERNS[pref] || [];

  console.log(`🔍 Looking for voice preference: ${VOICE_LABELS[pref]}`);
  console.log(`📋 Available voices:`, voices.map(v => `${v.name} (${v.lang})`));

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

  // Fallback 1: Try language code matching
  let fallback;
  if (pref.includes('english')) {
    fallback = voices.find(v => v.lang.startsWith('en-IN')) || voices.find(v => v.lang.startsWith('en'));
  } else if (pref.includes('hindi')) {
    fallback = voices.find(v => v.lang.startsWith('hi-IN') || v.lang.startsWith('hi'));
  } else if (pref.includes('telugu')) {
    fallback = voices.find(v => v.lang.startsWith('te-IN') || v.lang.startsWith('te'));
  } else if (pref.includes('tamil')) {
    fallback = voices.find(v => v.lang.startsWith('ta-IN') || v.lang.startsWith('ta'));
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

  // Fallback 3: First available voice
  console.warn(`⚠️ No suitable voice found, using first available: ${voices[0].name}`);
  return voices[0];
};

// Get available voices for testing
export const getAvailableVoices = () => {
  return window.speechSynthesis.getVoices();
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
  getAvailableVoices,
  testVoice
};

