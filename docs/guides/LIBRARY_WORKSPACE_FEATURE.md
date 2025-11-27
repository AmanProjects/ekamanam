# 📚 Ekamanam Library & Workspace Feature Specification

**Version:** 1.0  
**Date:** November 26, 2025  
**Status:** Planning → Implementation  
**Target Users:** Students (Class 6-12, College)

---

## 🎯 **Objective**

Enable students to create a **personal study library** where they can:
- Store multiple textbooks/PDFs in one place
- Organize files into workspaces (by subject, semester, etc.)
- Quickly switch between books without re-uploading
- Resume reading from last position automatically
- Access study materials across devices (optional cloud sync)

---

## 🔴 **Problem Statement**

### **Current Pain Points:**
1. **Re-upload hassle**: Students must upload the same PDF every session
2. **Lost progress**: No way to remember which page they were on
3. **No organization**: Can't group related materials (e.g., all Math books)
4. **Single file focus**: Can only work with one PDF at a time
5. **No quick switching**: Switching textbooks requires full re-upload
6. **Ephemeral experience**: Everything resets on page refresh

### **Impact:**
- ⏱️ **Time wasted**: 2-3 minutes per session re-uploading
- 😤 **Frustration**: Repetitive tasks reduce engagement
- 📉 **Reduced usage**: Students may abandon the tool
- 🎯 **Lost context**: Can't remember which page they studied last

---

## ✅ **Solution Overview**

### **Library & Workspace System**

A comprehensive file management system that allows students to:

```
┌─────────────────────────────────────────────────┐
│  LIBRARY (All Study Materials)                  │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ Workspace 1  │ Workspace 2  │ Workspace 3  │ │
│  │ Class 10     │ Class 11     │ Reference    │ │
│  │              │              │              │ │
│  │ • Telugu     │ • Physics    │ • Dictionary │ │
│  │ • Math       │ • Chemistry  │ • Grammar    │ │
│  │ • Science    │ • Math       │ • Practice   │ │
│  └──────────────┴──────────────┴──────────────┘ │
│                                                  │
│  Quick Access:                                   │
│  • Continue Reading (Last 5 files)               │
│  • Recently Added                                │
│  • Bookmarked                                    │
└─────────────────────────────────────────────────┘
```

---

## 👥 **User Stories**

### **Story 1: First-Time Setup**
**As a** student using Ekamanam for the first time  
**I want to** upload all my textbooks once  
**So that** I don't have to re-upload them every time I study

**Acceptance Criteria:**
- [ ] Can upload multiple PDFs in one session
- [ ] Each PDF is automatically saved to library
- [ ] Can assign name and subject to each PDF
- [ ] Library persists across browser sessions

---

### **Story 2: Quick Resume**
**As a** returning student  
**I want to** see my recently opened books  
**So that** I can continue where I left off with one click

**Acceptance Criteria:**
- [ ] Dashboard shows "Continue Reading" section
- [ ] Shows last 5 opened files with page progress
- [ ] One click opens PDF to exact last page
- [ ] Shows time since last opened (e.g., "2 hours ago")

---

### **Story 3: Organize by Subject**
**As a** student with multiple subjects  
**I want to** organize my books into workspaces  
**So that** I can find the right material quickly

**Acceptance Criteria:**
- [ ] Can create custom workspaces (folders)
- [ ] Can assign PDFs to workspaces
- [ ] Can move PDFs between workspaces
- [ ] Can rename/delete workspaces
- [ ] Workspace names visible in library

---

### **Story 4: Quick Switch**
**As a** student studying multiple subjects  
**I want to** switch between textbooks instantly  
**So that** I can compare content or switch subjects

**Acceptance Criteria:**
- [ ] "Switch Book" button in PDF viewer
- [ ] Shows mini library overlay
- [ ] One click switches to different PDF
- [ ] Preserves notes/cache for original PDF
- [ ] Returns to saved page of new PDF

---

### **Story 5: Search & Find**
**As a** student with many books  
**I want to** search my library  
**So that** I can find specific content quickly

**Acceptance Criteria:**
- [ ] Search bar in library view
- [ ] Search by: file name, subject, workspace
- [ ] Filter by: subject, date added, recently opened
- [ ] Sort by: name, date, progress, alphabetical
- [ ] Instant results (no loading delay)

---

## 🏗️ **Technical Architecture**

### **New Components**

