import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Functions as MathIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  ShowChart as GraphIcon,
  GridOn as GridIcon,
  Calculate as CalculateIcon,
  ArrowBack as BackIcon,
  Refresh as ResetIcon,
  School as SchoolIcon,
  EmojiObjects as TipIcon
} from '@mui/icons-material';
import { callLLM } from '../../services/llmService';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import * as math from 'mathjs';

/**
 * Vyonn AI Math Lab - Complete Redesign
 * AI-powered mathematics learning with visualization, graphing, and interactive tools
 * Removes class-based system, adds universal AI agent
 */

// ==================== VISUALIZATION TEMPLATES ====================
const MATH_VISUALIZATIONS = {
  pythagorean: {
    title: 'Pythagorean Theorem',
    type: 'geometry',
    latex: 'a^2 + b^2 = c^2',
    description: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides'
  },
  quadraticFormula: {
    title: 'Quadratic Formula',
    type: 'algebra',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
    description: 'Solves any quadratic equation ax² + bx + c = 0'
  },
  eulerFormula: {
    title: "Euler's Formula",
    type: 'complex',
    latex: 'e^{i\\theta} = \\cos(\\theta) + i\\sin(\\theta)',
    description: 'Connects exponential function with trigonometric functions'
  },
  derivativeDefinition: {
    title: 'Derivative Definition',
    type: 'calculus',
    latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
    description: 'Fundamental definition of a derivative - instantaneous rate of change'
  },
  integralDefinition: {
    title: 'Definite Integral',
    type: 'calculus',
    latex: '\\int_a^b f(x)dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i)\\Delta x',
    description: 'Area under a curve from a to b'
  },
  sineLaw: {
    title: 'Law of Sines',
    type: 'trigonometry',
    latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}',
    description: 'Relates sides and angles in any triangle'
  },
  cosineLaw: {
    title: 'Law of Cosines',
    type: 'trigonometry',
    latex: 'c^2 = a^2 + b^2 - 2ab\\cos C',
    description: 'Generalizes Pythagorean theorem for any triangle'
  },
  distanceFormula: {
    title: 'Distance Formula',
    type: 'geometry',
    latex: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}',
    description: 'Distance between two points in 2D space'
  },
  circleEquation: {
    title: 'Circle Equation',
    type: 'geometry',
    latex: '(x-h)^2 + (y-k)^2 = r^2',
    description: 'Equation of circle with center (h,k) and radius r'
  },
  binomialTheorem: {
    title: 'Binomial Theorem',
    type: 'algebra',
    latex: '(a+b)^n = \\sum_{k=0}^n \\binom{n}{k} a^{n-k}b^k',
    description: 'Expands powers of binomials'
  }
};

// Math keywords for smart detection
const MATH_KEYWORDS = {
  pythagorean: ['pythagorean', 'right triangle', 'hypotenuse', 'a^2 + b^2'],
  quadraticFormula: ['quadratic formula', 'solve quadratic', 'ax^2 + bx + c', 'quadratic equation'],
  eulerFormula: ['euler formula', 'e^ix', 'complex exponential'],
  derivativeDefinition: ['derivative', 'differentiation', 'rate of change', "f'(x)", 'slope'],
  integralDefinition: ['integral', 'integration', 'area under curve', 'antiderivative'],
  sineLaw: ['law of sines', 'sine rule', 'sine law'],
  cosineLaw: ['law of cosines', 'cosine rule', 'cosine law'],
  distanceFormula: ['distance formula', 'distance between points', 'euclidean distance'],
  circleEquation: ['circle equation', 'equation of circle', 'circle formula'],
  binomialTheorem: ['binomial theorem', 'binomial expansion', '(a+b)^n']
};

