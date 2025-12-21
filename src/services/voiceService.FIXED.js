// Voice Preference Service - SIMPLIFIED FIX
// V8.0.2: Restored simple, working Telugu voice support

let cachedVoices = [];
let voicesLoaded = false;

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
    
    loadVoices();
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    }
    
    setTimeout(() => {
      if (!voicesLoaded) {
        loadVoices();
        resolve(cachedVoices);
      }
    }, 500);
  });
};

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

export const getVoicePreference = () => {
  const saved = localStorage.getItem('voice_preference');
  return saved || VOICE_OPTIONS.INDIAN_ENGLISH_FEMALE;
};

export const saveVoicePreference = (voiceOption) => {
  localStorage.setItem('voice_preference', voiceOption);
  console.log(`🔊 Voice preference saved: ${VOICE_LABELS[voiceOption]}`);
};

// V8.0.2: SIMPLIFIED - Just find the best Telugu/Hindi/Tamil voice
export const getBestVoice = (languageCode = 'en-IN', voicePreference = null) => {
  let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  
  if (voices.length > 0 && cachedVoices.length === 0) {
    cachedVoices = voices;
    voicesLoaded = true;
  }
  
  if (voices.length === 0) {
    console.warn('⚠️ No voices available yet');
    window.speechSynthesis.getVoices();
    return null;
  }

  console.log(`🔍 Finding voice for: ${languageCode}`);
  const langPrefix = languageCode.split('-')[0]; // 'te' from 'te-IN'

  // Define language-specific keywords for matching
  const langKeywords = {
    'te': ['telugu', 'తెలుగు', 'shruti'],  // Microsoft Shruti is Telugu voice
    'hi': ['hindi', 'हिंदी', 'swara', 'hemant', 'lekha'],
    'ta': ['tamil', 'தமிழ்', 'valluvar'],
    'kn': ['kannada', 'ಕನ್ನಡ'],
    'ml': ['malayalam', 'മലയാളം'],
    'bn': ['bengali', 'বাংলা'],
    'mr': ['marathi', 'मराठी'],
    'en': ['english', 'ravi', 'veena', 'neerja', 'heera']
  };

  // Step 1: Try exact language code match (e.g., 'te-IN')
  let match = voices.find(v => v.lang === languageCode);
  if (match) {
    console.log(`✅ Exact match: ${match.name} (${match.lang})`);
    return match;
  }

  // Step 2: Try language prefix match (e.g., 'te' matches 'te-IN', 'te-US', etc.)
  match = voices.find(v => v.lang.startsWith(langPrefix + '-'));
  if (match) {
    console.log(`✅ Prefix match: ${match.name} (${match.lang})`);
    return match;
  }

  // Step 3: Search by voice name keywords
  const keywords = langKeywords[langPrefix] || [langPrefix];
  for (const keyword of keywords) {
    match = voices.find(v => 
      v.name.toLowerCase().includes(keyword.toLowerCase()) ||
      v.lang.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) {
      console.log(`✅ Keyword match '${keyword}': ${match.name} (${match.lang})`);
      return match;
    }
  }

  // Step 4: For English, try to find Indian English
  if (langPrefix === 'en') {
    match = voices.find(v => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india'));
    if (match) {
      console.log(`✅ Indian English: ${match.name} (${match.lang})`);
      return match;
    }
    match = voices.find(v => v.lang.startsWith('en'));
    if (match) {
      console.log(`⚠️ Generic English: ${match.name} (${match.lang})`);
      return match;
    }
  }

  // Step 5: Absolute fallback
  console.log(`⚠️ Using first available: ${voices[0].name} (${voices[0].lang})`);
  return voices[0];
};

export const getNaturalVoice = (languageCode = 'en-US') => {
  return getBestVoice(languageCode);
};

export const getAvailableVoices = () => {
  return cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
};

export const resetSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }
};

export const ensureVoicesLoaded = async () => {
  if (voicesLoaded && cachedVoices.length > 0) {
    return cachedVoices;
  }
  return initVoices();
};

export const testVoice = (voiceOption, text = "Hello! This is how I sound.") => {
  if (!('speechSynthesis' in window)) {
    return { success: false, error: 'Speech synthesis not supported' };
  }

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
    return { success: true, voice: voice.name };
  }
  return { success: false, error: 'No suitable voice found' };
};

export const runAudioDiagnostics = async () => {
  const results = {
    speechSynthesisSupported: false,
    voicesAvailable: 0,
    voicesList: [],
    testResult: null,
    browserInfo: navigator.userAgent
  };
  
  if ('speechSynthesis' in window) {
    results.speechSynthesisSupported = true;
    await ensureVoicesLoaded();
    
    const voices = getAvailableVoices();
    results.voicesAvailable = voices.length;
    results.voicesList = voices.map(v => ({
      name: v.name,
      lang: v.lang,
      local: v.localService
    }));
    
    return new Promise((resolve) => {
      const testUtterance = new SpeechSynthesisUtterance("Audio test.");
      testUtterance.volume = 1.0;
      testUtterance.rate = 1.0;
      testUtterance.pitch = 1.0;
      
      if (voices.length > 0) {
        testUtterance.voice = voices[0];
        testUtterance.lang = voices[0].lang;
      }
      
      testUtterance.onstart = () => {
        results.testResult = 'started';
      };
      
      testUtterance.onend = () => {
        results.testResult = 'completed';
        resolve(results);
      };
      
      testUtterance.onerror = (event) => {
        results.testResult = `error: ${event.error}`;
        resolve(results);
      };
      
      resetSpeechSynthesis();
      window.speechSynthesis.speak(testUtterance);
      
      setTimeout(() => {
        if (results.testResult === 'started') {
          results.testResult = 'timeout';
        }
        resolve(results);
      }, 5000);
    });
  }
  
  return results;
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
  ensureVoicesLoaded,
  runAudioDiagnostics
};

