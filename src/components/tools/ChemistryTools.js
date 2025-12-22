import React, { useState, useCallback } from 'react';
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
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Grid,
  Divider,
  InputAdornment,
  Badge,
  Card,
  CardContent,
  CardActions,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon,
  Send as SendIcon,
  SmartToy as VyonnIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Refresh as ResetIcon,
  School as SchoolIcon,
  EmojiObjects as TipIcon
} from '@mui/icons-material';
import { callLLM } from '../../services/llmService';

/**
 * Vyonn AI Chemistry Lab - v8.2.0
 * AI-powered chemistry learning with molecules, periodic table, experiments, and diagrams
 */

// ==================== EXPERIMENTS DATA ====================
const EXPERIMENTS = {
  foundational: {
    title: "Foundational Concepts",
    subtitle: "Middle School to Early High School",
    color: "#4caf50",
    icon: "🌱",
    experiments: [
      {
        id: "atomic-structure",
        title: "Atomic Structure & Models",
        description: "Explore electrons, shells, and how atoms are organized",
        difficulty: "Beginner",
        interactive: true,
        component: "AtomBuilder"
      },
      {
        id: "matter-classification",
        title: "Elements, Compounds & Mixtures",
        description: "Learn to distinguish these fundamental classifications",
        difficulty: "Beginner",
        interactive: true,
        component: "MatterClassifier"
      },
      {
        id: "periodic-trends",
        title: "Periodic Table Trends",
        description: "Discover periodicity patterns and element properties",
        difficulty: "Beginner",
        interactive: true,
        component: "PeriodicTrends"
      },
      {
        id: "states-of-matter",
        title: "States of Matter & Kinetic Theory",
        description: "See why substances behave differently at various temperatures",
        difficulty: "Beginner",
        interactive: true,
        component: "StatesOfMatter"
      },
      {
        id: "basic-bonding",
        title: "Chemical Bonding Basics",
        description: "Understand ionic and covalent bonds",
        difficulty: "Beginner",
        interactive: true,
        component: "BondingBasics"
      },
      {
        id: "valency-explorer",
        title: "Valency & Combining Capacity",
        description: "Learn how atoms combine using valence electrons",
        difficulty: "Beginner",
        interactive: true,
        component: "ValencyExplorer"
      },
      {
        id: "equation-balancer",
        title: "Balancing Chemical Equations",
        description: "Practice balancing equations with instant feedback",
        difficulty: "Beginner",
        interactive: true,
        component: "EquationBalancer"
      }
    ]
  },
  highSchool: {
    title: "Key High School Concepts",
    subtitle: "Grades 9-12",
    color: "#2196f3",
    icon: "📚",
    experiments: [
      {
        id: "mole-concept",
        title: "The Mole Concept & Stoichiometry",
        description: "Calculate amounts, limiting reagents, and balance equations",
        difficulty: "Intermediate",
        interactive: true,
        component: "MoleStoichiometry"
      },
      {
        id: "chemical-reactions",
        title: "Chemical Reactions & Kinetics",
        description: "Explore reaction types, rates, and mechanisms",
        difficulty: "Intermediate",
        interactive: true,
        component: "ReactionKinetics"
      },
      {
        id: "organic-intro",
        title: "Organic Chemistry Basics",
        description: "Functional groups, IUPAC naming, and structures",
        difficulty: "Intermediate",
        interactive: true,
        component: "OrganicChemistry"
      },
      {
        id: "thermodynamics",
        title: "Thermodynamics & Energy",
        description: "Understand enthalpy, entropy, and energy changes",
        difficulty: "Intermediate",
        interactive: true,
        component: "Thermodynamics"
      },
      {
        id: "electrochemistry",
        title: "Electrochemistry",
        description: "Redox reactions, batteries, and electrolysis",
        difficulty: "Intermediate",
        interactive: true,
        component: "Electrochemistry"
      },
      {
        id: "solutions-equilibrium",
        title: "Solutions & Equilibrium",
        description: "Molarity, buffers, and Le Chatelier's principle",
        difficulty: "Intermediate",
        interactive: true,
        component: "Equilibrium"
      }
    ]
  },
  advanced: {
    title: "Advanced Topics",
    subtitle: "Upper High School / Intro College",
    color: "#9c27b0",
    icon: "🎓",
    experiments: [
      {
        id: "quantum-chemistry",
        title: "Quantum Chemistry",
        description: "Molecular Orbital Theory and hybridization",
        difficulty: "Advanced",
        interactive: true,
        component: "QuantumChem"
      },
      {
        id: "stereochemistry",
        title: "Stereochemistry",
        description: "Chirality, isomerism, and 3D molecular structures",
        difficulty: "Advanced",
        interactive: true,
        component: "Stereochemistry"
      },
      {
        id: "spectroscopy",
        title: "Spectroscopy Basics",
        description: "IR, NMR, and Mass Spectroscopy interpretation",
        difficulty: "Advanced",
        interactive: true,
        component: "Spectroscopy"
      }
    ]
  }
};

// ==================== INTERACTIVE EXPERIMENT COMPONENTS ====================

