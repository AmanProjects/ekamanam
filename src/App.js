import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, AppBar, Toolbar, IconButton, Fab, Tooltip, Chip, Badge, ThemeProvider, CssBaseline } from '@mui/material';
import { Settings as SettingsIcon, Dashboard as DashboardIcon, AutoAwesome, LocalLibrary as LibraryIcon, AdminPanelSettings, HelpOutline as HelpIcon } from '@mui/icons-material';
import packageJson from '../package.json';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import PDFViewer from './components/PDFViewer';
import AIModePanel from './components/AIModePanel';
import Dashboard from './components/Dashboard';
import StudentLibrary from './components/StudentLibrary';
import EnhancedSettingsDialog from './components/EnhancedSettingsDialog';
import AdminDashboard from './components/AdminDashboard';
import AdminOTPDialog from './components/AdminOTPDialog';
import AuthButton from './components/AuthButton';
import VyonnChatbot from './components/VyonnChatbot';
import SubscriptionDialog from './components/SubscriptionDialog';
import { lightTheme, darkTheme, getThemePreference } from './theme.js';
import {
  addPDFToLibrary,
  loadPDFData,
  updateLastPage,
  generateThumbnail
} from './services/libraryService';
import { useSubscription } from './hooks/useSubscription';

// ===== NEW FEATURES =====
// Phase 1: Spaced Repetition
import { getDueCards } from './services/spacedRepetitionService';
import FlashcardReview from './components/FlashcardReview';

// Phase 2: Cognitive Load
import { CognitiveLoadTracker, shouldSuggestBreak } from './services/cognitiveLoadService';
import CognitiveLoadGauge from './components/CognitiveLoadGauge';
import BreakSuggestion from './components/BreakSuggestion';

// Phase 3: Doubt Prediction
import { predictDoubts } from './services/doubtPredictionService';
import DoubtPredictionDialog from './components/DoubtPredictionDialog';
import DoubtLibrary from './components/DoubtLibrary';

// Phase 4: Session History
import { SessionHistoryTracker } from './services/sessionHistoryService';
import SessionTimeline from './components/SessionTimeline';

