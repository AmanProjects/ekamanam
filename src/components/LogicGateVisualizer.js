/**
 * LogicGateVisualizer.js
 * v7.2.25: SVG-based logic gate visualization for digital electronics
 * 
 * Renders logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR) as SVG components
 * Can display truth tables and circuit diagrams inline
 */

import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

// Gate dimensions
const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;
const INPUT_LENGTH = 20;
const OUTPUT_LENGTH = 20;

// Color scheme
const COLORS = {
  wire: '#333',
  wireActive: '#4CAF50',
  gateFill: '#fff',
  gateStroke: '#1976d2',
  inputLabel: '#666',
  outputLabel: '#333',
  high: '#4CAF50',
  low: '#f44336'
};

/**
 * AND Gate SVG
 */
const ANDGate = ({ inputs = ['A', 'B'], output = 'Y', inputValues, showLabels = true }) => (
  <svg width="120" height="60" viewBox="0 0 120 60">
    {/* Input wires */}
    <line x1="0" y1="20" x2={INPUT_LENGTH} y2="20" 
      stroke={inputValues?.[0] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    <line x1="0" y1="40" x2={INPUT_LENGTH} y2="40" 
      stroke={inputValues?.[1] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Gate body - AND shape */}
    <path 
      d={`M ${INPUT_LENGTH} 10 
          L ${INPUT_LENGTH} 50 
          L ${INPUT_LENGTH + 30} 50 
          Q ${INPUT_LENGTH + GATE_WIDTH} 50 ${INPUT_LENGTH + GATE_WIDTH} 30
          Q ${INPUT_LENGTH + GATE_WIDTH} 10 ${INPUT_LENGTH + 30} 10 
          Z`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + GATE_WIDTH} y1="30" x2="120" y2="30" 
      stroke={inputValues ? (inputValues[0] && inputValues[1] ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="18" fontSize="10" fill={COLORS.inputLabel}>{inputs[0]}</text>
        <text x="5" y="43" fontSize="10" fill={COLORS.inputLabel}>{inputs[1]}</text>
        <text x="105" y="28" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="45" y="34" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">&amp;</text>
      </>
    )}
  </svg>
);

/**
 * OR Gate SVG
 */
const ORGate = ({ inputs = ['A', 'B'], output = 'Y', inputValues, showLabels = true }) => (
  <svg width="120" height="60" viewBox="0 0 120 60">
    {/* Input wires */}
    <line x1="0" y1="20" x2={INPUT_LENGTH + 5} y2="20" 
      stroke={inputValues?.[0] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    <line x1="0" y1="40" x2={INPUT_LENGTH + 5} y2="40" 
      stroke={inputValues?.[1] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Gate body - OR shape */}
    <path 
      d={`M ${INPUT_LENGTH} 10 
          Q ${INPUT_LENGTH + 15} 30 ${INPUT_LENGTH} 50
          Q ${INPUT_LENGTH + 40} 50 ${INPUT_LENGTH + GATE_WIDTH} 30
          Q ${INPUT_LENGTH + 40} 10 ${INPUT_LENGTH} 10
          Z`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + GATE_WIDTH} y1="30" x2="120" y2="30" 
      stroke={inputValues ? (inputValues[0] || inputValues[1] ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="18" fontSize="10" fill={COLORS.inputLabel}>{inputs[0]}</text>
        <text x="5" y="43" fontSize="10" fill={COLORS.inputLabel}>{inputs[1]}</text>
        <text x="105" y="28" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="45" y="34" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">≥1</text>
      </>
    )}
  </svg>
);

/**
 * NOT Gate (Inverter) SVG
 */
const NOTGate = ({ input = 'A', output = 'Y', inputValue, showLabels = true }) => (
  <svg width="100" height="50" viewBox="0 0 100 50">
    {/* Input wire */}
    <line x1="0" y1="25" x2={INPUT_LENGTH} y2="25" 
      stroke={inputValue ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Gate body - Triangle */}
    <polygon 
      points={`${INPUT_LENGTH},10 ${INPUT_LENGTH},40 ${INPUT_LENGTH + 40},25`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Bubble (inversion) */}
    <circle cx={INPUT_LENGTH + 45} cy="25" r="5" 
      fill={COLORS.gateFill} stroke={COLORS.gateStroke} strokeWidth="2" />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + 50} y1="25" x2="100" y2="25" 
      stroke={inputValue !== undefined ? (!inputValue ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="23" fontSize="10" fill={COLORS.inputLabel}>{input}</text>
        <text x="85" y="23" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="35" y="28" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">1</text>
      </>
    )}
  </svg>
);

/**
 * NAND Gate SVG
 */
const NANDGate = ({ inputs = ['A', 'B'], output = 'Y', inputValues, showLabels = true }) => (
  <svg width="130" height="60" viewBox="0 0 130 60">
    {/* Input wires */}
    <line x1="0" y1="20" x2={INPUT_LENGTH} y2="20" 
      stroke={inputValues?.[0] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    <line x1="0" y1="40" x2={INPUT_LENGTH} y2="40" 
      stroke={inputValues?.[1] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Gate body - AND shape */}
    <path 
      d={`M ${INPUT_LENGTH} 10 
          L ${INPUT_LENGTH} 50 
          L ${INPUT_LENGTH + 30} 50 
          Q ${INPUT_LENGTH + GATE_WIDTH} 50 ${INPUT_LENGTH + GATE_WIDTH} 30
          Q ${INPUT_LENGTH + GATE_WIDTH} 10 ${INPUT_LENGTH + 30} 10 
          Z`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Bubble (inversion) */}
    <circle cx={INPUT_LENGTH + GATE_WIDTH + 5} cy="30" r="5" 
      fill={COLORS.gateFill} stroke={COLORS.gateStroke} strokeWidth="2" />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + GATE_WIDTH + 10} y1="30" x2="130" y2="30" 
      stroke={inputValues ? (!(inputValues[0] && inputValues[1]) ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="18" fontSize="10" fill={COLORS.inputLabel}>{inputs[0]}</text>
        <text x="5" y="43" fontSize="10" fill={COLORS.inputLabel}>{inputs[1]}</text>
        <text x="115" y="28" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="45" y="34" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">&amp;</text>
      </>
    )}
  </svg>
);

/**
 * NOR Gate SVG
 */
const NORGate = ({ inputs = ['A', 'B'], output = 'Y', inputValues, showLabels = true }) => (
  <svg width="130" height="60" viewBox="0 0 130 60">
    {/* Input wires */}
    <line x1="0" y1="20" x2={INPUT_LENGTH + 5} y2="20" 
      stroke={inputValues?.[0] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    <line x1="0" y1="40" x2={INPUT_LENGTH + 5} y2="40" 
      stroke={inputValues?.[1] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Gate body - OR shape */}
    <path 
      d={`M ${INPUT_LENGTH} 10 
          Q ${INPUT_LENGTH + 15} 30 ${INPUT_LENGTH} 50
          Q ${INPUT_LENGTH + 40} 50 ${INPUT_LENGTH + GATE_WIDTH} 30
          Q ${INPUT_LENGTH + 40} 10 ${INPUT_LENGTH} 10
          Z`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Bubble (inversion) */}
    <circle cx={INPUT_LENGTH + GATE_WIDTH + 5} cy="30" r="5" 
      fill={COLORS.gateFill} stroke={COLORS.gateStroke} strokeWidth="2" />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + GATE_WIDTH + 10} y1="30" x2="130" y2="30" 
      stroke={inputValues ? (!(inputValues[0] || inputValues[1]) ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="18" fontSize="10" fill={COLORS.inputLabel}>{inputs[0]}</text>
        <text x="5" y="43" fontSize="10" fill={COLORS.inputLabel}>{inputs[1]}</text>
        <text x="115" y="28" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="45" y="34" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">≥1</text>
      </>
    )}
  </svg>
);

/**
 * XOR Gate SVG
 */
const XORGate = ({ inputs = ['A', 'B'], output = 'Y', inputValues, showLabels = true }) => (
  <svg width="120" height="60" viewBox="0 0 120 60">
    {/* Input wires */}
    <line x1="0" y1="20" x2={INPUT_LENGTH + 8} y2="20" 
      stroke={inputValues?.[0] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    <line x1="0" y1="40" x2={INPUT_LENGTH + 8} y2="40" 
      stroke={inputValues?.[1] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Extra curve for XOR */}
    <path 
      d={`M ${INPUT_LENGTH - 5} 10 Q ${INPUT_LENGTH + 10} 30 ${INPUT_LENGTH - 5} 50`}
      fill="none"
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Gate body - OR shape */}
    <path 
      d={`M ${INPUT_LENGTH} 10 
          Q ${INPUT_LENGTH + 15} 30 ${INPUT_LENGTH} 50
          Q ${INPUT_LENGTH + 40} 50 ${INPUT_LENGTH + GATE_WIDTH} 30
          Q ${INPUT_LENGTH + 40} 10 ${INPUT_LENGTH} 10
          Z`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + GATE_WIDTH} y1="30" x2="120" y2="30" 
      stroke={inputValues ? ((inputValues[0] !== inputValues[1]) ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="18" fontSize="10" fill={COLORS.inputLabel}>{inputs[0]}</text>
        <text x="5" y="43" fontSize="10" fill={COLORS.inputLabel}>{inputs[1]}</text>
        <text x="105" y="28" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="45" y="34" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">=1</text>
      </>
    )}
  </svg>
);

/**
 * XNOR Gate SVG
 */
const XNORGate = ({ inputs = ['A', 'B'], output = 'Y', inputValues, showLabels = true }) => (
  <svg width="130" height="60" viewBox="0 0 130 60">
    {/* Input wires */}
    <line x1="0" y1="20" x2={INPUT_LENGTH + 8} y2="20" 
      stroke={inputValues?.[0] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    <line x1="0" y1="40" x2={INPUT_LENGTH + 8} y2="40" 
      stroke={inputValues?.[1] ? COLORS.wireActive : COLORS.wire} strokeWidth="2" />
    
    {/* Extra curve for XOR */}
    <path 
      d={`M ${INPUT_LENGTH - 5} 10 Q ${INPUT_LENGTH + 10} 30 ${INPUT_LENGTH - 5} 50`}
      fill="none"
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Gate body - OR shape */}
    <path 
      d={`M ${INPUT_LENGTH} 10 
          Q ${INPUT_LENGTH + 15} 30 ${INPUT_LENGTH} 50
          Q ${INPUT_LENGTH + 40} 50 ${INPUT_LENGTH + GATE_WIDTH} 30
          Q ${INPUT_LENGTH + 40} 10 ${INPUT_LENGTH} 10
          Z`}
      fill={COLORS.gateFill}
      stroke={COLORS.gateStroke}
      strokeWidth="2"
    />
    
    {/* Bubble (inversion) */}
    <circle cx={INPUT_LENGTH + GATE_WIDTH + 5} cy="30" r="5" 
      fill={COLORS.gateFill} stroke={COLORS.gateStroke} strokeWidth="2" />
    
    {/* Output wire */}
    <line x1={INPUT_LENGTH + GATE_WIDTH + 10} y1="30" x2="130" y2="30" 
      stroke={inputValues ? ((inputValues[0] === inputValues[1]) ? COLORS.wireActive : COLORS.wire) : COLORS.wire} 
      strokeWidth="2" />
    
    {/* Labels */}
    {showLabels && (
      <>
        <text x="5" y="18" fontSize="10" fill={COLORS.inputLabel}>{inputs[0]}</text>
        <text x="5" y="43" fontSize="10" fill={COLORS.inputLabel}>{inputs[1]}</text>
        <text x="115" y="28" fontSize="10" fill={COLORS.outputLabel}>{output}</text>
        <text x="45" y="34" fontSize="10" fill={COLORS.gateStroke} fontWeight="bold">=1</text>
      </>
    )}
  </svg>
);

/**
 * ROM Visualizer - Shows ROM structure with address decoding
 */
const ROMVisualizer = ({ addressBits = 2, outputs = [], title = "ROM" }) => {
  const numAddresses = Math.pow(2, addressBits);
  const cellHeight = 25;
  const headerHeight = 30;
  const width = 200;
  const height = headerHeight + (numAddresses * cellHeight) + 10;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* ROM chip outline */}
      <rect x="40" y="5" width="120" height={height - 10} 
        fill="#f5f5f5" stroke="#1976d2" strokeWidth="2" rx="5" />
      
      {/* Title */}
      <text x="100" y="22" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#1976d2">
        {title}
      </text>
      
      {/* Address lines (left side) */}
      {Array.from({ length: addressBits }, (_, i) => (
        <g key={`addr-${i}`}>
          <line x1="0" y1={headerHeight + 15 + (i * cellHeight * numAddresses / addressBits)} 
                x2="40" y2={headerHeight + 15 + (i * cellHeight * numAddresses / addressBits)} 
                stroke="#333" strokeWidth="2" />
          <text x="5" y={headerHeight + 18 + (i * cellHeight * numAddresses / addressBits)} 
                fontSize="10" fill="#666">A{addressBits - 1 - i}</text>
        </g>
      ))}
      
      {/* Memory cells */}
      {Array.from({ length: numAddresses }, (_, addr) => (
        <g key={`cell-${addr}`}>
          <rect x="45" y={headerHeight + 5 + (addr * cellHeight)} 
                width="110" height={cellHeight - 2}
                fill={outputs[addr] ? '#e8f5e9' : '#ffebee'}
                stroke="#ccc" strokeWidth="1" />
          <text x="55" y={headerHeight + 20 + (addr * cellHeight)} fontSize="10" fill="#333">
            {addr.toString(2).padStart(addressBits, '0')} → {outputs[addr] !== undefined ? outputs[addr] : '?'}
          </text>
        </g>
      ))}
      
      {/* Output line (right side) */}
      <line x1="160" y1={height / 2} x2="200" y2={height / 2} stroke="#333" strokeWidth="2" />
      <text x="175" y={height / 2 - 5} fontSize="10" fill="#666">Out</text>
    </svg>
  );
};

