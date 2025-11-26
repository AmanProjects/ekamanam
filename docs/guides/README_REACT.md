# Ekamanam - React Application

This is the React version of Ekamanam - The Art of Focused Learning, built with Material-UI (MUI) and featuring a modern side-by-side layout.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🎨 Features

### Side-by-Side Layout
- **Left Panel**: PDF viewer with text selection capabilities
- **Right Panel**: AI modes (Teacher Mode, Explain, Activities, Notes)
- Responsive design that adapts to different screen sizes

### Material-UI Components
- Modern, clean interface using MUI components
- Consistent design language throughout the app
- Smooth animations and transitions
- Accessible and mobile-friendly

### PDF Viewing
- Upload and view PDF textbooks
- Text selection with overlay layer
- Zoom in/out controls
- Page navigation
- Canvas-based rendering with PDF.js

### AI-Powered Features
- **Teacher Mode**: Get comprehensive page explanations
- **Explain**: Get detailed explanations of selected text
- **Activities**: Generate RBL, CBL, and SEA activities
- **Notes**: Take and save notes
- Text-to-speech for explanations

### Firebase Integration
- Google Sign-In authentication
- Cloud sync capabilities (when configured)
- Firestore database integration

### Focus Monitor
- Optional camera-based focus tracking
- Real-time focus score
- Minimizable widget
- Easy on/off toggle

## 📁 Project Structure

```
src/
├── components/
│   ├── AIModePanel.js       # Right panel with AI modes
│   ├── AuthButton.js        # Google Sign-In button
│   ├── Dashboard.js         # Main landing page
│   ├── FocusMonitor.js      # Focus tracking widget
│   ├── PDFViewer.js         # Left panel PDF viewer
│   └── SettingsDialog.js    # Settings modal
├── firebase/
│   └── config.js            # Firebase configuration
├── services/
│   └── geminiService.js     # Gemini API integration
├── App.js                   # Main app component
├── index.js                 # Entry point
└── theme.js                 # MUI theme configuration
```

## ⚙️ Configuration

### Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Open Settings in the app and paste your API key

### Firebase (Optional)

The Firebase configuration is already set up in `src/firebase/config.js`. If you want to use your own Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google provider)
3. Enable Firestore Database
4. Update the config in `src/firebase/config.js`

## 🎯 Usage

### Reading PDFs

1. Click "Library" in the header
2. Upload a PDF file
3. Click "Start Reading"
4. The PDF will appear in the left panel

### Using AI Features

#### Teacher Mode
1. Navigate to a page in the PDF
2. Click the "Teacher Mode" tab in the right panel
3. Click "Explain This Page"
4. Get a comprehensive explanation
5. Click the speaker icon to listen to the explanation

#### Explain Selected Text
1. Select any text in the PDF (left panel)
2. Click the "Explain" tab in the right panel
3. Click "Explain Selected Text"
4. Get detailed explanation with analogies and examples

#### Generate Activities
1. Navigate to a page in the PDF
2. Click the "Activities" tab
3. Click "Generate Activities"
4. Get RBL, CBL, and SEA activities

#### Take Notes
1. Click the "Notes" tab
2. Type your notes
3. Notes are automatically saved to local storage

### Focus Monitoring

1. Click the floating focus monitor button (bottom-right)
2. Allow camera access when prompted
3. The widget will monitor your focus
4. Minimize or close it anytime

## 🔧 Customization

### Theme

Edit `src/theme.js` to customize colors, typography, and component styles:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5', // Change primary color
    },
    // ... more customization
  },
});
```

### Layout

The side-by-side layout is implemented in `src/App.js` using MUI Grid:

```javascript
<Grid container>
  <Grid item xs={12} md={6}>
    {/* Left panel - PDF */}
  </Grid>
  <Grid item xs={12} md={6}>
    {/* Right panel - AI modes */}
  </Grid>
</Grid>
```

## 📱 Responsive Design

- **Desktop (md and up)**: Side-by-side layout (50/50 split)
- **Mobile (xs to sm)**: Stacked layout (full width)
- Touch-friendly controls
- Optimized for various screen sizes

## 🐛 Troubleshooting

### PDF not loading
- Ensure you're uploading a valid PDF file
- Check browser console for errors
- Try a different PDF file

### AI features not working
- Make sure you've set your Gemini API key in Settings
- Check your internet connection
- Verify API key is correct (starts with "AIza")

### Camera not working
- Allow camera permissions in browser
- Use HTTPS or localhost (required for camera access)
- Check if camera is being used by another application

## 🔐 Privacy

- API keys are stored in browser localStorage only
- Camera feed never leaves your device
- No data is sent to third parties
- All processing is local or through your own API key

## 📄 License

Free to use for educational purposes.

---

**Happy Learning! 📚✨**