#### **1. `Library.js`**
**Purpose:** Main library view showing all saved PDFs  
**Location:** `src/components/Library.js`  
**Features:**
- Grid/List view toggle
- PDF cards with thumbnail, name, progress
- Add PDF button
- Remove PDF (with confirmation)
- Search & filter bar
- Workspace selector
- Sort options

#### **2. `LibraryCard.js`**
**Purpose:** Individual PDF card in library  
**Location:** `src/components/LibraryCard.js`  
**Shows:**
- Thumbnail (first page preview)
- PDF name
- Page progress (45/120)
- Last opened date
- Subject badge
- Quick actions: Open, Remove, Info

#### **3. `WorkspaceManager.js`**
**Purpose:** Manage workspaces/folders  
**Location:** `src/components/WorkspaceManager.js`  
**Features:**
- Create new workspace
- Rename workspace
- Delete workspace
- Assign PDFs to workspace
- Drag-and-drop organization

#### **4. `QuickAccess.js`**
**Purpose:** "Continue Reading" section on dashboard  
**Location:** `src/components/QuickAccess.js`  
**Shows:**
- Last 5 opened PDFs
- Horizontal scrollable cards
- Quick open button
- Page progress indicator

#### **5. `PDFSwitcher.js`**
**Purpose:** Quick PDF switcher in reader view  
**Location:** `src/components/PDFSwitcher.js`  
**Features:**
- Mini library overlay
- Search within library
- One-click switch
- Keyboard shortcuts (Ctrl+P)

---

### **New Services**

#### **1. `libraryService.js`**
**Purpose:** Manage PDF storage and retrieval  
**Location:** `src/services/libraryService.js`

**Functions:**

```javascript
// Core CRUD
addPDFToLibrary(file, metadata) → Promise<libraryItem>
removePDFFromLibrary(id) → Promise<void>
updateLibraryItem(id, metadata) → Promise<void>
getAllLibraryItems() → Promise<libraryItem[]>
getLibraryItem(id) → Promise<libraryItem>

// PDF Data
savePDFData(id, arrayBuffer) → Promise<void>
loadPDFData(id) → Promise<arrayBuffer>

// Metadata
updateLastPage(id, pageNumber) → Promise<void>
updateLastOpened(id) → Promise<void>
generateThumbnail(pdfData, pageNum) → Promise<dataUrl>

// Workspaces
createWorkspace(name, metadata) → Promise<workspace>
updateWorkspace(id, metadata) → Promise<void>
deleteWorkspace(id) → Promise<void>
assignToWorkspace(pdfId, workspaceId) → Promise<void>

// Queries
getRecentlyOpened(limit) → Promise<libraryItem[]>
getByWorkspace(workspaceId) → Promise<libraryItem[]>
searchLibrary(query) → Promise<libraryItem[]>
getLibraryStats() → Promise<stats>
```

**Storage:** IndexedDB (via `idb` library)

---

#### **2. `storageService.js` (Enhanced)**
**Purpose:** Unified storage abstraction  
**Location:** `src/services/storageService.js`

**Storage Options:**
- **IndexedDB**: Browser-based, offline, fast
- **Firebase Storage**: Cloud-based, synced, requires auth

**Functions:**
```javascript
saveFile(id, data, storageType) → Promise<url>
loadFile(id, storageType) → Promise<data>
deleteFile(id, storageType) → Promise<void>
getStorageInfo() → { used, available, type }
```

---

### **Updated Components**

#### **1. `App.js`**
**New State:**
```javascript
const [library, setLibrary] = useState([]);
const [currentLibraryItem, setCurrentLibraryItem] = useState(null);
const [workspaces, setWorkspaces] = useState([]);
const [view, setView] = useState('dashboard'); // 'dashboard' | 'library' | 'reader'
```

**New Functions:**
```javascript
loadLibrary() → Load all library items on mount
handleAddToLibrary(file) → Add new PDF to library
handleOpenFromLibrary(id) → Open PDF from library
handleRemoveFromLibrary(id) → Remove PDF from library
handleSwitchPDF(newId) → Switch to different PDF
autoSaveProgress() → Save current page every 10s
```

---

#### **2. `Dashboard.js`**
**New Sections:**
- **Hero Section**: Welcome back + stats
- **Quick Access**: Continue Reading (last 5 PDFs)
- **Library Overview**: Total PDFs, subjects, progress
- **Actions**: Add PDF, Browse Library, Create Workspace

---

