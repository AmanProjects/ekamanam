import React from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, Box } from '@mui/material';

/**
 * PlotlyVisualization - Advanced scientific visualizations using Plotly.js
 * 
 * Supports:
 * - 3D surface plots
 * - 3D scatter plots
 * - Heatmaps
 * - Contour plots
 * - Animated plots
 * - Interactive scientific graphs
 * 
 * Props:
 * - data: array (required) - Plotly data array
 * - layout: object (optional) - Plotly layout configuration
 * - title: string (optional) - Title for the visualization
 */
const PlotlyVisualization = ({ 
  data, 
  layout = {}, 
  title = '',
  config = { responsive: true, displayModeBar: true }
}) => {
  const defaultLayout = {
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: '#f5f5f5',
    plot_bgcolor: '#ffffff',
    font: {
      family: 'Roboto, sans-serif',
      size: 12,
      color: '#333'
    },
    ...layout
  };

  return (
    <Paper elevation={3} sx={{ p: 2, my: 2, maxWidth: 800, mx: 'auto' }}>
      {title && (
        <Typography variant="h6" gutterBottom align="center" color="primary">
          {title}
        </Typography>
      )}
      <Box sx={{ width: '100%', height: 'auto' }}>
        <Plot
          data={data}
          layout={defaultLayout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </Box>
    </Paper>
  );
};

/**
 * Helper function to create 3D surface plot data
 */
export const create3DSurface = (equation, xRange = [-5, 5], yRange = [-5, 5], steps = 50) => {
  const x = [];
  const y = [];
  const z = [];

  const xStep = (xRange[1] - xRange[0]) / steps;
  const yStep = (yRange[1] - yRange[0]) / steps;

  for (let i = 0; i <= steps; i++) {
    const xVal = xRange[0] + i * xStep;
    x.push(xVal);
    y.push(yRange[0] + i * yStep);
  }

  for (let i = 0; i <= steps; i++) {
    const zRow = [];
    for (let j = 0; j <= steps; j++) {
      try {
        const zVal = equation(x[j], y[i]);
        zRow.push(zVal);
      } catch (e) {
        zRow.push(null);
      }
    }
    z.push(zRow);
  }

  return [{
    type: 'surface',
    x: x,
    y: y,
    z: z,
    colorscale: 'Viridis',
    showscale: true
  }];
};

/**
 * Helper function to create 3D scatter plot
 */
export const create3DScatter = (points, labels = []) => {
  const x = points.map(p => p[0]);
  const y = points.map(p => p[1]);
  const z = points.map(p => p[2]);

  return [{
    type: 'scatter3d',
    mode: 'markers+text',
    x: x,
    y: y,
    z: z,
    text: labels,
    marker: {
      size: 8,
      color: z,
      colorscale: 'Jet',
      showscale: true
    }
  }];
};

/**
 * Helper function to create parametric 3D curve
 */
export const createParametricCurve = (equations, tRange = [0, 10], steps = 100) => {
  const t = [];
  const x = [];
  const y = [];
  const z = [];

  const tStep = (tRange[1] - tRange[0]) / steps;

  for (let i = 0; i <= steps; i++) {
    const tVal = tRange[0] + i * tStep;
    t.push(tVal);
    x.push(equations.x(tVal));
    y.push(equations.y(tVal));
    z.push(equations.z(tVal));
  }

  return [{
    type: 'scatter3d',
    mode: 'lines',
    x: x,
    y: y,
    z: z,
    line: {
      width: 4,
      color: t,
      colorscale: 'Rainbow'
    }
  }];
};

export default PlotlyVisualization;

