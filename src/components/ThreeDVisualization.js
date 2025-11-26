import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import * as THREE from 'three';

/**
 * ThreeDVisualization - Renders 3D geometric shapes using Three.js
 * 
 * Supported shapes:
 * - cube, sphere, cone, cylinder, pyramid, torus, dodecahedron, icosahedron
 * 
 * Props:
 * - shapeType: string (required) - Type of shape to render
 * - color: string (optional) - Hex color (default: '#4FC3F7')
 * - wireframe: boolean (optional) - Show wireframe (default: false)
 * - dimensions: object (optional) - Shape-specific dimensions
 * - labels: array (optional) - Text labels for vertices/faces
 * - rotate: boolean (optional) - Auto-rotate (default: true)
 */
const ThreeDVisualization = ({ 
  shapeType, 
  color = '#4FC3F7', 
  wireframe = false,
  dimensions = {},
  labels = [],
  rotate = true,
  title = ''
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !shapeType) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create geometry based on shapeType
    let geometry;
    const { width = 2, height = 2, depth = 2, radius = 1.5, detail = 0 } = dimensions;

    switch (shapeType.toLowerCase()) {
      case 'cube':
      case 'box':
        geometry = new THREE.BoxGeometry(width, height, depth);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(radius, 32, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(radius, height || 3, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(radius, radius, height || 3, 32);
        break;
      case 'pyramid':
        geometry = new THREE.ConeGeometry(radius, height || 3, 4);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(radius, 0.4, 16, 100);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(radius, detail);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(radius, detail);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(radius, detail);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(radius, detail);
        break;
      default:
        geometry = new THREE.BoxGeometry(width, height, depth);
    }

    // Material
    const material = new THREE.MeshPhongMaterial({
      color: color,
      wireframe: wireframe,
      transparent: !wireframe,
      opacity: wireframe ? 1 : 0.8,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add edges for better visibility
    if (!wireframe) {
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      const wireframeLines = new THREE.LineSegments(edges, lineMaterial);
      mesh.add(wireframeLines);
    }

    // Add axis helpers
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (rotate) {
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [shapeType, color, wireframe, dimensions, rotate]);

  return (
    <Paper elevation={3} sx={{ p: 2, my: 2, maxWidth: 600, mx: 'auto' }}>
      {title && (
        <Typography variant="h6" gutterBottom align="center" color="primary">
          {title}
        </Typography>
      )}
      <Box
        ref={mountRef}
        sx={{
          width: '100%',
          height: 400,
          borderRadius: 1,
          overflow: 'hidden',
          '& canvas': {
            display: 'block'
          }
        }}
      />
      {labels.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {labels.map((label, idx) => (
            <Typography key={idx} variant="body2" color="text.secondary">
              • {label}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default ThreeDVisualization;