#### **3. `PDFViewer.js`**
**New Props:**
```javascript
libraryItemId: string // Current library item ID
onPageChange: (page) => void // Auto-save progress
```

**New Features:**
- Auto-save last page every 10 seconds
- Show "Switch Book" button in toolbar
- Display current book name in header

---

## 📊 **Data Structures**

### **Library Item**
```javascript
{
  // Identity
  id: "uuid-v4", // Unique identifier
  type: "pdf", // File type
  
  // Metadata
  name: "Class 10 Telugu - Chapter 5: పద్య భాగం",
  originalFileName: "telugu_chapter5.pdf",
  size: 5242880, // bytes (5 MB)
  dateAdded: "2025-11-26T10:30:00Z",
  lastOpened: "2025-11-26T15:45:00Z",
  
  // Content Info
  totalPages: 120,
  lastPage: 45,
  progress: 37.5, // percentage (45/120 * 100)
  
  // Organization
  subject: "Telugu", // or "Mathematics", "Science", etc.
  workspace: "Class 10", // Workspace/folder name
  workspaceId: "workspace-uuid-1",
  tags: ["poetry", "chapter5", "important"],
  
  // Study Progress
  bookmarks: [10, 23, 45, 67], // Bookmarked pages
  notes: 12, // Number of notes taken
  timeSpent: 7200, // seconds (2 hours)
  completedPages: [1, 2, 3, 4, 5, ..., 45],
  
  // Storage
  storageType: "indexeddb", // or "firebase"
  thumbnailUrl: "data:image/png;base64,iVBORw0KG...", // First page preview
  pdfDataKey: "pdf_data_uuid", // Key in IndexedDB
  firebaseUrl: "gs://ekamanam.appspot.com/library/user123/file.pdf", // If using Firebase
  
  // Cache Keys (for AI responses)
  cachePrefix: "cache_uuid", // Prefix for all cached data for this PDF
  
  // User
  userId: "user-uuid", // Owner (if using Firebase auth)
}
```

---

### **Workspace**
```javascript
{
  id: "workspace-uuid-1",
  name: "Class 10",
  description: "All Class 10 textbooks and materials",
  icon: "📘", // Emoji or icon name
  color: "#1976d2", // Theme color
  dateCreated: "2025-11-20T10:00:00Z",
  lastModified: "2025-11-26T15:00:00Z",
  pdfCount: 5, // Number of PDFs in this workspace
  totalPages: 600, // Sum of all PDF pages
  userId: "user-uuid"
}
```

---

### **Library Stats**
```javascript
{
  totalPDFs: 12,
  totalPages: 1440,
  totalSize: 62914560, // bytes (60 MB)
  completedPDFs: 3,
  inProgressPDFs: 6,
  notStartedPDFs: 3,
  totalNotes: 45,
  totalStudyTime: 28800, // seconds (8 hours)
  subjects: {
    "Telugu": 3,
    "Mathematics": 4,
    "Science": 3,
    "Social Studies": 2
  },
  lastUpdated: "2025-11-26T15:45:00Z"
}
```

---

## 🎨 **UI Design Specifications**

### **1. Enhanced Dashboard**

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🎓 Ekamanam                    [Browse Library] [+ Add PDF] [User ▾] ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  Welcome back, Ravi! 👋                                               ║
║  You've studied 45 pages today across 3 subjects                      ║
║                                                                        ║
║  📊 Your Progress:  [███████░░░] 70% this week                        ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  📖 Continue Reading                                                  ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ║
║  │📘 [Preview] │ │📗 [Preview] │ │📙 [Preview] │ │📕 [Preview] │   ║
║  │ Telugu Ch-5 │ │ Math Ch-3   │ │ Science Ch-2│ │ Social Ch-1 │   ║
║  │ Page 45/120 │ │ Page 12/80  │ │ Page 67/150 │ │ Page 5/100  │   ║
║  │ [███░░] 37% │ │ [█░░░░] 15% │ │ [████░] 44% │ │ [░░░░░] 5%  │   ║
║  │ 2 hours ago │ │ Yesterday   │ │ 2 days ago  │ │ 3 days ago  │   ║
║  │   [Open]    │ │   [Open]    │ │   [Open]    │ │   [Open]    │   ║
║  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   ║
║                                                      [View All →]     ║
╠═══════════════════════════════════════════════════════════════════════╣
║  📚 My Library (12 files)               [Grid ▣] [List ☰] [Search 🔍]║
║                                                                        ║
║  📂 Workspaces:                                                       ║
║  [All] [Class 10 (5)] [Class 11 (4)] [Reference (3)]                ║
║                                                                        ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐║
║  │📘 [Thumb]    │ │📗 [Thumb]    │ │📙 [Thumb]    │ │📕 [Thumb]    │║
║  │Telugu Textbk │ │Math Part 1   │ │Science Bk    │ │Social Std    │║
║  │120 pages     │ │80 pages      │ │150 pages     │ │100 pages     │║
║  │Page 45/120   │ │Page 12/80    │ │Page 67/150   │ │Page 5/100    │║
║  │[█████░] 37%  │ │[██░░░░] 15%  │ │[████░░] 44%  │ │[░░░░░░] 5%   │║
║  │Class 10      │ │Class 10      │ │Class 10      │ │Class 10      │║
║  │[Open] [ⓘ][×]│ │[Open] [ⓘ][×]│ │[Open] [ⓘ][×]│ │[Open] [ⓘ][×]│║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 ║
║  │📗 [Thumb]    │ │📙 [Thumb]    │ │📕 [Thumb]    │  [+ Add More]  ║
║  │...           │ │...           │ │...           │                 ║
║  └──────────────┘ └──────────────┘ └──────────────┘                 ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

