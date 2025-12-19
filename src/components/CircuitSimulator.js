/**
 * CircuitSimulator.js
 * v7.2.25: Embeds CircuitJS (Falstad) for full circuit simulation
 * 
 * Supports both digital logic and analog circuits
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Chip,
  Alert
} from '@mui/material';
import {
  OpenInNew,
  Close,
  Fullscreen,
  ContentCopy,
  PlayArrow
} from '@mui/icons-material';

// Pre-built circuit templates for common educational circuits
const CIRCUIT_TEMPLATES = {
  // Basic Logic Gates
  andGate: {
    name: 'AND Gate',
    category: 'Digital Logic',
    description: '2-input AND gate demonstration',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3cYlPPQpghDsuUMBDoQKAMwCGAGwDuAFVHi+AoRwCyAJQAqODUriQdI5rD4BXGJPNRmtQcpX8LoAE50AlmADmAKYAhgAuAIIAKgDiAUEhYQC2AM4RsRHRcQBGAE4ArgB2EYlJ6R5RACpRKZmIHjkA5gCmAJYAtiopcTH5AGIxDVl5HrgAbv7q2ABK4ADKACwuICA'
  },
  orGate: {
    name: 'OR Gate',
    category: 'Digital Logic',
    description: '2-input OR gate demonstration',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3cYlPPQpghDsuUMBDoQKAMwCGAGwDuAFVHi+AoRwCyAJQAqODUriQdI5rD4BXGJPNRmtQcpX8LoAE50AlmADmAKYAhgAuAIIAKgDiAUEhYQC2AM4RsRHRcQBGAE4ArgB2EYlJ6R5RACpRKZmIHjkA5gCmAJYAtiopcTH5AGIxjVl5HrgAbv7q2ABK4ADKACwuICA'
  },
  notGate: {
    name: 'NOT Gate (Inverter)',
    category: 'Digital Logic',
    description: 'Inverter/NOT gate demonstration',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPKqQlH4gU3KGAh0IFAGYBDADYB3ACqjxfAUI4BZAEoAVHBqVxIOkc1h8ArjEnmozWoOUr+F0ACc6ASzABzAFMAQwAXAEEAFQBxAKCQsIBbAGcI2IjouIAjACcAVwA7CMSk9I8ogBUolMzEDxyAcwBTAEsAWxUUuJj8gDEYhqy8j1wAN391bAAlcABlABYXEBA'
  },
  nandGate: {
    name: 'NAND Gate',
    category: 'Digital Logic',
    description: '2-input NAND gate - universal gate',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3cYlPPQpghDsuUMBDoQKAMwCGAGwDuAFVHi+AoRwCyAJQAqODUriQdI5rD4BXGJPNRmtQcpX8LoAE50AlmADmAKYAhgAuAIIAKgDiAUEhYQC2AM4RsRHRcQBGAE4ArgB2EYlJ6R5RACpRKZmIHjkA5gCmAJYAtiopcTH5AGIxzVl5HrgAbv7q2ABK4ADKACwuICA'
  },
  norGate: {
    name: 'NOR Gate',
    category: 'Digital Logic',
    description: '2-input NOR gate - universal gate',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3cYlPPQpghDsuUMBDoQKAMwCGAGwDuAFVHi+AoRwCyAJQAqODUriQdI5rD4BXGJPNRmtQcpX8LoAE50AlmADmAKYAhgAuAIIAKgDiAUEhYQC2AM4RsRHRcQBGAE4ArgB2EYlJ6R5RACpRKZmIHjkA5gCmAJYAtiopcTH5AGIxLVl5HrgAbv7q2ABK4ADKACwuICA'
  },
  xorGate: {
    name: 'XOR Gate',
    category: 'Digital Logic',
    description: '2-input XOR gate',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3cYlPPQpghDsuUMBDoQKAMwCGAGwDuAFVHi+AoRwCyAJQAqODUriQdI5rD4BXGJPNRmtQcpX8LoAE50AlmADmAKYAhgAuAIIAKgDiAUEhYQC2AM4RsRHRcQBGAE4ArgB2EYlJ6R5RACpRKZmIHjkA5gCmAJYAtiopcTH5AGIxbVl5HrgAbv7q2ABK4ADKACwuICA'
  },
  
  // Combinational Circuits
  halfAdder: {
    name: 'Half Adder',
    category: 'Combinational',
    description: 'Adds two 1-bit numbers',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRiGrLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  fullAdder: {
    name: 'Full Adder',
    category: 'Combinational',
    description: 'Adds two 1-bit numbers with carry',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRjGrLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  multiplexer: {
    name: '2:1 Multiplexer',
    category: 'Combinational',
    description: 'Selects one of two inputs',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRjmrLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  decoder: {
    name: '2:4 Decoder',
    category: 'Combinational',
    description: 'Decodes 2 inputs to 4 outputs',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRiWrLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  
  // Sequential Circuits
  srLatch: {
    name: 'SR Latch',
    category: 'Sequential',
    description: 'Basic memory element',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRi2rLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  dFlipFlop: {
    name: 'D Flip-Flop',
    category: 'Sequential',
    description: 'Edge-triggered D flip-flop',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRjOrLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  counter: {
    name: '4-bit Counter',
    category: 'Sequential',
    description: 'Binary counter using flip-flops',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgA3EYlPQqBCH5coYCHQgUAZgEMANgHcAKqPF8BQjgFkASgBUcGpXEg6RzWHwCuMSeajNag5Sv4XQAJzoBLMAHMAUwBDABcAQQAVAHEAoJCwgFsAZwjYiOi4gCMAJwBXADsIxKT0jyiAFSiUzMQPHIBzAFMASwBbFRS4mPyAMRjurLyPXAA3f3VsACVwAGUAFhcQEA'
  },
  
  // Analog Circuits
  rcCircuit: {
    name: 'RC Circuit',
    category: 'Analog',
    description: 'Resistor-Capacitor circuit',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgBjcYlPKtKPxABOdAJZgA5gFMAhgBcAggBUAqvI4pE0uJB1S1YfAK4xJUqM1qCVa-pdAAnOgEswAcwDWt+4+fOAMwBDAHsEFz4YwhdA7wF4rQAmMAAzGKTPLIBbQwiU1OAAK1ysjyKAdwAlNEQAa1q2BuaQCJh0NsRu+s7QHv6GlqGhuNjCgDEevJnZ8YBJPuXCzNmljtyM0dGdxYP2kDXVjdW1oA'
  },
  opAmp: {
    name: 'Op-Amp Inverting',
    category: 'Analog',
    description: 'Inverting amplifier circuit',
    url: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgpABZsKBTAWjDACgATEYlPPCqF34gU3KGAh0IFAGYBDADYB3ACqjxfAUI4BZAEoAVHBqVxIOkc1h8ArjEnmozWoOUr+F0ACc6ASzABzAFMAQwAXAEEAFQBxAKCQsIBbAGcI2IjouIAjACcAVwA7CMSk9I8ogBUolMzEDxyAcwBTAEsAWxUUuJj8gDEYpqy8j1wAN391bAAlcABlABYXEBA'
  }
};

/**
 * Embedded Circuit Simulator
 */
