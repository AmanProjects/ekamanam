/**
 * Learning Hub View - v10.6.0
 * 
 * NotebookLM-inspired interface for a single Learning Hub
 * Layout: Sources (left) | Chat (center) | Materials & Labs (right)
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip
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
  School as LearnIcon,
  Psychology as ExplainIcon,
  SportsEsports as ActivitiesIcon,
  Quiz as ExamIcon,
  Chat as ChatIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import learningHubService from '../services/learningHubService';
import libraryService, { loadPDFData } from '../services/libraryService';
import llmService from '../services/llmService';
import { markdownToHtml } from '../utils/markdownRenderer';
import PDFViewer from './PDFViewer';
import AIModePanel from './AIModePanel';

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

      const systemPrompt = `You are Vyonn AI, an intelligent learning assistant. ${hubContext}

You have access to these interactive labs and tools:
- Math Lab: For calculations, equations, graphing
- Chemistry Tools: 3D molecules, periodic table, reactions
- Physics Simulator: Circuits, mechanics, waves
- Code Editor: Programming practice
- Globe Viewer: Geography, maps

If the user's question would benefit from using a specific lab or tool, mention it naturally in your response.

Recent conversation:
${conversationContext}

User's question: ${userMessage}

Provide a helpful, clear, and educational response.`;

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
  const handlePageTextExtract = (text) => {
    setPageText(text);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Main Content - 4 Panel Layout */}
      <Box ref={containerRef} sx={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* LEFT PANEL: Hub Info & PDFs */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            borderRight: '1px solid #e0e0e0',
            overflow: 'hidden'
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
                      secondary={`${pdf.totalPages || 0} pages`}
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
            px: 2, 
            py: 1.5, 
            bgcolor: '#424242', 
            borderBottom: '1px solid #616161' 
          }}>
            <PdfIcon sx={{ mr: 1, color: 'white', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
              PDF Viewer
            </Typography>
            {selectedPdf && (
              <Typography variant="caption" sx={{ ml: 2, color: 'rgba(255,255,255,0.7)' }}>
                {selectedPdf.name}
              </Typography>
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
                onTextSelect={() => {}}
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: '#f5f5f5',
            borderLeft: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0'
          }}
        >
          {/* Icon Band Header (Matches other panels) */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            py: 1.5, 
            bgcolor: '#e0e0e0', 
            borderBottom: '1px solid #bdbdbd'
          }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main'
              }}
            />
          </Box>

          {/* Tool Icons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 2 }}>
            <Tooltip title="Learn" placement="right">
            <IconButton
              onClick={() => setStudyTab(0)}
              sx={{
                bgcolor: studyTab === 0 ? 'primary.main' : 'transparent',
                color: studyTab === 0 ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: studyTab === 0 ? 'primary.dark' : 'action.hover',
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
                bgcolor: studyTab === 1 ? 'primary.main' : 'transparent',
                color: studyTab === 1 ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: studyTab === 1 ? 'primary.dark' : 'action.hover',
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
                bgcolor: studyTab === 2 ? 'primary.main' : 'transparent',
                color: studyTab === 2 ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: studyTab === 2 ? 'primary.dark' : 'action.hover',
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
                bgcolor: studyTab === 3 ? 'primary.main' : 'transparent',
                color: studyTab === 3 ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: studyTab === 3 ? 'primary.dark' : 'action.hover',
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
                bgcolor: studyTab === 10 ? 'primary.main' : 'transparent',
                color: studyTab === 10 ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: studyTab === 10 ? 'primary.dark' : 'action.hover',
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
                bgcolor: studyTab === 5 ? 'primary.main' : 'transparent',
                color: studyTab === 5 ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: studyTab === 5 ? 'primary.dark' : 'action.hover',
                }
              }}
            >
              <NotesIcon />
            </IconButton>
          </Tooltip>
          </Box>
        </Paper>

        {/* RESIZE HANDLE */}
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            width: '4px',
            bgcolor: isDragging ? 'primary.main' : '#e0e0e0',
            cursor: 'col-resize',
            '&:hover': {
              bgcolor: 'primary.light',
            },
            transition: 'background-color 0.2s',
          }}
        />

        {/* RIGHT PANEL: AI Mode Panel Content OR Hub Chat + Footer */}
        <Box
          sx={{
            width: rightPanelWidth,
            minWidth: 300,
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: 'white',
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
            <LearnIcon sx={{ mr: 1, color: 'white', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
              Study Materials
            </Typography>
          </Box>

          {pdfFile && pdfDocument ? (
            studyTab === 10 ? (
              // Hub Chat (Custom Implementation - Input at Top)
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 3, overflow: 'hidden' }}>
                <Typography variant="h6" gutterBottom>Hub Chat</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Chat with all PDFs in this hub
                </Typography>
                
                {/* Chat Input - Moved to Top */}
                <Box sx={{ mb: 2 }}>
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!input.trim() || chatLoading}
                          >
                            {chatLoading ? <CircularProgress size={20} /> : <SendIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Chat Messages - Below Input */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <VyonnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
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
                          mb: 2,
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            maxWidth: '85%',
                            bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                            color: msg.role === 'user' ? 'white' : 'text.primary',
                            fontSize: '0.875rem',
                            borderRadius: 2
                          }}
                        >
                          {msg.role === 'user' ? (
                            <Typography variant="body2">{msg.content}</Typography>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                          )}
                        </Paper>
                      </Box>
                    ))
                  )}
                  {chatLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <CircularProgress size={20} />
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
              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
        <DialogTitle>Add PDF to Hub</DialogTitle>
        <DialogContent>
          {availablePdfs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              All your PDFs are already in this hub!
            </Typography>
          ) : (
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
                    secondary={`${pdf.totalPages} pages`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPdfDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LearningHubView;

