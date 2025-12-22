/**
 * Chemistry AR Viewer
 * WebAR implementation for viewing 3D molecular structures in augmented reality
 * Uses Three.js + WebXR API for AR visualization
 * v10.5.0: Initial Chemistry AR implementation
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ViewInAr as ARIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import * as THREE from 'three';

function ChemistryAR({ open, onClose, moleculeData, moleculeName }) {
  const containerRef = useRef(null);
  const [arSupported, setArSupported] = useState(null);
  const [arSession, setArSession] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  // Check AR support on mount
  useEffect(() => {
    checkARSupport();
  }, []);

  const checkARSupport = async () => {
    if (!navigator.xr) {
      setArSupported(false);
      setError('WebXR not supported. AR requires Android Chrome 79+ or iOS Safari 13+');
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      setArSupported(supported);
      if (!supported) {
        setError('AR not available on this device. Try on a newer phone with AR support.');
      }
    } catch (err) {
      setArSupported(false);
      setError('Could not check AR support: ' + err.message);
    }
  };

  // Create 3D molecule from data
  const createMolecule = (scene) => {
    if (!moleculeData || !moleculeData.atoms) {
      console.error('No molecule data available');
      return;
    }

    const moleculeGroup = new THREE.Group();

    // Atom colors (CPK coloring scheme)
    const atomColors = {
      'C': 0x909090,  // Carbon - Grey
      'H': 0xFFFFFF,  // Hydrogen - White
      'O': 0xFF0000,  // Oxygen - Red
      'N': 0x0000FF,  // Nitrogen - Blue
      'S': 0xFFFF00,  // Sulfur - Yellow
      'P': 0xFFA500,  // Phosphorus - Orange
      'Cl': 0x00FF00, // Chlorine - Green
      'F': 0x90E050,  // Fluorine - Light Green
      'Br': 0xA52A2A, // Bromine - Brown
      'I': 0x940094,  // Iodine - Purple
      'Default': 0xFF1493 // Other - Pink
    };

    // Atom sizes (van der Waals radii scaled)
    const atomSizes = {
      'H': 0.15,
      'C': 0.20,
      'N': 0.20,
      'O': 0.18,
      'S': 0.22,
      'P': 0.22,
      'Default': 0.20
    };

    // Create atoms
    moleculeData.atoms.forEach((atom, index) => {
      const element = atom.element || atom.label || 'C';
      const color = atomColors[element] || atomColors['Default'];
      const size = atomSizes[element] || atomSizes['Default'];

      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: color,
        metalness: 0.3,
        roughness: 0.4
      });
      const sphere = new THREE.Mesh(geometry, material);

      // Position (scale to reasonable AR size - molecules are tiny!)
      sphere.position.set(
        (atom.x || 0) * 0.1,  // Scale down by 10x for AR viewing
        (atom.y || 0) * 0.1,
        (atom.z || 0) * 0.1
      );

      moleculeGroup.add(sphere);
    });

    // Create bonds if available
    if (moleculeData.bonds) {
      moleculeData.bonds.forEach(bond => {
        const atom1 = moleculeData.atoms[bond.atom1];
        const atom2 = moleculeData.atoms[bond.atom2];

        if (atom1 && atom2) {
          const start = new THREE.Vector3(atom1.x * 0.1, atom1.y * 0.1, atom1.z * 0.1);
          const end = new THREE.Vector3(atom2.x * 0.1, atom2.y * 0.1, atom2.z * 0.1);
          const direction = new THREE.Vector3().subVectors(end, start);
          const length = direction.length();

          const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0xCCCCCC,
            metalness: 0.5,
            roughness: 0.5
          });
          const cylinder = new THREE.Mesh(geometry, material);

          cylinder.position.copy(start).add(direction.multiplyScalar(0.5));
          cylinder.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
          );

          moleculeGroup.add(cylinder);
        }
      });
    }

    // Center the molecule
    const box = new THREE.Box3().setFromObject(moleculeGroup);
    const center = box.getCenter(new THREE.Vector3());
    moleculeGroup.position.sub(center);

    scene.add(moleculeGroup);

    // Add rotation animation
    const animate = () => {
      if (moleculeGroup && arSession) {
        moleculeGroup.rotation.y += 0.01;
        requestAnimationFrame(animate);
      }
    };
    animate();

    return moleculeGroup;
  };

  const startAR = async () => {
    if (!arSupported) {
      setError('AR not supported on this device');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request AR session
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: containerRef.current ? { root: containerRef.current } : undefined
      });

      setArSession(session);

      // Setup WebGL context
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl', { xrCompatible: true });

      // Create Three.js renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: gl,
        alpha: true,
        antialias: true
      });
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      renderer.xr.setSession(session);
      rendererRef.current = renderer;

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      cameraRef.current = camera;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);

      // Create molecule
      createMolecule(scene);

      // Render loop
      renderer.setAnimationLoop((time, frame) => {
        if (frame) {
          renderer.render(scene, camera);
        }
      });

      // Handle session end
      session.addEventListener('end', () => {
        setArSession(null);
        setLoading(false);
        renderer.setAnimationLoop(null);
      });

      setLoading(false);

    } catch (err) {
      console.error('AR Error:', err);
      setError('Failed to start AR: ' + err.message);
      setLoading(false);
      setArSession(null);
    }
  };

  const stopAR = () => {
    if (arSession) {
      arSession.end();
      setArSession(null);
    }
  };

  const handleClose = () => {
    stopAR();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ARIcon />
          <Typography variant="h6">
            AR View: {moleculeName || 'Molecule'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent ref={containerRef} sx={{ py: 3 }}>
        {arSupported === null && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress sx={{ color: 'white' }} />
            <Typography>Checking AR support...</Typography>
          </Box>
        )}

        {arSupported === false && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'AR not supported on this device'}
          </Alert>
        )}

        {arSupported && !arSession && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Experience this molecule in augmented reality! 
              Point your camera at a flat surface to place the 3D molecule in your space.
            </Typography>

            <Alert severity="info" icon={<HelpIcon />} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <strong>How to use:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>Point your camera at a flat surface (desk, floor, table)</li>
                <li>The molecule will appear in 3D</li>
                <li>Walk around to view from all angles</li>
                <li>Pinch to zoom, drag to rotate</li>
              </ul>
            </Alert>

            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <ARIcon />}
              onClick={startAR}
              disabled={loading}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': { bgcolor: '#f0f0f0' },
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Launching AR...' : 'Start AR Experience'}
            </Button>

            {error && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {arSession && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              AR Session Active
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Point at a surface to place the molecule
            </Typography>
            <Button
              variant="contained"
              onClick={stopAR}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': { bgcolor: '#f0f0f0' }
              }}
            >
              Exit AR
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChemistryAR;

