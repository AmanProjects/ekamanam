import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Settings as SettingsIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedText, setSelectedText] = useState('');
  const [pageText, setPageText] = useState('');
  const [focusAlert, setFocusAlert] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleStartReading = () => {
    if (selectedFile) {
      setView('reader');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
            <img 
              src="/Ekamanam_logo.png" 
              alt="Ekamanam" 
              style={{ height: 40, width: 40, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              Ekamanam
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={view === 'dashboard' ? 'contained' : 'text'}
              startIcon={<DashboardIcon />}
              onClick={() => setView('dashboard')}
            >
              Library
            </Button>
            <IconButton onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
            <AuthButton user={user} />
          </Box>
        </Toolbar>
      </AppBar>

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
                onTextSelect={setSelectedText}
                onPageTextExtract={setPageText}
              />
            </Grid>

            {/* Right Side - AI Mode Panel */}
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <AIModePanel
                currentPage={currentPage}
                selectedText={selectedText}
                pageText={pageText}
                user={user}
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
      <FocusMonitor onAlert={setFocusAlert} />
    </Box>
  );
}

export default App;

