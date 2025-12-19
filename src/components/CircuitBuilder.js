/**
 * CircuitBuilder.js
 * v7.2.25: Interactive circuit builder using React Flow
 * 
 * Allows students to build and simulate digital logic circuits
 */

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Delete,
  Add,
  Refresh,
  Close
} from '@mui/icons-material';

// Gate colors
const GATE_COLORS = {
  AND: '#2196F3',
  OR: '#4CAF50',
  NOT: '#FF9800',
  NAND: '#9C27B0',
  NOR: '#E91E63',
  XOR: '#00BCD4',
  XNOR: '#795548',
  INPUT: '#607D8B',
  OUTPUT: '#F44336'
};

// Custom AND Gate Node
const ANDGateNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: 'white',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 80,
    textAlign: 'center'
  }}>
    <Handle type="target" position={Position.Left} id="a" style={{ top: '30%', background: GATE_COLORS.AND }} />
    <Handle type="target" position={Position.Left} id="b" style={{ top: '70%', background: GATE_COLORS.AND }} />
    <Typography variant="caption" fontWeight="bold" color={GATE_COLORS.AND}>AND</Typography>
    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {data.output !== undefined ? (data.output ? '1' : '0') : '?'}
    </Box>
    <Handle type="source" position={Position.Right} id="out" style={{ background: GATE_COLORS.AND }} />
  </Box>
);

// Custom OR Gate Node
const ORGateNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: 'white',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 80,
    textAlign: 'center'
  }}>
    <Handle type="target" position={Position.Left} id="a" style={{ top: '30%', background: GATE_COLORS.OR }} />
    <Handle type="target" position={Position.Left} id="b" style={{ top: '70%', background: GATE_COLORS.OR }} />
    <Typography variant="caption" fontWeight="bold" color={GATE_COLORS.OR}>OR</Typography>
    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {data.output !== undefined ? (data.output ? '1' : '0') : '?'}
    </Box>
    <Handle type="source" position={Position.Right} id="out" style={{ background: GATE_COLORS.OR }} />
  </Box>
);

// Custom NOT Gate Node
const NOTGateNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: 'white',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 60,
    textAlign: 'center'
  }}>
    <Handle type="target" position={Position.Left} id="a" style={{ background: GATE_COLORS.NOT }} />
    <Typography variant="caption" fontWeight="bold" color={GATE_COLORS.NOT}>NOT</Typography>
    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {data.output !== undefined ? (data.output ? '1' : '0') : '?'}
    </Box>
    <Handle type="source" position={Position.Right} id="out" style={{ background: GATE_COLORS.NOT }} />
  </Box>
);

// Custom NAND Gate Node
const NANDGateNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: 'white',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 80,
    textAlign: 'center'
  }}>
    <Handle type="target" position={Position.Left} id="a" style={{ top: '30%', background: GATE_COLORS.NAND }} />
    <Handle type="target" position={Position.Left} id="b" style={{ top: '70%', background: GATE_COLORS.NAND }} />
    <Typography variant="caption" fontWeight="bold" color={GATE_COLORS.NAND}>NAND</Typography>
    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {data.output !== undefined ? (data.output ? '1' : '0') : '?'}
    </Box>
    <Handle type="source" position={Position.Right} id="out" style={{ background: GATE_COLORS.NAND }} />
  </Box>
);

// Custom NOR Gate Node
const NORGateNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: 'white',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 80,
    textAlign: 'center'
  }}>
    <Handle type="target" position={Position.Left} id="a" style={{ top: '30%', background: GATE_COLORS.NOR }} />
    <Handle type="target" position={Position.Left} id="b" style={{ top: '70%', background: GATE_COLORS.NOR }} />
    <Typography variant="caption" fontWeight="bold" color={GATE_COLORS.NOR}>NOR</Typography>
    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {data.output !== undefined ? (data.output ? '1' : '0') : '?'}
    </Box>
    <Handle type="source" position={Position.Right} id="out" style={{ background: GATE_COLORS.NOR }} />
  </Box>
);