// Atom Builder - Interactive atomic structure
function AtomBuilder() {
  const [protons, setProtons] = useState(6);
  const [neutrons, setNeutrons] = useState(6);
  const [showShells, setShowShells] = useState(true);
  
  const elementData = {
    1: { symbol: 'H', name: 'Hydrogen', shells: [1] },
    2: { symbol: 'He', name: 'Helium', shells: [2] },
    3: { symbol: 'Li', name: 'Lithium', shells: [2, 1] },
    4: { symbol: 'Be', name: 'Beryllium', shells: [2, 2] },
    5: { symbol: 'B', name: 'Boron', shells: [2, 3] },
    6: { symbol: 'C', name: 'Carbon', shells: [2, 4] },
    7: { symbol: 'N', name: 'Nitrogen', shells: [2, 5] },
    8: { symbol: 'O', name: 'Oxygen', shells: [2, 6] },
    9: { symbol: 'F', name: 'Fluorine', shells: [2, 7] },
    10: { symbol: 'Ne', name: 'Neon', shells: [2, 8] },
    11: { symbol: 'Na', name: 'Sodium', shells: [2, 8, 1] },
    12: { symbol: 'Mg', name: 'Magnesium', shells: [2, 8, 2] },
    13: { symbol: 'Al', name: 'Aluminum', shells: [2, 8, 3] },
    14: { symbol: 'Si', name: 'Silicon', shells: [2, 8, 4] },
    15: { symbol: 'P', name: 'Phosphorus', shells: [2, 8, 5] },
    16: { symbol: 'S', name: 'Sulfur', shells: [2, 8, 6] },
    17: { symbol: 'Cl', name: 'Chlorine', shells: [2, 8, 7] },
    18: { symbol: 'Ar', name: 'Argon', shells: [2, 8, 8] },
    19: { symbol: 'K', name: 'Potassium', shells: [2, 8, 8, 1] },
    20: { symbol: 'Ca', name: 'Calcium', shells: [2, 8, 8, 2] },
  };
  
  const element = elementData[protons] || { symbol: '?', name: 'Unknown', shells: [] };
  const massNumber = protons + neutrons;
  const isStable = Math.abs(neutrons - protons) <= 2;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        ⚛️ Build Your Atom
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>Protons (Atomic Number): {protons}</Typography>
            <Slider
              value={protons}
              onChange={(e, v) => setProtons(v)}
              min={1}
              max={20}
              marks
              sx={{ color: '#ef4444' }}
            />
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Neutrons: {neutrons}</Typography>
            <Slider
              value={neutrons}
              onChange={(e, v) => setNeutrons(v)}
              min={0}
              max={30}
              marks
              sx={{ color: '#64748b' }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${element.symbol} - ${element.name}`} color="primary" />
              <Chip label={`Mass: ${massNumber}`} variant="outlined" />
              <Chip 
                label={isStable ? "Stable" : "Unstable"} 
                color={isStable ? "success" : "warning"}
                size="small"
              />
            </Box>
          </Paper>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Key Concepts:</strong><br/>
              • Protons determine the element (atomic number)<br/>
              • Neutrons affect mass and stability (isotopes)<br/>
              • Electrons fill shells: 2, 8, 18, 32...
            </Typography>
          </Alert>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a2e' }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
              {/* Nucleus */}
              <circle cx="100" cy="100" r="25" fill="url(#nucleusGrad)" />
              <text x="100" y="95" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                {protons}p+
              </text>
              <text x="100" y="108" textAnchor="middle" fill="#ccc" fontSize="8">
                {neutrons}n
              </text>
              
              {/* Electron shells */}
              {showShells && element.shells.map((electrons, shellIndex) => {
                const radius = 45 + shellIndex * 25;
                return (
                  <g key={shellIndex}>
                    <circle 
                      cx="100" 
                      cy="100" 
                      r={radius} 
                      fill="none" 
                      stroke="#4fc3f7" 
                      strokeWidth="1" 
                      strokeDasharray="3,3"
                      opacity="0.5"
                    />
                    {Array.from({ length: electrons }).map((_, i) => {
                      const angle = (i / electrons) * 2 * Math.PI - Math.PI / 2;
                      const x = 100 + radius * Math.cos(angle);
                      const y = 100 + radius * Math.sin(angle);
                      return (
                        <circle key={i} cx={x} cy={y} r="5" fill="#3b82f6">
                          <animate 
                            attributeName="opacity" 
                            values="1;0.5;1" 
                            dur={`${1 + shellIndex * 0.5}s`} 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      );
                    })}
                    <text x="100" y={100 - radius - 5} textAnchor="middle" fill="#4fc3f7" fontSize="8">
                      {electrons}e⁻
                    </text>
                  </g>
                );
              })}
              
              <defs>
                <radialGradient id="nucleusGrad">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </radialGradient>
              </defs>
            </svg>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// States of Matter Simulator
function StatesOfMatter() {
  const [temperature, setTemperature] = useState(25);
  const [substance, setSubstance] = useState('water');
  
  const substances = {
    water: { name: 'Water (H₂O)', melt: 0, boil: 100, color: '#3b82f6' },
    iron: { name: 'Iron (Fe)', melt: 1538, boil: 2861, color: '#78716c' },
    oxygen: { name: 'Oxygen (O₂)', melt: -218, boil: -183, color: '#93c5fd' },
    mercury: { name: 'Mercury (Hg)', melt: -39, boil: 357, color: '#a1a1aa' },
  };
  
  const current = substances[substance];
  const state = temperature < current.melt ? 'solid' : temperature < current.boil ? 'liquid' : 'gas';
  
  const getParticleSpeed = () => {
    if (state === 'solid') return 0.5;
    if (state === 'liquid') return 2;
    return 5;
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🌡️ States of Matter & Kinetic Theory</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Select Substance:</Typography>
            <ToggleButtonGroup
              value={substance}
              exclusive
              onChange={(e, v) => v && setSubstance(v)}
              size="small"
              sx={{ mb: 2, flexWrap: 'wrap' }}
            >
              {Object.entries(substances).map(([key, val]) => (
                <ToggleButton key={key} value={key}>{val.name}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            
            <Typography variant="subtitle2" gutterBottom>Temperature: {temperature}°C</Typography>
            <Slider
              value={temperature}
              onChange={(e, v) => setTemperature(v)}
              min={-250}
              max={3000}
              sx={{ 
                color: temperature < 0 ? '#3b82f6' : temperature < 500 ? '#22c55e' : '#ef4444'
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip 
                label={state.toUpperCase()} 
                color={state === 'solid' ? 'info' : state === 'liquid' ? 'success' : 'warning'}
              />
              <Chip label={`MP: ${current.melt}°C`} variant="outlined" size="small" />
              <Chip label={`BP: ${current.boil}°C`} variant="outlined" size="small" />
            </Box>
          </Paper>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Kinetic Theory:</strong><br/>
              • <strong>Solid:</strong> Particles vibrate in fixed positions<br/>
              • <strong>Liquid:</strong> Particles slide past each other<br/>
              • <strong>Gas:</strong> Particles move freely and rapidly
            </Typography>
          </Alert>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 2, 
            height: 300, 
            bgcolor: state === 'solid' ? '#e0f2fe' : state === 'liquid' ? '#dcfce7' : '#fef9c3',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Typography variant="caption" sx={{ position: 'absolute', top: 8, left: 8 }}>
              {current.name} at {temperature}°C
            </Typography>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
              {Array.from({ length: 20 }).map((_, i) => {
                const baseX = state === 'solid' ? (i % 5) * 40 + 20 : Math.random() * 180 + 10;
                const baseY = state === 'solid' ? Math.floor(i / 5) * 40 + 50 : Math.random() * 150 + 25;
                return (
                  <circle key={i} cx={baseX} cy={baseY} r="8" fill={current.color}>
                    <animate
                      attributeName="cx"
                      values={`${baseX};${baseX + getParticleSpeed() * (Math.random() - 0.5) * 20};${baseX}`}
                      dur={`${0.5 + Math.random()}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={`${baseY};${baseY + getParticleSpeed() * (Math.random() - 0.5) * 20};${baseY}`}
                      dur={`${0.5 + Math.random()}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}
            </svg>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Bonding Basics - Ionic vs Covalent
function BondingBasics() {
  const [bondType, setBondType] = useState('ionic');
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🔗 Chemical Bonding</Typography>
      
      <ToggleButtonGroup
        value={bondType}
        exclusive
        onChange={(e, v) => v && setBondType(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="ionic">Ionic Bond</ToggleButton>
        <ToggleButton value="covalent">Covalent Bond</ToggleButton>
        <ToggleButton value="metallic">Metallic Bond</ToggleButton>
      </ToggleButtonGroup>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {bondType === 'ionic' && (
              <svg viewBox="0 0 200 100" style={{ width: '100%' }}>
                {/* Na+ */}
                <circle cx="50" cy="50" r="25" fill="#f472b6" />
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Na</text>
                <text x="50" y="60" textAnchor="middle" fill="white" fontSize="10">+</text>
                
                {/* Electron transfer arrow */}
                <path d="M80,50 L120,50" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <circle cx="100" cy="40" r="5" fill="#3b82f6">
                  <animate attributeName="cx" values="60;140" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Cl- */}
                <circle cx="150" cy="50" r="30" fill="#4ade80" />
                <text x="150" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Cl</text>
                <text x="150" y="60" textAnchor="middle" fill="white" fontSize="10">−</text>
                
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                  </marker>
                </defs>
              </svg>
            )}
            
            {bondType === 'covalent' && (
              <svg viewBox="0 0 200 100" style={{ width: '100%' }}>
                {/* H atoms sharing electrons */}
                <circle cx="70" cy="50" r="25" fill="#93c5fd" />
                <text x="70" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">H</text>
                
                <circle cx="130" cy="50" r="25" fill="#93c5fd" />
                <text x="130" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">H</text>
                
                {/* Shared electrons */}
                <circle cx="95" cy="45" r="5" fill="#3b82f6">
                  <animate attributeName="cx" values="90;110;90" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle cx="105" cy="55" r="5" fill="#3b82f6">
                  <animate attributeName="cx" values="110;90;110" dur="1s" repeatCount="indefinite" />
                </circle>
                
                <text x="100" y="85" textAnchor="middle" fill="#666" fontSize="10">Shared electron pair</text>
              </svg>
            )}
            
            {bondType === 'metallic' && (
              <svg viewBox="0 0 200 100" style={{ width: '100%' }}>
                {/* Metal cations in sea of electrons */}
                {[[30,30], [70,30], [110,30], [150,30], [50,60], [90,60], [130,60], [170,60]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
                ))}
                
                {/* Delocalized electrons */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <circle key={`e${i}`} r="3" fill="#3b82f6">
                    <animate 
                      attributeName="cx" 
                      values={`${Math.random() * 180 + 10};${Math.random() * 180 + 10};${Math.random() * 180 + 10}`}
                      dur={`${1 + Math.random()}s`}
                      repeatCount="indefinite"
                    />
                    <animate 
                      attributeName="cy" 
                      values={`${Math.random() * 80 + 10};${Math.random() * 80 + 10};${Math.random() * 80 + 10}`}
                      dur={`${1 + Math.random()}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </svg>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Alert severity="success">
            {bondType === 'ionic' && (
              <Typography variant="body2">
                <strong>Ionic Bonding:</strong><br/>
                • Electron TRANSFER from metal to non-metal<br/>
                • Forms ions (+ and −) that attract<br/>
                • Example: NaCl (table salt)<br/>
                • Properties: High melting point, conducts when dissolved
              </Typography>
            )}
            {bondType === 'covalent' && (
              <Typography variant="body2">
                <strong>Covalent Bonding:</strong><br/>
                • Electron SHARING between non-metals<br/>
                • Forms molecules<br/>
                • Example: H₂, O₂, H₂O, CH₄<br/>
                • Properties: Lower melting point, poor conductors
              </Typography>
            )}
            {bondType === 'metallic' && (
              <Typography variant="body2">
                <strong>Metallic Bonding:</strong><br/>
                • "Sea of electrons" around metal cations<br/>
                • Electrons are delocalized (free to move)<br/>
                • Example: All metals (Cu, Fe, Au)<br/>
                • Properties: Good conductors, malleable, ductile
              </Typography>
            )}
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}

// Valency Explorer - Understanding combining capacity
function ValencyExplorer() {
  const [selectedElement, setSelectedElement] = useState('Na');
  const [partnerElement, setPartnerElement] = useState('Cl');
  const [showFormula, setShowFormula] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  const elements = {
    // Valency 1
    'H': { name: 'Hydrogen', symbol: 'H', valency: 1, electrons: 1, color: '#e0f2fe', type: 'non-metal' },
    'Na': { name: 'Sodium', symbol: 'Na', valency: 1, electrons: 11, color: '#fef3c7', type: 'metal' },
    'K': { name: 'Potassium', symbol: 'K', valency: 1, electrons: 19, color: '#fef3c7', type: 'metal' },
    'Cl': { name: 'Chlorine', symbol: 'Cl', valency: 1, electrons: 17, color: '#dcfce7', type: 'non-metal' },
    'Br': { name: 'Bromine', symbol: 'Br', valency: 1, electrons: 35, color: '#fecaca', type: 'non-metal' },
    // Valency 2
    'O': { name: 'Oxygen', symbol: 'O', valency: 2, electrons: 8, color: '#fee2e2', type: 'non-metal' },
    'Mg': { name: 'Magnesium', symbol: 'Mg', valency: 2, electrons: 12, color: '#d1fae5', type: 'metal' },
    'Ca': { name: 'Calcium', symbol: 'Ca', valency: 2, electrons: 20, color: '#fef3c7', type: 'metal' },
    'S': { name: 'Sulfur', symbol: 'S', valency: 2, electrons: 16, color: '#fef9c3', type: 'non-metal' },
    'Zn': { name: 'Zinc', symbol: 'Zn', valency: 2, electrons: 30, color: '#e0e7ff', type: 'metal' },
    // Valency 3
    'N': { name: 'Nitrogen', symbol: 'N', valency: 3, electrons: 7, color: '#dbeafe', type: 'non-metal' },
    'Al': { name: 'Aluminium', symbol: 'Al', valency: 3, electrons: 13, color: '#f3f4f6', type: 'metal' },
    'Fe3': { name: 'Iron (III)', symbol: 'Fe', valency: 3, electrons: 26, color: '#fed7aa', type: 'metal' },
    // Valency 4
    'C': { name: 'Carbon', symbol: 'C', valency: 4, electrons: 6, color: '#374151', type: 'non-metal' },
    'Si': { name: 'Silicon', symbol: 'Si', valency: 4, electrons: 14, color: '#9ca3af', type: 'metalloid' },
  };

  // Valid compound combinations (metal-nonmetal pairs and known compounds)
  const validCompounds = {
    // Metal + Halogen (Cl, Br)
    'Na-Cl': { formula: 'NaCl', name: 'Sodium Chloride (Table Salt)' },
    'Na-Br': { formula: 'NaBr', name: 'Sodium Bromide' },
    'K-Cl': { formula: 'KCl', name: 'Potassium Chloride' },
    'K-Br': { formula: 'KBr', name: 'Potassium Bromide' },
    'Mg-Cl': { formula: 'MgCl₂', name: 'Magnesium Chloride' },
    'Mg-Br': { formula: 'MgBr₂', name: 'Magnesium Bromide' },
    'Ca-Cl': { formula: 'CaCl₂', name: 'Calcium Chloride' },
    'Ca-Br': { formula: 'CaBr₂', name: 'Calcium Bromide' },
    'Zn-Cl': { formula: 'ZnCl₂', name: 'Zinc Chloride' },
    'Zn-Br': { formula: 'ZnBr₂', name: 'Zinc Bromide' },
    'Al-Cl': { formula: 'AlCl₃', name: 'Aluminium Chloride' },
    'Al-Br': { formula: 'AlBr₃', name: 'Aluminium Bromide' },
    'Fe3-Cl': { formula: 'FeCl₃', name: 'Iron (III) Chloride' },
    'Fe3-Br': { formula: 'FeBr₃', name: 'Iron (III) Bromide' },
    // Metal + Oxygen
    'Na-O': { formula: 'Na₂O', name: 'Sodium Oxide' },
    'K-O': { formula: 'K₂O', name: 'Potassium Oxide' },
    'Mg-O': { formula: 'MgO', name: 'Magnesium Oxide' },
    'Ca-O': { formula: 'CaO', name: 'Calcium Oxide (Quickite)' },
    'Zn-O': { formula: 'ZnO', name: 'Zinc Oxide' },
    'Al-O': { formula: 'Al₂O₃', name: 'Aluminium Oxide' },
    'Fe3-O': { formula: 'Fe₂O₃', name: 'Iron (III) Oxide (Rust)' },
    // Metal + Sulfur
    'Na-S': { formula: 'Na₂S', name: 'Sodium Sulfide' },
    'K-S': { formula: 'K₂S', name: 'Potassium Sulfide' },
    'Mg-S': { formula: 'MgS', name: 'Magnesium Sulfide' },
    'Ca-S': { formula: 'CaS', name: 'Calcium Sulfide' },
    'Zn-S': { formula: 'ZnS', name: 'Zinc Sulfide' },
    'Al-S': { formula: 'Al₂S₃', name: 'Aluminium Sulfide' },
    'Fe3-S': { formula: 'Fe₂S₃', name: 'Iron (III) Sulfide' },
    // Metal + Nitrogen
    'Na-N': { formula: 'Na₃N', name: 'Sodium Nitride' },
    'K-N': { formula: 'K₃N', name: 'Potassium Nitride' },
    'Mg-N': { formula: 'Mg₃N₂', name: 'Magnesium Nitride' },
    'Ca-N': { formula: 'Ca₃N₂', name: 'Calcium Nitride' },
    'Al-N': { formula: 'AlN', name: 'Aluminium Nitride' },
    // Hydrogen compounds
    'H-Cl': { formula: 'HCl', name: 'Hydrochloric Acid' },
    'H-Br': { formula: 'HBr', name: 'Hydrobromic Acid' },
    'H-O': { formula: 'H₂O', name: 'Water' },
    'H-S': { formula: 'H₂S', name: 'Hydrogen Sulfide' },
    'H-N': { formula: 'NH₃', name: 'Ammonia', specialFormula: true },
    // Carbon compounds (covalent)
    'C-O': { formula: 'CO₂', name: 'Carbon Dioxide', specialFormula: true },
    'C-H': { formula: 'CH₄', name: 'Methane', specialFormula: true },
    'C-Cl': { formula: 'CCl₄', name: 'Carbon Tetrachloride' },
    // Silicon compounds
    'Si-O': { formula: 'SiO₂', name: 'Silicon Dioxide (Sand)' },
    'Si-Cl': { formula: 'SiCl₄', name: 'Silicon Tetrachloride' },
  };

  const elem1 = elements[selectedElement];
  const elem2 = elements[partnerElement];
  
  // Check if combination is valid
  const validateCombination = () => {
    // Same element selected
    if (selectedElement === partnerElement) {
      return { 
        valid: false, 
        error: 'Cannot combine the same element with itself. Select two different elements.',
        severity: 'warning'
      };
    }
    
    // Two metals (excluding hydrogen which is special)
    if (elem1.type === 'metal' && elem2.type === 'metal') {
      return { 
        valid: false, 
        error: 'Two metals cannot form a compound together. Metals need to combine with non-metals to form ionic compounds.',
        severity: 'error'
      };
    }
    
    // Check for valid compound in database
    const key1 = `${selectedElement}-${partnerElement}`;
    const key2 = `${partnerElement}-${selectedElement}`;
    
    if (validCompounds[key1]) {
      return { valid: true, compound: validCompounds[key1], swapped: false };
    }
    if (validCompounds[key2]) {
      return { valid: true, compound: validCompounds[key2], swapped: true };
    }
    
    // Check if it's a potentially valid but uncommon combination
    const hasMetalAndNonmetal = 
      (elem1.type === 'metal' && (elem2.type === 'non-metal' || elem2.type === 'metalloid')) ||
      (elem2.type === 'metal' && (elem1.type === 'non-metal' || elem1.type === 'metalloid'));
    
    if (hasMetalAndNonmetal) {
      // Calculate formula using cross-multiplication
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
      const lcmVal = (elem1.valency * elem2.valency) / gcd(elem1.valency, elem2.valency);
      const sub1 = lcmVal / elem1.valency;
      const sub2 = lcmVal / elem2.valency;
      const getSubscript = (n) => n > 1 ? '₂₃₄₅₆₇₈₉'[n-2] || n : '';
      
      // Metal should come first in ionic compounds
      const metal = elem1.type === 'metal' ? elem1 : elem2;
      const nonMetal = elem1.type === 'metal' ? elem2 : elem1;
      const metalSub = elem1.type === 'metal' ? sub1 : sub2;
      const nonMetalSub = elem1.type === 'metal' ? sub2 : sub1;
      
      return { 
        valid: true, 
        compound: {
          formula: `${metal.symbol}${getSubscript(metalSub)}${nonMetal.symbol}${getSubscript(nonMetalSub)}`,
          name: `${metal.name} ${nonMetal.name.replace(/ine$|en$|ur$/, 'ide')}`
        },
        calculated: true
      };
    }
    
    // Two non-metals that aren't in our database
    return { 
      valid: false, 
      error: 'This combination of non-metals does not form a common compound. Try combining a metal with a non-metal.',
      severity: 'warning'
    };
  };
  
  const handleFindFormula = () => {
    const result = validateCombination();
    setValidationResult(result);
    setShowFormula(true);
  };
  
  // Reset when elements change
  const handleElementChange = (setter, value) => {
    setter(value);
    setShowFormula(false);
    setValidationResult(null);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>⚛️ Valency & Combining Capacity</Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>What is Valency?</strong> The combining capacity of an element based on how many electrons it can lose, gain, or share to complete its outer shell.
      </Alert>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Select First Element: <Chip label={elem1.type} size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {Object.entries(elements).map(([key, el]) => (
                <Chip
                  key={key}
                  label={`${el.symbol} (${el.valency})`}
                  onClick={() => handleElementChange(setSelectedElement, key)}
                  variant={selectedElement === key ? 'filled' : 'outlined'}
                  color={selectedElement === key ? 'primary' : 'default'}
                  size="small"
                  sx={{ bgcolor: selectedElement === key ? undefined : el.color }}
                />
              ))}
            </Box>
            
            <Typography variant="subtitle2" gutterBottom color="secondary">
              Select Second Element: <Chip label={elem2.type} size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {Object.entries(elements).map(([key, el]) => (
                <Chip
                  key={key}
                  label={`${el.symbol} (${el.valency})`}
                  onClick={() => handleElementChange(setPartnerElement, key)}
                  variant={partnerElement === key ? 'filled' : 'outlined'}
                  color={partnerElement === key ? 'secondary' : 'default'}
                  size="small"
                  sx={{ bgcolor: partnerElement === key ? undefined : el.color }}
                />
              ))}
            </Box>
            
            <Button 
              variant="contained" 
              onClick={handleFindFormula}
              startIcon={<ScienceIcon />}
              fullWidth
            >
              Check Combination & Find Formula
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: showFormula && validationResult?.valid ? '#f0fdf4' : '#f8fafc', minHeight: 200 }}>
            <Typography variant="subtitle2" gutterBottom>Cross-Multiplication Method:</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, my: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#2563eb' }}>{elem1.symbol}</Typography>
                <Typography variant="body2">Valency: {elem1.valency}</Typography>
                <Typography variant="caption" color="text.secondary">{elem1.type}</Typography>
              </Box>
              <Typography variant="h5">+</Typography>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#dc2626' }}>{elem2.symbol}</Typography>
                <Typography variant="body2">Valency: {elem2.valency}</Typography>
                <Typography variant="caption" color="text.secondary">{elem2.type}</Typography>
              </Box>
            </Box>
            
            {showFormula && validationResult && (
              validationResult.valid ? (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Valid combination! This forms a real compound.
                  </Alert>
                  <Typography variant="body2" color="text.secondary">Formula:</Typography>
                  <Typography variant="h3" sx={{ color: '#059669', fontWeight: 'bold' }}>
                    {validationResult.compound.formula}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 1, color: '#374151' }}>
                    {validationResult.compound.name}
                  </Typography>
                  {validationResult.calculated && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      (Formula calculated using cross-multiplication)
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity={validationResult.severity} sx={{ mt: 2 }}>
                  <strong>Invalid Combination!</strong><br/>
                  {validationResult.error}
                </Alert>
              )
            )}
          </Paper>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#fef3c7' }}>
            <Typography variant="subtitle2" gutterBottom>🔑 Combination Rules:</Typography>
            <Typography variant="body2">
              • <strong>Metal + Non-metal</strong> → Ionic compound ✅<br/>
              • <strong>Metal + Metal</strong> → No compound ❌<br/>
              • <strong>Non-metal + Non-metal</strong> → Covalent (limited) ⚠️<br/>
              • <strong>Same element</strong> → Not a compound ❌
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Equation Balancer - Practice balancing chemical equations
function EquationBalancer() {
  const [selectedEquation, setSelectedEquation] = useState(0);
  const [coefficients, setCoefficients] = useState([1, 1, 1, 1]);
  const [showHint, setShowHint] = useState(false);
  const [isBalanced, setIsBalanced] = useState(false);
  
  const equations = [
    {
      name: "Hydrogen + Oxygen → Water",
      reactants: [
        { formula: 'H₂', elements: { H: 2 } },
        { formula: 'O₂', elements: { O: 2 } }
      ],
      products: [
        { formula: 'H₂O', elements: { H: 2, O: 1 } }
      ],
      answer: [2, 1, 2],
      hint: "Count hydrogen atoms. You need 4 H atoms on each side."
    },
    {
      name: "Iron + Oxygen → Iron Oxide",
      reactants: [
        { formula: 'Fe', elements: { Fe: 1 } },
        { formula: 'O₂', elements: { O: 2 } }
      ],
      products: [
        { formula: 'Fe₂O₃', elements: { Fe: 2, O: 3 } }
      ],
      answer: [4, 3, 2],
      hint: "Balance Fe first. You need 4 Fe atoms, then balance O."
    },
    {
      name: "Methane + Oxygen → Carbon Dioxide + Water",
      reactants: [
        { formula: 'CH₄', elements: { C: 1, H: 4 } },
        { formula: 'O₂', elements: { O: 2 } }
      ],
      products: [
        { formula: 'CO₂', elements: { C: 1, O: 2 } },
        { formula: 'H₂O', elements: { H: 2, O: 1 } }
      ],
      answer: [1, 2, 1, 2],
      hint: "Balance C first (already done), then H, then O."
    },
    {
      name: "Sodium + Water → Sodium Hydroxide + Hydrogen",
      reactants: [
        { formula: 'Na', elements: { Na: 1 } },
        { formula: 'H₂O', elements: { H: 2, O: 1 } }
      ],
      products: [
        { formula: 'NaOH', elements: { Na: 1, O: 1, H: 1 } },
        { formula: 'H₂', elements: { H: 2 } }
      ],
      answer: [2, 2, 2, 1],
      hint: "Balance Na first, then count all H atoms carefully."
    },
    {
      name: "Magnesium + Hydrochloric Acid → Magnesium Chloride + Hydrogen",
      reactants: [
        { formula: 'Mg', elements: { Mg: 1 } },
        { formula: 'HCl', elements: { H: 1, Cl: 1 } }
      ],
      products: [
        { formula: 'MgCl₂', elements: { Mg: 1, Cl: 2 } },
        { formula: 'H₂', elements: { H: 2 } }
      ],
      answer: [1, 2, 1, 1],
      hint: "MgCl₂ needs 2 Cl atoms, so you need 2 HCl."
    }
  ];
  
  const currentEq = equations[selectedEquation];
  const totalCompounds = currentEq.reactants.length + currentEq.products.length;
  
  // Calculate atom counts
  const countAtoms = (side, coeffs, startIdx) => {
    const counts = {};
    side.forEach((compound, i) => {
      const coef = coeffs[startIdx + i] || 1;
      Object.entries(compound.elements).forEach(([elem, count]) => {
        counts[elem] = (counts[elem] || 0) + count * coef;
      });
    });
    return counts;
  };
  
  const leftCounts = countAtoms(currentEq.reactants, coefficients, 0);
  const rightCounts = countAtoms(currentEq.products, coefficients, currentEq.reactants.length);
  
  // Check if balanced
  const checkBalance = () => {
    const allElements = new Set([...Object.keys(leftCounts), ...Object.keys(rightCounts)]);
    let balanced = true;
    allElements.forEach(elem => {
      if (leftCounts[elem] !== rightCounts[elem]) balanced = false;
    });
    setIsBalanced(balanced);
  };
  
  const updateCoefficient = (index, value) => {
    const newCoeffs = [...coefficients];
    newCoeffs[index] = Math.max(1, Math.min(10, parseInt(value) || 1));
    setCoefficients(newCoeffs);
    setIsBalanced(false);
  };
  
  const resetEquation = () => {
    setCoefficients(Array(totalCompounds).fill(1));
    setIsBalanced(false);
    setShowHint(false);
  };
  
  const nextEquation = () => {
    setSelectedEquation((prev) => (prev + 1) % equations.length);
    setCoefficients(Array(totalCompounds).fill(1));
    setIsBalanced(false);
    setShowHint(false);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>⚖️ Balancing Chemical Equations</Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Rule:</strong> In a balanced equation, the number of atoms of each element must be equal on both sides. Adjust the coefficients (numbers before formulas) to balance.
      </Alert>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">{currentEq.name}</Typography>
          <Box>
            <Button size="small" onClick={() => setShowHint(!showHint)} sx={{ mr: 1 }}>
              {showHint ? 'Hide Hint' : '💡 Hint'}
            </Button>
            <Button size="small" onClick={resetEquation} startIcon={<ResetIcon />}>Reset</Button>
          </Box>
        </Box>
        
        {showHint && (
          <Alert severity="warning" sx={{ mb: 2 }}>{currentEq.hint}</Alert>
        )}
        
        {/* Equation Display */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1,
          flexWrap: 'wrap',
          py: 2,
          bgcolor: '#f8fafc',
          borderRadius: 2
        }}>
          {currentEq.reactants.map((compound, i) => (
            <React.Fragment key={`r-${i}`}>
              {i > 0 && <Typography variant="h5">+</Typography>}
              <Box sx={{ textAlign: 'center' }}>
                <TextField
                  value={coefficients[i]}
                  onChange={(e) => updateCoefficient(i, e.target.value)}
                  type="number"
                  size="small"
                  inputProps={{ min: 1, max: 10, style: { textAlign: 'center', width: 40 } }}
                />
                <Typography variant="h5" sx={{ mt: 0.5 }}>{compound.formula}</Typography>
              </Box>
            </React.Fragment>
          ))}
          
          <Typography variant="h4" sx={{ mx: 2 }}>→</Typography>
          
          {currentEq.products.map((compound, i) => (
            <React.Fragment key={`p-${i}`}>
              {i > 0 && <Typography variant="h5">+</Typography>}
              <Box sx={{ textAlign: 'center' }}>
                <TextField
                  value={coefficients[currentEq.reactants.length + i]}
                  onChange={(e) => updateCoefficient(currentEq.reactants.length + i, e.target.value)}
                  type="number"
                  size="small"
                  inputProps={{ min: 1, max: 10, style: { textAlign: 'center', width: 40 } }}
                />
                <Typography variant="h5" sx={{ mt: 0.5 }}>{compound.formula}</Typography>
              </Box>
            </React.Fragment>
          ))}
        </Box>
        
        {/* Atom Count Table */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Atom Count:</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">LEFT SIDE</Typography>
              {Object.entries(leftCounts).map(([elem, count]) => (
                <Typography key={elem} variant="body2">
                  <strong>{elem}:</strong> {count}
                </Typography>
              ))}
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">RIGHT SIDE</Typography>
              {Object.entries(rightCounts).map(([elem, count]) => (
                <Typography 
                  key={elem} 
                  variant="body2"
                  sx={{ color: leftCounts[elem] === count ? 'success.main' : 'error.main' }}
                >
                  <strong>{elem}:</strong> {count} {leftCounts[elem] === count ? '✓' : '✗'}
                </Typography>
              ))}
            </Paper>
          </Box>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={checkBalance}
          >
            Check Balance
          </Button>
          <Button 
            variant="outlined"
            onClick={nextEquation}
          >
            Next Equation →
          </Button>
        </Box>
        
        {isBalanced && (
          <Alert severity="success" sx={{ mt: 2 }}>
            🎉 <strong>Correct!</strong> The equation is balanced! All atoms are equal on both sides.
          </Alert>
        )}
      </Paper>
      
      <Paper sx={{ p: 2, bgcolor: '#fef3c7' }}>
        <Typography variant="subtitle2" gutterBottom>🔑 Balancing Tips:</Typography>
        <Typography variant="body2">
          1. <strong>Count atoms</strong> of each element on both sides<br/>
          2. <strong>Balance metals</strong> first, then non-metals<br/>
          3. <strong>Balance H and O</strong> last (they're often in multiple compounds)<br/>
          4. <strong>Never change</strong> the subscripts in formulas<br/>
          5. <strong>Only change</strong> the coefficients (numbers in front)
        </Typography>
      </Paper>
    </Box>
  );
}

// Mole and Stoichiometry Calculator
function MoleStoichiometry() {
  const [mass, setMass] = useState(18);
  const [molarMass, setMolarMass] = useState(18);
  const [compound, setCompound] = useState('H₂O');
  
  const moles = mass / molarMass;
  const molecules = moles * 6.022e23;
  
  const compounds = [
    { formula: 'H₂O', molarMass: 18, name: 'Water' },
    { formula: 'CO₂', molarMass: 44, name: 'Carbon Dioxide' },
    { formula: 'NaCl', molarMass: 58.5, name: 'Sodium Chloride' },
    { formula: 'C₆H₁₂O₆', molarMass: 180, name: 'Glucose' },
    { formula: 'H₂SO₄', molarMass: 98, name: 'Sulfuric Acid' },
  ];
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>⚖️ The Mole Concept</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Select Compound:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {compounds.map((c) => (
                <Chip 
                  key={c.formula}
                  label={`${c.formula} (${c.molarMass} g/mol)`}
                  onClick={() => { setCompound(c.formula); setMolarMass(c.molarMass); }}
                  color={compound === c.formula ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>Mass: {mass} g</Typography>
            <Slider
              value={mass}
              onChange={(e, v) => setMass(v)}
              min={1}
              max={500}
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ bgcolor: '#f0fdf4', p: 2, borderRadius: 2 }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {moles.toFixed(4)} mol
              </Typography>
              <Typography variant="body2" color="text.secondary">
                = {molecules.toExponential(3)} molecules
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Formula: n = m / M = {mass}g ÷ {molarMass}g/mol
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Avogadro's Number:</strong> 6.022 × 10²³<br/>
              One mole of any substance contains this many particles!
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2, bgcolor: '#fef3c7' }}>
            <Typography variant="subtitle2" gutterBottom>
              <TipIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Real-World Examples:
            </Typography>
            <Typography variant="body2">
              • 1 mole of water (18g) = about 1 tablespoon<br/>
              • 1 mole of sugar (342g) = about 1.5 cups<br/>
              • 1 mole of iron = 56g (about size of a golf ball)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// pH and Acids/Bases
function Equilibrium() {
  const [pH, setPH] = useState(7);
  
  const getColor = () => {
    if (pH < 3) return '#dc2626';
    if (pH < 5) return '#f97316';
    if (pH < 7) return '#facc15';
    if (pH === 7) return '#22c55e';
    if (pH < 9) return '#3b82f6';
    if (pH < 11) return '#6366f1';
    return '#7c3aed';
  };
  
  const getSubstance = () => {
    if (pH <= 1) return 'Battery Acid';
    if (pH <= 2) return 'Lemon Juice';
    if (pH <= 3) return 'Vinegar';
    if (pH <= 4) return 'Tomato Juice';
    if (pH <= 5) return 'Coffee';
    if (pH <= 6) return 'Milk';
    if (pH <= 7) return 'Pure Water';
    if (pH <= 8) return 'Sea Water';
    if (pH <= 9) return 'Baking Soda';
    if (pH <= 10) return 'Milk of Magnesia';
    if (pH <= 11) return 'Ammonia';
    if (pH <= 12) return 'Soapy Water';
    if (pH <= 13) return 'Bleach';
    return 'Drain Cleaner';
  };
  
  const hConcentration = Math.pow(10, -pH);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>⚗️ pH Scale & Acid-Base Chemistry</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ 
              height: 60, 
              borderRadius: 2,
              background: 'linear-gradient(to right, #dc2626, #f97316, #facc15, #22c55e, #3b82f6, #6366f1, #7c3aed)',
              position: 'relative',
              mb: 2
            }}>
              <Box sx={{
                position: 'absolute',
                left: `${(pH / 14) * 100}%`,
                top: -10,
                transform: 'translateX(-50%)',
              }}>
                <Box sx={{ 
                  width: 4, 
                  height: 80, 
                  bgcolor: '#000',
                  borderRadius: 1
                }} />
              </Box>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => (
                <Typography 
                  key={n}
                  sx={{ 
                    position: 'absolute', 
                    left: `${(n / 14) * 100}%`, 
                    bottom: -25,
                    transform: 'translateX(-50%)',
                    fontSize: '0.7rem'
                  }}
                >
                  {n}
                </Typography>
              ))}
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" gutterBottom>Adjust pH: {pH}</Typography>
              <Slider
                value={pH}
                onChange={(e, v) => setPH(v)}
                min={0}
                max={14}
                step={0.5}
                marks={[
                  { value: 0, label: 'Acidic' },
                  { value: 7, label: 'Neutral' },
                  { value: 14, label: 'Basic' }
                ]}
                sx={{ color: getColor() }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Paper sx={{ flex: 1, p: 2, bgcolor: getColor(), color: 'white', textAlign: 'center' }}>
                <Typography variant="h3">{pH}</Typography>
                <Typography variant="body2">{getSubstance()}</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                <Typography variant="caption" display="block">H⁺ Concentration</Typography>
                <Typography variant="h6">{hConcentration.toExponential(2)} M</Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Alert severity={pH < 7 ? 'warning' : pH > 7 ? 'info' : 'success'}>
            <Typography variant="body2">
              <strong>{pH < 7 ? '🍋 Acidic' : pH > 7 ? '🧼 Basic/Alkaline' : '💧 Neutral'}</strong><br/>
              {pH < 7 && 'Acids donate H⁺ ions. Lower pH = more acidic.'}
              {pH > 7 && 'Bases accept H⁺ ions or donate OH⁻. Higher pH = more basic.'}
              {pH === 7 && 'Perfect balance of H⁺ and OH⁻ ions.'}
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#fef3c7' }}>
            <Typography variant="subtitle2" gutterBottom>
              📐 pH Formula:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              pH = -log₁₀[H⁺]<br/>
              [H⁺] = 10^(-pH)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Organic Chemistry Basics
function OrganicChemistry() {
  const [group, setGroup] = useState('alkane');
  
  const functionalGroups = {
    alkane: { 
      name: 'Alkane', 
      formula: 'CₙH₂ₙ₊₂', 
      example: 'CH₄ (Methane)',
      structure: 'C-C single bonds only',
      properties: 'Saturated, unreactive, fuels'
    },
    alkene: { 
      name: 'Alkene', 
      formula: 'CₙH₂ₙ', 
      example: 'C₂H₄ (Ethene)',
      structure: 'C=C double bond',
      properties: 'Unsaturated, addition reactions'
    },
    alkyne: { 
      name: 'Alkyne', 
      formula: 'CₙH₂ₙ₋₂', 
      example: 'C₂H₂ (Ethyne)',
      structure: 'C≡C triple bond',
      properties: 'Very unsaturated, acetylene welding'
    },
    alcohol: { 
      name: 'Alcohol', 
      formula: 'R-OH', 
      example: 'C₂H₅OH (Ethanol)',
      structure: 'Hydroxyl (-OH) group',
      properties: 'Hydrogen bonding, solvents'
    },
    carboxylic: { 
      name: 'Carboxylic Acid', 
      formula: 'R-COOH', 
      example: 'CH₃COOH (Acetic Acid)',
      structure: 'Carboxyl (-COOH) group',
      properties: 'Acidic, forms esters'
    },
    amine: { 
      name: 'Amine', 
      formula: 'R-NH₂', 
      example: 'CH₃NH₂ (Methylamine)',
      structure: 'Amino (-NH₂) group',
      properties: 'Basic, fishy smell, proteins'
    },
  };
  
  const current = functionalGroups[group];
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🧬 Organic Chemistry: Functional Groups</Typography>
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {Object.entries(functionalGroups).map(([key, val]) => (
          <Chip 
            key={key}
            label={val.name}
            onClick={() => setGroup(key)}
            color={group === key ? 'primary' : 'default'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#faf5ff' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {current.formula}
            </Typography>
            <Typography variant="h6">{current.name}</Typography>
            <Chip label={current.example} sx={{ mt: 1 }} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Structure:</Typography>
            <Typography variant="body2" paragraph>{current.structure}</Typography>
            
            <Typography variant="subtitle2" gutterBottom>Properties:</Typography>
            <Typography variant="body2">{current.properties}</Typography>
          </Paper>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>IUPAC Naming:</strong> Prefix (# carbons) + Suffix (functional group)<br/>
              Meth- (1), Eth- (2), Prop- (3), But- (4), Pent- (5), Hex- (6)
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}

// Electrochemistry - Simple Voltaic Cell
function Electrochemistry() {
  const [isRunning, setIsRunning] = useState(false);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🔋 Electrochemistry: Voltaic Cell</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <svg viewBox="0 0 400 300" style={{ width: '100%' }}>
              {/* Left beaker - Zinc */}
              <rect x="50" y="100" width="120" height="150" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="5" />
              <text x="110" y="90" textAnchor="middle" fontSize="12" fill="#3b82f6" fontWeight="bold">Zn (Anode)</text>
              <rect x="100" y="70" width="20" height="100" fill="#a1a1aa" />
              <text x="110" y="270" textAnchor="middle" fontSize="10" fill="#666">ZnSO₄ solution</text>
              
              {/* Right beaker - Copper */}
              <rect x="230" y="100" width="120" height="150" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" rx="5" />
              <text x="290" y="90" textAnchor="middle" fontSize="12" fill="#22c55e" fontWeight="bold">Cu (Cathode)</text>
              <rect x="280" y="70" width="20" height="100" fill="#c2410c" />
              <text x="290" y="270" textAnchor="middle" fontSize="10" fill="#666">CuSO₄ solution</text>
              
              {/* Salt bridge */}
              <path d="M170,140 C200,120 200,120 230,140" fill="none" stroke="#666" strokeWidth="8" />
              <text x="200" y="115" textAnchor="middle" fontSize="10" fill="#666">Salt Bridge</text>
              
              {/* Wire and voltmeter */}
              <line x1="110" y1="70" x2="110" y2="30" stroke="#333" strokeWidth="2" />
              <line x1="110" y1="30" x2="290" y2="30" stroke="#333" strokeWidth="2" />
              <line x1="290" y1="30" x2="290" y2="70" stroke="#333" strokeWidth="2" />
              <circle cx="200" cy="30" r="20" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
              <text x="200" y="35" textAnchor="middle" fontSize="10" fontWeight="bold">V</text>
              
              {/* Electron flow animation */}
              {isRunning && (
                <>
                  <circle r="4" fill="#3b82f6">
                    <animate attributeName="cx" values="110;200;290" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="50;30;50" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="#3b82f6">
                    <animate attributeName="cx" values="130;200;270" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="50;30;50" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              
              {/* Labels */}
              <text x="50" y="295" fontSize="9" fill="#dc2626">Oxidation: Zn → Zn²⁺ + 2e⁻</text>
              <text x="230" y="295" fontSize="9" fill="#22c55e">Reduction: Cu²⁺ + 2e⁻ → Cu</text>
            </svg>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
              <Button 
                variant="contained" 
                startIcon={isRunning ? <ResetIcon /> : <PlayIcon />}
                onClick={() => setIsRunning(!isRunning)}
                color={isRunning ? 'secondary' : 'primary'}
              >
                {isRunning ? 'Stop' : 'Start Cell'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>How it works:</strong><br/>
              1. Zn atoms lose electrons (oxidation)<br/>
              2. Electrons flow through wire<br/>
              3. Cu²⁺ ions gain electrons (reduction)<br/>
              4. Salt bridge balances charge
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2, bgcolor: '#fef9c3' }}>
            <Typography variant="subtitle2" gutterBottom>
              🔑 Key Terms:
            </Typography>
            <Typography variant="body2">
              • <strong>Anode:</strong> Oxidation occurs (loses e⁻)<br/>
              • <strong>Cathode:</strong> Reduction occurs (gains e⁻)<br/>
              • <strong>Redox:</strong> Reduction + Oxidation<br/>
              • Remember: AN OX (anode oxidation), RED CAT (reduction cathode)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Placeholder components for other experiments
function MatterClassifier() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🔬 Elements, Compounds & Mixtures</Typography>
      <Grid container spacing={2}>
        {[
          { type: 'Element', example: 'Gold (Au)', desc: 'Single type of atom', color: '#fbbf24' },
          { type: 'Compound', example: 'Water (H₂O)', desc: 'Fixed ratio of elements', color: '#3b82f6' },
          { type: 'Mixture', example: 'Salt Water', desc: 'Combined but not chemically bonded', color: '#22c55e' },
        ].map((item) => (
          <Grid item xs={12} md={4} key={item.type}>
            <Paper sx={{ p: 2, bgcolor: item.color + '20', borderLeft: `4px solid ${item.color}` }}>
              <Typography variant="h6">{item.type}</Typography>
              <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
              <Chip label={item.example} size="small" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Quick Test:</strong> Can it be separated by physical means? → Mixture. 
        Can it be broken down chemically? → Compound. 
        Only one type of atom? → Element.
      </Alert>
    </Box>
  );
}

function PeriodicTrends() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>📊 Periodic Table Trends</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Across a Period (→)</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="↑ Atomic radius decreases" size="small" />
              <Chip label="↑ Ionization energy increases" size="small" />
              <Chip label="↑ Electronegativity increases" size="small" />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Down a Group (↓)</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="↑ Atomic radius increases" size="small" />
              <Chip label="↓ Ionization energy decreases" size="small" />
              <Chip label="↓ Electronegativity decreases" size="small" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function ReactionKinetics() {
  const [temperature, setTemperature] = useState(25);
  const rate = Math.pow(2, (temperature - 25) / 10);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>⚡ Reaction Kinetics</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">Temperature Effect on Reaction Rate</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          General rule: Rate doubles for every 10°C increase
        </Typography>
        <Slider
          value={temperature}
          onChange={(e, v) => setTemperature(v)}
          min={0}
          max={100}
          valueLabelDisplay="auto"
          marks={[{ value: 25, label: '25°C' }]}
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          At {temperature}°C, reaction rate is approximately <strong>{rate.toFixed(2)}x</strong> the rate at 25°C
        </Alert>
      </Paper>
    </Box>
  );
}

function Thermodynamics() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🔥 Thermodynamics</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#fee2e2' }}>
            <Typography variant="subtitle1" color="error.main" fontWeight="bold">Exothermic (−ΔH)</Typography>
            <Typography variant="body2">Heat released to surroundings</Typography>
            <Typography variant="caption">Examples: Combustion, neutralization</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#dbeafe' }}>
            <Typography variant="subtitle1" color="primary" fontWeight="bold">Endothermic (+ΔH)</Typography>
            <Typography variant="body2">Heat absorbed from surroundings</Typography>
            <Typography variant="caption">Examples: Photosynthesis, melting ice</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function QuantumChem() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>⚛️ Quantum Chemistry Basics</Typography>
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Hybridization:</strong><br/>
          • sp³ → Tetrahedral (109.5°) - CH₃<br/>
          • sp² → Trigonal Planar (120°) - C=C<br/>
          • sp → Linear (180°) - C≡C
        </Typography>
      </Alert>
    </Box>
  );
}

function Stereochemistry() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>🔄 Stereochemistry</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">Chirality</Typography>
            <Typography variant="body2">
              Molecules that are non-superimposable mirror images (like left and right hands).
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">Isomers</Typography>
            <Typography variant="body2">
              Same molecular formula, different arrangements: Structural, Geometric (cis/trans), Optical (R/S).
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function Spectroscopy() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>📡 Spectroscopy</Typography>
      <Grid container spacing={1}>
        {[
          { type: 'IR', use: 'Identify functional groups', range: '4000-400 cm⁻¹' },
          { type: 'NMR', use: 'Determine structure (H, C environments)', range: '¹H, ¹³C' },
          { type: 'Mass Spec', use: 'Find molecular mass, fragments', range: 'm/z ratio' },
        ].map((spec) => (
          <Grid item xs={12} md={4} key={spec.type}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{spec.type}</Typography>
              <Typography variant="body2">{spec.use}</Typography>
              <Chip label={spec.range} size="small" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Component map for experiments
const experimentComponents = {
  "AtomBuilder": AtomBuilder,
  "MatterClassifier": MatterClassifier,
  "PeriodicTrends": PeriodicTrends,
  "StatesOfMatter": StatesOfMatter,
  "BondingBasics": BondingBasics,
  "ValencyExplorer": ValencyExplorer,
  "EquationBalancer": EquationBalancer,
  "MoleStoichiometry": MoleStoichiometry,
  "ReactionKinetics": ReactionKinetics,
  "OrganicChemistry": OrganicChemistry,
  "Thermodynamics": Thermodynamics,
  "Electrochemistry": Electrochemistry,
  "Equilibrium": Equilibrium,
  "QuantumChem": QuantumChem,
  "Stereochemistry": Stereochemistry,
  "Spectroscopy": Spectroscopy,
};

// Chemistry Diagram Templates
const CHEMISTRY_DIAGRAMS = {
  waterElectrolysis: {
    title: 'Electrolysis of Water',
    type: 'reaction',
    svg: `<svg viewBox="0 0 400 350" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#93c5fd"/>
          <stop offset="100%" style="stop-color:#3b82f6"/>
        </linearGradient>
      </defs>
      <rect x="80" y="100" width="240" height="180" rx="5" fill="url(#waterGrad)" stroke="#1e40af" stroke-width="3"/>
      <text x="200" y="250" text-anchor="middle" font-size="12" fill="white" font-weight="bold">H₂O (Water)</text>
      <g transform="translate(120,60)">
        <rect x="0" y="0" width="30" height="220" fill="#4b5563" rx="2"/>
        <rect x="5" y="10" width="20" height="200" fill="#374151"/>
        <text x="15" y="-10" text-anchor="middle" font-size="10" fill="#dc2626" font-weight="bold">Cathode (−)</text>
        <circle cx="15" cy="50" r="6" fill="#ffffff" opacity="0.8"/>
        <circle cx="15" cy="70" r="5" fill="#ffffff" opacity="0.7"/>
        <circle cx="15" cy="90" r="4" fill="#ffffff" opacity="0.6"/>
        <text x="15" y="-25" text-anchor="middle" font-size="10" fill="#333">H₂ ↑</text>
      </g>
      <g transform="translate(250,60)">
        <rect x="0" y="0" width="30" height="220" fill="#4b5563" rx="2"/>
        <rect x="5" y="10" width="20" height="200" fill="#374151"/>
        <text x="15" y="-10" text-anchor="middle" font-size="10" fill="#3b82f6" font-weight="bold">Anode (+)</text>
        <circle cx="15" cy="60" r="5" fill="#ffffff" opacity="0.7"/>
        <circle cx="15" cy="80" r="4" fill="#ffffff" opacity="0.6"/>
        <text x="15" y="-25" text-anchor="middle" font-size="10" fill="#333">O₂ ↑</text>
      </g>
      <rect x="100" y="40" width="200" height="20" fill="#fcd34d" rx="3"/>
      <text x="200" y="55" text-anchor="middle" font-size="10" fill="#333" font-weight="bold">Battery / DC Power</text>
      <line x1="135" y1="60" x2="135" y2="100" stroke="#dc2626" stroke-width="3"/>
      <line x1="265" y1="60" x2="265" y2="100" stroke="#3b82f6" stroke-width="3"/>
      <text x="200" y="310" text-anchor="middle" font-size="11" fill="#1976d2" font-weight="bold">2H₂O → 2H₂ + O₂</text>
      <text x="200" y="330" text-anchor="middle" font-size="9" fill="#666">Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻</text>
      <text x="200" y="345" text-anchor="middle" font-size="9" fill="#666">Anode: 2OH⁻ → H₂O + ½O₂ + 2e⁻</text>
    </svg>`,
    labels: ['Water split into H₂ and O₂', 'Hydrogen at cathode (−)', 'Oxygen at anode (+)', 'Requires DC current']
  },
  covalentBond: {
    title: 'Covalent Bonding',
    type: 'bonding',
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="25" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Covalent Bond Formation (H₂)</text>
      <g transform="translate(50,80)">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,3"/>
        <circle cx="50" cy="50" r="15" fill="#ef4444"/>
        <text x="50" y="55" text-anchor="middle" font-size="12" fill="white" font-weight="bold">H</text>
        <circle cx="85" cy="35" r="8" fill="#3b82f6"/>
        <text x="50" y="110" text-anchor="middle" font-size="10" fill="#333">1 electron</text>
      </g>
      <text x="200" y="100" text-anchor="middle" font-size="24" fill="#333">+</text>
      <g transform="translate(250,80)">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,3"/>
        <circle cx="50" cy="50" r="15" fill="#ef4444"/>
        <text x="50" y="55" text-anchor="middle" font-size="12" fill="white" font-weight="bold">H</text>
        <circle cx="15" cy="35" r="8" fill="#3b82f6"/>
        <text x="50" y="110" text-anchor="middle" font-size="10" fill="#333">1 electron</text>
      </g>
      <text x="200" y="180" text-anchor="middle" font-size="20" fill="#22c55e">↓</text>
      <g transform="translate(130,200)">
        <circle cx="40" cy="40" r="35" fill="none" stroke="#22c55e" stroke-width="2"/>
        <circle cx="100" cy="40" r="35" fill="none" stroke="#22c55e" stroke-width="2"/>
        <ellipse cx="70" cy="40" rx="20" ry="15" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2"/>
        <circle cx="40" cy="40" r="15" fill="#ef4444"/><text x="40" y="45" text-anchor="middle" font-size="12" fill="white" font-weight="bold">H</text>
        <circle cx="100" cy="40" r="15" fill="#ef4444"/><text x="100" y="45" text-anchor="middle" font-size="12" fill="white" font-weight="bold">H</text>
        <circle cx="60" cy="32" r="6" fill="#3b82f6"/>
        <circle cx="80" cy="32" r="6" fill="#3b82f6"/>
        <text x="70" y="80" text-anchor="middle" font-size="10" fill="#22c55e" font-weight="bold">Shared pair</text>
      </g>
      <text x="200" y="290" text-anchor="middle" font-size="11" fill="#1976d2" font-weight="bold">H₂ molecule - Single covalent bond</text>
    </svg>`,
    labels: ['Electrons are shared', 'Both atoms achieve stability', 'Forms a single bond', 'Non-polar molecule']
  },
  ionicBond: {
    title: 'Ionic Bonding (NaCl)',
    type: 'bonding',
    svg: `<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="25" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Ionic Bond Formation (NaCl)</text>
      <g transform="translate(30,50)">
        <circle cx="60" cy="60" r="50" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="60" cy="60" r="20" fill="#f59e0b"/>
        <text x="60" y="65" text-anchor="middle" font-size="14" fill="white" font-weight="bold">Na</text>
        <circle cx="110" cy="50" r="8" fill="#3b82f6"/>
        <text x="60" y="125" text-anchor="middle" font-size="10" fill="#333">2,8,1 electrons</text>
        <text x="60" y="140" text-anchor="middle" font-size="9" fill="#666">Loses 1 electron</text>
      </g>
      <g transform="translate(220,50)">
        <circle cx="60" cy="60" r="50" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/>
        <circle cx="60" cy="60" r="20" fill="#22c55e"/>
        <text x="60" y="65" text-anchor="middle" font-size="14" fill="white" font-weight="bold">Cl</text>
        <circle cx="10" cy="50" r="7" fill="#3b82f6"/><circle cx="20" cy="30" r="7" fill="#3b82f6"/>
        <circle cx="40" cy="20" r="7" fill="#3b82f6"/><circle cx="80" cy="20" r="7" fill="#3b82f6"/>
        <circle cx="100" cy="30" r="7" fill="#3b82f6"/><circle cx="110" cy="50" r="7" fill="#3b82f6"/>
        <circle cx="100" cy="90" r="7" fill="#3b82f6"/>
        <text x="60" y="125" text-anchor="middle" font-size="10" fill="#333">2,8,7 electrons</text>
        <text x="60" y="140" text-anchor="middle" font-size="9" fill="#666">Gains 1 electron</text>
      </g>
      <path d="M160,90 Q200,70 240,90" stroke="#8b5cf6" stroke-width="3" fill="none" marker-end="url(#arrowPurple)"/>
      <defs><marker id="arrowPurple" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6"/></marker></defs>
      <text x="200" y="60" text-anchor="middle" font-size="10" fill="#8b5cf6" font-weight="bold">e⁻ transfer</text>
      <g transform="translate(100,200)">
        <circle cx="50" cy="40" r="35" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
        <text x="50" y="45" text-anchor="middle" font-size="16" fill="#d97706" font-weight="bold">Na⁺</text>
        <circle cx="150" cy="40" r="40" fill="#dcfce7" stroke="#22c55e" stroke-width="3"/>
        <text x="150" y="45" text-anchor="middle" font-size="16" fill="#15803d" font-weight="bold">Cl⁻</text>
        <line x1="85" y1="40" x2="110" y2="40" stroke="#ef4444" stroke-width="4" stroke-dasharray="6,3"/>
        <text x="100" y="95" text-anchor="middle" font-size="10" fill="#ef4444" font-weight="bold">Electrostatic attraction</text>
      </g>
      <text x="200" y="310" text-anchor="middle" font-size="11" fill="#1976d2" font-weight="bold">NaCl - Ionic compound (salt)</text>
    </svg>`,
    labels: ['Electron transferred from Na to Cl', 'Na becomes Na⁺ (cation)', 'Cl becomes Cl⁻ (anion)', 'Electrostatic attraction forms bond']
  },
  phScale: {
    title: 'pH Scale',
    type: 'acids-bases',
    svg: `<svg viewBox="0 0 450 280" xmlns="http://www.w3.org/2000/svg">
      <text x="225" y="25" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">The pH Scale (0-14)</text>
      <defs>
        <linearGradient id="phGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ef4444"/>
          <stop offset="25%" style="stop-color:#f97316"/>
          <stop offset="40%" style="stop-color:#eab308"/>
          <stop offset="50%" style="stop-color:#22c55e"/>
          <stop offset="60%" style="stop-color:#06b6d4"/>
          <stop offset="75%" style="stop-color:#3b82f6"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect x="25" y="50" width="400" height="40" rx="5" fill="url(#phGrad)"/>
      ${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((n,i) => `
        <line x1="${25 + i * (400/14)}" y1="90" x2="${25 + i * (400/14)}" y2="100" stroke="#333" stroke-width="2"/>
        <text x="${25 + i * (400/14)}" y="115" text-anchor="middle" font-size="10" fill="#333" font-weight="bold">${n}</text>
      `).join('')}
      <text x="100" y="140" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">ACIDIC</text>
      <text x="225" y="140" text-anchor="middle" font-size="11" fill="#22c55e" font-weight="bold">NEUTRAL</text>
      <text x="350" y="140" text-anchor="middle" font-size="11" fill="#3b82f6" font-weight="bold">BASIC/ALKALINE</text>
      <g font-size="9">
        <text x="40" y="165" fill="#333">🍋 Lemon (2)</text>
        <text x="40" y="180" fill="#333">🥤 Cola (2.5)</text>
        <text x="130" y="165" fill="#333">🍊 Orange (3.5)</text>
        <text x="130" y="180" fill="#333">☕ Coffee (5)</text>
        <text x="205" y="165" fill="#333">💧 Water (7)</text>
        <text x="205" y="180" fill="#333">🩸 Blood (7.4)</text>
        <text x="290" y="165" fill="#333">🧼 Soap (9-10)</text>
        <text x="290" y="180" fill="#333">🥚 Egg white (8)</text>
        <text x="375" y="165" fill="#333">🧴 Ammonia (11)</text>
        <text x="375" y="180" fill="#333">🧪 Bleach (12.5)</text>
      </g>
      <text x="100" y="210" text-anchor="middle" font-size="10" fill="#ef4444">H⁺ ions increase →</text>
      <text x="350" y="210" text-anchor="middle" font-size="10" fill="#3b82f6">← OH⁻ ions increase</text>
      <text x="225" y="240" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">pH = −log[H⁺]</text>
      <text x="225" y="260" text-anchor="middle" font-size="9" fill="#666">Each unit change = 10x difference in H⁺ concentration</text>
    </svg>`,
    labels: ['pH 0-6: Acidic', 'pH 7: Neutral', 'pH 8-14: Basic/Alkaline', 'Logarithmic scale']
  },
  labApparatus: {
    title: 'Laboratory Apparatus',
    type: 'equipment',
    svg: `<svg viewBox="0 0 450 300" xmlns="http://www.w3.org/2000/svg">
      <text x="225" y="25" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Common Laboratory Equipment</text>
      <g transform="translate(30,50)">
        <path d="M40,0 L40,80 L20,150 L60,150 L40,80" fill="none" stroke="#333" stroke-width="2"/>
        <ellipse cx="40" cy="150" rx="20" ry="5" fill="rgba(147, 197, 253, 0.5)" stroke="#333"/>
        <rect x="35" y="-5" width="10" height="10" fill="#333"/>
        <text x="40" y="170" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Burette</text>
      </g>
      <g transform="translate(100,80)">
        <path d="M30,0 L50,0 L70,80 L10,80 Z" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <ellipse cx="40" cy="80" rx="30" ry="8" fill="rgba(147, 197, 253, 0.5)" stroke="#333"/>
        <text x="40" y="105" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Conical Flask</text>
      </g>
      <g transform="translate(170,60)">
        <rect x="10" y="0" width="40" height="100" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2" rx="2"/>
        <rect x="10" y="80" width="40" height="20" fill="rgba(59, 130, 246, 0.5)"/>
        ${[20,40,60,80].map(y => `<line x1="10" y1="${y}" x2="15" y2="${y}" stroke="#333"/><text x="18" y="${y+3}" font-size="6">${100-y}</text>`).join('')}
        <text x="30" y="120" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Measuring Cylinder</text>
      </g>
      <g transform="translate(250,70)">
        <circle cx="30" cy="60" r="50" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <rect x="25" y="0" width="10" height="20" fill="#333"/>
        <ellipse cx="30" cy="60" rx="40" ry="10" fill="rgba(59, 130, 246, 0.5)"/>
        <text x="30" y="130" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Round Bottom Flask</text>
      </g>
      <g transform="translate(340,80)">
        <rect x="0" y="0" width="60" height="80" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <line x1="0" y1="60" x2="60" y2="60" stroke="#333"/>
        <rect x="10" y="65" width="40" height="10" fill="rgba(59, 130, 246, 0.5)"/>
        <text x="30" y="105" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Beaker</text>
      </g>
      <g transform="translate(100,200)">
        <rect x="0" y="0" width="80" height="8" fill="#64748b" rx="2"/>
        <rect x="30" y="-30" width="20" height="30" fill="#f59e0b"/>
        <circle cx="40" cy="-40" r="15" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
        <text x="40" y="25" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Bunsen Burner</text>
      </g>
      <g transform="translate(220,190)">
        <ellipse cx="40" cy="40" rx="40" ry="20" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <ellipse cx="40" cy="40" rx="35" ry="15" fill="rgba(59, 130, 246, 0.5)"/>
        <text x="40" y="75" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Watch Glass</text>
      </g>
      <g transform="translate(320,180)">
        <rect x="20" y="0" width="40" height="60" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <rect x="20" y="50" width="40" height="10" fill="rgba(59, 130, 246, 0.5)"/>
        <ellipse cx="40" cy="0" rx="20" ry="5" fill="none" stroke="#333" stroke-width="2"/>
        <text x="40" y="85" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Test Tube</text>
      </g>
    </svg>`,
    labels: ['Burette: precise volume measurement', 'Conical flask: mixing reactions', 'Bunsen burner: heating', 'Test tube: small-scale reactions']
  },
  distillation: {
    title: 'Distillation Apparatus',
    type: 'separation',
    svg: `<svg viewBox="0 0 450 320" xmlns="http://www.w3.org/2000/svg">
      <text x="225" y="25" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Simple Distillation Setup</text>
      <g transform="translate(50,50)">
        <circle cx="60" cy="100" r="60" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <ellipse cx="60" cy="100" rx="50" ry="15" fill="rgba(59, 130, 246, 0.5)"/>
        <rect x="50" y="35" width="20" height="15" fill="#333"/>
        <text x="60" y="200" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Distillation Flask</text>
        <rect x="20" y="160" width="80" height="15" fill="#64748b"/>
        <rect x="40" y="170" width="40" height="25" fill="#f59e0b"/>
        <text x="60" y="215" text-anchor="middle" font-size="8" fill="#333">Heat Source</text>
      </g>
      <path d="M110,85 Q150,85 180,120 L320,180" stroke="#333" stroke-width="3" fill="none"/>
      <ellipse cx="180" cy="110" rx="25" ry="35" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="180" cy="85" r="8" fill="#ef4444"/>
      <text x="180" y="60" text-anchor="middle" font-size="8" fill="#ef4444">Thermometer</text>
      <text x="220" y="105" text-anchor="middle" font-size="8" fill="#333">Condenser</text>
      <line x1="180" y1="130" x2="180" y2="160" stroke="#3b82f6" stroke-width="2"/>
      <line x1="180" y1="165" x2="180" y2="195" stroke="#3b82f6" stroke-width="2"/>
      <text x="200" y="150" font-size="7" fill="#3b82f6">Cold water in</text>
      <text x="200" y="185" font-size="7" fill="#3b82f6">Cold water out</text>
      <g transform="translate(300,180)">
        <path d="M20,0 L40,0 L60,80 L0,80 Z" fill="rgba(147, 197, 253, 0.3)" stroke="#333" stroke-width="2"/>
        <ellipse cx="30" cy="80" rx="30" ry="8" fill="rgba(34, 197, 94, 0.5)" stroke="#333"/>
        <text x="30" y="105" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">Collection Flask</text>
        <text x="30" y="120" text-anchor="middle" font-size="8" fill="#22c55e">Pure Distillate</text>
      </g>
      <path d="M80,85 Q80,50 100,50 L110,50" stroke="#94a3b8" stroke-width="2" fill="none" marker-end="url(#steamArrow)"/>
      <defs><marker id="steamArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#94a3b8"/></marker></defs>
      <text x="95" y="40" font-size="8" fill="#94a3b8">Vapor rises</text>
      <text x="225" y="290" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">Separates liquids by boiling point difference</text>
      <text x="225" y="310" text-anchor="middle" font-size="9" fill="#666">Lower b.p. liquid vaporizes first → condenses → collected</text>
    </svg>`,
    labels: ['Liquid heated to boiling', 'Vapor rises through condenser', 'Cold water cools vapor', 'Pure liquid collected']
  },
  organicFunctional: {
    title: 'Organic Functional Groups',
    type: 'organic',
    svg: `<svg viewBox="0 0 450 350" xmlns="http://www.w3.org/2000/svg">
      <text x="225" y="25" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Common Organic Functional Groups</text>
      <g transform="translate(30,45)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Alcohol (-OH)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—OH</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">e.g., Ethanol</text>
      </g>
      <g transform="translate(165,45)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#dcfce7" stroke="#22c55e" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Aldehyde (-CHO)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—C=O</text>
        <text x="66" y="50" text-anchor="middle" fill="#333" font-family="monospace">|</text>
        <text x="66" y="60" text-anchor="middle" fill="#333" font-family="monospace">H</text>
      </g>
      <g transform="translate(300,45)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Ketone (C=O)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—C=O</text>
        <text x="66" y="50" text-anchor="middle" fill="#333" font-family="monospace">|</text>
        <text x="66" y="60" text-anchor="middle" fill="#333" font-family="monospace">R'</text>
      </g>
      <g transform="translate(30,130)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#fce7f3" stroke="#ec4899" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Carboxylic Acid</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—COOH</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">e.g., Acetic acid</text>
      </g>
      <g transform="translate(165,130)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#f3e8ff" stroke="#a855f7" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Amine (-NH₂)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—NH₂</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">e.g., Methylamine</text>
      </g>
      <g transform="translate(300,130)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#ccfbf1" stroke="#14b8a6" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Ester (-COO-)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—COO—R'</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">e.g., Ethyl acetate</text>
      </g>
      <g transform="translate(30,215)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#fef9c3" stroke="#eab308" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Ether (-O-)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—O—R'</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">e.g., Diethyl ether</text>
      </g>
      <g transform="translate(165,215)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#fee2e2" stroke="#ef4444" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Halide (-X)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—X</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">X = F, Cl, Br, I</text>
      </g>
      <g transform="translate(300,215)" font-size="10">
        <rect x="0" y="0" width="120" height="70" fill="#e0e7ff" stroke="#6366f1" stroke-width="2" rx="5"/>
        <text x="60" y="20" text-anchor="middle" fill="#333" font-weight="bold">Amide (-CONH₂)</text>
        <text x="60" y="40" text-anchor="middle" fill="#333" font-family="monospace">R—CONH₂</text>
        <text x="60" y="58" text-anchor="middle" fill="#666" font-size="8">e.g., Acetamide</text>
      </g>
      <text x="225" y="315" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">R = Alkyl group (CₙH₂ₙ₊₁)</text>
      <text x="225" y="335" text-anchor="middle" font-size="9" fill="#666">Functional groups determine chemical properties</text>
    </svg>`,
    labels: ['Alcohol: -OH group', 'Carboxylic acid: -COOH', 'Amine: -NH₂', 'Ester: -COO-']
  }
};

// Keywords for diagram matching
const CHEMISTRY_KEYWORDS = {
  waterElectrolysis: ['electrolysis', 'water splitting', 'hydrogen', 'oxygen', 'electrochemistry', 'h2o'],
  covalentBond: ['covalent', 'sharing electrons', 'molecular bond', 'non-polar', 'polar bond'],
  ionicBond: ['ionic', 'ion', 'nacl', 'salt', 'electron transfer', 'cation', 'anion'],
  phScale: ['ph', 'acid', 'base', 'alkaline', 'acidic', 'neutral', 'indicator'],
  labApparatus: ['apparatus', 'equipment', 'lab', 'beaker', 'flask', 'burette', 'test tube', 'bunsen'],
  distillation: ['distillation', 'separation', 'boiling point', 'evaporation', 'condensation', 'purification'],
  organicFunctional: ['functional group', 'organic', 'alcohol', 'aldehyde', 'ketone', 'carboxylic', 'amine', 'ester']
};

// Suggested chemistry questions
const CHEMISTRY_QUESTIONS = [
  "Explain ionic bonding",
  "What is the pH scale?",
  "Show electrolysis of water",
  "Explain covalent bonds",
  "Draw distillation setup",
  "What are functional groups?",
  "Show lab apparatus"
];

// Complete Periodic Table Data - All 118 Elements
const allElements = [
  // Period 1
  { symbol: 'H', name: 'Hydrogen', number: 1, mass: 1.008, category: 'nonmetal', period: 1, group: 1, electron: '1s¹', electronegativity: 2.20, density: 0.00008988, meltingPoint: -259.14, boilingPoint: -252.87, discoveredBy: 'Henry Cavendish', year: 1766, description: 'Lightest element, most abundant in the universe. Used in fuel cells and rocket propellants.' },
  { symbol: 'He', name: 'Helium', number: 2, mass: 4.003, category: 'noble', period: 1, group: 18, electron: '1s²', electronegativity: null, density: 0.0001785, meltingPoint: -272.2, boilingPoint: -268.93, discoveredBy: 'Pierre Janssen', year: 1868, description: 'Second lightest element, used in balloons and cryogenics. Inert noble gas.' },
  // Period 2
  { symbol: 'Li', name: 'Lithium', number: 3, mass: 6.941, category: 'alkali', period: 2, group: 1, electron: '[He] 2s¹', electronegativity: 0.98, density: 0.534, meltingPoint: 180.54, boilingPoint: 1342, discoveredBy: 'Johan August Arfwedson', year: 1817, description: 'Lightest metal, used in batteries and psychiatric medication.' },
  { symbol: 'Be', name: 'Beryllium', number: 4, mass: 9.012, category: 'alkaline', period: 2, group: 2, electron: '[He] 2s²', electronegativity: 1.57, density: 1.85, meltingPoint: 1287, boilingPoint: 2470, discoveredBy: 'Louis Nicolas Vauquelin', year: 1798, description: 'Strong, lightweight metal used in aerospace and X-ray windows.' },
  { symbol: 'B', name: 'Boron', number: 5, mass: 10.81, category: 'metalloid', period: 2, group: 13, electron: '[He] 2s² 2p¹', electronegativity: 2.04, density: 2.34, meltingPoint: 2076, boilingPoint: 3927, discoveredBy: 'Joseph Louis Gay-Lussac', year: 1808, description: 'Metalloid used in glass, ceramics, and as a neutron absorber.' },
  { symbol: 'C', name: 'Carbon', number: 6, mass: 12.01, category: 'nonmetal', period: 2, group: 14, electron: '[He] 2s² 2p²', electronegativity: 2.55, density: 2.267, meltingPoint: 3550, boilingPoint: 4027, discoveredBy: 'Ancient', year: null, description: 'Basis of organic chemistry and life. Forms diamond, graphite, and fullerenes.' },
  { symbol: 'N', name: 'Nitrogen', number: 7, mass: 14.01, category: 'nonmetal', period: 2, group: 15, electron: '[He] 2s² 2p³', electronegativity: 3.04, density: 0.0012506, meltingPoint: -210.1, boilingPoint: -195.79, discoveredBy: 'Daniel Rutherford', year: 1772, description: '78% of Earth\'s atmosphere. Essential for proteins and DNA.' },
  { symbol: 'O', name: 'Oxygen', number: 8, mass: 16.00, category: 'nonmetal', period: 2, group: 16, electron: '[He] 2s² 2p⁴', electronegativity: 3.44, density: 0.001429, meltingPoint: -218.79, boilingPoint: -182.95, discoveredBy: 'Carl Wilhelm Scheele', year: 1774, description: 'Essential for respiration. 21% of atmosphere. Highly reactive.' },
  { symbol: 'F', name: 'Fluorine', number: 9, mass: 19.00, category: 'halogen', period: 2, group: 17, electron: '[He] 2s² 2p⁵', electronegativity: 3.98, density: 0.001696, meltingPoint: -219.62, boilingPoint: -188.12, discoveredBy: 'André-Marie Ampère', year: 1810, description: 'Most electronegative element. Used in toothpaste and Teflon.' },
  { symbol: 'Ne', name: 'Neon', number: 10, mass: 20.18, category: 'noble', period: 2, group: 18, electron: '[He] 2s² 2p⁶', electronegativity: null, density: 0.0008999, meltingPoint: -248.59, boilingPoint: -246.08, discoveredBy: 'William Ramsay', year: 1898, description: 'Noble gas used in neon signs and lasers. Glows red-orange.' },
  // Period 3
  { symbol: 'Na', name: 'Sodium', number: 11, mass: 22.99, category: 'alkali', period: 3, group: 1, electron: '[Ne] 3s¹', electronegativity: 0.93, density: 0.971, meltingPoint: 97.72, boilingPoint: 883, discoveredBy: 'Humphry Davy', year: 1807, description: 'Essential for nerve function. Reacts violently with water.' },
  { symbol: 'Mg', name: 'Magnesium', number: 12, mass: 24.31, category: 'alkaline', period: 3, group: 2, electron: '[Ne] 3s²', electronegativity: 1.31, density: 1.738, meltingPoint: 650, boilingPoint: 1090, discoveredBy: 'Joseph Black', year: 1755, description: 'Lightweight metal. Essential for chlorophyll and human health.' },
  { symbol: 'Al', name: 'Aluminum', number: 13, mass: 26.98, category: 'metal', period: 3, group: 13, electron: '[Ne] 3s² 3p¹', electronegativity: 1.61, density: 2.698, meltingPoint: 660.32, boilingPoint: 2519, discoveredBy: 'Hans Christian Ørsted', year: 1825, description: 'Most abundant metal in Earth\'s crust. Lightweight and recyclable.' },
  { symbol: 'Si', name: 'Silicon', number: 14, mass: 28.09, category: 'metalloid', period: 3, group: 14, electron: '[Ne] 3s² 3p²', electronegativity: 1.90, density: 2.3296, meltingPoint: 1414, boilingPoint: 3265, discoveredBy: 'Jöns Jacob Berzelius', year: 1824, description: 'Basis of computer chips. Second most abundant element in crust.' },
  { symbol: 'P', name: 'Phosphorus', number: 15, mass: 30.97, category: 'nonmetal', period: 3, group: 15, electron: '[Ne] 3s² 3p³', electronegativity: 2.19, density: 1.82, meltingPoint: 44.15, boilingPoint: 280.5, discoveredBy: 'Hennig Brand', year: 1669, description: 'Essential for DNA and ATP. Used in fertilizers and matches.' },
  { symbol: 'S', name: 'Sulfur', number: 16, mass: 32.07, category: 'nonmetal', period: 3, group: 16, electron: '[Ne] 3s² 3p⁴', electronegativity: 2.58, density: 2.067, meltingPoint: 115.21, boilingPoint: 444.72, discoveredBy: 'Ancient', year: null, description: 'Yellow element with distinct smell. Used in sulfuric acid production.' },
  { symbol: 'Cl', name: 'Chlorine', number: 17, mass: 35.45, category: 'halogen', period: 3, group: 17, electron: '[Ne] 3s² 3p⁵', electronegativity: 3.16, density: 0.003214, meltingPoint: -101.5, boilingPoint: -34.04, discoveredBy: 'Carl Wilhelm Scheele', year: 1774, description: 'Greenish-yellow gas. Used for water purification and PVC.' },
  { symbol: 'Ar', name: 'Argon', number: 18, mass: 39.95, category: 'noble', period: 3, group: 18, electron: '[Ne] 3s² 3p⁶', electronegativity: null, density: 0.0017837, meltingPoint: -189.35, boilingPoint: -185.85, discoveredBy: 'Lord Rayleigh', year: 1894, description: 'Third most abundant gas in atmosphere. Used in welding and lighting.' },
  // Period 4
  { symbol: 'K', name: 'Potassium', number: 19, mass: 39.10, category: 'alkali', period: 4, group: 1, electron: '[Ar] 4s¹', electronegativity: 0.82, density: 0.862, meltingPoint: 63.38, boilingPoint: 759, discoveredBy: 'Humphry Davy', year: 1807, description: 'Essential for nerve function. Reacts violently with water.' },
  { symbol: 'Ca', name: 'Calcium', number: 20, mass: 40.08, category: 'alkaline', period: 4, group: 2, electron: '[Ar] 4s²', electronegativity: 1.00, density: 1.54, meltingPoint: 842, boilingPoint: 1484, discoveredBy: 'Humphry Davy', year: 1808, description: 'Essential for bones and teeth. Most abundant metal in human body.' },
  { symbol: 'Sc', name: 'Scandium', number: 21, mass: 44.96, category: 'transition', period: 4, group: 3, electron: '[Ar] 3d¹ 4s²', electronegativity: 1.36, density: 2.989, meltingPoint: 1541, boilingPoint: 2836, discoveredBy: 'Lars Fredrik Nilson', year: 1879, description: 'Lightweight transition metal used in aerospace alloys.' },
  { symbol: 'Ti', name: 'Titanium', number: 22, mass: 47.87, category: 'transition', period: 4, group: 4, electron: '[Ar] 3d² 4s²', electronegativity: 1.54, density: 4.506, meltingPoint: 1668, boilingPoint: 3287, discoveredBy: 'William Gregor', year: 1791, description: 'Strong, corrosion-resistant metal used in aerospace and medical implants.' },
  { symbol: 'V', name: 'Vanadium', number: 23, mass: 50.94, category: 'transition', period: 4, group: 5, electron: '[Ar] 3d³ 4s²', electronegativity: 1.63, density: 6.11, meltingPoint: 1910, boilingPoint: 3407, discoveredBy: 'Andrés Manuel del Río', year: 1801, description: 'Used in steel alloys and as a catalyst.' },
  { symbol: 'Cr', name: 'Chromium', number: 24, mass: 52.00, category: 'transition', period: 4, group: 6, electron: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, density: 7.15, meltingPoint: 1907, boilingPoint: 2671, discoveredBy: 'Louis Nicolas Vauquelin', year: 1797, description: 'Used for chrome plating and stainless steel. Very hard and lustrous.' },
  { symbol: 'Mn', name: 'Manganese', number: 25, mass: 54.94, category: 'transition', period: 4, group: 7, electron: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, density: 7.44, meltingPoint: 1246, boilingPoint: 2061, discoveredBy: 'Johan Gottlieb Gahn', year: 1774, description: 'Essential for steel production and human nutrition.' },
  { symbol: 'Fe', name: 'Iron', number: 26, mass: 55.85, category: 'transition', period: 4, group: 8, electron: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, density: 7.874, meltingPoint: 1538, boilingPoint: 2861, discoveredBy: 'Ancient', year: null, description: 'Most used metal. Essential for hemoglobin. Core of Earth is iron.' },
  { symbol: 'Co', name: 'Cobalt', number: 27, mass: 58.93, category: 'transition', period: 4, group: 9, electron: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, density: 8.86, meltingPoint: 1495, boilingPoint: 2927, discoveredBy: 'Georg Brandt', year: 1735, description: 'Used in blue pigments and rechargeable batteries.' },
  { symbol: 'Ni', name: 'Nickel', number: 28, mass: 58.69, category: 'transition', period: 4, group: 10, electron: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, density: 8.912, meltingPoint: 1455, boilingPoint: 2913, discoveredBy: 'Axel Fredrik Cronstedt', year: 1751, description: 'Used in stainless steel and nickel-plating. Magnetic.' },
  { symbol: 'Cu', name: 'Copper', number: 29, mass: 63.55, category: 'transition', period: 4, group: 11, electron: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.90, density: 8.96, meltingPoint: 1084.62, boilingPoint: 2562, discoveredBy: 'Ancient', year: null, description: 'Excellent conductor. Used in wiring and plumbing. Antibacterial.' },
  { symbol: 'Zn', name: 'Zinc', number: 30, mass: 65.38, category: 'transition', period: 4, group: 12, electron: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, density: 7.134, meltingPoint: 419.53, boilingPoint: 907, discoveredBy: 'India/Germany', year: 1746, description: 'Essential trace element. Used for galvanizing and in batteries.' },
  { symbol: 'Ga', name: 'Gallium', number: 31, mass: 69.72, category: 'metal', period: 4, group: 13, electron: '[Ar] 3d¹⁰ 4s² 4p¹', electronegativity: 1.81, density: 5.907, meltingPoint: 29.76, boilingPoint: 2204, discoveredBy: 'Paul Emile Lecoq de Boisbaudran', year: 1875, description: 'Melts in your hand. Used in semiconductors and LEDs.' },
  { symbol: 'Ge', name: 'Germanium', number: 32, mass: 72.63, category: 'metalloid', period: 4, group: 14, electron: '[Ar] 3d¹⁰ 4s² 4p²', electronegativity: 2.01, density: 5.323, meltingPoint: 938.25, boilingPoint: 2833, discoveredBy: 'Clemens Winkler', year: 1886, description: 'Semiconductor used in transistors and fiber optics.' },
  { symbol: 'As', name: 'Arsenic', number: 33, mass: 74.92, category: 'metalloid', period: 4, group: 15, electron: '[Ar] 3d¹⁰ 4s² 4p³', electronegativity: 2.18, density: 5.776, meltingPoint: 817, boilingPoint: 614, discoveredBy: 'Albertus Magnus', year: 1250, description: 'Toxic metalloid historically used as poison. Used in semiconductors.' },
  { symbol: 'Se', name: 'Selenium', number: 34, mass: 78.97, category: 'nonmetal', period: 4, group: 16, electron: '[Ar] 3d¹⁰ 4s² 4p⁴', electronegativity: 2.55, density: 4.809, meltingPoint: 221, boilingPoint: 685, discoveredBy: 'Jöns Jacob Berzelius', year: 1817, description: 'Essential trace element. Used in electronics and glass.' },
  { symbol: 'Br', name: 'Bromine', number: 35, mass: 79.90, category: 'halogen', period: 4, group: 17, electron: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, density: 3.122, meltingPoint: -7.2, boilingPoint: 58.8, discoveredBy: 'Antoine Jérôme Balard', year: 1826, description: 'Only non-metallic liquid at room temperature. Red-brown and pungent.' },
  { symbol: 'Kr', name: 'Krypton', number: 36, mass: 83.80, category: 'noble', period: 4, group: 18, electron: '[Ar] 3d¹⁰ 4s² 4p⁶', electronegativity: 3.00, density: 0.003733, meltingPoint: -157.36, boilingPoint: -153.22, discoveredBy: 'William Ramsay', year: 1898, description: 'Noble gas used in fluorescent lamps. Superman\'s home planet.' },
  // Period 5
  { symbol: 'Rb', name: 'Rubidium', number: 37, mass: 85.47, category: 'alkali', period: 5, group: 1, electron: '[Kr] 5s¹', electronegativity: 0.82, density: 1.532, meltingPoint: 39.31, boilingPoint: 688, discoveredBy: 'Robert Bunsen', year: 1861, description: 'Soft alkali metal used in atomic clocks and specialty glasses.' },
  { symbol: 'Sr', name: 'Strontium', number: 38, mass: 87.62, category: 'alkaline', period: 5, group: 2, electron: '[Kr] 5s²', electronegativity: 0.95, density: 2.64, meltingPoint: 777, boilingPoint: 1382, discoveredBy: 'Adair Crawford', year: 1790, description: 'Used in fireworks (red color) and in treating bone cancer.' },
  { symbol: 'Y', name: 'Yttrium', number: 39, mass: 88.91, category: 'transition', period: 5, group: 3, electron: '[Kr] 4d¹ 5s²', electronegativity: 1.22, density: 4.469, meltingPoint: 1522, boilingPoint: 3345, discoveredBy: 'Johan Gadolin', year: 1794, description: 'Used in LEDs, superconductors, and cancer treatment.' },
  { symbol: 'Zr', name: 'Zirconium', number: 40, mass: 91.22, category: 'transition', period: 5, group: 4, electron: '[Kr] 4d² 5s²', electronegativity: 1.33, density: 6.506, meltingPoint: 1855, boilingPoint: 4409, discoveredBy: 'Martin Heinrich Klaproth', year: 1789, description: 'Corrosion-resistant metal used in nuclear reactors and jewelry.' },
  { symbol: 'Nb', name: 'Niobium', number: 41, mass: 92.91, category: 'transition', period: 5, group: 5, electron: '[Kr] 4d⁴ 5s¹', electronegativity: 1.6, density: 8.57, meltingPoint: 2477, boilingPoint: 4744, discoveredBy: 'Charles Hatchett', year: 1801, description: 'Used in superconducting magnets and jet engines.' },
  { symbol: 'Mo', name: 'Molybdenum', number: 42, mass: 95.95, category: 'transition', period: 5, group: 6, electron: '[Kr] 4d⁵ 5s¹', electronegativity: 2.16, density: 10.22, meltingPoint: 2623, boilingPoint: 4639, discoveredBy: 'Carl Wilhelm Scheele', year: 1778, description: 'Essential for life. Used in steel alloys and catalysts.' },
  { symbol: 'Tc', name: 'Technetium', number: 43, mass: 98, category: 'transition', period: 5, group: 7, electron: '[Kr] 4d⁵ 5s²', electronegativity: 1.9, density: 11.5, meltingPoint: 2157, boilingPoint: 4265, discoveredBy: 'Emilio Segrè', year: 1937, description: 'First artificially produced element. Used in medical imaging.' },
  { symbol: 'Ru', name: 'Ruthenium', number: 44, mass: 101.07, category: 'transition', period: 5, group: 8, electron: '[Kr] 4d⁷ 5s¹', electronegativity: 2.2, density: 12.37, meltingPoint: 2334, boilingPoint: 4150, discoveredBy: 'Karl Ernst Claus', year: 1844, description: 'Platinum group metal used in electronics and catalysis.' },
  { symbol: 'Rh', name: 'Rhodium', number: 45, mass: 102.91, category: 'transition', period: 5, group: 9, electron: '[Kr] 4d⁸ 5s¹', electronegativity: 2.28, density: 12.41, meltingPoint: 1964, boilingPoint: 3695, discoveredBy: 'William Hyde Wollaston', year: 1803, description: 'Most expensive precious metal. Used in catalytic converters.' },
  { symbol: 'Pd', name: 'Palladium', number: 46, mass: 106.42, category: 'transition', period: 5, group: 10, electron: '[Kr] 4d¹⁰', electronegativity: 2.20, density: 12.02, meltingPoint: 1554.9, boilingPoint: 2963, discoveredBy: 'William Hyde Wollaston', year: 1803, description: 'Used in catalytic converters, jewelry, and hydrogen storage.' },
  { symbol: 'Ag', name: 'Silver', number: 47, mass: 107.87, category: 'transition', period: 5, group: 11, electron: '[Kr] 4d¹⁰ 5s¹', electronegativity: 1.93, density: 10.501, meltingPoint: 961.78, boilingPoint: 2162, discoveredBy: 'Ancient', year: null, description: 'Best conductor of electricity. Used in jewelry, electronics, and medicine.' },
  { symbol: 'Cd', name: 'Cadmium', number: 48, mass: 112.41, category: 'transition', period: 5, group: 12, electron: '[Kr] 4d¹⁰ 5s²', electronegativity: 1.69, density: 8.69, meltingPoint: 321.07, boilingPoint: 767, discoveredBy: 'Karl Samuel Leberecht Hermann', year: 1817, description: 'Toxic metal used in batteries and pigments.' },
  { symbol: 'In', name: 'Indium', number: 49, mass: 114.82, category: 'metal', period: 5, group: 13, electron: '[Kr] 4d¹⁰ 5s² 5p¹', electronegativity: 1.78, density: 7.31, meltingPoint: 156.6, boilingPoint: 2072, discoveredBy: 'Ferdinand Reich', year: 1863, description: 'Soft metal used in touchscreens and solders.' },
  { symbol: 'Sn', name: 'Tin', number: 50, mass: 118.71, category: 'metal', period: 5, group: 14, electron: '[Kr] 4d¹⁰ 5s² 5p²', electronegativity: 1.96, density: 7.287, meltingPoint: 231.93, boilingPoint: 2602, discoveredBy: 'Ancient', year: null, description: 'Used in bronze, solder, and tin cans.' },
  { symbol: 'Sb', name: 'Antimony', number: 51, mass: 121.76, category: 'metalloid', period: 5, group: 15, electron: '[Kr] 4d¹⁰ 5s² 5p³', electronegativity: 2.05, density: 6.685, meltingPoint: 630.63, boilingPoint: 1587, discoveredBy: 'Ancient', year: null, description: 'Metalloid used in flame retardants and lead-acid batteries.' },
  { symbol: 'Te', name: 'Tellurium', number: 52, mass: 127.60, category: 'metalloid', period: 5, group: 16, electron: '[Kr] 4d¹⁰ 5s² 5p⁴', electronegativity: 2.1, density: 6.232, meltingPoint: 449.51, boilingPoint: 988, discoveredBy: 'Franz-Joseph Müller von Reichenstein', year: 1783, description: 'Rare metalloid used in solar cells and thermoelectric devices.' },
  { symbol: 'I', name: 'Iodine', number: 53, mass: 126.90, category: 'halogen', period: 5, group: 17, electron: '[Kr] 4d¹⁰ 5s² 5p⁵', electronegativity: 2.66, density: 4.93, meltingPoint: 113.7, boilingPoint: 184.3, discoveredBy: 'Bernard Courtois', year: 1811, description: 'Purple-black solid. Essential for thyroid function.' },
  { symbol: 'Xe', name: 'Xenon', number: 54, mass: 131.29, category: 'noble', period: 5, group: 18, electron: '[Kr] 4d¹⁰ 5s² 5p⁶', electronegativity: 2.6, density: 0.005887, meltingPoint: -111.8, boilingPoint: -108.1, discoveredBy: 'William Ramsay', year: 1898, description: 'Noble gas used in flash lamps and anesthesia.' },
  // Period 6
  { symbol: 'Cs', name: 'Cesium', number: 55, mass: 132.91, category: 'alkali', period: 6, group: 1, electron: '[Xe] 6s¹', electronegativity: 0.79, density: 1.873, meltingPoint: 28.44, boilingPoint: 671, discoveredBy: 'Robert Bunsen', year: 1860, description: 'Most electropositive element. Used in atomic clocks.' },
  { symbol: 'Ba', name: 'Barium', number: 56, mass: 137.33, category: 'alkaline', period: 6, group: 2, electron: '[Xe] 6s²', electronegativity: 0.89, density: 3.594, meltingPoint: 727, boilingPoint: 1897, discoveredBy: 'Carl Wilhelm Scheele', year: 1774, description: 'Used in X-ray imaging and fireworks (green color).' },
  { symbol: 'La', name: 'Lanthanum', number: 57, mass: 138.91, category: 'lanthanide', period: 6, group: 3, electron: '[Xe] 5d¹ 6s²', electronegativity: 1.10, density: 6.145, meltingPoint: 920, boilingPoint: 3464, discoveredBy: 'Carl Gustaf Mosander', year: 1839, description: 'First of the lanthanides. Used in camera lenses and catalysts.' },
  { symbol: 'Ce', name: 'Cerium', number: 58, mass: 140.12, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹ 5d¹ 6s²', electronegativity: 1.12, density: 6.77, meltingPoint: 795, boilingPoint: 3443, discoveredBy: 'Jöns Jacob Berzelius', year: 1803, description: 'Most abundant rare earth. Used in catalytic converters.' },
  { symbol: 'Pr', name: 'Praseodymium', number: 59, mass: 140.91, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f³ 6s²', electronegativity: 1.13, density: 6.773, meltingPoint: 935, boilingPoint: 3520, discoveredBy: 'Carl Auer von Welsbach', year: 1885, description: 'Used in magnets and green glass for welding goggles.' },
  { symbol: 'Nd', name: 'Neodymium', number: 60, mass: 144.24, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁴ 6s²', electronegativity: 1.14, density: 7.007, meltingPoint: 1024, boilingPoint: 3074, discoveredBy: 'Carl Auer von Welsbach', year: 1885, description: 'Used in powerful permanent magnets and lasers.' },
  { symbol: 'Pm', name: 'Promethium', number: 61, mass: 145, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁵ 6s²', electronegativity: 1.13, density: 7.26, meltingPoint: 1042, boilingPoint: 3000, discoveredBy: 'Chien Shiung Wu', year: 1945, description: 'Only lanthanide without stable isotopes. Used in nuclear batteries.' },
  { symbol: 'Sm', name: 'Samarium', number: 62, mass: 150.36, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁶ 6s²', electronegativity: 1.17, density: 7.52, meltingPoint: 1072, boilingPoint: 1900, discoveredBy: 'Paul Emile Lecoq de Boisbaudran', year: 1879, description: 'Used in magnets and cancer treatment.' },
  { symbol: 'Eu', name: 'Europium', number: 63, mass: 151.96, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁷ 6s²', electronegativity: 1.2, density: 5.243, meltingPoint: 826, boilingPoint: 1529, discoveredBy: 'Eugène-Anatole Demarçay', year: 1901, description: 'Used in phosphors for TV screens and euro banknotes.' },
  { symbol: 'Gd', name: 'Gadolinium', number: 64, mass: 157.25, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁷ 5d¹ 6s²', electronegativity: 1.20, density: 7.895, meltingPoint: 1312, boilingPoint: 3273, discoveredBy: 'Jean Charles Galissard de Marignac', year: 1880, description: 'Used as MRI contrast agent and in nuclear reactors.' },
  { symbol: 'Tb', name: 'Terbium', number: 65, mass: 158.93, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁹ 6s²', electronegativity: 1.2, density: 8.229, meltingPoint: 1356, boilingPoint: 3230, discoveredBy: 'Carl Gustaf Mosander', year: 1843, description: 'Used in green phosphors and solid-state devices.' },
  { symbol: 'Dy', name: 'Dysprosium', number: 66, mass: 162.50, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹⁰ 6s²', electronegativity: 1.22, density: 8.55, meltingPoint: 1407, boilingPoint: 2567, discoveredBy: 'Paul Emile Lecoq de Boisbaudran', year: 1886, description: 'Has highest magnetic strength of any element.' },
  { symbol: 'Ho', name: 'Holmium', number: 67, mass: 164.93, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹¹ 6s²', electronegativity: 1.23, density: 8.795, meltingPoint: 1461, boilingPoint: 2720, discoveredBy: 'Marc Delafontaine', year: 1878, description: 'Used in nuclear reactors and lasers for medical procedures.' },
  { symbol: 'Er', name: 'Erbium', number: 68, mass: 167.26, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹² 6s²', electronegativity: 1.24, density: 9.066, meltingPoint: 1529, boilingPoint: 2868, discoveredBy: 'Carl Gustaf Mosander', year: 1843, description: 'Used in fiber optic amplifiers and pink glass.' },
  { symbol: 'Tm', name: 'Thulium', number: 69, mass: 168.93, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹³ 6s²', electronegativity: 1.25, density: 9.321, meltingPoint: 1545, boilingPoint: 1950, discoveredBy: 'Per Teodor Cleve', year: 1879, description: 'Rarest lanthanide. Used in portable X-ray devices.' },
  { symbol: 'Yb', name: 'Ytterbium', number: 70, mass: 173.05, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹⁴ 6s²', electronegativity: 1.1, density: 6.965, meltingPoint: 824, boilingPoint: 1196, discoveredBy: 'Jean Charles Galissard de Marignac', year: 1878, description: 'Used in metallurgy and laser applications.' },
  { symbol: 'Lu', name: 'Lutetium', number: 71, mass: 174.97, category: 'lanthanide', period: 6, group: 3, electron: '[Xe] 4f¹⁴ 5d¹ 6s²', electronegativity: 1.27, density: 9.84, meltingPoint: 1652, boilingPoint: 3402, discoveredBy: 'Georges Urbain', year: 1907, description: 'Last of the lanthanides. Used in PET scan detectors.' },
  { symbol: 'Hf', name: 'Hafnium', number: 72, mass: 178.49, category: 'transition', period: 6, group: 4, electron: '[Xe] 4f¹⁴ 5d² 6s²', electronegativity: 1.3, density: 13.31, meltingPoint: 2233, boilingPoint: 4603, discoveredBy: 'Dirk Coster', year: 1923, description: 'Used in nuclear reactor control rods and computer chips.' },
  { symbol: 'Ta', name: 'Tantalum', number: 73, mass: 180.95, category: 'transition', period: 6, group: 5, electron: '[Xe] 4f¹⁴ 5d³ 6s²', electronegativity: 1.5, density: 16.654, meltingPoint: 3017, boilingPoint: 5458, discoveredBy: 'Anders Ekeberg', year: 1802, description: 'Corrosion-resistant. Used in electronics and surgical implants.' },
  { symbol: 'W', name: 'Tungsten', number: 74, mass: 183.84, category: 'transition', period: 6, group: 6, electron: '[Xe] 4f¹⁴ 5d⁴ 6s²', electronegativity: 2.36, density: 19.25, meltingPoint: 3422, boilingPoint: 5555, discoveredBy: 'Fausto Elhuyar', year: 1783, description: 'Highest melting point of all elements. Used in light bulb filaments.' },
  { symbol: 'Re', name: 'Rhenium', number: 75, mass: 186.21, category: 'transition', period: 6, group: 7, electron: '[Xe] 4f¹⁴ 5d⁵ 6s²', electronegativity: 1.9, density: 21.02, meltingPoint: 3186, boilingPoint: 5596, discoveredBy: 'Masataka Ogawa', year: 1925, description: 'One of the rarest elements. Used in jet engine superalloys.' },
  { symbol: 'Os', name: 'Osmium', number: 76, mass: 190.23, category: 'transition', period: 6, group: 8, electron: '[Xe] 4f¹⁴ 5d⁶ 6s²', electronegativity: 2.2, density: 22.59, meltingPoint: 3033, boilingPoint: 5012, discoveredBy: 'Smithson Tennant', year: 1803, description: 'Densest naturally occurring element. Very hard and brittle.' },
  { symbol: 'Ir', name: 'Iridium', number: 77, mass: 192.22, category: 'transition', period: 6, group: 9, electron: '[Xe] 4f¹⁴ 5d⁷ 6s²', electronegativity: 2.20, density: 22.56, meltingPoint: 2446, boilingPoint: 4428, discoveredBy: 'Smithson Tennant', year: 1803, description: 'Most corrosion-resistant metal. Found in meteorites.' },
  { symbol: 'Pt', name: 'Platinum', number: 78, mass: 195.08, category: 'transition', period: 6, group: 10, electron: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronegativity: 2.28, density: 21.46, meltingPoint: 1768.3, boilingPoint: 3825, discoveredBy: 'Antonio de Ulloa', year: 1735, description: 'Precious metal used in jewelry, catalytic converters, and anticancer drugs.' },
  { symbol: 'Au', name: 'Gold', number: 79, mass: 196.97, category: 'transition', period: 6, group: 11, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54, density: 19.282, meltingPoint: 1064.18, boilingPoint: 2856, discoveredBy: 'Ancient', year: null, description: 'Precious metal prized throughout history. Excellent conductor.' },
  { symbol: 'Hg', name: 'Mercury', number: 80, mass: 200.59, category: 'transition', period: 6, group: 12, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronegativity: 2.00, density: 13.5336, meltingPoint: -38.83, boilingPoint: 356.73, discoveredBy: 'Ancient', year: null, description: 'Only metal liquid at room temperature. Toxic.' },
  { symbol: 'Tl', name: 'Thallium', number: 81, mass: 204.38, category: 'metal', period: 6, group: 13, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', electronegativity: 1.62, density: 11.85, meltingPoint: 304, boilingPoint: 1473, discoveredBy: 'William Crookes', year: 1861, description: 'Highly toxic soft metal formerly used as rat poison.' },
  { symbol: 'Pb', name: 'Lead', number: 82, mass: 207.2, category: 'metal', period: 6, group: 14, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronegativity: 2.33, density: 11.342, meltingPoint: 327.46, boilingPoint: 1749, discoveredBy: 'Ancient', year: null, description: 'Dense, soft, toxic metal. Used in batteries and radiation shielding.' },
  { symbol: 'Bi', name: 'Bismuth', number: 83, mass: 208.98, category: 'metal', period: 6, group: 15, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', electronegativity: 2.02, density: 9.807, meltingPoint: 271.4, boilingPoint: 1564, discoveredBy: 'Claude François Geoffroy', year: 1753, description: 'Most diamagnetic element. Used in medicines (Pepto-Bismol).' },
  { symbol: 'Po', name: 'Polonium', number: 84, mass: 209, category: 'metalloid', period: 6, group: 16, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', electronegativity: 2.0, density: 9.32, meltingPoint: 254, boilingPoint: 962, discoveredBy: 'Marie Curie', year: 1898, description: 'Highly radioactive and toxic. Discovered by Marie Curie.' },
  { symbol: 'At', name: 'Astatine', number: 85, mass: 210, category: 'halogen', period: 6, group: 17, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', electronegativity: 2.2, density: 7, meltingPoint: 302, boilingPoint: 337, discoveredBy: 'Dale Corson', year: 1940, description: 'Rarest naturally occurring element. Highly radioactive halogen.' },
  { symbol: 'Rn', name: 'Radon', number: 86, mass: 222, category: 'noble', period: 6, group: 18, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', electronegativity: 2.2, density: 0.00973, meltingPoint: -71, boilingPoint: -61.7, discoveredBy: 'Friedrich Ernst Dorn', year: 1900, description: 'Radioactive noble gas. Found in some buildings, health hazard.' },
  // Period 7
  { symbol: 'Fr', name: 'Francium', number: 87, mass: 223, category: 'alkali', period: 7, group: 1, electron: '[Rn] 7s¹', electronegativity: 0.7, density: 1.87, meltingPoint: 27, boilingPoint: 677, discoveredBy: 'Marguerite Perey', year: 1939, description: 'Most unstable naturally occurring element. Extremely rare.' },
  { symbol: 'Ra', name: 'Radium', number: 88, mass: 226, category: 'alkaline', period: 7, group: 2, electron: '[Rn] 7s²', electronegativity: 0.9, density: 5.5, meltingPoint: 700, boilingPoint: 1737, discoveredBy: 'Marie Curie', year: 1898, description: 'Highly radioactive. Formerly used in luminous paint.' },
  { symbol: 'Ac', name: 'Actinium', number: 89, mass: 227, category: 'actinide', period: 7, group: 3, electron: '[Rn] 6d¹ 7s²', electronegativity: 1.1, density: 10.07, meltingPoint: 1050, boilingPoint: 3200, discoveredBy: 'André-Louis Debierne', year: 1899, description: 'First of the actinides. Glows blue in the dark.' },
  { symbol: 'Th', name: 'Thorium', number: 90, mass: 232.04, category: 'actinide', period: 7, group: null, electron: '[Rn] 6d² 7s²', electronegativity: 1.3, density: 11.72, meltingPoint: 1750, boilingPoint: 4788, discoveredBy: 'Jöns Jacob Berzelius', year: 1829, description: 'Potential nuclear fuel. More abundant than uranium.' },
  { symbol: 'Pa', name: 'Protactinium', number: 91, mass: 231.04, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f² 6d¹ 7s²', electronegativity: 1.5, density: 15.37, meltingPoint: 1568, boilingPoint: 4027, discoveredBy: 'Kasimir Fajans', year: 1913, description: 'Rare and radioactive. Highly toxic.' },
  { symbol: 'U', name: 'Uranium', number: 92, mass: 238.03, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f³ 6d¹ 7s²', electronegativity: 1.38, density: 18.95, meltingPoint: 1135, boilingPoint: 4131, discoveredBy: 'Martin Heinrich Klaproth', year: 1789, description: 'Nuclear fuel and weapons. Naturally radioactive.' },
  { symbol: 'Np', name: 'Neptunium', number: 93, mass: 237, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f⁴ 6d¹ 7s²', electronegativity: 1.36, density: 20.45, meltingPoint: 644, boilingPoint: 3902, discoveredBy: 'Edwin McMillan', year: 1940, description: 'First transuranium element discovered.' },
  { symbol: 'Pu', name: 'Plutonium', number: 94, mass: 244, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f⁶ 7s²', electronegativity: 1.28, density: 19.84, meltingPoint: 640, boilingPoint: 3228, discoveredBy: 'Glenn Seaborg', year: 1940, description: 'Used in nuclear weapons and some spacecraft power sources.' },
  { symbol: 'Am', name: 'Americium', number: 95, mass: 243, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f⁷ 7s²', electronegativity: 1.3, density: 13.69, meltingPoint: 1176, boilingPoint: 2011, discoveredBy: 'Glenn Seaborg', year: 1944, description: 'Used in smoke detectors. Named after the Americas.' },
  { symbol: 'Cm', name: 'Curium', number: 96, mass: 247, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f⁷ 6d¹ 7s²', electronegativity: 1.3, density: 13.51, meltingPoint: 1340, boilingPoint: 3110, discoveredBy: 'Glenn Seaborg', year: 1944, description: 'Named after Marie and Pierre Curie. Used in space exploration.' },
  { symbol: 'Bk', name: 'Berkelium', number: 97, mass: 247, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f⁹ 7s²', electronegativity: 1.3, density: 14.79, meltingPoint: 986, boilingPoint: 2627, discoveredBy: 'Stanley Thompson', year: 1949, description: 'Named after Berkeley, California. Highly radioactive.' },
  { symbol: 'Cf', name: 'Californium', number: 98, mass: 251, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f¹⁰ 7s²', electronegativity: 1.3, density: 15.1, meltingPoint: 900, boilingPoint: 1470, discoveredBy: 'Stanley Thompson', year: 1950, description: 'Used in starting nuclear reactors and treating cancer.' },
  { symbol: 'Es', name: 'Einsteinium', number: 99, mass: 252, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f¹¹ 7s²', electronegativity: 1.3, density: 8.84, meltingPoint: 860, boilingPoint: 996, discoveredBy: 'Albert Ghiorso', year: 1952, description: 'Named after Albert Einstein. Discovered in nuclear fallout.' },
  { symbol: 'Fm', name: 'Fermium', number: 100, mass: 257, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f¹² 7s²', electronegativity: 1.3, density: 9.7, meltingPoint: 1527, boilingPoint: null, discoveredBy: 'Albert Ghiorso', year: 1952, description: 'Named after Enrico Fermi. Only produced in nuclear explosions.' },
  { symbol: 'Md', name: 'Mendelevium', number: 101, mass: 258, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f¹³ 7s²', electronegativity: 1.3, density: 10.3, meltingPoint: 827, boilingPoint: null, discoveredBy: 'Albert Ghiorso', year: 1955, description: 'Named after Dmitri Mendeleev, creator of the periodic table.' },
  { symbol: 'No', name: 'Nobelium', number: 102, mass: 259, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f¹⁴ 7s²', electronegativity: 1.3, density: 9.9, meltingPoint: 827, boilingPoint: null, discoveredBy: 'Joint Institute for Nuclear Research', year: 1957, description: 'Named after Alfred Nobel. Very short half-life.' },
  { symbol: 'Lr', name: 'Lawrencium', number: 103, mass: 262, category: 'actinide', period: 7, group: 3, electron: '[Rn] 5f¹⁴ 7s² 7p¹', electronegativity: 1.3, density: 15.6, meltingPoint: 1627, boilingPoint: null, discoveredBy: 'Albert Ghiorso', year: 1961, description: 'Last actinide element. Named after Ernest Lawrence.' },
  { symbol: 'Rf', name: 'Rutherfordium', number: 104, mass: 267, category: 'transition', period: 7, group: 4, electron: '[Rn] 5f¹⁴ 6d² 7s²', electronegativity: null, density: 23.2, meltingPoint: 2100, boilingPoint: 5500, discoveredBy: 'Joint Institute for Nuclear Research', year: 1964, description: 'Named after Ernest Rutherford. First transactinide element.' },
  { symbol: 'Db', name: 'Dubnium', number: 105, mass: 268, category: 'transition', period: 7, group: 5, electron: '[Rn] 5f¹⁴ 6d³ 7s²', electronegativity: null, density: 29.3, meltingPoint: null, boilingPoint: null, discoveredBy: 'Joint Institute for Nuclear Research', year: 1967, description: 'Named after Dubna, Russia. Highly radioactive.' },
  { symbol: 'Sg', name: 'Seaborgium', number: 106, mass: 269, category: 'transition', period: 7, group: 6, electron: '[Rn] 5f¹⁴ 6d⁴ 7s²', electronegativity: null, density: 35.0, meltingPoint: null, boilingPoint: null, discoveredBy: 'Albert Ghiorso', year: 1974, description: 'Named after Glenn Seaborg while he was still alive.' },
  { symbol: 'Bh', name: 'Bohrium', number: 107, mass: 270, category: 'transition', period: 7, group: 7, electron: '[Rn] 5f¹⁴ 6d⁵ 7s²', electronegativity: null, density: 37.1, meltingPoint: null, boilingPoint: null, discoveredBy: 'Peter Armbruster', year: 1981, description: 'Named after Niels Bohr. Very short half-life.' },
  { symbol: 'Hs', name: 'Hassium', number: 108, mass: 269, category: 'transition', period: 7, group: 8, electron: '[Rn] 5f¹⁴ 6d⁶ 7s²', electronegativity: null, density: 41, meltingPoint: null, boilingPoint: null, discoveredBy: 'Peter Armbruster', year: 1984, description: 'Named after Hesse, Germany. Predicted to be very dense.' },
  { symbol: 'Mt', name: 'Meitnerium', number: 109, mass: 278, category: 'transition', period: 7, group: 9, electron: '[Rn] 5f¹⁴ 6d⁷ 7s²', electronegativity: null, density: 37.4, meltingPoint: null, boilingPoint: null, discoveredBy: 'Peter Armbruster', year: 1982, description: 'Named after Lise Meitner. Extremely radioactive.' },
  { symbol: 'Ds', name: 'Darmstadtium', number: 110, mass: 281, category: 'transition', period: 7, group: 10, electron: '[Rn] 5f¹⁴ 6d⁸ 7s²', electronegativity: null, density: 34.8, meltingPoint: null, boilingPoint: null, discoveredBy: 'Peter Armbruster', year: 1994, description: 'Named after Darmstadt, Germany. Only atoms produced.' },
  { symbol: 'Rg', name: 'Roentgenium', number: 111, mass: 282, category: 'transition', period: 7, group: 11, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s¹', electronegativity: null, density: 28.7, meltingPoint: null, boilingPoint: null, discoveredBy: 'Peter Armbruster', year: 1994, description: 'Named after Wilhelm Röntgen, discoverer of X-rays.' },
  { symbol: 'Cn', name: 'Copernicium', number: 112, mass: 285, category: 'transition', period: 7, group: 12, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', electronegativity: null, density: 23.7, meltingPoint: null, boilingPoint: null, discoveredBy: 'Sigurd Hofmann', year: 1996, description: 'Named after Nicolaus Copernicus. May behave like a noble gas.' },
  { symbol: 'Nh', name: 'Nihonium', number: 113, mass: 286, category: 'metal', period: 7, group: 13, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', electronegativity: null, density: 16, meltingPoint: 430, boilingPoint: 1100, discoveredBy: 'Riken', year: 2003, description: 'Named after Japan (Nihon). First element discovered in Asia.' },
  { symbol: 'Fl', name: 'Flerovium', number: 114, mass: 289, category: 'metal', period: 7, group: 14, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', electronegativity: null, density: 14, meltingPoint: null, boilingPoint: null, discoveredBy: 'Joint Institute for Nuclear Research', year: 1998, description: 'Named after Flerov Laboratory. May be a noble gas.' },
  { symbol: 'Mc', name: 'Moscovium', number: 115, mass: 290, category: 'metal', period: 7, group: 15, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', electronegativity: null, density: 13.5, meltingPoint: 400, boilingPoint: 1100, discoveredBy: 'Joint Institute for Nuclear Research', year: 2003, description: 'Named after Moscow region. Highly radioactive.' },
  { symbol: 'Lv', name: 'Livermorium', number: 116, mass: 293, category: 'metal', period: 7, group: 16, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', electronegativity: null, density: 12.9, meltingPoint: null, boilingPoint: null, discoveredBy: 'Joint Institute for Nuclear Research', year: 2000, description: 'Named after Lawrence Livermore National Laboratory.' },
  { symbol: 'Ts', name: 'Tennessine', number: 117, mass: 294, category: 'halogen', period: 7, group: 17, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', electronegativity: null, density: 7.2, meltingPoint: 350, boilingPoint: 550, discoveredBy: 'Joint Institute for Nuclear Research', year: 2010, description: 'Named after Tennessee. Predicted to be a metalloid or metal.' },
  { symbol: 'Og', name: 'Oganesson', number: 118, mass: 294, category: 'noble', period: 7, group: 18, electron: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', electronegativity: null, density: 5, meltingPoint: null, boilingPoint: null, discoveredBy: 'Joint Institute for Nuclear Research', year: 2002, description: 'Named after Yuri Oganessian. Heaviest known element.' },
];

const categoryColors = {
  nonmetal: '#a8e6cf',
  noble: '#dda0dd',
  alkali: '#ffb3ba',
  alkaline: '#ffd700',
  metalloid: '#b4a7d6',
  metal: '#87ceeb',
  halogen: '#98d8c8',
  transition: '#f0e68c',
  lanthanide: '#ffb347',
  actinide: '#ff6961'
};

// Vyonn Chemistry AI Icon
function VyonnChemistryIcon({ size = 40 }) {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      badgeContent={
        <Box
          sx={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(76,175,80,0.4)'
          }}
        >
          <ScienceIcon sx={{ fontSize: size * 0.3, color: 'white' }} />
        </Box>
      }
    >
      <Box
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src="/vyonn.png"
          alt="Vyonn"
          sx={{
            width: size * 0.85,
            height: size * 0.85,
            filter: 'brightness(0) invert(1) brightness(1.8)',
            objectFit: 'contain'
          }}
        />
      </Box>
    </Badge>
  );
}

function ChemistryTools({ open, onClose, user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [moleculeName, setMoleculeName] = useState('caffeine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [currentCID, setCurrentCID] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showLabels, setShowLabels] = useState(true); // v10.1.2: Toggle for atom labels
  
  // AI Chat State
  const [question, setQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  
  // Experiments State
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('foundational');

  // Get user info
  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  const commonMolecules = [
    { name: 'Water', cid: '962' },
    { name: 'Caffeine', cid: '2519' },
    { name: 'Aspirin', cid: '2244' },
    { name: 'Ethanol', cid: '702' },
    { name: 'Glucose', cid: '5793' },
    { name: 'Benzene', cid: '241' },
    { name: 'Methane', cid: '297' },
    { name: 'Ammonia', cid: '222' },
  ];

  // Find matching diagram
  const findMatchingDiagram = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, keywords] of Object.entries(CHEMISTRY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          return { key, ...CHEMISTRY_DIAGRAMS[key] };
        }
      }
    }
    return null;
  }, []);

  // Ask Chemistry AI - Now handles all questions intelligently
  const askChemistryAI = async () => {
    if (!question.trim()) return;
    
    setAiLoading(true);
    const userQuestion = question;
    setQuestion('');
    setChatHistory(prev => [{ role: 'user', content: userQuestion, timestamp: Date.now() }, ...prev]);
    
    const matchedDiagram = findMatchingDiagram(userQuestion);
    
    try {
      // v10.3: Detect language and respond in same language
      const hasDevanagari = /[\u0900-\u097F]/.test(userQuestion);
      const hasTelugu = /[\u0C00-\u0C7F]/.test(userQuestion);
      const hasTamil = /[\u0B80-\u0BFF]/.test(userQuestion);
      const hasKannada = /[\u0C80-\u0CFF]/.test(userQuestion);
      const hasMalayalam = /[\u0D00-\u0D7F]/.test(userQuestion);
      
      const isRegional = hasDevanagari || hasTelugu || hasTamil || hasKannada || hasMalayalam;
      const lang = hasTelugu ? 'Telugu (తెలుగు)' : 
                   hasDevanagari ? 'Hindi (हिंदी)' :
                   hasTamil ? 'Tamil (தமிழ்)' :
                   hasKannada ? 'Kannada (ಕನ್ನಡ)' :
                   hasMalayalam ? 'Malayalam (മലയാളം)' : 'English';
      
      const prompt = `You are Vyonn AI Chemistry, a brilliant and friendly chemistry tutor embedded in the Ekamanam learning app.

${isRegional ? `🚨 IMPORTANT: Student asked in ${lang}. You MUST respond in ${lang}!` : ''}

Student asked: "${userQuestion}"

${matchedDiagram ? `Topic: "${matchedDiagram.title}" - I'm showing a detailed diagram.` : ''}

**IMPORTANT INSTRUCTIONS:**
1. First, determine if this question is related to chemistry (including but not limited to: elements, compounds, molecules, atoms, bonds, reactions, acids, bases, pH, ions, electrons, protons, neutrons, periodic table, chemical equations, organic chemistry, inorganic chemistry, solutions, moles, molarity, formulas, oxidation, reduction, redox, catalysts, polymers, hydrocarbons, functional groups, lab techniques, valency, valence, combining capacity, balancing equations, stoichiometry, thermodynamics, electrochemistry, etc.)

2. If the question IS chemistry-related:
   ${isRegional ? `- Write ENTIRE response in ${lang} using proper Unicode` : '- Provide a comprehensive, educational chemistry response (200-300 words)'}
   - Include clear explanations of chemistry concepts ${isRegional ? `(in ${lang})` : ''}
   - Show key chemical principles involved ${isRegional ? `(explained in ${lang})` : ''}
   - Include important formulas or equations (use proper chemical notation like H₂O, CO₂, NaCl)
   - Mention real-world applications if relevant ${isRegional ? `(in ${lang})` : ''}
   - Be engaging and encouraging! ${isRegional ? `(in ${lang})` : ''}
   ${matchedDiagram ? '- I am showing them a detailed labeled diagram.' : ''}

3. If the question is NOT chemistry-related:
   ${isRegional ? `- (${lang}లో వ్రాయండి) Start with: "🔬 That's outside my chemistry expertise!"` : '- Start with: "🔬 That\'s a great question, but it\'s outside my chemistry expertise!"'}
   - Briefly explain that you specialize in chemistry topics ${isRegional ? `(in ${lang})` : ''}
   - Give 2-3 examples of chemistry questions you can help with ${isRegional ? `(in ${lang})` : ''}
   ${isRegional ? `- Suggest using Vyonn AI for other subjects (${lang}లో)` : '- End with: "💡 **Tip:** For questions on other subjects like history, geography, physics, math, or general knowledge, try using **Vyonn AI** in the Tools section - it can help with a much broader range of topics!"'}
   - Keep this response friendly and helpful (not dismissive) ${isRegional ? `(in ${lang})` : ''}

${isRegional ? `Write your ENTIRE response in ${lang} using proper Unicode! Chemical formulas can use standard notation.` : 'Use bullet points where appropriate. Be warm, encouraging, and supportive!'}`;

      const response = await callLLM(prompt, { feature: 'general', temperature: 0.7, maxTokens: 2048 });  // V3.2: Increased for detailed chemistry explanations
      
      setChatHistory(prev => [{
        role: 'assistant',
        content: response || "Let me show you this chemistry concept!",
        diagram: matchedDiagram,
        timestamp: Date.now()
      }, ...prev]);
      
      if (matchedDiagram) {
        setCurrentDiagram(matchedDiagram);
      }
      
    } catch (error) {
      setChatHistory(prev => [{
        role: 'assistant',
        content: matchedDiagram 
          ? `Here's a detailed diagram of ${matchedDiagram.title}! This shows the key components and processes involved.`
          : "Let me help you understand this chemistry concept!",
        diagram: matchedDiagram,
        timestamp: Date.now()
      }, ...prev]);
      if (matchedDiagram) setCurrentDiagram(matchedDiagram);
    } finally {
      setAiLoading(false);
    }
  };

  const loadMolecule = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const searchRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/IUPACName/JSON`
      );
      if (!searchRes.ok) throw new Error('Molecule not found');
      const searchData = await searchRes.json();
      const cid = searchData.PropertyTable.Properties[0].CID;
      setCurrentCID(cid);
      setViewerKey(prev => prev + 1);
    } catch (err) {
      setError(err.message);
      setCurrentCID(null);
    } finally {
      setLoading(false);
    }
  };

  // v10.1.2: Added showLabels parameter to toggle atom labels
  const get3DmolHTML = (cid, labelsEnabled) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body{margin:0;padding:0;overflow:hidden}
    #viewer{width:100%;height:calc(100% - 40px);position:absolute;top:0}
    #legend{position:absolute;bottom:0;left:0;right:0;height:40px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;gap:12px;font-family:Arial,sans-serif;font-size:11px;border-top:1px solid #ddd;flex-wrap:wrap;padding:4px 8px}
    .legend-item{display:flex;align-items:center;gap:4px}
    .legend-dot{width:12px;height:12px;border-radius:50%;border:1px solid #999}
  </style>
  <script src="https://3dmol.org/build/3Dmol-min.js"></script>
</head>
<body>
  <div id="viewer"></div>
  <div id="legend">
    <span class="legend-item"><span class="legend-dot" style="background:#909090"></span>C</span>
    <span class="legend-item"><span class="legend-dot" style="background:#FFFFFF"></span>H</span>
    <span class="legend-item"><span class="legend-dot" style="background:#FF0D0D"></span>O</span>
    <span class="legend-item"><span class="legend-dot" style="background:#3050F8"></span>N</span>
    <span class="legend-item"><span class="legend-dot" style="background:#FFFF30"></span>S</span>
    <span class="legend-item"><span class="legend-dot" style="background:#FF8000"></span>P</span>
    <span class="legend-item"><span class="legend-dot" style="background:#1FF01F"></span>Cl</span>
    <span class="legend-item"><span class="legend-dot" style="background:#A62929"></span>Br</span>
    <span class="legend-item"><span class="legend-dot" style="background:#B31FBA"></span>F</span>
  </div>
  <script>
    const showLabels = ${labelsEnabled};
    fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d')
      .then(r=>r.text())
      .then(data=>{
        let v=$3Dmol.createViewer('viewer',{backgroundColor:'white'});
        let m=v.addModel(data,'sdf');
        v.setStyle({},{stick:{radius:0.15},sphere:{scale:0.3,colorscheme:'Jmol'}});
        // Add atom labels for non-hydrogen atoms if enabled
        if(showLabels){
          let atoms=m.selectedAtoms({});
          atoms.forEach(function(atom){
            if(atom.elem!=='H'){
              v.addLabel(atom.elem,{
                position:{x:atom.x,y:atom.y,z:atom.z},
                fontSize:10,
                fontColor:'#333',
                backgroundColor:'rgba(255,255,255,0.7)',
                borderRadius:3,
                padding:1
              });
            }
          });
        }
        v.zoomTo();v.render();v.spin(true);
      })
      .catch(()=>{document.getElementById('viewer').innerHTML='<div style="padding:20px;color:#666;">3D structure not available</div>';});
  </script>
</body>
</html>`;

  const renderElement = (num) => {
    const el = allElements.find(e => e.number === num);
    if (!el) return <Box key={num} />;
    
    return (
      <Tooltip key={el.symbol} title={`${el.name} (${el.number})`} arrow>
        <Paper
          elevation={1}
          onClick={() => setSelectedElement(el)}
          sx={{
            p: 0.5,
            textAlign: 'center',
            bgcolor: categoryColors[el.category],
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: 0,
            '&:hover': { transform: 'scale(1.1)', zIndex: 10, boxShadow: 3 }
          }}
        >
          <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary' }}>{el.number}</Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1 }}>{el.symbol}</Typography>
        </Paper>
      </Tooltip>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
        color: 'white',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VyonnChemistryIcon size={36} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Vyonn Chemistry Lab</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>Experiments · Molecules · Periodic Table · AI Tutor</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fdf8' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => { setActiveTab(v); setSelectedElement(null); setSelectedExperiment(null); }}
          sx={{ '& .MuiTab-root': { fontWeight: 600, minWidth: 'auto', px: 2 } }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Box sx={{ display: 'flex', alignItems: 'center' }}><VyonnChemistryIcon size={18} /></Box>} label="Ask Vyonn AI" iconPosition="start" />
          <Tab icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Experiments" iconPosition="start" />
          <Tab icon={<ScienceIcon sx={{ fontSize: 18 }} />} label="3D Molecules" iconPosition="start" />
          <Tab label="🧪 Periodic Table" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#fafafa' }}>
        {/* Ask Vyonn AI Tab */}
        {activeTab === 0 && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Input Section - At Top */}
            <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
              <TextField
                fullWidth
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && askChemistryAI()}
                placeholder="Ask about chemistry... (e.g., 'Explain ionic bonding', 'What is pH scale?')"
                variant="outlined"
                disabled={aiLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#f5f5f5',
                    '&.Mui-focused': { bgcolor: 'white' }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScienceIcon sx={{ color: '#4caf50' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={askChemistryAI} disabled={aiLoading || !question.trim()} color="primary">
                        {aiLoading ? <CircularProgress size={20} /> : <SendIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Suggested Questions */}
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {CHEMISTRY_QUESTIONS.map((q, i) => (
                  <Chip
                    key={i}
                    label={q}
                    size="small"
                    onClick={() => { setQuestion(q); }}
                    sx={{ 
                      cursor: 'pointer',
                      bgcolor: '#e8f5e9',
                      '&:hover': { bgcolor: '#c8e6c9' }
                    }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Chat History */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {chatHistory.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <VyonnChemistryIcon size={64} />
                  <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Welcome to Vyonn AI Chemistry Lab! 🧪
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask me anything about chemistry - elements, bonds, reactions, acids, bases, organic chemistry, and more!
                  </Typography>
                </Box>
              )}
              
              {chatHistory.map((msg, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  {msg.role === 'user' ? (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, maxWidth: '80%' }}>
                        <Typography variant="body2">{msg.content}</Typography>
                      </Paper>
                      <Avatar src={userPhoto} sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                        {userName[0]}
                      </Avatar>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ mt: 0.5 }}>
                        <VyonnChemistryIcon size={32} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ whiteSpace: 'pre-wrap' }}
                            dangerouslySetInnerHTML={{ 
                              __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                            }}
                          />
                        </Paper>
                        
                        {/* Diagram Display */}
                        {msg.diagram && (
                          <Paper sx={{ mt: 2, p: 2, bgcolor: 'white', border: '2px solid #4caf50', borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              📊 {msg.diagram.title}
                            </Typography>
                            <Box 
                              sx={{ 
                                maxWidth: 450, 
                                mx: 'auto',
                                '& svg': { width: '100%', height: 'auto' }
                              }}
                              dangerouslySetInnerHTML={{ __html: msg.diagram.svg }}
                            />
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {msg.diagram.labels.map((label, i) => (
                                <Chip key={i} label={label} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Experiments Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {!selectedExperiment ? (
              // Experiment Categories
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" /> Chemistry Experiments & Interactive Learning
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Explore interactive experiments organized by difficulty level
                </Typography>
                
                {Object.entries(EXPERIMENTS).map(([key, category]) => (
                  <Accordion 
                    key={key}
                    expanded={expandedCategory === key}
                    onChange={() => setExpandedCategory(expandedCategory === key ? '' : key)}
                    sx={{ mb: 1, borderLeft: `4px solid ${category.color}` }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography fontSize="1.5rem">{category.icon}</Typography>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{category.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{category.subtitle}</Typography>
                        </Box>
                        <Chip 
                          label={`${category.experiments.length} experiments`} 
                          size="small" 
                          sx={{ ml: 'auto', bgcolor: category.color + '20', color: category.color }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1.5}>
                        {category.experiments.map((exp) => (
                          <Grid item xs={12} sm={6} md={4} key={exp.id}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  boxShadow: 3, 
                                  borderColor: category.color,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                              onClick={() => setSelectedExperiment(exp)}
                            >
                              <CardContent sx={{ pb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  {exp.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {exp.description}
                                </Typography>
                              </CardContent>
                              <CardActions sx={{ pt: 0 }}>
                                <Chip 
                                  label={exp.difficulty} 
                                  size="small"
                                  color={exp.difficulty === 'Beginner' ? 'success' : exp.difficulty === 'Intermediate' ? 'primary' : 'secondary'}
                                  variant="outlined"
                                />
                                {exp.interactive && (
                                  <Chip 
                                    icon={<PlayIcon sx={{ fontSize: 14 }} />}
                                    label="Interactive" 
                                    size="small"
                                    sx={{ ml: 'auto' }}
                                  />
                                )}
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              // Selected Experiment View
              <Box>
                <Button 
                  startIcon={<BackIcon />} 
                  onClick={() => setSelectedExperiment(null)}
                  sx={{ mb: 2 }}
                >
                  Back to Experiments
                </Button>
                
                <Paper sx={{ p: 2.5, mb: 2, bgcolor: '#f8fdf8' }}>
                  <Typography variant="h5" gutterBottom fontWeight={600}>
                    {selectedExperiment.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedExperiment.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={selectedExperiment.difficulty} 
                      size="small"
                      color={selectedExperiment.difficulty === 'Beginner' ? 'success' : selectedExperiment.difficulty === 'Intermediate' ? 'primary' : 'secondary'}
                    />
                  </Box>
                </Paper>
                
                {/* Render the experiment component */}
                {experimentComponents[selectedExperiment.component] && 
                  React.createElement(experimentComponents[selectedExperiment.component])}
              </Box>
            )}
          </Box>
        )}

        {/* 3D Molecule Viewer */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField 
                fullWidth 
                value={moleculeName} 
                onChange={(e) => setMoleculeName(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && loadMolecule(moleculeName)} 
                placeholder="Enter molecule name" 
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
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {commonMolecules.map((m) => (
                  <Chip 
                    key={m.cid} 
                    label={m.name} 
                    size="small" 
                    onClick={() => { setMoleculeName(m.name); setCurrentCID(m.cid); setViewerKey(prev => prev + 1); }} 
                    sx={{ cursor: 'pointer' }} 
                  />
                ))}
              </Box>
              {/* v10.1.2: Toggle for element labels */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={showLabels} 
                    onChange={(e) => { setShowLabels(e.target.checked); setViewerKey(prev => prev + 1); }}
                    size="small"
                    color="success"
                  />
                }
                label={<Typography variant="caption">Show Labels</Typography>}
                sx={{ ml: 1 }}
              />
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper elevation={3} sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
              {currentCID ? (
                <iframe 
                  key={`${viewerKey}-${showLabels}`} 
                  srcDoc={get3DmolHTML(currentCID, showLabels)} 
                  title="3D Molecule" 
                  style={{ width: '100%', height: 400, border: 'none' }} 
                  sandbox="allow-scripts" 
                />
              ) : (
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: 'text.secondary' }}>
                  {loading ? <CircularProgress /> : <><ScienceIcon sx={{ fontSize: 48, opacity: 0.5 }} /><Typography>Search for a molecule</Typography></>}
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Periodic Table - Full 118 Elements */}
        {activeTab === 3 && !selectedElement && (
          <Box sx={{ p: 2, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Click on any element to see detailed properties • All 118 elements
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(categoryColors).map(([cat, color]) => (
                <Chip key={cat} label={cat} size="small" sx={{ bgcolor: color, textTransform: 'capitalize', fontSize: '0.65rem' }} />
              ))}
            </Box>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(18, minmax(30px, 1fr))', 
              gap: '2px', 
              fontSize: '0.6rem',
              minWidth: 600
            }}>
              {/* Period 1 */}
              {renderElement(1)}
              {Array(16).fill(null).map((_, i) => <Box key={`p1-${i}`} />)}
              {renderElement(2)}
              
              {/* Period 2 */}
              {renderElement(3)}
              {renderElement(4)}
              {Array(10).fill(null).map((_, i) => <Box key={`p2-${i}`} />)}
              {[5, 6, 7, 8, 9, 10].map(n => renderElement(n))}
              
              {/* Period 3 */}
              {renderElement(11)}
              {renderElement(12)}
              {Array(10).fill(null).map((_, i) => <Box key={`p3-${i}`} />)}
              {[13, 14, 15, 16, 17, 18].map(n => renderElement(n))}
              
              {/* Period 4 */}
              {Array.from({ length: 18 }, (_, i) => renderElement(19 + i))}
              
              {/* Period 5 */}
              {Array.from({ length: 18 }, (_, i) => renderElement(37 + i))}
              
              {/* Period 6 - main group with lanthanide placeholder */}
              {renderElement(55)}
              {renderElement(56)}
              <Tooltip title="Lanthanides (57-71)" arrow>
                <Paper sx={{ p: 0.3, textAlign: 'center', bgcolor: '#ffb347', cursor: 'pointer', fontSize: '0.5rem' }}>
                  <Typography sx={{ fontSize: '0.5rem', fontWeight: 600 }}>57-71</Typography>
                </Paper>
              </Tooltip>
              {Array.from({ length: 15 }, (_, i) => renderElement(72 + i))}
              
              {/* Period 7 - main group with actinide placeholder */}
              {renderElement(87)}
              {renderElement(88)}
              <Tooltip title="Actinides (89-103)" arrow>
                <Paper sx={{ p: 0.3, textAlign: 'center', bgcolor: '#ff6961', cursor: 'pointer', fontSize: '0.5rem' }}>
                  <Typography sx={{ fontSize: '0.5rem', fontWeight: 600 }}>89-103</Typography>
                </Paper>
              </Tooltip>
              {Array.from({ length: 15 }, (_, i) => renderElement(104 + i))}
              
              {/* Spacer */}
              <Box sx={{ gridColumn: 'span 18', height: 8 }} />
              
              {/* Lanthanides */}
              <Box sx={{ gridColumn: 'span 2' }} />
              <Typography sx={{ fontSize: '0.5rem', display: 'flex', alignItems: 'center', color: '#e65100' }}>La:</Typography>
              {Array.from({ length: 15 }, (_, i) => renderElement(57 + i))}
              
              {/* Actinides */}
              <Box sx={{ gridColumn: 'span 2' }} />
              <Typography sx={{ fontSize: '0.5rem', display: 'flex', alignItems: 'center', color: '#c62828' }}>Ac:</Typography>
              {Array.from({ length: 15 }, (_, i) => renderElement(89 + i))}
            </Box>
            
            <Alert severity="success" sx={{ mt: 2 }}>
              ✅ Complete Periodic Table with all 118 elements. Click any element for detailed properties including electron configuration, density, melting/boiling points, and discovery history.
            </Alert>
          </Box>
        )}

        {/* Element Detail View */}
        {activeTab === 3 && selectedElement && (
          <Box sx={{ p: 2 }}>
            <Button startIcon={<BackIcon />} onClick={() => setSelectedElement(null)} sx={{ mb: 2 }}>Back to Table</Button>
            <Paper elevation={3} sx={{ p: 3, bgcolor: categoryColors[selectedElement.category] + '40', borderLeft: `6px solid ${categoryColors[selectedElement.category]}` }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                <Paper elevation={2} sx={{ p: 3, textAlign: 'center', minWidth: 150, bgcolor: categoryColors[selectedElement.category] }}>
                  <Typography variant="caption" color="text.secondary">{selectedElement.number}</Typography>
                  <Typography variant="h2" fontWeight={700}>{selectedElement.symbol}</Typography>
                  <Typography variant="h6">{selectedElement.name}</Typography>
                  <Typography variant="body2">{selectedElement.mass} u</Typography>
                </Paper>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Typography variant="h5" gutterBottom fontWeight={700}>{selectedElement.name}</Typography>
                  <Typography variant="body1" paragraph>{selectedElement.description}</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Category', value: selectedElement.category },
                      { label: 'Period', value: selectedElement.period },
                      { label: 'Group', value: selectedElement.group || 'N/A' },
                      { label: 'Electron Config', value: selectedElement.electron },
                      { label: 'Electronegativity', value: selectedElement.electronegativity || 'N/A' },
                      { label: 'Density', value: `${selectedElement.density} g/cm³` },
                      { label: 'Melting Point', value: `${selectedElement.meltingPoint}°C` },
                      { label: 'Boiling Point', value: `${selectedElement.boilingPoint}°C` },
                      { label: 'Discovered By', value: selectedElement.discoveredBy },
                      { label: 'Year Discovered', value: selectedElement.year || 'Ancient' }
                    ].map((prop, i) => (
                      <Grid item xs={6} sm={4} key={i}>
                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{prop.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{prop.value}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChemistryTools;
