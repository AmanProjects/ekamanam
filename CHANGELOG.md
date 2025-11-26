# Changelog

All notable changes to Ekamanam will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2025-11-26

### 🔧 Critical Fixes

#### Notes Integration Fixed
- **PROBLEM:** Notes weren't appearing in Notes tab after clicking "Add to Notes"
- **ROOT CAUSE:** `notesContent` state in AIModePanel wasn't connected to NotesEditor
- **FIX:** 
  - Removed intermediate state, now writes directly to localStorage
  - Added custom `notesUpdated` event system
  - NotesEditor listens for updates and reloads immediately
- **RESULT:** ✅ Notes now appear instantly in Notes tab

#### Add to Notes Button UI Improvements
- Changed from `outlined` to `contained` variant (more prominent)
- Changed text from `"+ Notes"` to `"Add to Notes"` (clearer)
- Added `minWidth: 140px` for consistent button sizing
- Removed Tooltip wrapper (cleaner, more professional look)

#### Auto-Switch to Notes Tab
- After adding notes, automatically switches to Notes tab (index 5)
- User sees their added content immediately
- Better UX flow - no manual tab switching needed

#### State Management Cleanup
- Removed unused `notesContent` state from AIModePanel
- All notes now managed through localStorage exclusively
- Single source of truth for notes data
- Prevents state synchronization issues

### 📖 How It Works Now
1. User clicks **"Add to Notes"** on Explain tab
2. Content written to `localStorage` with key `notes_{pdfId}`
3. Custom event `notesUpdated` dispatched
4. NotesEditor listens for event, reloads from localStorage
5. User **automatically switched** to Notes tab
6. Notes appear with full formatting, page number, and timestamp

## [2.3.0] - 2025-11-26

### 🎉 MAJOR FEATURES

#### 📝 Rich Text Notes Editor
- **Full-featured editor** with React-Quill
- **Formatting toolbar**: Bold, italic, underline, headers, colors, lists, alignment
- **Insert images and graphics** via toolbar or copy-paste
- **Auto-save every 5 seconds** to localStorage
- **Manual save** button with timestamp display
- **Export to PDF** using html2canvas + jsPDF
- **Print preview** with formatted output
- **Clear all notes** with confirmation

#### ➕ Add to Notes Functionality  
- **"+ Notes" button** on Explain tab (next to Clear)
- **Automatically captures** AI explanations with:
  - Explanation text
  - Analogies
  - Exam questions (PYQ)
  - Exercises and solutions (questions, answers, steps)
- **Formatted entries** with:
  - Page number reference
  - Timestamp
  - Visual separation
  - Color-coded sections
- **Success notification** when added
- **Instant navigation** to Notes tab

#### 🔒 Smart Tab Disabling
- **Read & Understand tab disabled** for English PDFs
- **Enabled only for regional languages**:
  - Telugu, Hindi, Tamil, Bengali, Gujarati
  - Punjabi, Oriya, Malayalam, Kannada
- **Helpful tooltip** explains why disabled:
  - "📖 This tab is for regional languages. English PDFs don't need word-by-word analysis."
- **Auto-detection** using Unicode character ranges
- **Prevents unnecessary** word analysis for English content

### 📦 New Packages
- `react-quill@2.0.0` - Industry-standard rich text editor
- `jspdf@2.5.1` - PDF export functionality
- `html2canvas@1.4.1` - HTML to canvas rendering

### 🆕 New Component
- `NotesEditor.js` - Complete notes management system with:
  - Quill editor integration
  - localStorage persistence
  - Export/print functionality
  - Auto-save logic

### 🐛 Fixes
- Fixed unused import warnings (IconButton, Tooltip)
- Fixed react-hooks/exhaustive-deps warning in NotesEditor
- Proper Clear button integration on Explain tab

### 📖 User Benefits
✅ Take comprehensive notes with rich formatting  
✅ Capture AI explanations instantly with one click  
✅ Export notes for offline study as PDF  
✅ Print for physical reference  
✅ No word analysis clutter for English PDFs  
✅ All notes auto-saved, never lost  
✅ Graphics and visual aids preserved in notes  

## [2.2.6] - 2025-11-26