// Custom XOR Gate Node
const XORGateNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: 'white',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 80,
    textAlign: 'center'
  }}>
    <Handle type="target" position={Position.Left} id="a" style={{ top: '30%', background: GATE_COLORS.XOR }} />
    <Handle type="target" position={Position.Left} id="b" style={{ top: '70%', background: GATE_COLORS.XOR }} />
    <Typography variant="caption" fontWeight="bold" color={GATE_COLORS.XOR}>XOR</Typography>
    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {data.output !== undefined ? (data.output ? '1' : '0') : '?'}
    </Box>
    <Handle type="source" position={Position.Right} id="out" style={{ background: GATE_COLORS.XOR }} />
  </Box>
);

// Input Node (toggleable)
const InputNode = ({ data, selected }) => (
  <Box 
    sx={{ 
      position: 'relative',
      bgcolor: data.value ? '#4CAF50' : '#f44336',
      border: 2,
      borderColor: selected ? 'primary.main' : 'grey.400',
      borderRadius: '50%',
      width: 50,
      height: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'white',
      fontWeight: 'bold',
      transition: 'all 0.2s'
    }}
    onClick={data.onToggle}
  >
    <Typography variant="body2" fontWeight="bold">
      {data.label}: {data.value ? '1' : '0'}
    </Typography>
    <Handle type="source" position={Position.Right} id="out" style={{ background: '#333' }} />
  </Box>
);

// Output Node
const OutputNode = ({ data, selected }) => (
  <Box sx={{ 
    position: 'relative',
    bgcolor: data.value ? '#4CAF50' : '#f44336',
    border: 2,
    borderColor: selected ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    p: 1,
    minWidth: 60,
    textAlign: 'center',
    color: 'white'
  }}>
    <Handle type="target" position={Position.Left} id="in" style={{ background: '#333' }} />
    <Typography variant="caption" fontWeight="bold">{data.label}</Typography>
    <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
      {data.value !== undefined ? (data.value ? '1' : '0') : '?'}
    </Box>
  </Box>
);

// Node types mapping
const nodeTypes = {
  andGate: ANDGateNode,
  orGate: ORGateNode,
  notGate: NOTGateNode,
  nandGate: NANDGateNode,
  norGate: NORGateNode,
  xorGate: XORGateNode,
  input: InputNode,
  output: OutputNode
};

// Gate logic functions
const gateLogic = {
  andGate: (a, b) => a && b,
  orGate: (a, b) => a || b,
  notGate: (a) => !a,
  nandGate: (a, b) => !(a && b),
  norGate: (a, b) => !(a || b),
  xorGate: (a, b) => a !== b,
  xnorGate: (a, b) => a === b
};

/**
 * Circuit Builder Component
 */
