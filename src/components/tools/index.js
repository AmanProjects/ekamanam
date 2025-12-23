/**
 * Educational Tools - Index
 * Central export for all educational tool components
 * v10.5.6: Added VyonnAI
 */

export { default as VyonnAI } from './VyonnAI';
export { default as MathTools } from './MathLabV2';
export { default as ChemistryTools } from './ChemistryTools';
export { default as PhysicsSimulator } from './PhysicsSimulator';
export { default as CodeEditor } from './CodeEditor';
export { default as GlobeViewer } from './GlobeViewer';

// Tool metadata for UI
export const toolsList = [
  {
    id: 'math',
    name: 'Vyonn Math Lab',
    description: 'AI Tutor · Experiments · Visualizations',
    icon: '🧮',
    color: '#1976d2',
    component: 'MathTools'
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    description: '3D Molecules · Periodic Table',
    icon: '🧪',
    color: '#4caf50',
    component: 'ChemistryTools'
  },
  {
    id: 'physics',
    name: 'Physics Lab',
    description: 'Gravity · Collisions · Forces',
    icon: '⚡',
    color: '#6c5ce7',
    component: 'PhysicsSimulator'
  },
  {
    id: 'code',
    name: 'Code Editor',
    description: 'JS · Python · Java · HTML',
    icon: '💻',
    color: '#2d3436',
    component: 'CodeEditor'
  },
  {
    id: 'globe',
    name: 'Globe Explorer',
    description: '3D Earth · Geography',
    icon: '🌍',
    color: '#0984e3',
    component: 'GlobeViewer'
  },
  {
    id: 'circuit',
    name: 'Circuit Builder',
    description: 'Logic Gates · Digital',
    icon: '🔌',
    color: '#00b894',
    component: 'CircuitBuilder'
  },
  {
    id: 'simulator',
    name: 'Circuit Simulator',
    description: 'Falstad · Interactive',
    icon: '⚡',
    color: '#fdcb6e',
    component: 'CircuitSimulator'
  }
];

