import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceInputButton from '../VoiceInputButton';
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
  Chip,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Divider,
  Avatar,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as ResetIcon,
  Send as SendIcon,
  Science as ScienceIcon,
  Calculate as FormulaIcon,
  Speed as SpeedIcon,
  Public as GravityIcon,
  Image as DiagramIcon,
  SmartToy as VyonnIcon,
  Bolt as PhysicsIcon
} from '@mui/icons-material';
import Matter from 'matter-js';
import { callLLM } from '../../services/llmService';
import { markdownToHtml } from '../../utils/markdownRenderer';  // v10.4.18: Proper markdown rendering

/**
 * Vyonn AI Science Lab - v7.2.35
 * AI-powered diagrams + physics simulations
 */

// Physics experiments database
const PHYSICS_EXPERIMENTS = {
  projectile: { name: 'Projectile Motion', category: 'Mechanics', description: 'Motion of objects launched at an angle', formulas: ['R = (v₀² sin2θ)/g'], concepts: ['Parabolic trajectory'], keywords: ['projectile', 'throw', 'launch', 'cannon', 'motion', 'parabolic', 'trajectory'], color: '#ef4444' },
  freefall: { name: 'Free Fall', category: 'Mechanics', description: 'Objects falling under gravity', formulas: ['s = ½gt²'], concepts: ['Constant acceleration'], keywords: ['fall', 'drop', 'gravity', 'freefall', 'motion', 'acceleration'], color: '#f59e0b' },
  pendulum: { name: 'Simple Pendulum', category: 'Oscillations', description: 'Simple harmonic motion', formulas: ['T = 2π√(L/g)'], concepts: ['Period depends on length'], keywords: ['pendulum', 'swing', 'oscillation', 'motion', 'harmonic'], color: '#8b5cf6' },
  spring: { name: 'Spring Oscillation', category: 'Oscillations', description: "Hooke's Law", formulas: ['F = -kx'], concepts: ['Elastic potential energy'], keywords: ['spring', 'hooke', 'elastic', 'motion', 'oscillation'], color: '#10b981' },
  collision: { name: 'Elastic Collision', category: 'Momentum', description: 'Conservation of momentum', formulas: ['m₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\''], concepts: ['Momentum conservation'], keywords: ['collision', 'momentum', 'billiard', 'motion'], color: '#06b6d4' },
  inclinedPlane: { name: 'Inclined Plane', category: 'Mechanics', description: 'Motion on a slope', formulas: ['a = g sinθ'], concepts: ['Component of gravity'], keywords: ['incline', 'slope', 'ramp', 'friction', 'motion'], color: '#f97316' },
  newtonCradle: { name: "Newton's Cradle", category: 'Momentum', description: 'Momentum transfer', formulas: ['p = mv'], concepts: ['Energy conservation'], keywords: ['newton cradle', 'cradle'], color: '#eab308' },
  pulley: { name: 'Pulley System', category: 'Mechanics', description: 'Atwood machine', formulas: ['a = (m₁-m₂)g/(m₁+m₂)'], concepts: ['Tension'], keywords: ['pulley', 'atwood', 'rope'], color: '#6366f1' },
  lever: { name: 'Lever & Torque', category: 'Rotational', description: 'Mechanical advantage', formulas: ['τ = r × F'], concepts: ['Torque', 'Fulcrum'], keywords: ['lever', 'torque', 'seesaw'], color: '#ec4899' },
  buoyancy: { name: 'Buoyancy', category: 'Fluids', description: "Archimedes' principle", formulas: ['F_b = ρVg'], concepts: ['Density comparison'], keywords: ['float', 'sink', 'buoyancy', 'archimedes'], color: '#0ea5e9' },
  stack: { name: 'Stacking Blocks', category: 'Statics', description: 'Center of mass', formulas: ['x_cm = Σm_ix_i/Σm_i'], concepts: ['Equilibrium'], keywords: ['stack', 'tower', 'block'], color: '#84cc16' },
  bridge: { name: 'Rope Bridge', category: 'Statics', description: 'Tension in structures', formulas: ['T = W/(2sinθ)'], concepts: ['Load bearing'], keywords: ['bridge', 'rope', 'tension'], color: '#a855f7' }
};