function CircuitBuilder({ 
  open, 
  onClose, 
  initialCircuit = null,
  title = "Circuit Builder"
}) {
  const [selectedGate, setSelectedGate] = useState('andGate');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialCircuit?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialCircuit?.edges || []);
  const [isSimulating, setIsSimulating] = useState(false);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);

  // Memoize node types to prevent re-renders
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Handle edge connections
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  // Add a new gate
  const addGate = useCallback((type) => {
    const newNode = {
      id: `${type}-${nodeIdCounter}`,
      type,
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: type.replace('Gate', '').toUpperCase(), output: undefined }
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((c) => c + 1);
  }, [nodeIdCounter, setNodes]);

  // Add input node
  const addInput = useCallback((label = 'A') => {
    const newNode = {
      id: `input-${nodeIdCounter}`,
      type: 'input',
      position: { x: 50, y: 100 + nodes.filter(n => n.type === 'input').length * 80 },
      data: { 
        label, 
        value: false,
        onToggle: () => toggleInput(`input-${nodeIdCounter}`)
      }
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((c) => c + 1);
  }, [nodeIdCounter, nodes, setNodes]);

  // Add output node
  const addOutput = useCallback((label = 'Y') => {
    const newNode = {
      id: `output-${nodeIdCounter}`,
      type: 'output',
      position: { x: 500, y: 100 + nodes.filter(n => n.type === 'output').length * 80 },
      data: { label, value: undefined }
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((c) => c + 1);
  }, [nodeIdCounter, nodes, setNodes]);

  // Toggle input value
  const toggleInput = useCallback((nodeId) => {
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            value: !node.data.value
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Update node data with toggle function
  const updateNodeToggle = useCallback(() => {
    setNodes((nds) => nds.map(node => {
      if (node.type === 'input') {
        return {
          ...node,
          data: {
            ...node.data,
            onToggle: () => toggleInput(node.id)
          }
        };
      }
      return node;
    }));
  }, [setNodes, toggleInput]);

  // Simulate the circuit
  const simulate = useCallback(() => {
    setIsSimulating(true);
    
    // Build adjacency list
    const graph = {};
    const inputValues = {};
    
    // Initialize input values
    nodes.forEach(node => {
      if (node.type === 'input') {
        inputValues[node.id] = node.data.value;
      }
    });
    
    // Build graph from edges
    edges.forEach(edge => {
      if (!graph[edge.target]) {
        graph[edge.target] = [];
      }
      graph[edge.target].push({ source: edge.source, handle: edge.targetHandle });
    });
    
    // Topological evaluation (simplified - assumes DAG)
    const evaluated = { ...inputValues };
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      nodes.forEach(node => {
        if (node.type !== 'input' && evaluated[node.id] === undefined) {
          const inputs = graph[node.id] || [];
          const inputVals = inputs.map(inp => evaluated[inp.source]);
          
          if (inputVals.every(v => v !== undefined)) {
            let output;
            const logic = gateLogic[node.type];
            
            if (logic) {
              if (node.type === 'notGate') {
                output = logic(inputVals[0]);
              } else {
                output = logic(inputVals[0], inputVals[1]);
              }
            } else if (node.type === 'output') {
              output = inputVals[0];
            }
            
            evaluated[node.id] = output;
            changed = true;
          }
        }
      });
    }
    
    // Update node displays
    setNodes((nds) => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        output: node.type !== 'input' && node.type !== 'output' ? evaluated[node.id] : undefined,
        value: node.type === 'output' ? evaluated[node.id] : node.data.value
      }
    })));
    
    setTimeout(() => setIsSimulating(false), 500);
  }, [nodes, edges, setNodes]);

  // Clear circuit
  const clearCircuit = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeIdCounter(1);
  }, [setNodes, setEdges]);

  // Delete selected nodes
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter(n => !n.selected));
    setEdges((eds) => eds.filter(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      return sourceNode && !sourceNode.selected && targetNode && !targetNode.selected;
    }));
  }, [nodes, setNodes, setEdges]);

  // Update toggles when nodes change
  React.useEffect(() => {
    updateNodeToggle();
  }, [nodes.length, updateNodeToggle]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <Chip label="Interactive" size="small" color="primary" />
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Toolbar */}
        <Paper sx={{ p: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Add Gate:</Typography>
          <ToggleButtonGroup
            value={selectedGate}
            exclusive
            onChange={(e, val) => val && setSelectedGate(val)}
            size="small"
          >
            {Object.keys(gateLogic).map(gate => (
              <ToggleButton key={gate} value={gate} sx={{ textTransform: 'none' }}>
                {gate.replace('Gate', '').toUpperCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<Add />}
            onClick={() => addGate(selectedGate)}
          >
            Add Gate
          </Button>
          
          <Divider orientation="vertical" flexItem />
          
          <Button size="small" variant="outlined" onClick={() => addInput(String.fromCharCode(65 + nodes.filter(n => n.type === 'input').length))}>
            + Input
          </Button>
          <Button size="small" variant="outlined" onClick={() => addOutput('Y' + (nodes.filter(n => n.type === 'output').length || ''))}>
            + Output
          </Button>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Simulate Circuit">
            <Button 
              size="small" 
              variant="contained" 
              color="success"
              startIcon={<PlayArrow />}
              onClick={simulate}
              disabled={isSimulating}
            >
              {isSimulating ? 'Simulating...' : 'Simulate'}
            </Button>
          </Tooltip>
          
          <Tooltip title="Delete Selected">
            <IconButton size="small" onClick={deleteSelected} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Clear All">
            <IconButton size="small" onClick={clearCircuit}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Paper>
        
        {/* Circuit Canvas */}
        <Box sx={{ height: 400, bgcolor: '#f8f9fa' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={memoizedNodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </Box>
        
        {/* Instructions */}
        <Paper sx={{ p: 1.5, bgcolor: 'info.lighter', m: 1 }}>
          <Typography variant="caption" color="info.dark">
            <strong>How to use:</strong> Add inputs (click to toggle 0/1) → Add gates → Connect by dragging from output handles to input handles → Add output → Click Simulate
          </Typography>
        </Paper>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CircuitBuilder;