### Fixed
- 🔴 **CRITICAL: AI now generates actual visuals for "Draw" commands**
  - **Issue:** AI was saying "Draw the pie chart" but NOT providing the chart
  - **Fix:** Enhanced prompt with explicit rule: "When you write 'Draw X', the visualAid MUST contain the drawing of X"
  - **Result:** AI now provides actual Chart.js/3D/SVG when it mentions drawing

### Enhanced
- 📝 **Better visualization examples** with real data (not placeholders)
  - Pie chart example: actual labels ["Hindi","English","Telugu","Tamil"] with real data
  - Bar chart example: complete configuration with axis labels
  - All examples now copy-paste ready

### Prompt Changes
- Added 🚨 CRITICAL section for "Draw" detection
- Emphasized: "NEVER tell user to draw something without providing the visual yourself"
- Added validation: "Empty visualAid when saying 'draw' = FAILURE"
- Clarified: "The user CANNOT draw - YOU must provide the visual"

## [2.2.5] - 2025-11-26

### Added
- ✨ **Clear buttons** on all AI tabs
  - Teacher Mode: Clear button next to "Explain This Page"
  - Explain: Clear button next to "Explain Current Page"  
  - Activities: Clear button next to "Generate Activities"
  - Resources: Clear button next to "Find Additional Resources"
  - Word Analysis: Clear button next to "Start Word Analysis"

### Fixed
- 📄 **Page-specific data display**
  - Data only shows if it matches current page
  - Navigating to different page hides old data
  - Returning to original page shows cached data
  - **Page mismatch warnings:** Alert when viewing data from wrong page
  - Clear buttons only appear for current page's data

### Implementation
- Added `*ResponsePage` state tracking (teacherResponsePage, explainResponsePage, etc.)
- Conditional rendering: `{response && responsePage === currentPage && ...}`
- Clear functions reset both data and page tracking
- Inline "Clear Old Data" buttons in mismatch warnings

## [2.2.4] - 2025-11-26

### Added
- 🧪 **3D Visualization Test Page** (diagnostic tool)
  - Test Three.js cube and sphere rendering
  - Test Plotly 3D surface plots
  - Test 3Dmol chemistry molecules
  - Troubleshooting guide for WebGL issues
  - Browser compatibility checks

## [2.2.3] - 2025-11-26

### Fixed
- 🔒 **Type safety for all .split() calls**
  - Fixed `TypeError: e.split is not a function`
  - Added type checking in `formatMarkdown()` and `formatText()`
  - Safe navigation for `utterance.lang.split()`

## [2.2.2] - 2025-11-26

### Fixed
- 🐛 **Markdown bold syntax rendering** (`**text**` displayed literally)
  - Enhanced `formatBoldText()` to handle bold and italic
  - Converts `**text**` → `<strong>text</strong>`
  - Converts `*text*` → `<em>text</em>`
  - Applied to all AI responses (Teacher, Explain, Activities)

## [2.2.1] - 2025-11-26

### Fixed
- 🐛 **Explain tab generating paragraphs instead of structured JSON**
  - Simplified AI prompt (was too complex with 3D instructions)
  - Condensed from 150+ lines to ~50 lines
  - Restored excellent structured explanations with visuals

## [2.2.0] - 2025-11-26

### Added - 🎉 **MAJOR: 3D & Scientific Visualizations**

#### **🎯 3D Geometric Shapes (Three.js)**
- ✅ Interactive 3D shapes: cube, sphere, cone, cylinder, pyramid, torus
- ✅ Polyhedra: dodecahedron, icosahedron, tetrahedron, octahedron
- ✅ Customizable colors, wireframes, dimensions, labels
- ✅ Auto-rotation, drag-to-rotate, scroll-to-zoom
- ✅ Axis helpers for orientation
- ✅ Edge highlighting for better visibility

#### **📊 3D Scientific Plots (Plotly.js)**
- ✅ 3D surface plots for functions z = f(x, y)
- ✅ 3D scatter plots for data visualization
- ✅ Vector fields for physics
- ✅ Parametric curves
- ✅ Heat maps and contour plots
- ✅ Interactive rotation, zoom, pan
- ✅ Colorscales and legends

