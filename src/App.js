import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, AppBar, Toolbar, IconButton, Fab, Tooltip, Chip, Badge, ThemeProvider, CssBaseline, useMediaQuery, BottomNavigation, BottomNavigationAction, List, ListItem, ListItemIcon, ListItemText, Divider, SwipeableDrawer, Paper, Avatar, Typography, Button } from '@mui/material';
import { Settings as SettingsIcon, Dashboard as DashboardIcon, AutoAwesome, LocalLibrary as LibraryIcon, AdminPanelSettings, HelpOutline as HelpIcon, Menu as MenuIcon, PictureAsPdf as PdfIcon, Psychology as AiIcon, Close as CloseIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import packageJson from '../package.json';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase/config';
import PDFViewer from './components/PDFViewer';
import AIModePanel from './components/AIModePanel';
import Dashboard from './components/Dashboard';
import LandingDashboard from './components/LandingDashboard';  // v10.7.38: Merged landing + dashboard
import LearningHubsList from './components/LearningHubsList';  // v10.6.2: Hub management
import LearningHubView from './components/LearningHubView';    // v10.6.3: 3-panel hub interface
import EnhancedSettingsDialog from './components/EnhancedSettingsDialog';
import AdminDashboard from './components/AdminDashboard';
import AdminOTPDialog from './components/AdminOTPDialog';
import AuthButton from './components/AuthButton';
// VyonnChatbot is now integrated into AIModePanel as a tab (v7.2.30)
import SubscriptionDialog from './components/SubscriptionDialog';
import SubscriptionBanner from './components/SubscriptionBanner';  // v11.0.4: Subscription status banner
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
import { getDueCards, getStreakInfo } from './services/spacedRepetitionService';
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

// v10.1: Onboarding Tour for First-Time Users
import OnboardingTour, { FirstTimeUserButton } from './components/OnboardingTour';

// v7.0.0: Google Drive Integration
import { initializeGoogleDrive, hasDrivePermissions } from './services/googleDriveService';
import DrivePermissionDialog from './components/DrivePermissionDialog';

// Textbook Library Browser (Temporarily disabled - v6.1.3)
// import TextbookBrowser from './components/TextbookBrowser';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'hubs', 'hub-view', or 'reader'
  const [currentHub, setCurrentHub] = useState(null); // v10.6.0: Currently viewing hub
  const [pdfSourceHub, setPdfSourceHub] = useState(null); // v10.6.1: Hub context when viewing PDF from hub
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
  
  // v7.2.10: Mobile responsiveness - use direct media query strings (no theme dependency)
  const isMobile = useMediaQuery('(max-width:899px)'); // < 900px (md breakpoint)
  const isSmallMobile = useMediaQuery('(max-width:599px)'); // < 600px (sm breakpoint)
  const [mobileView, setMobileView] = useState('pdf'); // 'pdf' or 'ai' - which panel to show on mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // v10.1: Onboarding Tour state
  const [runTour, setRunTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  
  // Layout state - resizable divider (percentage for PDF viewer, rest for AI panel)
  const [pdfWidth, setPdfWidth] = useState(50); // 50% by default
  const [isResizing, setIsResizing] = useState(false);
  
  // Library state
  const [currentLibraryItem, setCurrentLibraryItem] = useState(null);
  const [libraryCount, setLibraryCount] = useState(0);
  const [hubCount, setHubCount] = useState(0);
  const autoSaveIntervalRef = useRef(null);
  const lastSavedPageRef = useRef(null);

  // AI Panel Tab Control (for Vyonn integration)
  const [aiPanelTab, setAiPanelTab] = useState(0);
  const [vyonnQuery, setVyonnQuery] = useState(null); // Query from Vyonn to pass to Smart Explain
  
  // Subscription state
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const subscription = useSubscription(user?.uid, user?.email);

  // ===== NEW FEATURES STATE =====

  // Phase 1: Spaced Repetition
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [dueCardCount, setDueCardCount] = useState(0);
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, longestStreak: 0 });

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

  // v7.0.0: Google Drive Integration
  const [showDrivePermissionDialog, setShowDrivePermissionDialog] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveInitialized, setDriveInitialized] = useState(false);

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

  // v10.7.38: Handle sign-in from landing page
  const handleSignIn = async () => {
    if (!isFirebaseConfigured) {
      alert(
        "🔧 Firebase Not Configured\n\n" +
        "Google Sign-In requires Firebase setup. You have two options:\n\n" +
        "1. Continue WITHOUT Sign-In (Recommended for quick start)\n" +
        "   - App works fully\n" +
        "   - Store API key locally\n" +
        "   - Notes saved in browser\n\n" +
        "2. Set up Firebase (For cloud sync)\n" +
        "   - Enable Google Sign-In\n" +
        "   - Sync across devices\n\n" +
        "Click OK to continue without sign-in."
      );
      return;
    }

    if (!auth || !googleProvider) {
      alert("Firebase initialization failed. Please check your Firebase configuration.");
      return;
    }

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Firebase authentication successful');

      // Extract OAuth access token from credential
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        console.log('✅ OAuth access token stored from Firebase credential');
      }
    } catch (error) {
      console.error('❌ Sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        alert(`Sign-in failed: ${error.message}`);
      }
    }
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
    
    // Reload periodically when on dashboard or library views
    // Using 30 seconds instead of 2 seconds to reduce API calls and log noise
    const interval = setInterval(() => {
      if (view === 'dashboard' || view === 'library') {
        loadLibraryCount();
      }
    }, 30000); // Check every 30 seconds when on relevant views
    
    return () => clearInterval(interval);
  }, [view]);

  // Load hub count
  useEffect(() => {
    const loadHubCount = async () => {
      try {
        const { default: learningHubService } = await import('./services/learningHubService');
        const hubs = await learningHubService.getAllLearningHubs();
        setHubCount(hubs.length);
      } catch (error) {
        console.error('Failed to load hub count:', error);
      }
    };
    
    loadHubCount();
    
    // Reload periodically when on dashboard or hubs views
    const interval = setInterval(() => {
      if (view === 'dashboard' || view === 'hubs' || view === 'hub-view') {
        loadHubCount();
      }
    }, 30000); // Check every 30 seconds when on relevant views
    
    return () => clearInterval(interval);
  }, [view]);

  // ===== NEW FEATURES EFFECTS =====

  // Phase 1: Check due flashcards and streak
  useEffect(() => {
    const checkDueCards = async () => {
      if (user?.uid) {
        try {
          const dueCards = await getDueCards(user.uid);
          setDueCardCount(dueCards.length);
          
          // Also load streak info
          const streak = await getStreakInfo(user.uid);
          setStreakInfo(streak);
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
    let saveInterval = null;
    
    if (user && selectedFile && view === 'reader') {
      const sessionId = `session_${Date.now()}`;

      // Initialize cognitive load tracker
      cognitiveTrackerRef.current = new CognitiveLoadTracker(user.uid, sessionId);

      // Initialize session history tracker - v7.2.12: Pass book title and pdfId
      const bookTitle = currentLibraryItem?.collection || currentLibraryItem?.name || selectedFile.name.replace('.pdf', '');
      const chapterTitle = currentLibraryItem?.chapterTitle || currentLibraryItem?.name || '';
      
      sessionTrackerRef.current = new SessionHistoryTracker(
        user.uid,
        sessionId,
        bookTitle,  // Use collection/book title instead of file name
        chapterTitle,
        pdfId,      // Pass pdfId for click-to-open functionality
        currentLibraryItem?.subject || 'Unknown'
      );

      console.log('🧠 Trackers initialized');
      
      // v7.2.10: Auto-save session every 30 seconds while reading
      saveInterval = setInterval(() => {
        if (sessionTrackerRef.current) {
          sessionTrackerRef.current.saveSession().catch(err => 
            console.warn('⚠️ Auto-save session failed:', err)
          );
          console.log('💾 Session auto-saved');
        }
      }, 30000); // Save every 30 seconds
    }

    return () => {
      // Clear the auto-save interval
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      
      // Save sessions on unmount
      if (cognitiveTrackerRef.current) {
        cognitiveTrackerRef.current.saveSession();
      }
      if (sessionTrackerRef.current) {
        sessionTrackerRef.current.saveSession();
        console.log('💾 Session saved on exit');
      }
    };
  }, [user, selectedFile, view, currentLibraryItem]);
  
  // v7.2.10: Save session when leaving reader view
  useEffect(() => {
    if (view !== 'reader' && sessionTrackerRef.current) {
      sessionTrackerRef.current.saveSession().catch(err => 
        console.warn('⚠️ Save session on view change failed:', err)
      );
      console.log('💾 Session saved - left reader view');
    }
  }, [view]);

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

        // v7.2.2: Initialize Google Drive after successful sign-in
        // Small delay to ensure access token is stored from Firebase credential
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          console.log('📁 Initializing Google Drive...');
          await initializeGoogleDrive();
          setDriveInitialized(true);

          // v7.2.1: Test Drive API connection to diagnose 403 errors
          const { testDriveConnection } = await import('./services/googleDriveService');
          const diagnostics = await testDriveConnection();
          console.log('📊 Drive API diagnostics:', diagnostics);

          // Check if Drive API test was successful
          if (diagnostics.apiCallResult === 'SUCCESS') {
            console.log('✅ Drive connected and ready');
            setDriveConnected(true);
            // Auto-initialize folder structure in background
            const { initializeFolderStructure } = await import('./services/googleDriveService');
            initializeFolderStructure().catch(err => console.warn('Folder init:', err));
          } else {
            // API test failed - show diagnostic dialog
            console.log('⚠️ Drive API test failed. Showing permission dialog...');
            setDriveConnected(false);
            setShowDrivePermissionDialog(true);
          }
        } catch (error) {
          console.error('❌ Error initializing Google Drive:', error);
          // Don't block app if Drive fails - it's an optional feature
          console.warn('Drive features will be unavailable. App will continue in local-only mode.');
        }
      } else if (!currentUser) {
        console.log('Signed out');
        // Reset Drive state on sign-out
        setDriveConnected(false);
        setDriveInitialized(false);
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
  
  const handleOpenFromLibrary = async (libraryItem, hubContext = null) => {
    try {
      console.log('📖 Opening from library:', libraryItem);
      console.log('📄 Library item details:', {
        id: libraryItem.id,
        name: libraryItem.name,
        originalFileName: libraryItem.originalFileName,
        size: libraryItem.size,
        driveFileId: libraryItem.driveFileId,
        fromHub: hubContext?.name || 'None'
      });
      
      // v10.6.1: Store hub context if opening from a hub
      setPdfSourceHub(hubContext);
      
      // Load PDF data from IndexedDB first
      let pdfData = await loadPDFData(libraryItem.id);
      console.log('📦 PDF data from IndexedDB:', pdfData ? `${pdfData.byteLength} bytes` : 'null');
      
      // If not in IndexedDB, try to download from Google Drive
      if (!pdfData && libraryItem.driveFileId) {
        console.log('☁️ PDF not in IndexedDB, downloading from Google Drive...');
        try {
          const { downloadFile } = await import('./services/googleDriveService');
          const driveBlob = await downloadFile(libraryItem.driveFileId);
          pdfData = await driveBlob.arrayBuffer();
          console.log('✅ Downloaded from Drive:', pdfData.byteLength, 'bytes');
          
          // Cache in IndexedDB for future use
          const { openDB } = await import('idb');
          const db = await openDB('ekamanam_library', 2);
          await db.put('pdf_data', { id: libraryItem.id, data: pdfData });
          console.log('💾 Cached PDF in IndexedDB for faster access next time');
        } catch (driveError) {
          console.error('❌ Failed to download from Drive:', driveError);
          throw new Error(`PDF not found locally and failed to download from Google Drive: ${driveError.message}`);
        }
      }
      
      if (!pdfData) {
        throw new Error('PDF data not found. Please re-upload the file.');
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
  
  // v7.2.12: Open a PDF at a specific page (for Learning Journey click-to-open)
  const handleOpenPdfAtPage = async (pdfId, pageNumber) => {
    try {
      console.log(`📖 Opening PDF ${pdfId} at page ${pageNumber}`);
      
      // Load library items to find the one with this pdfId
      const libraryItems = await import('./services/libraryService').then(m => m.getAllLibraryItems());
      const libraryItem = libraryItems.find(item => item.id === pdfId);
      
      if (!libraryItem) {
        console.warn('⚠️ PDF not found in library:', pdfId);
        alert('This PDF is no longer in your library.');
        return;
      }
      
      // Use existing handleOpenFromLibrary but override the page
      await handleOpenFromLibrary({ ...libraryItem, lastPage: pageNumber });
      
      // Ensure we navigate to the correct page after opening
      setTimeout(() => {
        setCurrentPage(pageNumber);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error opening PDF at page:', error);
      alert(`Failed to open PDF: ${error.message}`);
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

  // v7.0.0: Handle Drive permission dialog success
  const handleDrivePermissionSuccess = () => {
    setShowDrivePermissionDialog(false);
    setDriveConnected(true);
    console.log('✅ Drive permissions granted and folders created');
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

    let currentCognitiveLoad = 50; // Default

    // Track with cognitive load
    if (cognitiveTrackerRef.current && pageText) {
      cognitiveTrackerRef.current.startPageReading(newPage, pageText);

      // Update cognitive load display
      currentCognitiveLoad = cognitiveTrackerRef.current.currentLoad;
      setCognitiveLoad(currentCognitiveLoad);

      // Check for break suggestion
      const breakCheck = shouldSuggestBreak(cognitiveTrackerRef.current);
      if (breakCheck.shouldBreak) {
        setBreakSuggestion(breakCheck);
        setShowBreak(true);
      }
    }

    // Track with session history - v7.2.10: Include cognitive load
    if (sessionTrackerRef.current) {
      sessionTrackerRef.current.recordPageView(newPage, pageText, currentCognitiveLoad);
      
      // Record cognitive load spike if high
      if (currentCognitiveLoad > 70) {
        sessionTrackerRef.current.recordCognitiveLoadSpike(currentCognitiveLoad, newPage, 'High cognitive load detected');
      }
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

  // Get the current theme object for the provider
  const currentTheme = useMemo(() => themeMode === 'dark' ? darkTheme : lightTheme, [themeMode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header - v7.2.10: Mobile responsive */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ py: isMobile ? 0.5 : 1, minHeight: isMobile ? 56 : 64 }}>
          {/* Mobile: Back button in reader view */}
          {isMobile && view === 'reader' && (
            <IconButton 
              edge="start" 
              onClick={() => pdfSourceHub ? setView('hub-view') : setView('hubs')}
              sx={{ mr: 1 }}
            >
              <BackIcon />
            </IconButton>
          )}
          
          {/* Language Detection Indicator */}
          {view === 'reader' && selectedFile && (
            <Chip
              label="Language: Auto"
              size="small"
              variant="outlined"
              sx={{ mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}
            />
          )}
          
          {/* Mobile: Menu button */}
          {isMobile && view !== 'reader' && (
            <IconButton 
              edge="start" 
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1, gap: isMobile ? 1 : 2 }}>
            {/* Logo with version underneath */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/Ekamanam_logo.png`}
              alt="Ekamanam"
              sx={{
                  height: isMobile ? 40 : 50,
                width: 'auto',
                  objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
              <Box 
                component="span" 
                sx={{ 
                  fontSize: '0.55rem', 
                  color: 'text.secondary',
                  fontWeight: 500,
                  mt: 0.25
                }}
              >
                v{packageJson.version}
              </Box>
            </Box>
            <Box sx={{ flex: 1, pt: isMobile ? '10px' : '14px', display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.3 }}>
                <Box component="span" sx={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  Ekamanam
                </Box>
                <Chip 
                  label="BETA"
                  size="small"
                  sx={{ 
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: '#ff6b6b',
                    color: 'white',
                    '& .MuiChip-label': {
                      px: 0.8,
                      py: 0
                    }
                  }}
                />
                {/* Subscription Badge - Desktop */}
                <SubscriptionBanner 
                  subscription={subscription} 
                  onUpgrade={() => setShowSubscriptionDialog(true)}
                  isMobile={false}
                  isLoggedIn={!!user}
                  onSignIn={handleSignIn}
                />
              </Box>
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.4 }}>
                One Focus, Limitless Learning
              </Box>
            </Box>
          </Box>
          
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {/* Subscription Badge - Only for paid users (free users badge is on the left) */}
            {subscription.isPaid && (
              <Chip
                label={subscription.tier}
                size="small"
                onClick={() => setShowSubscriptionDialog(true)}
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  },
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

            {/* v10.1: First-Time Users Tour Button - First in list */}
            {/* HIDDEN: Getting Started Button - Commented out per user request v10.7.37
            <FirstTimeUserButton onClick={() => {
              setRunTour(true);
              setTourStepIndex(0);
            }} />
            */}

            <Tooltip title="Home">
              <IconButton 
                onClick={() => setView('dashboard')}
                color="default"
              >
                <DashboardIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={`Learning Hubs${hubCount > 0 ? ` (${hubCount} Hubs)` : ''}`}>
              <IconButton 
                id="library-button"
                onClick={() => setView('hubs')}
                color="default"
                data-tour="library-button"
              >
                <Badge badgeContent={hubCount} color="primary">
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
              <IconButton 
                id="settings-button"
                onClick={() => setShowSettings(true)}
                data-tour="settings-button"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* HIDDEN: Admin Dashboard Button - Commented out per user request v10.7.37
            <Tooltip title="Admin Dashboard">
              <IconButton onClick={() => setShowOTPDialog(true)} color="secondary">
                <AdminPanelSettings />
              </IconButton>
            </Tooltip>
            */}

            <AuthButton user={user} />
          </Box>

          {/* Mobile: Minimal icons */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.5, alignItems: 'center' }}>
            {view === 'reader' && (
              <Chip
                label={`${currentPage}/${totalPages || '?'}`}
                size="small"
                sx={{ fontSize: '0.7rem', height: 24 }}
              />
            )}
            <AuthButton user={user} compact={isMobile} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* v11.0.4: Mobile Subscription Banner - Only show on non-dashboard views */}
      {isMobile && view !== 'dashboard' && (
        <SubscriptionBanner 
          subscription={subscription} 
          onUpgrade={() => setShowSubscriptionDialog(true)}
          isMobile={true}
          isLoggedIn={!!user}
          onSignIn={handleSignIn}
        />
      )}

      {/* v7.2.10: Mobile Navigation Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpen={() => setMobileMenuOpen(true)}
        sx={{ display: { md: 'none' } }}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src={`${process.env.PUBLIC_URL}/Ekamanam_logo.png`}
                alt="Ekamanam"
                sx={{ height: 32 }}
              />
              <Box sx={{ fontWeight: 600 }}>Ekamanam</Box>
            </Box>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          
          <List>
            <ListItem button onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            <ListItem button onClick={() => { setView('hubs'); setMobileMenuOpen(false); }}>
              <ListItemIcon>
                <Badge badgeContent={hubCount} color="primary">
                  <LibraryIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Learning Hubs" secondary={hubCount > 0 ? `${hubCount} Hubs` : null} />
            </ListItem>
          </List>
          
          <Divider />
          
          <List>
            <ListItem button onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            
            <ListItem button onClick={() => { window.open(`${process.env.PUBLIC_URL}/landing.html`, '_blank'); setMobileMenuOpen(false); }}>
              <ListItemIcon><HelpIcon /></ListItemIcon>
              <ListItemText primary="Help & Guide" />
            </ListItem>
            
            {/* HIDDEN: Admin Dashboard Button - Commented out per user request v10.7.37
            <ListItem button onClick={() => { setShowOTPDialog(true); setMobileMenuOpen(false); }}>
              <ListItemIcon><AdminPanelSettings /></ListItemIcon>
              <ListItemText primary="Admin Dashboard" />
            </ListItem>
            */}
          </List>

          <Divider />
          
          {/* Subscription info */}
          <Box sx={{ p: 2 }}>
            <Chip
              label={
                subscription.isFree && subscription.remainingQueries !== undefined
                  ? `FREE (${subscription.remainingQueries}/${subscription.usage?.limit || 3} left)`
                  : subscription.tier || 'Free'
              }
              size="small"
              onClick={() => { setShowSubscriptionDialog(true); setMobileMenuOpen(false); }}
              sx={{ width: '100%', justifyContent: 'center' }}
            />
          </Box>
        </Box>
      </SwipeableDrawer>

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
      <Box sx={{ flexGrow: 1, overflow: view === 'dashboard' ? 'auto' : 'hidden' }}>
        {view === 'dashboard' ? (
          <LandingDashboard
            user={user}
            onOpenHubs={() => setView('hubs')}  // v10.7.27: Consolidated into Learning Hubs only
            subscription={subscription}
            onUpgrade={() => setShowSubscriptionDialog(true)}
            onOpenFlashcards={() => setShowFlashcards(true)}
            onOpenTimeline={() => setShowTimeline(true)}
            onOpenDoubtLibrary={() => setShowDoubtLibrary(true)}
            dueCardCount={dueCardCount}
            pdfCount={libraryCount}
            currentStreak={streakInfo.currentStreak}
            onOpenSettings={() => setShowSettings(true)}
            onSignIn={handleSignIn}  // v10.7.38: Sign-in callback for landing page
          />
        ) : view === 'hubs' ? (
          // v10.7.27: Learning Hubs List (Consolidated from My Library + Hubs)
          <LearningHubsList
            onBack={() => setView('dashboard')}
            onOpenHub={(hub) => { setCurrentHub(hub); setView('hub-view'); }}
          />
        ) : view === 'hub-view' ? (
          // v10.6.3: 3-Panel Hub View (Sources | Hub Chat | Materials)
          <LearningHubView
            hub={currentHub}
            onBack={() => setView('hubs')}
            onOpenPdf={(pdf) => handleOpenFromLibrary(pdf, currentHub)}
            onOpenFlashcards={() => setShowFlashcards(true)}
            onOpenTimeline={() => setShowTimeline(true)}
            user={user}
            subscription={subscription}
            onUpgrade={() => setShowSubscriptionDialog(true)}
          />
        ) : (
          /* v7.2.10: Reader View - Desktop: side-by-side, Mobile: toggle with bottom nav */
          <Box 
            id="pdf-ai-container"
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              position: 'relative',
              userSelect: isResizing ? 'none' : 'auto'
            }}
          >
            {/* Main content area */}
            <Box sx={{ 
              display: 'flex', 
              flexGrow: 1, 
              overflow: 'hidden',
              // On mobile, show only the active panel
              height: isMobile ? 'calc(100% - 56px)' : '100%' // Account for bottom nav on mobile
            }}>
              {/* PDF Viewer - Desktop: left side, Mobile: full width when active */}
            <Box 
              sx={{ 
                  width: isMobile ? '100%' : `${pdfWidth}%`,
                height: '100%',
                  display: isMobile && mobileView !== 'pdf' ? 'none' : 'flex',
                flexDirection: 'column'
              }}
            >
                {/* v10.6.1: Hub Badge - show when viewing PDF from a hub */}
                {pdfSourceHub && (
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      bgcolor: pdfSourceHub.color || '#2196F3',
                      color: 'white',
                      borderBottom: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 28, height: 28, fontSize: '1rem' }}>
                      {pdfSourceHub.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', lineHeight: 1.2 }}>
                        Learning Hub
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                        {pdfSourceHub.name}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setView('hub-view');
                        setPdfSourceHub(null);
                      }}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.5)',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Return to Hub
                    </Button>
                  </Paper>
                )}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
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
                {/* Copyright Disclaimer */}
                <Box sx={{ 
                  px: 1, 
                  py: 0.3, 
                  bgcolor: 'grey.100', 
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  <Box component="span" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                    © 2025 Amandeep Singh Talwar | PDF copyrights belong to respective owners | For personal educational use only
                  </Box>
                </Box>
            </Box>

              {/* Resizable Divider - Desktop only */}
              {!isMobile && (
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
              )}

              {/* AI Mode Panel - Desktop: right side, Mobile: full width when active */}
            <Box 
              sx={{ 
                  width: isMobile ? '100%' : `${100 - pdfWidth}%`,
                height: '100%',
                overflow: 'hidden',
                  display: isMobile && mobileView !== 'ai' ? 'none' : 'flex',
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
                  isMobile={isMobile}
                  pdfMetadata={currentLibraryItem}
                  onOpenSettings={() => setShowSettings(true)}
                  sourceHub={pdfSourceHub}  // v10.6.1: Pass hub context for Hub Chat tab
                  onAIQuery={(queryType, queryText) => {
                    // v7.2.24: Track AI queries for analytics
                    if (sessionTrackerRef.current) {
                      sessionTrackerRef.current.recordAIQuery(queryType, queryText, currentPage, cognitiveLoad);
                    }
                  }}
              />
            </Box>
            </Box>

            {/* v7.2.10: Mobile Bottom Navigation */}
            {isMobile && (
              <BottomNavigation
                value={mobileView}
                onChange={(event, newValue) => setMobileView(newValue)}
                showLabels
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1200,
                  borderTop: 1,
                  borderColor: 'divider',
                  height: 56,
                  '& .MuiBottomNavigationAction-root': {
                    minWidth: 80,
                    py: 1
                  }
                }}
              >
                <BottomNavigationAction 
                  label="PDF" 
                  value="pdf" 
                  icon={<PdfIcon />}
                  sx={{ 
                    '&.Mui-selected': { 
                      color: 'primary.main',
                      '& .MuiBottomNavigationAction-label': { fontWeight: 600 }
                    }
                  }}
                />
                <BottomNavigationAction 
                  label="AI Tutor" 
                  value="ai" 
                  icon={<AiIcon />}
                  sx={{ 
                    '&.Mui-selected': { 
                      color: 'secondary.main',
                      '& .MuiBottomNavigationAction-label': { fontWeight: 600 }
                    }
                  }}
                />
              </BottomNavigation>
            )}
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
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard 
          open={showAdmin} 
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* v7.2.30: Vyonn is now integrated into AIModePanel as a tab */}

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

      {/* Phase 4: Session Timeline - v7.2.12: Added click-to-open */}
      <SessionTimeline
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        userId={user?.uid}
        onOpenPdfAtPage={handleOpenPdfAtPage}
      />

      {/* v7.0.0: Google Drive Permission Dialog */}
      <DrivePermissionDialog
        open={showDrivePermissionDialog}
        onClose={() => setShowDrivePermissionDialog(false)}
        onSuccess={handleDrivePermissionSuccess}
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

      {/* v10.1: Onboarding Tour for First-Time Users */}
      <OnboardingTour
        run={runTour}
        stepIndex={tourStepIndex}
        onStepChange={setTourStepIndex}
        onOpenSettings={() => setShowSettings(true)}
        onCloseSettings={() => setShowSettings(false)}
        onComplete={() => {
          setRunTour(false);
          setTourStepIndex(0);
        }}
      />

      </Box>
    </ThemeProvider>
  );
}

export default App;

