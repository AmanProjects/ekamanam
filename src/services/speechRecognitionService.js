/**
 * Speech Recognition Service (Voice Input)
 * Provides speech-to-text functionality across the application
 * Supports multiple languages including Telugu, Hindi, Tamil, etc.
 */

// Check if browser supports speech recognition
export const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

/**
 * Language codes for speech recognition
 * Maps common language names to BCP 47 language tags
 */
export const SPEECH_RECOGNITION_LANGUAGES = {
  'English': 'en-IN',  // Indian English
  'Telugu': 'te-IN',
  'తెలుగు': 'te-IN',
  'Hindi': 'hi-IN',
  'हिंदी': 'hi-IN',
  'Tamil': 'ta-IN',
  'தமிழ்': 'ta-IN',
  'Kannada': 'kn-IN',
  'ಕನ್ನಡ': 'kn-IN',
  'Malayalam': 'ml-IN',
  'മലയാളം': 'ml-IN',
  'Bengali': 'bn-IN',
  'বাংলা': 'bn-IN',
  'Marathi': 'mr-IN',
  'Gujarati': 'gu-IN',
  'Punjabi': 'pa-IN',
  'Urdu': 'ur-IN'
};

/**
 * Create a speech recognition instance
 * @param {Object} options - Configuration options
 * @param {string} options.language - Language code (default: 'en-IN')
 * @param {boolean} options.continuous - Continuous recognition (default: false)
 * @param {boolean} options.interimResults - Show interim results (default: true)
 * @returns {Object} Recognition instance with control methods
 */
export const createSpeechRecognition = (options = {}) => {
  const {
    language = 'en-IN',
    continuous = false,
    interimResults = true,
    onResult = () => {},
    onError = () => {},
    onStart = () => {},
    onEnd = () => {}
  } = options;

  if (!isSpeechRecognitionSupported()) {
    console.error('❌ Speech recognition not supported in this browser');
    onError({ error: 'not-supported', message: 'Speech recognition not supported' });
    return null;
  }

  // Create recognition instance
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Configure recognition
  recognition.lang = language;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  recognition.maxAlternatives = 1;

  console.log('🎤 [Speech Recognition] Created with language:', language);

  // Event handlers
  recognition.onstart = () => {
    console.log('🎤 [Speech Recognition] Started');
    onStart();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        console.log('✅ [Speech Recognition] Final:', finalTranscript);
      } else {
        interimTranscript += transcript;
        console.log('⏳ [Speech Recognition] Interim:', interimTranscript);
      }
    }

    onResult({
      finalTranscript,
      interimTranscript,
      isFinal: finalTranscript.length > 0
    });
  };

  recognition.onerror = (event) => {
    console.error('❌ [Speech Recognition] Error:', event.error);
    
    let errorMessage = 'Speech recognition error';
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        errorMessage = 'Microphone not found. Please check your device.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
        break;
      case 'network':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      case 'aborted':
        errorMessage = 'Speech recognition aborted.';
        break;
      default:
        errorMessage = `Speech recognition error: ${event.error}`;
    }
    
    onError({ error: event.error, message: errorMessage });
  };

  recognition.onend = () => {
    console.log('🛑 [Speech Recognition] Ended');
    onEnd();
  };

  // Control methods
  return {
    recognition,
    start: () => {
      try {
        recognition.start();
      } catch (error) {
        if (error.name === 'InvalidStateError') {
          console.warn('⚠️ Speech recognition already started');
        } else {
          console.error('❌ Failed to start speech recognition:', error);
          onError({ error: 'start-failed', message: error.message });
        }
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error('❌ Failed to stop speech recognition:', error);
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (error) {
        console.error('❌ Failed to abort speech recognition:', error);
      }
    },
    setLanguage: (newLanguage) => {
      recognition.lang = newLanguage;
      console.log('🌐 [Speech Recognition] Language changed to:', newLanguage);
    }
  };
};

/**
 * Detect language from text (for auto-setting recognition language)
 * @param {string} text - Text to analyze
 * @returns {string} Language code
 */
export const detectLanguageForRecognition = (text) => {
  if (!text) return 'en-IN';
  
  // Check for regional language Unicode
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
  
  return 'en-IN'; // Default to Indian English
};

/**
 * Request microphone permission
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately (we just needed permission)
    stream.getTracks().forEach(track => track.stop());
    console.log('✅ Microphone permission granted');
    return true;
  } catch (error) {
    console.error('❌ Microphone permission denied:', error);
    return false;
  }
};

/**
 * Check if microphone permission is granted
 * @returns {Promise<string>} 'granted', 'denied', or 'prompt'
 */
export const checkMicrophonePermission = async () => {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (error) {
    console.warn('⚠️ Could not check microphone permission:', error);
    return 'prompt'; // Assume we need to prompt
  }
};

export default {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
  detectLanguageForRecognition,
  requestMicrophonePermission,
  checkMicrophonePermission,
  SPEECH_RECOGNITION_LANGUAGES
};

