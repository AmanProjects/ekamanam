# Ekamanam - The Art of Focused Learning

**An AI-powered study companion for NCERT students**

## 🎯 Features

- **📚 NCERT Textbook Support**: Read NCERT textbooks (Mathematics, Science, Social Science, English)
- **🎓 Teacher Mode**: AI reads entire PDF pages and explains like a real teacher
- **🎧 Audio Learning**: Listen to explanations with text-to-speech (NEW!)
- **🤖 AI-Powered Learning**: Select any text to get instant explanations, analogies, and interactive demos
- **👁️ Focus Monitoring**: Optional camera-based focus tracking to help students stay engaged
- **📝 Smart Notes**: Take notes with automatic AI insights that sync across devices
- **⚡ Activity Generator**: Generate custom RBL, CBL, and SEA activities for any chapter

## 🚀 Quick Start

### 1. Open the App

Simply open `index.html` in a modern web browser (Chrome, Edge, Safari, or Firefox recommended).

### 2. Sign In with Google (Recommended)

**Why sign in?**
- ✅ Your API key syncs across all devices
- ✅ Notes backed up to cloud
- ✅ One-time setup, works everywhere
- ✅ No need to re-enter API key on other devices

Click "**Sign in with Google**" button and select your account.

### 3. Complete Initial Setup

On first launch, you'll see a welcome guide. Follow these steps:

#### Get Your Free Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the generated key (starts with "AIza...")
5. Return to Ekamanam and paste it in Settings

**Note**: The API key is stored locally in your browser and is never shared with anyone.

### 3. Configure Firebase (Optional - for Cloud Sync)

If you want notes to sync across devices, set up Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Anonymous)
5. Copy your Firebase configuration
6. Replace the placeholder config in `index.html` (lines 115-122)

```javascript
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};
```

**If you skip this step**, the app will still work perfectly - notes will be saved locally in your browser!

## 📖 How to Use

### Reading Chapters

1. Select a **Subject** from the dropdown
2. Choose a **Book**
3. Click **Start Reading**
4. Download the chapter PDF from NCERT (button provided)
5. Upload the PDF to enable text selection and AI features

### Using AI Features

**Teacher Mode (Comprehensive Page Explanation):**
- Load a PDF and navigate to any page
- Click the "Teacher Mode" button (green button with user icon)
- Get a complete teacher-style explanation including:
  - Page summary and key points
  - Detailed explanations with examples
  - Real-world applications
  - Critical thinking questions
  - Exam-focused insights
- 🎧 **NEW: Audio Feature** - Listen to the Teacher's Explanation with a natural, soothing female voice!
- Perfect for understanding entire topics/pages
- See [TEACHER_MODE.md](TEACHER_MODE.md) for detailed guide

**Explain Any Text (Quick Clarification):**
- Select any specific text in the PDF
- Click the "Explain with AI" button that appears
- Get instant explanations, analogies, PYQ insights, and interactive demos
- Save insights to your chapter notes
- Best for quick term/concept clarification

**Generate Activities:**
- Click "Generate Activities" button in the reader
- Get custom RBL, CBL, and SEA activities for the chapter

### Focus Monitoring

- Click the power button in the bottom-right corner
- Allow camera access when prompted
- The widget will monitor your focus and alert you if attention drops
- You can minimize or disable it anytime

### Taking Notes

- Click "My Notes" in the reader
- Type your notes - they auto-save
- AI insights you save will appear here automatically

## 🔧 Troubleshooting

### AI Features Not Working
- Make sure you've added your Gemini API key in Settings
- Check that you have internet connection
- Verify your API key is correct (starts with "AIza")
- **NEW:** All AI features now use stable `gemini-1.5-flash` model
- See [AI_FIXES.md](AI_FIXES.md) for detailed troubleshooting

### Activities Are Too Generic
- **FIXED in v3.6:** Activities now use actual page content!
- Make sure a PDF is loaded for specific activities
- Navigate to a page with actual content (not cover/blank pages)
- Activities will be based on the text from your current page

### Rate Limit / Quota Exceeded Errors
- **Normal!** Free tier has limits: 15 requests/minute, 1500/day
- **Solution:** Wait 1-2 minutes and try again
- **Prevention:** Space out AI requests by 5-10 seconds
- **Details:** See [API_LIMITS.md](API_LIMITS.md) for complete guide

### Focus Monitor Not Working
- Allow camera access in your browser settings
- Some browsers may block camera on local files - try using a local server
- The feature is optional - the app works fine without it

### PDF Not Loading
- Make sure you're uploading a valid PDF file
- Try re-downloading the PDF from NCERT
- Check your browser console for any errors

### Notes Not Saving
- If Firebase is not configured, notes save to localStorage (browser storage)
- Don't clear your browser data or notes will be lost
- For permanent storage, set up Firebase (see step 3 above)

## 🌐 Running on Local Server (Recommended)

For best experience, especially with camera features:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🔐 Google Sign-In

**NEW!** Sign in with your Google account for:
- 🔄 Automatic sync across all devices
- 💾 Cloud backup of API keys and notes
- 🔒 Secure authentication
- 📱 Seamless multi-device experience

See [GOOGLE_SIGNIN.md](GOOGLE_SIGNIN.md) for complete guide.

**Without sign-in?** The app still works great! You'll just need to set up manually on each device.

## 📱 Mobile Support

The app works on mobile devices! For best experience:
- Use landscape orientation for reading
- Focus monitoring may not work on all mobile browsers
- Notes and AI features work perfectly on mobile
- Sign in with Google to sync across desktop and mobile

## 🛡️ Privacy & Safety

- Your Gemini API key is stored **locally** in your browser only
- Camera feed for focus monitoring **never leaves your device**
- No data is collected or sent to any third party
- All processing happens locally or through your own API key

## ⚖️ Copyright & Legal Compliance

**Current Mode: User-Upload Only ("My Books")**

This app respects all intellectual property rights:

- ✅ **No Direct NCERT Linking**: The app does NOT provide direct access to NCERT materials
- ✅ **User-Provided Content**: Students must upload their own PDF files
- ✅ **Legal Compliance**: All features are transformative educational tools
- ✅ **User Responsibility**: Users are responsible for materials they upload

### NCERT Library Feature (Future)

The codebase includes **commented-out** code for potential future NCERT library integration. This feature is:
- ❌ Currently **DISABLED**
- 🔒 Will remain disabled until proper permissions are obtained from NCERT
- 📝 Clearly marked in the code for transparency

See [COPYRIGHT_NOTICE.md](COPYRIGHT_NOTICE.md) for complete legal information.

**Note**: Students should download NCERT textbooks from the official [NCERT website](https://ncert.nic.in/textbook.php) and upload them to the app for personal educational use.

## 👨‍👩‍👧 For Parents

This app was built to help students:
- ✅ Stay focused while studying
- ✅ Understand difficult concepts instantly
- ✅ Learn through interactive demonstrations
- ✅ Build better study habits

The focus monitoring feature is **optional** and designed to build self-awareness, not surveillance.

## 🤝 Contributing

Built with love for focused learning. If you find bugs or have suggestions, feel free to open an issue!

## 📄 License

Free to use for educational purposes.

---

**Happy Learning! 📚✨**