// Textbook Library Browser (Temporarily disabled - v6.1.3)
// import TextbookBrowser from './components/TextbookBrowser';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'library', or 'reader'
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfId, setPdfId] = useState(null); // Unique ID for caching
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [pageText, setPageText] = useState('');
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  // Theme state
  const [themeMode, setThemeMode] = useState('light');
  
  // Layout state - resizable divider (percentage for PDF viewer, rest for AI panel)
  const [pdfWidth, setPdfWidth] = useState(50); // 50% by default
  const [isResizing, setIsResizing] = useState(false);
  
  // Library state
  const [currentLibraryItem, setCurrentLibraryItem] = useState(null);
  const [libraryCount, setLibraryCount] = useState(0);
  const autoSaveIntervalRef = useRef(null);
  const lastSavedPageRef = useRef(null);

  // AI Panel Tab Control (for Vyonn integration)
  const [aiPanelTab, setAiPanelTab] = useState(0);
  const [vyonnQuery, setVyonnQuery] = useState(null); // Query from Vyonn to pass to Smart Explain
  
  // Subscription state
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const subscription = useSubscription(user?.uid);

  // ===== NEW FEATURES STATE =====

  // Phase 1: Spaced Repetition
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [dueCardCount, setDueCardCount] = useState(0);

  // Phase 2: Cognitive Load
  const cognitiveTrackerRef = useRef(null);
  const sessionTrackerRef = useRef(null);
  const [cognitiveLoad, setCognitiveLoad] = useState(50);
  const [showBreak, setShowBreak] = useState(false);
  const [breakSuggestion, setBreakSuggestion] = useState(null);

  // Phase 3: Doubt Prediction
  const [showDoubtPrediction, setShowDoubtPrediction] = useState(false);
  const [doubtHotspots, setDoubtHotspots] = useState([]);
  const [showDoubtLibrary, setShowDoubtLibrary] = useState(false);

  // Phase 4: Session History
  const [showTimeline, setShowTimeline] = useState(false);

  // Textbook Library Browser (Temporarily disabled - v6.1.3)
  // const [showTextbookBrowser, setShowTextbookBrowser] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = getThemePreference();
    setThemeMode(savedTheme);
  }, []);

  // Check for payment success/cancel in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      alert('🎉 Payment successful! Your subscription is now active.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled. You can try again anytime!');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Memoize theme object
  const theme = useMemo(() => {
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode]);

  // Handle theme change from settings
  const handleThemeChange = (newMode) => {
    setThemeMode(newMode);
  };

  // Handle divider resize
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const container = document.getElementById('pdf-ai-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 15% and 85%
    if (newWidth >= 15 && newWidth <= 85) {
      setPdfWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  // Load library count
  useEffect(() => {
    const loadLibraryCount = async () => {
      try {
        const { default: libraryService } = await import('./services/libraryService');
        const pdfs = await libraryService.getAllLibraryItems();
        setLibraryCount(pdfs.length);
      } catch (error) {
        console.error('Failed to load library count:', error);
      }
    };
    
    loadLibraryCount();
    
    // Reload when view changes to dashboard or library
    const interval = setInterval(() => {
      if (view === 'dashboard' || view === 'library') {
        loadLibraryCount();
      }
    }, 2000); // Check every 2 seconds when on relevant views
    
    return () => clearInterval(interval);
  }, [view]);

  // ===== NEW FEATURES EFFECTS =====

  // Phase 1: Check due flashcards
  useEffect(() => {
    const checkDueCards = async () => {
      if (user?.uid) {
        try {
          const dueCards = await getDueCards(user.uid);
          setDueCardCount(dueCards.length);
        } catch (error) {
          console.error('Error checking due flashcards:', error);
        }
      }
    };

    checkDueCards();
    // Check every minute when user is active
    const interval = setInterval(checkDueCards, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Phase 2 & 4: Initialize cognitive load and session trackers
  useEffect(() => {
    if (user && selectedFile && view === 'reader') {
      const sessionId = `session_${Date.now()}`;

      // Initialize cognitive load tracker
      cognitiveTrackerRef.current = new CognitiveLoadTracker(user.uid, sessionId);

      // Initialize session history tracker
      sessionTrackerRef.current = new SessionHistoryTracker(
        user.uid,
        sessionId,
        selectedFile.name,
        currentLibraryItem?.subject || 'Unknown'
      );

      console.log('🧠 Trackers initialized');
    }

    return () => {
      // Save sessions on unmount
      if (cognitiveTrackerRef.current) {
        cognitiveTrackerRef.current.saveSession();
      }
      if (sessionTrackerRef.current) {
        sessionTrackerRef.current.saveSession();
      }
    };
  }, [user, selectedFile, view, currentLibraryItem]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If user signed in, try to load their API key from Firebase
      if (currentUser && db) {
        console.log("✅ Signed in as:", currentUser.email);
        console.log("📡 Attempting to load API key from Firestore...");
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          console.log("📄 Firestore document exists:", userDoc.exists());
          
          if (userDoc.exists()) {
            console.log("📄 Document data:", { hasApiKey: !!userDoc.data().apiKey, email: userDoc.data().email });
          }
          
          if (userDoc.exists() && userDoc.data().apiKey) {
            const cloudApiKey = userDoc.data().apiKey;
            const localApiKey = localStorage.getItem('gemini_pat');
            
            // Only update if different from local
            if (localApiKey !== cloudApiKey) {
              localStorage.setItem('gemini_pat', cloudApiKey);
              console.log('✅ API key loaded from your Google account');
              alert('🎉 API Key Loaded from Your Google Account!');
            } else {
              console.log('✅ API key already up to date');
            }
          } else {
            // User doesn't have API key in cloud
            const localApiKey = localStorage.getItem('gemini_pat');
            if (!localApiKey) {
              console.log('⚠️ No API key found');
              setTimeout(() => {
                if (window.confirm('⚠️ No API Key Found. Would you like to add one now?')) {
                  setShowSettings(true);
                }
              }, 1000);
            } else {
              // User has local key but not in cloud, offer to sync
              console.log('📤 Syncing local API key to your Google account...');
              try {
                await setDoc(
                  userDocRef,
                  {
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    apiKey: localApiKey,
                    lastUpdated: new Date()
                  },
                  { merge: true }
                );
                console.log('✅ Local API key synced to cloud');
                alert('✅ Your API Key Has Been Synced to Cloud!');
              } catch (syncError) {
                console.error('Failed to sync API key:', syncError);
              }
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else if (!currentUser) {
        console.log('Signed out');
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleFileSelect = async (file, saveToLibrary = true) => {
    // Generate unique ID for this PDF (based on name + size + last modified)
    const uniqueId = `${file.name}_${file.size}_${file.lastModified}`;
    setPdfId(uniqueId);
    setSelectedFile(file);
    setCurrentLibraryItem(null); // Clear library item if uploading new file
    console.log(`📚 PDF loaded: ${file.name} (ID: ${uniqueId})`);
    
    // Optionally save to library
    if (saveToLibrary) {
      try {
        // Prompt user for metadata
        const shouldSave = window.confirm('Would you like to save this PDF to your library for quick access later?');
        if (shouldSave) {
          const subject = prompt('Enter subject (e.g., Telugu, Math, Science):', 'General');
          const workspace = prompt('Enter workspace (e.g., Class 10, Class 11):', 'My Files');
          
          const libraryItem = await addPDFToLibrary(file, {
            subject: subject || 'General',
            workspace: workspace || 'My Files',
            userId: user?.uid
          });
          
          setCurrentLibraryItem(libraryItem);
          console.log('✅ PDF saved to library');
        }
      } catch (error) {
        console.error('Error saving to library:', error);
      }
    }
  };

  const handleStartReading = () => {
    if (selectedFile) {
      setView('reader');
    }
  };
  
  const handleOpenFromLibrary = async (libraryItem) => {
    try {
      console.log('📖 Opening from library:', libraryItem);
      console.log('📄 Library item details:', {
        id: libraryItem.id,
        name: libraryItem.name,
        originalFileName: libraryItem.originalFileName,
        size: libraryItem.size
      });
      
      // Load PDF data from IndexedDB
      const pdfData = await loadPDFData(libraryItem.id);
      console.log('📦 PDF data loaded:', pdfData ? `${pdfData.byteLength} bytes` : 'null');
      
      if (!pdfData) {
        throw new Error('PDF data not found in IndexedDB');
      }
      
      // Convert ArrayBuffer to File object
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const fileName = libraryItem.originalFileName || `${libraryItem.name}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      
      console.log('📄 File created:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Set states
      setPdfId(libraryItem.id);
      setSelectedFile(file);
      setCurrentLibraryItem(libraryItem);
      setCurrentPage(libraryItem.lastPage || 1);
      setView('reader');
      
      console.log(`✅ Opened from library: ${libraryItem.name}, Page: ${libraryItem.lastPage}`);
    } catch (error) {
      console.error('❌ Error opening from library:', error);
      alert(`Failed to open PDF from library:\n${error.message}\n\nPlease try re-uploading the file.`);
    }
  };
  
  const handleAddPDF = () => {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileSelect(file, true);
        setView('reader');
      }
    };
    input.click();
  };

  const handleOpenSamplePDF = async (sampleId) => {
    try {
      const samples = {
        'coordinate-geometry': {
          filename: '7.Coordinate Geometry.pdf',
          displayName: 'Coordinate Geometry',
          id: 'sample-coordinate-geometry'
        },
        'freedom-movement': {
          filename: '8th Class-TS-EM-Social Studies-12 –Freedom Movement in Hyderabad State.pdf',
          displayName: 'Freedom Movement in Hyderabad State',
          id: 'sample-freedom-movement'
        }
      };

      const sample = samples[sampleId];
      if (!sample) {
        throw new Error('Sample not found');
      }

      // Fetch the sample PDF from public folder
      const response = await fetch(`${process.env.PUBLIC_URL}/samples/${sample.filename}`);
      const blob = await response.blob();
      const file = new File([blob], sample.displayName + '.pdf', { type: 'application/pdf' });
      
      // Open it without saving to library
      setPdfId(sample.id);
      setSelectedFile(file);
      setCurrentLibraryItem(null);
      setCurrentPage(1);
      setView('reader');
      
      console.log(`✅ Opened sample PDF: ${sample.displayName}`);
    } catch (error) {
      console.error('❌ Error loading sample PDF:', error);
      alert('Failed to load sample PDF. Please try again.');
    }
  };
  
  // Auto-save current page to library (debounced)
  useEffect(() => {
    if (currentLibraryItem && currentPage && view === 'reader') {
      // Clear existing interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      // Debounce: Wait 3 seconds after page change, then save every 10 seconds
      const saveTimeout = setTimeout(() => {
        // Save immediately when page changes
        if (lastSavedPageRef.current !== currentPage) {
          updateLastPage(currentLibraryItem.id, currentPage);
          lastSavedPageRef.current = currentPage;
          console.log(`💾 Progress saved: Page ${currentPage}`);
        }
        
        // Then set interval for periodic saves (if user stays on same page)
        autoSaveIntervalRef.current = setInterval(() => {
          // Only save if still on same page (redundant save for safety)
          if (lastSavedPageRef.current === currentPage) {
            updateLastPage(currentLibraryItem.id, currentPage);
            console.log(`💾 Progress auto-saved: Page ${currentPage}`);
          }
        }, 30000); // Save every 30 seconds (less frequent)
      }, 3000); // Wait 3 seconds after page change
      
      return () => {
        clearTimeout(saveTimeout);
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    } else {
      // Clear interval when leaving reader
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLibraryItem, currentPage, view]);
  
  // Generate thumbnail when PDF is loaded
  useEffect(() => {
    if (pdfDocument && currentLibraryItem && !currentLibraryItem.thumbnailUrl) {
      generateThumbnail(currentLibraryItem.id, pdfDocument).catch(err => {
        console.error('Error generating thumbnail:', err);
      });
    }
  }, [pdfDocument, currentLibraryItem]);

  // Enhanced page change handler with tracking
  const handlePageChangeWithTracking = useCallback(async (newPage) => {
    setCurrentPage(newPage);

    // Track with cognitive load
    if (cognitiveTrackerRef.current && pageText) {
      cognitiveTrackerRef.current.startPageReading(newPage, pageText);

      // Update cognitive load display
      const load = cognitiveTrackerRef.current.currentLoad;
      setCognitiveLoad(load);

      // Check for break suggestion
      const breakCheck = shouldSuggestBreak(cognitiveTrackerRef.current);
      if (breakCheck.shouldBreak) {
        setBreakSuggestion(breakCheck);
        setShowBreak(true);
      }
    }

    // Track with session history
    if (sessionTrackerRef.current) {
      sessionTrackerRef.current.recordPageView(newPage, pageText);
    }

    // Phase 3: Predict doubts for new page
    if (pageText && user?.uid) {
      try {
        const hotspots = await predictDoubts(pageText, user.uid);
        if (hotspots.length > 0) {
          setDoubtHotspots(hotspots);
          setShowDoubtPrediction(true);
        }
      } catch (error) {
        console.error('Error predicting doubts:', error);
      }
    }
  }, [pageText, user]);

  const handleTextSelect = (text) => {
    if (text && text.trim()) {
      setSelectedText(text);
      // Get selection position for popup
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPopupPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowAIPopup(true);
      }
    } else {
      setShowAIPopup(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1, gap: 2 }}>
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/Ekamanam_logo.png`}
              alt="Ekamanam"
              sx={{
                height: 56,
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Box sx={{ flex: 1, pt: '18px', display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.3 }}>
                <Box component="span" sx={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  Ekamanam
                </Box>
                <Chip 
                  label={`v${packageJson.version}`}
                  size="small"
                  sx={{ 
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiChip-label': {
                      px: 1.5,
                      py: 0
                    }
                  }}
                />
              </Box>
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.4 }}>
                One Focus, Limitless Learning
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Subscription Badge */}
            {subscription.tier && (
              <Chip
                label={
                  subscription.isFree && subscription.remainingQueries !== undefined
                    ? `FREE (${subscription.remainingQueries}/${subscription.usage?.limit || 3} left)`
                    : subscription.tier
                }
                size="small"
                onClick={() => setShowSubscriptionDialog(true)}
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: { xs: 'none', sm: 'flex' },
                  ...(subscription.isPaid ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }
                  } : {
                    bgcolor: subscription.remainingQueries === 0 ? 'error.light' : 'grey.200',
                    color: subscription.remainingQueries === 0 ? 'error.dark' : 'grey.700',
                    border: '1px solid',
                    borderColor: subscription.remainingQueries === 0 ? 'error.main' : 'grey.300',
                    '&:hover': {
                      bgcolor: subscription.remainingQueries === 0 ? 'error.main' : 'grey.300',
                      borderColor: subscription.remainingQueries === 0 ? 'error.dark' : 'grey.400',
                      color: subscription.remainingQueries === 0 ? 'white' : 'grey.700'
                    }
                  }),
                  transition: 'all 0.2s ease'
                }}
              />
            )}

            {/* Cognitive Load Gauge - Only show in reader view */}
            {view === 'reader' && (
              <CognitiveLoadGauge
                cognitiveLoad={cognitiveLoad}
                size="compact"
                showDetails={false}
              />
            )}

            {/* Flashcard Badge - Show due count */}
            {dueCardCount > 0 && (
              <Tooltip title={`${dueCardCount} flashcard${dueCardCount !== 1 ? 's' : ''} due for review`}>
                <Chip
                  label={`${dueCardCount} due`}
                  size="small"
                  color="warning"
                  onClick={() => setShowFlashcards(true)}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: { xs: 'none', md: 'flex' }
                  }}
                />
              </Tooltip>
            )}

            <Tooltip title="Home">
              <IconButton 
                onClick={() => setView('dashboard')}
                color={view === 'dashboard' ? 'primary' : 'default'}
              >
                <DashboardIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={`My Library${libraryCount > 0 ? ` (${libraryCount} PDFs)` : ''}`}>
              <IconButton 
                onClick={() => setView('library')}
                color={view === 'library' ? 'primary' : 'default'}
              >
                <Badge badgeContent={libraryCount} color="error">
                  <LibraryIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Help & Guide">
              <IconButton 
                onClick={() => window.open(`${process.env.PUBLIC_URL}/landing.html`, '_blank')}
                color="default"
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton onClick={() => setShowSettings(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Admin Dashboard">
              <IconButton onClick={() => setShowOTPDialog(true)} color="secondary">
                <AdminPanelSettings />
              </IconButton>
            </Tooltip>

            <AuthButton user={user} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* AI Analyze Popup */}
      {showAIPopup && selectedText && view === 'reader' && (
        <Tooltip title="Analyze with AI" placement="top">
          <Fab
            color="primary"
            size="small"
            onClick={() => {
              setShowAIPopup(false);
              // The AI panel will automatically pick up the selectedText
            }}
            sx={{
              position: 'fixed',
              left: popupPosition.x,
              top: popupPosition.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 1300,
              animation: 'popIn 0.2s ease-out',
              '@keyframes popIn': {
                from: { transform: 'translate(-50%, -100%) scale(0)', opacity: 0 },
                to: { transform: 'translate(-50%, -100%) scale(1)', opacity: 1 }
              }
            }}
          >
            <AutoAwesome />
          </Fab>
        </Tooltip>
      )}

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {view === 'dashboard' ? (
          <Dashboard
            onOpenLibrary={() => setView('library')}
            subscription={subscription}
            onUpgrade={() => setShowSubscriptionDialog(true)}
            onOpenFlashcards={() => setShowFlashcards(true)}
            onOpenTimeline={() => setShowTimeline(true)}
            onOpenDoubtLibrary={() => setShowDoubtLibrary(true)}
            dueCardCount={dueCardCount}
          />
        ) : view === 'library' ? (
          <StudentLibrary
            onBack={() => setView('dashboard')}
            onOpenPdf={handleOpenFromLibrary}
            onOpenSamplePDF={handleOpenSamplePDF}
          />
        ) : (
          <Box 
            id="pdf-ai-container"
            sx={{ 
              display: 'flex', 
              height: '100%',
              position: 'relative',
              userSelect: isResizing ? 'none' : 'auto'
            }}
          >
            {/* Left Side - PDF Viewer */}
            <Box 
              sx={{ 
                width: `${pdfWidth}%`,
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <PDFViewer
                selectedFile={selectedFile}
                pdfDocument={pdfDocument}
                setPdfDocument={setPdfDocument}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onTextSelect={handleTextSelect}
                onPageTextExtract={setPageText}
              />
            </Box>

            {/* Resizable Divider */}
            <Box
              onMouseDown={handleMouseDown}
              sx={{
                width: '8px',
                height: '100%',
                backgroundColor: 'divider',
                cursor: 'col-resize',
                position: 'relative',
                transition: isResizing ? 'none' : 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  '&::before': {
                    opacity: 1
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '2px',
                  height: '40px',
                  backgroundColor: 'background.paper',
                  borderRadius: '2px',
                  opacity: 0.5,
                  transition: 'opacity 0.2s'
                }
              }}
            />

            {/* Right Side - AI Mode Panel */}
            <Box 
              sx={{ 
                width: `${100 - pdfWidth}%`,
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <AIModePanel
                currentPage={currentPage}
                totalPages={totalPages}
                pdfId={pdfId}
                selectedText={selectedText}
                pageText={pageText}
                user={user}
                pdfDocument={pdfDocument}
                activeTab={aiPanelTab}
                onTabChange={setAiPanelTab}
                vyonnQuery={vyonnQuery}
                onVyonnQueryUsed={() => setVyonnQuery(null)}
                subscription={subscription}
                onUpgrade={() => setShowSubscriptionDialog(true)}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Enhanced Settings Dialog */}
      <EnhancedSettingsDialog 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
        user={user}
        onThemeChange={handleThemeChange}
      />

      {/* Admin OTP Dialog */}
      <AdminOTPDialog
        open={showOTPDialog}
        onClose={() => setShowOTPDialog(false)}
        onSuccess={() => {
          setShowOTPDialog(false);
          setShowAdmin(true);
        }}
      />

      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard 
          open={showAdmin} 
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* Vyonn - The Pattern-Seeker (Always Available!) */}
      <VyonnChatbot
        pdfContext={view === 'reader' ? pageText : null}
        currentPage={view === 'reader' ? currentPage : null}
        pdfDocument={view === 'reader' ? pdfDocument : null}
        onSwitchTab={(tabIndex, userQuery) => {
          console.log('🔮 Vyonn: Switching to tab', tabIndex, 'with query:', userQuery);
          if (view === 'reader') {
            setAiPanelTab(tabIndex);
            if (userQuery) {
              setVyonnQuery(userQuery);
            }
          }
        }}
      />

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={showSubscriptionDialog}
        onClose={() => setShowSubscriptionDialog(false)}
        user={user}
        currentTier={subscription.tier}
      />

      {/* ===== NEW FEATURE DIALOGS ===== */}

      {/* Phase 1: Flashcard Review */}
      <FlashcardReview
        open={showFlashcards}
        onClose={() => {
          setShowFlashcards(false);
          // Refresh due card count
          if (user?.uid) {
            getDueCards(user.uid).then(cards => setDueCardCount(cards.length));
          }
        }}
        userId={user?.uid}
      />

      {/* Phase 2: Break Suggestion */}
      <BreakSuggestion
        open={showBreak}
        onClose={() => setShowBreak(false)}
        onTakeBreak={() => {
          if (cognitiveTrackerRef.current && sessionTrackerRef.current) {
            const duration = (breakSuggestion?.suggestedDuration || 5) * 60000;
            cognitiveTrackerRef.current.recordBreak(duration, breakSuggestion?.reason);
            sessionTrackerRef.current.recordBreak(duration, breakSuggestion?.reason);
          }
        }}
        suggestedDuration={breakSuggestion?.suggestedDuration || 5}
        reason={breakSuggestion?.reason || 'Time for a break!'}
      />

      {/* Phase 3: Doubt Prediction & Library */}
      <DoubtPredictionDialog
        open={showDoubtPrediction}
        onClose={() => setShowDoubtPrediction(false)}
        hotspots={doubtHotspots}
        pageNumber={currentPage}
      />

      <DoubtLibrary
        open={showDoubtLibrary}
        onClose={() => setShowDoubtLibrary(false)}
        chapter={currentLibraryItem?.subject || 'General'}
        userId={user?.uid}
      />

      {/* Phase 4: Session Timeline */}
      <SessionTimeline
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        userId={user?.uid}
      />

      {/* Textbook Library Browser (Temporarily disabled - v6.1.3) */}
      {/* <TextbookBrowser
        open={showTextbookBrowser}
        onClose={() => setShowTextbookBrowser(false)}
        onSelectPdf={async (file, metadata) => {
          try {
            // Open the PDF directly in the viewer
            await handleFileSelect({ target: { files: [file] } });

            // Optionally save metadata for later
            if (metadata) {
              console.log('📚 Opened textbook:', metadata);
            }
          } catch (error) {
            console.error('Error opening textbook:', error);
          }
        }}
      /> */}

      </Box>
    </ThemeProvider>
  );
}

export default App;

