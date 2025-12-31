import React, { useState, useCallback, useEffect, useRef } from 'react';
import VoiceInputButton from '../VoiceInputButton';
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
  useTheme,
  useMediaQuery,
  InputLabel,
  Badge,
  CardActionArea,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fade,
  LinearProgress
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
  Refresh as RefreshIcon,
  School as SchoolIcon,
  EmojiObjects as TipIcon,
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ChatBubbleOutline as ChatBubbleIcon
} from '@mui/icons-material';
import { callLLM } from '../../services/llmService';
import { markdownToHtml } from '../../utils/markdownRenderer';  // v10.4.18: Proper markdown rendering
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import * as math from 'mathjs';

// Import experiment components from original MathTools
// Note: These are internal components not exported, so we'll need to copy them or create wrapper
// For now, let's import what we can and create proper implementations

/**
 * Vyonn AI Math Lab - v2.0 with Experiments
 * Complete mathematics learning platform with AI tutor, experiments, visualizations, graphing, and calculator
 */

// ==================== VYONN MATH LOGO ====================
function VyonnMathIcon({ size = 40 }) {
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
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(25,118,210,0.4)'
          }}
        >
          <MathIcon sx={{ fontSize: size * 0.3, color: 'white' }} />
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

// ==================== EXPERIMENTS DATA ====================
const EXPERIMENTS = {
  foundational: {
    title: "Foundational Concepts",
    subtitle: "Numbers & Basic Operations",
    color: "#4caf50",
    icon: "🌱",
    experiments: [
      {
        id: "counting",
        title: "Counting Game",
        description: "Learn to count objects from 1 to 20",
        difficulty: "Beginner",
        interactive: true
      },
      {
        id: "addition",
        title: "Addition Practice",
        description: "Master adding numbers with interactive exercises",
        difficulty: "Beginner",
        interactive: true
      },
      {
        id: "subtraction",
        title: "Subtraction Practice",
        description: "Practice subtracting numbers step by step",
        difficulty: "Beginner",
        interactive: true
      },
      {
        id: "multiplication",
        title: "Times Table Trainer",
        description: "Memorize multiplication tables 1-12",
        difficulty: "Intermediate",
        interactive: true
      },
      {
        id: "patterns",
        title: "Pattern Recognition",
        description: "Identify and complete number patterns",
        difficulty: "Beginner",
        interactive: true
      }
    ]
  },
  geometry: {
    title: "Geometry & Shapes",
    subtitle: "Visual Mathematics",
    color: "#2196f3",
    icon: "📐",
    experiments: [
      {
        id: "shapes",
        title: "Shape Explorer",
        description: "Learn about circles, squares, triangles, and more",
        difficulty: "Beginner",
        interactive: true
      },
      {
        id: "area-perimeter",
        title: "Area & Perimeter Calculator",
        description: "Calculate area and perimeter of different shapes",
        difficulty: "Intermediate",
        interactive: true
      },
      {
        id: "coordinate",
        title: "Coordinate Plotter",
        description: "Plot points on a coordinate plane",
        difficulty: "Intermediate",
        interactive: true
      }
    ]
  },
  fractions: {
    title: "Fractions & Decimals",
    subtitle: "Parts of Wholes",
    color: "#ff9800",
    icon: "🍕",
    experiments: [
      {
        id: "fractions",
        title: "Fraction Visualizer",
        description: "See fractions as visual pie charts and bars",
        difficulty: "Intermediate",
        interactive: true
      },
      {
        id: "percentage",
        title: "Percentage Calculator",
        description: "Convert between fractions, decimals, and percentages",
        difficulty: "Intermediate",
        interactive: true
      }
    ]
  },
  algebra: {
    title: "Algebra",
    subtitle: "Equations & Variables",
    color: "#9c27b0",
    icon: "🔢",
    experiments: [
      {
        id: "integers",
        title: "Integer Number Line",
        description: "Add and subtract integers on a number line",
        difficulty: "Intermediate",
        interactive: true
      },
      {
        id: "quadratic",
        title: "Quadratic Solver",
        description: "Solve quadratic equations step-by-step",
        difficulty: "Advanced",
        interactive: true
      }
    ]
  },
  trigonometry: {
    title: "Trigonometry",
    subtitle: "Angles & Triangles",
    color: "#e91e63",
    icon: "📊",
    experiments: [
      {
        id: "trigonometry",
        title: "Trig Calculator",
        description: "Calculate sine, cosine, and tangent values",
        difficulty: "Advanced",
        interactive: true
      }
    ]
  },
  advanced: {
    title: "Advanced Topics",
    subtitle: "Higher Mathematics",
    color: "#607d8b",
    icon: "🎓",
    experiments: [
      {
        id: "matrices",
        title: "Matrix Calculator",
        description: "Perform matrix operations and transformations",
        difficulty: "Advanced",
        interactive: true
      },
      {
        id: "probability",
        title: "Probability Game",
        description: "Learn probability through interactive simulations",
        difficulty: "Intermediate",
        interactive: true
      },
      {
        id: "ap",
        title: "Arithmetic Progression",
        description: "Explore sequences and series",
        difficulty: "Advanced",
        interactive: true
      }
    ]
  }
};

// ==================== EXPERIMENT COMPONENTS ====================

function CountingGame({ onComplete }) {
  const [target, setTarget] = useState(5);
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const animals = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸'];

  const generateNew = () => {
    setTarget(Math.floor(Math.random() * 10) + 1);
    setCount(0);
    setFeedback('');
  };

  useEffect(() => {
    generateNew();
  }, []);

  const checkAnswer = () => {
    if (count === target) {
      setFeedback('🎉 Perfect! You counted correctly!');
      setScore(s => s + 10);
      onComplete && onComplete(10);
      setTimeout(generateNew, 2000);
    } else {
      setFeedback(`❌ Try again! You counted ${count}, but there are ${target}`);
    }
  };

  const randomAnimal = animals[target % animals.length];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">🔢 Counting Game</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>

      <Paper sx={{ p: 3, bgcolor: '#f5f5f5', mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 2 }}>
          {[...Array(target)].map((_, i) => (
            <Typography key={i} sx={{ fontSize: 48 }}>{randomAnimal}</Typography>
          ))}
        </Box>
        <Typography variant="h6" align="center" color="primary">
          How many {randomAnimal} are there?
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Button variant="outlined" size="large" onClick={() => setCount(Math.max(0, count - 1))}>−</Button>
        <Paper sx={{ p: 2, minWidth: 100, textAlign: 'center' }}>
          <Typography variant="h2">{count}</Typography>
        </Paper>
        <Button variant="outlined" size="large" onClick={() => setCount(count + 1)}>+</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button variant="contained" fullWidth onClick={checkAnswer}>
            Check Answer
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth onClick={generateNew} startIcon={<RefreshIcon />}>
            New Round
          </Button>
        </Grid>
      </Grid>

      {feedback && (
        <Alert severity={feedback.includes('🎉') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {feedback}
        </Alert>
      )}
    </Box>
  );
}

