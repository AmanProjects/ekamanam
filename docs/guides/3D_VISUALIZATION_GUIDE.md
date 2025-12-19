# 3D Visualization & Scientific Graphics Guide

## 🎯 **New Feature: Advanced 3D & Scientific Visualizations**

Ekamanam v2.2.0 introduces powerful 3D visualization capabilities for Math, Science, Chemistry, and Biology education.

---

## 📦 **Installed Packages**

### 1. **Three.js** (v0.160.0)
- **Purpose:** 3D geometric shapes and objects
- **Use Cases:**
  - Geometry: Cubes, spheres, pyramids, polyhedra
  - 3D solids with rotation and interaction
  - Visual representation of geometric concepts
  
### 2. **Plotly.js** (v2.27.1) + React-Plotly.js (v2.6.0)
- **Purpose:** Advanced scientific 3D plots
- **Use Cases:**
  - 3D surface plots: z = f(x, y)
  - 3D scatter plots
  - Vector fields
  - Parametric curves
  - Animated graphs
  - Heat maps and contours

### 3. **3Dmol.js** (loaded via CDN)
- **Purpose:** Molecular structure visualization
- **Use Cases:**
  - Chemistry: Molecular structures
  - Organic chemistry: Benzene, caffeine, glucose
  - Interactive molecule viewer
  - Chemical bonds visualization

### 4. **KaTeX** (v0.16.9) + React-KaTeX (v3.0.1)
- **Purpose:** Mathematical formula rendering
- **Use Cases:**
  - LaTeX math equations
  - Chemical formulas
  - Scientific notation

### 5. **Chart.js** (v4.5.1) - Already installed
- **Purpose:** 2D data visualization
- **Use Cases:**
  - Pie charts, bar charts, line graphs
  - Statistical data
  - Comparisons and trends

---

## 🎨 **Visualization Types**

### **Type 1: 3D Geometric Shapes (Three.js)**

**When to Use:**
- Drawing 3D solids (cube, sphere, cone, cylinder, pyramid)
- Visualizing polyhedra (dodecahedron, icosahedron, tetrahedron, octahedron)
- Teaching solid geometry
- Showing 3D transformations

**JSON Format:**
```json
{
  "type": "3d",
  "shapeType": "cube|sphere|cone|cylinder|pyramid|torus|dodecahedron|icosahedron|tetrahedron|octahedron",
  "color": "#4FC3F7",
  "wireframe": false,
  "dimensions": {
    "radius": 1.5,
    "height": 3,
    "width": 2,
    "depth": 2
  },
  "labels": ["Label 1", "Label 2"],
  "title": "Cube with dimensions",
  "rotate": true
}
```

**Example - Cube:**
```json
{
  "type": "3d",
  "shapeType": "cube",
  "color": "#4FC3F7",
  "dimensions": {"width": 2, "height": 2, "depth": 2},
  "labels": ["8 vertices", "12 edges", "6 faces"],
  "title": "Cube",
  "rotate": true
}
```

**Example - Sphere:**
```json
{
  "type": "3d",
  "shapeType": "sphere",
  "color": "#FF6B6B",
  "dimensions": {"radius": 1.5},
  "labels": ["Surface area = 4πr²", "Volume = (4/3)πr³"],
  "title": "Sphere",
  "rotate": true
}
```

---

### **Type 2: 3D Mathematical Plots (Plotly.js)**

**When to Use:**
- Graphing 3D surfaces: z = f(x, y)
- 3D scatter plots
- Vector fields in physics
- Parametric curves
- Data science visualizations

**JSON Format:**
```json
{
  "type": "plotly",
  "data": [{
    "type": "surface|scatter3d|mesh3d|cone",
    "x": [...],
    "y": [...],
    "z": [...],
    "colorscale": "Viridis"
  }],
  "layout": {
    "title": "3D Plot Title",
    "scene": {
      "xaxis": {"title": "X"},
      "yaxis": {"title": "Y"},
      "zaxis": {"title": "Z"}
    }
  },
  "title": "Graph Title"
}
```

**Example - 3D Surface (Paraboloid z = x² + y²):**
```json
{
  "type": "plotly",
  "data": [{
    "type": "surface",
    "z": [
      [0, 1, 4, 9],
      [1, 2, 5, 10],
      [4, 5, 8, 13],
      [9, 10, 13, 18]
    ],
    "x": [-2, -1, 0, 1, 2],
    "y": [-2, -1, 0, 1, 2],
    "colorscale": "Viridis"
  }],
  "layout": {
    "scene": {
      "xaxis": {"title": "X"},
      "yaxis": {"title": "Y"},
      "zaxis": {"title": "Z = X² + Y²"}
    }
  },
  "title": "Paraboloid"
}
```

**Example - 3D Scatter:**
```json
{
  "type": "plotly",
  "data": [{
    "type": "scatter3d",
    "mode": "markers",
    "x": [1, 2, 3, 4],
    "y": [2, 3, 1, 4],
    "z": [1, 4, 2, 3],
    "marker": {
      "size": 12,
      "color": [1, 2, 3, 4],
      "colorscale": "Jet"
    }
  }],
  "title": "3D Data Points"
}
```

---

### **Type 3: Chemistry (3Dmol.js)**

**When to Use:**
- Showing molecular structures
- Organic chemistry molecules
- Chemical bonds
- 3D molecular visualization