// Diagram templates
const DIAGRAM_TEMPLATES = {
  blastFurnace: {
    title: 'Blast Furnace',
    type: 'process',
    svg: `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="furnaceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4a4a4a"/>
          <stop offset="50%" style="stop-color:#6a6a6a"/>
          <stop offset="100%" style="stop-color:#4a4a4a"/>
        </linearGradient>
        <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#ff4500"/>
          <stop offset="50%" style="stop-color:#ff8c00"/>
          <stop offset="100%" style="stop-color:#ffd700"/>
        </linearGradient>
      </defs>
      <path d="M100,50 L80,150 L60,400 L340,400 L320,150 L300,50 Z" fill="url(#furnaceGrad)" stroke="#333" stroke-width="3"/>
      <ellipse cx="200" cy="350" rx="100" ry="30" fill="url(#fireGrad)" opacity="0.8"/>
      <ellipse cx="200" cy="300" rx="80" ry="25" fill="#ff6b35" opacity="0.6"/>
      <ellipse cx="200" cy="50" rx="100" ry="20" fill="#333" stroke="#222" stroke-width="2"/>
      <g transform="translate(200,20)">
        <polygon points="0,0 -10,-15 10,-15" fill="#8b4513"/>
        <text x="0" y="-25" text-anchor="middle" font-size="11" fill="#333" font-weight="bold">Iron Ore + Coke + Limestone</text>
      </g>
      <g transform="translate(50,300)">
        <rect x="-40" y="-10" width="40" height="20" fill="#64748b" rx="3"/>
        <polygon points="0,-8 15,0 0,8" fill="#ef4444"/>
        <text x="-60" y="5" text-anchor="end" font-size="10" fill="#333">Hot Air (1000°C)</text>
      </g>
      <g transform="translate(350,300)">
        <rect x="0" y="-10" width="40" height="20" fill="#64748b" rx="3"/>
        <polygon points="0,-8 -15,0 0,8" fill="#ef4444"/>
        <text x="60" y="5" text-anchor="start" font-size="10" fill="#333">Hot Air</text>
      </g>
      <text x="200" y="100" text-anchor="middle" font-size="10" fill="#fff">← Reduction Zone</text>
      <text x="200" y="180" text-anchor="middle" font-size="10" fill="#fff">← Fusion Zone</text>
      <text x="200" y="280" text-anchor="middle" font-size="10" fill="#ffd700">← Combustion Zone</text>
      <g transform="translate(320,380)">
        <rect x="0" y="-8" width="60" height="16" fill="#64748b" rx="3"/>
        <text x="70" y="5" font-size="10" fill="#333">Slag</text>
      </g>
      <g transform="translate(320,420)">
        <rect x="0" y="-8" width="60" height="16" fill="#d97706" rx="3"/>
        <text x="70" y="5" font-size="10" fill="#333" font-weight="bold">Molten Iron</text>
      </g>
      <g transform="translate(200,10)">
        <path d="M-20,-20 Q-25,-40 -15,-50 M0,-20 Q5,-45 -5,-55 M20,-20 Q25,-40 15,-50" stroke="#94a3b8" stroke-width="2" fill="none"/>
        <text x="0" y="-60" text-anchor="middle" font-size="9" fill="#666">Waste Gas (CO, CO₂)</text>
      </g>
      <g transform="translate(30,150)">
        <rect x="0" y="0" width="15" height="200" fill="url(#fireGrad)" rx="3"/>
        <text x="20" y="10" font-size="8" fill="#333">400°C</text>
        <text x="20" y="100" font-size="8" fill="#333">1000°C</text>
        <text x="20" y="190" font-size="8" fill="#333">2000°C</text>
      </g>
      <g transform="translate(200,460)">
        <text x="0" y="0" text-anchor="middle" font-size="9" fill="#1976d2" font-weight="bold">Key Reactions:</text>
        <text x="0" y="15" text-anchor="middle" font-size="8" fill="#333">C + O₂ → CO₂ | Fe₂O₃ + 3CO → 2Fe + 3CO₂</text>
      </g>
    </svg>`,
    labels: ['Iron Ore + Coke + Limestone input', 'Hot air blast at 1000°C', 'Reduction, Fusion, Combustion zones', 'Slag and Molten Iron output']
  },
  electricCircuit: {
    title: 'Simple Electric Circuit',
    type: 'diagram',
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#1976d2"/></marker></defs>
      <path d="M50,150 L50,50 L350,50 L350,150 L350,250 L50,250 L50,150" stroke="#333" stroke-width="3" fill="none"/>
      <g transform="translate(50,120)">
        <line x1="0" y1="0" x2="0" y2="60" stroke="#333" stroke-width="3"/>
        <line x1="-15" y1="15" x2="15" y2="15" stroke="#333" stroke-width="4"/>
        <line x1="-8" y1="25" x2="8" y2="25" stroke="#333" stroke-width="2"/>
        <line x1="-15" y1="35" x2="15" y2="35" stroke="#333" stroke-width="4"/>
        <line x1="-8" y1="45" x2="8" y2="45" stroke="#333" stroke-width="2"/>
        <text x="-35" y="35" font-size="12" fill="#333" font-weight="bold">Battery</text>
      </g>
      <g transform="translate(150,50)">
        <path d="M0,0 L10,0 L15,-10 L25,10 L35,-10 L45,10 L55,-10 L65,10 L70,0 L80,0" stroke="#333" stroke-width="2" fill="none"/>
        <text x="40" y="-20" text-anchor="middle" font-size="11" fill="#333" font-weight="bold">Resistor (R)</text>
      </g>
      <g transform="translate(350,120)">
        <circle cx="0" cy="30" r="25" stroke="#333" stroke-width="2" fill="#fef3c7"/>
        <path d="M-10,20 Q0,35 10,20" stroke="#f59e0b" stroke-width="2" fill="none"/>
        <line x1="0" y1="0" x2="0" y2="5" stroke="#333" stroke-width="3"/>
        <line x1="0" y1="55" x2="0" y2="60" stroke="#333" stroke-width="3"/>
        <text x="35" y="35" font-size="11" fill="#333" font-weight="bold">Bulb</text>
      </g>
      <g transform="translate(150,250)">
        <circle cx="0" cy="0" r="5" fill="#333"/>
        <circle cx="50" cy="0" r="5" fill="#333"/>
        <line x1="5" y1="-3" x2="45" y2="-15" stroke="#333" stroke-width="3"/>
        <text x="25" y="25" text-anchor="middle" font-size="11" fill="#333" font-weight="bold">Switch</text>
      </g>
      <path d="M100,50 L130,50" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)"/>
      <text x="115" y="40" font-size="10" fill="#1976d2" font-weight="bold">I (current)</text>
      <text x="200" y="280" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">V = IR (Ohm's Law) | P = VI</text>
    </svg>`,
    labels: ['Battery provides voltage', 'Resistor limits current', 'Bulb converts to light', 'Switch controls circuit']
  },
  lens: {
    title: 'Convex Lens Ray Diagram',
    type: 'optics',
    svg: `<svg viewBox="0 0 500 280" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444"/></marker></defs>
      <line x1="20" y1="140" x2="480" y2="140" stroke="#333" stroke-width="1" stroke-dasharray="5,5"/>
      <ellipse cx="250" cy="140" rx="15" ry="100" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="11" fill="#333" font-weight="bold">Convex Lens</text>
      <circle cx="150" cy="140" r="4" fill="#22c55e"/><text x="150" y="160" text-anchor="middle" font-size="10" fill="#22c55e" font-weight="bold">F</text>
      <circle cx="350" cy="140" r="4" fill="#22c55e"/><text x="350" y="160" text-anchor="middle" font-size="10" fill="#22c55e" font-weight="bold">F'</text>
      <line x1="80" y1="140" x2="80" y2="70" stroke="#8b5cf6" stroke-width="3"/>
      <polygon points="80,70 75,80 85,80" fill="#8b5cf6"/>
      <text x="80" y="60" text-anchor="middle" font-size="10" fill="#8b5cf6" font-weight="bold">Object</text>
      <line x1="80" y1="70" x2="250" y2="70" stroke="#ef4444" stroke-width="2"/>
      <line x1="250" y1="70" x2="400" y2="190" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="80" y1="70" x2="400" y2="190" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="400" y1="140" x2="400" y2="190" stroke="#1976d2" stroke-width="3"/>
      <polygon points="400,190 395,180 405,180" fill="#1976d2"/>
      <text x="400" y="210" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">Image (real, inverted)</text>
    </svg>`,
    labels: ['Object beyond 2F', 'Three principal rays', 'Real, inverted image']
  },
  atomStructure: {
    title: 'Atomic Structure (Bohr Model)',
    type: 'atomic',
    svg: `<svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="180" r="30" fill="#ef4444"/>
      <text x="200" y="185" text-anchor="middle" font-size="10" fill="white" font-weight="bold">Nucleus</text>
      <circle cx="200" cy="180" r="70" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,3"/>
      <circle cx="200" cy="180" r="110" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,3"/>
      <circle cx="200" cy="180" r="150" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,3"/>
      <text x="200" y="105" text-anchor="middle" font-size="9" fill="#666">K shell (n=1)</text>
      <text x="200" y="65" text-anchor="middle" font-size="9" fill="#666">L shell (n=2)</text>
      <text x="200" y="25" text-anchor="middle" font-size="9" fill="#666">M shell (n=3)</text>
      <circle cx="270" cy="180" r="8" fill="#3b82f6"/><circle cx="130" cy="180" r="8" fill="#3b82f6"/>
      <circle cx="200" cy="70" r="8" fill="#3b82f6"/><circle cx="285" cy="95" r="8" fill="#3b82f6"/>
      <circle cx="115" cy="265" r="8" fill="#3b82f6"/><circle cx="285" cy="265" r="8" fill="#3b82f6"/>
      <circle cx="50" cy="180" r="8" fill="#3b82f6"/><circle cx="350" cy="180" r="8" fill="#3b82f6"/>
      <g transform="translate(100,350)"><circle cx="10" cy="0" r="6" fill="#ef4444"/><text x="25" y="4" font-size="9" fill="#333">Proton (+)</text>
      <circle cx="100" cy="0" r="6" fill="#64748b"/><text x="115" y="4" font-size="9" fill="#333">Neutron</text>
      <circle cx="180" cy="0" r="6" fill="#3b82f6"/><text x="195" y="4" font-size="9" fill="#333">Electron (−)</text></g>
      <text x="200" y="370" text-anchor="middle" font-size="9" fill="#1976d2" font-weight="bold">Max electrons: K=2, L=8, M=18</text>
    </svg>`,
    labels: ['Nucleus with protons/neutrons', 'Electron shells K, L, M', 'Max electrons: 2n²']
  },
  humanHeart: {
    title: 'Human Heart Structure',
    type: 'biology',
    svg: `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,350 C100,290 40,200 60,130 C80,60 140,40 200,80 C260,40 320,60 340,130 C360,200 300,290 200,350" fill="#fecaca" stroke="#dc2626" stroke-width="3"/>
      <path d="M120,160 L120,260 L180,260 L180,160 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
      <path d="M220,160 L220,260 L280,260 L280,160 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      <path d="M120,110 Q150,80 180,110 L180,150 L120,150 Z" fill="#fca5a5" stroke="#b91c1c" stroke-width="2"/>
      <path d="M220,110 Q250,80 280,110 L280,150 L220,150 Z" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/>
      <text x="150" y="135" text-anchor="middle" font-size="8" fill="#7f1d1d" font-weight="bold">Right Atrium</text>
      <text x="250" y="135" text-anchor="middle" font-size="8" fill="#1e3a8a" font-weight="bold">Left Atrium</text>
      <text x="150" y="215" text-anchor="middle" font-size="8" fill="#7f1d1d" font-weight="bold">Right Ventricle</text>
      <text x="250" y="215" text-anchor="middle" font-size="8" fill="#1e3a8a" font-weight="bold">Left Ventricle</text>
      <line x1="200" y1="110" x2="200" y2="280" stroke="#333" stroke-width="4"/>
      <text x="200" y="300" text-anchor="middle" font-size="8" fill="#333">Septum</text>
      <g transform="translate(100,370)"><rect x="0" y="0" width="12" height="8" fill="#ef4444"/><text x="18" y="7" font-size="8" fill="#333">Deoxygenated</text>
      <rect x="110" y="0" width="12" height="8" fill="#3b82f6"/><text x="128" y="7" font-size="8" fill="#333">Oxygenated</text></g>
    </svg>`,
    labels: ['4 chambers: 2 atria, 2 ventricles', 'Right: deoxygenated, Left: oxygenated', 'Septum separates sides']
  },
  waveTypes: {
    title: 'Types of Waves',
    type: 'waves',
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="25" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Transverse Wave</text>
      <line x1="30" y1="80" x2="370" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>
      <path d="M30,80 Q60,30 90,80 Q120,130 150,80 Q180,30 210,80 Q240,130 270,80 Q300,30 330,80 Q360,130 370,80" fill="none" stroke="#3b82f6" stroke-width="3"/>
      <text x="380" y="50" font-size="8" fill="#666">Vibration ⊥</text>
      <text x="200" y="155" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Longitudinal Wave</text>
      <line x1="30" y1="200" x2="370" y2="200" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>
      <g transform="translate(30,200)">${Array.from({length:26},(_, i) => {const x=i*13;const c=(i>=3&&i<=7)||(i>=15&&i<=19);return `<line x1="${x}" y1="-20" x2="${x}" y2="20" stroke="${c?'#8b5cf6':'#c4b5fd'}" stroke-width="${c?3:2}"/>`;}).join('')}</g>
      <text x="90" y="175" font-size="8" fill="#8b5cf6" font-weight="bold">Compression</text>
      <text x="180" y="175" font-size="8" fill="#a78bfa">Rarefaction</text>
      <text x="380" y="180" font-size="8" fill="#666">Vibration ∥</text>
      <text x="200" y="270" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">v = fλ (Wave speed = Frequency × Wavelength)</text>
    </svg>`,
    labels: ['Transverse: vibration perpendicular', 'Longitudinal: vibration parallel', 'Examples: light (T), sound (L)']
  },
  transformer: {
    title: 'Electrical Transformer',
    type: 'electromagnetism',
    svg: `<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
      <rect x="100" y="50" width="200" height="25" fill="#64748b" rx="3"/>
      <rect x="100" y="205" width="200" height="25" fill="#64748b" rx="3"/>
      <rect x="100" y="50" width="25" height="180" fill="#64748b"/>
      <rect x="275" y="50" width="25" height="180" fill="#64748b"/>
      <text x="200" y="140" text-anchor="middle" font-size="10" fill="#64748b" font-weight="bold">Iron Core</text>
      <g transform="translate(112,75)">${[0,1,2,3,4,5,6].map(i=>`<ellipse cx="0" cy="${i*17}" rx="22" ry="7" fill="none" stroke="#ef4444" stroke-width="3"/>`).join('')}</g>
      <text x="55" y="140" text-anchor="middle" font-size="9" fill="#ef4444" font-weight="bold">Primary</text>
      <g transform="translate(288,90)">${[0,1,2,3,4].map(i=>`<ellipse cx="0" cy="${i*20}" rx="22" ry="7" fill="none" stroke="#3b82f6" stroke-width="3"/>`).join('')}</g>
      <text x="345" y="140" text-anchor="middle" font-size="9" fill="#3b82f6" font-weight="bold">Secondary</text>
      <line x1="30" y1="85" x2="90" y2="85" stroke="#ef4444" stroke-width="2"/>
      <line x1="30" y1="195" x2="90" y2="195" stroke="#ef4444" stroke-width="2"/>
      <text x="20" y="145" font-size="9" fill="#333">AC In</text>
      <line x1="310" y1="100" x2="370" y2="100" stroke="#3b82f6" stroke-width="2"/>
      <line x1="310" y1="180" x2="370" y2="180" stroke="#3b82f6" stroke-width="2"/>
      <text x="385" y="145" font-size="9" fill="#333">Out</text>
      <text x="200" y="260" text-anchor="middle" font-size="10" fill="#1976d2" font-weight="bold">Vs/Vp = Ns/Np</text>
    </svg>`,
    labels: ['Primary coil receives AC', 'Iron core transfers flux', 'Voltage ratio = Turns ratio']
  }
};

