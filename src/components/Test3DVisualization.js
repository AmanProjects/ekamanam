import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import ThreeDVisualization from './ThreeDVisualization';
import PlotlyVisualization from './PlotlyVisualization';
import ChemistryVisualization from './ChemistryVisualization';
import VisualAidRenderer from './VisualAidRenderer';

/**
 * Test component to verify 3D visualizations work
 * This helps debug if 3D rendering is working in the browser
 */
const Test3DVisualization = () => {
  const [testType, setTestType] = React.useState(null);

  const tests = [
    {
      name: 'Three.js Cube',
      type: 'threejs',
      data: {
        type: '3d',
        shapeType: 'cube',
        color: '#4FC3F7',
        dimensions: { width: 2, height: 2, depth: 2 },
        labels: ['8 vertices', '12 edges', '6 faces'],
        title: 'Test Cube',
        rotate: true
      }
    },
    {
      name: 'Three.js Sphere',
      type: 'threejs',
      data: {
        type: '3d',
        shapeType: 'sphere',
        color: '#FF6B6B',
        dimensions: { radius: 1.5 },
        labels: ['Surface area = 4πr²', 'Volume = (4/3)πr³'],
        title: 'Test Sphere',
        rotate: true
      }
    },
    {
      name: 'Plotly Surface',
      type: 'plotly',
      data: {
        type: 'plotly',
        data: [{
          type: 'surface',
          z: [[0, 1, 4], [1, 2, 5], [4, 5, 8]],
          x: [-1, 0, 1],
          y: [-1, 0, 1],
          colorscale: 'Viridis'
        }],
        layout: {
          title: 'Test Surface',
          scene: {
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
            zaxis: { title: 'Z' }
          }
        },
        title: 'Test 3D Surface'
      }
    },
    {
      name: 'Chemistry Molecule',
      type: 'chemistry',
      data: {
        type: 'chemistry',
        moleculeData: 'water',
        format: 'smiles',
        title: 'Test Water Molecule (H₂O)',
        style: { stick: {}, sphere: { scale: 0.3 } }
      }
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        3D Visualization Test Page
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Use this page to test if 3D visualizations are working in your browser.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select a test:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {tests.map((test, idx) => (
            <Button
              key={idx}
              variant={testType === test ? 'contained' : 'outlined'}
              onClick={() => setTestType(test)}
            >
              {test.name}
            </Button>
          ))}
        </Box>
      </Paper>

      {testType && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Testing: {testType.name}
          </Typography>
          
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              JSON Data:
            </Typography>
            <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
              {JSON.stringify(testType.data, null, 2)}
            </pre>
          </Paper>

          {testType.type === 'threejs' && (
            <ThreeDVisualization {...testType.data} />
          )}

          {testType.type === 'plotly' && (
            <PlotlyVisualization {...testType.data} />
          )}

          {testType.type === 'chemistry' && (
            <ChemistryVisualization {...testType.data} />
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            💡 If you see the visualization above, 3D rendering is working!
            <br />
            If not, check the browser console (F12) for errors.
          </Typography>

          <Paper sx={{ p: 2, mt: 2, bgcolor: '#fff3cd' }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Test via VisualAidRenderer:
            </Typography>
            <VisualAidRenderer visualAid={JSON.stringify(testType.data)} />
          </Paper>
        </Box>
      )}

      {!testType && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd' }}>
          <Typography variant="body1" color="text.secondary">
            👆 Select a test above to verify 3D rendering works in your browser
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting:
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li><strong>Can't see anything?</strong> Open browser console (F12) and check for errors</li>
            <li><strong>Three.js not working?</strong> Check if WebGL is enabled in Chrome</li>
            <li><strong>Plotly not loading?</strong> Check network tab for failed requests</li>
            <li><strong>Chemistry not working?</strong> 3Dmol.js loads from CDN, check network</li>
            <li><strong>Still issues?</strong> Try updating Chrome or testing in another browser</li>
          </ul>
        </Typography>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>WebGL Test:</strong> Visit{' '}
          <a href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer">
            https://get.webgl.org/
          </a>
          {' '}to verify WebGL works
        </Typography>
      </Paper>
    </Box>
  );
};

export default Test3DVisualization;

