import React, { useRef, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function VisualAidRenderer({ visualAid }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // Cleanup previous chart instance
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [visualAid]);

  if (!visualAid || visualAid.trim() === '') {
    return null;
  }

  // Try to detect if it's a Chart.js JSON format
  let isChartData = false;
  let chartConfig = null;
  
  try {
    const parsed = JSON.parse(visualAid);
    if (parsed.chartType && parsed.data) {
      isChartData = true;
      chartConfig = parsed;
    }
  } catch (e) {
    // Not JSON, treat as SVG/HTML
  }

  // Render Chart.js chart
  if (isChartData && chartConfig) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          mt: 1, 
          p: 3, 
          bgcolor: '#f8f9fa',
          border: '2px dashed #4CAF50',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 500, height: 300 }}>
          <canvas ref={(canvas) => {
            if (canvas && !chartInstanceRef.current) {
              const ctx = canvas.getContext('2d');
              chartInstanceRef.current = new ChartJS(ctx, {
                type: chartConfig.chartType,
                data: chartConfig.data,
                options: {
                  ...chartConfig.options,
                  responsive: true,
                  maintainAspectRatio: true
                }
              });
            }
          }} />
        </Box>
      </Paper>
    );
  }

  // Fix common SVG issues
  const fixSVG = (svgString) => {
    let fixed = svgString;
    
    // Ensure viewBox exists for proper scaling
    if (!fixed.includes('viewBox') && fixed.includes('<svg')) {
      fixed = fixed.replace('<svg', '<svg viewBox="0 0 400 300"');
    }
    
    // Ensure xmlns exists
    if (!fixed.includes('xmlns') && fixed.includes('<svg')) {
      fixed = fixed.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Add proper styling for responsive SVG
    if (fixed.includes('<svg') && !fixed.includes('style=')) {
      fixed = fixed.replace('<svg', '<svg style="max-width:100%;height:auto;display:block;margin:0 auto;"');
    }
    
    return fixed;
  };

  // Render SVG/HTML visual
  return (
    <Paper 
      elevation={0}
      sx={{ 
        mt: 1, 
        p: 2, 
        bgcolor: '#f8f9fa',
        border: '2px dashed #4CAF50',
        borderRadius: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150
      }}
    >
      <Box 
        sx={{ textAlign: 'center', width: '100%' }}
        dangerouslySetInnerHTML={{ __html: fixSVG(visualAid) }}
      />
    </Paper>
  );
}

export default VisualAidRenderer;