### **2. Library View (Full Page)**

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ← Back to Dashboard        📚 My Library                    [User ▾] ║
╠═══════════════════════════════════════════════════════════════════════╣
║  [Search library...                     🔍] [+ Add PDF] [⚙️ Manage]  ║
║                                                                        ║
║  📊 Library Stats:  12 files • 1,440 pages • 60 MB • 8h studied      ║
╠═══════════════════════════════════════════════════════════════════════╣
║  📂 Workspaces:                                                       ║
║  [All (12)] [Class 10 (5)] [Class 11 (4)] [Reference (3)] [+ New]   ║
║                                                                        ║
║  Sort by: [Recently Opened ▾]  View: [Grid ▣] [List ☰]              ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Results: 12 files                                                    ║
║                                                                        ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐║
║  │📘 [Preview]  │ │📗 [Preview]  │ │📙 [Preview]  │ │📕 [Preview]  │║
║  │              │ │              │ │              │ │              │║
║  │Telugu Ch-5   │ │Math Part 1   │ │Science Bk    │ │Social Std    │║
║  │Textbook      │ │Algebra       │ │Physics       │ │History       │║
║  │              │ │              │ │              │ │              │║
║  │120 pages     │ │80 pages      │ │150 pages     │ │100 pages     │║
║  │5.2 MB        │ │3.8 MB        │ │12.5 MB       │ │4.1 MB        │║
║  │              │ │              │ │              │ │              │║
║  │📍 Page 45    │ │📍 Page 12    │ │📍 Page 67    │ │📍 Page 5     │║
║  │[█████░] 37%  │ │[██░░░░] 15%  │ │[████░░] 44%  │ │[░░░░░░] 5%   │║
║  │              │ │              │ │              │ │              │║
║  │📂 Class 10   │ │📂 Class 10   │ │📂 Class 10   │ │📂 Class 10   │║
║  │🏷️ Telugu     │ │🏷️ Math       │ │🏷️ Science    │ │🏷️ Social     │║
║  │📝 12 notes   │ │📝 5 notes    │ │📝 8 notes    │ │📝 2 notes    │║
║  │🔖 4 marks    │ │🔖 2 marks    │ │🔖 6 marks    │ │🔖 1 mark     │║
║  │              │ │              │ │              │ │              │║
║  │⏱️ 2 hrs ago  │ │⏱️ Yesterday  │ │⏱️ 2 days ago │ │⏱️ 3 days ago │║
║  │              │ │              │ │              │ │              │║
║  │  [Open]      │ │  [Open]      │ │  [Open]      │ │  [Open]      │║
║  │[ⓘ Info] [×] │ │[ⓘ Info] [×] │ │[ⓘ Info] [×] │ │[ⓘ Info] [×] │║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘║
║                                                                        ║
║  [Load More (8 remaining)...]                                         ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

### **3. PDF Reader with Switcher**

