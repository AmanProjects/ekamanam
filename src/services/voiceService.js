// Voice Preference Service
// Manages text-to-speech voice selection across the application

export const VOICE_OPTIONS = {
  MALE_US: 'male_us',
  FEMALE_US: 'female_us',
  MALE_INDIAN: 'male_indian',
  FEMALE_INDIAN: 'female_indian',
};

export const VOICE_LABELS = {
  [VOICE_OPTIONS.MALE_US]: '🇺🇸 Male (American)',
  [VOICE_OPTIONS.FEMALE_US]: '🇺🇸 Female (American)',
  [VOICE_OPTIONS.MALE_INDIAN]: '🇮🇳 Male (Indian)',
  [VOICE_OPTIONS.FEMALE_INDIAN]: '🇮🇳 Female (Indian)',
};

// Get user's voice preference
export const getVoicePreference = () => {
  const saved = localStorage.getItem('voice_preference');
  return saved || VOICE_OPTIONS.FEMALE_US; // Default to Female US
};

// Save user's voice preference
export const saveVoicePreference = (voiceOption) => {
  localStorage.setItem('voice_preference', voiceOption);
  console.log(`🔊 Voice preference saved: ${VOICE_LABELS[voiceOption]}`);
};

// Get the best matching voice from browser
export const getBestVoice = (languageCode = 'en-US', voicePreference = null) => {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const pref = voicePreference || getVoicePreference();

  // Voice selection logic based on preference
  let preferredVoices = [];

  switch (pref) {
    case VOICE_OPTIONS.MALE_US:
      preferredVoices = voices.filter(v => 
        v.lang.startsWith('en-US') && 
        (v.name.toLowerCase().includes('male') || 
         v.name.includes('David') || 
         v.name.includes('Alex') ||
         v.name.includes('Fred'))
      );
      break;

    case VOICE_OPTIONS.FEMALE_US:
      preferredVoices = voices.filter(v => 
        v.lang.startsWith('en-US') && 
        (v.name.toLowerCase().includes('female') || 
         v.name.includes('Samantha') || 
         v.name.includes('Victoria') ||
         v.name.includes('Karen'))
      );
      break;

    case VOICE_OPTIONS.MALE_INDIAN:
      preferredVoices = voices.filter(v => 
        (v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')) && 
        (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('ravi'))
      );
      break;

    case VOICE_OPTIONS.FEMALE_INDIAN:
      preferredVoices = voices.filter(v => 
        (v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')) && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('veena'))
      );
      break;

    default:
      preferredVoices = voices.filter(v => v.lang.startsWith(languageCode));
  }

  // Return first match or fallback to any voice with the language code
  if (preferredVoices.length > 0) {
    console.log(`🎤 Using voice: ${preferredVoices[0].name} (${preferredVoices[0].lang})`);
    return preferredVoices[0];
  }

  // Fallback: any voice with matching language
  const fallback = voices.find(v => v.lang.startsWith(languageCode));
  if (fallback) {
    console.log(`🎤 Using fallback voice: ${fallback.name} (${fallback.lang})`);
  }
  return fallback || voices[0];
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

