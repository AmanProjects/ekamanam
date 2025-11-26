import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  Save as SaveIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // Load notes from localStorage on mount
  useEffect(() => {
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
  }, [pdfId]);

  // Auto-save notes every 5 seconds if changed
  useEffect(() => {
    if (pdfId && notes) {
      const timer = setTimeout(() => {
        handleSave();
      }, 5000);
      return () => clearTimeout(timer);
    }
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
          theme="snow"
          value={notes}
          onChange={setNotes}
          modules={modules}
          formats={formats}
          placeholder="Start taking notes here... Use the formatting toolbar above or add content from AI explanations using 'Add to Notes' buttons."
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        />
      </Paper>

      {/* Tips */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          💡 <strong>Tips:</strong> Use the toolbar for formatting • Insert images via the image icon • 
          Copy-paste graphics • Notes are saved automatically • Export to PDF for studying offline
        </Typography>
      </Box>
    </Box>
  );
};

export default NotesEditor;