// Keywords to match diagrams
const DIAGRAM_KEYWORDS = {
  blastFurnace: ['blast furnace', 'iron extraction', 'smelting', 'pig iron', 'metallurgy'],
  electricCircuit: ['circuit', 'battery', 'resistor', 'ohm', 'current', 'voltage', 'electric'],
  lens: ['lens', 'convex', 'concave', 'ray diagram', 'optics', 'focal', 'refraction'],
  transformer: ['transformer', 'step up', 'step down', 'induction', 'electromagnetic', 'coil'],
  atomStructure: ['atom', 'bohr', 'electron', 'proton', 'neutron', 'shell', 'orbital', 'atomic structure'],
  humanHeart: ['heart', 'cardiac', 'atrium', 'ventricle', 'blood', 'circulation'],
  waveTypes: ['wave', 'transverse', 'longitudinal', 'wavelength', 'amplitude', 'frequency']
};

// Suggested questions
const SUGGESTED_QUESTIONS = [
  "Draw a blast furnace",
  "Show convex lens diagram",
  "Explain transformer",
  "Draw atomic structure",
  "Show wave types",
  "Demonstrate pendulum",
  "Show elastic collision"
];

// Vyonn Science AI Icon component
function VyonnScienceIcon({ size = 40 }) {
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
            background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(25,118,210,0.4)'
          }}
        >
          <SpeedIcon sx={{ fontSize: size * 0.3, color: 'white' }} />
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

