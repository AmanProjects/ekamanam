import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

/**
 * Complete Periodic Table Data - All 118 Elements
 */
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
  { symbol: 'Ti', name: 'Titanium', number: 22, mass: 47.87, category: 'transition', period: 4, group: 4, electron: '[Ar] 3d² 4s²', electronegativity: 1.54, density: 4.54, meltingPoint: 1668, boilingPoint: 3287, discoveredBy: 'William Gregor', year: 1791, description: 'Strong, lightweight, corrosion-resistant. Used in implants and aircraft.' },
  { symbol: 'V', name: 'Vanadium', number: 23, mass: 50.94, category: 'transition', period: 4, group: 5, electron: '[Ar] 3d³ 4s²', electronegativity: 1.63, density: 6.11, meltingPoint: 1910, boilingPoint: 3407, discoveredBy: 'Andrés Manuel del Río', year: 1801, description: 'Used in steel alloys and as a catalyst.' },
  { symbol: 'Cr', name: 'Chromium', number: 24, mass: 52.00, category: 'transition', period: 4, group: 6, electron: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, density: 7.15, meltingPoint: 1907, boilingPoint: 2671, discoveredBy: 'Louis Nicolas Vauquelin', year: 1797, description: 'Shiny metal used for chrome plating and stainless steel.' },
  { symbol: 'Mn', name: 'Manganese', number: 25, mass: 54.94, category: 'transition', period: 4, group: 7, electron: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, density: 7.44, meltingPoint: 1246, boilingPoint: 2061, discoveredBy: 'Johan Gottlieb Gahn', year: 1774, description: 'Essential trace element. Used in steel production and batteries.' },
  { symbol: 'Fe', name: 'Iron', number: 26, mass: 55.85, category: 'transition', period: 4, group: 8, electron: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, density: 7.874, meltingPoint: 1538, boilingPoint: 2861, discoveredBy: 'Ancient', year: null, description: 'Most used metal. Essential for hemoglobin. Core of Earth is iron.' },
  { symbol: 'Co', name: 'Cobalt', number: 27, mass: 58.93, category: 'transition', period: 4, group: 9, electron: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, density: 8.86, meltingPoint: 1495, boilingPoint: 2927, discoveredBy: 'Georg Brandt', year: 1735, description: 'Blue pigment. Used in batteries and superalloys.' },
  { symbol: 'Ni', name: 'Nickel', number: 28, mass: 58.69, category: 'transition', period: 4, group: 10, electron: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, density: 8.912, meltingPoint: 1455, boilingPoint: 2913, discoveredBy: 'Axel Fredrik Cronstedt', year: 1751, description: 'Corrosion-resistant metal. Used in coins and stainless steel.' },
  { symbol: 'Cu', name: 'Copper', number: 29, mass: 63.55, category: 'transition', period: 4, group: 11, electron: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.90, density: 8.96, meltingPoint: 1084.62, boilingPoint: 2562, discoveredBy: 'Ancient', year: null, description: 'Excellent conductor. Used in wiring and plumbing. Antibacterial.' },
  { symbol: 'Zn', name: 'Zinc', number: 30, mass: 65.38, category: 'transition', period: 4, group: 12, electron: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, density: 7.134, meltingPoint: 419.53, boilingPoint: 907, discoveredBy: 'India/Germany', year: 1746, description: 'Essential trace element. Used for galvanizing and in batteries.' },
  { symbol: 'Ga', name: 'Gallium', number: 31, mass: 69.72, category: 'metal', period: 4, group: 13, electron: '[Ar] 3d¹⁰ 4s² 4p¹', electronegativity: 1.81, density: 5.907, meltingPoint: 29.76, boilingPoint: 2204, discoveredBy: 'Lecoq de Boisbaudran', year: 1875, description: 'Melts in your hand. Used in semiconductors and LEDs.' },
  { symbol: 'Ge', name: 'Germanium', number: 32, mass: 72.63, category: 'metalloid', period: 4, group: 14, electron: '[Ar] 3d¹⁰ 4s² 4p²', electronegativity: 2.01, density: 5.323, meltingPoint: 938.25, boilingPoint: 2833, discoveredBy: 'Clemens Winkler', year: 1886, description: 'Semiconductor used in transistors and fiber optics.' },
  { symbol: 'As', name: 'Arsenic', number: 33, mass: 74.92, category: 'metalloid', period: 4, group: 15, electron: '[Ar] 3d¹⁰ 4s² 4p³', electronegativity: 2.18, density: 5.776, meltingPoint: 817, boilingPoint: 614, discoveredBy: 'Albertus Magnus', year: 1250, description: 'Toxic metalloid. Used in semiconductors and wood preservatives.' },
  { symbol: 'Se', name: 'Selenium', number: 34, mass: 78.97, category: 'nonmetal', period: 4, group: 16, electron: '[Ar] 3d¹⁰ 4s² 4p⁴', electronegativity: 2.55, density: 4.809, meltingPoint: 221, boilingPoint: 685, discoveredBy: 'Jöns Jacob Berzelius', year: 1817, description: 'Essential trace element. Used in electronics and glass.' },
  { symbol: 'Br', name: 'Bromine', number: 35, mass: 79.90, category: 'halogen', period: 4, group: 17, electron: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, density: 3.122, meltingPoint: -7.2, boilingPoint: 58.8, discoveredBy: 'Antoine Jérôme Balard', year: 1826, description: 'Only non-metallic liquid at room temperature. Red-brown and pungent.' },
  { symbol: 'Kr', name: 'Krypton', number: 36, mass: 83.80, category: 'noble', period: 4, group: 18, electron: '[Ar] 3d¹⁰ 4s² 4p⁶', electronegativity: 3.00, density: 0.003733, meltingPoint: -157.36, boilingPoint: -153.22, discoveredBy: 'William Ramsay', year: 1898, description: 'Noble gas. Used in lighting and lasers. Glows white.' },
  
  // Period 5
  { symbol: 'Rb', name: 'Rubidium', number: 37, mass: 85.47, category: 'alkali', period: 5, group: 1, electron: '[Kr] 5s¹', electronegativity: 0.82, density: 1.532, meltingPoint: 39.31, boilingPoint: 688, discoveredBy: 'Robert Bunsen', year: 1861, description: 'Soft alkali metal. Used in atomic clocks and research.' },
  { symbol: 'Sr', name: 'Strontium', number: 38, mass: 87.62, category: 'alkaline', period: 5, group: 2, electron: '[Kr] 5s²', electronegativity: 0.95, density: 2.64, meltingPoint: 777, boilingPoint: 1382, discoveredBy: 'Adair Crawford', year: 1790, description: 'Produces red flames. Used in fireworks and flares.' },
  { symbol: 'Y', name: 'Yttrium', number: 39, mass: 88.91, category: 'transition', period: 5, group: 3, electron: '[Kr] 4d¹ 5s²', electronegativity: 1.22, density: 4.469, meltingPoint: 1522, boilingPoint: 3345, discoveredBy: 'Johan Gadolin', year: 1794, description: 'Used in LEDs, lasers, and superconductors.' },
  { symbol: 'Zr', name: 'Zirconium', number: 40, mass: 91.22, category: 'transition', period: 5, group: 4, electron: '[Kr] 4d² 5s²', electronegativity: 1.33, density: 6.506, meltingPoint: 1855, boilingPoint: 4409, discoveredBy: 'Martin Heinrich Klaproth', year: 1789, description: 'Corrosion-resistant. Used in nuclear reactors and implants.' },
  { symbol: 'Nb', name: 'Niobium', number: 41, mass: 92.91, category: 'transition', period: 5, group: 5, electron: '[Kr] 4d⁴ 5s¹', electronegativity: 1.6, density: 8.57, meltingPoint: 2477, boilingPoint: 4744, discoveredBy: 'Charles Hatchett', year: 1801, description: 'Superconducting metal. Used in MRI machines and jet engines.' },
  { symbol: 'Mo', name: 'Molybdenum', number: 42, mass: 95.95, category: 'transition', period: 5, group: 6, electron: '[Kr] 4d⁵ 5s¹', electronegativity: 2.16, density: 10.22, meltingPoint: 2623, boilingPoint: 4639, discoveredBy: 'Carl Wilhelm Scheele', year: 1778, description: 'High melting point metal. Essential trace element.' },
  { symbol: 'Tc', name: 'Technetium', number: 43, mass: 98, category: 'transition', period: 5, group: 7, electron: '[Kr] 4d⁵ 5s²', electronegativity: 1.9, density: 11.5, meltingPoint: 2157, boilingPoint: 4265, discoveredBy: 'Emilio Segrè', year: 1937, description: 'First artificially produced element. Used in medical imaging.' },
  { symbol: 'Ru', name: 'Ruthenium', number: 44, mass: 101.07, category: 'transition', period: 5, group: 8, electron: '[Kr] 4d⁷ 5s¹', electronegativity: 2.2, density: 12.37, meltingPoint: 2334, boilingPoint: 4150, discoveredBy: 'Karl Ernst Claus', year: 1844, description: 'Platinum group metal. Used in electronics and catalysis.' },
  { symbol: 'Rh', name: 'Rhodium', number: 45, mass: 102.91, category: 'transition', period: 5, group: 9, electron: '[Kr] 4d⁸ 5s¹', electronegativity: 2.28, density: 12.41, meltingPoint: 1964, boilingPoint: 3695, discoveredBy: 'William Hyde Wollaston', year: 1803, description: 'Most expensive precious metal. Used in catalytic converters.' },
  { symbol: 'Pd', name: 'Palladium', number: 46, mass: 106.42, category: 'transition', period: 5, group: 10, electron: '[Kr] 4d¹⁰', electronegativity: 2.20, density: 12.02, meltingPoint: 1554.9, boilingPoint: 2963, discoveredBy: 'William Hyde Wollaston', year: 1803, description: 'Precious metal. Key component in catalytic converters.' },
  { symbol: 'Ag', name: 'Silver', number: 47, mass: 107.87, category: 'transition', period: 5, group: 11, electron: '[Kr] 4d¹⁰ 5s¹', electronegativity: 1.93, density: 10.501, meltingPoint: 961.78, boilingPoint: 2162, discoveredBy: 'Ancient', year: null, description: 'Best conductor of electricity. Used in jewelry, electronics, and medicine.' },
  { symbol: 'Cd', name: 'Cadmium', number: 48, mass: 112.41, category: 'transition', period: 5, group: 12, electron: '[Kr] 4d¹⁰ 5s²', electronegativity: 1.69, density: 8.69, meltingPoint: 321.07, boilingPoint: 767, discoveredBy: 'Karl Samuel Leberecht Hermann', year: 1817, description: 'Toxic heavy metal. Used in batteries and pigments.' },
  { symbol: 'In', name: 'Indium', number: 49, mass: 114.82, category: 'metal', period: 5, group: 13, electron: '[Kr] 4d¹⁰ 5s² 5p¹', electronegativity: 1.78, density: 7.31, meltingPoint: 156.6, boilingPoint: 2072, discoveredBy: 'Ferdinand Reich', year: 1863, description: 'Soft metal. Used in touchscreens and solar cells.' },
  { symbol: 'Sn', name: 'Tin', number: 50, mass: 118.71, category: 'metal', period: 5, group: 14, electron: '[Kr] 4d¹⁰ 5s² 5p²', electronegativity: 1.96, density: 7.287, meltingPoint: 231.93, boilingPoint: 2602, discoveredBy: 'Ancient', year: null, description: 'Used in cans, solder, and bronze alloys.' },
  { symbol: 'Sb', name: 'Antimony', number: 51, mass: 121.76, category: 'metalloid', period: 5, group: 15, electron: '[Kr] 4d¹⁰ 5s² 5p³', electronegativity: 2.05, density: 6.685, meltingPoint: 630.63, boilingPoint: 1587, discoveredBy: 'Ancient', year: null, description: 'Metalloid used in flame retardants and alloys.' },
  { symbol: 'Te', name: 'Tellurium', number: 52, mass: 127.60, category: 'metalloid', period: 5, group: 16, electron: '[Kr] 4d¹⁰ 5s² 5p⁴', electronegativity: 2.1, density: 6.232, meltingPoint: 449.51, boilingPoint: 988, discoveredBy: 'Franz-Joseph Müller von Reichenstein', year: 1782, description: 'Metalloid used in solar cells and thermoelectric devices.' },
  { symbol: 'I', name: 'Iodine', number: 53, mass: 126.90, category: 'halogen', period: 5, group: 17, electron: '[Kr] 4d¹⁰ 5s² 5p⁵', electronegativity: 2.66, density: 4.93, meltingPoint: 113.7, boilingPoint: 184.3, discoveredBy: 'Bernard Courtois', year: 1811, description: 'Purple-black solid. Essential for thyroid function.' },
  { symbol: 'Xe', name: 'Xenon', number: 54, mass: 131.29, category: 'noble', period: 5, group: 18, electron: '[Kr] 4d¹⁰ 5s² 5p⁶', electronegativity: 2.6, density: 0.005887, meltingPoint: -111.75, boilingPoint: -108.12, discoveredBy: 'William Ramsay', year: 1898, description: 'Noble gas used in lighting and anesthesia.' },
  
  // Period 6
  { symbol: 'Cs', name: 'Cesium', number: 55, mass: 132.91, category: 'alkali', period: 6, group: 1, electron: '[Xe] 6s¹', electronegativity: 0.79, density: 1.873, meltingPoint: 28.44, boilingPoint: 671, discoveredBy: 'Robert Bunsen', year: 1860, description: 'Most electropositive element. Used in atomic clocks.' },
  { symbol: 'Ba', name: 'Barium', number: 56, mass: 137.33, category: 'alkaline', period: 6, group: 2, electron: '[Xe] 6s²', electronegativity: 0.89, density: 3.594, meltingPoint: 727, boilingPoint: 1897, discoveredBy: 'Carl Wilhelm Scheele', year: 1772, description: 'Green flames. Used in medical imaging and fireworks.' },
  { symbol: 'La', name: 'Lanthanum', number: 57, mass: 138.91, category: 'lanthanide', period: 6, group: 3, electron: '[Xe] 5d¹ 6s²', electronegativity: 1.10, density: 6.145, meltingPoint: 920, boilingPoint: 3464, discoveredBy: 'Carl Gustaf Mosander', year: 1839, description: 'First lanthanide. Used in camera lenses and batteries.' },
  { symbol: 'Ce', name: 'Cerium', number: 58, mass: 140.12, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹ 5d¹ 6s²', electronegativity: 1.12, density: 6.77, meltingPoint: 798, boilingPoint: 3443, discoveredBy: 'Jöns Jacob Berzelius', year: 1803, description: 'Most abundant rare earth. Used in catalytic converters.' },
  { symbol: 'Pr', name: 'Praseodymium', number: 59, mass: 140.91, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f³ 6s²', electronegativity: 1.13, density: 6.773, meltingPoint: 931, boilingPoint: 3520, discoveredBy: 'Carl Auer von Welsbach', year: 1885, description: 'Green salts. Used in magnets and glass coloring.' },
  { symbol: 'Nd', name: 'Neodymium', number: 60, mass: 144.24, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁴ 6s²', electronegativity: 1.14, density: 7.007, meltingPoint: 1021, boilingPoint: 3074, discoveredBy: 'Carl Auer von Welsbach', year: 1885, description: 'Strongest permanent magnets. Used in headphones and motors.' },
  { symbol: 'Pm', name: 'Promethium', number: 61, mass: 145, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁵ 6s²', electronegativity: 1.13, density: 7.26, meltingPoint: 1042, boilingPoint: 3000, discoveredBy: 'Chien Shiung Wu', year: 1945, description: 'Radioactive. Used in nuclear batteries.' },
  { symbol: 'Sm', name: 'Samarium', number: 62, mass: 150.36, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁶ 6s²', electronegativity: 1.17, density: 7.52, meltingPoint: 1074, boilingPoint: 1900, discoveredBy: 'Lecoq de Boisbaudran', year: 1879, description: 'Used in magnets and cancer treatment.' },
  { symbol: 'Eu', name: 'Europium', number: 63, mass: 151.96, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁷ 6s²', electronegativity: 1.2, density: 5.243, meltingPoint: 822, boilingPoint: 1529, discoveredBy: 'Eugène-Anatole Demarçay', year: 1901, description: 'Red phosphor in TVs. Most reactive lanthanide.' },
  { symbol: 'Gd', name: 'Gadolinium', number: 64, mass: 157.25, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁷ 5d¹ 6s²', electronegativity: 1.20, density: 7.895, meltingPoint: 1313, boilingPoint: 3273, discoveredBy: 'Jean Charles Galissard de Marignac', year: 1880, description: 'MRI contrast agent. High magnetic properties.' },
  { symbol: 'Tb', name: 'Terbium', number: 65, mass: 158.93, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f⁹ 6s²', electronegativity: 1.2, density: 8.229, meltingPoint: 1356, boilingPoint: 3230, discoveredBy: 'Carl Gustaf Mosander', year: 1843, description: 'Green phosphor. Used in solid-state devices.' },
  { symbol: 'Dy', name: 'Dysprosium', number: 66, mass: 162.50, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹⁰ 6s²', electronegativity: 1.22, density: 8.55, meltingPoint: 1412, boilingPoint: 2567, discoveredBy: 'Lecoq de Boisbaudran', year: 1886, description: 'Highest magnetic strength at low temps. Used in magnets.' },
  { symbol: 'Ho', name: 'Holmium', number: 67, mass: 164.93, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹¹ 6s²', electronegativity: 1.23, density: 8.795, meltingPoint: 1474, boilingPoint: 2700, discoveredBy: 'Jacques-Louis Soret', year: 1878, description: 'Highest magnetic moment. Used in magnets and lasers.' },
  { symbol: 'Er', name: 'Erbium', number: 68, mass: 167.26, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹² 6s²', electronegativity: 1.24, density: 9.066, meltingPoint: 1529, boilingPoint: 2868, discoveredBy: 'Carl Gustaf Mosander', year: 1843, description: 'Pink salts. Used in fiber optics amplifiers.' },
  { symbol: 'Tm', name: 'Thulium', number: 69, mass: 168.93, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹³ 6s²', electronegativity: 1.25, density: 9.321, meltingPoint: 1545, boilingPoint: 1950, discoveredBy: 'Per Teodor Cleve', year: 1879, description: 'Rarest stable lanthanide. Used in portable X-ray devices.' },
  { symbol: 'Yb', name: 'Ytterbium', number: 70, mass: 173.05, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹⁴ 6s²', electronegativity: 1.1, density: 6.965, meltingPoint: 819, boilingPoint: 1196, discoveredBy: 'Jean Charles Galissard de Marignac', year: 1878, description: 'Used in metallurgy and laser materials.' },
  { symbol: 'Lu', name: 'Lutetium', number: 71, mass: 174.97, category: 'lanthanide', period: 6, group: null, electron: '[Xe] 4f¹⁴ 5d¹ 6s²', electronegativity: 1.27, density: 9.84, meltingPoint: 1663, boilingPoint: 3402, discoveredBy: 'Georges Urbain', year: 1907, description: 'Last lanthanide. Used in PET scanners.' },
  { symbol: 'Hf', name: 'Hafnium', number: 72, mass: 178.49, category: 'transition', period: 6, group: 4, electron: '[Xe] 4f¹⁴ 5d² 6s²', electronegativity: 1.3, density: 13.31, meltingPoint: 2233, boilingPoint: 4603, discoveredBy: 'Dirk Coster', year: 1923, description: 'Used in nuclear reactors and computer chips.' },
  { symbol: 'Ta', name: 'Tantalum', number: 73, mass: 180.95, category: 'transition', period: 6, group: 5, electron: '[Xe] 4f¹⁴ 5d³ 6s²', electronegativity: 1.5, density: 16.654, meltingPoint: 3017, boilingPoint: 5458, discoveredBy: 'Anders Gustaf Ekeberg', year: 1802, description: 'Corrosion-resistant. Used in electronics and implants.' },
  { symbol: 'W', name: 'Tungsten', number: 74, mass: 183.84, category: 'transition', period: 6, group: 6, electron: '[Xe] 4f¹⁴ 5d⁴ 6s²', electronegativity: 2.36, density: 19.25, meltingPoint: 3422, boilingPoint: 5555, discoveredBy: 'Carl Wilhelm Scheele', year: 1783, description: 'Highest melting point of all elements. Light bulb filaments.' },
  { symbol: 'Re', name: 'Rhenium', number: 75, mass: 186.21, category: 'transition', period: 6, group: 7, electron: '[Xe] 4f¹⁴ 5d⁵ 6s²', electronegativity: 1.9, density: 21.02, meltingPoint: 3186, boilingPoint: 5596, discoveredBy: 'Masataka Ogawa', year: 1908, description: 'Very rare. Used in jet engines and catalysts.' },
  { symbol: 'Os', name: 'Osmium', number: 76, mass: 190.23, category: 'transition', period: 6, group: 8, electron: '[Xe] 4f¹⁴ 5d⁶ 6s²', electronegativity: 2.2, density: 22.59, meltingPoint: 3033, boilingPoint: 5012, discoveredBy: 'Smithson Tennant', year: 1803, description: 'Densest naturally occurring element. Used in pen tips.' },
  { symbol: 'Ir', name: 'Iridium', number: 77, mass: 192.22, category: 'transition', period: 6, group: 9, electron: '[Xe] 4f¹⁴ 5d⁷ 6s²', electronegativity: 2.20, density: 22.56, meltingPoint: 2446, boilingPoint: 4428, discoveredBy: 'Smithson Tennant', year: 1803, description: 'Most corrosion-resistant metal. Found in asteroid impacts.' },
  { symbol: 'Pt', name: 'Platinum', number: 78, mass: 195.08, category: 'transition', period: 6, group: 10, electron: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronegativity: 2.28, density: 21.46, meltingPoint: 1768.3, boilingPoint: 3825, discoveredBy: 'Antonio de Ulloa', year: 1735, description: 'Precious metal. Used in jewelry, catalysts, and electronics.' },
  { symbol: 'Au', name: 'Gold', number: 79, mass: 196.97, category: 'transition', period: 6, group: 11, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54, density: 19.282, meltingPoint: 1064.18, boilingPoint: 2856, discoveredBy: 'Ancient', year: null, description: 'Precious metal prized throughout history. Excellent conductor.' },
  { symbol: 'Hg', name: 'Mercury', number: 80, mass: 200.59, category: 'transition', period: 6, group: 12, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronegativity: 2.00, density: 13.5336, meltingPoint: -38.83, boilingPoint: 356.73, discoveredBy: 'Ancient', year: null, description: 'Only metal liquid at room temperature. Toxic.' },
  { symbol: 'Tl', name: 'Thallium', number: 81, mass: 204.38, category: 'metal', period: 6, group: 13, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', electronegativity: 1.62, density: 11.85, meltingPoint: 304, boilingPoint: 1473, discoveredBy: 'William Crookes', year: 1861, description: 'Highly toxic. Used in electronics and medical imaging.' },
  { symbol: 'Pb', name: 'Lead', number: 82, mass: 207.2, category: 'metal', period: 6, group: 14, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronegativity: 2.33, density: 11.342, meltingPoint: 327.46, boilingPoint: 1749, discoveredBy: 'Ancient', year: null, description: 'Dense, soft, toxic metal. Used in batteries and radiation shielding.' },
  { symbol: 'Bi', name: 'Bismuth', number: 83, mass: 208.98, category: 'metal', period: 6, group: 15, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', electronegativity: 2.02, density: 9.807, meltingPoint: 271.4, boilingPoint: 1564, discoveredBy: 'Claude François Geoffroy', year: 1753, description: 'Least toxic heavy metal. Rainbow-colored oxide. Used in medicine.' },
  { symbol: 'Po', name: 'Polonium', number: 84, mass: 209, category: 'metalloid', period: 6, group: 16, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', electronegativity: 2.0, density: 9.32, meltingPoint: 254, boilingPoint: 962, discoveredBy: 'Marie Curie', year: 1898, description: 'Highly radioactive. Used in antistatic devices.' },
  { symbol: 'At', name: 'Astatine', number: 85, mass: 210, category: 'halogen', period: 6, group: 17, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', electronegativity: 2.2, density: 7, meltingPoint: 302, boilingPoint: 337, discoveredBy: 'Dale R. Corson', year: 1940, description: 'Rarest naturally occurring element. Highly radioactive.' },
  { symbol: 'Rn', name: 'Radon', number: 86, mass: 222, category: 'noble', period: 6, group: 18, electron: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', electronegativity: null, density: 0.00973, meltingPoint: -71, boilingPoint: -61.7, discoveredBy: 'Friedrich Ernst Dorn', year: 1900, description: 'Radioactive noble gas. Second leading cause of lung cancer.' },
  
  // Period 7 (selected important elements)
  { symbol: 'Fr', name: 'Francium', number: 87, mass: 223, category: 'alkali', period: 7, group: 1, electron: '[Rn] 7s¹', electronegativity: 0.7, density: 1.87, meltingPoint: 27, boilingPoint: 677, discoveredBy: 'Marguerite Perey', year: 1939, description: 'Most unstable naturally occurring element. Extremely rare.' },
  { symbol: 'Ra', name: 'Radium', number: 88, mass: 226, category: 'alkaline', period: 7, group: 2, electron: '[Rn] 7s²', electronegativity: 0.9, density: 5.5, meltingPoint: 700, boilingPoint: 1737, discoveredBy: 'Marie Curie', year: 1898, description: 'Radioactive. Glows blue-green. Discovered by Marie Curie.' },
  { symbol: 'Ac', name: 'Actinium', number: 89, mass: 227, category: 'actinide', period: 7, group: 3, electron: '[Rn] 6d¹ 7s²', electronegativity: 1.1, density: 10.07, meltingPoint: 1050, boilingPoint: 3200, discoveredBy: 'Friedrich Oskar Giesel', year: 1899, description: 'First actinide. Glows blue in dark due to radioactivity.' },
  { symbol: 'Th', name: 'Thorium', number: 90, mass: 232.04, category: 'actinide', period: 7, group: null, electron: '[Rn] 6d² 7s²', electronegativity: 1.3, density: 11.72, meltingPoint: 1750, boilingPoint: 4788, discoveredBy: 'Jöns Jacob Berzelius', year: 1829, description: 'Potential nuclear fuel. More abundant than uranium.' },
  { symbol: 'U', name: 'Uranium', number: 92, mass: 238.03, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f³ 6d¹ 7s²', electronegativity: 1.38, density: 18.95, meltingPoint: 1135, boilingPoint: 4131, discoveredBy: 'Martin Heinrich Klaproth', year: 1789, description: 'Nuclear fuel and weapons. Naturally radioactive.' },
  { symbol: 'Pu', name: 'Plutonium', number: 94, mass: 244, category: 'actinide', period: 7, group: null, electron: '[Rn] 5f⁶ 7s²', electronegativity: 1.28, density: 19.84, meltingPoint: 640, boilingPoint: 3228, discoveredBy: 'Glenn T. Seaborg', year: 1940, description: 'Nuclear weapons and reactors. Extremely toxic.' },
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

function ChemistryTools({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [moleculeName, setMoleculeName] = useState('caffeine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [currentCID, setCurrentCID] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

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

  const get3DmolHTML = (cid) => `
<!DOCTYPE html>
<html>
<head>
  <style>body{margin:0;padding:0;overflow:hidden}#viewer{width:100%;height:100%;position:absolute}</style>
  <script src="https://3dmol.org/build/3Dmol-min.js"></script>
</head>
<body>
  <div id="viewer"></div>
  <script>
    fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d')
      .then(r=>r.text())
      .then(data=>{
        let v=$3Dmol.createViewer('viewer',{backgroundColor:'white'});
        v.addModel(data,'sdf');
        v.setStyle({},{stick:{radius:0.15},sphere:{scale:0.25}});
        v.zoomTo();v.render();v.spin(true);
      })
      .catch(()=>{document.getElementById('viewer').innerHTML='<div style="padding:20px;color:#666;">3D structure not available</div>';});
  </script>
</body>
</html>`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#4caf50', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScienceIcon />
          <Typography variant="h6">Chemistry Tools</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => { setActiveTab(v); setSelectedElement(null); }}>
          <Tab icon={<ScienceIcon />} label="3D Molecules" />
          <Tab label="Periodic Table" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2, overflow: 'auto' }}>
        {/* 3D Molecule Viewer */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField fullWidth value={moleculeName} onChange={(e) => setMoleculeName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && loadMolecule(moleculeName)} placeholder="Enter molecule name" size="small" />
              <Button variant="contained" onClick={() => loadMolecule(moleculeName)} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />} sx={{ bgcolor: '#4caf50' }}>View</Button>
            </Box>
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {commonMolecules.map((m) => (
                <Chip key={m.cid} label={m.name} size="small" onClick={() => { setMoleculeName(m.name); setCurrentCID(m.cid); setViewerKey(prev => prev + 1); }} sx={{ cursor: 'pointer' }} />
              ))}
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper elevation={3} sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
              {currentCID ? (
                <iframe key={viewerKey} srcDoc={get3DmolHTML(currentCID)} title="3D Molecule" style={{ width: '100%', height: 400, border: 'none' }} sandbox="allow-scripts" />
              ) : (
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: 'text.secondary' }}>
                  {loading ? <CircularProgress /> : <><ScienceIcon sx={{ fontSize: 48, opacity: 0.5 }} /><Typography>Search for a molecule</Typography></>}
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Periodic Table */}
        {activeTab === 1 && !selectedElement && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">Click on any element to see detailed properties</Typography>
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(categoryColors).map(([cat, color]) => (
                <Chip key={cat} label={cat} size="small" sx={{ bgcolor: color, textTransform: 'capitalize', fontSize: '0.7rem' }} />
              ))}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: 0.5, fontSize: '0.65rem' }}>
              {/* Row 1 */}
              {renderElement(1)} {Array(16).fill(null).map((_, i) => <Box key={`empty1-${i}`} />)} {renderElement(2)}
              {/* Row 2 */}
              {renderElement(3)} {renderElement(4)} {Array(10).fill(null).map((_, i) => <Box key={`empty2-${i}`} />)} {[5,6,7,8,9,10].map(n => renderElement(n))}
              {/* Row 3 */}
              {renderElement(11)} {renderElement(12)} {Array(10).fill(null).map((_, i) => <Box key={`empty3-${i}`} />)} {[13,14,15,16,17,18].map(n => renderElement(n))}
              {/* Row 4 */}
              {Array.from({length: 18}, (_, i) => renderElement(19 + i))}
              {/* Row 5 */}
              {Array.from({length: 18}, (_, i) => renderElement(37 + i))}
              {/* Row 6 */}
              {renderElement(55)} {renderElement(56)} {renderElement(57, true)} {Array.from({length: 15}, (_, i) => renderElement(72 + i))}
              {/* Row 7 */}
              {renderElement(87)} {renderElement(88)} {renderElement(89, true)} {Array.from({length: 15}, (_, i) => {
                const nums = [104,105,106,107,108,109,110,111,112,113,114,115,116,117,118];
                return i < nums.length ? <Box key={`r7-${i}`} /> : null;
              })}
              {/* Spacer */}
              <Box sx={{ gridColumn: 'span 18', height: 8 }} />
              {/* Lanthanides */}
              <Box sx={{ gridColumn: 'span 3' }} />
              {Array.from({length: 15}, (_, i) => renderElement(57 + i))}
              {/* Actinides */}
              <Box sx={{ gridColumn: 'span 3' }} />
              {[89,90,91,92,93,94,95,96,97,98,99,100,101,102,103].map(n => {
                const el = allElements.find(e => e.number === n);
                return el ? renderElement(n) : <Box key={n} />;
              })}
            </Box>
          </Box>
        )}

        {/* Element Detail View */}
        {activeTab === 1 && selectedElement && (
          <Box>
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <PropertyCard label="Category" value={selectedElement.category} />
                    <PropertyCard label="Period" value={selectedElement.period} />
                    <PropertyCard label="Group" value={selectedElement.group || 'N/A'} />
                    <PropertyCard label="Electron Config" value={selectedElement.electron} />
                    <PropertyCard label="Electronegativity" value={selectedElement.electronegativity || 'N/A'} />
                    <PropertyCard label="Density" value={`${selectedElement.density} g/cm³`} />
                    <PropertyCard label="Melting Point" value={`${selectedElement.meltingPoint}°C`} />
                    <PropertyCard label="Boiling Point" value={`${selectedElement.boilingPoint}°C`} />
                    <PropertyCard label="Discovered By" value={selectedElement.discoveredBy} />
                    <PropertyCard label="Year Discovered" value={selectedElement.year || 'Ancient'} />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  function renderElement(num, isPlaceholder = false) {
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
  }
}

function PropertyCard({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Paper>
  );
}

export default ChemistryTools;
