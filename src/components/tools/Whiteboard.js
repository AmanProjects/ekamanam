import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  Box,
  Button,
  Typography,
  IconButton,
  Slider,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as ClearIcon,
  Undo as UndoIcon
} from '@mui/icons-material';

/**
 * Whiteboard - Interactive drawing canvas using native Canvas API
 * Features: Freehand drawing, brush size, colors, export
 */
function Whiteboard({ open, onClose }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [history, setHistory] = useState([]);

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#ff6b6b', '#ffa502', '#ffcc00',
    '#4cd137', '#00a8ff', '#1e90ff', '#9b59b6', '#e84393', '#636e72'
  ];

  // Initialize canvas
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = Math.min(window.innerWidth * 0.8, 1200);
      canvas.height = Math.min(window.innerHeight * 0.65, 600);
      
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      contextRef.current = ctx;
      
      // Save initial state
      saveToHistory();
    }
  }, [open]);

  // Update brush settings
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = brushColor;
      contextRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize]);

  const saveToHistory = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setHistory(prev => [...prev.slice(-20), dataUrl]);
    }
  };

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      contextRef.current.closePath();
      setIsDrawing(false);
      saveToHistory();
    }
  };

  // Touch support
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  // Export to image
  const handleExport = () => {
    if (canvasRef.current) {
      const a = document.createElement('a');
      a.href = canvasRef.current.toDataURL('image/png');
      a.download = `whiteboard-${Date.now()}.png`;
      a.click();
    }
  };

  // Clear canvas
  const handleClear = () => {
    if (canvasRef.current && contextRef.current) {
      contextRef.current.fillStyle = '#ffffff';
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
    }
  };

  // Undo
  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const lastState = newHistory[newHistory.length - 1];
      
      const img = new Image();
      img.onload = () => {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        contextRef.current.drawImage(img, 0, 0);
      };
      img.src = lastState;
      setHistory(newHistory);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      fullWidth
      PaperProps={{ 
        sx: { 
          height: '90vh', 
          width: '90vw',
          maxWidth: '90vw'
        } 
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#e17055',
        color: 'white',
        py: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">✏️ Whiteboard</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleUndo}
            startIcon={<UndoIcon />}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            size="small"
            disabled={history.length <= 1}
          >
            Undo
          </Button>
          <Button 
            variant="contained" 
            onClick={handleExport}
            startIcon={<SaveIcon />}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            size="small"
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleClear}
            startIcon={<ClearIcon />}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            size="small"
          >
            Clear
          </Button>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ display: 'flex', height: 'calc(100% - 64px)' }}>
        {/* Toolbar */}
        <Paper sx={{ 
          width: 80, 
          p: 1.5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2,
          borderRight: '1px solid #ddd',
          bgcolor: '#f8f9fa'
        }}>
          {/* Brush size */}
          <Box sx={{ width: '100%', px: 0.5 }}>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              Size: {brushSize}
            </Typography>
            <Slider
              value={brushSize}
              onChange={(e, v) => setBrushSize(v)}
              min={1}
              max={30}
              size="small"
            />
          </Box>

          {/* Colors */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {colors.map((color) => (
              <Box
                key={color}
                onClick={() => setBrushColor(color)}
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: color,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: brushColor === color ? '3px solid #1976d2' : '2px solid #ddd',
                  '&:hover': { transform: 'scale(1.1)' },
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Canvas */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#f0f0f0',
          p: 2
        }}>
          <Paper elevation={3} sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrawing}
              style={{ cursor: 'crosshair', touchAction: 'none' }}
            />
          </Paper>
        </Box>
      </Box>
    </Dialog>
  );
}

export default Whiteboard;
