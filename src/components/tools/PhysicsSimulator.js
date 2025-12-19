import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  Slider,
  Grid,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as ResetIcon,
  Circle as CircleIcon,
  CropSquare as SquareIcon
} from '@mui/icons-material';
import Matter from 'matter-js';

/**
 * PhysicsSimulator - 2D Physics simulation using Matter.js
 * Features: Gravity simulation, collision detection, interactive object creation
 */
function PhysicsSimulator({ open, onClose }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  
  const [isRunning, setIsRunning] = useState(true);
  const [gravity, setGravity] = useState(1);
  const [shapeType, setShapeType] = useState('circle');
  const [scenario, setScenario] = useState('playground');

  const scenarios = [
    { id: 'playground', name: 'Playground', desc: 'Free play with physics' },
    { id: 'pendulum', name: 'Pendulum', desc: 'Simple harmonic motion' },
    { id: 'collision', name: 'Collisions', desc: 'Elastic collisions demo' },
    { id: 'stack', name: 'Stacking', desc: 'Tower building' },
    { id: 'bridge', name: 'Bridge', desc: 'Rope bridge physics' },
  ];

  // Initialize Matter.js
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Constraint, Body } = Matter;

    // Create engine
    const engine = Engine.create();
    engine.world.gravity.y = gravity;
    engineRef.current = engine;

    // Create renderer
    const render = Render.create({
      element: canvasRef.current,
      engine: engine,
      options: {
        width: canvasRef.current.clientWidth || 600,
        height: 400,
        wireframes: false,
        background: '#1a1a2e',
        showVelocity: true
      }
    });
    renderRef.current = render;

    // Create runner
    const runner = Runner.create();
    runnerRef.current = runner;

    // Ground and walls
    const ground = Bodies.rectangle(300, 410, 600, 20, { 
      isStatic: true, 
      render: { fillStyle: '#4a4a6a' }
    });
    const leftWall = Bodies.rectangle(-10, 200, 20, 400, { 
      isStatic: true,
      render: { fillStyle: '#4a4a6a' }
    });
    const rightWall = Bodies.rectangle(610, 200, 20, 400, { 
      isStatic: true,
      render: { fillStyle: '#4a4a6a' }
    });

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Add scenario-specific objects
    if (scenario === 'pendulum') {
      const pendulum = Bodies.circle(400, 200, 30, { 
        render: { fillStyle: '#ff6b6b' }
      });
      const constraint = Constraint.create({
        pointA: { x: 300, y: 50 },
        bodyB: pendulum,
        length: 200,
        stiffness: 1,
        render: { strokeStyle: '#ffffff', lineWidth: 2 }
      });
      Composite.add(engine.world, [pendulum, constraint]);
    } else if (scenario === 'collision') {
      const ball1 = Bodies.circle(100, 300, 30, { 
        restitution: 1,
        render: { fillStyle: '#4ecdc4' }
      });
      const ball2 = Bodies.circle(500, 300, 30, { 
        restitution: 1,
        render: { fillStyle: '#ff6b6b' }
      });
      Body.setVelocity(ball1, { x: 5, y: 0 });
      Body.setVelocity(ball2, { x: -5, y: 0 });
      Composite.add(engine.world, [ball1, ball2]);
    } else if (scenario === 'stack') {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5 - i; j++) {
          const box = Bodies.rectangle(
            250 + j * 45 + i * 22.5, 
            370 - i * 45, 
            40, 
            40, 
            { render: { fillStyle: `hsl(${i * 50 + j * 30}, 70%, 60%)` }}
          );
          Composite.add(engine.world, box);
        }
      }
    } else if (scenario === 'bridge') {
      const group = Body.nextGroup(true);
      const bridgeLinks = [];
      for (let i = 0; i < 10; i++) {
        bridgeLinks.push(Bodies.rectangle(150 + i * 35, 200, 30, 10, {
          collisionFilter: { group: group },
          render: { fillStyle: '#8b4513' }
        }));
      }
      
      const bridgeChain = Matter.Composites.chain(
        Matter.Composite.create({ bodies: bridgeLinks }),
        0.5, 0, -0.5, 0,
        { stiffness: 0.9, length: 5, render: { visible: false }}
      );
      
      Composite.add(engine.world, [
        bridgeChain,
        Constraint.create({ pointA: { x: 120, y: 200 }, bodyB: bridgeLinks[0], pointB: { x: -15, y: 0 }}),
        Constraint.create({ pointA: { x: 480, y: 200 }, bodyB: bridgeLinks[9], pointB: { x: 15, y: 0 }})
      ]);
    }

    // Mouse interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Add objects on click
    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      const { mouse } = event;
      if (mouse.button === 0 && !mouseConstraint.body) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        let body;
        if (shapeType === 'circle') {
          body = Bodies.circle(mouse.position.x, mouse.position.y, 20 + Math.random() * 20, {
            restitution: 0.6,
            render: { fillStyle: color }
          });
        } else {
          const size = 30 + Math.random() * 30;
          body = Bodies.rectangle(mouse.position.x, mouse.position.y, size, size, {
            restitution: 0.6,
            render: { fillStyle: color }
          });
        }
        Composite.add(engine.world, body);
      }
    });

    // Run
    Render.run(render);
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [open, scenario]);

  // Update gravity
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.world.gravity.y = gravity;
    }
  }, [gravity]);

  // Toggle simulation
  const toggleSimulation = () => {
    if (runnerRef.current && engineRef.current) {
      if (isRunning) {
        Matter.Runner.stop(runnerRef.current);
      } else {
        Matter.Runner.run(runnerRef.current, engineRef.current);
      }
      setIsRunning(!isRunning);
    }
  };

  // Reset simulation
  const resetSimulation = () => {
    setScenario(s => s); // Force re-render
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#6c5ce7',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">⚡ Physics Simulator</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={toggleSimulation}
            startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
            sx={{ bgcolor: isRunning ? '#e74c3c' : '#27ae60' }}
          >
            {isRunning ? 'Pause' : 'Play'}
          </Button>
          
          <Button variant="outlined" onClick={resetSimulation} startIcon={<ResetIcon />}>
            Reset
          </Button>

          <ToggleButtonGroup
            value={shapeType}
            exclusive
            onChange={(e, v) => v && setShapeType(v)}
            size="small"
          >
            <ToggleButton value="circle">
              <CircleIcon /> Circle
            </ToggleButton>
            <ToggleButton value="square">
              <SquareIcon /> Square
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Scenario selection */}
        <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {scenarios.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              onClick={() => setScenario(s.id)}
              color={scenario === s.id ? 'primary' : 'default'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* Gravity slider */}
        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="body2" gutterBottom>
            Gravity: {gravity.toFixed(1)} (Earth = 1.0)
          </Typography>
          <Slider
            value={gravity}
            onChange={(e, v) => setGravity(v)}
            min={0}
            max={3}
            step={0.1}
            marks={[
              { value: 0, label: 'Zero-G' },
              { value: 0.38, label: 'Mars' },
              { value: 1, label: 'Earth' },
              { value: 2.5, label: 'Jupiter' }
            ]}
          />
        </Box>

        {/* Canvas */}
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box ref={canvasRef} sx={{ width: '100%', height: 400 }} />
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 Click to add objects • Drag objects to move • Adjust gravity to see effects
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default PhysicsSimulator;

