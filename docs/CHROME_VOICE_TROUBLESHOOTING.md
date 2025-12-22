# 🔊 Chrome Voice Troubleshooting Guide

## 🚨 Common Chrome Voice Issues

### **Issue 1: Voice Not Working in Chrome**

**Symptoms:**
- Listen buttons do nothing
- No audio plays when clicking voice controls
- Console shows no errors

**Root Causes:**
1. **User Interaction Required**: Chrome blocks speech synthesis until user interacts with the page
2. **Voices Not Loaded**: Chrome loads voices asynchronously
3. **Sound Permissions**: Site is blocked from playing sound
4. **Missing Language Packs**: Indian voices not installed

---

## ✅ **Quick Fixes**

### **Fix 1: Enable Site Sound Permissions**

1. Click the lock icon 🔒 in the address bar
2. Click "Site settings"
3. Find "Sound" → Set to **"Allow"**
4. Reload the page
5. Try voice feature again

### **Fix 2: Check Chrome Sound Settings**

1. Go to: `chrome://settings/content/sound`
2. Ensure **"Sites can play sound"** is enabled
3. Check if `ekamanam.com` is not in the blocked list
4. If blocked, remove it from the list

### **Fix 3: Clear Chrome Cache**

```
Windows/Linux: Ctrl + Shift + Delete
Mac: Cmd + Shift + Delete
```

1. Select "Cached images and files"
2. Click "Clear data"
3. Reload Ekamanam
4. Test voice again

### **Fix 4: Update Chrome**

1. Go to: `chrome://settings/help`
2. Chrome will auto-check for updates
3. If available, click "Relaunch"
4. **Recommended version: Chrome 120+**

---

## 🎤 **Install Indian Voices**

### **Windows 10/11:**

1. **Settings** → **Time & Language** → **Speech**
2. Click **"Add voices"** or **"Manage voices"**
3. Download:
   - ✅ **Microsoft Ravi** (English - India)
   - ✅ **Microsoft Heera** (English - India)  
   - ✅ **Microsoft Swara** (Hindi - India)
   - ✅ **Microsoft Hemant** (Hindi - India)
   - ✅ **Microsoft Shruti** (Telugu - India) [If available]
4. Restart Chrome after installation

### **macOS:**

1. **System Preferences** → **Accessibility** → **Spoken Content**
2. Click **"System Voice"** dropdown
3. Click **"Manage Voices..."**
4. Download:
   - ✅ **Isha** (English - India)
   - ✅ **Lekha** (Hindi - India)
   - ✅ **Tamil** voices
   - ✅ **Telugu** voices (if available)
5. Restart Chrome

### **Linux:**

Indian voices are limited on Linux. Consider:
- Using **Edge** (better voice support)
- Installing `espeak` or `festival` with Indian language packs
- Using online/cloud voices (requires internet)

---

## 🧪 **Test Voice Functionality**

### **Access Diagnostic Tool:**

```
https://ekamanam.com/voice-diagnostics.html
```

Or locally:
```
http://localhost:3000/voice-diagnostics.html
```

### **Run Tests:**

1. **Full Diagnostics** - Complete system check
2. **Test English** - Verify English (India) voice
3. **Test Hindi** - Verify Hindi voice
4. **Test Telugu** - Verify Telugu voice

---

## 🔧 **Technical Solutions for Developers**

### **1. Chrome Requires User Gesture**

❌ **Wrong** (will fail in Chrome):
```javascript
// Auto-play on page load
window.onload = () => {
  speechSynthesis.speak(new SpeechSynthesisUtterance("Welcome"));
};
```

✅ **Correct** (triggered by user):
```javascript
// User clicks button
button.onclick = () => {
  speechSynthesis.speak(new SpeechSynthesisUtterance("Welcome"));
};
```

### **2. Wait for Voices to Load**

❌ **Wrong**:
```javascript
const voices = speechSynthesis.getVoices(); // May be empty!
```

✅ **Correct**:
```javascript
const loadVoices = () => {
  return new Promise(resolve => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
};

const voices = await loadVoices();
```

### **3. Chrome 15-Second Limit**

Chrome stops speech after ~15 seconds. For long text:

```javascript
// Chunk long text into sentences
const chunkText = (text, maxLength = 200) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let current = '';
  
  sentences.forEach(sentence => {
    if ((current + sentence).length > maxLength) {
      chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  });
  
  if (current) chunks.push(current);
  return chunks;
};

// Speak in chunks
const speakLongText = (text) => {
  const chunks = chunkText(text);
  
  const speakChunk = (index) => {
    if (index >= chunks.length) return;
    
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.onend = () => speakChunk(index + 1);
    speechSynthesis.speak(utterance);
  };
  
  speakChunk(0);
};
```