function PhysicsSimulator({ open, onClose, user, vyonnContext, fullScreen = false }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  
  const [isRunning, setIsRunning] = useState(true);
  const [gravity, setGravity] = useState(1);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // AI Chat
  const [question, setQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Handle context from Hub Chat
  useEffect(() => {
    if (vyonnContext && open && vyonnContext.question) {
      console.log('🎯 Physics: Received context from Hub Chat:', vyonnContext.question);
      
      // Set question and process it automatically
      setQuestion(vyonnContext.question);
      setActiveTab(0); // Stay on Ask Vyonn AI tab
      
      // Auto-submit the question after a brief delay to ensure state is set
      setTimeout(() => {
        console.log('🚀 Physics: Auto-submitting question from Hub Chat');
        // Manually trigger the AI call with the context question
        askPhysicsAIWithQuestion(vyonnContext.question);
      }, 300);
    }
  }, [vyonnContext, open]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Helper function to ask AI with a specific question (for auto-submit)
  const askPhysicsAIWithQuestion = async (userQuestion) => {
    if (!userQuestion || !userQuestion.trim()) return;
    
    setAiLoading(true);
    setQuestion(''); // Clear input
    setChatHistory(prev => [{ 
      role: 'user', 
      content: userQuestion, 
      timestamp: Date.now() 
    }, ...prev]);
    
    // Add welcome message if from Hub Chat
    if (vyonnContext) {
      setChatHistory(prev => [{
        role: 'assistant',
        content: `👋 Welcome from Hub Chat! I see you're interested in: "${userQuestion}"\n\nLet me analyze this and create an interactive visualization for you!`,
        timestamp: Date.now()
      }, ...prev]);
    }
    
    const matchedDiagram = findMatchingDiagram(userQuestion);
    const matchedExp = matchedDiagram ? null : findMatchingExperiment(userQuestion);
    
    // ✨ AUTO-ACTIVATE SIMULATION when matched
    if (matchedExp) {
      console.log('🎯 Physics: Matched experiment:', matchedExp.name);
      setCurrentExperiment(matchedExp);
      setCurrentDiagram(null);
      console.log('⏱️ Physics: Switching to Visualize tab in 1.5 seconds...');
      setTimeout(() => {
        console.log('🎬 Physics: Switching to Visualize tab NOW!');
        setActiveTab(1);
      }, 1500);
    } else if (matchedDiagram) {
      console.log('📊 Physics: Matched diagram:', matchedDiagram.title);
      setCurrentDiagram(matchedDiagram);
      setCurrentExperiment(null);
      console.log('⏱️ Physics: Switching to Visualize tab in 1.5 seconds...');
      setTimeout(() => {
        console.log('🎬 Physics: Switching to Visualize tab NOW!');
        setActiveTab(1);
      }, 1500);
    } else {
      console.log('ℹ️ Physics: No simulation or diagram matched for this question');
    }
    
    // Continue with the rest of askPhysicsAI logic...
    try {
      const topicContext = matchedDiagram 
        ? `Topic: "${matchedDiagram.title}" - I'm showing a detailed diagram.`
        : matchedExp 
          ? `Topic: "${matchedExp.name}" - I'm generating an INTERACTIVE SIMULATION for this.`
          : '';
          
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
      
      const prompt = `You are Vyonn AI, a brilliant physics tutor.

${isRegional ? `🚨 IMPORTANT: Respond in ${lang}!` : ''}

Student asked: "${userQuestion}"

${topicContext}

${matchedExp ? `🎯 I am generating an INTERACTIVE SIMULATION for "${matchedExp.name}"!

Instructions:
1. Start: "🎮 I've created an interactive simulation for you!"
2. Explain the concept in 100-120 words (keep it concise!)
3. End: "⚡ The simulation is loading! You can adjust parameters and observe changes in real-time."` : 
matchedDiagram ? `📊 I am showing a diagram for "${matchedDiagram.title}". Explain key components (150-200 words).` : 
`Provide a concise physics explanation (150-200 words).`}

${isRegional ? `Write in ${lang}!` : 'Use bullet points. Be clear and engaging.'}

Cover ${isRegional ? `(in ${lang})` : ''}:
1. Core concept
2. ${matchedExp ? 'How to use simulation' : 'Key principles'}
3. Important formulas (v₀, θ, g notation)
4. ${matchedExp ? 'What to observe' : 'Real-world example'}`;

      console.log('🧪 Physics: Calling LLM with prompt length:', prompt.length);
      const response = await callLLM(prompt, { feature: 'general', temperature: 0.7, maxTokens: 4096 });  // Increased from 2048 to handle longer responses
      console.log('🧪 Physics: Received response:', response ? `${response.length} chars` : 'null/undefined');
      
      if (!response || response.trim().length === 0) {
        console.error('❌ Physics: Empty or null response from LLM');
        throw new Error('Empty response from AI');
      }
      
      console.log('✅ Physics: Valid response received');
      
      setChatHistory(prev => [{ 
        role: 'assistant', 
        content: response,
        experiment: matchedExp,
        diagram: matchedDiagram,
        timestamp: Date.now()
      }, ...prev]);
      
    } catch (error) {
      console.error('❌ Physics error:', error);
      
      let errorMessage = "I apologize, but I encountered an error. ";
      
      if (error.message && error.message.includes('API key')) {
        errorMessage += "Please make sure you have configured your API keys in Settings. ";
      } else if (error.message && error.message.includes('Empty response')) {
        errorMessage += "The AI returned an empty response. Please try rephrasing your question or check your API configuration in Settings. ";
      } else if (error.message && (error.message.includes('truncated') || error.message.includes('too long') || error.message.includes('maxOutputTokens'))) {
        errorMessage += "The response was too long. I'll try again with a more concise explanation. ";
        // Don't add simulation text - let it fail gracefully
      } else {
        errorMessage += "Please try again or check your API configuration in Settings. ";
      }
      
      if (matchedExp) {
        errorMessage += `\n\n🎮 However, I've loaded the "${matchedExp.name}" simulation for you! The interactive visualization will help you understand the concept. Try adjusting the parameters!`;
      } else if (matchedDiagram) {
        errorMessage += `\n\n📊 However, I've loaded a diagram of "${matchedDiagram.title}" that shows the key components visually.`;
      }
      
      setChatHistory(prev => [{ 
        role: 'assistant', 
        content: errorMessage,
        experiment: matchedExp,
        diagram: matchedDiagram,
        timestamp: Date.now()
      }, ...prev]);
    } finally {
      setAiLoading(false);
    }
  };

  // Get user display name
  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  // Find matching diagram
  const findMatchingDiagram = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, keywords] of Object.entries(DIAGRAM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          return { key, ...DIAGRAM_TEMPLATES[key] };
        }
      }
    }
    return null;
  }, []);

  // Match question to experiment
  const findMatchingExperiment = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, exp] of Object.entries(PHYSICS_EXPERIMENTS)) {
      let score = 0;
      for (const keyword of exp.keywords) {
        if (lowerQuery.includes(keyword)) {
          // Give extra points for longer, more specific keywords
          score += keyword.length * (keyword.length > 5 ? 2 : 1);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { key, ...exp };
      }
    }
    
    // Only return match if we have a reasonable score (at least one keyword matched)
    if (bestMatch && bestScore >= 4) {
      console.log(`🎯 Matched experiment: ${bestMatch.name} (score: ${bestScore})`);
      return bestMatch;
    }
    
    console.log('ℹ️ No simulation matched for this question');
    return null;
  }, []);

  // Ask AI
  const askPhysicsAI = async () => {
    if (!question.trim()) return;
    await askPhysicsAIWithQuestion(question);
  };

  // Initialize Matter.js
  useEffect(() => {
    if (!open || !canvasRef.current || activeTab !== 1 || currentDiagram) return;

    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Constraint, Body } = Matter;

    const engine = Engine.create();
    engine.world.gravity.y = gravity;
    engineRef.current = engine;

    const containerWidth = canvasRef.current.clientWidth || 700;
    const containerHeight = 350;

    const render = Render.create({
      element: canvasRef.current,
      engine: engine,
      options: { width: containerWidth, height: containerHeight, wireframes: false, background: '#1e293b', showVelocity: true }
    });
    renderRef.current = render;

    const runner = Runner.create();
    runnerRef.current = runner;

    const ground = Bodies.rectangle(containerWidth/2, containerHeight + 10, containerWidth + 100, 40, { isStatic: true, render: { fillStyle: '#334155' }});
    const leftWall = Bodies.rectangle(-20, containerHeight/2, 40, containerHeight + 100, { isStatic: true, render: { fillStyle: '#334155' }});
    const rightWall = Bodies.rectangle(containerWidth + 20, containerHeight/2, 40, containerHeight + 100, { isStatic: true, render: { fillStyle: '#334155' }});

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    const expKey = currentExperiment?.key || 'freefall';
    setupExperiment(expKey, engine, containerWidth, containerHeight, Bodies, Composite, Constraint, Body, Matter);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false }}});
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);
    Runner.run(runner, engine);
    setIsRunning(true);

    return () => {
      try {
        Render.stop(render);
        Runner.stop(runner);
        Composite.clear(engine.world);
        Engine.clear(engine);
        if (render.canvas) {
          const ctx = render.canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);
        }
        render.textures = {};
      } catch (e) { /* cleanup */ }
    };
  }, [open, currentExperiment, activeTab, gravity, currentDiagram]);

  // Setup experiments (condensed)
  const setupExperiment = (expKey, engine, width, height, Bodies, Composite, Constraint, Body, Matter) => {
    const cx = width / 2;
    const expColor = currentExperiment?.color || '#6366f1';
    
    switch(expKey) {
      case 'projectile':
        Composite.add(engine.world, [Bodies.rectangle(80, height - 80, 60, 20, { isStatic: true, angle: -Math.PI/4, render: { fillStyle: '#64748b' }}), (() => { const b = Bodies.circle(100, height - 100, 15, { restitution: 0.3, render: { fillStyle: expColor }}); Body.setVelocity(b, { x: 12, y: -12 }); return b; })(), Bodies.rectangle(width - 100, height - 30, 10, 60, { isStatic: true, render: { fillStyle: '#22c55e' }})]);
        break;
      case 'freefall':
        for (let i = 0; i < 5; i++) Composite.add(engine.world, Bodies.circle(150 + i * 100, 50 + Math.random() * 50, 15 + Math.random() * 25, { render: { fillStyle: `hsl(${i * 60 + 200}, 70%, 55%)` }}));
        break;
      case 'pendulum':
        const pBall = Bodies.circle(cx + 150, 200, 35, { render: { fillStyle: expColor }});
        Composite.add(engine.world, [Bodies.circle(cx, 40, 8, { isStatic: true, render: { fillStyle: '#f1f5f9' }}), pBall, Constraint.create({ pointA: { x: cx, y: 40 }, bodyB: pBall, length: 180, stiffness: 1, render: { strokeStyle: '#94a3b8', lineWidth: 3 }})]);
        break;
      case 'spring':
        const sMass = Bodies.rectangle(cx, 180, 60, 60, { render: { fillStyle: expColor }});
        Composite.add(engine.world, [Bodies.rectangle(cx, 25, 100, 20, { isStatic: true, render: { fillStyle: '#475569' }}), sMass, Constraint.create({ pointA: { x: cx, y: 35 }, bodyB: sMass, stiffness: 0.01, damping: 0.05, render: { strokeStyle: '#22c55e', lineWidth: 4 }})]);
        break;
      case 'collision':
        const c1 = Bodies.circle(100, height - 60, 35, { restitution: 1, friction: 0, render: { fillStyle: '#06b6d4' }});
        const c2 = Bodies.circle(width - 100, height - 60, 35, { restitution: 1, friction: 0, render: { fillStyle: '#f43f5e' }});
        Body.setVelocity(c1, { x: 8, y: 0 }); Body.setVelocity(c2, { x: -8, y: 0 });
        Composite.add(engine.world, [c1, c2]);
        break;
      case 'inclinedPlane':
        Composite.add(engine.world, [Bodies.rectangle(cx, height - 100, 400, 20, { isStatic: true, angle: Math.PI / 6, render: { fillStyle: '#64748b' }}), Bodies.rectangle(cx - 100, height - 200, 50, 50, { friction: 0.3, render: { fillStyle: expColor }})]);
        break;
      case 'newtonCradle':
        const cBalls = [];
        for (let i = 0; i < 5; i++) {
          const x = cx - 80 + i * 40;
          const b = Bodies.circle(x, 180, 20, { restitution: 1, friction: 0, frictionAir: 0, render: { fillStyle: expColor }});
          cBalls.push(b, Constraint.create({ pointA: { x, y: 40 }, bodyB: b, length: 140, stiffness: 1, render: { strokeStyle: '#94a3b8', lineWidth: 2 }}));
        }
        Body.setPosition(cBalls[0], { x: cx - 180, y: 100 });
        Composite.add(engine.world, cBalls);
        break;
      case 'pulley':
        const m1 = Bodies.rectangle(cx - 80, 180, 50, 50, { render: { fillStyle: '#f43f5e' }});
        const m2 = Bodies.rectangle(cx + 80, 130, 40, 40, { render: { fillStyle: '#3b82f6' }});
        Composite.add(engine.world, [Bodies.circle(cx, 70, 30, { isStatic: true, render: { fillStyle: '#64748b' }}), m1, m2, Constraint.create({ pointA: { x: cx - 30, y: 70 }, bodyB: m1, length: 110, stiffness: 1, render: { strokeStyle: '#94a3b8', lineWidth: 2 }}), Constraint.create({ pointA: { x: cx + 30, y: 70 }, bodyB: m2, length: 60, stiffness: 1, render: { strokeStyle: '#94a3b8', lineWidth: 2 }})]);
        break;
      case 'lever':
        const lBar = Bodies.rectangle(cx, height - 100, 350, 15, { render: { fillStyle: '#475569' }});
        Composite.add(engine.world, [Bodies.polygon(cx, height - 60, 3, 40, { isStatic: true, render: { fillStyle: '#64748b' }}), lBar, Constraint.create({ pointA: { x: cx, y: height - 80 }, bodyB: lBar, length: 0, stiffness: 0.9 }), Bodies.rectangle(cx - 140, height - 150, 40, 40, { render: { fillStyle: '#f43f5e' }}), Bodies.rectangle(cx + 100, height - 150, 25, 25, { render: { fillStyle: '#3b82f6' }})]);
        break;
      case 'buoyancy':
        Composite.add(engine.world, [Bodies.rectangle(cx, height - 90, width - 100, 160, { isStatic: true, isSensor: true, render: { fillStyle: 'rgba(14, 165, 233, 0.4)' }}), Bodies.circle(cx - 100, 80, 25, { density: 0.0001, render: { fillStyle: '#fbbf24' }}), Bodies.circle(cx + 100, 80, 25, { density: 0.01, render: { fillStyle: '#64748b' }})]);
        break;
      case 'stack':
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5 - i; j++) Composite.add(engine.world, Bodies.rectangle(cx - 80 + j * 45 + i * 22.5, height - 40 - i * 45, 40, 40, { render: { fillStyle: `hsl(${i * 35 + j * 25 + 200}, 65%, 55%)` }}));
        break;
      case 'bridge':
        const bGroup = Body.nextGroup(true);
        const bLinks = Array.from({length: 10}, (_, i) => Bodies.rectangle(120 + i * 50, height/2, 45, 12, { collisionFilter: { group: bGroup }, render: { fillStyle: '#78716c' }}));
        const bChain = Matter.Composites.chain(Matter.Composite.create({ bodies: bLinks }), 0.5, 0, -0.5, 0, { stiffness: 0.9, length: 5, render: { visible: false }});
        Composite.add(engine.world, [bChain, Bodies.rectangle(cx, height/2 - 50, 30, 30, { render: { fillStyle: expColor }}), Constraint.create({ pointA: { x: 100, y: height/2 }, bodyB: bLinks[0], pointB: { x: -22, y: 0 }, stiffness: 0.9 }), Constraint.create({ pointA: { x: width - 100, y: height/2 }, bodyB: bLinks[9], pointB: { x: 22, y: 0 }, stiffness: 0.9 })]);
        break;
      default:
        for (let i = 0; i < 5; i++) Composite.add(engine.world, Bodies.circle(100 + i * 120, 80, 25, { restitution: 0.6, render: { fillStyle: `hsl(${i * 55 + 200}, 65%, 55%)` }}));
    }
  };

  const toggleSimulation = () => {
    if (runnerRef.current && engineRef.current) {
      if (isRunning) Matter.Runner.stop(runnerRef.current);
      else Matter.Runner.run(runnerRef.current, engineRef.current);
      setIsRunning(!isRunning);
    }
  };

  const resetSimulation = () => {
    const current = currentExperiment;
    setCurrentExperiment(null);
    setTimeout(() => setCurrentExperiment(current), 10);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={fullScreen ? false : "md"} fullWidth fullScreen={fullScreen} PaperProps={{ sx: { height: fullScreen ? '100%' : '92vh', borderRadius: fullScreen ? 0 : 3 } }}>
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)', color: 'white', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VyonnScienceIcon size={44} />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Vyonn Science Lab</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Diagrams + Simulations</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth" sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
          <Tab icon={<VyonnScienceIcon size={18} />} label="Ask Vyonn AI" iconPosition="start" />
          <Tab icon={<DiagramIcon sx={{ fontSize: 20 }} />} label="Visualize" iconPosition="start" />
          <Tab icon={<FormulaIcon sx={{ fontSize: 20 }} />} label="Experiments" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tab 0: Ask Vyonn AI */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Input at TOP - prominent */}
            <Paper elevation={2} sx={{ p: 2, m: 2, mb: 0, borderRadius: 2, bgcolor: 'white', border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mb: 1, display: 'block' }}>
                ASK VYONN AI SCIENCE
              </Typography>
              <TextField
                fullWidth
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !aiLoading && askPhysicsAI()}
                placeholder="Ask: Draw a blast furnace, explain lenses, show pendulum..."
                disabled={aiLoading}
                size="small"
                autoFocus
                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <VoiceInputButton
                        onTranscript={setQuestion}
                        existingText={question}
                        disabled={aiLoading}
                        size="small"
                      />
                      <IconButton onClick={askPhysicsAI} disabled={aiLoading || !question.trim()} color="primary" sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: '#e0e0e0' } }}>
                        {aiLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <Chip key={i} label={q} size="small" onClick={() => setQuestion(q)} sx={{ cursor: 'pointer', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, fontSize: '0.75rem' }} />
                ))}
              </Box>
            </Paper>
            
            {/* Chat History - latest on top */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {chatHistory.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 100, 
                    height: 100, 
                    borderRadius: '50%', 
                    bgcolor: '#e3f2fd',
                    border: '3px solid',
                    borderColor: '#1976d2',
                    mb: 2,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        opacity: 1,
                        transform: 'scale(1)',
                      },
                      '50%': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                      }
                    }
                  }}>
                    <PhysicsIcon sx={{ fontSize: 56, color: '#1976d2' }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Start a conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Learn about motion, forces, energy, and physical laws
                  </Typography>
                </Box>
              ) : (
                chatHistory.map((msg, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    {/* User/AI label with avatar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {msg.role === 'user' ? (
                        <>
                          <Avatar src={userPhoto} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{userName[0]}</Avatar>
                          <Typography variant="caption" fontWeight={700} color="primary.main">{userName}</Typography>
                        </>
                      ) : (
                        <>
                          <VyonnScienceIcon size={24} />
                          <Typography variant="caption" fontWeight={700} color="text.secondary">Vyonn AI Science</Typography>
                        </>
                      )}
                    </Box>
                    {/* Message content */}
                    <Paper elevation={0} sx={{ p: 1.5, ml: 4, bgcolor: msg.role === 'user' ? '#e3f2fd' : 'white', border: '1px solid', borderColor: msg.role === 'user' ? 'primary.light' : 'divider', borderRadius: 2 }}>
                      <Typography 
                        variant="body2" 
                        component="div"
                        sx={{ 
                          '& p': { margin: '8px 0' },
                          '& ul': { margin: '8px 0', paddingLeft: 0 },
                          '& li': { marginLeft: '20px' },
                          '& h1, & h2, & h3': { marginTop: '12px', marginBottom: '8px' }
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: markdownToHtml(msg.content)
                        }}
                      />
                      {msg.diagram && (
                        <Button size="small" variant="contained" sx={{ mt: 1.5, textTransform: 'none', borderRadius: 2 }} startIcon={<DiagramIcon />}
                          onClick={() => { setCurrentDiagram(msg.diagram); setCurrentExperiment(null); setActiveTab(1); }}>
                          View {msg.diagram.title}
                        </Button>
                      )}
                      {msg.experiment && (
                        <Button size="small" variant="contained" color="secondary" sx={{ mt: 1.5, ml: msg.diagram ? 1 : 0, textTransform: 'none', borderRadius: 2 }} startIcon={<PlayIcon />}
                          onClick={() => { setCurrentExperiment(msg.experiment); setCurrentDiagram(null); setActiveTab(1); }}>
                          Run {msg.experiment.name}
                        </Button>
                      )}
                    </Paper>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        )}

        {/* Tab 1: Visualize */}
        {activeTab === 1 && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
            {currentDiagram && (
              <Box>
                <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #1976d2' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label="Diagram" size="small" sx={{ bgcolor: '#dbeafe', color: '#1976d2', fontWeight: 600 }} />
                    <Typography variant="subtitle1" fontWeight={700}>{currentDiagram.title}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {currentDiagram.labels?.map((label, i) => <Chip key={i} label={label} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />)}
                  </Box>
                </Paper>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ maxWidth: 450, width: '100%' }} dangerouslySetInnerHTML={{ __html: currentDiagram.svg }} />
                </Paper>
                <Button variant="outlined" onClick={() => setCurrentDiagram(null)} sx={{ mt: 2, textTransform: 'none', borderRadius: 2 }}>Clear Diagram</Button>
              </Box>
            )}
            
            {currentExperiment && !currentDiagram && (
              <>
                <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${currentExperiment.color}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={currentExperiment.category} size="small" sx={{ bgcolor: `${currentExperiment.color}20`, color: currentExperiment.color, fontWeight: 600 }} />
                    <Typography variant="subtitle1" fontWeight={700}>{currentExperiment.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{currentExperiment.description}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box><Typography variant="caption" color="text.secondary" fontWeight={600}>📐 FORMULAS</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>{currentExperiment.formulas?.map((f, i) => <Chip key={i} label={f} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }} />)}</Box>
                    </Box>
                    <Box><Typography variant="caption" color="text.secondary" fontWeight={600}>💡 CONCEPTS</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{currentExperiment.concepts?.join(' • ')}</Typography>
                    </Box>
                  </Box>
                </Paper>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={toggleSimulation} startIcon={isRunning ? <PauseIcon /> : <PlayIcon />} sx={{ bgcolor: isRunning ? '#ef4444' : '#22c55e', '&:hover': { bgcolor: isRunning ? '#dc2626' : '#16a34a' }, textTransform: 'none', borderRadius: 2 }}>{isRunning ? 'Pause' : 'Play'}</Button>
                  <Button variant="outlined" onClick={resetSimulation} startIcon={<ResetIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>Reset</Button>
                  <Box sx={{ flex: 1, minWidth: 150, mx: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><GravityIcon sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography variant="caption" fontWeight={600} color="text.secondary">Gravity: {gravity.toFixed(1)}g</Typography></Box>
                    <Slider value={gravity} onChange={(e, v) => setGravity(v)} min={0} max={3} step={0.1} size="small" sx={{ color: '#1976d2' }} />
                  </Box>
                </Box>
                <Paper elevation={0} sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', bgcolor: '#1e293b', border: '1px solid', borderColor: 'divider' }}>
                  <Box ref={canvasRef} sx={{ width: '100%', minHeight: 350 }} />
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>🖱️ Click to add objects • Drag to interact</Typography>
              </>
            )}
            
            {!currentDiagram && !currentExperiment && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                <DiagramIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                <Typography variant="h6">No visualization selected</Typography>
                <Typography variant="body2">Ask a question or choose an experiment!</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: Experiments */}
        {activeTab === 2 && (
          <Box sx={{ p: 2, overflow: 'auto' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 2, display: 'block', letterSpacing: 1 }}>PHYSICS SIMULATIONS</Typography>
            <Grid container spacing={1.5}>
              {Object.entries(PHYSICS_EXPERIMENTS).map(([key, exp]) => (
                <Grid item xs={6} sm={4} key={key}>
                  <Paper elevation={0} onClick={() => { setCurrentExperiment({ key, ...exp }); setCurrentDiagram(null); setActiveTab(1); }}
                    sx={{ p: 1.5, cursor: 'pointer', border: '1px solid', borderColor: currentExperiment?.key === key ? exp.color : 'divider', borderRadius: 2, transition: 'all 0.2s', bgcolor: currentExperiment?.key === key ? `${exp.color}08` : 'background.paper', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderColor: exp.color } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: exp.color }} /><Typography variant="caption" color="text.secondary">{exp.category}</Typography></Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{exp.name}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: exp.color, mt: 0.5, display: 'block' }}>{exp.formulas?.[0]}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 2, display: 'block', letterSpacing: 1 }}>SCIENCE DIAGRAMS</Typography>
            <Grid container spacing={1.5}>
              {Object.entries(DIAGRAM_TEMPLATES).map(([key, diagram]) => (
                <Grid item xs={6} sm={4} key={key}>
                  <Paper elevation={0} onClick={() => { setCurrentDiagram({ key, ...diagram }); setCurrentExperiment(null); setActiveTab(1); }}
                    sx={{ p: 1.5, cursor: 'pointer', border: '1px solid', borderColor: currentDiagram?.key === key ? '#1976d2' : 'divider', borderRadius: 2, transition: 'all 0.2s', bgcolor: currentDiagram?.key === key ? '#e0f2fe' : 'background.paper', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderColor: '#1976d2' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><DiagramIcon sx={{ fontSize: 14, color: '#1976d2' }} /><Typography variant="caption" color="text.secondary">{diagram.type}</Typography></Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{diagram.title}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      {/* Footer */}
      <Box sx={{ 
        py: 1, 
        px: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
        bgcolor: 'grey.50'
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', lineHeight: 1.4 }}>
          © 2025 Amandeep Singh Talwar | PDF copyrights belong to respective owners | For personal educational use only
        </Typography>
      </Box>
    </Dialog>
  );
}

export default PhysicsSimulator;