/**
 * Interactive Truth Table with Highlighting
 */
const InteractiveTruthTable = ({ 
  inputs = ['A', 'B'], 
  outputs = ['F'], 
  truthTable = [],
  title = "Truth Table",
  highlightRows = []
}) => {
  return (
    <Paper elevation={2} sx={{ p: 2, display: 'inline-block' }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
        {title}
      </Typography>
      <Box 
        component="table" 
        sx={{ 
          borderCollapse: 'collapse',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}
      >
        <thead>
          <tr>
            {inputs.map((input, i) => (
              <Box 
                component="th" 
                key={i}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  minWidth: 40
                }}
              >
                {input}
              </Box>
            ))}
            {outputs.map((output, i) => (
              <Box 
                component="th" 
                key={`out-${i}`}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  bgcolor: 'success.light',
                  color: 'success.contrastText',
                  minWidth: 40
                }}
              >
                {output}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {truthTable.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <Box 
                  component="td" 
                  key={cellIdx}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    textAlign: 'center',
                    bgcolor: highlightRows.includes(rowIdx) 
                      ? (cellIdx >= inputs.length ? 'success.lighter' : 'warning.lighter')
                      : (rowIdx % 2 === 0 ? 'background.paper' : 'action.hover'),
                    fontWeight: highlightRows.includes(rowIdx) ? 'bold' : 'normal'
                  }}
                >
                  {cell}
                </Box>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Paper>
  );
};

