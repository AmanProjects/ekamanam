# 🚀 Getting Started with Ekamanam React App

Welcome! This guide will help you get the React version of Ekamanam up and running in minutes.

## ✅ Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 14 or higher)
  - Check: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)
  
- **npm** (comes with Node.js)
  - Check: `npm --version`

## 📦 Installation (First Time Only)

Open your terminal in this directory and run:

```bash
npm install
```

This will download all required dependencies. It may take a few minutes.

## 🎯 Starting the Application

Once installation is complete, start the app:

```bash
npm start
```

The application will automatically open in your browser at:
**http://localhost:3000**

If it doesn't open automatically, paste that URL into your browser.

## 🔑 Initial Setup

### 1. Get Your Gemini API Key

The app needs a Gemini API key to power the AI features:

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with "AIza...")

### 2. Enter API Key in App

1. Once the app loads, click the **Settings** icon (gear icon) in the top-right
2. Paste your API key in the text field
3. Click **Save**

That's it! You're ready to use all AI features.

## 📖 Using the App

### Upload a PDF

1. Click **"Browse Files"** on the dashboard
2. Select a PDF textbook from your computer
3. Click **"Start Reading"**

### Side-by-Side Interface

Once you start reading, you'll see:

**Left Side (50%):**
- Your PDF textbook
- Zoom and navigation controls
- Text selection capability

**Right Side (50%):**
- Four tabs for different features:
  - **Teacher Mode**: Get comprehensive page explanations
  - **Explain**: Explain selected text from PDF
  - **Activities**: Generate learning activities
  - **Notes**: Take and save notes

### Using AI Features

#### Get a Page Explanation (Teacher Mode)
1. Navigate to any page in the PDF
2. Click the **"Teacher Mode"** tab (right panel)
3. Click **"Explain This Page"**
4. Read or listen to the explanation (speaker icon)

#### Explain Specific Text
1. Select any text in the PDF (left panel)
2. Click the **"Explain"** tab (right panel)
3. Click **"Explain Selected Text"**
4. Get detailed explanation with examples

#### Generate Activities
1. Navigate to a content page
2. Click the **"Activities"** tab
3. Click **"Generate Activities"**
4. Get RBL, CBL, and SEA activities

#### Take Notes
1. Click the **"Notes"** tab
2. Type your notes
3. They save automatically!

## 🎥 Focus Monitor (Optional)

Click the floating button (bottom-right corner) to enable focus monitoring:

1. Click the focus icon
2. Allow camera access
3. Monitor your focus score
4. Minimize or close anytime

## 🔧 Common Issues

### "npm: command not found"
- Install Node.js from [nodejs.org](https://nodejs.org/)

### Port 3000 already in use
- Stop other applications using port 3000, or
- The app will prompt to use a different port (like 3001)

### PDF not loading
- Ensure the PDF file is valid
- Try a different PDF
- Check browser console (F12) for errors

### AI features not working
- Make sure you entered your Gemini API key in Settings
- Check your internet connection
- Verify the API key is correct

### Camera not working
- Click "Allow" when browser asks for camera permission
- Make sure no other app is using your camera
- Check browser settings for camera permissions

## 📱 Mobile/Tablet Use

The app works on mobile devices!

- **Portrait mode**: Panels stack vertically
- **Landscape mode**: Side-by-side layout
- All features work the same way

## 🛑 Stopping the App

In the terminal where the app is running:
- Press `Ctrl + C` (Windows/Linux)
- Press `Cmd + C` (Mac)

## 🔄 Next Time

After the first installation, you only need:

```bash
npm start
```

No need to run `npm install` again unless you update the code.

## 📚 More Information

- **Full Documentation**: See `README_REACT.md`
- **Migration Info**: See `MIGRATION_GUIDE.md`
- **Original Docs**: See `README.md`

## 🎓 Tips for Best Experience

1. **Use Chrome or Edge** - Best compatibility
2. **Allow camera** - For focus monitoring
3. **Steady internet** - For AI features
4. **Sign in with Google** - To sync settings (optional)
5. **Take notes** - As you learn!

## 🆘 Need Help?

1. Check the console (F12 in browser)
2. Review error messages
3. Check `README_REACT.md` for details
4. Open an issue on GitHub

---

**Enjoy focused learning! 📚✨**

Happy studying with Ekamanam!

