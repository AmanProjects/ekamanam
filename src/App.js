import React, { useState, useEffect } from 'react';
import { Box, Grid, AppBar, Toolbar, Button, IconButton, Fab, Tooltip } from '@mui/material';
import { Settings as SettingsIcon, Dashboard as DashboardIcon, AutoAwesome } from '@mui/icons-material';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import PDFViewer from './components/PDFViewer';
import AIModePanel from './components/AIModePanel';
import Dashboard from './components/Dashboard';
import SettingsDialog from './components/SettingsDialog';
import AuthButton from './components/AuthButton';
import FocusMonitor from './components/FocusMonitor';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'reader'
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfId, setPdfId] = useState(null); // Unique ID for caching
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [pageText, setPageText] = useState('');
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
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

  const handleFileSelect = (file) => {
    // Generate unique ID for this PDF (based on name + size + last modified)
    const uniqueId = `${file.name}_${file.size}_${file.lastModified}`;
    setPdfId(uniqueId);
    setSelectedFile(file);
    console.log(`📚 PDF loaded: ${file.name} (ID: ${uniqueId})`);
  };

  const handleStartReading = () => {
    if (selectedFile) {
      setView('reader');
    }
  };

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
            <img 
              src={`${process.env.PUBLIC_URL}/Ekamanam_logo.png`}
              alt="Ekamanam" 
              style={{ height: 40, width: 40, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={view === 'dashboard' ? 'contained' : 'text'}
              startIcon={<DashboardIcon />}
              onClick={() => setView('dashboard')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Library
            </Button>
            <IconButton 
              onClick={() => setView('dashboard')}
              color={view === 'dashboard' ? 'primary' : 'default'}
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <DashboardIcon />
            </IconButton>
            <IconButton onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
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
            onFileSelect={handleFileSelect}
            onStartReading={handleStartReading}
            selectedFile={selectedFile}
          />
        ) : (
          <Grid container sx={{ height: '100%' }}>
            {/* Left Side - PDF Viewer */}
            <Grid item xs={12} md={6} sx={{ height: '100%', borderRight: 1, borderColor: 'divider' }}>
              <PDFViewer
                selectedFile={selectedFile}
              pdfDocument={pdfDocument}
              setPdfDocument={setPdfDocument}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onTextSelect={handleTextSelect}
              onPageTextExtract={setPageText}
              />
            </Grid>

            {/* Right Side - AI Mode Panel */}
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <AIModePanel
                currentPage={currentPage}
                totalPages={totalPages}
                pdfId={pdfId}
                selectedText={selectedText}
                pageText={pageText}
                user={user}
                pdfDocument={pdfDocument}
              />
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Settings Dialog */}
      <SettingsDialog 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
        user={user}
      />

      {/* Focus Monitor Widget */}
      <FocusMonitor />
    </Box>
  );
}

export default App;

