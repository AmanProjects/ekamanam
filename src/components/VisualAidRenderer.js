import React, { useRef, useEffect } from 'react';
import { Box, Paper, Alert } from '@mui/material';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  PieController,
  BarController,
  LineController
} from 'chart.js';
import ThreeDVisualization from './ThreeDVisualization';
import ChemistryVisualization from './ChemistryVisualization';
import PlotlyVisualization from './PlotlyVisualization';

// Register Chart.js components AND controllers
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  PieController,
  BarController,
  LineController
);

function VisualAidRenderer({ visualAid }) {
  const chartInstanceRef = useRef(null);
  const [parsedVisual, setParsedVisual] = React.useState(null);
  const [visualType, setVisualType] = React.useState(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    // Cleanup previous chart instance
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [visualAid]);

  useEffect(() => {
    setError(null);
    setParsedVisual(null);
    setVisualType(null);

    // Type check: visualAid must be a string
    if (!visualAid || typeof visualAid !== 'string' || visualAid.trim() === '') {
      return;
    }

    try {
      // Attempt to parse as JSON
      const config = JSON.parse(visualAid);
      
      // Detect visualization type
      if (config.chartType) {
        // Chart.js (pie, bar, line)
        setVisualType('chartjs');
        setParsedVisual(config);
      } else if (config.type === '3d' && config.shapeType) {
        // 3D Geometry (cube, sphere, pyramid, etc.)
        setVisualType('3d');
        setParsedVisual(config);
      } else if (config.type === 'chemistry' || config.moleculeData) {
        // Chemistry (molecular structures)
        setVisualType('chemistry');
        setParsedVisual(config);
      } else if (config.type === 'plotly' || (Array.isArray(config.data) && config.data[0]?.type)) {
        // Plotly (3D surfaces, scatter, etc.)
        setVisualType('plotly');
        setParsedVisual(config);
      } else {
        // Unknown JSON format, try as SVG/HTML
        setVisualType('svg');
      }
    } catch (e) {
      // Not JSON, treat as SVG/HTML
      setVisualType('svg');
    }
  }, [visualAid]);

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

  // Error handling
  if (error) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!visualType) {
    return null;
  }

  // Chart.js rendering (pie, bar, line charts)
  if (visualType === 'chartjs' && parsedVisual) {
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
                type: parsedVisual.chartType,
                data: parsedVisual.data,
                options: {
                  ...parsedVisual.options,
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

  // 3D Geometry rendering (cube, sphere, pyramid, etc.)
  if (visualType === '3d' && parsedVisual) {
    return (
      <ThreeDVisualization
        shapeType={parsedVisual.shapeType}
        color={parsedVisual.color}
        wireframe={parsedVisual.wireframe}
        dimensions={parsedVisual.dimensions}
        labels={parsedVisual.labels}
        rotate={parsedVisual.rotate !== false}
        title={parsedVisual.title}
      />
    );
  }

  // Chemistry visualization (molecular structures)
  if (visualType === 'chemistry' && parsedVisual) {
    return (
      <ChemistryVisualization
        moleculeData={parsedVisual.moleculeData}
        format={parsedVisual.format || 'smiles'}
        style={parsedVisual.style}
        title={parsedVisual.title}
      />
    );
  }

  // Plotly visualization (3D plots, surfaces, etc.)
  if (visualType === 'plotly' && parsedVisual) {
    return (
      <PlotlyVisualization
        data={parsedVisual.data}
        layout={parsedVisual.layout}
        title={parsedVisual.title}
        config={parsedVisual.config}
      />
    );
  }

  // SVG/HTML rendering (fallback for 2D graphics)
  if (visualType === 'svg' && visualAid && typeof visualAid === 'string') {
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

  return null;
}

export default VisualAidRenderer;