/**
 * Gate selector component for displaying a specific gate type
 */
const LogicGate = ({ type, ...props }) => {
  const gateComponents = {
    AND: ANDGate,
    OR: ORGate,
    NOT: NOTGate,
    NAND: NANDGate,
    NOR: NORGate,
    XOR: XORGate,
    XNOR: XNORGate
  };
  
  const GateComponent = gateComponents[type.toUpperCase()];
  
  if (!GateComponent) {
    return <Typography color="error">Unknown gate type: {type}</Typography>;
  }
  
  return <GateComponent {...props} />;
};

/**
 * Gate Gallery - Shows all available gates
 */
const GateGallery = () => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>Logic Gates Reference</Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'].map(gate => (
        <Box key={gate} sx={{ textAlign: 'center' }}>
          <LogicGate type={gate} showLabels={false} />
          <Chip label={gate} size="small" sx={{ mt: 1 }} />
        </Box>
      ))}
    </Box>
  </Paper>
);

/**
 * Main component for rendering circuit visualizations from AI responses
 */
const CircuitVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { type, gates, truthTable, rom, title } = data;
  
  switch (type) {
    case 'gate':
      return (
        <Box sx={{ my: 2 }}>
          {title && <Typography variant="subtitle2" gutterBottom>{title}</Typography>}
          <LogicGate type={gates?.[0]?.type || 'AND'} {...gates?.[0]} />
        </Box>
      );
      
    case 'gates':
      return (
        <Box sx={{ my: 2 }}>
          {title && <Typography variant="subtitle2" gutterBottom>{title}</Typography>}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {gates?.map((gate, idx) => (
              <LogicGate key={idx} type={gate.type} {...gate} />
            ))}
          </Box>
        </Box>
      );
      
    case 'truthTable':
      return (
        <Box sx={{ my: 2 }}>
          <InteractiveTruthTable {...truthTable} title={title || truthTable?.title} />
        </Box>
      );
      
    case 'rom':
      return (
        <Box sx={{ my: 2 }}>
          {title && <Typography variant="subtitle2" gutterBottom>{title}</Typography>}
          <ROMVisualizer {...rom} title={title || rom?.title} />
        </Box>
      );
      
    case 'gallery':
      return <GateGallery />;
      
    default:
      return null;
  }
};

export {
  ANDGate,
  ORGate,
  NOTGate,
  NANDGate,
  NORGate,
  XORGate,
  XNORGate,
  LogicGate,
  GateGallery,
  ROMVisualizer,
  InteractiveTruthTable,
  CircuitVisualizer
};

export default CircuitVisualizer;

