import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Paper,
  Grid,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * ChemistryTools - Molecular visualization and chemistry toolkit
 * Features: 3D molecule viewer, periodic table reference, compound search
 */
function ChemistryTools({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [moleculeName, setMoleculeName] = useState('caffeine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);

  // Common molecules for quick access
  const commonMolecules = [
    { name: 'Water', formula: 'H2O', cid: '962' },
    { name: 'Caffeine', formula: 'C8H10N4O2', cid: '2519' },
    { name: 'Aspirin', formula: 'C9H8O4', cid: '2244' },
    { name: 'Ethanol', formula: 'C2H5OH', cid: '702' },
    { name: 'Glucose', formula: 'C6H12O6', cid: '5793' },
    { name: 'Benzene', formula: 'C6H6', cid: '241' },
    { name: 'Methane', formula: 'CH4', cid: '297' },
    { name: 'Ammonia', formula: 'NH3', cid: '222' },
    { name: 'Carbon Dioxide', formula: 'CO2', cid: '280' },
    { name: 'Acetone', formula: 'C3H6O', cid: '180' },
    { name: 'Dopamine', formula: 'C8H11NO2', cid: '681' },
    { name: 'Serotonin', formula: 'C10H12N2O', cid: '5202' },
  ];

  // Periodic table data (abbreviated)
  const periodicElements = [
    { symbol: 'H', name: 'Hydrogen', number: 1, mass: 1.008, category: 'nonmetal' },
    { symbol: 'He', name: 'Helium', number: 2, mass: 4.003, category: 'noble' },
    { symbol: 'Li', name: 'Lithium', number: 3, mass: 6.941, category: 'alkali' },
    { symbol: 'Be', name: 'Beryllium', number: 4, mass: 9.012, category: 'alkaline' },
    { symbol: 'B', name: 'Boron', number: 5, mass: 10.81, category: 'metalloid' },
    { symbol: 'C', name: 'Carbon', number: 6, mass: 12.01, category: 'nonmetal' },
    { symbol: 'N', name: 'Nitrogen', number: 7, mass: 14.01, category: 'nonmetal' },
    { symbol: 'O', name: 'Oxygen', number: 8, mass: 16.00, category: 'nonmetal' },
    { symbol: 'F', name: 'Fluorine', number: 9, mass: 19.00, category: 'halogen' },
    { symbol: 'Ne', name: 'Neon', number: 10, mass: 20.18, category: 'noble' },
    { symbol: 'Na', name: 'Sodium', number: 11, mass: 22.99, category: 'alkali' },
    { symbol: 'Mg', name: 'Magnesium', number: 12, mass: 24.31, category: 'alkaline' },
    { symbol: 'Al', name: 'Aluminum', number: 13, mass: 26.98, category: 'metal' },
    { symbol: 'Si', name: 'Silicon', number: 14, mass: 28.09, category: 'metalloid' },
    { symbol: 'P', name: 'Phosphorus', number: 15, mass: 30.97, category: 'nonmetal' },
    { symbol: 'S', name: 'Sulfur', number: 16, mass: 32.07, category: 'nonmetal' },
    { symbol: 'Cl', name: 'Chlorine', number: 17, mass: 35.45, category: 'halogen' },
    { symbol: 'Ar', name: 'Argon', number: 18, mass: 39.95, category: 'noble' },
    { symbol: 'K', name: 'Potassium', number: 19, mass: 39.10, category: 'alkali' },
    { symbol: 'Ca', name: 'Calcium', number: 20, mass: 40.08, category: 'alkaline' },
    { symbol: 'Fe', name: 'Iron', number: 26, mass: 55.85, category: 'transition' },
    { symbol: 'Cu', name: 'Copper', number: 29, mass: 63.55, category: 'transition' },
    { symbol: 'Zn', name: 'Zinc', number: 30, mass: 65.38, category: 'transition' },
    { symbol: 'Ag', name: 'Silver', number: 47, mass: 107.87, category: 'transition' },
    { symbol: 'Au', name: 'Gold', number: 79, mass: 196.97, category: 'transition' },
  ];

  const categoryColors = {
    nonmetal: '#a8e6cf',
    noble: '#dda0dd',
    alkali: '#ffb3ba',
    alkaline: '#ffd700',
    metalloid: '#b4a7d6',
    metal: '#87ceeb',
    halogen: '#98d8c8',
    transition: '#f0e68c'
  };

  // Load 3Dmol and render molecule
  const loadMolecule = async (name) => {
    setLoading(true);
    setError(null);

    try {
      // Load 3Dmol.js dynamically
      if (!window.$3Dmol) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://3dmol.org/build/3Dmol-min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Search PubChem for the molecule
      const searchRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`
      );
      
      if (!searchRes.ok) throw new Error('Molecule not found');
      
      const searchData = await searchRes.json();
      const cid = searchData.PropertyTable.Properties[0].CID;

      // Get 3D structure
      const sdfRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
      );
      
      if (!sdfRes.ok) throw new Error('3D structure not available');
      
      const sdfData = await sdfRes.text();

      // Clear previous viewer
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
        
        // Create new viewer
        const viewer = window.$3Dmol.createViewer(viewerRef.current, {
          backgroundColor: 'white'
        });
        
        viewer.addModel(sdfData, 'sdf');
        viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.25 } });
        viewer.zoomTo();
        viewer.render();
        viewer.spin(true);
        
        viewerInstance.current = viewer;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load initial molecule
  useEffect(() => {
    if (open && activeTab === 0) {
      loadMolecule(moleculeName);
    }
    
    return () => {
      if (viewerInstance.current) {
        viewerInstance.current.spin(false);
      }
    };
  }, [open, activeTab]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '85vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#4caf50',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScienceIcon />
          <Typography variant="h6">Chemistry Tools</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<ScienceIcon />} label="3D Molecules" />
          <Tab label="Periodic Table" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* 3D Molecule Viewer Tab */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                value={moleculeName}
                onChange={(e) => setMoleculeName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadMolecule(moleculeName)}
                placeholder="Enter molecule name (e.g., caffeine, aspirin)"
                size="small"
              />
              <Button 
                variant="contained" 
                onClick={() => loadMolecule(moleculeName)}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                sx={{ bgcolor: '#4caf50' }}
              >
                View
              </Button>
            </Box>

            {/* Quick molecule buttons */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {commonMolecules.slice(0, 8).map((m) => (
                <Chip
                  key={m.cid}
                  label={m.name}
                  size="small"
                  onClick={() => {
                    setMoleculeName(m.name);
                    loadMolecule(m.name);
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}. Try a different molecule name.
              </Alert>
            )}

            {/* 3D Viewer */}
            <Paper elevation={3} sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
              <Box 
                ref={viewerRef} 
                sx={{ 
                  width: '100%', 
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {loading && <CircularProgress />}
              </Box>
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Drag to rotate • Scroll to zoom • Data from PubChem
            </Typography>
          </Box>
        )}

        {/* Periodic Table Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Click on an element to see details
            </Typography>

            {/* Legend */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(categoryColors).map(([cat, color]) => (
                <Chip 
                  key={cat} 
                  label={cat} 
                  size="small" 
                  sx={{ bgcolor: color, textTransform: 'capitalize' }}
                />
              ))}
            </Box>

            <Grid container spacing={1}>
              {periodicElements.map((el) => (
                <Grid item xs={4} sm={3} md={2} key={el.symbol}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: categoryColors[el.category],
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {el.number}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {el.symbol}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {el.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {el.mass}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChemistryTools;