#### **🧪 Chemistry Visualization (3Dmol.js)**
- ✅ Molecular structure viewer
- ✅ Pre-configured molecules: water, methane, ethanol, glucose, benzene, caffeine
- ✅ SMILES notation support
- ✅ Stick and ball-and-stick models
- ✅ Interactive 3D rotation and zoom
- ✅ Atom labels

#### **📐 Mathematical Formulas (KaTeX)**
- ✅ LaTeX formula rendering
- ✅ Chemical formulas
- ✅ Scientific notation
- ✅ High-quality typesetting

### New Components
- `ThreeDVisualization.js` - Three.js wrapper for 3D geometric shapes
- `ChemistryVisualization.js` - 3Dmol.js wrapper for molecular structures
- `PlotlyVisualization.js` - Plotly wrapper for scientific 3D plots
- Enhanced `VisualAidRenderer.js` - Auto-detects and routes visualization types

### Enhanced AI Integration
- 🤖 **Updated `generateExplanation` prompt** with comprehensive 3D visualization instructions
- 📚 **5 Visualization Types** supported:
  1. Chart.js (pie, bar, line) for 2D data
  2. Three.js 3D for geometric shapes
  3. Plotly 3D for scientific plots
  4. Chemistry 3Dmol for molecules
  5. SVG for simple 2D diagrams
- 🎯 **Selection Guide** - AI knows when to use each type
- 📝 **Progressive Visuals** - Step-by-step 3D construction
- 💡 **Examples** for each visualization type

### Packages Installed
- `three@0.160.0` - 3D WebGL rendering library
- `plotly.js@2.27.1` - Interactive scientific visualizations
- `react-plotly.js@2.6.0` - React wrapper for Plotly
- `katex@0.16.9` - Math formula rendering
- `react-katex@3.0.1` - React wrapper for KaTeX

### Documentation
- ✅ Created `3D_VISUALIZATION_GUIDE.md` - Comprehensive guide with examples
- ✅ Subject-specific examples (Geometry, Chemistry, Calculus, Statistics)
- ✅ JSON format specifications for each visualization type
- ✅ Interactive features documentation

### Benefits
- 🎓 **For Students:**
  - Visualize complex 3D concepts interactively
  - Understand chemistry through 3D molecules
  - See mathematical surfaces come to life
  - Better retention through visual learning
  - Explore geometric shapes from all angles

- 👨‍🏫 **For Teachers:**
  - No manual 3D modeling required
  - AI generates appropriate visuals automatically
  - Progressive step-by-step visualizations
  - Bilingual support with visuals
  - Works for Math, Science, Chemistry, Biology

### Use Cases
- **Geometry:** Draw and explore 3D shapes (cubes, spheres, pyramids, polyhedra)
- **Calculus:** Visualize 3D surfaces and functions
- **Chemistry:** View molecular structures in 3D
- **Physics:** Vector fields, parametric curves
- **Statistics:** Interactive 3D data plots
- **Biology:** (Future) Animated cell diagrams, DNA structures

---

## [2.1.2] - 2025-11-26

### Fixed
- 🐛 **CRITICAL: Fixed `TypeError: e.split is not a function` crash**
  - Added type checking in `formatMarkdown()`: Validates text is string before `.split()`
  - Added type checking in `formatText()`: Validates html is string before `.split()`  
  - Added safe navigation for `utterance.lang.split()`: Uses default 'en' if lang is undefined
  - Prevents app crashes when AI returns non-string values (objects, arrays, null)

### Technical Details
**Root Cause:**
- AI responses sometimes return non-string values
- Code was calling `.split()` without type validation
- This caused TypeErrors when rendering AI content

**Type Safety Pattern Applied:**
```javascript
// BEFORE (unsafe):
if (!text) return null;
return text.split('\n')...

// AFTER (type-safe):
if (!text || typeof text !== 'string') return null;
return text.split('\n')...
```

**All .split() calls now type-safe:**
- ✅ `formatMarkdown(text)` - checks `typeof text === 'string'`
- ✅ `formatText(html)` - checks `typeof html === 'string'`
- ✅ `utterance.lang.split()` - uses safe navigation `(lang || 'en').split()`

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
