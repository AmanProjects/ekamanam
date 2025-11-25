# Ekamanam - Quick Setup Checklist

## ✅ Essential Setup (5 minutes)

### Step 1: Open the App
- [ ] Open `index.html` in Chrome, Edge, Safari, or Firefox
- [ ] You should see the Ekamanam welcome screen

### Step 2: Sign In with Google (Recommended)
- [ ] Click "Sign in with Google" button (top-right or dashboard)
- [ ] Select your Google account
- [ ] Allow necessary permissions
- [ ] ✅ Signed in! (You'll see your profile picture)

**Benefits**: API key syncs across all devices, notes backed up to cloud, one-time setup!

### Step 3: Get Gemini API Key (Required for AI features)
- [ ] Visit https://aistudio.google.com/app/apikey
- [ ] Sign in with your Google account
- [ ] Click "Create API Key"
- [ ] Copy the key (starts with "AIza...")
- [ ] Paste it in Ekamanam Settings
- [ ] Click "Save"

### Step 4: Test the App
- [ ] Select Subject: "Mathematics"
- [ ] Select Book: "Ganita Prakash"
- [ ] Click "Start Reading"
- [ ] Download Chapter 1 PDF from NCERT
- [ ] Upload the PDF to the app
- [ ] Try selecting some text and click "Explain with AI"

**That's it! You're ready to learn!** 🎉

**Note**: If you signed in with Google, your API key is automatically synced. On any other device, just sign in with the same Google account - no need to re-enter the API key!

---

## 🔧 Optional Setup

### Firebase Setup (For Cloud Sync)

Only needed if you want notes to sync across multiple devices.

#### Step 1: Create Firebase Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add Project"
- [ ] Name it "ekamanam" (or any name)
- [ ] Disable Google Analytics (optional)
- [ ] Click "Create Project"

#### Step 2: Enable Firestore
- [ ] In your project, go to "Firestore Database"
- [ ] Click "Create database"
- [ ] Choose "Start in test mode"
- [ ] Select your region
- [ ] Click "Enable"

#### Step 3: Enable Authentication
- [ ] Go to "Authentication"
- [ ] Click "Get Started"
- [ ] Go to "Sign-in method" tab
- [ ] Click "Anonymous"
- [ ] Toggle "Enable"
- [ ] Click "Save"

#### Step 4: Get Configuration
- [ ] Click the gear icon ⚙️ next to "Project Overview"
- [ ] Click "Project settings"
- [ ] Scroll down to "Your apps"
- [ ] Click the web icon `</>`
- [ ] Register your app (name it "ekamanam-web")
- [ ] Copy the firebaseConfig object

#### Step 5: Update index.html
- [ ] Open `index.html` in a text editor
- [ ] Find lines 115-122 (the firebaseConfig section)
- [ ] Replace with your configuration
- [ ] Save the file

```javascript
// Replace this section in index.html (lines 115-122)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

**Without Firebase**: Notes save locally in your browser (localStorage). They won't sync to other devices but will persist on your computer.

---

## 🎥 Focus Monitor Setup (Optional)

The focus monitoring feature is optional but can help build better study habits.

- [ ] Click the power button (bottom-right corner)
- [ ] Allow camera access when prompted
- [ ] The app will monitor facial expressions to detect focus levels
- [ ] You can turn it off anytime

**Note**: Camera feed never leaves your device. All processing is local.

---

## 📊 Usage Tips

### Best Practices
- ✅ Start with shorter study sessions (20-30 minutes)
- ✅ Use AI explanations for difficult concepts
- ✅ Take notes while reading
- ✅ Generate activities for hands-on learning
- ✅ Review your notes regularly

### Keyboard Shortcuts
- Select text + click = AI explanation
- Ctrl/Cmd + Mouse wheel = Zoom PDF
- Arrow keys = Navigate pages (when PDF is focused)

---

## 🆘 Need Help?

**Common Issues:**

| Problem | Solution |
|---------|----------|
| AI not working | Check Settings → API key added? |
| PDF won't load | Download from NCERT first, then upload |
| Notes not saving | Check if Firebase is configured (or it saves to localStorage) |
| Camera access denied | Browser settings → Allow camera for this site |
| Slow performance | Close other browser tabs |

**Still stuck?** Check the full README.md for detailed troubleshooting.

---

**Ready to start learning?** Open `index.html` and begin! 🚀

