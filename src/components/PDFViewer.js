import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, IconButton, Typography, TextField, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  FitScreen as FitHeightIcon,
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
  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null); // Track current render task
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [showNotes, setShowNotes] = useState(false);
  const [fitToHeight, setFitToHeight] = useState(true); // Auto-fit to container height

  // Load PDF
  useEffect(() => {
    if (!selectedFile) return;

    console.log('📄 PDFViewer: Loading file:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });

    setLoading(true);
    const fileReader = new FileReader();
    
    fileReader.onload = async function() {
      try {
        console.log('📦 FileReader loaded:', this.result.byteLength, 'bytes');
        const typedArray = new Uint8Array(this.result);
        console.log('🔄 Creating PDF document...');
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        console.log('✅ PDF loaded successfully:', pdf.numPages, 'pages');
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error('❌ Error loading PDF:', error);
        alert(`Failed to load PDF: ${error.message}\n\nThe file may be corrupted or invalid.`);
      } finally {
        setLoading(false);
      }
    };
    
    fileReader.onerror = function(error) {
      console.error('❌ FileReader error:', error);
      alert('Failed to read the PDF file. Please try again.');
      setLoading(false);
    };
    
    fileReader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, setPdfDocument, setCurrentPage]);

  // Calculate optimal scale to fit container height
  useEffect(() => {
    if (!pdfDocument || !currentPage || !fitToHeight || !containerRef.current) return;

    const calculateFitToHeightScale = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const baseViewport = page.getViewport({ scale: 1 });
        const container = containerRef.current;
        
        // Get available height (container height minus padding)
        const availableHeight = container.clientHeight - 32; // 32px for padding (16px * 2)
        
        // Calculate scale to fit height
        const calculatedScale = availableHeight / baseViewport.height;
        
        console.log('📏 Auto-fit scale calculated:', {
          pageHeight: baseViewport.height,
          availableHeight,
          calculatedScale: calculatedScale.toFixed(2)
        });
        
        setScale(calculatedScale);
      } catch (error) {
        console.error('Error calculating fit-to-height scale:', error);
      }
    };

    calculateFitToHeightScale();
  }, [pdfDocument, currentPage, fitToHeight]);

  // Handle window resize to recalculate scale
  useEffect(() => {
    if (!fitToHeight) return;

    const handleResize = () => {
      // Trigger scale recalculation by toggling fitToHeight
      setFitToHeight(false);
      setTimeout(() => setFitToHeight(true), 10);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToHeight]);

  // Render page
  useEffect(() => {
    if (!pdfDocument || !currentPage) return;

    const renderPage = async () => {
      try {
        // Cancel any ongoing render task before starting a new one
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          console.log('🚫 Cancelled previous render task');
        }

        const page = await pdfDocument.getPage(currentPage);
        
        // Get page rotation - PDF.js stores rotation in the page object
        // Rotation can be 0, 90, 180, or 270 degrees
        const rotation = page.rotate || 0;
        
        // Log rotation for debugging - ALWAYS log to help diagnose issues
        console.log(`📐 Page ${currentPage} - PDF rotation metadata: ${rotation}°`);
        
        // IMPORTANT: Some regional language PDFs have incorrect rotation metadata
        // If the PDF appears inverted/upside down, the issue might be:
        // 1. PDF was scanned upside down AND has rotation=180 in metadata
        // 2. PDF.js applies the rotation correctly but the scan is still wrong
        // 
        // Solution: Don't pass rotation parameter - let PDF.js render as-is
        // Users can rotate in their PDF viewer if needed
        
        // Create viewport WITHOUT rotation to see if this fixes the inversion
        // const viewport = page.getViewport({ scale, rotation }); // OLD - applies metadata rotation
        const viewport = page.getViewport({ scale }); // NEW - ignores rotation metadata
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions based on viewport (already rotated)
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        // Start render and store task reference
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        // Wait for render to complete
        await renderTask.promise;
        
        // Clear task reference after successful render
        renderTaskRef.current = null;

        // Extract text using PDF.js (simple and fast)
        // V3.1.1: Even if text looks garbled, Gemini can handle it!
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => item.str).join(' ');
        
        console.log('📝 [PDFViewer] Text extracted:', {
          length: textItems.length,
          preview: textItems.substring(0, 100),
          hasDevanagari: /[\u0900-\u097F]/.test(textItems),
          hasTelugu: /[\u0C00-\u0C7F]/.test(textItems),
          hasTamil: /[\u0B80-\u0BFF]/.test(textItems)
        });
        
        onPageTextExtract(textItems);

        // Render text layer for selection with same viewport (includes rotation)
        renderTextLayer(page, viewport);
      } catch (error) {
        // Ignore cancellation errors (they're expected)
        if (error.name === 'RenderingCancelledException') {
          console.log('✅ Render cancelled successfully');
        } else {
          console.error('Error rendering page:', error);
        }
      }
    };

    renderPage();
    
    // Cleanup: Cancel any ongoing render when component unmounts or page changes
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDocument, currentPage, scale, onPageTextExtract]);

  const renderTextLayer = async (page, viewport) => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    // Clear previous text layer
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    
    // Set the scale factor CSS variable as required by PDF.js
    textLayer.style.setProperty('--scale-factor', viewport.scale);

    const textContent = await page.getTextContent();
    
    // Use PDF.js built-in text layer rendering for proper Unicode support
    await pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayer,
      viewport: viewport,
      textDivs: []
    }).promise;

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
    setFitToHeight(false); // Disable auto-fit when manually zooming
    setScale(scale + 0.2);
  };

  const handleZoomOut = () => {
    if (scale > 0.5) {
      setFitToHeight(false); // Disable auto-fit when manually zooming
      setScale(scale - 0.2);
    }
  };

  const handleFitToHeight = () => {
    setFitToHeight(true);
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
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: isMobile ? 0.5 : 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.25 : 1 }}>
          <IconButton 
            onClick={handlePrevPage} 
            disabled={currentPage <= 1}
            size={isMobile ? 'small' : 'medium'}
            sx={{ p: isMobile ? 0.5 : 1 }}
          >
            <ChevronLeft fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <TextField
            size="small"
            type="number"
            value={currentPage}
            onChange={handlePageInput}
            sx={{ 
              width: isMobile ? 45 : 60,
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.75rem' : '1rem',
                height: isMobile ? 32 : 40
              }
            }}
            inputProps={{ min: 1, max: numPages, style: { textAlign: 'center', padding: isMobile ? '4px' : '8px' } }}
          />
          <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}>
            / {numPages}
          </Typography>
          <IconButton 
            onClick={handleNextPage} 
            disabled={currentPage >= numPages}
            size={isMobile ? 'small' : 'medium'}
            sx={{ p: isMobile ? 0.5 : 1 }}
          >
            <ChevronRight fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.25 : 1 }}>
          <IconButton 
            onClick={handleZoomOut} 
            disabled={scale <= 0.5}
            size={isMobile ? 'small' : 'medium'}
            sx={{ p: isMobile ? 0.5 : 1 }}
          >
            <ZoomOut fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <Typography 
            variant={isMobile ? 'caption' : 'body2'} 
            sx={{ 
              minWidth: isMobile ? 35 : 50, 
              textAlign: 'center',
              fontSize: isMobile ? '0.7rem' : '0.875rem'
            }}
          >
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton 
            onClick={handleZoomIn}
            size={isMobile ? 'small' : 'medium'}
            sx={{ p: isMobile ? 0.5 : 1 }}
          >
            <ZoomIn fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <IconButton 
            onClick={handleFitToHeight} 
            color={fitToHeight ? 'primary' : 'default'}
            size={isMobile ? 'small' : 'medium'}
            sx={{ p: isMobile ? 0.5 : 1 }}
            title="Fit to Height"
          >
            <FitHeightIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <IconButton 
            onClick={() => setShowNotes(!showNotes)} 
            color={showNotes ? 'primary' : 'default'}
            size={isMobile ? 'small' : 'medium'}
            sx={{ p: isMobile ? 0.5 : 1 }}
          >
            <NoteIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>
      </Paper>

      {/* PDF Canvas */}
      <Box 
        ref={containerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: fitToHeight ? 'hidden' : 'auto', 
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: fitToHeight ? 'center' : 'flex-start',
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
              className="textLayer"
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                opacity: 0.2,
                lineHeight: 1.0,
                zIndex: 10,
                userSelect: 'text',
                '& span, & br': {
                  color: 'transparent',
                  position: 'absolute',
                  whiteSpace: 'pre',
                  cursor: 'text',
                  transformOrigin: '0% 0%',
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

