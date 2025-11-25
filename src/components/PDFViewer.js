import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, IconButton, Typography, TextField, CircularProgress } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Note as NoteIcon
} from '@mui/icons-material';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function PDFViewer({ 
  selectedFile, 
  pdfDocument, 
  setPdfDocument, 
  currentPage, 
  setCurrentPage,
  onTextSelect,
  onPageTextExtract 
}) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [showNotes, setShowNotes] = useState(false);

  // Load PDF
  useEffect(() => {
    if (!selectedFile) return;

    setLoading(true);
    const fileReader = new FileReader();
    
    fileReader.onload = async function() {
      try {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fileReader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, setPdfDocument, setCurrentPage]);

  // Render page
  useEffect(() => {
    if (!pdfDocument || !currentPage) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        // Extract text
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => item.str).join(' ');
        onPageTextExtract(textItems);

        // Render text layer for selection
        renderTextLayer(page, viewport);
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale, onPageTextExtract]);

  const renderTextLayer = async (page, viewport) => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    // Clear previous text layer
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    const textContent = await page.getTextContent();
    
    textContent.items.forEach((item) => {
      const span = document.createElement('span');
      span.textContent = item.str;
      
      const tx = pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );
      
      span.style.position = 'absolute';
      span.style.left = `${tx[4]}px`;
      span.style.top = `${tx[5]}px`;
      span.style.fontSize = `${Math.abs(tx[0])}px`;
      span.style.fontFamily = item.fontName;
      span.style.color = 'transparent';
      span.style.whiteSpace = 'pre';
      
      textLayer.appendChild(span);
    });

    // Handle text selection
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      if (selectedText) {
        onTextSelect(selectedText);
      }
    };

    textLayer.addEventListener('mouseup', handleSelection);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(scale + 0.2);
  };

  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale(scale - 0.2);
    }
  };

  const handlePageInput = (e) => {
    const pageNum = parseInt(e.target.value);
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
    }
  };

  if (!selectedFile) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a PDF file to begin
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Controls */}
      <Paper 
        square 
        elevation={1} 
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevPage} disabled={currentPage <= 1}>
            <ChevronLeft />
          </IconButton>
          <TextField
            size="small"
            type="number"
            value={currentPage}
            onChange={handlePageInput}
            sx={{ width: 60 }}
            inputProps={{ min: 1, max: numPages, style: { textAlign: 'center' } }}
          />
          <Typography variant="body2" color="text.secondary">
            / {numPages}
          </Typography>
          <IconButton onClick={handleNextPage} disabled={currentPage >= numPages}>
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOut />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton onClick={handleZoomIn}>
            <ZoomIn />
          </IconButton>
          <IconButton onClick={() => setShowNotes(!showNotes)} color={showNotes ? 'primary' : 'default'}>
            <NoteIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* PDF Canvas */}
      <Box 
        ref={containerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: '#525659'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <canvas 
              ref={canvasRef} 
              style={{ 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                display: 'block'
              }} 
            />
            <Box
              ref={textLayerRef}
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                overflow: 'hidden',
                opacity: 0.2,
                lineHeight: 1.0,
                userSelect: 'text',
                '& span': {
                  cursor: 'text',
                },
                '& ::selection': {
                  backgroundColor: 'rgba(255, 193, 7, 0.75)',
                  color: '#000',
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default PDFViewer;

