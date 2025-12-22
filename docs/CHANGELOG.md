# Changelog

All notable changes to the Ekamanam project will be documented in this file.

## [2.5.0] - 2024-11-27

### 🤖 Multi-LLM Integration (MAJOR UPDATE)

#### Added
- **Multi-Provider Architecture**: Support for multiple LLM providers with automatic fallback
  - Google Gemini (primary)
  - Groq (ultra-fast, 14,400 free queries/day)
  - Perplexity (web-connected research)
  - Mistral (open-source option)
- **`llmService.js`**: New unified LLM provider manager
  - Feature-to-provider routing
  - Automatic fallback mechanism
  - Usage tracking and analytics
  - Provider-specific implementations
- **`MultiProviderSettings.js`**: New UI component for configuring multiple API keys
  - Accordion-based provider setup
  - Show/hide API keys toggle
  - Usage statistics display
  - Active provider indicators
- **Comprehensive Documentation**: `docs/guides/MULTI_LLM_INTEGRATION.md`
  - Free LLM options for education
  - Cost comparison and analysis
  - Educational programs and grants
  - Implementation guide
  - Architecture recommendations

#### Changed
- **`geminiService.js`**: Migrated all functions to use `callLLM` from `llmService`
  - `generateTeacherMode`
  - `translateTeacherModeToEnglish`
  - `generateExplanation`
  - `generateActivities`
  - `generateAdditionalResources`
  - `generateWordByWordAnalysis`
  - `generateReadAndUnderstand`
  - `translateExplanationToEnglish`
- **`SettingsDialog.js`**: Enhanced with tab-based UI
  - Multi-Provider tab (recommended)
  - Legacy tab (Gemini only)
  - Integrated `MultiProviderSettings` component
- All `apiKey` parameters made optional for backward compatibility
- All functions now support automatic provider fallback

#### Benefits
- 🚀 **16,000 free queries/day** (Gemini 1,500 + Groq 14,400)
- ⚡ **Ultra-fast responses** (Groq: 300+ tokens/second)
- 🔄 **Automatic fallback** (never fails)
- 💰 **Zero cost** for most educational users
- 🌐 **Web-connected research** (Perplexity for citations)

---

## [2.4.5] - 2024-11-27

### ✨ Editable Selected Text

#### Added
- **Editable text field**: Selected text now appears in a multiline TextField
- **Clear Selection button**: Individual button to clear only the selected text
- **Dynamic button text**: Changes between "Explain Selected Text" and "Analyze This Page"

#### Changed
- Selected text is now editable before explaining
- Clear button now clears both explanation and selected text
- Unified UI for all languages (no regional/English split)

#### Fixed
- Selected text state management
- Clear functionality for Explain tab

---

## [2.4.4] - 2024-11-27

### 🐛 Bug Fixes

#### Fixed
- **Explain tab not showing results**: Added `setExplainResponsePage(currentPage)` to single-chunk processing path
- **Explain tab caching issues**: Removed caching for selected text explanations (only cache full page)
- Improved logging for explain functionality

---

## [2.4.3] - 2024-11-27

### 🔧 Performance Improvements

#### Added
- **Auto-save optimization**: Debounced auto-save for library progress
  - Only saves if page has changed
  - 3-second delay before save
  - 30-second interval
  - Reduces console noise

#### Fixed
- Repeated "Auto-saved progress" console messages
- Race condition in PDF canvas rendering

---

## [2.4.2] - 2024-11-27

### 🐛 Bug Fixes

#### Fixed
- **PDF canvas race condition**: Cannot use the same canvas during multiple render operations
- Implemented render task cancellation mechanism
- Added `renderTaskRef` to track and cancel ongoing renders

---

## [2.4.1] - 2024-11-27

### 🐛 Bug Fixes

#### Fixed
- **Explain Selected Text issues**: Cache key logic and response page tracking
- Removed caching for dynamic selected text
- Improved logging for cache hits/misses
- Added warning when cached data is from different page

---

## [2.4.0] - 2024-11-27

### 📚 Library & Workspace (MAJOR FEATURE)

#### Added
- **My Library**: Store and manage multiple PDF files in browser
- **LibraryService**: IndexedDB-based PDF storage and metadata management
- **Library UI**: Grid view with thumbnails, progress tracking, search
- **Auto-save progress**: Automatically saves current page for each PDF
- **Library statistics**: Total PDFs, total pages, recent activity
- **Documentation**: `docs/guides/LIBRARY_WORKSPACE_FEATURE.md`

#### Components
- `Library.js`: Main library view component
- `LibraryCard.js`: Individual PDF card component
- `libraryService.js`: IndexedDB service for PDF management

---

## [2.3.1] - 2024-11-27

### ✨ Notes Integration

#### Added
- **"Add to Notes" button**: Save explanations to Notes tab
- **Event-driven sync**: Custom events for notes updates
- **Auto-switch to Notes**: Automatically switches tab after adding

#### Fixed
- Notes editor not updating when content added
- Improved UI for "Add to Notes" button

---

## [2.3.0] - 2024-11-27

### 📝 Notes Tab (NEW FEATURE)

#### Added
- **Rich Text Editor**: React-Quill integration for notes
- **Export to PDF**: Save notes as PDF using jsPDF + html2canvas
- **Print functionality**: Direct print from browser
- **Auto-save**: Automatic localStorage backup
- **Clear functionality**: Reset notes with confirmation

