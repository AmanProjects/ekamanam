# Changelog

All notable changes to Ekamanam will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2025-11-26

### Fixed
- 🎨 **Enhanced "Draw" command detection**: AI now properly recognizes when questions explicitly ask to "Draw", "Plot", "Sketch", "Graph", "Construct", or "Illustrate"
- 📊 **Improved chart type identification**: Added validation logic to correctly distinguish between:
  - Pie charts (parts of a whole, percentages)
  - Bar charts (comparing separate values)
  - Line graphs (trends over time)
- ✅ **Visual aids now mandatory for "Draw" questions**: When a question contains drawing keywords, the AI MUST provide a visual representation
- 🔍 **Added pre-generation validation**: AI now validates chart type selection before generating visuals

### Technical
- Updated `generateExplanation` prompt in `geminiService.js` with enhanced visual aid instructions
- Added explicit chart type selection criteria
- Added progressive visual construction guidelines for geometric drawings

## [2.1.0] - 2025-11-26

### Added
- 🏷️ **Version display in header**: Shows current version (e.g., v2.1.0) next to logo
- 📦 Version automatically syncs from `package.json`
- 📱 Version chip hidden on mobile, visible on desktop

### Fixed
- 🐛 **Chart.js controller registration**: Fixed "bar/pie is not a registered controller" errors
- ✅ Registered `PieController`, `BarController`, and `LineController` properly
- 📊 All Chart.js visualizations now render correctly

### Technical
- Added `PieController`, `BarController`, `LineController` imports to `VisualAidRenderer.js`
- Imported version from `package.json` in `App.js`
- Added `Chip` component to display version in header

## [2.0.0] - 2025-11-26

### Major Release - React Conversion
- 🎉 **Complete rewrite from vanilla HTML to React + Material-UI**
- 📱 **Responsive design** with mobile-first approach
- 🔥 **Firebase integration** for authentication and cloud storage
- 🤖 **Gemini AI 2.5-flash** integration for all AI features

### Features
- 📚 **Teacher Mode**: Bilingual explanations with on-demand English translation
- 📖 **Read & Understand**: Word-by-word analysis with pronunciation and meaning
- 🎯 **Explain Tab**: Smart chunking, exercise detection, bilingual answers
- 🎮 **Activities Tab**: Interactive MCQs with AI evaluation, practice questions
- 🌐 **Additional Resources**: Web links and related topics
- 🎨 **Visual Aids**: SVG diagrams and Chart.js visualizations for Math/Science
- 💾 **Hybrid Caching System**: IndexedDB for fast page loads
- 🔊 **Natural TTS**: Listen buttons with regional language support
- 🎯 **Smart Text Selection**: "Analyze with AI" floating button
- 🔐 **Google Sign-In**: Cloud sync for API keys and preferences

### Technical Architecture
- ⚛️ React 18 with functional components and hooks
- 🎨 Material-UI v5 for consistent design system
- 📄 PDF.js v3.11 for PDF rendering with text layer
- 🔥 Firebase v10 for backend services
- 🤖 Gemini API v2.5-flash for AI processing
- 💾 IndexedDB (idb) for client-side caching
- 🗣️ Web Speech API for text-to-speech
- 📊 Chart.js v4.5 for data visualizations
- 🎯 Context-aware AI with prior page summaries

### File Structure
```
ekamanam/
├── src/
│   ├── components/
│   │   ├── Dashboard.js          # Landing page
│   │   ├── PDFViewer.js          # PDF rendering with text layer
│   │   ├── AIModePanel.js        # All AI features (Teacher, Explain, etc.)
│   │   ├── VisualAidRenderer.js  # SVG/Chart.js rendering
│   │   ├── AuthButton.js         # Google Sign-In
│   │   ├── SettingsDialog.js     # API key management
│   │   └── FocusMonitor.js       # Optional focus tracking
│   ├── services/
│   │   ├── geminiService.js      # AI API integration
│   │   └── cacheService.js       # IndexedDB operations
│   ├── firebase/
│   │   └── config.js             # Firebase configuration
│   ├── App.js                    # Main app orchestration
│   ├── theme.js                  # MUI theme configuration
│   └── index.js                  # React entry point
├── docs/
│   ├── guides/                   # Documentation
│   └── images/                   # Image assets
├── public/
│   ├── Ekamanaml.png            # Logo
│   └── .nojekyll                # GitHub Pages config
└── package.json                  # Dependencies and scripts
```

### Migration from v1
- ✅ All features from original `index.html` preserved
- ✅ Enhanced with better error handling and caching
- ✅ Improved UI/UX with Material Design
- ✅ Better performance with React optimization
- ✅ Cloud sync with Firebase
- ✅ Progressive Web App ready

---

## Versioning Scheme

- **Major (X.0.0)**: Complete rewrites, breaking changes, new architecture
- **Minor (x.X.0)**: New features, enhancements, significant improvements
- **Patch (x.x.X)**: Bug fixes, small improvements, performance tweaks

---

## Links

- **Live App**: https://amanprojects.github.io/ekamanam/
- **Repository**: https://github.com/AmanProjects/ekamanam
- **Original Version**: [index.html](https://amanprojects.github.io/ekamanam/original.html)
- **Landing Page**: [Ekamanam.html](https://amanprojects.github.io/ekamanam/landing.html)