const EmbeddedSimulator = ({ url, height = 400 }) => (
  <Box 
    sx={{ 
      width: '100%', 
      height, 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      overflow: 'hidden'
    }}
  >
    <iframe
      src={url}
      style={{
        width: '100%',
        height: '100%',
        border: 'none'
      }}
      title="Circuit Simulator"
      allow="fullscreen"
    />
  </Box>
);

/**
 * Circuit Template Card
 */
const TemplateCard = ({ template, onSelect }) => (
  <Paper 
    elevation={1}
    sx={{ 
      p: 2, 
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        elevation: 4,
        borderColor: 'primary.main',
        transform: 'translateY(-2px)'
      },
      border: '1px solid',
      borderColor: 'divider'
    }}
    onClick={() => onSelect(template)}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold">
        {template.name}
      </Typography>
      <Chip label={template.category} size="small" variant="outlined" />
    </Box>
    <Typography variant="caption" color="text.secondary">
      {template.description}
    </Typography>
  </Paper>
);

/**
 * Main Circuit Simulator Dialog
 */
function CircuitSimulator({ 
  open, 
  onClose,
  initialUrl = null,
  title = "Circuit Simulator"
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const categories = [...new Set(Object.values(CIRCUIT_TEMPLATES).map(t => t.category))];

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveTab(1); // Switch to simulator tab
  };

  const handleOpenExternal = () => {
    const url = selectedTemplate?.url || customUrl || 'https://www.falstad.com/circuit/circuitjs.html';
    window.open(url, '_blank');
  };

  const handleCopyUrl = () => {
    const url = selectedTemplate?.url || customUrl;
    if (url) {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isFullscreen}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <Chip label="Falstad" size="small" color="success" />
        </Box>
        <Box>
          <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
            <Fullscreen />
          </IconButton>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Templates" />
          <Tab label="Simulator" />
          <Tab label="Custom URL" />
        </Tabs>
        
        {/* Templates Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select a circuit template to load it in the simulator. You can interact with switches and observe outputs.
            </Alert>
            
            {categories.map(category => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  {category}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                  {Object.values(CIRCUIT_TEMPLATES)
                    .filter(t => t.category === category)
                    .map((template, idx) => (
                      <TemplateCard 
                        key={idx} 
                        template={template} 
                        onSelect={handleSelectTemplate}
                      />
                    ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Simulator Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {selectedTemplate ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{selectedTemplate.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTemplate.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<ContentCopy />}
                      onClick={handleCopyUrl}
                    >
                      Copy URL
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      startIcon={<OpenInNew />}
                      onClick={handleOpenExternal}
                    >
                      Open Full
                    </Button>
                  </Box>
                </Box>
                <EmbeddedSimulator url={selectedTemplate.url} height={isFullscreen ? 'calc(100vh - 200px)' : 450} />
              </>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                <Typography color="text.secondary">
                  Select a template from the Templates tab to view the simulator
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(0)}
                >
                  Browse Templates
                </Button>
              </Paper>
            )}
          </Box>
        )}
        
        {/* Custom URL Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              You can paste a CircuitJS URL to load a custom circuit. Create circuits at{' '}
              <a href="https://www.falstad.com/circuit/circuitjs.html" target="_blank" rel="noopener noreferrer">
                falstad.com/circuit
              </a>
              {' '}and share the link.
            </Alert>
            
            <TextField
              fullWidth
              label="CircuitJS URL"
              placeholder="https://www.falstad.com/circuit/circuitjs.html?ctz=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                disabled={!customUrl}
                onClick={() => {
                  setSelectedTemplate({ name: 'Custom Circuit', description: 'User provided circuit', url: customUrl });
                  setActiveTab(1);
                }}
              >
                Load Circuit
              </Button>
              <Button 
                variant="outlined"
                startIcon={<OpenInNew />}
                onClick={() => window.open('https://www.falstad.com/circuit/circuitjs.html', '_blank')}
              >
                Open Circuit Builder
              </Button>
            </Box>
            
            {customUrl && (
              <EmbeddedSimulator url={customUrl} height={400} />
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Powered by CircuitJS by Paul Falstad
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export { EmbeddedSimulator, CIRCUIT_TEMPLATES };
export default CircuitSimulator;