function AdditionPractice({ onComplete }) {
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(3);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const generateNew = () => {
    setNum1(Math.floor(Math.random() * 20) + 1);
    setNum2(Math.floor(Math.random() * 20) + 1);
    setAnswer('');
    setFeedback('');
  };

  useEffect(() => {
    generateNew();
  }, []);

  const checkAnswer = () => {
    if (parseInt(answer) === num1 + num2) {
      setFeedback(`🎉 Correct! ${num1} + ${num2} = ${num1 + num2}`);
      setScore(s => s + 10);
      onComplete && onComplete(10);
      setTimeout(generateNew, 2000);
    } else {
      setFeedback(`❌ Try again! ${num1} + ${num2} = ${num1 + num2}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">➕ Addition Practice</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>
      
      <Paper sx={{ p: 4, bgcolor: '#f5f5f5', mb: 2, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 3, fontWeight: 700 }}>
          {num1} + {num2} = ?
        </Typography>
        
        <TextField
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          type="number"
          size="large"
          autoFocus
          sx={{ width: 200, '& input': { fontSize: 24, textAlign: 'center' } }}
          onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        />
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button variant="contained" fullWidth onClick={checkAnswer}>
            Check Answer
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth onClick={generateNew} startIcon={<RefreshIcon />}>
            New Problem
          </Button>
        </Grid>
      </Grid>

      {feedback && (
        <Alert severity={feedback.includes('🎉') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {feedback}
        </Alert>
      )}
    </Box>
  );
}

function SubtractionPractice({ onComplete }) {
  const [num1, setNum1] = useState(15);
  const [num2, setNum2] = useState(7);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const generateNew = () => {
    const n1 = Math.floor(Math.random() * 20) + 10;
    const n2 = Math.floor(Math.random() * n1);
    setNum1(n1);
    setNum2(n2);
    setAnswer('');
    setFeedback('');
  };

  useEffect(() => {
    generateNew();
  }, []);

  const checkAnswer = () => {
    if (parseInt(answer) === num1 - num2) {
      setFeedback(`🎉 Correct! ${num1} − ${num2} = ${num1 - num2}`);
      setScore(s => s + 10);
      onComplete && onComplete(10);
      setTimeout(generateNew, 2000);
    } else {
      setFeedback(`❌ Try again! ${num1} − ${num2} = ${num1 - num2}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">➖ Subtraction Practice</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>
      
      <Paper sx={{ p: 4, bgcolor: '#f5f5f5', mb: 2, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 3, fontWeight: 700 }}>
          {num1} − {num2} = ?
        </Typography>
        
        <TextField
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          type="number"
          autoFocus
          sx={{ width: 200, '& input': { fontSize: 24, textAlign: 'center' } }}
          onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        />
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button variant="contained" fullWidth onClick={checkAnswer}>
            Check Answer
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth onClick={generateNew} startIcon={<RefreshIcon />}>
            New Problem
          </Button>
        </Grid>
      </Grid>

      {feedback && (
        <Alert severity={feedback.includes('🎉') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {feedback}
        </Alert>
      )}
    </Box>
  );
}

function TimesTableTrainer({ onComplete }) {
  const [table, setTable] = useState(5);
  const [multiplier, setMultiplier] = useState(3);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const generateNew = () => {
    setTable(Math.floor(Math.random() * 10) + 2);
    setMultiplier(Math.floor(Math.random() * 12) + 1);
    setAnswer('');
    setFeedback('');
  };

  useEffect(() => {
    generateNew();
  }, []);

  const checkAnswer = () => {
    if (parseInt(answer) === table * multiplier) {
      setFeedback(`🎉 Correct! ${table} × ${multiplier} = ${table * multiplier}`);
      setScore(s => s + 10);
      onComplete && onComplete(10);
      setTimeout(generateNew, 2000);
    } else {
      setFeedback(`❌ Try again! ${table} × ${multiplier} = ${table * multiplier}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">✖️ Times Table Trainer</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>
      
      <Paper sx={{ p: 4, bgcolor: '#f5f5f5', mb: 2, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 3, fontWeight: 700 }}>
          {table} × {multiplier} = ?
        </Typography>
        
        <TextField
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          type="number"
          autoFocus
          sx={{ width: 200, '& input': { fontSize: 24, textAlign: 'center' } }}
          onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        />
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button variant="contained" fullWidth onClick={checkAnswer}>
            Check Answer
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth onClick={generateNew} startIcon={<RefreshIcon />}>
            New Problem
          </Button>
        </Grid>
      </Grid>

      {feedback && (
        <Alert severity={feedback.includes('🎉') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {feedback}
        </Alert>
      )}
    </Box>
  );
}

function PatternGame({ onComplete }) {
  const [pattern, setPattern] = useState([2, 4, 6, 8]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const generateNew = () => {
    const start = Math.floor(Math.random() * 10) + 1;
    const step = Math.floor(Math.random() * 5) + 1;
    setPattern([start, start + step, start + 2*step, start + 3*step]);
    setAnswer('');
    setFeedback('');
  };

  useEffect(() => {
    generateNew();
  }, []);

  const checkAnswer = () => {
    const nextNumber = pattern[pattern.length - 1] + (pattern[1] - pattern[0]);
    if (parseInt(answer) === nextNumber) {
      setFeedback(`🎉 Correct! The next number is ${nextNumber}`);
      setScore(s => s + 10);
      onComplete && onComplete(10);
      setTimeout(generateNew, 2000);
    } else {
      setFeedback(`❌ Try again! The pattern increases by ${pattern[1] - pattern[0]}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">🔢 Pattern Recognition</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Find the next number in the pattern:
      </Typography>

      <Paper sx={{ p: 3, bgcolor: '#f5f5f5', mb: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
          {pattern.map((num, i) => (
            <Paper key={i} sx={{ p: 2, minWidth: 60, bgcolor: 'white' }}>
              <Typography variant="h4">{num}</Typography>
            </Paper>
          ))}
          <Paper sx={{ p: 2, minWidth: 60, bgcolor: 'white', border: '2px dashed #1976d2' }}>
            <Typography variant="h4" color="primary">?</Typography>
          </Paper>
        </Box>
        
        <TextField
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Next number"
          type="number"
          autoFocus
          sx={{ width: 200, '& input': { fontSize: 24, textAlign: 'center' } }}
          onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        />
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button variant="contained" fullWidth onClick={checkAnswer}>
            Check Answer
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth onClick={generateNew} startIcon={<RefreshIcon />}>
            New Pattern
          </Button>
        </Grid>
      </Grid>

      {feedback && (
        <Alert severity={feedback.includes('🎉') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {feedback}
        </Alert>
      )}
    </Box>
  );
}

// Simpler implementations for other experiments
function ShapeExplorer({ onComplete }) {
  const [selectedShape, setSelectedShape] = useState(null);
  
  const shapes = [
    { id: 'circle', name: 'Circle', icon: '⭕', sides: 0, properties: 'Infinite sides, all points equidistant from center' },
    { id: 'triangle', name: 'Triangle', icon: '🔺', sides: 3, properties: 'Sum of angles = 180°' },
    { id: 'square', name: 'Square', icon: '🟦', sides: 4, properties: 'All sides equal, all angles 90°' },
    { id: 'rectangle', name: 'Rectangle', icon: '▭', sides: 4, properties: 'Opposite sides equal, all angles 90°' },
    { id: 'pentagon', name: 'Pentagon', icon: '⬠', sides: 5, properties: 'Sum of angles = 540°' },
    { id: 'hexagon', name: 'Hexagon', icon: '⬡', sides: 6, properties: 'Sum of angles = 720°' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Shape Explorer</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Learn about different geometric shapes and their properties
      </Typography>

      <Grid container spacing={2}>
        {shapes.map((shape) => (
          <Grid item xs={6} sm={4} key={shape.id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                border: selectedShape === shape.id ? '2px solid #2196f3' : 'none',
                '&:hover': { boxShadow: 4 } 
              }}
              onClick={() => setSelectedShape(shape.id)}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h2">{shape.icon}</Typography>
                <Typography variant="h6">{shape.name}</Typography>
                <Chip label={`${shape.sides || 'Infinite'} sides`} size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedShape && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: '#e3f2fd' }}>
          <Typography variant="h6" gutterBottom>
            {shapes.find(s => s.id === selectedShape)?.name}
          </Typography>
          <Typography variant="body1">
            {shapes.find(s => s.id === selectedShape)?.properties}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function AreaPerimeterCalculator({ onComplete }) {
  const [shape, setShape] = useState('square');
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(5);
  const [radius, setRadius] = useState(5);
  const [result, setResult] = useState(null);

  const calculate = () => {
    let area, perimeter;
    switch (shape) {
      case 'square':
        area = length * length;
        perimeter = 4 * length;
        break;
      case 'rectangle':
        area = length * width;
        perimeter = 2 * (length + width);
        break;
      case 'circle':
        area = Math.PI * radius * radius;
        perimeter = 2 * Math.PI * radius;
        break;
      default:
        area = 0;
        perimeter = 0;
    }
    setResult({ area: area.toFixed(2), perimeter: perimeter.toFixed(2) });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Area & Perimeter Calculator</Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Shape</InputLabel>
        <Select value={shape} onChange={(e) => { setShape(e.target.value); setResult(null); }}>
          <MenuItem value="square">Square</MenuItem>
          <MenuItem value="rectangle">Rectangle</MenuItem>
          <MenuItem value="circle">Circle</MenuItem>
        </Select>
      </FormControl>

      <Paper sx={{ p: 3, mb: 3 }}>
        {shape === 'square' && (
          <Box>
            <Typography variant="body2" gutterBottom>Side Length</Typography>
            <Slider
              value={length}
              onChange={(e, v) => { setLength(v); setResult(null); }}
              min={1}
              max={20}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        )}
        {shape === 'rectangle' && (
          <Box>
            <Typography variant="body2" gutterBottom>Length</Typography>
            <Slider
              value={length}
              onChange={(e, v) => { setLength(v); setResult(null); }}
              min={1}
              max={20}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" gutterBottom>Width</Typography>
            <Slider
              value={width}
              onChange={(e, v) => { setWidth(v); setResult(null); }}
              min={1}
              max={20}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        )}
        {shape === 'circle' && (
          <Box>
            <Typography variant="body2" gutterBottom>Radius</Typography>
            <Slider
              value={radius}
              onChange={(e, v) => { setRadius(v); setResult(null); }}
              min={1}
              max={20}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        )}
      </Paper>

      <Button variant="contained" fullWidth onClick={calculate} sx={{ mb: 2 }}>
        Calculate
      </Button>

      {result && (
        <Paper sx={{ p: 3, bgcolor: '#e8f5e9' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h6" color="primary">Area</Typography>
              <Typography variant="h4">{result.area}</Typography>
              <Typography variant="caption">square units</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" color="secondary">Perimeter</Typography>
              <Typography variant="h4">{result.perimeter}</Typography>
              <Typography variant="caption">units</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

function CoordinatePlotter({ onComplete }) {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>Coordinate Plotter</Typography>
      <Alert severity="info">Coming Soon: Plot points on coordinate plane</Alert>
    </Box>
  );
}

function FractionVisualizer({ onComplete }) {
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(4);

  const percentage = ((numerator / denominator) * 100).toFixed(1);
  const decimal = (numerator / denominator).toFixed(3);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Fraction Visualizer</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h3" align="center" color="primary">
          {numerator} / {denominator}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          = {decimal} = {percentage}%
        </Typography>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>Numerator (top number)</Typography>
        <Slider
          value={numerator}
          onChange={(e, v) => setNumerator(v)}
          min={0}
          max={denominator}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>Denominator (bottom number)</Typography>
        <Slider
          value={denominator}
          onChange={(e, v) => setDenominator(v)}
          min={1}
          max={12}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>Visual Representation</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {[...Array(denominator)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 40,
                height: 40,
                bgcolor: i < numerator ? '#4caf50' : '#e0e0e0',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: i < numerator ? 'white' : 'text.secondary',
                fontWeight: 'bold'
              }}
            >
              {i + 1}
            </Box>
          ))}
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
          {numerator} out of {denominator} parts are filled ({percentage}%)
        </Typography>
      </Paper>
    </Box>
  );
}

function PercentageCalculator({ onComplete }) {
  const [value, setValue] = useState(50);
  
  const fraction = `${value}/100`;
  const decimal = (value / 100).toFixed(2);
  const simplified = () => {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(value, 100);
    return `${value / divisor}/${100 / divisor}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Percentage Calculator</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h3" align="center" color="primary">
          {value}%
        </Typography>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>Adjust Percentage</Typography>
        <Slider
          value={value}
          onChange={(e, v) => setValue(v)}
          min={0}
          max={100}
          marks={[
            { value: 0, label: '0%' },
            { value: 25, label: '25%' },
            { value: 50, label: '50%' },
            { value: 75, label: '75%' },
            { value: 100, label: '100%' }
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="caption" color="text.secondary">As Fraction</Typography>
            <Typography variant="h6">{simplified()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
            <Typography variant="caption" color="text.secondary">As Decimal</Typography>
            <Typography variant="h6">{decimal}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="caption" color="text.secondary">As Percent</Typography>
            <Typography variant="h6">{value}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>Remember:</strong> Percentage means "per hundred". {value}% = {value}/100
      </Alert>
    </Box>
  );
}

function IntegerNumberLine({ onComplete }) {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>Integer Number Line</Typography>
      <Alert severity="info">Coming Soon: Add and subtract integers on number line</Alert>
    </Box>
  );
}

function QuadraticSolver({ onComplete }) {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>Quadratic Solver</Typography>
      <Alert severity="info">Coming Soon: Solve quadratic equations step-by-step</Alert>
    </Box>
  );
}

function TrigCalculator({ onComplete }) {
  const [problemType, setProblemType] = useState('basic-trig');
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [useDegrees, setUseDegrees] = useState(true);
  const [lengthUnit, setLengthUnit] = useState('meters');

  const lengthUnits = [
    { value: 'meters', label: 'm', name: 'meters' },
    { value: 'centimeters', label: 'cm', name: 'centimeters' },
    { value: 'kilometers', label: 'km', name: 'kilometers' },
    { value: 'feet', label: 'ft', name: 'feet' },
    { value: 'inches', label: 'in', name: 'inches' },
    { value: 'yards', label: 'yd', name: 'yards' },
    { value: 'miles', label: 'mi', name: 'miles' }
  ];

  const getUnitLabel = () => lengthUnits.find(u => u.value === lengthUnit)?.label || 'm';

  const problemTypes = [
    { 
      category: '📊 Basic Functions',
      problems: [
        { id: 'basic-trig', name: 'Calculate sin, cos, tan', inputs: ['angle'] },
        { id: 'inverse-trig', name: 'Find angle (inverse)', inputs: ['value', 'function'] }
      ]
    },
    { 
      category: '📐 Right Triangle Solver',
      problems: [
        { id: 'two-sides', name: 'Two sides → Find third', inputs: ['side1', 'side2', 'sides'] },
        { id: 'side-angle', name: 'Side + angle → Find others', inputs: ['side', 'angle', 'known'] },
        { id: 'hyp-side', name: 'Hypotenuse + side → Find angle', inputs: ['hypotenuse', 'side', 'which'] }
      ]
    },
    { 
      category: '🏗️ Real-World Problems',
      problems: [
        { id: 'elevation', name: 'Angle of elevation/depression', inputs: ['height', 'distance'] },
        { id: 'shadow', name: 'Height from shadow', inputs: ['shadow', 'sunAngle'] },
        { id: 'distance-calc', name: 'Distance to object', inputs: ['height', 'angle'] }
      ]
    },
    { 
      category: '🔺 General Triangle',
      problems: [
        { id: 'law-sines-aas', name: 'Law of Sines (2 angles + 1 side)', inputs: ['angleA', 'angleB', 'sideA'] },
        { id: 'law-cosines-sas', name: 'Law of Cosines (2 sides + angle)', inputs: ['sideA', 'sideB', 'angleC'] },
        { id: 'law-cosines-sss', name: 'Law of Cosines (3 sides)', inputs: ['sideA', 'sideB', 'sideC'] }
      ]
    },
    { 
      category: '🧮 Special Tools',
      problems: [
        { id: 'triangle-area', name: 'Triangle area (trig)', inputs: ['sideA', 'sideB', 'angleC'] },
        { id: 'deg-rad', name: 'Degrees ↔ Radians', inputs: ['value', 'from'] },
        { id: 'verify-identity', name: 'Verify Pythagorean identity', inputs: ['angle'] }
      ]
    }
  ];

  const toRadians = (deg) => deg * Math.PI / 180;
  const toDegrees = (rad) => rad * 180 / Math.PI;

  const calculate = () => {
    let solution = null;
    const unit = getUnitLabel();

    try {
      switch(problemType) {
        case 'basic-trig':
          const angle = parseFloat(inputs.angle);
          const rad = useDegrees ? toRadians(angle) : angle;
          solution = {
            title: `Trigonometric Values at ${useDegrees ? angle + '°' : angle + ' rad'}`,
            steps: [
              `Given angle: ${useDegrees ? angle + '°' : angle + ' rad'}`,
              useDegrees ? `Convert to radians: ${rad.toFixed(4)} rad` : `Using radians directly`,
              ``,
              `sin(θ) = ${Math.sin(rad).toFixed(6)}`,
              `cos(θ) = ${Math.cos(rad).toFixed(6)}`,
              `tan(θ) = ${Math.abs(Math.tan(rad)) < 1000 ? Math.tan(rad).toFixed(6) : '∞ (undefined)'}`,
              ``,
              `Reciprocal functions:`,
              `csc(θ) = 1/sin(θ) = ${Math.abs(1/Math.sin(rad)) < 1000 ? (1/Math.sin(rad)).toFixed(6) : '∞'}`,
              `sec(θ) = 1/cos(θ) = ${Math.abs(1/Math.cos(rad)) < 1000 ? (1/Math.cos(rad)).toFixed(6) : '∞'}`,
              `cot(θ) = 1/tan(θ) = ${Math.abs(1/Math.tan(rad)) < 1000 ? (1/Math.tan(rad)).toFixed(6) : '∞'}`
            ]
          };
          break;

        case 'inverse-trig':
          const val = parseFloat(inputs.value);
          const func = inputs.function || 'sin';
          let angleResult;
          if (func === 'sin') angleResult = Math.asin(val);
          else if (func === 'cos') angleResult = Math.acos(val);
          else angleResult = Math.atan(val);
          
          solution = {
            title: `Inverse ${func.toUpperCase()}`,
            steps: [
              `Given: ${func}(θ) = ${val}`,
              ``,
              `θ = ${func}⁻¹(${val})`,
              `θ = ${toDegrees(angleResult).toFixed(4)}° or ${angleResult.toFixed(4)} rad`,
              ``,
              `Note: This is the principal value.`,
              func === 'sin' || func === 'cos' ? `Other solutions in [0°, 360°]: ${(180 - toDegrees(angleResult)).toFixed(2)}°` : ''
            ].filter(Boolean)
          };
          break;

        case 'two-sides':
          const s1 = parseFloat(inputs.side1);
          const s2 = parseFloat(inputs.side2);
          const sidesType = inputs.sides || 'adj-opp';
          
          if (sidesType === 'adj-opp') {
            const hyp = Math.sqrt(s1*s1 + s2*s2);
            const angleA = toDegrees(Math.atan(s2/s1));
            const angleB = 90 - angleA;
            solution = {
              title: 'Right Triangle: Given Adjacent & Opposite',
              steps: [
                `Given: Adjacent = ${s1} ${unit}, Opposite = ${s2} ${unit}`,
                ``,
                `Using Pythagorean theorem:`,
                `Hypotenuse² = Adjacent² + Opposite²`,
                `Hypotenuse² = (${s1} ${unit})² + (${s2} ${unit})² = ${(s1*s1).toFixed(2)} + ${(s2*s2).toFixed(2)} = ${(s1*s1 + s2*s2).toFixed(2)} ${unit}²`,
                `Hypotenuse = √${(s1*s1 + s2*s2).toFixed(2)} = ${hyp.toFixed(4)} ${unit}`,
                ``,
                `Finding angles:`,
                `tan(A) = Opposite/Adjacent = ${s2}/${s1} = ${(s2/s1).toFixed(4)}`,
                `Angle A = tan⁻¹(${(s2/s1).toFixed(4)}) = ${angleA.toFixed(2)}°`,
                `Angle B = 90° - ${angleA.toFixed(2)}° = ${angleB.toFixed(2)}°`
              ]
            };
          }
          break;

        case 'side-angle':
          const knownSide = parseFloat(inputs.side);
          const knownAngle = parseFloat(inputs.angle);
          const knownType = inputs.known || 'adj-angle';
          const angleRad = useDegrees ? toRadians(knownAngle) : knownAngle;
          
          if (knownType === 'adj-angle') {
            const opp = knownSide * Math.tan(angleRad);
            const hyp = knownSide / Math.cos(angleRad);
            const otherAngle = 90 - (useDegrees ? knownAngle : toDegrees(angleRad));
            solution = {
              title: 'Right Triangle: Given Adjacent & Angle',
              steps: [
                `Given: Adjacent = ${knownSide} ${unit}, Angle = ${useDegrees ? knownAngle + '°' : knownAngle + ' rad'}`,
                ``,
                `tan(θ) = Opposite/Adjacent`,
                `Opposite = Adjacent × tan(θ) = ${knownSide} ${unit} × tan(${useDegrees ? knownAngle + '°' : knownAngle}) = ${opp.toFixed(4)} ${unit}`,
                ``,
                `cos(θ) = Adjacent/Hypotenuse`,
                `Hypotenuse = Adjacent/cos(θ) = ${knownSide} ${unit}/cos(${useDegrees ? knownAngle + '°' : knownAngle}) = ${hyp.toFixed(4)} ${unit}`,
                ``,
                `Other angle = 90° - ${useDegrees ? knownAngle : toDegrees(angleRad).toFixed(2)}° = ${otherAngle.toFixed(2)}°`
              ]
            };
          }
          break;

        case 'hyp-side':
          const hypotenuse = parseFloat(inputs.hypotenuse);
          const knownSideVal = parseFloat(inputs.side);
          const whichSide = inputs.which || 'adjacent';
          
          if (whichSide === 'adjacent') {
            const angleA = toDegrees(Math.acos(knownSideVal/hypotenuse));
            const angleB = 90 - angleA;
            const opposite = Math.sqrt(hypotenuse*hypotenuse - knownSideVal*knownSideVal);
            solution = {
              title: 'Right Triangle: Given Hypotenuse & Adjacent',
              steps: [
                `Given: Hypotenuse = ${hypotenuse} ${unit}, Adjacent = ${knownSideVal} ${unit}`,
                ``,
                `cos(A) = Adjacent/Hypotenuse = ${knownSideVal}/${hypotenuse} = ${(knownSideVal/hypotenuse).toFixed(4)}`,
                `Angle A = cos⁻¹(${(knownSideVal/hypotenuse).toFixed(4)}) = ${angleA.toFixed(2)}°`,
                `Angle B = 90° - ${angleA.toFixed(2)}° = ${angleB.toFixed(2)}°`,
                ``,
                `Using Pythagorean theorem:`,
                `Opposite = √(Hypotenuse² - Adjacent²)`,
                `Opposite = √((${hypotenuse} ${unit})² - (${knownSideVal} ${unit})²) = ${opposite.toFixed(4)} ${unit}`
              ]
            };
          }
          break;

        case 'elevation':
          const height = parseFloat(inputs.height);
          const distance = parseFloat(inputs.distance);
          const elevAngle = toDegrees(Math.atan(height/distance));
          solution = {
            title: 'Angle of Elevation',
            steps: [
              `Given: Height = ${height} ${unit}, Distance = ${distance} ${unit}`,
              ``,
              `tan(angle) = Height/Distance = ${height}/${distance} = ${(height/distance).toFixed(4)}`,
              ``,
              `Angle of elevation = tan⁻¹(${(height/distance).toFixed(4)})`,
              `Angle = ${elevAngle.toFixed(2)}°`,
              ``,
              `This is the angle from the horizontal ground to the line of sight.`
            ]
          };
          break;

        case 'shadow':
          const shadowLen = parseFloat(inputs.shadow);
          const sunAngle = parseFloat(inputs.sunAngle);
          const sunRad = useDegrees ? toRadians(sunAngle) : sunAngle;
          const objHeight = shadowLen * Math.tan(sunRad);
          solution = {
            title: 'Height from Shadow',
            steps: [
              `Given: Shadow length = ${shadowLen} ${unit}, Sun angle = ${useDegrees ? sunAngle + '°' : sunAngle + ' rad'}`,
              ``,
              `tan(sun angle) = Height/Shadow`,
              `Height = Shadow × tan(angle)`,
              `Height = ${shadowLen} ${unit} × tan(${useDegrees ? sunAngle + '°' : sunAngle}) = ${objHeight.toFixed(4)} ${unit}`,
              ``,
              `The object is ${objHeight.toFixed(2)} ${unit} tall.`
            ]
          };
          break;

        case 'distance-calc':
          const objHeight2 = parseFloat(inputs.height);
          const elevAngle2 = parseFloat(inputs.angle);
          const elevRad = useDegrees ? toRadians(elevAngle2) : elevAngle2;
          const dist = objHeight2 / Math.tan(elevRad);
          solution = {
            title: 'Distance to Object',
            steps: [
              `Given: Height = ${objHeight2} ${unit}, Elevation angle = ${useDegrees ? elevAngle2 + '°' : elevAngle2 + ' rad'}`,
              ``,
              `tan(angle) = Height/Distance`,
              `Distance = Height/tan(angle)`,
              `Distance = ${objHeight2} ${unit}/tan(${useDegrees ? elevAngle2 + '°' : elevAngle2}) = ${dist.toFixed(4)} ${unit}`,
              ``,
              `You are ${dist.toFixed(2)} ${unit} away from the object.`
            ]
          };
          break;

        case 'law-sines-aas':
          const angleA = parseFloat(inputs.angleA);
          const angleB = parseFloat(inputs.angleB);
          const sideA = parseFloat(inputs.sideA);
          const angleC = 180 - angleA - angleB;
          const sideB = sideA * Math.sin(toRadians(angleB)) / Math.sin(toRadians(angleA));
          const sideC = sideA * Math.sin(toRadians(angleC)) / Math.sin(toRadians(angleA));
          solution = {
            title: 'Law of Sines (AAS)',
            steps: [
              `Given: Angle A = ${angleA}°, Angle B = ${angleB}°, Side a = ${sideA} ${unit}`,
              ``,
              `Find Angle C:`,
              `Angle C = 180° - A - B = 180° - ${angleA}° - ${angleB}° = ${angleC.toFixed(2)}°`,
              ``,
              `Law of Sines: a/sin(A) = b/sin(B) = c/sin(C)`,
              ``,
              `Find Side b:`,
              `b = a × sin(B)/sin(A) = ${sideA} ${unit} × sin(${angleB}°)/sin(${angleA}°) = ${sideB.toFixed(4)} ${unit}`,
              ``,
              `Find Side c:`,
              `c = a × sin(C)/sin(A) = ${sideA} ${unit} × sin(${angleC.toFixed(2)}°)/sin(${angleA}°) = ${sideC.toFixed(4)} ${unit}`
            ]
          };
          break;

        case 'law-cosines-sas':
          const a = parseFloat(inputs.sideA);
          const b = parseFloat(inputs.sideB);
          const C = parseFloat(inputs.angleC);
          const c = Math.sqrt(a*a + b*b - 2*a*b*Math.cos(toRadians(C)));
          const A = toDegrees(Math.acos((b*b + c*c - a*a)/(2*b*c)));
          const B = 180 - A - C;
          solution = {
            title: 'Law of Cosines (SAS)',
            steps: [
              `Given: Side a = ${a} ${unit}, Side b = ${b} ${unit}, Angle C = ${C}°`,
              ``,
              `Law of Cosines: c² = a² + b² - 2ab·cos(C)`,
              `c² = (${a} ${unit})² + (${b} ${unit})² - 2(${a})(${b})·cos(${C}°)`,
              `c² = ${(a*a).toFixed(2)} + ${(b*b).toFixed(2)} - ${(2*a*b).toFixed(2)}·${Math.cos(toRadians(C)).toFixed(4)}`,
              `c = ${c.toFixed(4)} ${unit}`,
              ``,
              `Find Angle A using Law of Cosines:`,
              `cos(A) = (b² + c² - a²)/(2bc)`,
              `Angle A = ${A.toFixed(2)}°`,
              ``,
              `Angle B = 180° - A - C = ${B.toFixed(2)}°`
            ]
          };
          break;

        case 'law-cosines-sss':
          const sa = parseFloat(inputs.sideA);
          const sb = parseFloat(inputs.sideB);
          const sc = parseFloat(inputs.sideC);
          const angA = toDegrees(Math.acos((sb*sb + sc*sc - sa*sa)/(2*sb*sc)));
          const angB = toDegrees(Math.acos((sa*sa + sc*sc - sb*sb)/(2*sa*sc)));
          const angC = 180 - angA - angB;
          solution = {
            title: 'Law of Cosines (SSS)',
            steps: [
              `Given: Side a = ${sa} ${unit}, Side b = ${sb} ${unit}, Side c = ${sc} ${unit}`,
              ``,
              `Using Law of Cosines to find angles:`,
              ``,
              `Angle A: cos(A) = (b² + c² - a²)/(2bc)`,
              `Angle A = ${angA.toFixed(2)}°`,
              ``,
              `Angle B: cos(B) = (a² + c² - b²)/(2ac)`,
              `Angle B = ${angB.toFixed(2)}°`,
              ``,
              `Angle C = 180° - A - B = ${angC.toFixed(2)}°`
            ]
          };
          break;

        case 'triangle-area':
          const sA = parseFloat(inputs.sideA);
          const sB = parseFloat(inputs.sideB);
          const angleC_area = parseFloat(inputs.angleC);
          const area = 0.5 * sA * sB * Math.sin(toRadians(angleC_area));
          solution = {
            title: 'Triangle Area (Trigonometric)',
            steps: [
              `Given: Side a = ${sA} ${unit}, Side b = ${sB} ${unit}, Included angle C = ${angleC_area}°`,
              ``,
              `Formula: Area = ½ × a × b × sin(C)`,
              ``,
              `Area = ½ × ${sA} ${unit} × ${sB} ${unit} × sin(${angleC_area}°)`,
              `Area = ${(0.5 * sA * sB).toFixed(2)} × ${Math.sin(toRadians(angleC_area)).toFixed(4)}`,
              `Area = ${area.toFixed(4)} ${unit}²`
            ]
          };
          break;

        case 'deg-rad':
          const value = parseFloat(inputs.value);
          const from = inputs.from || 'degrees';
          if (from === 'degrees') {
            const radResult = toRadians(value);
            solution = {
              title: 'Degrees to Radians',
              steps: [
                `Given: ${value}°`,
                ``,
                `Formula: radians = degrees × (π/180)`,
                ``,
                `${value}° = ${value} × (π/180)`,
                `${value}° = ${radResult.toFixed(6)} radians`,
                `${value}° ≈ ${(radResult/Math.PI).toFixed(4)}π radians`
              ]
            };
          } else {
            const degResult = toDegrees(value);
            solution = {
              title: 'Radians to Degrees',
              steps: [
                `Given: ${value} radians`,
                ``,
                `Formula: degrees = radians × (180/π)`,
                ``,
                `${value} rad = ${value} × (180/π)`,
                `${value} rad = ${degResult.toFixed(6)}°`
              ]
            };
          }
          break;

        case 'verify-identity':
          const verifyAngle = parseFloat(inputs.angle);
          const verifyRad = useDegrees ? toRadians(verifyAngle) : verifyAngle;
          const sinVal = Math.sin(verifyRad);
          const cosVal = Math.cos(verifyRad);
          const sum = sinVal*sinVal + cosVal*cosVal;
          solution = {
            title: 'Verify: sin²(θ) + cos²(θ) = 1',
            steps: [
              `Given angle: ${useDegrees ? verifyAngle + '°' : verifyAngle + ' rad'}`,
              ``,
              `Calculate sin and cos:`,
              `sin(${useDegrees ? verifyAngle + '°' : verifyAngle}) = ${sinVal.toFixed(6)}`,
              `cos(${useDegrees ? verifyAngle + '°' : verifyAngle}) = ${cosVal.toFixed(6)}`,
              ``,
              `Verify identity:`,
              `sin²(θ) = ${sinVal.toFixed(6)}² = ${(sinVal*sinVal).toFixed(8)}`,
              `cos²(θ) = ${cosVal.toFixed(6)}² = ${(cosVal*cosVal).toFixed(8)}`,
              ``,
              `sin²(θ) + cos²(θ) = ${(sinVal*sinVal).toFixed(8)} + ${(cosVal*cosVal).toFixed(8)}`,
              `= ${sum.toFixed(10)}`,
              ``,
              `✓ Identity verified! The sum equals 1.`
            ]
          };
          break;

        default:
          solution = { title: 'Unknown Problem Type', steps: ['Please select a valid problem type.'] };
      }

      setResult(solution);
    } catch (error) {
      setResult({ 
        title: 'Error', 
        steps: ['Invalid input. Please check your values and try again.', error.message] 
      });
    }
  };

  const renderInputs = () => {
    const currentProblem = problemTypes
      .flatMap(cat => cat.problems)
      .find(p => p.id === problemType);

    if (!currentProblem) return null;

    // Check if problem involves length measurements
    const hasLengthInputs = currentProblem.inputs.some(i => 
      ['side1', 'side2', 'side', 'hypotenuse', 'height', 'distance', 'shadow', 
       'sideA', 'sideB', 'sideC'].includes(i)
    );

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Unit Selector for Length Measurements */}
        {hasLengthInputs && (
          <FormControl fullWidth>
            <InputLabel>Length Unit</InputLabel>
            <Select
              value={lengthUnit}
              onChange={(e) => setLengthUnit(e.target.value)}
              label="Length Unit"
            >
              {lengthUnits.map(u => (
                <MenuItem key={u.value} value={u.value}>
                  {u.name} ({u.label})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Angle input with unit selector */}
        {currentProblem.inputs.includes('angle') && (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <TextField
                label="Angle"
                type="number"
                fullWidth
                value={inputs.angle || ''}
                onChange={(e) => setInputs({...inputs, angle: e.target.value})}
              />
              <ToggleButtonGroup
                value={useDegrees ? 'degrees' : 'radians'}
                exclusive
                onChange={(e, val) => val && setUseDegrees(val === 'degrees')}
                size="small"
              >
                <ToggleButton value="degrees">°</ToggleButton>
                <ToggleButton value="radians">rad</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        )}

        {/* Other numeric inputs */}
        {currentProblem.inputs.filter(i => !['angle', 'function', 'sides', 'known', 'which', 'from'].includes(i)).map(input => {
          const isLengthInput = ['side1', 'side2', 'side', 'hypotenuse', 'height', 
                                  'distance', 'shadow', 'sideA', 'sideB', 'sideC'].includes(input);
          
          return (
            <TextField
              key={input}
              label={input.charAt(0).toUpperCase() + input.slice(1).replace(/([A-Z])/g, ' $1')}
              type="number"
              fullWidth
              value={inputs[input] || ''}
              onChange={(e) => setInputs({...inputs, [input]: e.target.value})}
              InputProps={isLengthInput ? {
                endAdornment: <InputAdornment position="end">{getUnitLabel()}</InputAdornment>
              } : undefined}
            />
          );
        })}

        {/* Function selector for inverse trig */}
        {currentProblem.inputs.includes('function') && (
          <FormControl fullWidth>
            <InputLabel>Function</InputLabel>
            <Select
              value={inputs.function || 'sin'}
              onChange={(e) => setInputs({...inputs, function: e.target.value})}
              label="Function"
            >
              <MenuItem value="sin">sin</MenuItem>
              <MenuItem value="cos">cos</MenuItem>
              <MenuItem value="tan">tan</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Sides selector */}
        {currentProblem.inputs.includes('sides') && (
          <FormControl fullWidth>
            <InputLabel>Which Sides?</InputLabel>
            <Select
              value={inputs.sides || 'adj-opp'}
              onChange={(e) => setInputs({...inputs, sides: e.target.value})}
              label="Which Sides?"
            >
              <MenuItem value="adj-opp">Adjacent & Opposite</MenuItem>
              <MenuItem value="adj-hyp">Adjacent & Hypotenuse</MenuItem>
              <MenuItem value="opp-hyp">Opposite & Hypotenuse</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Known type selector */}
        {currentProblem.inputs.includes('known') && (
          <FormControl fullWidth>
            <InputLabel>Known Values</InputLabel>
            <Select
              value={inputs.known || 'adj-angle'}
              onChange={(e) => setInputs({...inputs, known: e.target.value})}
              label="Known Values"
            >
              <MenuItem value="adj-angle">Adjacent & Angle</MenuItem>
              <MenuItem value="opp-angle">Opposite & Angle</MenuItem>
              <MenuItem value="hyp-angle">Hypotenuse & Angle</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Which side selector */}
        {currentProblem.inputs.includes('which') && (
          <FormControl fullWidth>
            <InputLabel>Known Side</InputLabel>
            <Select
              value={inputs.which || 'adjacent'}
              onChange={(e) => setInputs({...inputs, which: e.target.value})}
              label="Known Side"
            >
              <MenuItem value="adjacent">Adjacent</MenuItem>
              <MenuItem value="opposite">Opposite</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* From unit selector */}
        {currentProblem.inputs.includes('from') && (
          <FormControl fullWidth>
            <InputLabel>Convert From</InputLabel>
            <Select
              value={inputs.from || 'degrees'}
              onChange={(e) => setInputs({...inputs, from: e.target.value})}
              label="Convert From"
            >
              <MenuItem value="degrees">Degrees</MenuItem>
              <MenuItem value="radians">Radians</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📐 Trigonometry Calculator
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Solve trigonometry problems with step-by-step solutions
      </Typography>

      <Grid container spacing={3}>
        {/* Left: Problem Selector */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Select Problem Type:
            </Typography>
            {problemTypes.map((category) => (
              <Box key={category.category} sx={{ mb: 2 }}>
                <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                  {category.category}
                </Typography>
                {category.problems.map((prob) => (
                  <Chip
                    key={prob.id}
                    label={prob.name}
                    onClick={() => {
                      setProblemType(prob.id);
                      setInputs({});
                      setResult(null);
                    }}
                    color={problemType === prob.id ? 'primary' : 'default'}
                    sx={{ 
                      mr: 0.5, 
                      mb: 0.5, 
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                    size="small"
                  />
                ))}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Right: Inputs and Results */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {problemTypes.flatMap(c => c.problems).find(p => p.id === problemType)?.name || 'Select a problem'}
            </Typography>
            
            {renderInputs()}

            <Button
              variant="contained"
              fullWidth
              onClick={calculate}
              sx={{ mt: 3 }}
              size="large"
            >
              Calculate
            </Button>

            {result && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">{result.title}</Typography>
                </Alert>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                    Step-by-Step Solution:
                  </Typography>
                  {result.steps.map((step, idx) => (
                    <Typography 
                      key={idx} 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        mb: 0.5,
                        fontWeight: step.includes('=') || step.includes(':') ? 'bold' : 'normal',
                        color: step.includes('✓') ? '#4caf50' : 'inherit'
                      }}
                    >
                      {step || '\u00A0'}
                    </Typography>
                  ))}
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function MatrixCalculator({ onComplete }) {
  const [operation, setOperation] = useState('add');
  const [matrixARows, setMatrixARows] = useState(3);
  const [matrixACols, setMatrixACols] = useState(3);
  const [matrixBRows, setMatrixBRows] = useState(3);
  const [matrixBCols, setMatrixBCols] = useState(3);
  const [matrixA, setMatrixA] = useState(Array(3).fill().map(() => Array(3).fill(0)));
  const [matrixB, setMatrixB] = useState(Array(3).fill().map(() => Array(3).fill(0)));
  const [result, setResult] = useState(null);
  const [showSteps, setShowSteps] = useState(true);

  const operations = [
    { id: 'add', name: '➕ Addition', needsTwo: true, desc: 'A + B' },
    { id: 'subtract', name: '➖ Subtraction', needsTwo: true, desc: 'A - B' },
    { id: 'multiply', name: '✖️ Multiplication', needsTwo: true, desc: 'A × B' },
    { id: 'scalar', name: '🔢 Scalar Multiply', needsTwo: false, desc: 'k × A' },
    { id: 'transpose', name: '↔️ Transpose', needsTwo: false, desc: 'Aᵀ' },
    { id: 'determinant', name: '🔍 Determinant', needsTwo: false, desc: 'det(A)' },
    { id: 'inverse', name: '⁻¹ Inverse', needsTwo: false, desc: 'A⁻¹' },
    { id: 'rank', name: '📊 Rank', needsTwo: false, desc: 'rank(A)' },
    { id: 'trace', name: '〰️ Trace', needsTwo: false, desc: 'tr(A)' },
    { id: 'rref', name: '📐 RREF', needsTwo: false, desc: 'Reduced Row Echelon' },
    { id: 'eigenvalues', name: '🎯 Eigenvalues', needsTwo: false, desc: 'λ values' },
    { id: 'power', name: '^ Power', needsTwo: false, desc: 'A^n' }
  ];

  // Initialize matrix when size changes
  useEffect(() => {
    setMatrixA(Array(matrixARows).fill().map(() => Array(matrixACols).fill(0)));
  }, [matrixARows, matrixACols]);

  useEffect(() => {
    setMatrixB(Array(matrixBRows).fill().map(() => Array(matrixBCols).fill(0)));
  }, [matrixBRows, matrixBCols]);

  const updateMatrixCell = (matrix, setMatrix, row, col, value) => {
    const newMatrix = matrix.map((r, i) => 
      i === row ? r.map((c, j) => j === col ? parseFloat(value) || 0 : c) : r
    );
    setMatrix(newMatrix);
  };

  const fillMatrix = (setMatrix, rows, cols, type) => {
    let newMatrix;
    if (type === 'identity') {
      newMatrix = Array(rows).fill().map((_, i) => 
        Array(cols).fill().map((_, j) => i === j ? 1 : 0)
      );
    } else if (type === 'zero') {
      newMatrix = Array(rows).fill().map(() => Array(cols).fill(0));
    } else if (type === 'random') {
      newMatrix = Array(rows).fill().map(() => 
        Array(cols).fill().map(() => Math.floor(Math.random() * 10))
      );
    }
    setMatrix(newMatrix);
  };

  // Matrix operations
  const addMatrices = (a, b) => {
    if (a.length !== b.length || a[0].length !== b[0].length) {
      throw new Error('Matrices must have the same dimensions for addition');
    }
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
  };

  const subtractMatrices = (a, b) => {
    if (a.length !== b.length || a[0].length !== b[0].length) {
      throw new Error('Matrices must have the same dimensions for subtraction');
    }
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
  };

  const multiplyMatrices = (a, b) => {
    if (a[0].length !== b.length) {
      throw new Error('Matrix A columns must equal Matrix B rows');
    }
    const result = Array(a.length).fill().map(() => Array(b[0].length).fill(0));
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b[0].length; j++) {
        for (let k = 0; k < a[0].length; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  };

  const scalarMultiply = (matrix, scalar) => {
    return matrix.map(row => row.map(val => val * scalar));
  };

  const transpose = (matrix) => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  };

  const determinant = (matrix) => {
    const n = matrix.length;
    if (n !== matrix[0].length) {
      throw new Error('Matrix must be square to calculate determinant');
    }
    
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    
    let det = 0;
    for (let j = 0; j < n; j++) {
      const minor = matrix.slice(1).map(row => row.filter((_, colIdx) => colIdx !== j));
      det += Math.pow(-1, j) * matrix[0][j] * determinant(minor);
    }
    return det;
  };

  const getCofactorMatrix = (matrix, row, col) => {
    return matrix
      .filter((_, i) => i !== row)
      .map(r => r.filter((_, j) => j !== col));
  };

  const inverse = (matrix) => {
    const det = determinant(matrix);
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is singular (determinant = 0), inverse does not exist');
    }
    
    const n = matrix.length;
    if (n === 2) {
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];
    }
    
    // Calculate adjugate matrix
    const cofactors = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const minor = getCofactorMatrix(matrix, i, j);
        cofactors[i][j] = Math.pow(-1, i + j) * determinant(minor);
      }
    }
    
    const adjugate = transpose(cofactors);
    return adjugate.map(row => row.map(val => val / det));
  };

  const trace = (matrix) => {
    if (matrix.length !== matrix[0].length) {
      throw new Error('Matrix must be square to calculate trace');
    }
    return matrix.reduce((sum, row, i) => sum + row[i], 0);
  };

  const rref = (matrix) => {
    const result = matrix.map(row => [...row]);
    const rows = result.length;
    const cols = result[0].length;
    let lead = 0;
    
    for (let r = 0; r < rows; r++) {
      if (lead >= cols) break;
      
      let i = r;
      while (Math.abs(result[i][lead]) < 1e-10) {
        i++;
        if (i === rows) {
          i = r;
          lead++;
          if (lead === cols) return result;
        }
      }
      
      [result[i], result[r]] = [result[r], result[i]];
      
      const lv = result[r][lead];
      result[r] = result[r].map(val => val / lv);
      
      for (let i = 0; i < rows; i++) {
        if (i !== r) {
          const lv = result[i][lead];
          result[i] = result[i].map((val, j) => val - lv * result[r][j]);
        }
      }
      lead++;
    }
    
    return result;
  };

  const rank = (matrix) => {
    const rrefMatrix = rref(matrix);
    let rank = 0;
    for (let row of rrefMatrix) {
      if (row.some(val => Math.abs(val) > 1e-10)) {
        rank++;
      }
    }
    return rank;
  };

  const matrixPower = (matrix, n) => {
    if (matrix.length !== matrix[0].length) {
      throw new Error('Matrix must be square for power operation');
    }
    if (n === 0) {
      return Array(matrix.length).fill().map((_, i) => 
        Array(matrix.length).fill().map((_, j) => i === j ? 1 : 0)
      );
    }
    if (n === 1) return matrix;
    
    let result = matrix;
    for (let i = 1; i < n; i++) {
      result = multiplyMatrices(result, matrix);
    }
    return result;
  };

  const eigenvalues2x2 = (matrix) => {
    // For 2x2 matrix: characteristic equation λ² - tr(A)λ + det(A) = 0
    const a = matrix[0][0];
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1];
    
    const tr = a + d;
    const det = a * d - b * c;
    
    const discriminant = tr * tr - 4 * det;
    if (discriminant < 0) {
      const real = tr / 2;
      const imag = Math.sqrt(-discriminant) / 2;
      return [`${real.toFixed(4)} + ${imag.toFixed(4)}i`, `${real.toFixed(4)} - ${imag.toFixed(4)}i`];
    }
    
    const lambda1 = (tr + Math.sqrt(discriminant)) / 2;
    const lambda2 = (tr - Math.sqrt(discriminant)) / 2;
    return [lambda1.toFixed(6), lambda2.toFixed(6)];
  };

  const calculate = () => {
    try {
      let resultMatrix = null;
      let steps = [];
      let resultValue = null;

      switch(operation) {
        case 'add':
          resultMatrix = addMatrices(matrixA, matrixB);
          steps = [
            'Matrix Addition: A + B',
            'Add corresponding elements:',
            `Result[i][j] = A[i][j] + B[i][j]`
          ];
          break;

        case 'subtract':
          resultMatrix = subtractMatrices(matrixA, matrixB);
          steps = [
            'Matrix Subtraction: A - B',
            'Subtract corresponding elements:',
            `Result[i][j] = A[i][j] - B[i][j]`
          ];
          break;

        case 'multiply':
          resultMatrix = multiplyMatrices(matrixA, matrixB);
          steps = [
            'Matrix Multiplication: A × B',
            `Dimensions: (${matrixA.length}×${matrixA[0].length}) × (${matrixB.length}×${matrixB[0].length})`,
            `Result will be: ${matrixA.length}×${matrixB[0].length}`,
            '',
            'For each element Result[i][j]:',
            'Sum of (Row i of A) × (Column j of B)'
          ];
          break;

        case 'scalar':
          const scalar = parseFloat(prompt('Enter scalar value:')) || 2;
          resultMatrix = scalarMultiply(matrixA, scalar);
          steps = [
            `Scalar Multiplication: ${scalar} × A`,
            'Multiply each element by the scalar:',
            `Result[i][j] = ${scalar} × A[i][j]`
          ];
          break;

        case 'transpose':
          resultMatrix = transpose(matrixA);
          steps = [
            'Transpose: Aᵀ',
            'Swap rows and columns:',
            'Aᵀ[i][j] = A[j][i]',
            `Original: ${matrixA.length}×${matrixA[0].length}`,
            `Transposed: ${matrixA[0].length}×${matrixA.length}`
          ];
          break;

        case 'determinant':
          resultValue = determinant(matrixA);
          steps = [
            'Determinant Calculation',
            `Matrix size: ${matrixA.length}×${matrixA[0].length}`,
            '',
            matrixA.length === 2 ? 
              'For 2×2: det(A) = ad - bc' :
              'Using cofactor expansion along first row',
            '',
            `det(A) = ${resultValue.toFixed(6)}`
          ];
          break;

        case 'inverse':
          resultMatrix = inverse(matrixA);
          const det = determinant(matrixA);
          steps = [
            'Matrix Inverse: A⁻¹',
            '',
            `Step 1: Calculate determinant`,
            `det(A) = ${det.toFixed(6)}`,
            '',
            det !== 0 ? 'Step 2: Calculate adjugate matrix' : 'Matrix is singular!',
            det !== 0 ? 'Step 3: A⁻¹ = adj(A) / det(A)' : ''
          ].filter(Boolean);
          break;

        case 'rank':
          resultValue = rank(matrixA);
          steps = [
            'Matrix Rank',
            '',
            'Step 1: Convert to RREF',
            'Step 2: Count non-zero rows',
            '',
            `Rank = ${resultValue}`
          ];
          break;

        case 'trace':
          resultValue = trace(matrixA);
          steps = [
            'Matrix Trace: tr(A)',
            '',
            'Sum of diagonal elements:',
            matrixA.map((row, i) => `tr += A[${i}][${i}] = ${row[i]}`).join('\n'),
            '',
            `Trace = ${resultValue.toFixed(6)}`
          ];
          break;

        case 'rref':
          resultMatrix = rref(matrixA);
          steps = [
            'Reduced Row Echelon Form (RREF)',
            '',
            'Process:',
            '1. Create leading 1s',
            '2. Use row operations to create zeros',
            '3. Move to next pivot column',
            '',
            'Result: RREF(A)'
          ];
          break;

        case 'eigenvalues':
          if (matrixA.length === 2 && matrixA[0].length === 2) {
            const eigenvals = eigenvalues2x2(matrixA);
            resultValue = eigenvals;
            steps = [
              'Eigenvalues (2×2 Matrix)',
              '',
              'Characteristic equation: det(A - λI) = 0',
              `λ² - tr(A)λ + det(A) = 0`,
              '',
              `Trace = ${trace(matrixA).toFixed(4)}`,
              `Determinant = ${determinant(matrixA).toFixed(4)}`,
              '',
              `λ₁ = ${eigenvals[0]}`,
              `λ₂ = ${eigenvals[1]}`
            ];
          } else {
            throw new Error('Eigenvalue calculation currently supports 2×2 matrices only');
          }
          break;

        case 'power':
          const power = parseInt(prompt('Enter power (positive integer):')) || 2;
          if (power < 0) throw new Error('Power must be non-negative');
          resultMatrix = matrixPower(matrixA, power);
          steps = [
            `Matrix Power: A^${power}`,
            '',
            power === 0 ? 'A^0 = Identity Matrix' :
            power === 1 ? 'A^1 = A' :
            `Multiply A by itself ${power} times`
          ];
          break;

        default:
          throw new Error('Unknown operation');
      }

      setResult({
        matrix: resultMatrix,
        value: resultValue,
        steps: steps,
        operation: operations.find(op => op.id === operation).name
      });

    } catch (error) {
      setResult({
        error: error.message,
        steps: ['Error: ' + error.message]
      });
    }
  };

  const renderMatrix = (matrix, title, setMatrix = null, rows, cols, canEdit = false) => (
    <Paper elevation={2} sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
          {title} ({matrix.length}×{matrix[0]?.length})
        </Typography>
        {canEdit && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <TextField
              type="number"
              size="small"
              value={rows}
              onChange={(e) => {
                const val = Math.max(1, Math.min(6, parseInt(e.target.value) || 1));
                if (title.includes('Matrix A')) setMatrixARows(val);
                else setMatrixBRows(val);
              }}
              sx={{ width: 50 }}
              inputProps={{ min: 1, max: 6, style: { padding: '4px', fontSize: '0.75rem', textAlign: 'center' } }}
            />
            <Typography sx={{ alignSelf: 'center', fontSize: '0.75rem' }}>×</Typography>
            <TextField
              type="number"
              size="small"
              value={cols}
              onChange={(e) => {
                const val = Math.max(1, Math.min(6, parseInt(e.target.value) || 1));
                if (title.includes('Matrix A')) setMatrixACols(val);
                else setMatrixBCols(val);
              }}
              sx={{ width: 50 }}
              inputProps={{ min: 1, max: 6, style: { padding: '4px', fontSize: '0.75rem', textAlign: 'center' } }}
            />
          </Box>
        )}
      </Box>
      
      {canEdit && (
        <Box sx={{ mb: 1, display: 'flex', gap: 0.5 }}>
          <Chip label="I" onClick={() => fillMatrix(setMatrix, rows, cols, 'identity')} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
          <Chip label="0" onClick={() => fillMatrix(setMatrix, rows, cols, 'zero')} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
          <Chip label="🎲" onClick={() => fillMatrix(setMatrix, rows, cols, 'random')} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
        </Box>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${matrix[0]?.length || 1}, 1fr)`,
        gap: 0.5,
        maxWidth: '100%',
        overflowX: 'auto'
      }}>
        {matrix.map((row, i) => 
          row.map((cell, j) => (
            <TextField
              key={`${i}-${j}`}
              value={cell}
              onChange={(e) => canEdit && updateMatrixCell(matrix, setMatrix, i, j, e.target.value)}
              type="number"
              size="small"
              disabled={!canEdit}
              sx={{
                '& input': {
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  padding: '6px'
                },
                '& .MuiOutlinedInput-root': {
                  minHeight: 'auto'
                }
              }}
            />
          ))
        )}
      </Box>
    </Paper>
  );

  const currentOp = operations.find(op => op.id === operation);

  return (
    <Box sx={{ height: 'calc(100vh - 280px)', overflow: 'hidden', p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        🔢 Matrix Calculator
      </Typography>

      <Grid container spacing={1.5} sx={{ height: 'calc(100% - 40px)' }}>
        {/* Left Column: Controls & Inputs */}
        <Grid item xs={12} md={5} sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Operation Selector */}
            <Paper elevation={2} sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                Operation: {currentOp?.desc}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {operations.map(op => (
                  <Chip
                    key={op.id}
                    label={op.name.split(' ')[0]}
                    onClick={() => setOperation(op.id)}
                    color={operation === op.id ? 'primary' : 'default'}
                    size="small"
                    sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Matrix A */}
            {renderMatrix(matrixA, 'Matrix A', setMatrixA, matrixARows, matrixACols, true)}

            {/* Matrix B */}
            {currentOp?.needsTwo && renderMatrix(matrixB, 'Matrix B', setMatrixB, matrixBRows, matrixBCols, true)}

            {/* Calculate Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={calculate}
              sx={{ py: 1.5 }}
            >
              Calculate
            </Button>
          </Box>
        </Grid>

        {/* Right Column: Results */}
        <Grid item xs={12} md={7} sx={{ height: '100%', overflow: 'hidden' }}>
          {result ? (
            <Paper elevation={3} sx={{ p: 2, bgcolor: result.error ? '#ffebee' : '#e8f5e9', height: '100%', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" color={result.error ? 'error' : 'success.main'}>
                  {result.error ? '❌ Error' : '✅ Result'}
                </Typography>
                <Chip
                  label={showSteps ? '📝' : '👁️'}
                  onClick={() => setShowSteps(!showSteps)}
                  size="small"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  title={showSteps ? 'Hide Steps' : 'Show Steps'}
                />
              </Box>

              {showSteps && result.steps && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" gutterBottom fontWeight="bold" color="primary">
                    Step-by-Step Solution:
                  </Typography>
                  {result.steps.map((step, idx) => (
                    <Typography key={idx} variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 0.3, fontSize: '0.75rem' }}>
                      {step || '\u00A0'}
                    </Typography>
                  ))}
                </Box>
              )}

              {result.matrix && (
                <Box sx={{ mt: 1 }}>
                  {renderMatrix(result.matrix, 'Result Matrix')}
                </Box>
              )}

              {result.value !== null && result.value !== undefined && (
                <Paper sx={{ p: 1.5, mt: 1, bgcolor: 'white' }}>
                  <Typography variant="h6" color="primary" sx={{ fontSize: '1rem' }}>
                    {Array.isArray(result.value) ? (
                      result.value.map((val, idx) => (
                        <div key={idx}>λ{idx + 1} = {val}</div>
                      ))
                    ) : (
                      `Result: ${typeof result.value === 'number' ? result.value.toFixed(6) : result.value}`
                    )}
                  </Typography>
                </Paper>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ opacity: 0.3, mb: 2 }}>🔢</Typography>
                <Typography variant="h6" color="text.secondary">
                  Select operation and calculate
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Results will appear here
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

function ProbabilityGame({ onComplete }) {
  const [activity, setActivity] = useState('coin-flip');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(100);

  // Coin Flip State
  const [coinFlips, setCoinFlips] = useState(0);
  
  // Dice State
  const [diceCount, setDiceCount] = useState(2);
  const [diceRolls, setDiceRolls] = useState([]);
  
  // Card State
  const [deck, setDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  
  // Spinner State
  const [spinnerSections, setSpinnerSections] = useState([
    { color: '#f44336', probability: 0.25, label: 'Red' },
    { color: '#2196f3', probability: 0.25, label: 'Blue' },
    { color: '#4caf50', probability: 0.25, label: 'Green' },
    { color: '#ff9800', probability: 0.25, label: 'Orange' }
  ]);
  const [spinResult, setSpinResult] = useState(null);
  
  // Monty Hall State
  const [montyDoors, setMontyDoors] = useState([false, false, false]);
  const [montyChoice, setMontyChoice] = useState(null);
  const [montyRevealed, setMontyRevealed] = useState(null);
  const [montyStats, setMontyStats] = useState({ stayed: 0, stayedWon: 0, switched: 0, switchedWon: 0 });

  const activities = [
    { id: 'coin-flip', name: '🪙 Coin Flip', desc: 'Law of Large Numbers' },
    { id: 'dice-roll', name: '🎲 Dice Roller', desc: 'Multiple outcomes' },
    { id: 'card-draw', name: '🃏 Card Draw', desc: 'Conditional probability' },
    { id: 'spinner', name: '🎯 Spinner', desc: 'Custom probabilities' },
    { id: 'monty-hall', name: '🚪 Monty Hall', desc: 'Famous paradox' }
  ];

  const getEducationalContent = (activityId) => {
    const content = {
      'coin-flip': {
        title: 'Coin Flip Probability',
        formula: 'P(Heads) = P(Tails) = 1/2 = 0.5 = 50%',
        concepts: [
          'Basic Probability: P(Event) = Number of favorable outcomes / Total possible outcomes',
          'Law of Large Numbers: As trials increase, experimental probability approaches theoretical probability',
          'Expected Value: E(X) = Σ[x · P(x)] where x is outcome value',
          'Independent Events: Each flip is independent of previous flips'
        ],
        expectedValue: 'For n flips, expect n/2 heads and n/2 tails',
        realWorld: 'Used in: Decision making, sports (coin toss), random selection'
      },
      'dice-roll': {
        title: 'Dice Probability',
        formula: 'P(any number) = 1/6 ≈ 0.167 = 16.67%',
        concepts: [
          'Sample Space: {1, 2, 3, 4, 5, 6} for one die',
          'For 2 dice sum: P(sum=7) = 6/36 = 1/6 (most likely)',
          'Expected Value for 1 die: E(X) = (1+2+3+4+5+6)/6 = 3.5',
          'For n dice: E(total) = 3.5n',
          'Central Limit Theorem: More dice → more normal distribution'
        ],
        expectedValue: '1 die: 3.5, 2 dice: 7.0, 3 dice: 10.5',
        realWorld: 'Used in: Board games, gambling, probability games'
      },
      'card-draw': {
        title: 'Card Probability',
        formula: 'P(specific card) = 1/52, P(any suit) = 13/52 = 1/4',
        concepts: [
          'Without Replacement: Probability changes after each draw',
          'P(Ace) = 4/52 = 1/13 initially',
          'Conditional Probability: P(A|B) = P(A and B) / P(B)',
          'P(2nd Ace | 1st Ace drawn) = 3/51',
          'Multiplication Rule: P(A and B) = P(A) × P(B|A)'
        ],
        expectedValue: 'Expected aces in 5 cards: 5 × (4/52) ≈ 0.38',
        realWorld: 'Used in: Card games, poker probabilities, risk assessment'
      },
      'spinner': {
        title: 'Spinner Probability',
        formula: 'P(section) = Arc length of section / Total circumference',
        concepts: [
          'Non-uniform Distribution: Sections can have different probabilities',
          'Sum of all probabilities = 1',
          'P(A or B) = P(A) + P(B) for mutually exclusive events',
          'Geometric Probability: Based on area or length ratios'
        ],
        expectedValue: 'Depends on section values and probabilities',
        realWorld: 'Used in: Game shows, random selection with weighted options'
      },
      'monty-hall': {
        title: 'Monty Hall Paradox',
        formula: 'P(win if stay) = 1/3, P(win if switch) = 2/3',
        concepts: [
          'Initially: P(correct door) = 1/3 for each door',
          'After host reveals: Information changes probability',
          'Switching strategy: Wins if initial choice was wrong (2/3 chance)',
          'Staying strategy: Wins if initial choice was right (1/3 chance)',
          'Bayes\' Theorem: Updating probabilities with new information',
          'P(A|B) = [P(B|A) × P(A)] / P(B)'
        ],
        expectedValue: 'In 300 games: Stay wins ~100, Switch wins ~200',
        realWorld: 'Used in: Game theory, decision analysis, Bayesian inference'
      }
    };
    return content[activityId] || null;
  };

  // Coin Flip Simulation
  const flipCoin = () => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    setResults(prev => [...prev, result].slice(-100));
    setCoinFlips(prev => prev + 1);
    updateStats(result);
  };

  const flipMultiple = async (count) => {
    setIsRunning(true);
    for (let i = 0; i < count; i++) {
      flipCoin();
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    setIsRunning(false);
  };

  // Dice Roll Simulation
  const rollDice = () => {
    const rolls = Array(diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0);
    setDiceRolls(prev => [...prev, { rolls, sum }].slice(-50));
    updateStats(`Sum: ${sum}`);
  };

  const rollMultipleDice = async (count) => {
    setIsRunning(true);
    for (let i = 0; i < count; i++) {
      rollDice();
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    setIsRunning(false);
  };

  // Card Draw Simulation
  const initializeDeck = () => {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck = [];
    suits.forEach(suit => {
      values.forEach(value => {
        newDeck.push({ suit, value, color: suit === '♥️' || suit === '♦️' ? 'red' : 'black' });
      });
    });
    setDeck(newDeck);
    setDrawnCards([]);
  };

  const drawCard = () => {
    if (deck.length === 0) {
      initializeDeck();
      return;
    }
    const index = Math.floor(Math.random() * deck.length);
    const card = deck[index];
    setDrawnCards(prev => [...prev, card]);
    setDeck(prev => prev.filter((_, i) => i !== index));
    updateStats(`${card.value}${card.suit}`);
  };

  // Spinner Simulation
  const spinWheel = () => {
    const random = Math.random();
    let cumulative = 0;
    for (let section of spinnerSections) {
      cumulative += section.probability;
      if (random <= cumulative) {
        setSpinResult(section);
        updateStats(section.label);
        break;
      }
    }
  };

  // Monty Hall Game
  const initializeMontyHall = () => {
    const carPosition = Math.floor(Math.random() * 3);
    setMontyDoors([carPosition === 0, carPosition === 1, carPosition === 2]);
    setMontyChoice(null);
    setMontyRevealed(null);
  };

  const chooseMontyDoor = (index) => {
    if (montyChoice !== null) return;
    setMontyChoice(index);
    
    // Reveal a door with a goat
    const availableDoors = [0, 1, 2].filter(i => i !== index && !montyDoors[i]);
    const revealed = availableDoors[Math.floor(Math.random() * availableDoors.length)];
    setMontyRevealed(revealed);
  };

  const finalizeMontyChoice = (switched) => {
    const won = montyDoors[montyChoice];
    if (switched) {
      setMontyStats(prev => ({
        ...prev,
        switched: prev.switched + 1,
        switchedWon: prev.switchedWon + (won ? 0 : 1)
      }));
    } else {
      setMontyStats(prev => ({
        ...prev,
        stayed: prev.stayed + 1,
        stayedWon: prev.stayedWon + (won ? 1 : 0)
      }));
    }
    setTimeout(() => initializeMontyHall(), 2000);
  };

  // Update statistics
  const updateStats = (result) => {
    setStats(prev => ({
      ...prev,
      [result]: (prev[result] || 0) + 1
    }));
  };

  const resetActivity = () => {
    setResults([]);
    setStats({});
    setCoinFlips(0);
    setDiceRolls([]);
    setDrawnCards([]);
    initializeDeck();
    initializeMontyHall();
  };

  useEffect(() => {
    initializeDeck();
    initializeMontyHall();
  }, []);

  useEffect(() => {
    resetActivity();
  }, [activity]);

  // Render different activities
  const renderActivity = () => {
    switch(activity) {
      case 'coin-flip':
        return (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={flipCoin} disabled={isRunning}>
                Flip Once
              </Button>
              <Button variant="contained" onClick={() => flipMultiple(10)} disabled={isRunning}>
                Flip 10×
              </Button>
              <Button variant="contained" onClick={() => flipMultiple(100)} disabled={isRunning}>
                Flip 100×
              </Button>
              <Button variant="outlined" onClick={resetActivity} startIcon={<RefreshIcon />}>
                Reset
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h1" sx={{ fontSize: '4rem' }}>🪙</Typography>
                  <Typography variant="h4" sx={{ mt: 2 }} color="primary">
                    {results[results.length - 1] || 'Flip a coin!'}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                    Total Flips: {coinFlips}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Statistics</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {stats['Heads'] || 0}
                      </Typography>
                      <Typography variant="caption">Heads</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {coinFlips > 0 ? ((stats['Heads'] || 0) / coinFlips * 100).toFixed(1) : 0}%
                      </Typography>
                      <Chip 
                        label="Expected: 50%" 
                        size="small" 
                        sx={{ mt: 1, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary">
                        {stats['Tails'] || 0}
                      </Typography>
                      <Typography variant="caption">Tails</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {coinFlips > 0 ? ((stats['Tails'] || 0) / coinFlips * 100).toFixed(1) : 0}%
                      </Typography>
                      <Chip 
                        label="Expected: 50%" 
                        size="small" 
                        sx={{ mt: 1, fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>
                  {coinFlips >= 10 && (
                    <Alert severity={Math.abs(((stats['Heads'] || 0) / coinFlips) - 0.5) < 0.1 ? 'success' : 'info'} sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        {Math.abs(((stats['Heads'] || 0) / coinFlips) - 0.5) < 0.1 
                          ? '✓ Results approaching theoretical probability!' 
                          : 'Keep flipping! More trials = closer to 50/50'}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              </Grid>

              {results.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Recent Results:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {results.slice(-50).map((r, i) => (
                        <Chip 
                          key={i} 
                          label={r[0]} 
                          size="small" 
                          color={r === 'Heads' ? 'primary' : 'secondary'}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 'dice-roll':
        return (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Number of Dice"
                type="number"
                value={diceCount}
                onChange={(e) => setDiceCount(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                sx={{ width: 120 }}
                size="small"
              />
              <Button variant="contained" onClick={rollDice} disabled={isRunning}>
                Roll Once
              </Button>
              <Button variant="contained" onClick={() => rollMultipleDice(50)} disabled={isRunning}>
                Roll 50×
              </Button>
              <Button variant="outlined" onClick={resetActivity} startIcon={<RefreshIcon />}>
                Reset
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h6" gutterBottom>Latest Roll</Typography>
                  {diceRolls.length > 0 && (
                    <>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', my: 2, flexWrap: 'wrap' }}>
                        {diceRolls[diceRolls.length - 1].rolls.map((die, i) => (
                          <Paper key={i} sx={{ p: 2, minWidth: 50, bgcolor: '#f5f5f5' }}>
                            <Typography variant="h4">🎲</Typography>
                            <Typography variant="h6">{die}</Typography>
                          </Paper>
                        ))}
                      </Box>
                      <Typography variant="h5" color="primary">
                        Sum: {diceRolls[diceRolls.length - 1].sum}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Sum Distribution</Typography>
                  <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                    {Object.entries(stats).sort((a, b) => {
                      const numA = parseInt(a[0].split(': ')[1]) || 0;
                      const numB = parseInt(b[0].split(': ')[1]) || 0;
                      return numA - numB;
                    }).map(([sum, count]) => {
                      const percentage = (count / diceRolls.length * 100).toFixed(1);
                      return (
                        <Box key={sum} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">{sum}</Typography>
                            <Typography variant="caption">{count} ({percentage}%)</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(parseFloat(percentage), 100)} 
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                  {diceRolls.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        <strong>Expected Value:</strong> {(diceCount * 3.5).toFixed(1)}
                        <br />
                        Most likely sum for {diceCount} dice: {diceCount === 1 ? 'All equal (1/6)' : 
                          diceCount === 2 ? '7 (16.7%)' : `${Math.round(diceCount * 3.5)}`}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 'card-draw':
        return (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={drawCard} disabled={deck.length === 0}>
                Draw Card
              </Button>
              <Button variant="outlined" onClick={initializeDeck} startIcon={<RefreshIcon />}>
                New Deck
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h6" gutterBottom>Current Card</Typography>
                  {drawnCards.length > 0 ? (
                    <Box sx={{ my: 2 }}>
                      <Paper sx={{ 
                        p: 3, 
                        display: 'inline-block', 
                        bgcolor: '#f5f5f5',
                        border: '2px solid #000',
                        borderRadius: 2,
                        minWidth: 120
                      }}>
                        <Typography variant="h2" sx={{ 
                          color: drawnCards[drawnCards.length - 1].color === 'red' ? '#f44336' : '#000'
                        }}>
                          {drawnCards[drawnCards.length - 1].value}
                          {drawnCards[drawnCards.length - 1].suit}
                        </Typography>
                      </Paper>
                    </Box>
                  ) : (
                    <Box sx={{ my: 2, py: 4 }}>
                      <Typography variant="h3">🃏</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Draw a card!</Typography>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Cards remaining: {deck.length}/52
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Suit Distribution</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h5">♠️</Typography>
                      <Typography variant="h6">{Object.keys(stats).filter(k => k.includes('♠️')).length}</Typography>
                      <Typography variant="caption">
                        {drawnCards.length > 0 ? ((Object.keys(stats).filter(k => k.includes('♠️')).length / drawnCards.length) * 100).toFixed(1) : 0}%
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h5" color="error">♥️</Typography>
                      <Typography variant="h6">{Object.keys(stats).filter(k => k.includes('♥️')).length}</Typography>
                      <Typography variant="caption">
                        {drawnCards.length > 0 ? ((Object.keys(stats).filter(k => k.includes('♥️')).length / drawnCards.length) * 100).toFixed(1) : 0}%
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h5" color="error">♦️</Typography>
                      <Typography variant="h6">{Object.keys(stats).filter(k => k.includes('♦️')).length}</Typography>
                      <Typography variant="caption">
                        {drawnCards.length > 0 ? ((Object.keys(stats).filter(k => k.includes('♦️')).length / drawnCards.length) * 100).toFixed(1) : 0}%
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h5">♣️</Typography>
                      <Typography variant="h6">{Object.keys(stats).filter(k => k.includes('♣️')).length}</Typography>
                      <Typography variant="caption">
                        {drawnCards.length > 0 ? ((Object.keys(stats).filter(k => k.includes('♣️')).length / drawnCards.length) * 100).toFixed(1) : 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 'monty-hall':
        return (
          <Box>
            <Paper sx={{ p: 2.5, mb: 3, bgcolor: 'white' }}>
              <Typography variant="h6" gutterBottom>🚪 The Monty Hall Problem</Typography>
              <Typography variant="body2" color="text.secondary">
                You're on a game show with 3 doors. Behind one is a car 🚗, behind the others are goats 🐐.
                You pick a door, then the host opens another door with a goat. Should you switch?
              </Typography>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[0, 1, 2].map(i => (
                    <Paper
                      key={i}
                      onClick={() => chooseMontyDoor(i)}
                      sx={{
                        p: 4,
                        minWidth: 100,
                        cursor: montyChoice === null ? 'pointer' : 'default',
                        bgcolor: montyChoice === i ? 'primary.light' : 
                                montyRevealed === i ? '#ffebee' : '#f5f5f5',
                        border: montyChoice === i ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        '&:hover': montyChoice === null ? { bgcolor: '#e0e0e0' } : {},
                        transition: 'all 0.3s'
                      }}
                    >
                      <Typography variant="h1" sx={{ fontSize: '3.5rem' }}>
                        {montyRevealed === i ? '🐐' : 
                         montyChoice === i && montyRevealed !== null ? (montyDoors[i] ? '🚗' : '🐐') :
                         '🚪'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        Door {i + 1}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Grid>

              {montyRevealed !== null && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ textAlign: 'center' }}>
                    <Typography>Do you want to STAY with Door {montyChoice + 1} or SWITCH?</Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button variant="contained" onClick={() => finalizeMontyChoice(false)}>
                        Stay
                      </Button>
                      <Button variant="contained" color="success" onClick={() => finalizeMontyChoice(true)}>
                        Switch
                      </Button>
                    </Box>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Statistics</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                        <Typography variant="subtitle2">Stayed</Typography>
                        <Typography variant="h4" color="error">
                          {montyStats.stayed > 0 ? 
                            (montyStats.stayedWon / montyStats.stayed * 100).toFixed(0) : 0}%
                        </Typography>
                        <Typography variant="caption">
                          {montyStats.stayedWon}/{montyStats.stayed} wins
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                        <Typography variant="subtitle2">Switched</Typography>
                        <Typography variant="h4" color="success.main">
                          {montyStats.switched > 0 ? 
                            (montyStats.switchedWon / montyStats.switched * 100).toFixed(0) : 0}%
                        </Typography>
                        <Typography variant="caption">
                          {montyStats.switchedWon}/{montyStats.switched} wins
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      <strong>Fact:</strong> Switching gives you a 2/3 (66.7%) chance of winning!
                    </Typography>
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return (
          <Alert severity="info">
            This activity is coming soon! Try the other probability experiments.
          </Alert>
        );
    }
  };

  const educationalContent = getEducationalContent(activity);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">🎲 Probability Explorer</Typography>
        {isRunning && <Chip label="Simulating..." color="primary" />}
      </Box>

      <Grid container spacing={3}>
        {/* Activity Selector */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Choose Activity:
            </Typography>
            {activities.map(act => (
              <Paper
                key={act.id}
                onClick={() => setActivity(act.id)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: activity === act.id ? 'primary.main' : 'white',
                  color: activity === act.id ? 'white' : 'inherit',
                  '&:hover': { bgcolor: activity === act.id ? 'primary.dark' : '#f0f0f0' }
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {act.name}
                </Typography>
                <Typography variant="caption" color={activity === act.id ? 'inherit' : 'text.secondary'}>
                  {act.desc}
                </Typography>
              </Paper>
            ))}
          </Paper>

          {/* Educational Content */}
          {educationalContent && (
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                {educationalContent.title}
              </Typography>

              <Typography variant="caption" display="block" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }}>
                Formula:
              </Typography>
              <Paper sx={{ p: 1, bgcolor: 'white', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {educationalContent.formula}
              </Paper>

              <Typography variant="caption" display="block" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }}>
                Key Concepts:
              </Typography>
              {educationalContent.concepts.map((concept, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                  • {concept}
                </Typography>
              ))}

              <Typography variant="caption" display="block" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }}>
                Expected Value:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                {educationalContent.expectedValue}
              </Typography>

              <Typography variant="caption" display="block" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }}>
                Real-World Use:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {educationalContent.realWorld}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Activity Display */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            {renderActivity()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function APCalculator({ onComplete }) {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>Arithmetic Progression</Typography>
      <Alert severity="info">Coming Soon: Explore sequences and series</Alert>
    </Box>
  );
}

// Component map
const experimentComponents = {
  counting: CountingGame,
  addition: AdditionPractice,
  subtraction: SubtractionPractice,
  multiplication: TimesTableTrainer,
  patterns: PatternGame,
  shapes: ShapeExplorer,
  'area-perimeter': AreaPerimeterCalculator,
  coordinate: CoordinatePlotter,
  fractions: FractionVisualizer,
  percentage: PercentageCalculator,
  integers: IntegerNumberLine,
  quadratic: QuadraticSolver,
  trigonometry: TrigCalculator,
  matrices: MatrixCalculator,
  probability: ProbabilityGame,
  ap: APCalculator
};

// ==================== EXPERIMENTS TAB ====================
function ExperimentsTab() {
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('foundational');

  if (selectedExperiment) {
    const ExperimentComponent = experimentComponents[selectedExperiment.id] || CountingGame;
    
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => setSelectedExperiment(null)}
          sx={{ mb: 2 }}
        >
          Back to Experiments
        </Button>

        <Card>
          <CardContent>
            <ExperimentComponent onComplete={(points) => console.log('Points:', points)} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🧪 Interactive Math Experiments
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Learn mathematics through hands-on interactive experiments and games
      </Typography>

      {Object.entries(EXPERIMENTS).map(([key, category]) => (
        <Accordion
          key={key}
          expanded={expandedCategory === key}
          onChange={() => setExpandedCategory(expandedCategory === key ? null : key)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography sx={{ fontSize: 32 }}>{category.icon}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: category.color, fontWeight: 600 }}>
                  {category.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {category.subtitle} · {category.experiments.length} experiments
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Grid container spacing={2}>
              {category.experiments.map((exp) => (
                <Grid item xs={12} sm={6} md={4} key={exp.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardActionArea onClick={() => setSelectedExperiment(exp)}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {exp.title}
                          </Typography>
                          <Chip
                            label={exp.difficulty}
                            size="small"
                            sx={{
                              bgcolor: exp.difficulty === 'Beginner' ? '#e8f5e9' :
                                      exp.difficulty === 'Intermediate' ? '#fff3e0' : '#fce4ec',
                              color: exp.difficulty === 'Beginner' ? '#2e7d32' :
                                     exp.difficulty === 'Intermediate' ? '#e65100' : '#c2185b'
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {exp.description}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            icon={<PlayIcon />}
                            label="Try it"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

// ==================== REST OF THE COMPONENTS (from MathLabRedesign.js) ====================
// Copy the AI Chat, Visualizations, Graph Plotter, and Calculator components here
// v10.4.16: REMOVED OLD UNUSED MathAIChat COMPONENT (was causing confusion)
// AI Chat is now inline in MathLabV2 component (like Chemistry)

// Quadratic Visualization Component (moved up)
// (Old MathAIChat component deleted - lines 3175-3336)

// Placeholder - actual component starts at line 3338
function __DELETED_MathAIChat_COMPONENT__({ user }) {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  const SUGGESTED_QUESTIONS = [
    "Explain quadratic equations",
    "What is calculus?",
    "Show me trigonometry basics",
    "Explain derivatives"
  ];

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    const userQuestion = question;
    setQuestion('');
    setChatHistory(prev => [{ role: 'user', content: userQuestion }, ...prev]);
    
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
      
      const prompt = `You are Vyonn AI Math, a brilliant and friendly mathematics tutor.

${isRegional ? `🚨 IMPORTANT: Student asked in ${lang}. You MUST respond in ${lang}!` : ''}

Student asked: "${userQuestion}"

Provide a clear, educational response that:
1. Explains the concept step-by-step ${isRegional ? `(in ${lang})` : ''}
2. Uses examples where helpful ${isRegional ? `(in ${lang})` : ''}
3. Includes relevant formulas or equations
4. Is encouraging and supportive ${isRegional ? `(in ${lang})` : ''}
5. Suggests next steps for learning ${isRegional ? `(in ${lang})` : ''}

${isRegional ? `Write your ENTIRE response in ${lang} using proper Unicode!` : 'Be warm and engaging!'}`;

      const response = await callLLM(prompt, { feature: 'general', temperature: 0.7, maxTokens: 2048 });  // V3.2: Doubled for detailed math explanations
      setChatHistory(prev => [{ role: 'assistant', content: response || "Let me help you with that math concept!" }, ...prev]);
    } catch (error) {
      console.error('❌ Math AI error:', error);
      console.error('❌ Error details:', error.message, error.stack);
      // v10.4.6: Graceful fallback like Chemistry - don't show raw error to user
      setChatHistory(prev => [{ 
        role: 'assistant', 
        content: "I'd be happy to help you with that! Let me explain:\n\nCould you please rephrase your question? Try to be specific about what you'd like to learn - whether it's algebra, geometry, calculus, statistics, or any other math topic. I'm here to help! 📐" 
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Input Section - At Top */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Ask me anything about mathematics..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAsk())}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <VoiceInputButton
                  onTranscript={setQuestion}
                  existingText={question}
                  disabled={loading}
                  size="small"
                />
                <IconButton onClick={handleAsk} disabled={loading || !question.trim()} color="primary">
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <Chip key={i} label={q} size="small" onClick={() => setQuestion(q)} sx={{ cursor: 'pointer', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, fontSize: '0.75rem' }} />
          ))}
        </Box>
      </Paper>

      {/* Chat History */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {chatHistory.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <MathIcon 
              sx={{ 
                fontSize: 64, 
                color: 'primary.main', 
                mb: 2,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                  '50%': {
                    opacity: 0.6,
                    transform: 'scale(1.05)',
                  }
                }
              }} 
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Start a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask questions about math
            </Typography>
          </Box>
        ) : (
          chatHistory.map((msg, i) => (
            <Box key={i} sx={{ mb: 2 }}>
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
                    <VyonnMathIcon size={32} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
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
                    </Paper>
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VyonnMathIcon size={24} />
            <Paper elevation={0} sx={{ p: 1.5, ml: 4, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" component="span" sx={{ ml: 1 }}>Thinking...</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Quadratic Visualization Component
function QuadraticVisualization() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Set up coordinate system
      const xMin = -10, xMax = 10;
      const yMin = -20, yMax = 20;
      const xScale = width / (xMax - xMin);
      const yScale = height / (yMax - yMin);
      
      const toCanvasX = (x) => (x - xMin) * xScale;
      const toCanvasY = (y) => height - (y - yMin) * yScale;
      
      // Draw grid
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let x = xMin; x <= xMax; x += 2) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x), 0);
        ctx.lineTo(toCanvasX(x), height);
        ctx.stroke();
      }
      for (let y = yMin; y <= yMax; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(y));
        ctx.lineTo(width, toCanvasY(y));
        ctx.stroke();
      }
      
      // Draw axes
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      // X-axis
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(0));
      ctx.lineTo(width, toCanvasY(0));
      ctx.stroke();
      // Y-axis
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), 0);
      ctx.lineTo(toCanvasX(0), height);
      ctx.stroke();
      
      // Draw axis labels
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText('x', width - 20, toCanvasY(0) - 10);
      ctx.fillText('y', toCanvasX(0) + 10, 20);
      
      // Plot quadratic function
      if (a !== 0) {
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let firstPoint = true;
        for (let x = xMin; x <= xMax; x += 0.1) {
          const y = a * x * x + b * x + c;
          if (y >= yMin && y <= yMax) {
            const canvasX = toCanvasX(x);
            const canvasY = toCanvasY(y);
            
            if (firstPoint) {
              ctx.moveTo(canvasX, canvasY);
              firstPoint = false;
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          }
        }
        ctx.stroke();
        
        // Draw vertex point
        const vertexX = -b / (2 * a);
        const vertexY = a * vertexX * vertexX + b * vertexX + c;
        if (vertexX >= xMin && vertexX <= xMax && vertexY >= yMin && vertexY <= yMax) {
          ctx.fillStyle = '#d32f2f';
          ctx.beginPath();
          ctx.arc(toCanvasX(vertexX), toCanvasY(vertexY), 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }, [a, b, c]);

    const vertexX = a !== 0 ? (-b / (2 * a)).toFixed(2) : 0;
    const vertexY = a !== 0 ? (a * (-b / (2 * a)) ** 2 + b * (-b / (2 * a)) + c).toFixed(2) : 0;

    return (
      <Box sx={{ height: 'calc(100vh - 280px)', overflow: 'hidden' }}>
        <Grid container spacing={2} sx={{ height: '100%', alignItems: 'stretch' }}>
          {/* Left Column - Controls & Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, height: '100%' }}>
              {/* Equation Display */}
              <Paper elevation={3} sx={{ p: 1.2, bgcolor: '#1976d2', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', letterSpacing: 1 }}>
                  y = {a}x² {b >= 0 ? '+' : ''}{b}x {c >= 0 ? '+' : ''}{c}
                </Typography>
              </Paper>

              {/* Sliders */}
              <Paper elevation={2} sx={{ p: 1.2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                  Adjust Parameters:
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                    <Typography variant="body2" fontWeight="bold">a = {a}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>shape & direction</Typography>
                  </Box>
                  <Slider 
                    value={a} 
                    onChange={(e, v) => setA(v)} 
                    min={-5} 
                    max={5} 
                    step={0.5} 
                    valueLabelDisplay="auto" 
                    size="small"
                    sx={{ color: '#1976d2', mt: -0.5 }}
                  />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                    <Typography variant="body2" fontWeight="bold">b = {b}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>horizontal shift</Typography>
                  </Box>
                  <Slider 
                    value={b} 
                    onChange={(e, v) => setB(v)} 
                    min={-10} 
                    max={10} 
                    step={1} 
                    valueLabelDisplay="auto"
                    size="small"
                    sx={{ color: '#1976d2', mt: -0.5 }}
                  />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                    <Typography variant="body2" fontWeight="bold">c = {c}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>y-intercept</Typography>
                  </Box>
                  <Slider 
                    value={c} 
                    onChange={(e, v) => setC(v)} 
                    min={-10} 
                    max={10} 
                    step={1} 
                    valueLabelDisplay="auto"
                    size="small"
                    sx={{ color: '#1976d2', mt: -0.5 }}
                  />
                </Box>

                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                  <Chip 
                    label="Reset to y = x²" 
                    onClick={() => { setA(1); setB(0); setC(0); }}
                    size="small"
                    sx={{ cursor: 'pointer' }}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Paper>

              {/* Key Information */}
              <Paper elevation={2} sx={{ p: 1.2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 0.8 }}>
                  Key Points:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Vertex:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error" sx={{ fontSize: '0.95rem' }}>
                        ({vertexX}, {vertexY})
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Opens:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '0.95rem' }}>
                        {a > 0 ? '⬆️ Up' : a < 0 ? '⬇️ Down' : '--'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Y-intercept:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="secondary" sx={{ fontSize: '0.95rem' }}>
                        (0, {c})
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Grid>

          {/* Right Column - Graph */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 1, 
                bgcolor: '#fafafa', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
                Interactive Graph
              </Typography>
              <canvas 
                ref={canvasRef} 
                width={650} 
                height={440} 
                style={{ 
                  border: '2px solid #1976d2', 
                  borderRadius: 8, 
                  maxWidth: '100%', 
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  backgroundColor: 'white'
                }} 
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
}

// Pythagorean Theorem Visualization Component
function PythagoreanVisualization() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const canvasRef = useRef(null);

  const c = Math.sqrt(a * a + b * b);
  const aSquared = a * a;
  const bSquared = b * b;
  const cSquared = c * c;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Scale factor for visualization
    const scale = 40;
    const offsetX = 100;
    const offsetY = height - 100;
    
    // Draw the right triangle
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY); // Bottom left (origin)
    ctx.lineTo(offsetX + a * scale, offsetY); // Bottom right (along side a)
    ctx.lineTo(offsetX + a * scale, offsetY - b * scale); // Top right (up side b)
    ctx.closePath();
    ctx.stroke();
    
    // Fill triangle with light color
    ctx.fillStyle = 'rgba(25, 118, 210, 0.1)';
    ctx.fill();
    
    // Draw right angle indicator
    const squareSize = 15;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + a * scale - squareSize, offsetY - squareSize, squareSize, squareSize);
    
    // Draw squares on each side
    // Square on side a (horizontal) - blue
    ctx.fillStyle = 'rgba(25, 118, 210, 0.3)';
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.fillRect(offsetX, offsetY, a * scale, a * scale);
    ctx.strokeRect(offsetX, offsetY, a * scale, a * scale);
    
    // Square on side b (vertical) - green
    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.strokeStyle = '#4caf50';
    ctx.fillRect(offsetX + a * scale, offsetY - b * scale, b * scale, -b * scale);
    ctx.strokeRect(offsetX + a * scale, offsetY - b * scale, b * scale, -b * scale);
    
    // Square on hypotenuse c (diagonal) - red
    const angle = Math.atan2(-b, a);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(211, 47, 47, 0.3)';
    ctx.strokeStyle = '#d32f2f';
    ctx.fillRect(0, 0, c * scale, -c * scale);
    ctx.strokeRect(0, 0, c * scale, -c * scale);
    ctx.restore();
    
    // Labels
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    
    // Label a
    ctx.fillStyle = '#1976d2';
    ctx.fillText(`a = ${a}`, offsetX + (a * scale) / 2 - 20, offsetY + 30);
    
    // Label b
    ctx.fillStyle = '#4caf50';
    ctx.fillText(`b = ${b}`, offsetX + a * scale + 10, offsetY - (b * scale) / 2);
    
    // Label c
    ctx.fillStyle = '#d32f2f';
    const midX = offsetX + (a * scale) / 2;
    const midY = offsetY - (b * scale) / 2;
    ctx.fillText(`c = ${c.toFixed(2)}`, midX - 40, midY - 10);
    
  }, [a, b, c]);

  return (
    <Box sx={{ height: 'calc(100vh - 280px)', overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Left Column - Controls */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, height: '100%' }}>
            {/* Title */}
            <Paper elevation={3} sx={{ p: 1.2, bgcolor: '#4caf50', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                a² + b² = c²
              </Typography>
            </Paper>

            {/* Sliders */}
            <Paper elevation={2} sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5 }}>
                Adjust Triangle Sides:
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold" color="#1976d2">
                    Side a = {a}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    horizontal
                  </Typography>
                </Box>
                <Slider
                  value={a}
                  onChange={(e, v) => setA(v)}
                  min={1}
                  max={10}
                  step={0.5}
                  valueLabelDisplay="auto"
                  sx={{ color: '#1976d2' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold" color="#4caf50">
                    Side b = {b}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    vertical
                  </Typography>
                </Box>
                <Slider
                  value={b}
                  onChange={(e, v) => setB(v)}
                  min={1}
                  max={10}
                  step={0.5}
                  valueLabelDisplay="auto"
                  sx={{ color: '#4caf50' }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box>
                <Typography variant="body2" fontWeight="bold" color="#d32f2f">
                  Hypotenuse c = {c.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  (calculated automatically)
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Chip
                  label="Try 3-4-5 Triangle"
                  onClick={() => { setA(3); setB(4); }}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Paper>

            {/* Calculations */}
            <Paper elevation={2} sx={{ p: 1.5, bgcolor: '#fff3e0' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                The Math:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong style={{ color: '#1976d2' }}>a²</strong> = {a}² = <strong>{aSquared.toFixed(1)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong style={{ color: '#4caf50' }}>b²</strong> = {b}² = <strong>{bSquared.toFixed(1)}</strong>
              </Typography>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                a² + b² = {aSquared.toFixed(1)} + {bSquared.toFixed(1)} = <strong>{(aSquared + bSquared).toFixed(1)}</strong>
              </Typography>
              <Typography variant="body2">
                <strong style={{ color: '#d32f2f' }}>c²</strong> = {c.toFixed(2)}² = <strong>{cSquared.toFixed(1)}</strong> ✓
              </Typography>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column - Visualization */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              bgcolor: '#fafafa',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
              Right Triangle with Squares on Each Side
            </Typography>
            <canvas
              ref={canvasRef}
              width={650}
              height={440}
              style={{
                border: '2px solid #4caf50',
                borderRadius: 8,
                maxWidth: '100%',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                backgroundColor: 'white'
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label="Blue = a²" size="small" sx={{ bgcolor: 'rgba(25, 118, 210, 0.3)', color: '#1976d2', fontWeight: 'bold' }} />
              <Chip label="Green = b²" size="small" sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', color: '#4caf50', fontWeight: 'bold' }} />
              <Chip label="Red = c²" size="small" sx={{ bgcolor: 'rgba(211, 47, 47, 0.3)', color: '#d32f2f', fontWeight: 'bold' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Circle Visualization Component
function CircleVisualization() {
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);
  const [r, setR] = useState(5);
  const [showTheorem, setShowTheorem] = useState('basic'); // basic, area, chord, tangent
  const canvasRef = useRef(null);

  const diameter = 2 * r;
  const circumference = 2 * Math.PI * r;
  const area = Math.PI * r * r;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Coordinate system setup
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30;
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Calculate circle center in canvas coordinates
    const circleX = centerX + h * scale;
    const circleY = centerY - k * scale;
    const radiusPixels = r * scale;
    
    // Draw circle
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(circleX, circleY, radiusPixels, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Fill circle lightly
    ctx.fillStyle = 'rgba(25, 118, 210, 0.1)';
    ctx.fill();
    
    // Draw center point
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(circleX, circleY, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Theorem-specific visualizations
    if (showTheorem === 'basic') {
      // Draw radius
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(circleX, circleY);
      ctx.lineTo(circleX + radiusPixels, circleY);
      ctx.stroke();
      
      // Label radius
      ctx.fillStyle = '#d32f2f';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`r = ${r}`, circleX + radiusPixels / 2 - 15, circleY - 10);
      
      // Draw diameter
      ctx.strokeStyle = '#4caf50';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(circleX - radiusPixels, circleY);
      ctx.lineTo(circleX + radiusPixels, circleY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label diameter
      ctx.fillStyle = '#4caf50';
      ctx.fillText(`d = ${diameter.toFixed(1)}`, circleX - 30, circleY + 20);
    } else if (showTheorem === 'area') {
      // Shade the area
      ctx.fillStyle = 'rgba(25, 118, 210, 0.3)';
      ctx.beginPath();
      ctx.arc(circleX, circleY, radiusPixels, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw radius
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(circleX, circleY);
      ctx.lineTo(circleX + radiusPixels, circleY);
      ctx.stroke();
    } else if (showTheorem === 'chord') {
      // Draw a chord
      const angle1 = Math.PI / 6;
      const angle2 = Math.PI * 5 / 6;
      const x1 = circleX + radiusPixels * Math.cos(angle1);
      const y1 = circleY + radiusPixels * Math.sin(angle1);
      const x2 = circleX + radiusPixels * Math.cos(angle2);
      const y2 = circleY + radiusPixels * Math.sin(angle2);
      
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Draw perpendicular from center to chord
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.strokeStyle = '#9c27b0';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(circleX, circleY);
      ctx.lineTo(midX, midY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Mark the points
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
      ctx.arc(x2, y2, 4, 0, 2 * Math.PI);
      ctx.fill();
    } else if (showTheorem === 'tangent') {
      // Draw radius to tangent point (at right)
      const tangentX = circleX + radiusPixels;
      const tangentY = circleY;
      
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(circleX, circleY);
      ctx.lineTo(tangentX, tangentY);
      ctx.stroke();
      
      // Draw tangent line (vertical)
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tangentX, tangentY - 80);
      ctx.lineTo(tangentX, tangentY + 80);
      ctx.stroke();
      
      // Draw right angle indicator
      const squareSize = 15;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(tangentX - squareSize, tangentY - squareSize / 2, squareSize, squareSize);
      
      // Mark tangent point
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(tangentX, tangentY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Label center
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`(${h}, ${k})`, circleX + 10, circleY - 10);
    
  }, [h, k, r, showTheorem, diameter]);

  const theorems = [
    { id: 'basic', name: 'Basic Equation', icon: '⭕' },
    { id: 'area', name: 'Area & Circumference', icon: '📏' },
    { id: 'chord', name: 'Chord Theorem', icon: '📐' },
    { id: 'tangent', name: 'Tangent Theorem', icon: '📍' }
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 280px)', overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Left Column - Controls */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, height: '100%' }}>
            {/* Equation */}
            <Paper elevation={3} sx={{ p: 1.2, bgcolor: '#1976d2', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                (x - {h})² + (y - {k})² = {r}²
              </Typography>
            </Paper>

            {/* Theorem Selector */}
            <Paper elevation={2} sx={{ p: 1.2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                Select Theorem:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {theorems.map((th) => (
                  <Chip
                    key={th.id}
                    label={`${th.icon} ${th.name}`}
                    onClick={() => setShowTheorem(th.id)}
                    color={showTheorem === th.id ? 'primary' : 'default'}
                    size="small"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Sliders */}
            <Paper elevation={2} sx={{ p: 1.2, flex: 1 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                Adjust Circle:
              </Typography>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold">Center x (h) = {h}</Typography>
                <Slider
                  value={h}
                  onChange={(e, v) => setH(v)}
                  min={-5}
                  max={5}
                  step={0.5}
                  valueLabelDisplay="auto"
                  size="small"
                  sx={{ color: '#1976d2' }}
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold">Center y (k) = {k}</Typography>
                <Slider
                  value={k}
                  onChange={(e, v) => setK(v)}
                  min={-5}
                  max={5}
                  step={0.5}
                  valueLabelDisplay="auto"
                  size="small"
                  sx={{ color: '#1976d2' }}
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold">Radius (r) = {r}</Typography>
                <Slider
                  value={r}
                  onChange={(e, v) => setR(v)}
                  min={1}
                  max={8}
                  step={0.5}
                  valueLabelDisplay="auto"
                  size="small"
                  sx={{ color: '#d32f2f' }}
                />
              </Box>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Chip
                  label="Reset to Origin"
                  onClick={() => { setH(0); setK(0); setR(5); }}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Paper>

            {/* Formulas & Calculations */}
            <Paper elevation={2} sx={{ p: 1.2, bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                {showTheorem === 'basic' && 'Basic Properties:'}
                {showTheorem === 'area' && 'Area & Circumference:'}
                {showTheorem === 'chord' && 'Chord Theorem:'}
                {showTheorem === 'tangent' && 'Tangent Theorem:'}
              </Typography>

              {showTheorem === 'basic' && (
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                    • Center: ({h}, {k})
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                    • Radius: {r}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    • Diameter: {diameter.toFixed(1)}
                  </Typography>
                </Box>
              )}

              {showTheorem === 'area' && (
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                    <strong>Area = πr²</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                    = π × {r}² = <strong>{area.toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                    <strong>Circumference = 2πr</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    = 2π × {r} = <strong>{circumference.toFixed(2)}</strong>
                  </Typography>
                </Box>
              )}

              {showTheorem === 'chord' && (
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                    A perpendicular from the center to a chord bisects the chord.
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Orange = chord, Purple = perpendicular
                  </Typography>
                </Box>
              )}

              {showTheorem === 'tangent' && (
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                    A tangent line is perpendicular to the radius at the point of contact.
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Red = radius, Orange = tangent (90° angle)
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

        {/* Right Column - Visualization */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              bgcolor: '#fafafa',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
              Circle Theorems Visualization
            </Typography>
            <canvas
              ref={canvasRef}
              width={650}
              height={440}
              style={{
                border: '2px solid #1976d2',
                borderRadius: 8,
                maxWidth: '100%',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                backgroundColor: 'white'
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Trigonometry Visualization Component
function TrigVisualization() {
  const [angle, setAngle] = useState(45);
  const [useDegrees, setUseDegrees] = useState(true);
  const [viewMode, setViewMode] = useState('unitCircle'); // unitCircle, waves, combined
  const unitCircleRef = useRef(null);
  const waveRef = useRef(null);

  // Convert angle to radians
  const angleRad = useDegrees ? (angle * Math.PI / 180) : angle;
  
  // Calculate primary trig functions
  const sinVal = Math.sin(angleRad);
  const cosVal = Math.cos(angleRad);
  const tanVal = Math.tan(angleRad);

  // Common angles with exact values
  const commonAngles = [
    { deg: 0, sin: '0', cos: '1', tan: '0', sinVal: 0, cosVal: 1, tanVal: 0 },
    { deg: 30, sin: '1/2', cos: '√3/2', tan: '1/√3', sinVal: 0.5, cosVal: Math.sqrt(3)/2, tanVal: 1/Math.sqrt(3) },
    { deg: 45, sin: '√2/2', cos: '√2/2', tan: '1', sinVal: Math.sqrt(2)/2, cosVal: Math.sqrt(2)/2, tanVal: 1 },
    { deg: 60, sin: '√3/2', cos: '1/2', tan: '√3', sinVal: Math.sqrt(3)/2, cosVal: 0.5, tanVal: Math.sqrt(3) },
    { deg: 90, sin: '1', cos: '0', tan: '∞', sinVal: 1, cosVal: 0, tanVal: Infinity }
  ];

  // Get exact value if angle matches common angle
  const getExactValue = (currentAngle, func) => {
    const match = commonAngles.find(a => a.deg === currentAngle);
    if (match) return match[func];
    return null;
  };

  // Special angles for unit circle markers
  const specialAngles = [
    { deg: 0, label: '0°' },
    { deg: 30, label: '30°' },
    { deg: 45, label: '45°' },
    { deg: 60, label: '60°' },
    { deg: 90, label: '90°' },
    { deg: 120, label: '120°' },
    { deg: 135, label: '135°' },
    { deg: 150, label: '150°' },
    { deg: 180, label: '180°' },
    { deg: 210, label: '210°' },
    { deg: 225, label: '225°' },
    { deg: 240, label: '240°' },
    { deg: 270, label: '270°' },
    { deg: 300, label: '300°' },
    { deg: 315, label: '315°' },
    { deg: 330, label: '330°' },
    { deg: 360, label: '360°' }
  ];

  // Draw Unit Circle
  useEffect(() => {
    const canvas = unitCircleRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const padding = 50;
    const radius = Math.min(width, height) / 2 - padding;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid circles (lighter)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let r = radius / 4; r <= radius; r += radius / 4) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Label axes
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    if (centerX + radius + 25 < width) {
      ctx.fillText('1', centerX + radius + 10, centerY + 5);
    }
    if (centerX - radius - 25 > 0) {
      ctx.fillText('-1', centerX - radius - 25, centerY + 5);
    }
    if (centerY - radius - 10 > 0) {
      ctx.fillText('1', centerX + 5, centerY - radius - 10);
    }
    if (centerY + radius + 20 < height) {
      ctx.fillText('-1', centerX + 5, centerY + radius + 20);
    }
    
    // Draw unit circle
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Special angle markers (only common angles: 0, 30, 45, 60, 90 and quadrant angles)
    [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].forEach((deg) => {
      const rad = deg * Math.PI / 180;
      const x = centerX + radius * Math.cos(rad);
      const y = centerY - radius * Math.sin(rad);
      ctx.fillStyle = '#d0d0d0';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Calculate current position
    const x = centerX + radius * cosVal;
    const y = centerY - radius * sinVal;
    
    // Draw radius line
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Draw right triangle
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Horizontal (cosine)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, centerY);
    ctx.stroke();
    
    // Vertical (sine)
    ctx.beginPath();
    ctx.moveTo(x, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label cos (adjacent)
    ctx.fillStyle = '#1976d2';
    ctx.font = 'bold 11px Arial';
    const cosLabelX = centerX + (x - centerX) / 2 - 35;
    const cosLabelY = centerY + (centerY > y ? 20 : -10);
    ctx.fillText(`cos = ${cosVal.toFixed(3)}`, cosLabelX, cosLabelY);
    
    // Label sin (opposite)
    ctx.fillStyle = '#d32f2f';
    const sinLabelX = x + (x > centerX ? 10 : -70);
    const sinLabelY = centerY - (centerY - y) / 2;
    ctx.fillText(`sin = ${sinVal.toFixed(3)}`, sinLabelX, sinLabelY);
    
    // Draw angle arc
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, -angleRad, angleRad > 0);
    ctx.stroke();
    
    // Label angle
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 12px Arial';
    const labelAngle = -angleRad / 2;
    const labelRadius = 50;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY - labelRadius * Math.sin(labelAngle);
    ctx.fillText(useDegrees ? `${angle}°` : `${angle.toFixed(2)}`, labelX - 15, labelY + 5);
    
    // Draw point on circle
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw center point
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label coordinates (position dynamically based on quadrant)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Arial';
    const coordText = `(${cosVal.toFixed(2)}, ${sinVal.toFixed(2)})`;
    const offsetX = x > centerX ? 12 : -60;
    const offsetY = y < centerY ? -10 : 15;
    ctx.fillText(coordText, x + offsetX, y + offsetY);
    
  }, [angle, angleRad, sinVal, cosVal, tanVal, useDegrees, specialAngles]);

  // Draw Wave Graph
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const amplitude = height / 3;
    const wavelength = width / (2 * Math.PI);
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let y = 0; y <= height; y += amplitude) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Label axes
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.fillText('1', 5, centerY - amplitude + 10);
    ctx.fillText('0', 5, centerY + 3);
    ctx.fillText('-1', 5, centerY + amplitude);
    ctx.fillText('0°', 10, centerY + 12);
    ctx.fillText('90°', wavelength * Math.PI / 2 - 10, centerY + 12);
    ctx.fillText('180°', wavelength * Math.PI - 15, centerY + 12);
    ctx.fillText('270°', wavelength * Math.PI * 3 / 2 - 15, centerY + 12);
    ctx.fillText('360°', wavelength * 2 * Math.PI - 20, centerY + 12);
    
    // Draw sine wave
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const angle = (x / wavelength);
      const y = centerY - amplitude * Math.sin(angle);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw cosine wave
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const angle = (x / wavelength);
      const y = centerY - amplitude * Math.cos(angle);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw current angle marker
    const currentX = angleRad * wavelength;
    if (currentX <= width) {
      // Vertical line at current angle
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Mark sin value
      const sinY = centerY - amplitude * sinVal;
      ctx.fillStyle = '#d32f2f';
      ctx.beginPath();
      ctx.arc(currentX, sinY, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Mark cos value
      const cosY = centerY - amplitude * cosVal;
      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.arc(currentX, cosY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Legend
    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('● sin(θ)', width - 80, 20);
    ctx.fillStyle = '#1976d2';
    ctx.fillText('● cos(θ)', width - 80, 40);
    
  }, [angle, angleRad, sinVal, cosVal]);

  const viewModes = [
    { id: 'unitCircle', label: 'Unit Circle', icon: '⭕', desc: 'See sin, cos, tan on circle' },
    { id: 'waves', label: 'Wave Graphs', icon: '〰️', desc: 'Sin & cos wave patterns' },
    { id: 'combined', label: 'Both Views', icon: '🎯', desc: 'Circle + waves together' }
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 280px)', overflow: 'hidden' }}>
      <Grid container spacing={1.5} sx={{ height: '100%' }}>
        {/* Left Column - Controls */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, height: '100%', overflow: 'hidden' }}>
            {/* Angle Control with Current Value */}
            <Paper elevation={3} sx={{ p: 1.2, bgcolor: '#e3f2fd' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                  Angle: θ = {useDegrees ? `${angle}°` : `${angleRad.toFixed(2)} rad`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    label="°"
                    onClick={() => setUseDegrees(true)}
                    color={useDegrees ? 'primary' : 'default'}
                    size="small"
                    sx={{ cursor: 'pointer', minWidth: 30, height: 24, fontSize: '0.7rem' }}
                  />
                  <Chip
                    label="rad"
                    onClick={() => setUseDegrees(false)}
                    color={!useDegrees ? 'primary' : 'default'}
                    size="small"
                    sx={{ cursor: 'pointer', minWidth: 35, height: 24, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
              <Slider
                value={useDegrees ? angle : angleRad}
                onChange={(e, v) => useDegrees ? setAngle(v) : setAngle(v * 180 / Math.PI)}
                min={0}
                max={useDegrees ? 360 : 2 * Math.PI}
                step={useDegrees ? 1 : 0.01}
                valueLabelDisplay="auto"
                size="small"
                sx={{ color: '#4caf50' }}
              />
            </Paper>

            {/* Common Angles + View Mode Combined */}
            <Paper elevation={2} sx={{ p: 1.2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 0.8, fontSize: '0.8rem' }}>
                Quick Angles:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1.2 }}>
                {[0, 30, 45, 60, 90].map((deg) => (
                  <Chip
                    key={deg}
                    label={`${deg}°`}
                    onClick={() => setAngle(deg)}
                    color={angle === deg ? 'success' : 'default'}
                    size="small"
                    sx={{ cursor: 'pointer', minWidth: 45, fontSize: '0.75rem', fontWeight: 'bold' }}
                  />
                ))}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" sx={{ mb: 0.8, fontSize: '0.8rem' }}>
                View:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {viewModes.map((mode) => (
                  <Chip
                    key={mode.id}
                    label={`${mode.icon}`}
                    onClick={() => setViewMode(mode.id)}
                    color={viewMode === mode.id ? 'primary' : 'default'}
                    size="small"
                    title={mode.label}
                    sx={{ 
                      cursor: 'pointer', 
                      flex: 1,
                      fontSize: '1rem'
                    }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Current Values + Reference Table Combined */}
            <Paper elevation={2} sx={{ p: 1.2, bgcolor: '#fff8e1', flex: 1, overflow: 'auto' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 0.8, fontSize: '0.8rem', textAlign: 'center' }}>
                📊 Values at {angle}°
              </Typography>
              
              {/* Current Values */}
              <Box sx={{ mb: 1, p: 0.8, bgcolor: 'white', borderRadius: 1 }}>
                <Typography sx={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '0.85rem', mb: 0.3 }}>
                  sin = {getExactValue(angle, 'sin') || sinVal.toFixed(4)}
                  {getExactValue(angle, 'sin') && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>≈ {sinVal.toFixed(3)}</span>}
                </Typography>
                <Typography sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '0.85rem', mb: 0.3 }}>
                  cos = {getExactValue(angle, 'cos') || cosVal.toFixed(4)}
                  {getExactValue(angle, 'cos') && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>≈ {cosVal.toFixed(3)}</span>}
                </Typography>
                <Typography sx={{ color: '#9c27b0', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  tan = {getExactValue(angle, 'tan') || (Math.abs(tanVal) < 100 ? tanVal.toFixed(4) : '∞')}
                  {getExactValue(angle, 'tan') && getExactValue(angle, 'tan') !== '∞' && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>≈ {tanVal.toFixed(3)}</span>}
                </Typography>
              </Box>

              {/* Compact Reference Table */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', textAlign: 'center' }}>
                📚 Common Angle Values
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ffb300' }}>
                      <th style={{ padding: '3px 2px', textAlign: 'center', fontSize: '0.65rem' }}>θ</th>
                      <th style={{ padding: '3px 2px', textAlign: 'center', color: '#d32f2f', fontSize: '0.65rem' }}>sin</th>
                      <th style={{ padding: '3px 2px', textAlign: 'center', color: '#1976d2', fontSize: '0.65rem' }}>cos</th>
                      <th style={{ padding: '3px 2px', textAlign: 'center', color: '#9c27b0', fontSize: '0.65rem' }}>tan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commonAngles.map((ca) => (
                      <tr 
                        key={ca.deg} 
                        style={{ 
                          borderBottom: '1px solid #fff3e0',
                          backgroundColor: angle === ca.deg ? '#ffecb3' : 'transparent',
                          fontWeight: angle === ca.deg ? 'bold' : 'normal'
                        }}
                      >
                        <td style={{ padding: '3px 2px', textAlign: 'center' }}>{ca.deg}°</td>
                        <td style={{ padding: '3px 2px', textAlign: 'center', color: '#d32f2f' }}>{ca.sin}</td>
                        <td style={{ padding: '3px 2px', textAlign: 'center', color: '#1976d2' }}>{ca.cos}</td>
                        <td style={{ padding: '3px 2px', textAlign: 'center', color: '#9c27b0' }}>{ca.tan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              {/* Compact Memory Aid */}
              <Box sx={{ mt: 1, p: 0.6, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', mb: 0.3, textAlign: 'center' }}>
                  💡 SOHCAHTOA
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                  <span style={{ color: '#d32f2f' }}>S</span>in=Opp/Hyp • 
                  <span style={{ color: '#1976d2' }}>C</span>os=Adj/Hyp • 
                  <span style={{ color: '#9c27b0' }}>T</span>an=Opp/Adj
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column - Visualizations */}
        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, height: '100%', overflow: 'hidden' }}>
            {/* Unit Circle */}
            {(viewMode === 'combined' || viewMode === 'unitCircle') && (
              <Paper elevation={3} sx={{ p: 1.5, bgcolor: '#fafafa', flex: viewMode === 'combined' ? 1 : 1, overflow: 'hidden' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, textAlign: 'center', fontSize: '0.75rem' }}>
                  Unit Circle - Interactive Trigonometry
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: viewMode === 'combined' ? 390 : 490, overflow: 'hidden' }}>
                  <canvas
                    ref={unitCircleRef}
                    width={viewMode === 'combined' ? 520 : 580}
                    height={viewMode === 'combined' ? 380 : 480}
                    style={{
                      border: '2px solid #1976d2',
                      borderRadius: 8,
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                      backgroundColor: 'white'
                    }}
                  />
                </Box>
              </Paper>
            )}

            {/* Wave Graph */}
            {(viewMode === 'combined' || viewMode === 'waves') && (
              <Paper elevation={3} sx={{ p: 1.5, bgcolor: '#fafafa', flex: viewMode === 'waves' ? 1 : 'auto', overflow: 'hidden' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, textAlign: 'center', fontSize: '0.75rem' }}>
                  Sine & Cosine Waves
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: viewMode === 'combined' ? 230 : 390, overflow: 'hidden' }}>
                  <canvas
                    ref={waveRef}
                    width={viewMode === 'combined' ? 620 : 720}
                    height={viewMode === 'combined' ? 220 : 380}
                    style={{
                      border: '2px solid #1976d2',
                      borderRadius: 8,
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                      backgroundColor: 'white'
                    }}
                  />
                </Box>
              </Paper>
            )}

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

function MathVisualization() {
  const [selectedViz, setSelectedViz] = useState(null);

  const visualizations = [
    { id: 'quadratic', name: 'Quadratic Functions', icon: '📈', description: 'Visualize y = ax² + bx + c' },
    { id: 'pythagorean', name: 'Pythagorean Theorem', icon: '📐', description: 'a² + b² = c²' },
    { id: 'circle', name: 'Circle Equation', icon: '⭕', description: '(x-h)² + (y-k)² = r²' },
    { id: 'trig', name: 'Trigonometric Functions', icon: '〰️', description: 'Sin, Cos, Tan waves' }
  ];

  const renderPythagoreanViz = () => <PythagoreanVisualization />;

  const renderCircleViz = () => <CircleVisualization />;

  const renderTrigViz = () => <TrigVisualization />;

  if (!selectedViz) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Math Visualizations</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select a visualization to explore mathematical concepts interactively
        </Typography>
        <Grid container spacing={2}>
          {visualizations.map((viz) => (
            <Grid item xs={12} sm={6} key={viz.id}>
              <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => setSelectedViz(viz.id)}>
                <CardActionArea>
                  <CardContent>
                    <Typography variant="h3" sx={{ mb: 1 }}>{viz.icon}</Typography>
                    <Typography variant="h6" gutterBottom>{viz.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{viz.description}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => setSelectedViz(null)}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5">
          {visualizations.find(v => v.id === selectedViz)?.name}
        </Typography>
      </Box>
      {selectedViz === 'quadratic' && <QuadraticVisualization />}
      {selectedViz === 'pythagorean' && renderPythagoreanViz()}
      {selectedViz === 'circle' && renderCircleViz()}
      {selectedViz === 'trig' && renderTrigViz()}
    </Box>
  );
}

function GraphPlotter() {
  const [expression, setExpression] = useState('x^2');
  const [points, setPoints] = useState([]);
  const [error, setError] = useState('');

  const plotFunction = () => {
    try {
      setError('');
      const newPoints = [];
      for (let x = -10; x <= 10; x += 0.5) {
        try {
          const y = math.evaluate(expression, { x });
          if (isFinite(y) && !isNaN(y)) {
            newPoints.push({ x, y });
          }
        } catch (e) {
          // Skip invalid points
        }
      }
      if (newPoints.length === 0) {
        setError('No valid points generated. Check your expression.');
      }
      setPoints(newPoints);
    } catch (e) {
      setError('Invalid expression. Use x as variable (e.g., x^2, sin(x), 2*x+1)');
      setPoints([]);
    }
  };

  const examples = [
    { name: 'Linear', expr: '2*x + 1' },
    { name: 'Quadratic', expr: 'x^2' },
    { name: 'Cubic', expr: 'x^3 - 3*x' },
    { name: 'Sine', expr: 'sin(x)' },
    { name: 'Cosine', expr: 'cos(x)' },
    { name: 'Exponential', expr: 'e^x' },
    { name: 'Absolute', expr: 'abs(x)' },
    { name: 'Sqrt', expr: 'sqrt(abs(x))' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Function Graph Plotter</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter a mathematical expression and plot its graph
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Enter expression (use x as variable)"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && plotFunction()}
            placeholder="e.g., x^2, sin(x), 2*x+1"
          />
          <Button variant="contained" onClick={plotFunction} startIcon={<GraphIcon />}>
            Plot
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Quick Examples:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {examples.map((ex) => (
            <Chip
              key={ex.name}
              label={`${ex.name}: ${ex.expr}`}
              onClick={() => { setExpression(ex.expr); }}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 400 }}>
        {points.length > 0 ? (
          <Box>
            <Typography variant="h6" gutterBottom align="center">
              y = {expression}
            </Typography>
            <Box sx={{ position: 'relative', height: 350, border: '1px solid #ddd', bgcolor: 'white' }}>
              <Typography variant="body2" color="text.secondary" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                📊 Graph visualization area<br/>
                {points.length} points plotted
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption">X range: -10 to 10</Typography>
              <Typography variant="caption">{points.length} data points</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <GraphIcon sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Enter an expression and click Plot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try: x^2, sin(x), or 2*x+1
            </Typography>
          </Box>
        )}
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Supported operations:</strong> +, -, *, /, ^, sin, cos, tan, sqrt, abs, log, exp
      </Alert>
    </Box>
  );
}

function AdvancedCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState('basic'); // basic, scientific

  const handleNumber = (num) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    setDisplay(display + ' ' + op + ' ');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleEquals = () => {
    try {
      const result = math.evaluate(display);
      const calc = `${display} = ${result}`;
      setHistory([calc, ...history.slice(0, 9)]);
      setExpression(display);
      setDisplay(String(result));
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const handleFunction = (func) => {
    try {
      let result;
      const value = parseFloat(display);
      switch (func) {
        case 'sqrt':
          result = Math.sqrt(value);
          break;
        case 'square':
          result = value * value;
          break;
        case 'sin':
          result = Math.sin(value);
          break;
        case 'cos':
          result = Math.cos(value);
          break;
        case 'tan':
          result = Math.tan(value);
          break;
        case 'log':
          result = Math.log10(value);
          break;
        case 'ln':
          result = Math.log(value);
          break;
        case '1/x':
          result = 1 / value;
          break;
        default:
          result = value;
      }
      setExpression(`${func}(${display})`);
      setDisplay(String(result));
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const basicButtons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];

  const scientificFunctions = [
    { label: '√', func: 'sqrt' },
    { label: 'x²', func: 'square' },
    { label: 'sin', func: 'sin' },
    { label: 'cos', func: 'cos' },
    { label: 'tan', func: 'tan' },
    { label: 'log', func: 'log' },
    { label: 'ln', func: 'ln' },
    { label: '1/x', func: '1/x' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Advanced Calculator</Typography>
        <ToggleButtonGroup value={mode} exclusive onChange={(e, v) => v && setMode(v)} size="small">
          <ToggleButton value="basic">Basic</ToggleButton>
          <ToggleButton value="scientific">Scientific</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            {/* Display */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', minHeight: 80 }}>
              {expression && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {expression}
                </Typography>
              )}
              <Typography variant="h4" align="right" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {display}
              </Typography>
            </Paper>

            {/* Scientific Functions */}
            {mode === 'scientific' && (
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={1}>
                  {scientificFunctions.map((fn) => (
                    <Grid item xs={3} key={fn.func}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleFunction(fn.func)}
                        sx={{ minHeight: 50 }}
                      >
                        {fn.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Number Pad */}
            <Grid container spacing={1}>
              {basicButtons.map((row, i) => (
                <React.Fragment key={i}>
                  {row.map((btn) => (
                    <Grid item xs={3} key={btn}>
                      <Button
                        fullWidth
                        variant={['+', '-', '*', '/', '='].includes(btn) ? 'contained' : 'outlined'}
                        onClick={() => {
                          if (btn === '=') handleEquals();
                          else if (['+', '-', '*', '/'].includes(btn)) handleOperator(btn);
                          else handleNumber(btn);
                        }}
                        sx={{ minHeight: 60, fontSize: '1.2rem' }}
                      >
                        {btn}
                      </Button>
                    </Grid>
                  ))}
                </React.Fragment>
              ))}
              <Grid item xs={12}>
                <Button fullWidth variant="outlined" color="error" onClick={handleClear}>
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* History */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>History</Typography>
            <Divider sx={{ mb: 2 }} />
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No calculations yet
              </Typography>
            ) : (
              <Box>
                {history.map((calc, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    sx={{
                      p: 1,
                      mb: 1,
                      bgcolor: '#f5f5f5',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}
                    onClick={() => {
                      const parts = calc.split(' = ');
                      if (parts.length === 2) setDisplay(parts[1]);
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {calc}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Tips:</strong> Use the scientific mode for advanced functions. Click history items to reuse results.
      </Alert>
    </Box>
  );
}

// ==================== MAIN COMPONENT ====================
function MathLabV2({ open, onClose, user, fullScreen = false }) {
  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isFullScreen = fullScreen || isMobile;
  
  const [activeTab, setActiveTab] = useState(0);
  
  // v10.4.7: Move AI Chat state to main component (like Chemistry)
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Get user info (like Chemistry)
  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  const MATH_QUESTIONS = [
    "Explain quadratic equations",
    "What is calculus?",
    "Show me trigonometry basics",
    "Explain derivatives"
  ];

  const askMathAI = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    const userQuestion = question;
    setQuestion('');
    setChatHistory(prev => [{ role: 'user', content: userQuestion, timestamp: Date.now() }, ...prev]);
    
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
                   hasKannada ? 'Kannada (ಕನ్ನడ)' :
                   hasMalayalam ? 'Malayalam (മലയാളം)' : 'English';
      
      const prompt = `You are Vyonn AI Math, a brilliant and friendly mathematics tutor.

${isRegional ? `🚨 IMPORTANT: Student asked in ${lang}. You MUST respond in ${lang}!` : ''}

Student asked: "${userQuestion}"

Provide a clear, educational response that:
1. Explains the concept step-by-step ${isRegional ? `(in ${lang})` : ''}
2. Uses examples where helpful ${isRegional ? `(in ${lang})` : ''}
3. Includes relevant formulas or equations
4. Is encouraging and supportive ${isRegional ? `(in ${lang})` : ''}
5. Suggests next steps for learning ${isRegional ? `(in ${lang})` : ''}

${isRegional ? `Write your ENTIRE response in ${lang} using proper Unicode!` : 'Be warm and engaging!'}`;

      const response = await callLLM(prompt, { feature: 'general', temperature: 0.7, maxTokens: 2048 });
      
      setChatHistory(prev => [{
        role: 'assistant',
        content: response || "Let me help you with that math concept!",
        timestamp: Date.now()
      }, ...prev]);
      
    } catch (error) {
      try {
        setChatHistory(prev => [{
          role: 'assistant',
          content: "Let me help you understand this math concept!",
          timestamp: Date.now()
        }, ...prev]);
      } catch (innerError) {
        // Failsafe
      }
    } finally {
      try {
        setLoading(false);
      } catch (finalError) {
        // Absolute failsafe - ensure loading clears
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isFullScreen ? false : "lg"} 
      fullWidth 
      fullScreen={isFullScreen}
      PaperProps={{ sx: { height: isFullScreen ? '100%' : '90vh' } }}
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
          <VyonnMathIcon size={36} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Vyonn Math Lab
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              AI Tutor · Experiments · Visualizations · Graphing · Calculator
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
          <Tab icon={<VyonnMathIcon size={18} />} label="Ask Vyonn AI" iconPosition="start" />
          <Tab icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Experiments" iconPosition="start" />
          <Tab icon={<GridIcon sx={{ fontSize: 18 }} />} label="Visualizations" iconPosition="start" />
          <Tab icon={<GraphIcon sx={{ fontSize: 18 }} />} label="Graph Plotter" iconPosition="start" />
          <Tab icon={<CalculateIcon sx={{ fontSize: 18 }} />} label="Calculator" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#fafafa' }}>
        {/* v10.4.7: Inline AI Chat (like Chemistry) */}
        {activeTab === 0 && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Input Section - At Top */}
            <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ask me anything about mathematics..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askMathAI())}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <VoiceInputButton
                        onTranscript={setQuestion}
                        existingText={question}
                        disabled={loading}
                        size="small"
                      />
                      <IconButton onClick={askMathAI} disabled={loading || !question.trim()} color="primary">
                        {loading ? <CircularProgress size={20} /> : <SendIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {MATH_QUESTIONS.map((q, i) => (
                  <Chip key={i} label={q} size="small" onClick={() => setQuestion(q)} sx={{ cursor: 'pointer', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, fontSize: '0.75rem' }} />
                ))}
              </Box>
            </Paper>

            {/* Chat History */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {chatHistory.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                  <MathIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: 'primary.main', 
                      mb: 2,
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': {
                          opacity: 1,
                          transform: 'scale(1)',
                        },
                        '50%': {
                          opacity: 0.6,
                          transform: 'scale(1.05)',
                        }
                      }
                    }} 
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Start a conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask questions about math
                  </Typography>
                </Box>
              ) : (
                chatHistory.map((msg, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
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
                          <VyonnMathIcon size={32} />
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
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))
              )}
              {loading && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Box sx={{ mt: 0.5 }}>
                    <VyonnMathIcon size={32} />
                  </Box>
                  <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>Thinking...</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {activeTab === 1 && <ExperimentsTab />}
        {activeTab === 2 && <MathVisualization />}
        {activeTab === 3 && <GraphPlotter />}
        {activeTab === 4 && <AdvancedCalculator />}
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

export default MathLabV2;