```
╔═══════════════════════════════════════════════════════════════════════╗
║ 🎓 [📚] Telugu Ch-5 (Page 45/120)        [Switch] [Notes] [Settings] ║
╠═══════════════════════════════════════════════════════════════════════╣
║  ┌─────────────────────┬─────────────────────────────────────────────┐║
║  │                     │                                             │║
║  │                     │  AI Mode Panel                              │║
║  │                     │  [Teacher] [Understand] [Explain]          │║
║  │                     │  [Activities] [Resources] [Notes]           │║
║  │   PDF Canvas        │                                             │║
║  │   (Current Page)    │  Content displays here based on            │║
║  │                     │  selected tab and current page             │║
║  │                     │                                             │║
║  │   [Telugu text      │                                             │║
║  │    content from     │                                             │║
║  │    the PDF page]    │                                             │║
║  │                     │                                             │║
║  └─────────────────────┴─────────────────────────────────────────────┘║
║  [◄ Prev]  Page: [45] / 120  [Next ►]       Progress: [████░] 37%    ║
╚═══════════════════════════════════════════════════════════════════════╝

When user clicks [Switch]:
╔═══════════════════════════════════════════════════════════════════════╗
║  Switch to another book                                         [× ] ║
╠═══════════════════════════════════════════════════════════════════════╣
║  [Search in library...                                    🔍]         ║
║                                                                        ║
║  📖 Recent:                                                           ║
║  • Telugu Ch-5 (current) ✓                                           ║
║  • Math Ch-3 → Click to switch                                       ║
║  • Science Ch-2 → Click to switch                                    ║
║                                                                        ║
║  📂 Class 10:                                                         ║
║  • Telugu Textbook → Click                                           ║
║  • Math Part 1 → Click                                               ║
║  • Science Book → Click                                              ║
║  • Social Studies → Click                                            ║
║                                                                        ║
║  [Browse Full Library →]                                              ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

### **4. Add PDF Dialog**

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Add PDF to Library                                             [× ] ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  Step 1: Select PDF File                                             ║
║  ┌──────────────────────────────────────────────────────────────────┐║
║  │                                                                  │║
║  │              Drag & Drop PDF here                                │║
║  │              or                                                  │║
║  │              [Browse Files]                                      │║
║  │                                                                  │║
║  └──────────────────────────────────────────────────────────────────┘║
║                                                                        ║
║  Or upload multiple files:                                            ║
║  [📄 telugu_ch5.pdf] [📄 math_ch3.pdf] [+ Add More]                  ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Step 2: Add Details (Optional)                                      ║
║                                                                        ║
║  Name: [Telugu Chapter 5 - పద్య భాగం              ]                 ║
║  Subject: [Telugu ▾]                                                  ║
║  Workspace: [Class 10 ▾]  or  [+ Create New Workspace]               ║
║  Tags: [poetry] [chapter5] [important] [+ Add]                       ║
║                                                                        ║
║  Storage: ● Browser (Offline, Fast)                                  ║
║           ○ Cloud (Sync across devices) 🔒 Sign in required          ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                          [Cancel]  [Add to Library]  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ **Performance Optimizations**

### **1. Lazy Loading**
- Don't load all PDF data on library load
- Only load metadata (name, pages, thumbnail)
- Load actual PDF data when user clicks "Open"

### **2. Thumbnail Generation**
- Generate on upload (async, don't block UI)
- Cache in IndexedDB with metadata
- Use lower resolution (200x300px max)
- Fallback to generic icon if generation fails

### **3. Virtualized Lists**
- For libraries with 100+ PDFs
- Only render visible cards (react-window)
- Unload off-screen cards from DOM
- Smooth scrolling performance

### **4. IndexedDB Optimization**
```javascript
// Database Schema
DB: "ekamanam_library" v1
  Store: "library_items" (key: id)
  Store: "pdf_data" (key: id)
  Store: "thumbnails" (key: id)
  Store: "workspaces" (key: id)
  Store: "cache" (key: cacheKey)

// Indexes for fast queries
Index: "lastOpened" on library_items
Index: "workspace" on library_items
Index: "subject" on library_items
Index: "dateAdded" on library_items
```

### **5. Chunked PDF Storage**
- For large PDFs (>50MB), store in chunks
- Load chunks on-demand as user navigates
- Reduces memory footprint
- Faster initial load

### **6. Progressive Thumbnail Loading**
- Show placeholder first
- Load low-res thumbnail (blur)
- Load high-res thumbnail (fade in)
- Smooth visual experience

### **7. Debounced Auto-Save**
- Save last page position every 10 seconds
- Debounce to avoid excessive writes
- Use requestIdleCallback for non-critical saves

### **8. Caching Strategy**
```javascript
// Cache structure per PDF:
cache_<pdfId>_page_<pageNum>_teacher
cache_<pdfId>_page_<pageNum>_explain
cache_<pdfId>_page_<pageNum>_activities
cache_<pdfId>_page_<pageNum>_resources
cache_<pdfId>_page_<pageNum>_wordanalysis

