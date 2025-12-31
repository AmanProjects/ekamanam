/**
 * Learning Hub View - v10.6.0
 * 
 * NotebookLM-inspired interface for a single Learning Hub
 * Layout: Sources (left) | Chat (center) | Materials & Labs (right)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Avatar,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Drawer,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Chip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Send as SendIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Folder as FolderIcon,
  Psychology as VyonnIcon,
  AutoStories as LearnIcon,
  Psychology as ExplainIcon,
  Sports as ActivitiesIcon,
  FactCheck as ExamIcon,
  Chat as ChatIcon,
  Notes as NotesIcon,
  MenuBook as StudyIcon,
  ChatBubbleOutline as ChatBubbleIcon,
  Menu as MenuIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Style as FlashcardIcon,
  Timeline as TimelineIcon,
  Calculate as MathIcon,
  Science as ChemistryIcon,
  Bolt as PhysicsIcon,
  Code as CodeIcon,
  Public as GlobeIcon
} from '@mui/icons-material';
import learningHubService from '../services/learningHubService';
import libraryService, { loadPDFData } from '../services/libraryService';
import llmService from '../services/llmService';
import { markdownToHtml } from '../utils/markdownRenderer';
import PDFViewer from './PDFViewer';
import AIModePanel from './AIModePanel';
import VoiceInputButton from './VoiceInputButton';
import zipHandler from '../services/zipHandler';
import FlashcardReview from './FlashcardReview';
import SessionTimeline from './SessionTimeline';
import { MathTools, ChemistryTools, PhysicsSimulator, CodeEditor, GlobeViewer } from './tools';

function LearningHubView({ 
  hub, 
  onBack, 
  onOpenPdf, 
  onOpenFlashcards,
  onOpenTimeline,
  user,
  subscription,
  onUpgrade
}) {
  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  
  const [hubData, setHubData] = useState(hub);
  const [hubPdfs, setHubPdfs] = useState([]);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // Add PDFs dialog
  const [addPdfDialogOpen, setAddPdfDialogOpen] = useState(false);
  const [availablePdfs, setAvailablePdfs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // PDF context menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  
  // PDF Viewer states (reusing existing PDFViewer component)
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pageText, setPageText] = useState('');
  
  // Study Materials tab state (for AIModePanel + Hub Chat)
  const [studyTab, setStudyTab] = useState(0);
  
  // Tool dialog states
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMathLab, setShowMathLab] = useState(false);
  const [showChemistry, setShowChemistry] = useState(false);
  const [showPhysics, setShowPhysics] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);
  
  // Resizable panels state
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    loadHubData();
    // Mark hub as accessed
    learningHubService.markHubAccessed(hub.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load PDF file when selected (EXACT SAME CODE as App.js handleOpenFromLibrary)
  useEffect(() => {
    const loadPdfFile = async () => {
      if (!selectedPdf) {
        setPdfFile(null);
        setPdfDocument(null);
        return;
      }

      setPdfLoading(true);
      try {
        console.log('📖 Opening PDF:', selectedPdf.name);
        
        // Load PDF data from IndexedDB first (same as App.js)
        let pdfData = await loadPDFData(selectedPdf.id);
        console.log('📦 PDF data from IndexedDB:', pdfData ? `${pdfData.byteLength} bytes` : 'null');
        
        // If not in IndexedDB, try to download from Google Drive (same as App.js)
        if (!pdfData && selectedPdf.driveFileId) {
          console.log('☁️ PDF not in IndexedDB, downloading from Google Drive...');
          try {
            const { downloadFile } = await import('../services/googleDriveService');
            const driveBlob = await downloadFile(selectedPdf.driveFileId);
            pdfData = await driveBlob.arrayBuffer();
            console.log('✅ Downloaded from Drive:', pdfData.byteLength, 'bytes');
            
            // Cache in IndexedDB for future use (same as App.js)
            const { openDB } = await import('idb');
            const db = await openDB('ekamanam_library', 2);
            await db.put('pdf_data', { id: selectedPdf.id, data: pdfData });
            console.log('💾 Cached PDF in IndexedDB for faster access next time');
          } catch (driveError) {
            console.error('❌ Failed to download from Drive:', driveError);
            throw new Error(`PDF not found locally and failed to download from Google Drive: ${driveError.message}`);
          }
        }
        
        if (!pdfData) {
          throw new Error('PDF data not found. Please re-upload the file.');
        }
        
        // Convert ArrayBuffer to File object (same as App.js)
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const fileName = selectedPdf.originalFileName || `${selectedPdf.name}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });
        
        console.log('📄 File created:', file.name, file.size, 'bytes');
        setPdfFile(file);
      } catch (error) {
        console.error('❌ Error loading PDF:', error);
        alert(`Failed to load PDF: ${error.message}`);
        setSelectedPdf(null);
      } finally {
        setPdfLoading(false);
      }
    };

    loadPdfFile();
  }, [selectedPdf]);

  // Handle panel resizing
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX - 60; // 60 for icon band width
    
    // Constrain between 300px and 600px
    if (newWidth >= 300 && newWidth <= 600) {
      setRightPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const loadHubData = async () => {
    try {
      const [updatedHub, allLibraryPdfs] = await Promise.all([
        learningHubService.getLearningHub(hub.id),
        libraryService.getAllLibraryItems()
      ]);
      
      setHubData(updatedHub);
      
      // Filter PDFs that belong to this hub
      const pdfsInHub = allLibraryPdfs.filter(pdf => 
        updatedHub.pdfIds.includes(pdf.id)
      );
      setHubPdfs(pdfsInHub);
      
      // Get available PDFs not in this hub
      const pdfsNotInHub = allLibraryPdfs.filter(pdf => 
        !updatedHub.pdfIds.includes(pdf.id)
      );
      setAvailablePdfs(pdfsNotInHub);
      
    } catch (error) {
      console.error('❌ Failed to load hub data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Build context from all PDFs in hub
      const hubContext = hubPdfs.length > 0 
        ? `You are helping with a Learning Hub called "${hubData.name}". ${
            hubData.description ? `Description: ${hubData.description}. ` : ''
          }This hub contains ${hubPdfs.length} PDF(s): ${
            hubPdfs.map(p => p.name).join(', ')
          }. The user's question may relate to any of these materials.`
        : `You are helping with a Learning Hub called "${hubData.name}". There are no PDFs in this hub yet.`;

      // Build conversation history
      const conversationContext = messages.length > 0
        ? messages.slice(-4).map(m => 
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
          ).join('\n')
        : '';

      const systemPrompt = `You are Vyonn AI, an intelligent learning assistant for this Learning Hub. ${hubContext}

Your role: Help students understand and learn from their study materials. Answer questions about ANY topics covered in or related to the PDF materials in this hub.

IMPORTANT GUIDELINES:
- If the question is about a topic that COULD BE in the PDFs (physics, chemistry, math, etc.), answer it helpfully
- Students often ask conceptual questions about topics they're studying - this is NORMAL and ENCOURAGED
- Only mention "outside scope" if the question is completely unrelated (e.g., cooking recipes when studying physics)
- Be a helpful tutor, not a gatekeeper

INTERACTIVE TOOLS AVAILABLE:
When a specific tool would help visualize or explore the concept, suggest it using this EXACT format:

"You can use the [TOOL:Math Lab] to practice these calculations!"
"Try the [TOOL:Physics Simulator] to see this in action!"
"Explore this with [TOOL:Chemistry Tools] for 3D visualization!"
"Use [TOOL:Code Editor] to write and test code!"
"Discover more with [TOOL:Globe Viewer]!"

Available tools: Math Lab, Chemistry Tools, Physics Simulator, Code Editor, Globe Viewer

Recent conversation:
${conversationContext}

User's question: ${userMessage}

Provide a helpful, clear, and educational response. If relevant, suggest an interactive tool using the [TOOL:ToolName] format.`;

      const response = await llmService.callLLM(systemPrompt);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please make sure you have configured your API keys in Settings.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Function to render message content with clickable tool links
  const renderMessageWithTools = (content) => {
    // Split content by [TOOL:ToolName] pattern
    const parts = content.split(/(\[TOOL:[^\]]+\])/g);
    
    return parts.map((part, index) => {
      // Check if this part is a tool link
      const toolMatch = part.match(/\[TOOL:([^\]]+)\]/);
      if (toolMatch) {
        const toolName = toolMatch[1];
        return (
          <Chip
            key={index}
            label={toolName}
            color="primary"
            size="small"
            clickable
            icon={
              toolName === 'Math Lab' ? <MathIcon /> :
              toolName === 'Chemistry Tools' ? <ChemistryIcon /> :
              toolName === 'Physics Simulator' ? <PhysicsIcon /> :
              toolName === 'Code Editor' ? <CodeIcon /> :
              toolName === 'Globe Viewer' ? <GlobeIcon /> :
              null
            }
            onClick={() => {
              if (toolName === 'Math Lab') setShowMathLab(true);
              else if (toolName === 'Chemistry Tools') setShowChemistry(true);
              else if (toolName === 'Physics Simulator') setShowPhysics(true);
              else if (toolName === 'Code Editor') setShowCode(true);
              else if (toolName === 'Globe Viewer') setShowGlobe(true);
            }}
            sx={{ mx: 0.5, cursor: 'pointer', fontWeight: 600 }}
          />
        );
      }
      // Regular text - convert markdown to HTML
      return <span key={index} dangerouslySetInnerHTML={{ __html: markdownToHtml(part) }} />;
    });
  };

  const handleAddPdf = async (pdfId) => {
    try {
      await learningHubService.addPdfToHub(hubData.id, pdfId);
      setAddPdfDialogOpen(false);
      loadHubData();
    } catch (error) {
      console.error('❌ Failed to add PDF:', error);
      alert('Failed to add PDF to hub');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Check if it's a ZIP file
      if (zipHandler.isZipFile(file)) {
        alert('ZIP file upload coming soon! For now, please upload individual PDFs.');
        event.target.value = ''; // Reset input
        setUploading(false);
        return;
      }
      
      // Validate PDF
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF or ZIP file');
        event.target.value = ''; // Reset input
        setUploading(false);
        return;
      }
      
      // Simulate upload progress
      setUploadProgress(30);
      
      // Upload PDF to library
      const pdfId = await libraryService.addPDFToLibrary(file, {
        subject: hubData.name,
        class: '',
        customSubject: hubData.description || ''
      });
      
      setUploadProgress(70);
      
      // Add the newly uploaded PDF to this hub
      if (pdfId) {
        await learningHubService.addPdfToHub(hubData.id, pdfId);
      }
      
      setUploadProgress(100);
      
      // Reload hub data
      await loadHubData();
      
      // Close dialog after successful upload
      setTimeout(() => {
        setAddPdfDialogOpen(false);
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Failed to upload file: ' + error.message);
      setUploading(false);
      setUploadProgress(0);
    } finally {
      // Always reset input
      event.target.value = '';
    }
  };

  const handleRemovePdf = async (pdfId) => {
    if (!window.confirm('Remove this PDF from the hub?')) return;
    
    try {
      await learningHubService.removePdfFromHub(hubData.id, pdfId);
      loadHubData();
      setMenuAnchor(null);
    } catch (error) {
      console.error('❌ Failed to remove PDF:', error);
      alert('Failed to remove PDF');
    }
  };

  const handleMenuOpen = (event, pdf) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedPdf(pdf);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPdf(null);
  };

  // Extract page text when PDF page changes (for Learn/Explain tabs)
  // Memoized to prevent PDFViewer re-renders when chat input changes
  const handlePageTextExtract = useCallback((text) => {
    setPageText(text);
  }, []);

  // Memoized empty callback for onTextSelect
  const handleTextSelect = useCallback(() => {}, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Mobile Header */}
      {isMobile && (
        <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1, gap: 1, flexShrink: 0 }}>
          <IconButton size="small" onClick={onBack}>
            <BackIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setMobileDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: hubData.color, width: 28, height: 28, fontSize: '0.9rem' }}>
            {hubData.icon}
          </Avatar>
          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }} noWrap>
            {hubData.name}
          </Typography>
        </Paper>
      )}

      {/* Mobile Drawer for Sources */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: '85%',
            maxWidth: 320
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 2, 
            py: 1.5, 
            bgcolor: 'primary.main', 
            color: 'white'
          }}>
            <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
              Sources
            </Typography>
            <IconButton size="small" onClick={() => setMobileDrawerOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Hub Info */}
          <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Avatar sx={{ bgcolor: hubData.color, mr: 1.5, width: 32, height: 32 }}>
                {hubData.icon}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {hubData.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hubPdfs.length} PDFs
                </Typography>
              </Box>
            </Box>
            {hubData.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                {hubData.description}
              </Typography>
            )}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setMobileDrawerOpen(false);
                setAddPdfDialogOpen(true);
              }}
              fullWidth
              variant="outlined"
            >
              Add PDF or Zip file
            </Button>
          </Box>

          {/* PDF List */}
          <List sx={{ flex: 1, overflow: 'auto', bgcolor: 'white' }}>
            {hubPdfs.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <PdfIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No PDFs yet
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Tap "Add PDF or Zip file" to get started
                </Typography>
              </Box>
            )}
            {hubPdfs.map((pdf) => (
              <React.Fragment key={pdf.id}>
                <ListItem 
                  disablePadding 
                  secondaryAction={
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, pdf)}>
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton 
                    onClick={() => {
                      setSelectedPdf(pdf);
                      setMobileDrawerOpen(false);
                    }}
                    selected={selectedPdf?.id === pdf.id}
                  >
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ bgcolor: 'primary.light' }}>
                        <PdfIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={pdf.name}
                      secondary={`${pdf.totalPages || pdf.pageCount || pdf.numPages || '?'} pages`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: selectedPdf?.id === pdf.id ? 600 : 400,
                        noWrap: true
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content - 4 Panel Layout */}
      <Box ref={containerRef} sx={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>
        {/* LEFT PANEL: Hub Info & PDFs */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            borderRight: '1px solid #e0e0e0',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          {/* Hub Header */}
          <Box sx={{ bgcolor: 'white' }}>
            {/* Panel Title */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              px: 2, 
              py: 1.5, 
              bgcolor: '#1976d2', 
              borderBottom: '1px solid #1565c0' 
            }}>
              <FolderIcon sx={{ mr: 1, color: 'white', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                Sources
              </Typography>
            </Box>

            {/* Hub Info */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton size="small" onClick={onBack} sx={{ mr: 1 }}>
                  <BackIcon />
                </IconButton>
                <Avatar sx={{ bgcolor: hubData.color, mr: 1.5, width: 32, height: 32 }}>
                  {hubData.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {hubData.name} ({hubPdfs.length} PDFs)
                  </Typography>
                </Box>
              </Box>
            {hubData.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                {hubData.description}
              </Typography>
            )}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddPdfDialogOpen(true)}
              fullWidth
              variant="outlined"
            >
              Add PDF or Zip file
            </Button>
          </Box>
          
          {/* PDF List */}
          <List sx={{ flex: 1, overflow: 'auto', bgcolor: 'white' }}>
            {hubPdfs.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <PdfIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No PDFs yet
                </Typography>
              </Box>
            )}
            {hubPdfs.map((pdf) => (
              <React.Fragment key={pdf.id}>
                <ListItem 
                  disablePadding 
                  secondaryAction={
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, pdf)}>
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton 
                    onClick={() => setSelectedPdf(pdf)}
                    selected={selectedPdf?.id === pdf.id}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: hubData.color + '20',
                        borderLeft: `3px solid ${hubData.color}`,
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ bgcolor: '#fef3f2', width: 36, height: 36 }}>
                        <PdfIcon color="error" fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={pdf.name}
                      secondary={`${pdf.totalPages || pdf.pageCount || pdf.numPages || '?'} pages`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 500,
                        sx: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          </Box>
        </Paper>

        {/* CENTER PANEL: PDF Viewer (reusing existing PDFViewer component) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#525659', position: 'relative', minWidth: 0, minHeight: 0 }}>
          {/* PDF Viewer Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: isMobile ? 1.5 : 2, 
            py: isMobile ? 1 : 1.5, 
            bgcolor: '#424242', 
            borderBottom: '1px solid #616161',
            gap: 1
          }}>
            <PdfIcon sx={{ mr: isMobile ? 0.5 : 1, color: 'white', fontSize: isMobile ? 18 : 20 }} />
            <Typography variant={isMobile ? 'caption' : 'subtitle2'} sx={{ color: 'white', fontWeight: 600 }}>
              {isMobile ? 'PDF' : 'PDF Viewer'}
            </Typography>
            {selectedPdf && !isMobile && (
              <Typography variant="caption" sx={{ ml: 2, color: 'rgba(255,255,255,0.7)' }}>
                {selectedPdf.name}
              </Typography>
            )}
            {/* Page Navigation - Mobile & Desktop */}
            {pdfDocument && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                ml: 'auto',
                bgcolor: 'rgba(255,255,255,0.1)',
                px: isMobile ? 1 : 1.5,
                py: 0.5,
                borderRadius: 1
              }}>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                  Page {pdfCurrentPage} / {pdfDocument.numPages}
                </Typography>
              </Box>
            )}
          </Box>

          {pdfLoading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'white'
            }}>
              <CircularProgress sx={{ color: 'white', mb: 2 }} />
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Loading PDF...
              </Typography>
            </Box>
          ) : pdfFile ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <PDFViewer
                selectedFile={pdfFile}
                pdfDocument={pdfDocument}
                setPdfDocument={setPdfDocument}
                currentPage={pdfCurrentPage}
                setCurrentPage={setPdfCurrentPage}
                onTextSelect={handleTextSelect}
                onPageTextExtract={handlePageTextExtract}
              />
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'white'
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <PdfIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom sx={{ opacity: 0.7 }}>
                  Select a PDF
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                  Choose a document from the left panel
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* ICON BAND: Study Material Tools */}
        <Paper
          elevation={0}
          sx={{
            width: 60,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'primary.main',
            borderLeft: '1px solid',
            borderColor: 'primary.dark'
          }}
        >
          {/* Icon Band Header - Empty spacer to match other panel heights */}
          <Box sx={{ 
            width: '100%',
            height: '46px',
            bgcolor: 'primary.main', 
            borderBottom: '1px solid',
            borderColor: 'primary.dark'
          }} />

          {/* Tool Icons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 2 }}>
            <Tooltip title="Learn" placement="right">
            <IconButton
              onClick={() => setStudyTab(0)}
              sx={{
                bgcolor: studyTab === 0 ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <LearnIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Explain" placement="right">
            <IconButton
              onClick={() => setStudyTab(1)}
              sx={{
                bgcolor: studyTab === 1 ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <ExplainIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Activities" placement="right">
            <IconButton
              onClick={() => setStudyTab(2)}
              sx={{
                bgcolor: studyTab === 2 ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <ActivitiesIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exam" placement="right">
            <IconButton
              onClick={() => setStudyTab(3)}
              sx={{
                bgcolor: studyTab === 3 ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <ExamIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Hub Chat" placement="right">
            <IconButton
              onClick={() => setStudyTab(10)}
              sx={{
                bgcolor: studyTab === 10 ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <ChatIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notes" placement="right">
            <IconButton
              onClick={() => setStudyTab(5)}
              sx={{
                bgcolor: studyTab === 5 ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <NotesIcon />
            </IconButton>
          </Tooltip>

          {/* Divider */}
          <Box sx={{ width: '80%', height: '1px', bgcolor: 'rgba(255, 255, 255, 0.3)', my: 1 }} />

          {/* Learning Tools */}
          <Tooltip title="Flashcards" placement="right">
            <IconButton
              onClick={() => setShowFlashcards(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <FlashcardIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Journey" placement="right">
            <IconButton
              onClick={() => setShowTimeline(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <TimelineIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Math Lab" placement="right">
            <IconButton
              onClick={() => setShowMathLab(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <MathIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chemistry" placement="right">
            <IconButton
              onClick={() => setShowChemistry(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <ChemistryIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Physics" placement="right">
            <IconButton
              onClick={() => setShowPhysics(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <PhysicsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Code Editor" placement="right">
            <IconButton
              onClick={() => setShowCode(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Globe Viewer" placement="right">
            <IconButton
              onClick={() => setShowGlobe(true)}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <GlobeIcon />
            </IconButton>
          </Tooltip>
          </Box>
        </Paper>

        {/* RESIZE HANDLE */}
        {/* Draggable resize handle - Desktop only */}
        {!isMobile && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              width: '4px',
              bgcolor: isDragging ? '#9e9e9e' : 'primary.main',
              cursor: 'col-resize',
              '&:hover': {
                bgcolor: '#9e9e9e',
              },
              transition: 'background-color 0.2s',
            }}
          />
        )}

        {/* RIGHT PANEL: AI Mode Panel Content OR Hub Chat + Footer */}
        <Box
          sx={{
            width: isMobile ? 0 : rightPanelWidth,
            minWidth: isMobile ? 0 : 300,
            maxWidth: isMobile ? 0 : 600,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: 'white',
            minHeight: 0,
            // Hide the tab headers from AIModePanel (we use icons instead)
            '& .MuiPaper-root:has(.MuiTabs-root)': {
              display: 'none'
            }
          }}
        >
          {/* Study Materials Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 2, 
            py: 1.5, 
            bgcolor: 'primary.main', 
            borderBottom: '1px solid',
            borderColor: 'primary.dark'
          }}>
            <StudyIcon sx={{ mr: 1, color: 'white', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
              Study Materials
            </Typography>
          </Box>

          {pdfFile && pdfDocument ? (
            studyTab === 10 ? (
              // Hub Chat (Custom Implementation - Compact & Voice-Enabled)
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2, overflow: 'auto', minHeight: 0 }}>
                {/* Compact Header with Clear Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                      Hub Chat
                    </Typography>
                  </Box>
                  {messages.length > 0 && (
                    <Tooltip title="Clear conversation">
                      <IconButton 
                        size="small"
                        onClick={() => setMessages([])}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                {/* Prominent Chat Input with Voice */}
                <Paper elevation={3} sx={{ mb: 1.5, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, p: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      maxRows={3}
                      placeholder="Ask about hub materials..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={chatLoading}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.dark',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                    <VoiceInputButton
                      onTranscript={(text) => setInput(text)}
                      size="medium"
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!input.trim() || chatLoading}
                      sx={{ 
                        minWidth: 48,
                        height: 40,
                        px: 2,
                        boxShadow: 3
                      }}
                    >
                      {chatLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon />}
                    </Button>
                  </Box>
                </Paper>

                {/* Chat Messages - Below Input */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {messages.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      mt: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'inline-flex',
                          mb: 1.5,
                          '@keyframes pulse': {
                            '0%, 100%': {
                              transform: 'scale(1)',
                              opacity: 1,
                            },
                            '50%': {
                              transform: 'scale(1.1)',
                              opacity: 0.8,
                            },
                          },
                          animation: 'pulse 2s ease-in-out infinite',
                        }}
                      >
                        <ChatBubbleIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                        Start a conversation
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ask questions about the materials in this hub
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Paper
                          elevation={msg.role === 'user' ? 2 : 1}
                          sx={{
                            p: 1.25,
                            maxWidth: '85%',
                            bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                            color: msg.role === 'user' ? 'white' : 'text.primary',
                            borderRadius: 2
                          }}
                        >
                          {msg.role === 'user' ? (
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              {msg.content}
                            </Typography>
                          ) : (
                            <Box sx={{ 
                              fontSize: '0.875rem',
                              '& p': { mb: 0.5 },
                              '& ul, & ol': { pl: 2, mb: 0.5 },
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              {renderMessageWithTools(msg.content)}
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    ))
                  )}
                  {chatLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                      <CircularProgress size={18} />
                      <Typography variant="caption" color="text.secondary">
                        Thinking...
                      </Typography>
                    </Box>
                  )}
                  <div ref={chatEndRef} />
                </Box>
              </Box>
            ) : (
              // AIModePanel for other tabs (sourceHub=null to hide duplicate Hub Chat tab)
              <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <AIModePanel
                currentPage={pdfCurrentPage}
                totalPages={pdfDocument?.numPages || 0}
                pdfId={selectedPdf?.id}
                selectedText=""
                pageText={pageText}
                user={user}
                pdfDocument={pdfDocument}
                activeTab={studyTab}
                onTabChange={setStudyTab}
                vyonnQuery={null}
                onVyonnQueryUsed={() => {}}
                subscription={subscription}
                onUpgrade={onUpgrade}
                isMobile={false}
                onAIQuery={() => {}}
                pdfMetadata={selectedPdf}
                onOpenSettings={() => {}}
                sourceHub={null}
              />
              </Box>
            )
          ) : (
            <Box sx={{ 
              flex: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              p: 4
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <PdfIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a PDF
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a document from the left to access AI tools
                </Typography>
              </Box>
            </Box>
          )}

          {/* DISCLAIMER FOOTER - Inside Right Panel Only */}
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
      </Box>

      {/* Mobile Footer - Show only on mobile */}
      {isMobile && (
        <Box sx={{ 
          py: 1, 
          px: 2,
          pr: 10, // Extra padding on right to avoid FAB button
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          bgcolor: 'white',
          flexShrink: 0
        }}>
          <Box component="span" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
            © 2025 Amandeep Singh Talwar | PDF copyrights belong to respective owners | For personal educational use only
          </Box>
        </Box>
      )}

      {/* PDF Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { onOpenPdf(selectedPdf); handleMenuClose(); }}>
          <PdfIcon sx={{ mr: 1 }} fontSize="small" />
          Open PDF
        </MenuItem>
        <MenuItem
          onClick={() => { handleRemovePdf(selectedPdf.id); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Remove from Hub
        </MenuItem>
      </Menu>

      {/* Add PDF Dialog */}
      <Dialog
        open={addPdfDialogOpen}
        onClose={() => setAddPdfDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Add PDF to Hub
          <IconButton
            onClick={() => setAddPdfDialogOpen(false)}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Step 1: Upload */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              Step 1: Upload New PDF or ZIP File
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'block',
                width: '100%',
                p: 4,
                textAlign: 'center',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': !uploading ? { 
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                  borderColor: 'primary.dark',
                  transform: 'scale(1.01)'
                } : {}
              }}
            >
              <UploadIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {uploading ? 'Uploading...' : 'Upload New PDF or ZIP File'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: uploading ? 2 : 0 }}>
                {uploading ? 'Please wait while we upload your file' : 'Add files directly to this hub'}
              </Typography>
              
              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 1,
                      bgcolor: 'rgba(25, 118, 210, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1
                      }
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {uploadProgress}% complete
                  </Typography>
                </Box>
              )}
              
              <input
                type="file"
                hidden
                accept=".pdf,.zip"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </Box>
          </Box>

          {/* Step 2: Select from Library */}
          {availablePdfs.length > 0 && (
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                Step 2: Or Select from Library
              </Typography>
              <List>
                {availablePdfs.map((pdf) => (
                  <ListItem
                    key={pdf.id}
                    secondaryAction={
                      <Button size="small" onClick={() => handleAddPdf(pdf.id)}>
                        Add
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar variant="rounded">
                        <PdfIcon color="error" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={pdf.name}
                      secondary={`${pdf.totalPages || pdf.pageCount || pdf.numPages || '?'} pages`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Flashcards Dialog */}
      <FlashcardReview
        open={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        userId={user?.uid}
        fullScreen={isMobile}
      />

      {/* Timeline Dialog */}
      <SessionTimeline
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        userId={user?.uid}
        fullScreen={isMobile}
        onOpenPdfAtPage={(pdf, page) => {
          setShowTimeline(false);
          if (onOpenPdf) {
            onOpenPdf(pdf);
          }
        }}
      />

      {/* Math Lab Dialog */}
      <MathTools
        open={showMathLab}
        onClose={() => setShowMathLab(false)}
        user={user}
        fullScreen={isMobile}
      />

      {/* Chemistry Dialog */}
      <ChemistryTools
        open={showChemistry}
        onClose={() => setShowChemistry(false)}
        user={user}
        fullScreen={isMobile}
      />

      {/* Physics Dialog */}
      <PhysicsSimulator
        open={showPhysics}
        onClose={() => setShowPhysics(false)}
        user={user}
        fullScreen={isMobile}
      />

      {/* Code Editor Dialog */}
      <CodeEditor
        open={showCode}
        onClose={() => setShowCode(false)}
        user={user}
        fullScreen={isMobile}
      />

      {/* Globe Viewer Dialog */}
      <GlobeViewer
        open={showGlobe}
        onClose={() => setShowGlobe(false)}
        user={user}
        fullScreen={isMobile}
      />

      {/* Mobile Study Tools Dialog */}
      {isMobile && (
        <Dialog
          fullScreen
          open={mobileToolsOpen}
          onClose={() => setMobileToolsOpen(false)}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Dialog Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              px: 2, 
              py: 1.5, 
              bgcolor: 'primary.main', 
              color: 'white',
              boxShadow: 2
            }}>
              <IconButton edge="start" color="inherit" onClick={() => setMobileToolsOpen(false)}>
                <CloseIcon />
              </IconButton>
              {studyTab === 0 && <><LearnIcon sx={{ ml: 1, mr: 1 }} /><Typography variant="h6" sx={{ flex: 1 }}>Learn</Typography></>}
              {studyTab === 1 && <><ExplainIcon sx={{ ml: 1, mr: 1 }} /><Typography variant="h6" sx={{ flex: 1 }}>Explain</Typography></>}
              {studyTab === 2 && <><ActivitiesIcon sx={{ ml: 1, mr: 1 }} /><Typography variant="h6" sx={{ flex: 1 }}>Activities</Typography></>}
              {studyTab === 3 && <><ExamIcon sx={{ ml: 1, mr: 1 }} /><Typography variant="h6" sx={{ flex: 1 }}>Exam</Typography></>}
              {studyTab === 5 && <><NotesIcon sx={{ ml: 1, mr: 1 }} /><Typography variant="h6" sx={{ flex: 1 }}>Notes</Typography></>}
              {studyTab === 10 && <><ChatIcon sx={{ ml: 1, mr: 1 }} /><Typography variant="h6" sx={{ flex: 1 }}>Hub Chat</Typography></>}
            </Box>

            {/* Dialog Content */}
            <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f5f5f5', 
              // v11.0.20: Hide tab headers to show only selected tool content
              '& .MuiTabs-root': { display: 'none' },
              '& .MuiPaper-root:has(.MuiTabs-root)': { display: 'none' }
            }}>
              {pdfFile && pdfDocument ? (
                studyTab === 10 ? (
                  // Hub Chat (Custom Implementation - Compact & Voice-Enabled)
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
                    {/* Clear Button (when messages exist) */}
                    {messages.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                        <Tooltip title="Clear conversation">
                          <IconButton size="small" onClick={() => setMessages([])}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}

                    {/* Chat Input with Voice */}
                    <Paper elevation={3} sx={{ mb: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, p: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                          fullWidth
                          multiline
                          maxRows={3}
                          placeholder="Ask about your PDFs..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          InputProps={{
                            disableUnderline: true,
                          }}
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              fontSize: '0.9rem',
                              py: 0.5
                            }
                          }}
                        />
                        <VoiceInputButton
                          onTranscript={(text) => setInput((prev) => prev + ' ' + text)}
                          disabled={chatLoading}
                        />
                        <Button
                          variant="contained"
                          onClick={handleSendMessage}
                          disabled={!input.trim() || chatLoading}
                          sx={{ 
                            minWidth: 'auto',
                            px: 2,
                            py: 1,
                            height: 40,
                            boxShadow: 3
                          }}
                        >
                          {chatLoading ? <CircularProgress size={20} /> : <SendIcon />}
                        </Button>
                      </Box>
                    </Paper>

                    {/* Chat Messages */}
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                      {messages.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <ChatBubbleIcon 
                            sx={{ 
                              fontSize: 56, 
                              color: 'primary.main', 
                              mb: 2,
                              animation: 'pulse 2s ease-in-out infinite',
                              '@keyframes pulse': {
                                '0%, 100%': {
                                  opacity: 1,
                                  transform: 'scale(1)',
                                },
                                '50%': {
                                  opacity: 0.6,
                                  transform: 'scale(1.05)',
                                }
                              }
                            }} 
                          />
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            Start a conversation
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ask questions about your PDFs
                          </Typography>
                        </Box>
                      ) : (
                        messages.map((msg, idx) => (
                          <Box key={idx} sx={{ mb: 2, display: 'flex', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.400', width: 32, height: 32 }}>
                              {msg.role === 'user' ? 'U' : <VyonnIcon fontSize="small" />}
                            </Avatar>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                flex: 1, 
                                p: 1.5, 
                                bgcolor: msg.role === 'user' ? 'primary.50' : 'grey.100',
                                borderRadius: 2
                              }}
                            >
                              <Box 
                                sx={{ 
                                  whiteSpace: 'pre-wrap',
                                  fontSize: '0.875rem',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                {msg.role === 'user' ? msg.content : renderMessageWithTools(msg.content)}
                              </Box>
                            </Paper>
                          </Box>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </Box>
                  </Box>
                ) : (
                  // Use AIModePanel for other tools
                  <AIModePanel
                    key={`mobile-study-${studyTab}`}
                    currentPage={pdfCurrentPage}
                    totalPages={pdfDocument?.numPages || 0}
                    pdfId={selectedPdf?.id}
                    selectedText={''}
                    pageText={pageText}
                    user={user}
                    pdfDocument={pdfDocument}
                    subscription={subscription}
                    onUpgrade={onUpgrade}
                    sourceHub={studyTab === 5 ? null : {
                      id: hubData.id,
                      name: hubData.name,
                      pdfs: hubPdfs
                    }}
                    activeTab={studyTab}
                  />
                )
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                  <PdfIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No PDF Selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please select a PDF from the menu to use study tools
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Mobile Dialog Footer */}
            <Box sx={{ 
              py: 1, 
              px: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
              bgcolor: 'white',
              flexShrink: 0
            }}>
              <Box component="span" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                © 2025 Amandeep Singh Talwar | PDF copyrights belong to respective owners | For personal educational use only
              </Box>
            </Box>
          </Box>
        </Dialog>
      )}

      {/* Mobile Floating Action Menu - Tools */}
      {isMobile && pdfFile && (
        <SpeedDial
          ariaLabel="Study Tools"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            '& .MuiFab-primary': {
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }
          }}
          icon={<SpeedDialIcon icon={<StudyIcon />} />}
        >
          <SpeedDialAction
            icon={<LearnIcon />}
            tooltipTitle="Learn"
            onClick={() => {
              setStudyTab(0);
              setMobileToolsOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<ExplainIcon />}
            tooltipTitle="Explain"
            onClick={() => {
              setStudyTab(1);
              setMobileToolsOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<ActivitiesIcon />}
            tooltipTitle="Activities"
            onClick={() => {
              setStudyTab(2);
              setMobileToolsOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<ExamIcon />}
            tooltipTitle="Exam"
            onClick={() => {
              setStudyTab(3);
              setMobileToolsOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<ChatIcon />}
            tooltipTitle="Hub Chat"
            onClick={() => {
              setStudyTab(10);
              setMobileToolsOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<NotesIcon />}
            tooltipTitle="Notes"
            onClick={() => {
              setStudyTab(5);
              setMobileToolsOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<FlashcardIcon />}
            tooltipTitle="Flashcards"
            onClick={() => setShowFlashcards(true)}
          />
          <SpeedDialAction
            icon={<TimelineIcon />}
            tooltipTitle="Journey"
            onClick={() => setShowTimeline(true)}
          />
          <SpeedDialAction
            icon={<MathIcon />}
            tooltipTitle="Math"
            onClick={() => setShowMathLab(true)}
          />
          <SpeedDialAction
            icon={<ChemistryIcon />}
            tooltipTitle="Chemistry"
            onClick={() => setShowChemistry(true)}
          />
          <SpeedDialAction
            icon={<PhysicsIcon />}
            tooltipTitle="Physics"
            onClick={() => setShowPhysics(true)}
          />
          <SpeedDialAction
            icon={<CodeIcon />}
            tooltipTitle="Code"
            onClick={() => setShowCode(true)}
          />
          <SpeedDialAction
            icon={<GlobeIcon />}
            tooltipTitle="Globe"
            onClick={() => setShowGlobe(true)}
          />
        </SpeedDial>
      )}
    </Box>
  );
}

export default LearningHubView;