### **4. Handle Speech Cancellation Properly**

```javascript
// Chrome needs time to fully cancel
const stopSpeech = async () => {
  speechSynthesis.cancel();
  // Wait for cancel to complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

const speakText = async (text) => {
  await stopSpeech(); // Stop any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
};
```

---

## 📊 **Voice Availability by Browser**

| Browser | English (India) | Hindi | Telugu | Tamil | Notes |
|---------|----------------|-------|--------|-------|-------|
| **Chrome** | ⚠️ Needs install | ⚠️ Needs install | ⚠️ Needs install | ⚠️ Needs install | Requires OS language packs |
| **Edge** | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in | Best for Indian languages |
| **Safari** | ✅ Native | ⚠️ Limited | ❌ No | ⚠️ Limited | macOS voices only |
| **Firefox** | ⚠️ Needs install | ⚠️ Needs install | ❌ No | ⚠️ Limited | Uses OS voices |

**Recommendation:** For best Indian language support, use **Microsoft Edge** or install language packs on Chrome.

---

## 🔍 **Debugging Voice Issues**

### **Check Browser Console:**

```javascript
// In Chrome DevTools Console:

// 1. Check if speech is supported
console.log('Speech supported:', 'speechSynthesis' in window);

// 2. List all voices
speechSynthesis.getVoices().forEach(v => {
  console.log(v.name, v.lang, v.localService);
});

// 3. Test speech
const test = new SpeechSynthesisUtterance("Test");
test.onstart = () => console.log('Started');
test.onerror = (e) => console.error('Error:', e);
test.onend = () => console.log('Ended');
speechSynthesis.speak(test);

// 4. Check if speech is currently active
console.log('Speaking:', speechSynthesis.speaking);
console.log('Pending:', speechSynthesis.pending);
```

### **Common Console Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `"not-allowed"` | No user interaction | Trigger from button click |
| `"network"` | No internet (online voice) | Install local voices or check connection |
| `"synthesis-failed"` | Voice not available | Install language pack |
| `"canceled"` | Overlapping speech | Wait for previous speech to finish |

---

## 📱 **Mobile Chrome Issues**

### **Android Chrome:**
- ✅ Usually works well with Google TTS
- Go to: **Settings** → **System** → **Languages** → **Text-to-speech output**
- Install: **Google Text-to-Speech**
- Download voice data for Hindi, Tamil, Telugu

### **iOS Safari:**
- Uses Apple voices (limited Indian languages)
- Install iOS language keyboard packs
- Settings → General → Keyboard → Keyboards → Add New Keyboard

---

## 🎯 **Best Practices for Ekamanam**

### **1. Always Check Support First**

```javascript
if (!('speechSynthesis' in window)) {
  alert('Text-to-speech is not supported in your browser');
  return;
}
```

### **2. Provide Visual Feedback**

```javascript
const speakButton = document.getElementById('speak-btn');

utterance.onstart = () => {
  speakButton.textContent = 'Stop';
  speakButton.classList.add('speaking');
};

utterance.onend = () => {
  speakButton.textContent = 'Listen';
  speakButton.classList.remove('speaking');
};
```

### **3. Handle Errors Gracefully**

```javascript
utterance.onerror = (event) => {
  console.error('Speech error:', event.error);
  
  const errorMessages = {
    'not-allowed': 'Permission denied. Please allow sound in site settings.',
    'network': 'Network error. Check your internet connection.',
    'synthesis-failed': 'Voice not available. Try installing language packs.',
    'audio-busy': 'Audio is busy. Please try again.'
  };
  
  alert(errorMessages[event.error] || 'Speech failed. Please try again.');
};
```

---

## 📞 **Still Having Issues?**

1. **Visit Diagnostic Tool**: https://ekamanam.com/voice-diagnostics.html
2. **Check Browser Compatibility**: Ensure Chrome 120+ or Edge 120+
3. **Try Edge Browser**: Better support for Indian voices
4. **Contact Support**: Include diagnostic results

---

## 🔗 **Useful Links**

- [Chrome Speech Synthesis API](https://developer.chrome.com/blog/web-speech-api/)
- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Chrome Sound Settings](chrome://settings/content/sound)
- [Voice Diagnostics Tool](/voice-diagnostics.html)

---

**Last Updated:** December 22, 2025  
**Ekamanam Version:** 10.1+