// Cache invalidation:
- Never expire (user must manually clear)
- Provide "Clear cache for this PDF" option
- Show cache size in library item info
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Core Library (Priority 1) - 6-8 hours**

**Goal:** Basic library with add, view, open, remove

**Tasks:**
- [x] Create `libraryService.js` with IndexedDB wrapper
- [ ] Implement `addPDFToLibrary()` function
- [ ] Implement `getAllLibraryItems()` function
- [ ] Implement `loadPDFData()` function
- [ ] Implement `removePDFFromLibrary()` function
- [ ] Create `Library.js` component (grid view)
- [ ] Create `LibraryCard.js` component
- [ ] Update `Dashboard.js` to show library section
- [ ] Update `App.js` to manage library state
- [ ] Add "Save to Library" on PDF upload
- [ ] Add "Open from Library" functionality
- [ ] Implement thumbnail generation (basic)

**Deliverables:**
- ✅ Users can add PDFs to library
- ✅ Users can see all library PDFs in grid
- ✅ Users can open PDF from library
- ✅ Users can remove PDF from library
- ✅ Library persists across sessions

**Success Metrics:**
- Upload → Save → Close → Reopen → PDF still there ✓
- Library loads in < 500ms for 10 PDFs
- No data loss on page refresh

---

### **Phase 2: Progress Tracking (Priority 1) - 4-6 hours**

**Goal:** Remember last page, show progress

**Tasks:**
- [ ] Implement `updateLastPage()` in libraryService
- [ ] Implement `updateLastOpened()` in libraryService
- [ ] Add auto-save in `PDFViewer.js` (every 10s)
- [ ] Update library card to show page progress
- [ ] Add progress bar to library cards
- [ ] Create "Continue Reading" section on dashboard
- [ ] Create `QuickAccess.js` component
- [ ] Implement `getRecentlyOpened()` query
- [ ] Show last 5 opened PDFs on dashboard

**Deliverables:**
- ✅ Current page auto-saved
- ✅ Opening PDF goes to last page
- ✅ Dashboard shows recent PDFs
- ✅ Progress percentage displayed

**Success Metrics:**
- Read to page 45 → Close → Reopen → Opens to page 45 ✓
- Recent files show correct order
- Progress bar matches actual position

---

### **Phase 3: Workspaces (Priority 2) - 4-6 hours**

**Goal:** Organize PDFs into folders/subjects

**Tasks:**
- [ ] Implement workspace CRUD in libraryService
- [ ] Create `WorkspaceManager.js` component
- [ ] Add workspace selector to library view
- [ ] Add workspace field in "Add PDF" dialog
- [ ] Implement workspace filter
- [ ] Add "Create Workspace" button
- [ ] Add "Assign to Workspace" for existing PDFs
- [ ] Add workspace chips to library cards
- [ ] Implement workspace count badges

**Deliverables:**
- ✅ Users can create workspaces
- ✅ Users can assign PDFs to workspaces
- ✅ Users can filter by workspace
- ✅ Workspace names shown on cards

**Success Metrics:**
- Create "Class 10" workspace ✓
- Assign 5 PDFs to it ✓
- Filter shows only those 5 PDFs ✓

---

### **Phase 4: Search & Filter (Priority 2) - 3-4 hours**

**Goal:** Find PDFs quickly in large libraries

**Tasks:**
- [ ] Add search bar to library view
- [ ] Implement fuzzy search on name, subject
- [ ] Add filter by: subject, workspace, date
- [ ] Add sort by: name, date, progress
- [ ] Implement instant search (no delay)
- [ ] Add "Clear filters" button
- [ ] Show result count
- [ ] Highlight search terms in results

**Deliverables:**
- ✅ Search bar functional
- ✅ Instant filtering (< 50ms)
- ✅ Multiple sort options
- ✅ Clear indication of active filters

**Success Metrics:**
- Search "Telugu" → Shows only Telugu PDFs ✓
- Sort by progress → Highest first ✓
- 100 PDFs searched in < 100ms ✓

---

### **Phase 5: Quick Switcher (Priority 2) - 3-4 hours**