#### Components
- `NotesEditor.js`: Full-featured rich text editor

---

## [2.2.6] - 2024-11-27

### 🎨 Visualization Improvements

#### Added
- **CRITICAL instruction for "Draw" commands**: Forces AI to provide actual visualizations
- Enhanced prompts to prevent "instruction to draw" without visual

#### Fixed
- AI instructing to draw but not providing visuals
- Improved Chart.js, SVG, and 3D JSON generation

---

## [2.2.5] - 2024-11-27

### 🧹 Page-Specific Data & Clear Functions

#### Added
- **Page tracking**: Track which page each AI response belongs to
- **Auto-clear on page change**: Clears AI responses when navigating
- **Clear buttons**: Individual clear buttons for each tab
- **Cache warnings**: Warning when displaying cached data from different page

#### Changed
- All AI responses now page-specific
- Clear functions for each tab (Teacher, Explain, Activities, Resources, Word Analysis)
- UI indicators for current page data

---

## [2.2.4] - 2024-11-27

### 🧪 3D Visualization Testing

#### Added
- **Test3DVisualization component**: Dedicated page for testing 3D renders
- Route `/test` for 3D debugging
- Examples for Three.js, Plotly, Chemistry visualizations

---

## [2.2.3] - 2024-11-27

### 🐛 Bug Fixes

#### Fixed
- **Markdown bold/italic not rendering**: Enhanced `formatBoldText` and `formatText` functions
- Type safety for text processing (`split` on non-strings)
- Safe navigation for `utterance.lang`

---

## [2.2.2] - 2024-11-27

### 🎨 Visualization & Formatting

#### Added
- **Markdown bold rendering**: Converts `**text**` to `<strong>`
- **Markdown italic rendering**: Converts `*text*` to `<em>`
- **Step-specific visuals**: Visual aids for each exercise step
- **Bilingual display logic**: Only show English when content is regional

#### Changed
- All questions, steps, and hints now support markdown formatting
- Improved visual aid integration

---

## [2.2.1] - 2024-11-27

### 🔧 AI Prompt Optimization

#### Changed
- **Simplified `generateExplanation` prompt**: Reduced verbosity, clearer instructions
- Added specific 3D visualization examples
- Emphasized concise responses with visuals

#### Fixed
- AI generating long paragraphs instead of visuals
- Improved JSON structure reliability

---

## [2.2.0] - 2024-11-27

### 🎨 3D & Scientific Visualizations (MAJOR UPDATE)

#### Added
- **Three.js support**: 3D geometric shapes (cube, sphere, cone, etc.)
- **Plotly.js support**: 3D scientific plots (surface, scatter, mesh)
- **Chemistry visualization**: 3Dmol.js for molecular structures
- **New dependencies**: `three`, `plotly.js`, `react-plotly.js`, `katex`, `react-katex`
- **Documentation**: `docs/guides/3D_VISUALIZATION_GUIDE.md`

#### Components
- `ThreeDVisualization.js`: Three.js renderer
- `ChemistryVisualization.js`: 3Dmol.js renderer
- `PlotlyVisualization.js`: Plotly renderer

#### Changed
- `VisualAidRenderer.js`: Rewritten to dynamically import 3D components
- Chart.js registration: Added all necessary controllers
- AI prompts: Enhanced for 3D visualization generation

---

## [2.1.2] - 2024-11-27

### 🐛 Type Safety

#### Fixed
- **Type safety checks**: Ensure `text` and `html` are strings before calling `.split()`
- Safe navigation for `utterance.lang`
- Prevents `split is not a function` errors

---

## [2.1.1] - 2024-11-27

### 🐛 Chart.js Fix

#### Added
- Registered all Chart.js components and controllers
- `ArcElement`, `BarController`, `PieController`, `LineController`, etc.

#### Fixed
- `"bar" is not a registered controller` error
- `"pie" is not a registered controller` error

---

## [2.1.0] - 2024-11-27

### 🎨 Visual Aids for Math/Science

#### Added
- **VisualAidRenderer component**: Intelligently renders visual aids
- Support for Chart.js (pie, bar, line charts)
- Support for SVG graphics
- Auto-fix for common SVG issues

#### Changed
- AI prompts enhanced for visual generation
- Explain tab now shows step-by-step visuals

---

## [2.0.0] - 2024-11-27

### 🚀 React Migration (MAJOR UPDATE)

#### Added
- Complete migration from standalone HTML to React + MUI
- Component-based architecture
- Improved state management
- Professional UI/UX with Material-UI
- Side-by-side PDF and AI panels

#### Components
- `App.js`: Main application orchestrator
- `Dashboard.js`: Landing page
- `PDFViewer.js`: PDF rendering component
- `AIModePanel.js`: AI features panel
- `SettingsDialog.js`: API key management
- `AuthButton.js`: Firebase authentication
- `FocusMonitor.js`: Camera-based focus tracking

#### Services
- `geminiService.js`: Gemini AI integration
- `cacheService.js`: IndexedDB caching
- `firebase/config.js`: Firebase configuration

---

## Version Naming Convention

- **Major (X.0.0)**: Breaking changes, complete rewrites
- **Minor (x.X.0)**: New features, significant updates
- **Patch (x.x.X)**: Bug fixes, small improvements
