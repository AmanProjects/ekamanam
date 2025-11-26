import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

/**
 * ChemistryVisualization - Renders molecular structures using 3Dmol.js
 * 
 * Props:
 * - moleculeData: string (required) - Molecule data (SMILES, PDB, SDF, etc.)
 * - format: string (optional) - Format of molecule data ('smiles', 'pdb', 'sdf', 'xyz')
 * - style: object (optional) - Visualization style
 * - title: string (optional) - Title for the visualization
 */
const ChemistryVisualization = ({ 
  moleculeData, 
  format = 'smiles',
  style = { stick: {}, sphere: { scale: 0.3 } },
  title = ''
}) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    // Load 3Dmol.js from CDN
    const load3Dmol = () => {
      return new Promise((resolve, reject) => {
        if (window.$3Dmol) {
          resolve(window.$3Dmol);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js';
        script.async = true;
        script.onload = () => resolve(window.$3Dmol);
        script.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
        document.body.appendChild(script);
      });
    };

    const initViewer = async () => {
      try {
        const $3Dmol = await load3Dmol();

        if (!containerRef.current) return;

        // Create viewer
        const config = { backgroundColor: 'white' };
        const viewer = $3Dmol.createViewer(containerRef.current, config);
        viewerRef.current = viewer;

        // Add molecule based on format
        if (format === 'smiles') {
          // Convert SMILES to 3D (requires RDKit or similar)
          // For now, we'll show common molecules by name
          const commonMolecules = {
            'water': 'H2O',
            'methane': 'CH4',
            'ethanol': 'CCO',
            'glucose': 'C([C@@H]1[C@H]([C@@H]([C@H]([C@H](O1)O)O)O)O)O',
            'benzene': 'c1ccccc1',
            'caffeine': 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
          };

          const smilesData = commonMolecules[moleculeData.toLowerCase()] || moleculeData;
          
          // Note: Full SMILES support requires backend/RDKit
          // For demo, we'll show a message
          if (!commonMolecules[moleculeData.toLowerCase()]) {
            setError('Full SMILES support requires additional backend setup. Showing placeholder.');
          }
        } else {
          viewer.addModel(moleculeData, format);
        }

        // Set style
        viewer.setStyle({}, style);

        // Add labels if needed
        viewer.addPropertyLabels('atom', { fontColor: 'black', fontSize: 12 });

        // Render
        viewer.zoomTo();
        viewer.render();
        viewer.zoom(1.2, 1000);

      } catch (err) {
        console.error('Error initializing 3Dmol viewer:', err);
        setError(err.message);
      }
    };

    if (moleculeData) {
      initViewer();
    }

    return () => {
      if (viewerRef.current) {
        // Cleanup viewer
        viewerRef.current = null;
      }
    };
  }, [moleculeData, format, style]);

  if (error) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, my: 2, maxWidth: 600, mx: 'auto' }}>
      {title && (
        <Typography variant="h6" gutterBottom align="center" color="primary">
          {title}
        </Typography>
      )}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: 400,
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          position: 'relative'
        }}
      />
      <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
        Drag to rotate • Scroll to zoom • Right-click to pan
      </Typography>
    </Paper>
  );
};

export default ChemistryVisualization;

