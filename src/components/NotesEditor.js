import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { 
  Save as SaveIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Mic as MicIcon,
  HelpOutline as HelpIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  createSpeechRecognition, 
  isSpeechRecognitionSupported 
} from '../services/speechRecognitionService';

/**
 * NotesEditor - Rich text editor for student notes with graphics support
 * 
 * Features:
 * - Rich text formatting (bold, italic, underline, lists, etc.)
 * - Image/graphics insertion
 * - Save to localStorage
 * - Export to PDF
 * - Print support
 * - Clear all notes
 */
const NotesEditor = ({ pdfId }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // v10.4: Voice input states
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const quillRef = useRef(null);

  // Load notes from localStorage on mount and when notesUpdated event fires
  useEffect(() => {
    const loadNotes = () => {
      if (pdfId) {
        const savedNotes = localStorage.getItem(`notes_${pdfId}`);
        if (savedNotes) {
          setNotes(savedNotes);
          const timestamp = localStorage.getItem(`notes_${pdfId}_timestamp`);
          if (timestamp) {
            setLastSaved(new Date(timestamp));
          }
        }
      }
    };

    loadNotes();

    // Listen for notes updates from other components
    const handleNotesUpdate = (event) => {
      if (event.detail.pdfId === pdfId) {
        loadNotes();
      }
    };

    window.addEventListener('notesUpdated', handleNotesUpdate);
    return () => window.removeEventListener('notesUpdated', handleNotesUpdate);
  }, [pdfId]);

  // Auto-save notes every 5 seconds if changed
  useEffect(() => {
    if (pdfId && notes) {
      const timer = setTimeout(() => {
        if (pdfId) {
          localStorage.setItem(`notes_${pdfId}`, notes);
          localStorage.setItem(`notes_${pdfId}_timestamp`, new Date().toISOString());
          setLastSaved(new Date());
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, pdfId]);

  const handleSave = () => {
    if (pdfId) {
      setSaving(true);
      localStorage.setItem(`notes_${pdfId}`, notes);
      localStorage.setItem(`notes_${pdfId}_timestamp`, new Date().toISOString());
      setLastSaved(new Date());
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = document.createElement('div');
      element.innerHTML = notes;
      element.style.padding = '20px';
      element.style.maxWidth = '800px';
      element.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(element);

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`ekamanam_notes_${new Date().toISOString().split('T')[0]}.pdf`);
      
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
    setExporting(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ekamanam Notes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Ekamanam - Study Notes</h1>
          <p><em>Generated: ${new Date().toLocaleDateString()}</em></p>
          <hr />
          ${notes}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      setNotes('');
      if (pdfId) {
        localStorage.removeItem(`notes_${pdfId}`);
        localStorage.removeItem(`notes_${pdfId}_timestamp`);
      }
      setLastSaved(null);
    }
  };

  // v10.4: Voice input handlers
  const startVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Speech recognition not supported in this browser');
      return;
    }

    setVoiceError(null);
    setInterimTranscript('');

    recognitionRef.current = createSpeechRecognition({
      language: 'en-IN',
      continuous: false,
      interimResults: true,
      onResult: ({ finalTranscript, interimTranscript: interim, isFinal }) => {
        if (isFinal && finalTranscript) {
          // Insert at cursor position in Quill
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            const position = range ? range.index : quill.getLength();
            quill.insertText(position, finalTranscript + ' ');
            quill.setSelection(position + finalTranscript.length + 1);
          } else {
            // Fallback: append to notes
            setNotes(prev => prev + finalTranscript + ' ');
          }
          setInterimTranscript('');
          setIsListening(false);
        } else {
          setInterimTranscript(interim);
        }
      },
      onError: ({ message }) => {
        setVoiceError(message);
        setIsListening(false);
        setInterimTranscript('');
      },
      onStart: () => {
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript('');
      }
    });

    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
      ['blockquote', 'code-block']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image',
    'blockquote', 'code-block'
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !notes}
          >
            {saving ? 'Saving...' : 'Save Now'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportPDF}
            disabled={exporting || !notes}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!notes}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleClear}
            disabled={!notes}
          >
            Clear All
          </Button>
        </Box>
        
        {lastSaved && (
          <Typography variant="caption" color="text.secondary">
            💾 Last saved: {lastSaved.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {/* Auto-save info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        📝 Notes auto-save every 5 seconds. Use "Add to Notes" buttons from other tabs to quickly capture AI explanations.
      </Alert>

      {/* Voice Input & Formatting Instructions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Voice Input Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isListening ? "Click to stop" : "Click to start voice input"}>
            <IconButton
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              color={isListening ? "error" : "primary"}
              size="large"
              sx={{
                bgcolor: isListening ? 'error.light' : 'primary.light',
                '&:hover': {
                  bgcolor: isListening ? 'error.main' : 'primary.main',
                  color: 'white'
                },
                animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' }
                }
              }}
            >
              <MicIcon />
            </IconButton>
          </Tooltip>
          {isListening && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={interimTranscript || "Listening..."} 
                color="error" 
                size="small"
                sx={{ 
                  animation: 'blink 1s ease-in-out infinite',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 }
                  }
                }}
              />
            </Box>
          )}
          {voiceError && (
            <Alert severity="error" sx={{ py: 0 }} onClose={() => setVoiceError(null)}>
              {voiceError}
            </Alert>
          )}
        </Box>

        {/* Formatting Instructions Accordion */}
        <Accordion sx={{ flexGrow: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>
                📝 How to Format Your Notes
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Toolbar Guide */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="primary" display="block" gutterBottom>
                  Rich Text Toolbar (above the editor):
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, fontSize: '0.8rem' } }}>
                  <li><strong>Headings:</strong> Dropdown menu (H1, H2, H3) - Use for section titles</li>
                  <li><strong>Bold (B):</strong> Click or press <code>Ctrl+B</code> (Mac: ⌘+B)</li>
                  <li><strong>Italic (I):</strong> Click or press <code>Ctrl+I</code> (Mac: ⌘+I)</li>
                  <li><strong>Underline (U):</strong> Click or press <code>Ctrl+U</code> (Mac: ⌘+U)</li>
                  <li><strong>Strike:</strong> Cross out text (S with line through it)</li>
                  <li><strong>Color:</strong> Text color picker (A with color bar)</li>
                  <li><strong>Background:</strong> Highlight color (icon with color fill)</li>
                  <li><strong>Lists:</strong> Numbered (1. 2. 3.) or bullet points (• • •)</li>
                  <li><strong>Indent:</strong> Move text left/right with arrow buttons</li>
                  <li><strong>Align:</strong> Left, center, right, or justify text</li>
                  <li><strong>Link:</strong> Add hyperlinks (chain icon)</li>
                  <li><strong>Image:</strong> Insert images (picture icon)</li>
                  <li><strong>Blockquote:</strong> Indent with left border (for quotes)</li>
                  <li><strong>Code Block:</strong> Monospace font for code ({"<>"} icon)</li>
                  <li><strong>Clean:</strong> Remove all formatting (eraser icon)</li>
                </Box>
              </Box>

              {/* Keyboard Shortcuts */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="secondary" display="block" gutterBottom>
                  🎹 Quick Keyboard Shortcuts:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.3, fontSize: '0.75rem' } }}>
                  <li><code>Ctrl+B</code> - Bold</li>
                  <li><code>Ctrl+I</code> - Italic</li>
                  <li><code>Ctrl+U</code> - Underline</li>
                  <li><code>Ctrl+Z</code> - Undo</li>
                  <li><code>Ctrl+Y</code> - Redo</li>
                </Box>
              </Box>

              {/* Voice Input Tip */}
              <Box sx={{ bgcolor: 'info.light', p: 1, borderRadius: 1 }}>
                <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                  🎤 Voice Input Tip:
                </Typography>
                <Typography variant="caption">
                  Click the microphone button, speak your notes, and they'll be inserted at your cursor position. 
                  Format the text afterward using the toolbar!
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Rich Text Editor */}
      <Paper 
        variant="outlined" 
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '& .quill': {
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          },
          '& .ql-container': {
            flexGrow: 1,
            overflow: 'auto',
            fontSize: '14px'
          },
          '& .ql-editor': {
            minHeight: '300px'
          }
        }}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={notes}
          onChange={setNotes}
          modules={modules}
          formats={formats}
          placeholder="Start taking notes here... Click the microphone to use voice input, or type directly. Use the formatting toolbar above to make your notes beautiful!"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        />
      </Paper>

      {/* Tips */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          💡 <strong>Quick Tips:</strong> 🎤 Click microphone for voice input • 
          Use toolbar buttons or <code>Ctrl+B/I/U</code> for formatting • 
          Insert images via image icon • Copy-paste graphics • 
          Notes auto-save every 5 seconds • Export to PDF for offline studying • 
          Click "📝 How to Format" above for full guide
        </Typography>
      </Box>
    </Box>
  );
};

export default NotesEditor;

