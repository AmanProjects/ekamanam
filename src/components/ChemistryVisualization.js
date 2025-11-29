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
  const [loading, setLoading] = React.useState(false);

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

    // Fetch molecule from PubChem API
    const fetchFromPubChem = async (moleculeName) => {
      setLoading(true);
      try {
        console.log('🔍 Fetching molecule from PubChem:', moleculeName);
        
        // Step 1: Search for compound by name
        const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(moleculeName)}/cids/JSON`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
          throw new Error('Molecule not found in PubChem database');
        }
        
        const searchData = await searchResponse.json();
        const cid = searchData.IdentifierList.CID[0];
        
        console.log('✅ Found PubChem CID:', cid);
        
        // Step 2: Get 3D SDF structure
        const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?record_type=3d`;
        const sdfResponse = await fetch(sdfUrl);
        
        if (!sdfResponse.ok) {
          throw new Error('3D structure not available');
        }
        
        const sdfData = await sdfResponse.text();
        console.log('✅ Downloaded 3D structure from PubChem');
        
        setLoading(false);
        return { success: true, data: sdfData, format: 'sdf' };
        
      } catch (err) {
        console.warn('⚠️ PubChem fetch failed:', err.message);
        setLoading(false);
        return { success: false, error: err.message };
      }
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
          // Hardcoded PDB structures for offline fallback
          const commonMoleculesPDB = {
            'water': `COMPND    WATER
HETATM    1  O   HOH     1       0.000   0.000   0.000  1.00  0.00           O
HETATM    2  H   HOH     1       0.957   0.000   0.000  1.00  0.00           H
HETATM    3  H   HOH     1      -0.240   0.927   0.000  1.00  0.00           H
CONECT    1    2    3
CONECT    2    1
CONECT    3    1
END`,
            'methane': `COMPND    METHANE
HETATM    1  C   CH4     1       0.000   0.000   0.000  1.00  0.00           C
HETATM    2  H   CH4     1       0.629   0.629   0.629  1.00  0.00           H
HETATM    3  H   CH4     1      -0.629  -0.629   0.629  1.00  0.00           H
HETATM    4  H   CH4     1      -0.629   0.629  -0.629  1.00  0.00           H
HETATM    5  H   CH4     1       0.629  -0.629  -0.629  1.00  0.00           H
CONECT    1    2    3    4    5
CONECT    2    1
CONECT    3    1
CONECT    4    1
CONECT    5    1
END`,
            'ammonia': `COMPND    AMMONIA
HETATM    1  N   NH3     1       0.000   0.000   0.000  1.00  0.00           N
HETATM    2  H   NH3     1       0.943   0.000   0.333  1.00  0.00           H
HETATM    3  H   NH3     1      -0.471   0.816   0.333  1.00  0.00           H
HETATM    4  H   NH3     1      -0.471  -0.816   0.333  1.00  0.00           H
CONECT    1    2    3    4
CONECT    2    1
CONECT    3    1
CONECT    4    1
END`,
            'carbon dioxide': `COMPND    CARBON DIOXIDE
HETATM    1  C   CO2     1       0.000   0.000   0.000  1.00  0.00           C
HETATM    2  O   CO2     1       1.160   0.000   0.000  1.00  0.00           O
HETATM    3  O   CO2     1      -1.160   0.000   0.000  1.00  0.00           O
CONECT    1    2    2    3    3
CONECT    2    1    1
CONECT    3    1    1
END`
          };

          // Strategy 1: Try hardcoded molecules first (fast, offline)
          const pdbData = commonMoleculesPDB[moleculeData.toLowerCase()];
          
          if (pdbData) {
            viewer.addModel(pdbData, 'pdb');
            console.log('✅ Loaded molecule from local library:', moleculeData);
          } else {
            // Strategy 2: Fetch from PubChem API (online, any molecule)
            console.log('🌐 Molecule not in local library, fetching from PubChem...');
            const result = await fetchFromPubChem(moleculeData);
            
            if (result.success) {
              viewer.addModel(result.data, result.format);
              console.log('✅ Loaded molecule from PubChem:', moleculeData);
            } else {
              // Both strategies failed
              setError(`Molecule "${moleculeData}" not found. Try: water, methane, ammonia, ethanol, glucose, benzene, caffeine, etc.`);
              console.warn('⚠️ Molecule not available:', moleculeData);
              return; // Don't render empty viewer
            }
          }
        } else {
          // Other formats (pdb, mol2, sdf, xyz) - use directly
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
        setLoading(false);
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
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: loading ? 'action.hover' : 'transparent'
        }}
      >
        {loading && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              🌐 Fetching molecule from PubChem...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (First time may take a few seconds)
            </Typography>
          </Box>
        )}
      </Box>
      <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
        {loading ? 'Loading...' : 'Drag to rotate • Scroll to zoom • Right-click to pan'}
      </Typography>
    </Paper>
  );
};

export default ChemistryVisualization;