**Goal:** Switch PDFs without leaving reader

**Tasks:**
- [ ] Create `PDFSwitcher.js` component
- [ ] Add "Switch Book" button to PDF viewer
- [ ] Implement overlay/modal switcher
- [ ] Show recent + workspace PDFs
- [ ] Add search within switcher
- [ ] One-click switch functionality
- [ ] Add keyboard shortcut (Ctrl+P)
- [ ] Preserve notes/cache on switch
- [ ] Auto-update recently opened

**Deliverables:**
- ✅ "Switch" button in PDF viewer
- ✅ Mini library overlay
- ✅ Instant switching
- ✅ Keyboard shortcuts

**Success Metrics:**
- Click Switch → See overlay in < 100ms ✓
- Click PDF → Switches in < 1s ✓
- No data loss on switch ✓

---

### **Phase 6: Enhanced Metadata (Priority 3) - 2-3 hours**

**Goal:** Rich information for each PDF

**Tasks:**
- [ ] Add subject tags
- [ ] Add custom tags system
- [ ] Add study time tracking
- [ ] Add bookmark system (important pages)
- [ ] Add completed pages tracking
- [ ] Show notes count on library card
- [ ] Add PDF info modal (detailed view)
- [ ] Add edit metadata functionality

**Deliverables:**
- ✅ Tag system functional
- ✅ Study time tracked
- ✅ Bookmarks saved
- ✅ Rich info displayed

---

### **Phase 7: Cloud Sync (Priority 3) - 6-8 hours**

**Goal:** Access library from any device

**Tasks:**
- [ ] Set up Firebase Storage integration
- [ ] Implement `uploadPDFToFirebase()`
- [ ] Implement `downloadPDFFromFirebase()`
- [ ] Add storage type selector (local vs cloud)
- [ ] Implement sync status indicators
- [ ] Add "Upload to Cloud" for existing PDFs
- [ ] Add "Download for Offline" option
- [ ] Handle conflicts (last-write-wins)
- [ ] Show storage usage (Firebase quotas)

**Deliverables:**
- ✅ PDFs can be uploaded to cloud
- ✅ PDFs accessible from any device
- ✅ Offline mode functional
- ✅ Sync status clear

**Success Metrics:**
- Upload on Device A → Access on Device B ✓
- Offline mode works when no internet ✓
- No data loss during sync ✓

---

### **Phase 8: Performance & Polish (Priority 3) - 3-4 hours**

**Goal:** Smooth, fast, professional experience

**Tasks:**
- [ ] Implement virtualized list (react-window)
- [ ] Add loading skeletons
- [ ] Add smooth animations (framer-motion)
- [ ] Optimize thumbnail loading
- [ ] Implement progressive image loading
- [ ] Add error boundaries
- [ ] Add retry logic for failed operations
- [ ] Comprehensive error messages
- [ ] Add tooltips and help text
- [ ] Responsive design for mobile

**Deliverables:**
- ✅ Smooth 60fps scrolling
- ✅ No jank or lag
- ✅ Clear error messages
- ✅ Mobile-friendly

---

## 📱 **Mobile Considerations**

### **Responsive Breakpoints:**
- **Desktop:** > 1024px (3-4 column grid)
- **Tablet:** 768-1024px (2 column grid)
- **Mobile:** < 768px (1 column list)

### **Mobile-Specific Features:**
- Swipe gestures to switch PDFs
- Pull-to-refresh library
- Long-press for quick actions
- Touch-optimized card size
- Simplified toolbar

---

## 🔒 **Security & Privacy**

### **Data Storage:**
- All data stored locally by default (IndexedDB)
- User owns their data (no server required)
- Cloud storage optional (requires sign-in)
- Firebase security rules: Users can only access their own files

### **Privacy:**
- No tracking of reading habits
- No analytics without consent
- No ads or third-party scripts
- Open source (transparent)

### **Data Portability:**
- Export library as JSON
- Backup feature (download all metadata)
- Import library on new device
- No vendor lock-in

---

## 🧪 **Testing Strategy**

### **Unit Tests:**
- `libraryService.js` functions
- Add, remove, update operations
- Query functions (search, filter, sort)

### **Integration Tests:**
- Full workflow: Upload → Save → Load → Open
- Switch between PDFs
- Workspace management

### **Performance Tests:**
- Library with 100 PDFs loads in < 1s
- Search 100 PDFs in < 100ms
- Open PDF from library in < 2s
- Smooth scrolling at 60fps