// ==================== AI MATH ASSISTANT ====================
function MathAIChat({ user }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentFormula, setCurrentFormula] = useState(null);
  const chatEndRef = useRef(null);

  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Find matching formula
  const findMatchingFormula = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, keywords] of Object.entries(MATH_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          return { key, ...MATH_VISUALIZATIONS[key] };
        }
      }
    }
    return null;
  }, []);

  // Ask Math AI
  const askMath = async () => {
    if (!question.trim() || loading) return;

    const userMessage = { role: 'user', content: question, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    // Check for formula visualization
    const matchedFormula = findMatchingFormula(question);
    if (matchedFormula) {
      setCurrentFormula(matchedFormula);
    }

    try {
      const prompt = `You are Vyonn, an expert mathematics tutor. The student asks: "${question}"

Guidelines:
- Explain concepts clearly with step-by-step reasoning
- Use mathematical notation when helpful (LaTeX format in \\(...\\) for inline, \\[...\\] for blocks)
- Provide examples and visual descriptions
- Break down complex problems into manageable steps
- Connect to real-world applications when relevant
- Be encouraging and patient
- For formulas, explain when and why to use them

Respond in a friendly, educational tone.`;

      const response = await callLLM(prompt, 'mathematics');
      
      const aiMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        formula: matchedFormula
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Math AI error:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try asking your question again.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Render LaTeX in messages
  const renderMessage = (content) => {
    // Split by LaTeX blocks
    const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        // Block math
        const latex = part.slice(2, -2);
        return <Box key={idx} sx={{ my: 2, textAlign: 'center' }}><BlockMath math={latex} /></Box>;
      } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
        // Inline math
        const latex = part.slice(2, -2);
        return <InlineMath key={idx} math={latex} />;
      } else {
        // Regular text
        return <span key={idx}>{part}</span>;
      }
    });
  };

  const quickQuestions = [
    "Explain the Pythagorean theorem",
    "How do I solve quadratic equations?",
    "What is a derivative?",
    "Explain the chain rule",
    "What is the fundamental theorem of calculus?",
    "How do I find the area of a circle?",
    "What is Euler's formula?",
    "Explain complex numbers"
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
      {/* Chat Header */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AIIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Vyonn Math AI</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Your personal mathematics tutor • Ask me anything!
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Chat Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {chatHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MathIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Welcome to Math Lab!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              I'm Vyonn, your AI mathematics tutor. Ask me anything from basic arithmetic to advanced calculus!
            </Typography>
            
            {/* Quick Questions */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              💡 Try asking:
            </Typography>
            <Grid container spacing={1} sx={{ maxWidth: 600, mx: 'auto' }}>
              {quickQuestions.slice(0, 4).map((q, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Chip
                    label={q}
                    onClick={() => setQuestion(q)}
                    sx={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
                    icon={<TipIcon />}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box>
            {chatHistory.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  mb: 2,
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  src={msg.role === 'user' ? userPhoto : undefined}
                  sx={{
                    bgcolor: msg.role === 'user' ? '#1976d2' : '#2e7d32',
                    width: 36,
                    height: 36
                  }}
                >
                  {msg.role === 'user' ? userName[0] : <AIIcon />}
                </Avatar>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: msg.role === 'user' ? '#e3f2fd' : msg.error ? '#ffebee' : '#f5f5f5',
                    borderRadius: 2
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mb: 0.5, opacity: 0.7 }}
                  >
                    {msg.role === 'user' ? userName : 'Vyonn'} • {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {renderMessage(msg.content)}
                  </Typography>

                  {/* Show formula if detected */}
                  {msg.formula && (
                    <Card sx={{ mt: 2, bgcolor: '#fff3e0' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          📐 {msg.formula.title}
                        </Typography>
                        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, textAlign: 'center' }}>
                          <BlockMath math={msg.formula.latex} />
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                          {msg.formula.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Paper>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ bgcolor: '#2e7d32', width: 36, height: 36 }}>
              <AIIcon />
            </Avatar>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Vyonn is thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Paper elevation={3} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask any math question... (e.g., 'Explain derivatives' or 'How to solve x^2 + 5x + 6 = 0?')"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askMath();
              }
            }}
            disabled={loading}
            sx={{ bgcolor: 'white' }}
          />
          <Button
            variant="contained"
            onClick={askMath}
            disabled={!question.trim() || loading}
            sx={{ minWidth: 56, height: 56 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

// ==================== VISUALIZATION TAB ====================
function MathVisualization() {
  const [selectedViz, setSelectedViz] = useState(null);
  const [graphExpr, setGraphExpr] = useState('sin(x)');
  const [graphType, setGraphType] = useState('2d');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax] = useState(10);
  const graphRef = useRef(null);

  // Categories
  const categories = {
    algebra: { name: 'Algebra', color: '#f44336', icon: '🔢' },
    geometry: { name: 'Geometry', color: '#2196f3', icon: '📐' },
    trigonometry: { name: 'Trigonometry', color: '#9c27b0', icon: '📊' },
    calculus: { name: 'Calculus', color: '#ff9800', icon: '∫' },
    complex: { name: 'Complex Numbers', color: '#4caf50', icon: '𝒊' }
  };

  // Function plotter using function-plot library
  useEffect(() => {
    if (graphRef.current && graphType === '2d') {
      import('function-plot').then((fp) => {
        try {
          graphRef.current.innerHTML = '';
          fp.default({
            target: graphRef.current,
            width: graphRef.current.clientWidth || 600,
            height: 400,
            yAxis: { domain: [yMin, yMax] },
            xAxis: { domain: [xMin, xMax] },
            grid: true,
            data: [{
              fn: graphExpr,
              color: '#1976d2',
              graphType: 'polyline'
            }]
          });
        } catch (e) {
          console.error('Graph error:', e);
        }
      }).catch(console.error);
    }
  }, [graphExpr, xMin, xMax, yMin, yMax, graphType]);

  if (selectedViz) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => setSelectedViz(null)}
          sx={{ mb: 2 }}
        >
          Back to Gallery
        </Button>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ color: categories[selectedViz.type].color }}>
              {categories[selectedViz.type].icon} {selectedViz.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedViz.description}
            </Typography>

            <Paper sx={{ p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <BlockMath math={selectedViz.latex} />
            </Paper>

            {/* Interactive examples could go here */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                💡 Try it yourself:
              </Typography>
              <Typography variant="body2">
                Use the "Graph Plotter" tab to visualize this formula with different values!
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        📐 Mathematical Visualizations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Explore fundamental formulas and theorems with interactive visualizations
      </Typography>

      {/* Categories */}
      {Object.entries(categories).map(([key, cat]) => {
        const formulas = Object.values(MATH_VISUALIZATIONS).filter(v => v.type === key);
        if (formulas.length === 0) return null;

        return (
          <Box key={key} sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: cat.color, fontWeight: 600 }}
            >
              {cat.icon} {cat.name}
            </Typography>
            <Grid container spacing={2}>
              {formulas.map((viz, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => setSelectedViz(viz)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                        {viz.title}
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f9f9f9', mb: 1, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <InlineMath math={viz.latex.length > 40 ? viz.latex.slice(0, 40) + '...' : viz.latex} />
                      </Paper>
                      <Typography variant="caption" color="text.secondary">
                        {viz.description.slice(0, 60)}...
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </Box>
  );
}

// ==================== GRAPH PLOTTER TAB ====================
function GraphPlotter() {
  const [expr, setExpr] = useState('sin(x)');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-5);
  const [yMax, setYMax] = useState(5);
  const [error, setError] = useState('');
  const graphRef = useRef(null);

  const examples = [
    { label: 'Sine Wave', expr: 'sin(x)', desc: 'Trigonometric sine function' },
    { label: 'Parabola', expr: 'x^2', desc: 'Simple quadratic function' },
    { label: 'Cubic', expr: 'x^3 - 3x', desc: 'Cubic polynomial' },
    { label: 'Exponential', expr: 'exp(x)', desc: 'Exponential growth' },
    { label: 'Rational', expr: '1/x', desc: 'Reciprocal function' },
    { label: 'Circle', expr: 'sqrt(25 - x^2)', desc: 'Upper half of circle' }
  ];

  useEffect(() => {
    if (graphRef.current) {
      import('function-plot').then((fp) => {
        try {
          graphRef.current.innerHTML = '';
          setError('');
          fp.default({
            target: graphRef.current,
            width: graphRef.current.clientWidth || 600,
            height: 400,
            yAxis: { domain: [yMin, yMax] },
            xAxis: { domain: [xMin, xMax] },
            grid: true,
            data: [{
              fn: expr,
              color: '#1976d2',
              graphType: 'polyline'
            }]
          });
        } catch (e) {
          setError('Invalid expression. Try: x^2, sin(x), log(x), etc.');
        }
      }).catch(() => {
        setError('Graph library not loaded');
      });
    }
  }, [expr, xMin, xMax, yMin, yMax]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        📈 Interactive Graph Plotter
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Plot any mathematical function and explore its behavior
      </Typography>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Function
            </Typography>
            <TextField
              fullWidth
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="e.g., x^2, sin(x), sqrt(x)"
              sx={{ mb: 2 }}
              helperText="Use: +, -, *, /, ^, sin, cos, tan, log, sqrt, abs"
            />

            <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
              X-Axis Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                type="number"
                label="Min"
                value={xMin}
                onChange={(e) => setXMin(Number(e.target.value))}
                size="small"
              />
              <TextField
                type="number"
                label="Max"
                value={xMax}
                onChange={(e) => setXMax(Number(e.target.value))}
                size="small"
              />
            </Box>

            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Y-Axis Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                type="number"
                label="Min"
                value={yMin}
                onChange={(e) => setYMin(Number(e.target.value))}
                size="small"
              />
              <TextField
                type="number"
                label="Max"
                value={yMax}
                onChange={(e) => setYMax(Number(e.target.value))}
                size="small"
              />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={() => {
                setXMin(-10);
                setXMax(10);
                setYMin(-5);
                setYMax(5);
              }}
            >
              Reset View
            </Button>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              📚 Example Functions
            </Typography>
            {examples.map((ex, idx) => (
              <Chip
                key={idx}
                label={ex.label}
                onClick={() => setExpr(ex.expr)}
                sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                variant={expr === ex.expr ? 'filled' : 'outlined'}
                color={expr === ex.expr ? 'primary' : 'default'}
              />
            ))}
          </Paper>
        </Grid>

        {/* Graph */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Graph: <InlineMath math={`y = ${expr}`} />
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              ref={graphRef}
              sx={{
                width: '100%',
                minHeight: 400,
                bgcolor: '#fafafa',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              💡 Tip: Zoom by changing axis ranges, or try different functions from the examples
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// ==================== CALCULATOR TAB ====================
function AdvancedCalculator() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);

  const calculate = () => {
    try {
      const evaluated = math.evaluate(expr);
      const formatted = typeof evaluated === 'number' ? 
        math.format(evaluated, { precision: 12 }) : 
        evaluated.toString();
      
      setResult(formatted);
      setHistory(prev => [...prev, { expr, result: formatted, timestamp: new Date() }].slice(-10));
    } catch (e) {
      setResult('Error: ' + e.message);
    }
  };

  const buttons = [
    ['7', '8', '9', '/', 'sin'],
    ['4', '5', '6', '*', 'cos'],
    ['1', '2', '3', '-', 'tan'],
    ['0', '.', '=', '+', 'sqrt'],
    ['(', ')', '^', 'log', 'clear']
  ];

  const handleButton = (btn) => {
    if (btn === '=') {
      calculate();
    } else if (btn === 'clear') {
      setExpr('');
      setResult('');
    } else if (btn === 'sin' || btn === 'cos' || btn === 'tan' || btn === 'sqrt' || btn === 'log') {
      setExpr(prev => prev + btn + '(');
    } else {
      setExpr(prev => prev + btn);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🧮 Advanced Calculator
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="Enter expression..."
              sx={{ mb: 1 }}
              onKeyPress={(e) => e.key === 'Enter' && calculate()}
            />
            
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', minHeight: 60 }}>
              <Typography variant="h5" align="right">
                {result || '0'}
              </Typography>
            </Paper>

            {/* Calculator Buttons */}
            {buttons.map((row, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {row.map((btn) => (
                  <Button
                    key={btn}
                    variant={btn === '=' ? 'contained' : 'outlined'}
                    onClick={() => handleButton(btn)}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {btn}
                  </Button>
                ))}
              </Box>
            ))}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              💡 Supports: +, -, *, /, ^, sin, cos, tan, log, sqrt, abs, factorial
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              📜 Calculation History
            </Typography>
            
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No calculations yet
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {history.reverse().map((item, idx) => (
                  <Paper
                    key={idx}
                    sx={{ p: 1.5, mb: 1, bgcolor: '#fafafa', cursor: 'pointer' }}
                    onClick={() => setExpr(item.expr)}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.expr}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      = {item.result}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// ==================== MAIN COMPONENT ====================
function MathLabRedesign({ open, onClose, user }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth 
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MathIcon sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Vyonn AI Math Lab
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              AI Tutor · Visualizations · Graphing · Calculator
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8f8ff' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 600, minWidth: 'auto', px: 2 } }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<AIIcon sx={{ fontSize: 18 }} />} label="Ask Vyonn AI" iconPosition="start" />
          <Tab icon={<GridIcon sx={{ fontSize: 18 }} />} label="Visualizations" iconPosition="start" />
          <Tab icon={<GraphIcon sx={{ fontSize: 18 }} />} label="Graph Plotter" iconPosition="start" />
          <Tab icon={<CalculateIcon sx={{ fontSize: 18 }} />} label="Calculator" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#fafafa' }}>
        {activeTab === 0 && <MathAIChat user={user} />}
        {activeTab === 1 && <MathVisualization />}
        {activeTab === 2 && <GraphPlotter />}
        {activeTab === 3 && <AdvancedCalculator />}
      </DialogContent>
    </Dialog>
  );
}

export default MathLabRedesign;