**JSON Format:**
```json
{
  "type": "chemistry",
  "moleculeData": "water|methane|ethanol|glucose|benzene|caffeine",
  "format": "smiles",
  "title": "H₂O - Water Molecule",
  "style": {
    "stick": {},
    "sphere": {"scale": 0.3}
  }
}
```

**Supported Molecules:**
- `water` - H₂O
- `methane` - CH₄
- `ethanol` - C₂H₅OH
- `glucose` - C₆H₁₂O₆
- `benzene` - C₆H₆
- `caffeine` - C₈H₁₀N₄O₂

**Example - Water Molecule:**
```json
{
  "type": "chemistry",
  "moleculeData": "water",
  "format": "smiles",
  "title": "H₂O - Water Molecule",
  "style": {
    "stick": {},
    "sphere": {"scale": 0.3}
  }
}
```

**Example - Caffeine:**
```json
{
  "type": "chemistry",
  "moleculeData": "caffeine",
  "format": "smiles",
  "title": "Caffeine Molecule (C₈H₁₀N₄O₂)",
  "style": {
    "stick": {"radius": 0.15},
    "sphere": {"scale": 0.3}
  }
}
```

---

### **Type 4: 2D Charts (Chart.js)**

**When to Use:**
- Statistical data
- Comparisons
- Trends over time
- Proportions

**JSON Format:**
```json
{
  "chartType": "pie|bar|line",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{
      "data": [value1, value2],
      "backgroundColor": ["#FF6384", "#36A2EB"]
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "legend": {"position": "bottom"}
    }
  }
}
```

---

### **Type 5: 2D SVG (Fallback)**

**When to Use:**
- Simple 2D shapes
- Angles and triangles
- Basic diagrams

---

## 🎓 **Subject-Specific Examples**

### **📐 Geometry**
```json
{"type":"3d","shapeType":"pyramid","color":"#FFA726","dimensions":{"radius":2,"height":3},"labels":["Base = 4 units","Height = 3 units","Volume = (1/3) × Base × Height"],"title":"Square Pyramid","rotate":true}
```

### **🔬 Chemistry**
```json
{"type":"chemistry","moleculeData":"benzene","format":"smiles","title":"Benzene Ring (C₆H₆)","style":{"stick":{"radius":0.15},"sphere":{"scale":0.3}}}
```

### **📊 Statistics**
```json
{"chartType":"pie","data":{"labels":["Group A","Group B","Group C"],"datasets":[{"data":[35,45,20],"backgroundColor":["#FF6384","#36A2EB","#4BC0C0"]}]},"options":{"responsive":true,"plugins":{"title":{"display":true,"text":"Distribution"},"legend":{"position":"bottom"}}}}
```

### **📈 Calculus (3D Surface)**
```json
{"type":"plotly","data":[{"type":"surface","z":[[0,1,4],[1,2,5],[4,5,8]],"x":[-1,0,1],"y":[-1,0,1],"colorscale":"Viridis"}],"layout":{"scene":{"xaxis":{"title":"X"},"yaxis":{"title":"Y"},"zaxis":{"title":"f(x,y)"}}},"title":"3D Function Surface"}
```

### **🧬 Biology (Coming Soon)**
- Animated cell diagrams
- DNA structure
- Organ systems

---

## 🚀 **How AI Will Use These**

When you ask to "Draw a cube" or explain a 3D concept, the AI will:

1. **Detect** the type of visualization needed
2. **Choose** the appropriate format:
   - 3D shape → Three.js JSON
   - 3D graph → Plotly JSON
   - Molecule → Chemistry JSON
   - Chart → Chart.js JSON
   - Simple 2D → SVG
3. **Generate** the JSON/SVG
4. **Render** interactively in your browser

---

## ✨ **Interactive Features**

All 3D visualizations support:
- **Rotate:** Click and drag to rotate
- **Zoom:** Scroll to zoom in/out
- **Pan:** Right-click and drag (Plotly)
- **Auto-rotate:** Shapes can rotate automatically
- **Labels:** Hover for information

---

## 🎯 **Benefits**

### **For Students:**
- ✅ Visualize complex 3D concepts
- ✅ Interact with shapes and molecules
- ✅ See mathematical surfaces come to life
- ✅ Understand chemistry through 3D molecules
- ✅ Better retention through visual learning

### **For Teachers:**
- ✅ No manual 3D modeling required
- ✅ AI generates appropriate visuals
- ✅ Progressive step-by-step visuals
- ✅ Bilingual support with visuals
- ✅ Works offline (after initial load)

---

## 🔧 **Technical Implementation**

### **New Components:**
1. `ThreeDVisualization.js` - Three.js wrapper
2. `ChemistryVisualization.js` - 3Dmol.js wrapper
3. `PlotlyVisualization.js` - Plotly wrapper
4. `VisualAidRenderer.js` - Enhanced to detect and route visualization types

### **Updated Services:**
- `geminiService.js` - Enhanced prompts with 3D examples
- AI now knows when and how to use 3D visualizations

---

## 📚 **Resources**

- [Three.js Documentation](https://threejs.org/docs/)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [3Dmol.js Documentation](https://3dmol.csb.pitt.edu/)
- [Chart.js Documentation](https://www.chartjs.org/)

---

## 🎉 **Try It Out!**

Ask the AI to:
- "Draw a 3D cube"
- "Show me a paraboloid surface"
- "Visualize a water molecule"
- "Graph the function z = x² + y²"
- "Draw a pyramid with labels"

Ekamanam will automatically generate interactive 3D visualizations!

---

**Version:** 2.2.0  
**Date:** November 26, 2025  
**Status:** ✅ Fully Integrated