### **User Acceptance Tests:**
- Student can organize study materials
- Student can resume from last page
- Student can switch subjects quickly
- Student can find specific content

---

## 📈 **Success Metrics**

### **Adoption:**
- 80%+ of users save at least 1 PDF to library
- 60%+ of users create at least 1 workspace
- 50%+ of users have 3+ PDFs in library

### **Engagement:**
- 40% reduction in PDF upload time
- 60% increase in session duration
- 30% increase in pages read per session

### **Performance:**
- Library loads in < 1 second (10 PDFs)
- Search completes in < 100ms
- PDF opens in < 2 seconds
- Zero data loss incidents

### **User Satisfaction:**
- "Library feature" mentioned in 50%+ of positive feedback
- NPS (Net Promoter Score) > 8/10
- Less than 5% report "difficult to use"

---

## 🚧 **Known Limitations & Future Work**

### **Current Limitations:**
- Max PDF size: 100MB (browser storage limits)
- Max library size: 2GB (IndexedDB quota)
- No collaborative features (shared libraries)
- No PDF editing (annotations only)
- No OCR for scanned PDFs (coming in Phase 9)

### **Future Enhancements (Post-MVP):**
- **Smart Recommendations**: "You might also like..."
- **Study Plans**: Scheduled reading lists
- **Progress Reports**: Weekly study summaries
- **Social Features**: Share library with classmates
- **AI-Powered Organization**: Auto-tag, auto-categorize
- **Multi-language Support**: UI in regional languages
- **Offline-First PWA**: Install as app
- **Export Notes**: Download all notes as PDF/MD
- **Flashcards**: Generate from content
- **Quizzes**: Auto-generate from chapters

---

## 🎯 **Development Priorities**

### **Must Have (MVP):**
1. ✅ Phase 1: Core Library
2. ✅ Phase 2: Progress Tracking
3. ✅ Phase 5: Quick Switcher (essential for UX)

### **Should Have (v1.0):**
4. Phase 3: Workspaces
5. Phase 4: Search & Filter

### **Nice to Have (v1.1+):**
6. Phase 6: Enhanced Metadata
7. Phase 7: Cloud Sync
8. Phase 8: Performance & Polish

---

## 📅 **Timeline Estimate**

### **MVP (Phases 1, 2, 5):**
- **Duration:** 2-3 days (16-20 hours)
- **Deliverable:** Functional library with progress tracking and quick switching

### **v1.0 (Phases 1-5):**
- **Duration:** 4-5 days (28-36 hours)
- **Deliverable:** Production-ready library with all core features

### **v1.1 (Phases 1-8):**
- **Duration:** 6-8 days (44-56 hours)
- **Deliverable:** Polished, cloud-enabled, high-performance library

---

## 🔄 **Migration Strategy**

### **For Existing Users:**
- No breaking changes
- Old workflow still works (upload PDF directly)
- New users see "Add to Library" by default
- Existing users see prompt: "Save this PDF for later?"

### **Data Migration:**
- No existing library data to migrate
- Fresh start for all users
- Optional: Import from other tools (future)

---

## 📝 **Documentation Needs**

### **User Documentation:**
- [ ] How to add PDFs to library
- [ ] How to organize with workspaces
- [ ] How to switch between books
- [ ] How to search and filter
- [ ] FAQ: Storage limits, cloud sync, etc.

### **Developer Documentation:**
- [ ] libraryService.js API reference
- [ ] Database schema documentation
- [ ] Component props and usage
- [ ] Contributing guidelines

---

## ✅ **Definition of Done**

A feature is considered "done" when:
- [ ] Code written and tested
- [ ] Unit tests passing (if applicable)
- [ ] Manual testing completed
- [ ] Performance benchmarks met
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] User documentation updated
- [ ] Code reviewed and merged
- [ ] Deployed to production

---

## 🎉 **Conclusion**

This Library & Workspace feature will **transform** Ekamanam from a **single-session tool** into a **long-term study companion** for students. By eliminating the friction of re-uploading PDFs and losing progress, we'll significantly improve user retention and satisfaction.

**Next Steps:**
1. ✅ Review this specification
2. ✅ Get approval to proceed
3. → Start Phase 1 implementation
4. → Iterate based on feedback

---

**Document Version:** 1.0  
**Last Updated:** November 26, 2025  
**Status:** ✅ Ready for Implementation  
**Approved By:** [Pending]

