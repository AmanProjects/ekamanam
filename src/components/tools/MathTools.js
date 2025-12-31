import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Grid,
  Tabs,
  Tab,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Card,
  CardContent,
  CardActionArea,
  Slider,
  Alert,
  LinearProgress,
  Fade,
  Zoom,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Functions as FunctionsIcon,
  ShowChart as GraphIcon,
  Calculate as CalculatorIcon,
  School as SchoolIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  PlayArrow as PlayIcon,
  VolumeUp as SpeakIcon,
  LightbulbOutlined as TipIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import * as math from 'mathjs';

// ==================== VOICE HELPER (Natural speech for learning) ====================
const speak = (text, rate = 0.9) => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.1;
    // Try to get a natural voice
    const voices = speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google') || 
      v.name.includes('Natural') ||
      v.lang.startsWith('en')
    ) || voices[0];
    if (naturalVoice) utterance.voice = naturalVoice;
    speechSynthesis.speak(utterance);
  }
};

// ==================== CURRICULUM DATA ====================
const CURRICULUM = {
  1: {
    name: 'Class 1',
    category: 'Primary School',
    focus: 'Number sense, basic operations, intuition',
    color: '#e91e63',
    topics: [
      { id: 'counting', name: 'Counting (1-100)', icon: '🔢', description: 'Learn to count with fun animations' },
      { id: 'comparison', name: 'Compare Numbers', icon: '⚖️', description: 'Which number is bigger?' },
      { id: 'addition', name: 'Addition', icon: '➕', description: 'Adding single digit numbers' },
      { id: 'subtraction', name: 'Subtraction', icon: '➖', description: 'Taking away numbers' },
      { id: 'shapes', name: 'Shapes', icon: '🔷', description: 'Explore circles, squares, triangles' },
      { id: 'patterns', name: 'Patterns', icon: '🎨', description: 'Find the missing pattern' },
      { id: 'measurement', name: 'Measurement', icon: '📏', description: 'Long, short, heavy, light' },
      { id: 'money', name: 'Money', icon: '💰', description: 'Coins and notes' }
    ]
  },
  2: {
    name: 'Class 2',
    category: 'Primary School',
    focus: 'Place value, operations with carry/borrow',
    color: '#9c27b0',
    topics: [
      { id: 'placeValue', name: 'Place Value', icon: '🔢', description: 'Ones, Tens, Hundreds' },
      { id: 'addCarry', name: 'Addition with Carry', icon: '➕', description: 'Adding bigger numbers' },
      { id: 'subBorrow', name: 'Subtraction with Borrow', icon: '➖', description: 'Borrowing to subtract' },
      { id: 'multiplication', name: 'Multiplication Intro', icon: '✖️', description: 'Groups and arrays' },
      { id: 'division', name: 'Division Intro', icon: '➗', description: 'Sharing equally' },
      { id: 'fractions', name: 'Fractions', icon: '🥧', description: 'Half and quarter' },
      { id: 'time', name: 'Time', icon: '🕐', description: 'Reading the clock' },
      { id: 'geometry', name: 'Lines & Shapes', icon: '📐', description: 'Straight, curved, corners' }
    ]
  },
  3: {
    name: 'Class 3',
    category: 'Primary School',
    focus: 'Numbers to 10,000, multiplication tables',
    color: '#673ab7',
    topics: [
      { id: 'largeNumbers', name: 'Large Numbers', icon: '🔢', description: 'Numbers up to 10,000' },
      { id: 'multiplication', name: 'Times Tables', icon: '✖️', description: 'Master 2-10 tables' },
      { id: 'division', name: 'Division', icon: '➗', description: 'Dividing with remainders' },
      { id: 'fractions', name: 'Fractions', icon: '🥧', description: 'Adding and comparing' },
      { id: 'decimals', name: 'Decimals Intro', icon: '🔟', description: 'Tenths and hundredths' },
      { id: 'areaPerimeter', name: 'Area & Perimeter', icon: '📐', description: 'Measuring shapes' },
      { id: 'angles', name: 'Angles', icon: '📏', description: 'Right, acute, obtuse' },
      { id: 'barGraphs', name: 'Bar Graphs', icon: '📊', description: 'Reading and making graphs' }
    ]
  },
  4: {
    name: 'Class 4',
    category: 'Primary School',
    focus: 'Factors, multiples, fraction operations',
    color: '#3f51b5',
    topics: [
      { id: 'factors', name: 'Factors & Multiples', icon: '🔄', description: 'LCM and GCD' },
      { id: 'fractionOps', name: 'Fraction Operations', icon: '🥧', description: 'Add, subtract, multiply' },
      { id: 'decimals', name: 'Decimals', icon: '🔟', description: 'Operations with decimals' },
      { id: 'measurement', name: 'Area & Volume', icon: '📦', description: '3D shapes' },
      { id: 'geometry', name: 'Polygons', icon: '🔷', description: 'Symmetry and patterns' },
      { id: 'data', name: 'Data Analysis', icon: '📊', description: 'Tables and charts' }
    ]
  },
  5: {
    name: 'Class 5',
    category: 'Primary School',
    focus: 'Percentage, ratio, advanced operations',
    color: '#2196f3',
    topics: [
      { id: 'wholeNumbers', name: 'Large Operations', icon: '🔢', description: 'Big number calculations' },
      { id: 'fractionOps', name: 'Fraction Mastery', icon: '🥧', description: 'All fraction operations' },
      { id: 'decimals', name: 'Decimal Mastery', icon: '🔟', description: 'All decimal operations' },
      { id: 'percentage', name: 'Percentage', icon: '💯', description: 'What is percent?' },
      { id: 'ratio', name: 'Ratio', icon: '⚖️', description: 'Comparing quantities' },
      { id: 'geometry', name: 'Circles & Angles', icon: '⭕', description: 'Circle properties' },
      { id: 'volume', name: 'Volume', icon: '📦', description: '3D measurements' },
      { id: 'data', name: 'Data Interpretation', icon: '📊', description: 'Analyze charts' }
    ]
  },
  6: {
    name: 'Class 6',
    category: 'Middle School',
    focus: 'Integers, algebra basics, formal geometry',
    color: '#00bcd4',
    topics: [
      { id: 'integers', name: 'Integers', icon: '🔢', description: 'Positive and negative' },
      { id: 'factorsMultiples', name: 'Factors & Multiples', icon: '🔄', description: 'Prime factorization' },
      { id: 'fractionDecimals', name: 'Fractions & Decimals', icon: '🥧', description: 'Conversion' },
      { id: 'ratio', name: 'Ratio & Proportion', icon: '⚖️', description: 'Direct proportion' },
      { id: 'algebra', name: 'Algebra Intro', icon: '🔤', description: 'Variables and equations' },
      { id: 'geometry', name: 'Triangles', icon: '📐', description: 'Types and properties' },
      { id: 'mensuration', name: 'Perimeter & Area', icon: '📏', description: 'All shapes' },
      { id: 'data', name: 'Data Handling', icon: '📊', description: 'Mean, median, mode' }
    ]
  },
  7: {
    name: 'Class 7',
    category: 'Middle School',
    focus: 'Rational numbers, linear equations',
    color: '#009688',
    topics: [
      { id: 'integerOps', name: 'Integer Operations', icon: '🔢', description: 'All operations' },
      { id: 'rational', name: 'Rational Numbers', icon: '🔟', description: 'Number line' },
      { id: 'linearEq', name: 'Linear Equations', icon: '🔤', description: 'Solving equations' },
      { id: 'ratioPct', name: 'Percentage', icon: '💯', description: 'Profit, loss, discount' },
      { id: 'triangles', name: 'Triangle Congruence', icon: '📐', description: 'SSS, SAS, ASA' },
      { id: 'mensuration', name: 'Area & Volume', icon: '📦', description: 'Complex shapes' },
      { id: 'probability', name: 'Probability', icon: '🎲', description: 'Chance and likelihood' }
    ]
  },
  8: {
    name: 'Class 8',
    category: 'Middle School',
    focus: 'Algebraic expressions, coordinate geometry',
    color: '#4caf50',
    topics: [
      { id: 'rational', name: 'Rational Numbers', icon: '🔟', description: 'Properties' },
      { id: 'linearEqAdv', name: 'Linear Equations', icon: '🔤', description: 'Word problems' },
      { id: 'squares', name: 'Squares & Roots', icon: '²', description: 'Perfect squares' },
      { id: 'cubes', name: 'Cubes & Roots', icon: '³', description: 'Perfect cubes' },
      { id: 'algebraicExp', name: 'Algebraic Expressions', icon: '📝', description: 'Identities' },
      { id: 'quadrilaterals', name: 'Quadrilaterals', icon: '🔷', description: 'Properties' },
      { id: 'coordinate', name: 'Coordinate Geometry', icon: '📍', description: 'Plotting points' },
      { id: 'probability', name: 'Probability', icon: '🎲', description: 'Experiments' }
    ]
  },
  9: {
    name: 'Class 9',
    category: 'Secondary School',
    focus: 'Real numbers, polynomials, proofs',
    color: '#8bc34a',
    topics: [
      { id: 'realNumbers', name: 'Real Numbers', icon: '🔢', description: 'Irrational numbers' },
      { id: 'polynomials', name: 'Polynomials', icon: '📝', description: 'Degree and zeros' },
      { id: 'linearEq2Var', name: 'Linear Equations', icon: '🔤', description: 'Two variables' },
      { id: 'coordinate', name: 'Coordinate Geometry', icon: '📍', description: 'Distance formula' },
      { id: 'geometry', name: 'Geometry Proofs', icon: '📐', description: 'Theorems' },
      { id: 'mensuration', name: 'Surface Area', icon: '📦', description: '3D shapes' },
      { id: 'statistics', name: 'Statistics', icon: '📊', description: 'Central tendency' },
      { id: 'probability', name: 'Probability', icon: '🎲', description: 'Classical definition' }
    ]
  },
  10: {
    name: 'Class 10',
    category: 'Secondary School',
    focus: 'Quadratics, trigonometry, circles',
    color: '#cddc39',
    topics: [
      { id: 'realNumbers', name: 'Real Numbers', icon: '🔢', description: "Euclid's algorithm" },
      { id: 'polynomials', name: 'Polynomials', icon: '📝', description: 'Factorization' },
      { id: 'quadratic', name: 'Quadratic Equations', icon: '²', description: 'Formula and roots' },
      { id: 'ap', name: 'Arithmetic Progressions', icon: '📈', description: 'nth term and sum' },
      { id: 'coordinate', name: 'Coordinate Geometry', icon: '📍', description: 'Section formula' },
      { id: 'trigonometry', name: 'Trigonometry', icon: '📐', description: 'Ratios and identities' },
      { id: 'circles', name: 'Circles', icon: '⭕', description: 'Tangents and chords' },
      { id: 'mensuration', name: 'Mensuration', icon: '📦', description: 'Combined shapes' },
      { id: 'statistics', name: 'Statistics', icon: '📊', description: 'Grouped data' }
    ]
  },
  11: {
    name: 'Class 11',
    category: 'Senior Secondary',
    focus: 'Sets, functions, calculus introduction',
    color: '#ff9800',
    topics: [
      { id: 'sets', name: 'Sets', icon: '🔗', description: 'Operations and Venn' },
      { id: 'relations', name: 'Relations & Functions', icon: '🔄', description: 'Domain and range' },
      { id: 'trigFunctions', name: 'Trigonometric Functions', icon: '📐', description: 'Graphs and equations' },
      { id: 'complex', name: 'Complex Numbers', icon: '🔢', description: 'Argand plane' },
      { id: 'inequalities', name: 'Linear Inequalities', icon: '⚖️', description: 'Graphical solutions' },
      { id: 'permComb', name: 'Permutations', icon: '🔄', description: 'nPr and nCr' },
      { id: 'binomial', name: 'Binomial Theorem', icon: '📝', description: 'Expansion' },
      { id: 'sequences', name: 'Sequences & Series', icon: '📈', description: 'AP, GP, HP' },
      { id: 'conics', name: 'Conic Sections', icon: '🔵', description: 'Parabola, ellipse' },
      { id: 'limits', name: 'Limits & Derivatives', icon: '∞', description: 'First principles' },
      { id: 'statistics', name: 'Statistics', icon: '📊', description: 'Variance, SD' },
      { id: 'probability', name: 'Probability', icon: '🎲', description: 'Addition theorem' }
    ]
  },
  12: {
    name: 'Class 12',
    category: 'Senior Secondary',
    focus: 'Calculus, vectors, 3D geometry',
    color: '#ff5722',
    topics: [
      { id: 'relations', name: 'Relations & Functions', icon: '🔄', description: 'Types of functions' },
      { id: 'inverseTrig', name: 'Inverse Trigonometry', icon: '📐', description: 'Principal values' },
      { id: 'matrices', name: 'Matrices', icon: '🔲', description: 'Operations' },
      { id: 'determinants', name: 'Determinants', icon: '🔲', description: "Cramer's rule" },
      { id: 'continuity', name: 'Continuity', icon: '📈', description: 'Differentiability' },
      { id: 'derivatives', name: 'Applications of Derivatives', icon: '📉', description: 'Rate of change' },
      { id: 'integrals', name: 'Integrals', icon: '∫', description: 'Definite and indefinite' },
      { id: 'integralApps', name: 'Applications of Integrals', icon: '📊', description: 'Area under curves' },
      { id: 'diffEq', name: 'Differential Equations', icon: '📝', description: 'Order and degree' },
      { id: 'vectors', name: 'Vector Algebra', icon: '➡️', description: 'Dot and cross product' },
      { id: '3dGeometry', name: '3D Geometry', icon: '📦', description: 'Lines and planes' },
      { id: 'linearProg', name: 'Linear Programming', icon: '📈', description: 'Optimization' },
      { id: 'probability', name: 'Probability', icon: '🎲', description: "Bayes' theorem" }
    ]
  }
};

// ==================== INTERACTIVE LEARNING COMPONENTS ====================

// Counting Game (Class 1)
const CountingGame = ({ onComplete }) => {
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  const animals = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐔', '🐧', '🦋', '🐝'];
  
  const startNewRound = useCallback(() => {
    const target = Math.floor(Math.random() * 10) + 1;
    const animal = animals[Math.floor(Math.random() * animals.length)];
    setTargetNumber(target);
    setCurrentCount(0);
    setItems(Array(target).fill(animal));
    setMessage(`Count the ${animal}s! Tap each one.`);
    setGameStarted(true);
  }, []);
  
  const handleItemClick = (index) => {
    if (items[index].counted) return;
    
    const newItems = [...items];
    newItems[index] = { emoji: newItems[index].emoji || newItems[index], counted: true };
    setItems(newItems);
    
    const newCount = currentCount + 1;
    setCurrentCount(newCount);
    
    // Speak the number
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(newCount.toString());
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
    
    if (newCount === targetNumber) {
      setScore(prev => prev + 10);
      setMessage(`🎉 Excellent! You counted ${targetNumber}! +10 points`);
      if (onComplete) onComplete(10);
      setTimeout(startNewRound, 2000);
    }
  };
  
  useEffect(() => {
    startNewRound();
  }, [startNewRound]);
  
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
        <Chip icon={<TrophyIcon />} label={`Count: ${currentCount}`} color="secondary" />
      </Box>
      
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        {message}
      </Typography>
      
      {gameStarted && (
        <Paper sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: 2 
          }}>
            {items.map((item, index) => (
              <Zoom in key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                <Box
                  onClick={() => handleItemClick(index)}
                  sx={{
                    fontSize: '3rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    opacity: item.counted ? 0.4 : 1,
                    transform: item.counted ? 'scale(0.8)' : 'scale(1)',
                    '&:hover': { transform: item.counted ? 'scale(0.8)' : 'scale(1.2)' },
                    filter: item.counted ? 'grayscale(50%)' : 'none'
                  }}
                >
                  {item.emoji || item}
                </Box>
              </Zoom>
            ))}
          </Box>
        </Paper>
      )}
      
      <Button 
        variant="contained" 
        onClick={startNewRound} 
        sx={{ mt: 2 }}
        startIcon={<RefreshIcon />}
      >
        New Round
      </Button>
    </Box>
  );
};

// Number Comparison Game (Class 1-2)
const ComparisonGame = ({ onComplete }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [streak, setStreak] = useState(0);
  
  const generateNumbers = useCallback(() => {
    setNum1(Math.floor(Math.random() * 100) + 1);
    setNum2(Math.floor(Math.random() * 100) + 1);
    setFeedback('');
  }, []);
  
  useEffect(() => { generateNumbers(); }, [generateNumbers]);
  
  const handleAnswer = (answer) => {
    const correct = 
      (answer === '>' && num1 > num2) ||
      (answer === '<' && num1 < num2) ||
      (answer === '=' && num1 === num2);
    
    if (correct) {
      const points = 10 + streak * 2;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setFeedback(`✅ Correct! +${points} points (Streak: ${streak + 1})`);
      if (onComplete) onComplete(points);
    } else {
      setStreak(0);
      setFeedback(`❌ Oops! ${num1} ${num1 > num2 ? '>' : num1 < num2 ? '<' : '='} ${num2}`);
    }
    setTimeout(generateNumbers, 1500);
  };
  
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
        <Chip icon={<TrophyIcon />} label={`Streak: ${streak}`} color="secondary" />
      </Box>
      
      <Typography variant="h6" gutterBottom>Which is correct?</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, my: 3 }}>
        <Paper sx={{ 
          p: 3, 
          bgcolor: '#e3f2fd', 
          borderRadius: 2,
          minWidth: 100 
        }}>
          <Typography variant="h3" fontWeight={700} color="primary">
            {num1}
          </Typography>
        </Paper>
        
        <Typography variant="h4" color="text.secondary">?</Typography>
        
        <Paper sx={{ 
          p: 3, 
          bgcolor: '#fce4ec', 
          borderRadius: 2,
          minWidth: 100 
        }}>
          <Typography variant="h3" fontWeight={700} color="secondary">
            {num2}
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {['<', '=', '>'].map(op => (
          <Button
            key={op}
            variant="contained"
            size="large"
            onClick={() => handleAnswer(op)}
            sx={{ 
              fontSize: '1.5rem', 
              minWidth: 80, 
              py: 2,
              bgcolor: op === '<' ? '#2196f3' : op === '>' ? '#f44336' : '#4caf50'
            }}
          >
            {op}
          </Button>
        ))}
      </Box>
      
      <Fade in={!!feedback}>
        <Typography variant="h6" sx={{ mt: 3, color: feedback.includes('✅') ? 'success.main' : 'error.main' }}>
          {feedback}
        </Typography>
      </Fade>
    </Box>
  );
};

// Addition Practice (Class 1-3)
const AdditionPractice = ({ maxNumber = 20, onComplete }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  
  const generateProblem = useCallback(() => {
    const a = Math.floor(Math.random() * (maxNumber / 2)) + 1;
    const b = Math.floor(Math.random() * (maxNumber / 2)) + 1;
    setNum1(a);
    setNum2(b);
    setAnswer('');
    setFeedback('');
    setShowHint(false);
  }, [maxNumber]);
  
  useEffect(() => { generateProblem(); }, [generateProblem]);
  
  const checkAnswer = () => {
    const correct = parseInt(answer) === num1 + num2;
    if (correct) {
      setScore(prev => prev + 10);
      setFeedback('🎉 Correct! Great job!');
      if (onComplete) onComplete(10);
      setTimeout(generateProblem, 1500);
    } else {
      setFeedback('Try again! Use the hint if you need help.');
      setShowHint(true);
    }
  };
  
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" sx={{ mb: 3 }} />
      
      <Paper sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 3, mb: 3 }}>
        <Typography variant="h2" sx={{ fontFamily: 'monospace' }}>
          {num1} + {num2} = ?
        </Typography>
      </Paper>
      
      <TextField
        value={answer}
        onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
        onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        placeholder="Your answer"
        sx={{ mb: 2, width: 150 }}
        inputProps={{ style: { fontSize: '2rem', textAlign: 'center' } }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="contained" onClick={checkAnswer} startIcon={<CheckIcon />}>
          Check
        </Button>
        <Button variant="outlined" onClick={generateProblem} startIcon={<RefreshIcon />}>
          New Problem
        </Button>
      </Box>
      
      {showHint && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: '#fff3e0' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            💡 Hint: Count the objects
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {Array(num1).fill('🔵').map((dot, i) => (
              <span key={`a${i}`} style={{ fontSize: '1.5rem' }}>{dot}</span>
            ))}
            <span style={{ fontSize: '1.5rem', margin: '0 10px' }}>+</span>
            {Array(num2).fill('🟢').map((dot, i) => (
              <span key={`b${i}`} style={{ fontSize: '1.5rem' }}>{dot}</span>
            ))}
          </Box>
        </Paper>
      )}
      
      {feedback && (
        <Typography variant="h6" sx={{ mt: 2, color: feedback.includes('Correct') ? 'success.main' : 'warning.main' }}>
          {feedback}
        </Typography>
      )}
    </Box>
  );
};

// Times Table Trainer (Class 2-4)
const TimesTableTrainer = ({ onComplete }) => {
  const [table, setTable] = useState(2);
  const [multiplier, setMultiplier] = useState(1);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState('learn'); // learn, practice, quiz
  const [quizResults, setQuizResults] = useState([]);
  
  const correct = table * multiplier;
  
  const handleAnswer = () => {
    if (parseInt(answer) === correct) {
      setScore(prev => prev + 10);
      setQuizResults(prev => [...prev, { q: `${table}×${multiplier}`, correct: true }]);
      if (onComplete) onComplete(10);
      if (multiplier < 12) {
        setMultiplier(prev => prev + 1);
      } else {
        setMode('complete');
      }
      setAnswer('');
    } else {
      setQuizResults(prev => [...prev, { q: `${table}×${multiplier}`, correct: false }]);
    }
  };
  
  const speakEquation = () => {
    if ('speechSynthesis' in window) {
      const text = `${table} times ${multiplier} equals ${correct}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {['learn', 'practice', 'quiz'].map(m => (
            <Chip 
              key={m} 
              label={m.charAt(0).toUpperCase() + m.slice(1)} 
              onClick={() => { setMode(m); setMultiplier(1); setQuizResults([]); }}
              color={mode === m ? 'secondary' : 'default'}
              size="small"
            />
          ))}
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 3 }}>
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
          <Chip
            key={n}
            label={`${n}×`}
            onClick={() => { setTable(n); setMultiplier(1); setQuizResults([]); }}
            color={table === n ? 'primary' : 'default'}
            sx={{ fontWeight: 700 }}
          />
        ))}
      </Box>
      
      {mode === 'learn' && (
        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
          <Typography variant="h6" gutterBottom>Table of {table}</Typography>
          <Grid container spacing={1}>
            {Array.from({ length: 12 }, (_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Paper 
                  sx={{ 
                    p: 1.5, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#c8e6c9' }
                  }}
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      speechSynthesis.speak(new SpeechSynthesisUtterance(`${table} times ${i+1} equals ${table * (i+1)}`));
                    }
                  }}
                >
                  <Typography fontFamily="monospace" fontWeight={600}>
                    {table} × {i + 1} = {table * (i + 1)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      
      {(mode === 'practice' || mode === 'quiz') && (
        <Box sx={{ textAlign: 'center' }}>
          <Paper sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 3, mb: 3 }}>
            <Typography variant="h2" fontFamily="monospace">
              {table} × {multiplier} = ?
            </Typography>
          </Paper>
          
          {mode === 'practice' && (
            <Button 
              variant="outlined" 
              onClick={speakEquation}
              startIcon={<SpeakIcon />}
              sx={{ mb: 2 }}
            >
              Hear Answer
            </Button>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <TextField
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
              onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
              placeholder="?"
              sx={{ width: 100 }}
              inputProps={{ style: { fontSize: '2rem', textAlign: 'center' } }}
            />
            <Button variant="contained" onClick={handleAnswer}>
              Check
            </Button>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={(multiplier / 12) * 100} 
            sx={{ mt: 3, height: 10, borderRadius: 5 }}
          />
        </Box>
      )}
      
      {mode === 'complete' && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
          <Typography variant="h4" gutterBottom>🎉 Completed!</Typography>
          <Typography variant="h6">You mastered the {table} times table!</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Score: {score} | Correct: {quizResults.filter(r => r.correct).length}/12
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => { setMode('learn'); setMultiplier(1); }}
            sx={{ mt: 2 }}
          >
            Practice Another Table
          </Button>
        </Paper>
      )}
    </Box>
  );
};

// Shape Explorer (Class 1 - Simple version for young children)
const ShapeExplorer = () => {
  const [selectedShape, setSelectedShape] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizShape, setQuizShape] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const shapes = [
    { 
      name: 'Circle', 
      color: '#e91e63',
      song: 'Round and round, no corners found! A circle is smooth all around!',
      things: ['🌞 Sun', '⚽ Ball', '🍕 Pizza', '🪙 Coin'],
      description: 'A circle is round like the sun!'
    },
    { 
      name: 'Square', 
      color: '#2196f3',
      song: 'Four sides the same, that\'s my name! Square, square, I\'m a square!',
      things: ['🪟 Window', '📦 Box', '🧇 Waffle', '🎁 Gift'],
      description: 'A square has 4 equal sides!'
    },
    { 
      name: 'Triangle', 
      color: '#4caf50',
      song: 'One, two, three sides I have, triangle is my name!',
      things: ['🏔️ Mountain', '🍕 Pizza slice', '⛵ Sail', '🔺 Arrow'],
      description: 'A triangle has 3 sides!'
    },
    { 
      name: 'Rectangle', 
      color: '#ff9800',
      song: 'Two long, two short, rectangle is my sort!',
      things: ['🚪 Door', '📱 Phone', '📺 TV', '📖 Book'],
      description: 'A rectangle has 2 long and 2 short sides!'
    }
  ];
  
  const startQuiz = () => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    setQuizShape(shape);
    setQuizMode(true);
    setFeedback('');
    speak(`Find the ${shape.name}!`);
  };
  
  const checkQuizAnswer = (shape) => {
    if (shape.name === quizShape.name) {
      setScore(prev => prev + 10);
      setFeedback(`🎉 Yes! That's a ${shape.name}!`);
      speak(`Yes! Great job! That is a ${shape.name}!`);
      setTimeout(startQuiz, 2000);
    } else {
      setFeedback(`Try again! Find the ${quizShape.name}`);
      speak(`Oops! That's a ${shape.name}. Find the ${quizShape.name}!`);
    }
  };
  
  const renderShape = (shape, size = 80) => {
    switch (shape.name) {
      case 'Circle':
        return <circle cx={size/2} cy={size/2} r={size/2 - 5} fill={shape.color} />;
      case 'Square':
        return <rect x="5" y="5" width={size - 10} height={size - 10} fill={shape.color} />;
      case 'Triangle':
        return <polygon points={`${size/2},5 ${size-5},${size-5} 5,${size-5}`} fill={shape.color} />;
      case 'Rectangle':
        return <rect x="5" y={size/4} width={size - 10} height={size/2} fill={shape.color} />;
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">🔷 Learn Shapes!</Typography>
        <Box>
          <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" sx={{ mr: 1 }} />
          <Chip 
            label={quizMode ? '📚 Learn' : '🎮 Quiz'} 
            onClick={() => { setQuizMode(!quizMode); if (!quizMode) startQuiz(); }}
            color="secondary"
          />
        </Box>
      </Box>
      
      {quizMode && quizShape && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            👆 Tap the {quizShape.name}!
          </Typography>
        </Paper>
      )}
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {shapes.map((shape) => (
          <Grid item xs={6} sm={3} key={shape.name}>
            <Paper
              onClick={() => quizMode ? checkQuizAnswer(shape) : setSelectedShape(shape)}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                border: '4px solid',
                borderColor: selectedShape?.name === shape.name ? shape.color : '#e0e0e0',
                borderRadius: 3,
                transition: 'all 0.3s',
                '&:hover': { transform: 'scale(1.08)', boxShadow: 4 }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  {renderShape(shape)}
                </svg>
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: shape.color }}>
                {shape.name}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {feedback && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: feedback.includes('🎉') ? '#e8f5e9' : '#fff3e0', textAlign: 'center' }}>
          <Typography variant="h6">{feedback}</Typography>
        </Paper>
      )}
      
      {selectedShape && !quizMode && (
        <Fade in>
          <Paper sx={{ p: 3, bgcolor: `${selectedShape.color}15`, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                {renderShape({ ...selectedShape }, 100)}
              </svg>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ color: selectedShape.color }}>
                  {selectedShape.name}
                </Typography>
                <Typography variant="body1">{selectedShape.description}</Typography>
              </Box>
            </Box>
            
            <Paper sx={{ p: 2, bgcolor: '#fff', mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>🎵 Shape Song:</Typography>
              <Typography variant="body1" fontStyle="italic">"{selectedShape.song}"</Typography>
              <Button 
                onClick={() => speak(selectedShape.song)} 
                startIcon={<SpeakIcon />}
                size="small"
                sx={{ mt: 1 }}
              >
                Hear Song
              </Button>
            </Paper>
            
            <Typography variant="subtitle2" gutterBottom>🔍 Find these shapes around you:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedShape.things.map((item, i) => (
                <Chip 
                  key={i} 
                  label={item} 
                  sx={{ fontSize: '1rem', py: 2 }}
                  onClick={() => speak(item.split(' ')[1])}
                />
              ))}
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

// Measurement Basics (Class 1 - Introduction to units)
const MeasurementBasics = ({ onComplete }) => {
  const [category, setCategory] = useState('length');
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const categories = {
    length: {
      name: 'Length',
      icon: '📏',
      color: '#2196f3',
      intro: 'We measure how long or short things are!',
      units: [
        { name: 'Centimeter (cm)', icon: '📏', example: 'Your finger is about 1 cm wide', visual: '|' },
        { name: 'Meter (m)', icon: '📐', example: 'A door is about 2 meters tall', visual: '|————————|' }
      ],
      comparisons: [
        { item1: '🐜 Ant', item2: '🐘 Elephant', answer: 'short', question: 'Which is shorter?' },
        { item1: '✏️ Pencil', item2: '🚌 Bus', answer: 'long', question: 'Which is longer?' },
        { item1: '🌳 Tree', item2: '🌷 Flower', answer: 'tall', question: 'Which is taller?' }
      ]
    },
    weight: {
      name: 'Weight',
      icon: '⚖️',
      color: '#4caf50',
      intro: 'We measure how heavy or light things are!',
      units: [
        { name: 'Gram (g)', icon: '🪶', example: 'A feather weighs a few grams', visual: '○' },
        { name: 'Kilogram (kg)', icon: '🎒', example: 'Your school bag weighs a few kilograms', visual: '●●●●●' }
      ],
      comparisons: [
        { item1: '🎈 Balloon', item2: '🪨 Rock', answer: 'light', question: 'Which is lighter?' },
        { item1: '📱 Phone', item2: '🚗 Car', answer: 'heavy', question: 'Which is heavier?' },
        { item1: '🍎 Apple', item2: '🍉 Watermelon', answer: 'heavy', question: 'Which is heavier?' }
      ]
    },
    time: {
      name: 'Time',
      icon: '⏰',
      color: '#ff9800',
      intro: 'We measure how long something takes!',
      units: [
        { name: 'Second', icon: '👆', example: 'Clap your hands - that\'s about 1 second!', visual: '•' },
        { name: 'Minute', icon: '⏱️', example: 'Brush your teeth for 2 minutes', visual: '••••••' },
        { name: 'Hour', icon: '🕐', example: 'A movie is about 2 hours', visual: '🕐' }
      ],
      comparisons: [
        { item1: '😴 Sleeping', item2: '👋 Waving', answer: 'long', question: 'Which takes longer?' },
        { item1: '🚶 Walking to school', item2: '✈️ Flying to another country', answer: 'short', question: 'Which takes less time?' }
      ]
    }
  };
  
  const currentCat = categories[category];
  
  const startQuiz = () => {
    const q = currentCat.comparisons[Math.floor(Math.random() * currentCat.comparisons.length)];
    setCurrentQuestion(q);
    setQuizMode(true);
    setFeedback('');
    speak(q.question);
  };
  
  const checkAnswer = (isFirst) => {
    const correct = (currentQuestion.answer === 'short' || currentQuestion.answer === 'light' || currentQuestion.answer === 'short') 
      ? isFirst : !isFirst;
    
    // Simplified logic based on actual answer
    let isCorrect = false;
    if (['short', 'light'].includes(currentQuestion.answer)) {
      isCorrect = isFirst;
    } else {
      isCorrect = !isFirst;
    }
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setFeedback('🎉 Correct! Great job!');
      speak('Correct! Great job!');
      if (onComplete) onComplete(10);
      setTimeout(startQuiz, 2000);
    } else {
      setFeedback('Try again!');
      speak('Try again!');
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">📏 Measurement</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {Object.entries(categories).map(([key, cat]) => (
          <Chip
            key={key}
            icon={<span>{cat.icon}</span>}
            label={cat.name}
            onClick={() => { setCategory(key); setQuizMode(false); }}
            sx={{ 
              bgcolor: category === key ? cat.color : 'default',
              color: category === key ? 'white' : 'inherit',
              fontWeight: 600
            }}
          />
        ))}
      </Box>
      
      {!quizMode ? (
        <>
          <Paper sx={{ p: 3, bgcolor: `${currentCat.color}15`, borderRadius: 3, mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <span style={{ fontSize: '2rem' }}>{currentCat.icon}</span>
              {currentCat.name}
            </Typography>
            <Typography variant="body1" gutterBottom>{currentCat.intro}</Typography>
            <Button onClick={() => speak(currentCat.intro)} startIcon={<SpeakIcon />} size="small">
              Hear It
            </Button>
          </Paper>
          
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Units we use:</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {currentCat.units.map((unit, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Paper sx={{ p: 2, border: `2px solid ${currentCat.color}` }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{unit.icon}</span> {unit.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{unit.example}</Typography>
                  <Button onClick={() => speak(unit.example)} size="small" sx={{ mt: 1 }}>🔊 Hear</Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Button variant="contained" onClick={startQuiz} fullWidth size="large">
            🎮 Play Comparison Game!
          </Button>
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>{currentQuestion.question}</Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, my: 3 }}>
            <Paper 
              onClick={() => checkAnswer(true)}
              sx={{ 
                p: 3, cursor: 'pointer', minWidth: 120,
                '&:hover': { bgcolor: '#e3f2fd', transform: 'scale(1.05)' },
                transition: 'all 0.2s'
              }}
            >
              <Typography fontSize="3rem">{currentQuestion.item1.split(' ')[0]}</Typography>
              <Typography variant="body1">{currentQuestion.item1.split(' ')[1]}</Typography>
            </Paper>
            
            <Paper 
              onClick={() => checkAnswer(false)}
              sx={{ 
                p: 3, cursor: 'pointer', minWidth: 120,
                '&:hover': { bgcolor: '#e3f2fd', transform: 'scale(1.05)' },
                transition: 'all 0.2s'
              }}
            >
              <Typography fontSize="3rem">{currentQuestion.item2.split(' ')[0]}</Typography>
              <Typography variant="body1">{currentQuestion.item2.split(' ')[1]}</Typography>
            </Paper>
          </Box>
          
          {feedback && (
            <Typography variant="h6" sx={{ color: feedback.includes('🎉') ? 'success.main' : 'warning.main' }}>
              {feedback}
            </Typography>
          )}
          
          <Button variant="outlined" onClick={() => setQuizMode(false)} sx={{ mt: 2 }}>
            Back to Learning
          </Button>
        </Paper>
      )}
    </Box>
  );
};

// Money Game (Class 1 - Indian Rupees)
const MoneyGame = ({ onComplete }) => {
  const [mode, setMode] = useState('learn'); // learn, count, shop
  const [selectedItem, setSelectedItem] = useState(null);
  const [coinCounts, setCoinCounts] = useState({ 1: 0, 2: 0, 5: 0, 10: 0 });
  const [noteCounts, setNoteCounts] = useState({ 10: 0, 20: 0, 50: 0, 100: 0 });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [shopItem, setShopItem] = useState(null);
  
  const coins = [
    { value: 1, label: '₹1', color: '#cd7f32', size: 40 },
    { value: 2, label: '₹2', color: '#c0c0c0', size: 45 },
    { value: 5, label: '₹5', color: '#c0c0c0', size: 50 },
    { value: 10, label: '₹10', color: '#ffd700', size: 55 }
  ];
  
  const notes = [
    { value: 10, label: '₹10', color: '#ff9800', emoji: '🟧' },
    { value: 20, label: '₹20', color: '#f44336', emoji: '🟥' },
    { value: 50, label: '₹50', color: '#2196f3', emoji: '🟦' },
    { value: 100, label: '₹100', color: '#4caf50', emoji: '🟩' }
  ];
  
  const shopItems = [
    { name: 'Candy', emoji: '🍬', price: 5 },
    { name: 'Pencil', emoji: '✏️', price: 10 },
    { name: 'Eraser', emoji: '🧽', price: 3 },
    { name: 'Notebook', emoji: '📓', price: 20 },
    { name: 'Ruler', emoji: '📏', price: 15 },
    { name: 'Sharpener', emoji: '🔪', price: 8 },
    { name: 'Chocolate', emoji: '🍫', price: 12 },
    { name: 'Juice', emoji: '🧃', price: 25 }
  ];
  
  const totalCoins = Object.entries(coinCounts).reduce((sum, [val, count]) => sum + parseInt(val) * count, 0);
  const totalNotes = Object.entries(noteCounts).reduce((sum, [val, count]) => sum + parseInt(val) * count, 0);
  const grandTotal = totalCoins + totalNotes;
  
  const startShopping = () => {
    const item = shopItems[Math.floor(Math.random() * shopItems.length)];
    setShopItem(item);
    setCoinCounts({ 1: 0, 2: 0, 5: 0, 10: 0 });
    setNoteCounts({ 10: 0, 20: 0, 50: 0, 100: 0 });
    setFeedback('');
    setMode('shop');
    speak(`Can you pay ₹${item.price} for the ${item.name}?`);
  };
  
  const checkPayment = () => {
    if (grandTotal === shopItem.price) {
      setScore(prev => prev + 15);
      setFeedback(`🎉 Perfect! You paid exactly ₹${shopItem.price}!`);
      speak('Perfect! You paid the right amount!');
      if (onComplete) onComplete(15);
      setTimeout(startShopping, 2500);
    } else if (grandTotal > shopItem.price) {
      setFeedback(`Too much! You paid ₹${grandTotal}. Remove ₹${grandTotal - shopItem.price}`);
      speak('That is too much money!');
    } else {
      setFeedback(`Not enough! You need ₹${shopItem.price - grandTotal} more.`);
      speak('You need more money!');
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">💰 Indian Money</Typography>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip label="📚 Learn" onClick={() => setMode('learn')} color={mode === 'learn' ? 'secondary' : 'default'} />
        <Chip label="🧮 Count" onClick={() => setMode('count')} color={mode === 'count' ? 'secondary' : 'default'} />
        <Chip label="🛒 Shop" onClick={startShopping} color={mode === 'shop' ? 'secondary' : 'default'} />
      </Box>
      
      {mode === 'learn' && (
        <>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>🪙 Coins:</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {coins.map(coin => (
              <Paper
                key={coin.value}
                onClick={() => { setSelectedItem(coin); speak(`This is a ${coin.value} rupee coin`); }}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedItem?.value === coin.value ? '3px solid #1976d2' : '2px solid #e0e0e0',
                  '&:hover': { transform: 'scale(1.1)' },
                  transition: 'all 0.2s'
                }}
              >
                <Box sx={{
                  width: coin.size,
                  height: coin.size,
                  borderRadius: '50%',
                  bgcolor: coin.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  border: '3px solid #666',
                  boxShadow: 2
                }}>
                  <Typography fontWeight={700} sx={{ color: coin.value === 10 ? '#333' : '#fff' }}>
                    {coin.value}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>{coin.label}</Typography>
              </Paper>
            ))}
          </Box>
          
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>💵 Notes:</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {notes.map(note => (
              <Paper
                key={note.value}
                onClick={() => { setSelectedItem(note); speak(`This is a ${note.value} rupee note`); }}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedItem?.value === note.value ? '3px solid #1976d2' : '2px solid #e0e0e0',
                  '&:hover': { transform: 'scale(1.05)' },
                  transition: 'all 0.2s'
                }}
              >
                <Box sx={{
                  width: 80,
                  height: 40,
                  bgcolor: note.color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333'
                }}>
                  <Typography fontWeight={700} color="white">{note.label}</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}
      
      {mode === 'count' && (
        <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Add coins and notes to count!</Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {coins.map(coin => (
              <Button
                key={coin.value}
                variant="outlined"
                onClick={() => { setCoinCounts(prev => ({ ...prev, [coin.value]: prev[coin.value] + 1 })); speak(coin.value.toString()); }}
                sx={{ minWidth: 60 }}
              >
                +{coin.label}
              </Button>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {notes.map(note => (
              <Button
                key={note.value}
                variant="outlined"
                onClick={() => { setNoteCounts(prev => ({ ...prev, [note.value]: prev[note.value] + 1 })); speak(note.value.toString()); }}
                sx={{ minWidth: 60, bgcolor: `${note.color}20` }}
              >
                +{note.label}
              </Button>
            ))}
          </Box>
          
          <Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="primary">
              ₹{grandTotal}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coins: ₹{totalCoins} | Notes: ₹{totalNotes}
            </Typography>
          </Paper>
          
          <Button onClick={() => { setCoinCounts({ 1: 0, 2: 0, 5: 0, 10: 0 }); setNoteCounts({ 10: 0, 20: 0, 50: 0, 100: 0 }); }} sx={{ mt: 2 }}>
            Clear All
          </Button>
        </Paper>
      )}
      
      {mode === 'shop' && shopItem && (
        <Paper sx={{ p: 3, bgcolor: '#fff3e0' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography fontSize="4rem">{shopItem.emoji}</Typography>
            <Typography variant="h5" fontWeight={700}>{shopItem.name}</Typography>
            <Chip label={`₹${shopItem.price}`} color="primary" sx={{ fontSize: '1.2rem', py: 2, mt: 1 }} />
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>Use coins and notes to pay:</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {coins.map(coin => (
              <Chip
                key={coin.value}
                label={`${coin.label} (${coinCounts[coin.value]})`}
                onClick={() => setCoinCounts(prev => ({ ...prev, [coin.value]: prev[coin.value] + 1 }))}
                onDelete={coinCounts[coin.value] > 0 ? () => setCoinCounts(prev => ({ ...prev, [coin.value]: prev[coin.value] - 1 })) : undefined}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {notes.map(note => (
              <Chip
                key={note.value}
                label={`${note.label} (${noteCounts[note.value]})`}
                onClick={() => setNoteCounts(prev => ({ ...prev, [note.value]: prev[note.value] + 1 }))}
                onDelete={noteCounts[note.value] > 0 ? () => setNoteCounts(prev => ({ ...prev, [note.value]: prev[note.value] - 1 })) : undefined}
                sx={{ bgcolor: `${note.color}30` }}
              />
            ))}
          </Box>
          
          <Paper sx={{ p: 2, bgcolor: grandTotal === shopItem.price ? '#e8f5e9' : '#fff', textAlign: 'center', mb: 2 }}>
            <Typography variant="body2">You are paying:</Typography>
            <Typography variant="h4" fontWeight={700} color={grandTotal === shopItem.price ? 'success.main' : 'inherit'}>
              ₹{grandTotal}
            </Typography>
          </Paper>
          
          <Button variant="contained" onClick={checkPayment} fullWidth size="large">
            Pay Now
          </Button>
          
          {feedback && (
            <Typography variant="h6" textAlign="center" sx={{ mt: 2, color: feedback.includes('🎉') ? 'success.main' : 'warning.main' }}>
              {feedback}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

// Fraction Visualizer (Class 2-6)
const FractionVisualizer = () => {
  const [numerator, setNumerator] = useState(3);
  const [denominator, setDenominator] = useState(4);
  const [mode, setMode] = useState('pie'); // pie, bar, grid
  
  const fraction = numerator / denominator;
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Fraction Visualizer</Typography>
      
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={5}>
          <TextField
            label="Numerator (top)"
            type="number"
            value={numerator}
            onChange={(e) => setNumerator(Math.max(0, Math.min(parseInt(e.target.value) || 0, 12)))}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={2} sx={{ textAlign: 'center' }}>
          <Typography variant="h4">/</Typography>
        </Grid>
        <Grid item xs={5}>
          <TextField
            label="Denominator (bottom)"
            type="number"
            value={denominator}
            onChange={(e) => setDenominator(Math.max(1, Math.min(parseInt(e.target.value) || 1, 12)))}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3, justifyContent: 'center' }}>
        {['pie', 'bar', 'grid'].map(m => (
          <Chip
            key={m}
            label={m.charAt(0).toUpperCase() + m.slice(1)}
            onClick={() => setMode(m)}
            color={mode === m ? 'primary' : 'default'}
          />
        ))}
      </Box>
      
      <Paper sx={{ p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
          <InlineMath math={`\\frac{${numerator}}{${denominator}}`} />
        </Typography>
        
        <Typography variant="body1" gutterBottom>
          = {fraction.toFixed(4)} = {(fraction * 100).toFixed(1)}%
        </Typography>
        
        {mode === 'pie' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="#e0e0e0" stroke="#bbb" strokeWidth="2" />
              {denominator > 0 && Array.from({ length: Math.min(denominator, 12) }, (_, i) => {
                const startAngle = (i / denominator) * 360 - 90;
                const endAngle = ((i + 1) / denominator) * 360 - 90;
                const filled = i < Math.min(numerator, denominator);
                const x1 = 100 + 85 * Math.cos(startAngle * Math.PI / 180);
                const y1 = 100 + 85 * Math.sin(startAngle * Math.PI / 180);
                const x2 = 100 + 85 * Math.cos(endAngle * Math.PI / 180);
                const y2 = 100 + 85 * Math.sin(endAngle * Math.PI / 180);
                const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
                
                return (
                  <path
                    key={i}
                    d={`M 100 100 L ${x1} ${y1} A 85 85 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={filled ? '#1976d2' : '#f5f5f5'}
                    stroke="#999"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </Box>
        )}
        
        {mode === 'bar' && (
          <Box sx={{ my: 2, px: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              height: 50, 
              borderRadius: 2, 
              overflow: 'hidden',
              border: '2px solid #ccc'
            }}>
              {Array.from({ length: denominator }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    bgcolor: i < numerator ? '#1976d2' : '#f5f5f5',
                    borderRight: i < denominator - 1 ? '1px solid #ccc' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" color={i < numerator ? 'white' : 'text.secondary'}>
                    {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        
        {mode === 'grid' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${Math.min(denominator, 6)}, 40px)`,
              gap: 0.5
            }}>
              {Array.from({ length: denominator }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: i < numerator ? '#1976d2' : '#e0e0e0',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography color={i < numerator ? 'white' : 'text.secondary'} fontWeight={600}>
                    {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {numerator} out of {denominator} parts are shaded
        </Typography>
      </Paper>
    </Box>
  );
};

// Area & Perimeter Calculator (Class 3-6)
const AreaPerimeterCalculator = () => {
  const [shape, setShape] = useState('rectangle');
  const [dims, setDims] = useState({ length: 8, width: 5, radius: 4, side: 6, base: 6, height: 4 });
  
  const calculate = () => {
    switch (shape) {
      case 'rectangle':
        return { 
          area: dims.length * dims.width, 
          perimeter: 2 * (dims.length + dims.width),
          formula: `Area = ${dims.length} × ${dims.width} = ${dims.length * dims.width}`
        };
      case 'square':
        return { 
          area: dims.side * dims.side, 
          perimeter: 4 * dims.side,
          formula: `Area = ${dims.side}² = ${dims.side * dims.side}`
        };
      case 'circle':
        return { 
          area: Math.PI * dims.radius * dims.radius, 
          perimeter: 2 * Math.PI * dims.radius,
          formula: `Area = π × ${dims.radius}² = ${(Math.PI * dims.radius * dims.radius).toFixed(2)}`
        };
      case 'triangle':
        const hyp = Math.sqrt(dims.base ** 2 + dims.height ** 2);
        return { 
          area: 0.5 * dims.base * dims.height, 
          perimeter: dims.base + dims.height + hyp,
          formula: `Area = ½ × ${dims.base} × ${dims.height} = ${0.5 * dims.base * dims.height}`
        };
      default:
        return { area: 0, perimeter: 0, formula: '' };
    }
  };
  
  const result = calculate();
  
  const shapes = [
    { id: 'rectangle', name: 'Rectangle', icon: '▬', color: '#2196f3' },
    { id: 'square', name: 'Square', icon: '⬜', color: '#4caf50' },
    { id: 'circle', name: 'Circle', icon: '⭕', color: '#e91e63' },
    { id: 'triangle', name: 'Triangle', icon: '🔺', color: '#ff9800' }
  ];
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Area & Perimeter Calculator</Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {shapes.map(s => (
          <Chip
            key={s.id}
            icon={<span>{s.icon}</span>}
            label={s.name}
            onClick={() => setShape(s.id)}
            sx={{ 
              bgcolor: shape === s.id ? s.color : 'default',
              color: shape === s.id ? 'white' : 'inherit'
            }}
          />
        ))}
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(shape === 'rectangle' || shape === 'triangle') && (
          <>
            <Grid item xs={6}>
              <TextField
                label={shape === 'triangle' ? 'Base' : 'Length'}
                type="number"
                value={shape === 'triangle' ? dims.base : dims.length}
                onChange={(e) => setDims({ 
                  ...dims, 
                  [shape === 'triangle' ? 'base' : 'length']: parseFloat(e.target.value) || 0 
                })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={shape === 'triangle' ? 'Height' : 'Width'}
                type="number"
                value={shape === 'triangle' ? dims.height : dims.width}
                onChange={(e) => setDims({ 
                  ...dims, 
                  [shape === 'triangle' ? 'height' : 'width']: parseFloat(e.target.value) || 0 
                })}
                fullWidth
                size="small"
              />
            </Grid>
          </>
        )}
        {shape === 'square' && (
          <Grid item xs={12}>
            <TextField
              label="Side"
              type="number"
              value={dims.side}
              onChange={(e) => setDims({ ...dims, side: parseFloat(e.target.value) || 0 })}
              fullWidth
              size="small"
            />
          </Grid>
        )}
        {shape === 'circle' && (
          <Grid item xs={12}>
            <TextField
              label="Radius"
              type="number"
              value={dims.radius}
              onChange={(e) => setDims({ ...dims, radius: parseFloat(e.target.value) || 0 })}
              fullWidth
              size="small"
            />
          </Grid>
        )}
      </Grid>
      
      {/* Visual representation */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <svg width="200" height="150" viewBox="0 0 200 150">
          {shape === 'rectangle' && (
            <>
              <rect x="30" y="30" width="140" height="90" fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
              <text x="100" y="80" textAnchor="middle" fontSize="14" fill="#1976d2">{dims.length} × {dims.width}</text>
            </>
          )}
          {shape === 'square' && (
            <>
              <rect x="50" y="25" width="100" height="100" fill="#e8f5e9" stroke="#4caf50" strokeWidth="3" />
              <text x="100" y="80" textAnchor="middle" fontSize="14" fill="#4caf50">{dims.side}</text>
            </>
          )}
          {shape === 'circle' && (
            <>
              <circle cx="100" cy="75" r="60" fill="#fce4ec" stroke="#e91e63" strokeWidth="3" />
              <line x1="100" y1="75" x2="160" y2="75" stroke="#e91e63" strokeWidth="2" strokeDasharray="5,3" />
              <text x="130" y="70" fontSize="12" fill="#e91e63">r={dims.radius}</text>
            </>
          )}
          {shape === 'triangle' && (
            <>
              <polygon points="100,20 170,130 30,130" fill="#fff3e0" stroke="#ff9800" strokeWidth="3" />
              <line x1="100" y1="20" x2="100" y2="130" stroke="#ff9800" strokeWidth="1" strokeDasharray="5,3" />
              <text x="80" y="80" fontSize="12" fill="#ff9800">h={dims.height}</text>
              <text x="100" y="145" textAnchor="middle" fontSize="12" fill="#ff9800">b={dims.base}</text>
            </>
          )}
        </svg>
      </Box>
      
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {result.formula}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Area</Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {result.area.toFixed(2)} sq units
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, bgcolor: '#fce4ec', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Perimeter</Typography>
              <Typography variant="h5" fontWeight={700} color="secondary">
                {result.perimeter.toFixed(2)} units
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

// Quadratic Solver (Class 10+)
const QuadraticSolver = () => {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-5);
  const [c, setC] = useState(6);
  const [showSteps, setShowSteps] = useState(false);
  
  const discriminant = b * b - 4 * a * c;
  const hasRealRoots = discriminant >= 0;
  
  const solve = () => {
    if (!hasRealRoots) return { roots: null, type: 'complex' };
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    return { 
      roots: [root1, root2], 
      type: discriminant === 0 ? 'equal' : 'distinct' 
    };
  };
  
  const result = solve();
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Quadratic Equation Solver</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Solve ax² + bx + c = 0 using the quadratic formula
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <TextField 
            label="a" 
            type="number" 
            value={a} 
            onChange={(e) => setA(parseFloat(e.target.value) || 0)} 
            fullWidth 
            size="small"
            helperText="coefficient of x²"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField 
            label="b" 
            type="number" 
            value={b} 
            onChange={(e) => setB(parseFloat(e.target.value) || 0)} 
            fullWidth 
            size="small"
            helperText="coefficient of x"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField 
            label="c" 
            type="number" 
            value={c} 
            onChange={(e) => setC(parseFloat(e.target.value) || 0)} 
            fullWidth 
            size="small"
            helperText="constant"
          />
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center', mb: 2 }}>
        <Typography variant="h5">
          <BlockMath math={`${a}x^2 ${b >= 0 ? '+' : ''} ${b}x ${c >= 0 ? '+' : ''} ${c} = 0`} />
        </Typography>
      </Paper>
      
      <Button 
        variant="outlined" 
        onClick={() => setShowSteps(!showSteps)}
        sx={{ mb: 2 }}
      >
        {showSteps ? 'Hide Steps' : 'Show Steps'}
      </Button>
      
      {showSteps && (
        <Paper sx={{ p: 2, bgcolor: '#fff3e0', mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Step-by-Step Solution:</Typography>
          <Typography variant="body2" component="div">
            <Box sx={{ mb: 1 }}>
              <strong>Step 1:</strong> Identify coefficients: a = {a}, b = {b}, c = {c}
            </Box>
            <Box sx={{ mb: 1 }}>
              <strong>Step 2:</strong> Calculate discriminant: D = b² - 4ac = {b}² - 4({a})({c}) = {discriminant}
            </Box>
            <Box sx={{ mb: 1 }}>
              <strong>Step 3:</strong> Apply quadratic formula: x = (-b ± √D) / 2a
            </Box>
            <Box>
              <BlockMath math={`x = \\frac{-${b} \\pm \\sqrt{${discriminant}}}{2 \\times ${a}}`} />
            </Box>
          </Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 2, bgcolor: hasRealRoots ? '#e8f5e9' : '#ffebee' }}>
        <Typography variant="subtitle2" gutterBottom>
          Discriminant (D) = b² - 4ac = <strong>{discriminant}</strong>
        </Typography>
        
        {hasRealRoots ? (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              D {discriminant > 0 ? '> 0' : '= 0'}: {result.type === 'equal' ? 'One repeated root' : 'Two distinct real roots'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: '#c8e6c9' }}>
                <Typography variant="caption">x₁</Typography>
                <Typography variant="h5" fontWeight={700}>{result.roots[0].toFixed(4)}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: '#c8e6c9' }}>
                <Typography variant="caption">x₂</Typography>
                <Typography variant="h5" fontWeight={700}>{result.roots[1].toFixed(4)}</Typography>
              </Paper>
            </Box>
          </Box>
        ) : (
          <Typography color="error">
            D &lt; 0: No real roots (complex roots exist)
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

// Trigonometry Calculator (Class 10+)
const TrigCalculator = () => {
  const [angle, setAngle] = useState(45);
  const [unit, setUnit] = useState('degrees');
  
  const angleRad = unit === 'degrees' ? (angle * Math.PI) / 180 : angle;
  
  const trigValues = [
    { name: 'sin', value: Math.sin(angleRad), color: '#e91e63' },
    { name: 'cos', value: Math.cos(angleRad), color: '#2196f3' },
    { name: 'tan', value: Math.tan(angleRad), color: '#4caf50' },
    { name: 'cot', value: 1 / Math.tan(angleRad), color: '#ff9800' },
    { name: 'sec', value: 1 / Math.cos(angleRad), color: '#9c27b0' },
    { name: 'csc', value: 1 / Math.sin(angleRad), color: '#00bcd4' }
  ];
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Trigonometry Calculator</Typography>
      
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={8}>
          <Slider
            value={angle}
            onChange={(e, v) => setAngle(v)}
            min={0}
            max={unit === 'degrees' ? 360 : 2 * Math.PI}
            step={unit === 'degrees' ? 1 : 0.01}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}${unit === 'degrees' ? '°' : ' rad'}`}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            type="number"
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value) || 0)}
            size="small"
            fullWidth
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3, justifyContent: 'center' }}>
        <Chip label="Degrees" onClick={() => setUnit('degrees')} color={unit === 'degrees' ? 'primary' : 'default'} />
        <Chip label="Radians" onClick={() => setUnit('radians')} color={unit === 'radians' ? 'primary' : 'default'} />
      </Box>
      
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {trigValues.map(trig => (
          <Grid item xs={4} key={trig.name}>
            <Paper sx={{ p: 1.5, textAlign: 'center', border: `2px solid ${trig.color}` }}>
              <Typography variant="caption" color="text.secondary">{trig.name}(θ)</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: trig.color }}>
                {isFinite(trig.value) ? trig.value.toFixed(4) : '∞'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Unit Circle */}
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle2" textAlign="center" gutterBottom>Unit Circle</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="220" height="220" viewBox="-110 -110 220 220">
            {/* Grid */}
            <line x1="-100" y1="0" x2="100" y2="0" stroke="#ddd" strokeWidth="1" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="#ddd" strokeWidth="1" />
            
            {/* Circle */}
            <circle cx="0" cy="0" r="80" fill="none" stroke="#ccc" strokeWidth="2" />
            
            {/* Angle arc */}
            <path
              d={`M 20 0 A 20 20 0 ${angleRad > Math.PI ? 1 : 0} 0 ${20 * Math.cos(-angleRad)} ${20 * Math.sin(-angleRad)}`}
              fill="none"
              stroke="#1976d2"
              strokeWidth="2"
            />
            
            {/* Radius line */}
            <line 
              x1="0" y1="0" 
              x2={80 * Math.cos(-angleRad)} 
              y2={80 * Math.sin(-angleRad)} 
              stroke="#1976d2" 
              strokeWidth="3" 
            />
            
            {/* Point on circle */}
            <circle cx={80 * Math.cos(-angleRad)} cy={80 * Math.sin(-angleRad)} r="6" fill="#e91e63" />
            
            {/* Coordinates */}
            <text x={85 * Math.cos(-angleRad) + 5} y={85 * Math.sin(-angleRad)} fontSize="10" fill="#666">
              ({Math.cos(angleRad).toFixed(2)}, {Math.sin(angleRad).toFixed(2)})
            </text>
            
            {/* Labels */}
            <text x="85" y="15" fontSize="10" fill="#666">0°</text>
            <text x="5" y="-85" fontSize="10" fill="#666">90°</text>
            <text x="-95" y="15" fontSize="10" fill="#666">180°</text>
            <text x="5" y="95" fontSize="10" fill="#666">270°</text>
          </svg>
        </Box>
      </Paper>
    </Box>
  );
};

// Matrix Calculator (Class 12)
const MatrixCalculator = () => {
  const [matA, setMatA] = useState([[1, 2], [3, 4]]);
  const [matB, setMatB] = useState([[5, 6], [7, 8]]);
  const [operation, setOperation] = useState('add');
  
  const calculate = () => {
    try {
      const A = math.matrix(matA);
      const B = math.matrix(matB);
      switch (operation) {
        case 'add': return { result: math.add(A, B).toArray(), label: 'A + B' };
        case 'subtract': return { result: math.subtract(A, B).toArray(), label: 'A - B' };
        case 'multiply': return { result: math.multiply(A, B).toArray(), label: 'A × B' };
        case 'detA': return { result: math.det(A), label: 'det(A)' };
        case 'transposeA': return { result: math.transpose(A).toArray(), label: 'Aᵀ' };
        default: return null;
      }
    } catch (e) {
      return { result: 'Error', label: 'Error' };
    }
  };
  
  const result = calculate();
  
  const MatrixInput = ({ matrix, setMatrix, label }) => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 60px)', gap: 0.5 }}>
        {matrix.map((row, i) => (
          row.map((val, j) => (
            <TextField
              key={`${i}-${j}`}
              type="number"
              value={val}
              onChange={(e) => {
                const newMat = matrix.map(r => [...r]);
                newMat[i][j] = parseFloat(e.target.value) || 0;
                setMatrix(newMat);
              }}
              size="small"
              inputProps={{ style: { textAlign: 'center', padding: '8px' } }}
            />
          ))
        ))}
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Matrix Calculator (2×2)</Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <MatrixInput matrix={matA} setMatrix={setMatA} label="Matrix A" />
        </Grid>
        <Grid item xs={6}>
          <MatrixInput matrix={matB} setMatrix={setMatB} label="Matrix B" />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 3 }}>
        {[
          { key: 'add', label: 'A + B' },
          { key: 'subtract', label: 'A - B' },
          { key: 'multiply', label: 'A × B' },
          { key: 'detA', label: 'det(A)' },
          { key: 'transposeA', label: 'Aᵀ' }
        ].map(op => (
          <Chip
            key={op.key}
            label={op.label}
            onClick={() => setOperation(op.key)}
            color={operation === op.key ? 'primary' : 'default'}
          />
        ))}
      </Box>
      
      <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
        <Typography variant="subtitle2" gutterBottom>{result?.label} =</Typography>
        {typeof result?.result === 'number' ? (
          <Typography variant="h4" fontWeight={700}>{result.result.toFixed(4)}</Typography>
        ) : Array.isArray(result?.result) ? (
          <Box sx={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
            {result.result.map((row, i) => (
              <Typography key={i}>[ {row.map(v => v.toFixed(2)).join('  ')} ]</Typography>
            ))}
          </Box>
        ) : (
          <Typography color="error">{result?.result}</Typography>
        )}
      </Paper>
    </Box>
  );
};

// Subtraction Practice (Class 1-3)
const SubtractionPractice = ({ maxNumber = 20, onComplete }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  
  const generateProblem = useCallback(() => {
    const a = Math.floor(Math.random() * maxNumber) + 5;
    const b = Math.floor(Math.random() * Math.min(a, maxNumber / 2)) + 1;
    setNum1(a);
    setNum2(b);
    setAnswer('');
    setFeedback('');
    setShowHint(false);
    speak(`What is ${a} minus ${b}?`);
  }, [maxNumber]);
  
  useEffect(() => { generateProblem(); }, [generateProblem]);
  
  const checkAnswer = () => {
    const correct = parseInt(answer) === num1 - num2;
    if (correct) {
      setScore(prev => prev + 10);
      setFeedback('🎉 Excellent! That\'s correct!');
      speak('Excellent! That is correct!');
      if (onComplete) onComplete(10);
      setTimeout(generateProblem, 2000);
    } else {
      setFeedback('Not quite. Try again or use the hint!');
      speak('Not quite. Try again!');
      setShowHint(true);
    }
  };
  
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" sx={{ mb: 3 }} />
      
      <Paper sx={{ p: 3, bgcolor: '#fce4ec', borderRadius: 3, mb: 3 }}>
        <Typography variant="h2" fontFamily="monospace">
          {num1} − {num2} = ?
        </Typography>
      </Paper>
      
      <TextField
        value={answer}
        onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
        onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        placeholder="?"
        sx={{ mb: 2, width: 120 }}
        inputProps={{ style: { fontSize: '2rem', textAlign: 'center' } }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="contained" onClick={checkAnswer}>Check</Button>
        <Button variant="outlined" onClick={generateProblem}>New Problem</Button>
        <Button variant="text" onClick={() => speak(`${num1} minus ${num2}`)}>🔊 Hear</Button>
      </Box>
      
      {showHint && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: '#fff8e1' }}>
          <Typography variant="body2" gutterBottom>💡 Start with {num1} and take away {num2}:</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {Array(num1).fill(0).map((_, i) => (
              <Box key={i} sx={{ 
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: i < num1 - num2 ? '#4caf50' : '#ffcdd2',
                border: i >= num1 - num2 ? '2px dashed #f44336' : 'none',
                transition: 'all 0.3s',
                transitionDelay: `${i * 50}ms`
              }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>{num1} − {num2} = {num1 - num2}</Typography>
        </Paper>
      )}
      
      {feedback && (
        <Typography variant="h6" sx={{ mt: 2, color: feedback.includes('Excellent') ? 'success.main' : 'warning.main' }}>
          {feedback}
        </Typography>
      )}
    </Box>
  );
};

// Pattern Game (Class 1-3)
const PatternGame = ({ onComplete }) => {
  const [pattern, setPattern] = useState([]);
  const [missingIndex, setMissingIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [patternType, setPatternType] = useState('add');
  
  const generatePattern = useCallback(() => {
    const types = ['add', 'subtract', 'multiply', 'alternate'];
    const type = types[Math.floor(Math.random() * types.length)];
    setPatternType(type);
    
    let seq = [];
    const start = Math.floor(Math.random() * 10) + 1;
    const step = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < 6; i++) {
      if (type === 'add') seq.push(start + step * i);
      else if (type === 'subtract') seq.push(start + 30 - step * i);
      else if (type === 'multiply') seq.push(start * Math.pow(2, i));
      else seq.push(i % 2 === 0 ? start : start + step);
    }
    
    const missing = Math.floor(Math.random() * 4) + 1;
    setPattern(seq);
    setMissingIndex(missing);
    setAnswer('');
    setFeedback('');
    speak('Find the missing number in the pattern!');
  }, []);
  
  useEffect(() => { generatePattern(); }, [generatePattern]);
  
  const checkAnswer = () => {
    if (parseInt(answer) === pattern[missingIndex]) {
      setScore(prev => prev + 15);
      setFeedback('🎉 Perfect! You found the pattern!');
      speak('Perfect! You found the pattern!');
      if (onComplete) onComplete(15);
      setTimeout(generatePattern, 2000);
    } else {
      setFeedback(`Try again! Look at how the numbers change.`);
      speak('Try again! Look at how the numbers change.');
    }
  };
  
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>Find the missing number!</Typography>
      
      <Paper sx={{ p: 3, bgcolor: '#e8f5e9', borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {pattern.map((num, i) => (
            <Paper key={i} sx={{ 
              p: 2, minWidth: 60, 
              bgcolor: i === missingIndex ? '#fff3e0' : 'white',
              border: i === missingIndex ? '3px dashed #ff9800' : '2px solid #e0e0e0'
            }}>
              <Typography variant="h4" fontWeight={700}>
                {i === missingIndex ? '?' : num}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
      
      <TextField
        value={answer}
        onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
        onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
        placeholder="?"
        sx={{ mb: 2, width: 100 }}
        inputProps={{ style: { fontSize: '1.5rem', textAlign: 'center' } }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="contained" onClick={checkAnswer}>Check</Button>
        <Button variant="outlined" onClick={generatePattern}>New Pattern</Button>
      </Box>
      
      {feedback && (
        <Typography variant="h6" sx={{ mt: 2, color: feedback.includes('Perfect') ? 'success.main' : 'warning.main' }}>
          {feedback}
        </Typography>
      )}
    </Box>
  );
};

// Place Value Explorer (Class 2-4)
const PlaceValueExplorer = ({ onComplete }) => {
  const [number, setNumber] = useState(347);
  const [mode, setMode] = useState('explore'); // explore, quiz
  const [quizAnswer, setQuizAnswer] = useState({ hundreds: '', tens: '', ones: '' });
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;
  
  const generateQuiz = () => {
    setNumber(Math.floor(Math.random() * 900) + 100);
    setQuizAnswer({ hundreds: '', tens: '', ones: '' });
    setFeedback('');
    setMode('quiz');
    speak('Break this number into hundreds, tens, and ones!');
  };
  
  const checkQuiz = () => {
    const h = parseInt(quizAnswer.hundreds) || 0;
    const t = parseInt(quizAnswer.tens) || 0;
    const o = parseInt(quizAnswer.ones) || 0;
    
    if (h === hundreds && t === tens && o === ones) {
      setScore(prev => prev + 20);
      setFeedback('🎉 Perfect! You understand place value!');
      speak('Perfect! You understand place value!');
      if (onComplete) onComplete(20);
      setTimeout(generateQuiz, 2000);
    } else {
      setFeedback('Not quite. Check each place!');
      speak('Not quite. Check each place!');
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
        <Box>
          <Chip label="Explore" onClick={() => setMode('explore')} color={mode === 'explore' ? 'secondary' : 'default'} sx={{ mr: 1 }} />
          <Chip label="Quiz" onClick={generateQuiz} color={mode === 'quiz' ? 'secondary' : 'default'} />
        </Box>
      </Box>
      
      {mode === 'explore' && (
        <>
          <TextField
            type="number"
            value={number}
            onChange={(e) => setNumber(Math.min(9999, Math.max(0, parseInt(e.target.value) || 0)))}
            label="Enter a number (0-9999)"
            fullWidth
            sx={{ mb: 3 }}
          />
          <Button onClick={() => speak(`${number} has ${hundreds} hundreds, ${tens} tens, and ${ones} ones`)} startIcon={<SpeakIcon />} sx={{ mb: 2 }}>
            Hear It
          </Button>
        </>
      )}
      
      <Paper sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 3, mb: 3 }}>
        <Typography variant="h2" textAlign="center" fontWeight={700} gutterBottom>
          {number}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, bgcolor: '#ffcdd2', textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={600}>HUNDREDS</Typography>
              {mode === 'explore' ? (
                <Typography variant="h3" color="error">{hundreds}</Typography>
              ) : (
                <TextField
                  value={quizAnswer.hundreds}
                  onChange={(e) => setQuizAnswer({ ...quizAnswer, hundreds: e.target.value })}
                  size="small"
                  sx={{ width: 60, mt: 1 }}
                  inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem' } }}
                />
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 1 }}>
                {Array(mode === 'explore' ? hundreds : 0).fill(0).map((_, i) => (
                  <Box key={i} sx={{ width: 30, height: 30, bgcolor: '#e57373', borderRadius: 1 }} />
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, bgcolor: '#c8e6c9', textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={600}>TENS</Typography>
              {mode === 'explore' ? (
                <Typography variant="h3" color="success.main">{tens}</Typography>
              ) : (
                <TextField
                  value={quizAnswer.tens}
                  onChange={(e) => setQuizAnswer({ ...quizAnswer, tens: e.target.value })}
                  size="small"
                  sx={{ width: 60, mt: 1 }}
                  inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem' } }}
                />
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 1 }}>
                {Array(mode === 'explore' ? tens : 0).fill(0).map((_, i) => (
                  <Box key={i} sx={{ width: 8, height: 30, bgcolor: '#81c784', borderRadius: 0.5 }} />
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, bgcolor: '#bbdefb', textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={600}>ONES</Typography>
              {mode === 'explore' ? (
                <Typography variant="h3" color="primary">{ones}</Typography>
              ) : (
                <TextField
                  value={quizAnswer.ones}
                  onChange={(e) => setQuizAnswer({ ...quizAnswer, ones: e.target.value })}
                  size="small"
                  sx={{ width: 60, mt: 1 }}
                  inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem' } }}
                />
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 1 }}>
                {Array(mode === 'explore' ? ones : 0).fill(0).map((_, i) => (
                  <Box key={i} sx={{ width: 10, height: 10, bgcolor: '#64b5f6', borderRadius: '50%' }} />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {mode === 'explore' && (
          <Typography variant="body1" textAlign="center" sx={{ mt: 2 }}>
            {number} = ({hundreds} × 100) + ({tens} × 10) + ({ones} × 1)
          </Typography>
        )}
      </Paper>
      
      {mode === 'quiz' && (
        <Button variant="contained" onClick={checkQuiz} fullWidth>Check Answer</Button>
      )}
      
      {feedback && (
        <Typography variant="h6" textAlign="center" sx={{ mt: 2, color: feedback.includes('Perfect') ? 'success.main' : 'warning.main' }}>
          {feedback}
        </Typography>
      )}
    </Box>
  );
};

// Clock Practice (Class 2-4)
const ClockPractice = ({ onComplete }) => {
  const [hours, setHours] = useState(3);
  const [minutes, setMinutes] = useState(30);
  const [mode, setMode] = useState('learn'); // learn, quiz
  const [answer, setAnswer] = useState({ hours: '', minutes: '' });
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  
  const generateQuiz = useCallback(() => {
    setHours(Math.floor(Math.random() * 12) + 1);
    setMinutes(Math.floor(Math.random() * 12) * 5);
    setAnswer({ hours: '', minutes: '' });
    setFeedback('');
    setMode('quiz');
    speak('What time is shown on the clock?');
  }, []);
  
  const checkAnswer = () => {
    const h = parseInt(answer.hours);
    const m = parseInt(answer.minutes);
    
    if (h === hours && m === minutes) {
      setScore(prev => prev + 15);
      setFeedback('🎉 Correct! Great job reading the clock!');
      speak(`Correct! It is ${hours} ${minutes === 0 ? "o'clock" : minutes}`);
      if (onComplete) onComplete(15);
      setTimeout(generateQuiz, 2500);
    } else {
      setFeedback('Try again! Look at the hour and minute hands.');
      speak('Try again! Look at the hour and minute hands.');
    }
  };
  
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;
  
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
        <Box>
          <Chip label="Learn" onClick={() => setMode('learn')} color={mode === 'learn' ? 'secondary' : 'default'} sx={{ mr: 1 }} />
          <Chip label="Quiz" onClick={generateQuiz} color={mode === 'quiz' ? 'secondary' : 'default'} />
        </Box>
      </Box>
      
      {mode === 'learn' && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption">Hours</Typography>
            <Slider value={hours} onChange={(e, v) => setHours(v)} min={1} max={12} marks valueLabelDisplay="auto" />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Minutes</Typography>
            <Slider value={minutes} onChange={(e, v) => setMinutes(v)} min={0} max={55} step={5} marks valueLabelDisplay="auto" />
          </Grid>
        </Grid>
      )}
      
      {/* Clock Face */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <svg width="250" height="250" viewBox="0 0 250 250">
          {/* Clock face */}
          <circle cx="125" cy="125" r="120" fill="white" stroke="#333" strokeWidth="4" />
          
          {/* Hour markers */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x1 = 125 + 100 * Math.cos(angle);
            const y1 = 125 + 100 * Math.sin(angle);
            const x2 = 125 + 110 * Math.cos(angle);
            const y2 = 125 + 110 * Math.sin(angle);
            const tx = 125 + 85 * Math.cos(angle);
            const ty = 125 + 85 * Math.sin(angle);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="3" />
                <text x={tx} y={ty + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333">
                  {i === 0 ? 12 : i}
                </text>
              </g>
            );
          })}
          
          {/* Minute markers */}
          {Array.from({ length: 60 }, (_, i) => {
            if (i % 5 === 0) return null;
            const angle = (i * 6 - 90) * Math.PI / 180;
            const x1 = 125 + 105 * Math.cos(angle);
            const y1 = 125 + 105 * Math.sin(angle);
            const x2 = 125 + 110 * Math.cos(angle);
            const y2 = 125 + 110 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth="1" />;
          })}
          
          {/* Hour hand */}
          <line 
            x1="125" y1="125" 
            x2={125 + 55 * Math.cos((hourAngle - 90) * Math.PI / 180)} 
            y2={125 + 55 * Math.sin((hourAngle - 90) * Math.PI / 180)}
            stroke="#333" strokeWidth="6" strokeLinecap="round"
          />
          
          {/* Minute hand */}
          <line 
            x1="125" y1="125" 
            x2={125 + 80 * Math.cos((minuteAngle - 90) * Math.PI / 180)} 
            y2={125 + 80 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
            stroke="#1976d2" strokeWidth="4" strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx="125" cy="125" r="8" fill="#e91e63" />
        </svg>
      </Box>
      
      {mode === 'learn' && (
        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
          <Typography variant="h4" fontWeight={700}>
            {hours}:{minutes.toString().padStart(2, '0')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {hours} {minutes === 0 ? "o'clock" : `and ${minutes} minutes`}
          </Typography>
          <Button onClick={() => speak(`The time is ${hours} ${minutes === 0 ? "o'clock" : `${minutes}`}`)} startIcon={<SpeakIcon />} sx={{ mt: 1 }}>
            Hear Time
          </Button>
        </Paper>
      )}
      
      {mode === 'quiz' && (
        <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
          <Typography variant="body1" gutterBottom>What time is it?</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <TextField
              value={answer.hours}
              onChange={(e) => setAnswer({ ...answer, hours: e.target.value })}
              placeholder="HH"
              sx={{ width: 60 }}
              inputProps={{ style: { textAlign: 'center' } }}
            />
            <Typography variant="h4">:</Typography>
            <TextField
              value={answer.minutes}
              onChange={(e) => setAnswer({ ...answer, minutes: e.target.value })}
              placeholder="MM"
              sx={{ width: 60 }}
              inputProps={{ style: { textAlign: 'center' } }}
            />
          </Box>
          <Button variant="contained" onClick={checkAnswer} sx={{ mt: 2 }}>Check</Button>
        </Paper>
      )}
      
      {feedback && (
        <Typography variant="h6" sx={{ mt: 2, color: feedback.includes('Correct') ? 'success.main' : 'warning.main' }}>
          {feedback}
        </Typography>
      )}
    </Box>
  );
};

// Percentage Calculator (Class 5-7)
const PercentageCalculator = () => {
  const [value, setValue] = useState(75);
  const [total, setTotal] = useState(100);
  const [mode, setMode] = useState('find'); // find, of
  const [percentOf, setPercentOf] = useState({ percent: 25, of: 200 });
  
  const percentage = ((value / total) * 100).toFixed(2);
  const percentResult = (percentOf.percent / 100 * percentOf.of).toFixed(2);
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Percentage Calculator</Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip label="Find %" onClick={() => setMode('find')} color={mode === 'find' ? 'primary' : 'default'} />
        <Chip label="% of Value" onClick={() => setMode('of')} color={mode === 'of' ? 'primary' : 'default'} />
      </Box>
      
      {mode === 'find' && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField label="Value" type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Total" type="number" value={total} onChange={(e) => setTotal(parseFloat(e.target.value) || 1)} fullWidth />
            </Grid>
          </Grid>
          
          <Paper sx={{ p: 3, bgcolor: '#e8f5e9', textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              {value} out of {total} is
            </Typography>
            <Typography variant="h2" fontWeight={700} color="primary">
              {percentage}%
            </Typography>
          </Paper>
          
          {/* Visual bar */}
          <Box sx={{ position: 'relative', height: 40, bgcolor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ 
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: `${Math.min(100, parseFloat(percentage))}%`,
              bgcolor: '#4caf50',
              transition: 'width 0.3s'
            }} />
            <Typography sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700 }}>
              {percentage}%
            </Typography>
          </Box>
        </>
      )}
      
      {mode === 'of' && (
        <>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <TextField label="Percent" type="number" value={percentOf.percent} onChange={(e) => setPercentOf({ ...percentOf, percent: parseFloat(e.target.value) || 0 })} fullWidth />
            </Grid>
            <Grid item xs={2} sx={{ textAlign: 'center' }}>
              <Typography variant="h5">% of</Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField label="Value" type="number" value={percentOf.of} onChange={(e) => setPercentOf({ ...percentOf, of: parseFloat(e.target.value) || 0 })} fullWidth />
            </Grid>
            <Grid item xs={2} sx={{ textAlign: 'center' }}>
              <Typography variant="h5">=</Typography>
            </Grid>
          </Grid>
          
          <Paper sx={{ p: 3, bgcolor: '#e3f2fd', textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              {percentOf.percent}% of {percentOf.of} =
            </Typography>
            <Typography variant="h2" fontWeight={700} color="primary">
              {percentResult}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ({percentOf.percent} ÷ 100) × {percentOf.of} = {percentResult}
            </Typography>
          </Paper>
        </>
      )}
      
      <Button onClick={() => speak(mode === 'find' ? `${value} out of ${total} is ${percentage} percent` : `${percentOf.percent} percent of ${percentOf.of} is ${percentResult}`)} startIcon={<SpeakIcon />} sx={{ mt: 2 }}>
        Hear Explanation
      </Button>
    </Box>
  );
};

// Probability Game (Class 7-10)
const ProbabilityGame = ({ onComplete }) => {
  const [tool, setTool] = useState('coin'); // coin, dice, spinner
  const [results, setResults] = useState([]);
  const [prediction, setPrediction] = useState('');
  const [score, setScore] = useState(0);
  
  const flip = () => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    setResults(prev => [result, ...prev.slice(0, 9)]);
    speak(result);
    if (prediction.toLowerCase() === result.toLowerCase()) {
      setScore(prev => prev + 5);
      if (onComplete) onComplete(5);
    }
  };
  
  const roll = () => {
    const result = Math.floor(Math.random() * 6) + 1;
    setResults(prev => [result, ...prev.slice(0, 9)]);
    speak(`You rolled a ${result}`);
    if (parseInt(prediction) === result) {
      setScore(prev => prev + 10);
      if (onComplete) onComplete(10);
    }
  };
  
  const spin = () => {
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const result = colors[Math.floor(Math.random() * colors.length)];
    setResults(prev => [result, ...prev.slice(0, 9)]);
    speak(result);
    if (prediction.toLowerCase() === result.toLowerCase()) {
      setScore(prev => prev + 8);
      if (onComplete) onComplete(8);
    }
  };
  
  const headsCount = results.filter(r => r === 'Heads').length;
  const tailsCount = results.filter(r => r === 'Tails').length;
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Chip icon={<StarIcon />} label={`Score: ${score}`} color="primary" />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip label="🪙 Coin" onClick={() => { setTool('coin'); setResults([]); }} color={tool === 'coin' ? 'secondary' : 'default'} />
          <Chip label="🎲 Dice" onClick={() => { setTool('dice'); setResults([]); }} color={tool === 'dice' ? 'secondary' : 'default'} />
          <Chip label="🎡 Spinner" onClick={() => { setTool('spinner'); setResults([]); }} color={tool === 'spinner' ? 'secondary' : 'default'} />
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', mb: 2 }}>
        <Typography fontSize="5rem" sx={{ mb: 2 }}>
          {tool === 'coin' && '🪙'}
          {tool === 'dice' && '🎲'}
          {tool === 'spinner' && '🎡'}
        </Typography>
        
        <TextField
          placeholder={tool === 'coin' ? 'Heads or Tails?' : tool === 'dice' ? '1-6?' : 'Color?'}
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
          size="small"
          sx={{ mb: 2, width: 150 }}
        />
        
        <Box>
          <Button 
            variant="contained" 
            onClick={tool === 'coin' ? flip : tool === 'dice' ? roll : spin}
            size="large"
          >
            {tool === 'coin' ? 'Flip!' : tool === 'dice' ? 'Roll!' : 'Spin!'}
          </Button>
        </Box>
        
        {results.length > 0 && (
          <Typography variant="h4" sx={{ mt: 2 }}>
            Result: <strong>{results[0]}</strong>
          </Typography>
        )}
      </Paper>
      
      {results.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
          <Typography variant="subtitle2" gutterBottom>Results History ({results.length} trials)</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {results.map((r, i) => (
              <Chip key={i} label={r} size="small" color={i === 0 ? 'primary' : 'default'} />
            ))}
          </Box>
          
          {tool === 'coin' && results.length > 0 && (
            <Typography variant="body2">
              Heads: {headsCount} ({((headsCount / results.length) * 100).toFixed(1)}%) | 
              Tails: {tailsCount} ({((tailsCount / results.length) * 100).toFixed(1)}%)
            </Typography>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Theoretical probability: {tool === 'coin' ? '50% each' : tool === 'dice' ? '16.67% each' : '25% each'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

// Integer Number Line (Class 6-8)
const IntegerNumberLine = ({ onComplete }) => {
  const [num1, setNum1] = useState(-3);
  const [num2, setNum2] = useState(5);
  const [operation, setOperation] = useState('add');
  const [showAnimation, setShowAnimation] = useState(false);
  
  const result = operation === 'add' ? num1 + num2 : num1 - num2;
  
  const animate = () => {
    setShowAnimation(true);
    speak(`${num1} ${operation === 'add' ? 'plus' : 'minus'} ${num2} equals ${result}`);
    setTimeout(() => setShowAnimation(false), 3000);
    if (onComplete) onComplete(5);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Integer Number Line</Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <TextField label="First Number" type="number" value={num1} onChange={(e) => setNum1(parseInt(e.target.value) || 0)} fullWidth size="small" />
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Chip label="+" onClick={() => setOperation('add')} color={operation === 'add' ? 'primary' : 'default'} />
            <Chip label="−" onClick={() => setOperation('subtract')} color={operation === 'subtract' ? 'primary' : 'default'} />
          </Box>
        </Grid>
        <Grid item xs={4}>
          <TextField label="Second Number" type="number" value={num2} onChange={(e) => setNum2(parseInt(e.target.value) || 0)} fullWidth size="small" />
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
        <Typography variant="h4" textAlign="center" fontFamily="monospace">
          ({num1}) {operation === 'add' ? '+' : '−'} ({num2}) = <strong>{result}</strong>
        </Typography>
      </Paper>
      
      {/* Number Line */}
      <Paper sx={{ p: 2, bgcolor: '#fff', overflow: 'auto' }}>
        <svg width="100%" height="120" viewBox="-150 0 300 120">
          {/* Line */}
          <line x1="-140" y1="60" x2="140" y2="60" stroke="#333" strokeWidth="2" />
          <polygon points="140,55 150,60 140,65" fill="#333" />
          
          {/* Numbers and ticks */}
          {Array.from({ length: 15 }, (_, i) => i - 7).map(n => (
            <g key={n}>
              <line x1={n * 18} y1="55" x2={n * 18} y2="65" stroke="#333" strokeWidth={n === 0 ? 3 : 1} />
              <text x={n * 18} y="80" textAnchor="middle" fontSize="12" fill={n === 0 ? '#000' : '#666'} fontWeight={n === 0 ? 'bold' : 'normal'}>
                {n}
              </text>
            </g>
          ))}
          
          {/* First number marker */}
          <circle cx={num1 * 18} cy="40" r="8" fill="#2196f3" />
          <text x={num1 * 18} y="25" textAnchor="middle" fontSize="10" fill="#2196f3">Start</text>
          
          {/* Arrow showing movement */}
          {showAnimation && (
            <g>
              <line 
                x1={num1 * 18} y1="40" 
                x2={result * 18} y2="40" 
                stroke={num2 >= 0 ? '#4caf50' : '#f44336'} 
                strokeWidth="3" 
                strokeDasharray="5,3"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={num2 >= 0 ? '#4caf50' : '#f44336'} />
                </marker>
              </defs>
            </g>
          )}
          
          {/* Result marker */}
          <circle cx={result * 18} cy="40" r="8" fill="#e91e63" />
          <text x={result * 18} y="100" textAnchor="middle" fontSize="10" fill="#e91e63">Result</text>
        </svg>
      </Paper>
      
      <Button variant="contained" onClick={animate} startIcon={<PlayIcon />} sx={{ mt: 2 }} fullWidth>
        Show on Number Line
      </Button>
      
      <Paper sx={{ p: 2, mt: 2, bgcolor: '#e8f5e9' }}>
        <Typography variant="body2">
          <strong>Explanation:</strong> Starting at {num1}, {operation === 'add' ? 'move right' : 'move left'} by {Math.abs(num2)} steps to reach {result}.
        </Typography>
      </Paper>
    </Box>
  );
};

// Coordinate Plotter (Class 8-10)
const CoordinatePlotter = () => {
  const [points, setPoints] = useState([{ x: 2, y: 3 }, { x: -1, y: 2 }]);
  const [newPoint, setNewPoint] = useState({ x: '', y: '' });
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  
  const addPoint = () => {
    if (newPoint.x !== '' && newPoint.y !== '') {
      const x = parseFloat(newPoint.x);
      const y = parseFloat(newPoint.y);
      setPoints(prev => [...prev, { x, y }]);
      speak(`Point added at ${x}, ${y}`);
      setNewPoint({ x: '', y: '' });
    }
  };
  
  const scale = 25;
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Coordinate Plotter</Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <TextField label="X" type="number" value={newPoint.x} onChange={(e) => setNewPoint({ ...newPoint, x: e.target.value })} fullWidth size="small" />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Y" type="number" value={newPoint.y} onChange={(e) => setNewPoint({ ...newPoint, y: e.target.value })} fullWidth size="small" />
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" onClick={addPoint} fullWidth>Add Point</Button>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 2, bgcolor: '#fff', mb: 2 }}>
        <svg width="100%" height="300" viewBox="-150 -150 300 300">
          {/* Grid */}
          {showGrid && Array.from({ length: 13 }, (_, i) => i - 6).map(n => (
            <g key={n}>
              <line x1={n * scale} y1="-150" x2={n * scale} y2="150" stroke="#eee" strokeWidth="1" />
              <line x1="-150" y1={n * scale} x2="150" y2={n * scale} stroke="#eee" strokeWidth="1" />
            </g>
          ))}
          
          {/* Axes */}
          <line x1="-150" y1="0" x2="150" y2="0" stroke="#333" strokeWidth="2" />
          <line x1="0" y1="-150" x2="0" y2="150" stroke="#333" strokeWidth="2" />
          
          {/* Axis labels */}
          {showLabels && Array.from({ length: 11 }, (_, i) => i - 5).filter(n => n !== 0).map(n => (
            <g key={n}>
              <text x={n * scale} y="15" textAnchor="middle" fontSize="10" fill="#666">{n}</text>
              <text x="-10" y={-n * scale + 4} textAnchor="end" fontSize="10" fill="#666">{n}</text>
            </g>
          ))}
          <text x="145" y="-5" fontSize="12" fill="#333">X</text>
          <text x="5" y="-140" fontSize="12" fill="#333">Y</text>
          
          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x * scale} cy={-p.y * scale} r="6" fill={`hsl(${i * 60}, 70%, 50%)`} />
              <text x={p.x * scale + 8} y={-p.y * scale + 4} fontSize="10" fill="#333">
                ({p.x}, {p.y})
              </text>
            </g>
          ))}
        </svg>
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip label={showGrid ? '✓ Grid' : 'Grid'} onClick={() => setShowGrid(!showGrid)} color={showGrid ? 'primary' : 'default'} />
        <Chip label={showLabels ? '✓ Labels' : 'Labels'} onClick={() => setShowLabels(!showLabels)} color={showLabels ? 'primary' : 'default'} />
        <Chip label="Clear All" onClick={() => setPoints([])} color="error" variant="outlined" />
      </Box>
      
      {points.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
          <Typography variant="subtitle2" gutterBottom>Points:</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {points.map((p, i) => (
              <Chip key={i} label={`(${p.x}, ${p.y})`} size="small" onDelete={() => setPoints(prev => prev.filter((_, j) => j !== i))} />
            ))}
          </Box>
          {points.length === 2 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Distance: {Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2)).toFixed(2)}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

// Arithmetic Progression Calculator (Class 10)
const APCalculator = () => {
  const [a, setA] = useState(2); // first term
  const [d, setD] = useState(3); // common difference
  const [n, setN] = useState(10); // number of terms
  
  const nthTerm = a + (n - 1) * d;
  const sum = (n / 2) * (2 * a + (n - 1) * d);
  const terms = Array.from({ length: Math.min(n, 15) }, (_, i) => a + i * d);
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Arithmetic Progression</Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <TextField label="First term (a)" type="number" value={a} onChange={(e) => setA(parseFloat(e.target.value) || 0)} fullWidth size="small" />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Common diff (d)" type="number" value={d} onChange={(e) => setD(parseFloat(e.target.value) || 0)} fullWidth size="small" />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Terms (n)" type="number" value={n} onChange={(e) => setN(Math.max(1, parseInt(e.target.value) || 1))} fullWidth size="small" />
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 2, bgcolor: '#e8f5e9', mb: 2 }}>
        <Typography variant="body2" gutterBottom>The AP sequence:</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {terms.map((t, i) => (
            <Chip key={i} label={t} size="small" color={i === n - 1 ? 'primary' : 'default'} />
          ))}
          {n > 15 && <Chip label="..." size="small" variant="outlined" />}
        </Box>
      </Paper>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
            <Typography variant="caption">nth Term (aₙ)</Typography>
            <Typography variant="h4" fontWeight={700} color="primary">{nthTerm}</Typography>
            <Typography variant="caption" color="text.secondary">
              aₙ = a + (n-1)d = {a} + ({n}-1)×{d}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, bgcolor: '#fce4ec', textAlign: 'center' }}>
            <Typography variant="caption">Sum of n terms (Sₙ)</Typography>
            <Typography variant="h4" fontWeight={700} color="secondary">{sum}</Typography>
            <Typography variant="caption" color="text.secondary">
              Sₙ = n/2 × (2a + (n-1)d)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 2, mt: 2, bgcolor: '#fff3e0' }}>
        <Typography variant="subtitle2" gutterBottom>📝 Formulas:</Typography>
        <Box sx={{ fontFamily: 'monospace' }}>
          <BlockMath math={`a_n = a + (n-1)d = ${a} + (${n}-1) \\times ${d} = ${nthTerm}`} />
          <BlockMath math={`S_n = \\frac{n}{2}[2a + (n-1)d] = \\frac{${n}}{2}[2(${a}) + (${n}-1)(${d})] = ${sum}`} />
        </Box>
      </Paper>
      
      <Button onClick={() => speak(`The ${n}th term is ${nthTerm}, and the sum of ${n} terms is ${sum}`)} startIcon={<SpeakIcon />} sx={{ mt: 2 }}>
        Hear Explanation
      </Button>
    </Box>
  );
};

// ==================== MAIN COMPONENT ====================
function MathTools({ open, onClose, fullScreen = false }) {
  const [selectedClass, setSelectedClass] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  
  // Calculator, LaTeX, Graph state
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [latexInput, setLatexInput] = useState('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  const [graphExpr, setGraphExpr] = useState('x^2');
  const graphRef = useRef(null);
  
  const currentClass = CURRICULUM[selectedClass];
  
  const handleScore = (points) => {
    setTotalScore(prev => prev + points);
  };
  
  const handleCalculate = () => {
    try {
      const result = math.evaluate(calcExpr);
      setCalcResult(typeof result === 'number' ? math.format(result, { precision: 10 }) : result.toString());
    } catch (e) {
      setCalcResult('Error: ' + e.message);
    }
  };
  
  useEffect(() => {
    if (activeTab === 2 && graphRef.current && open && !selectedTopic) {
      import('function-plot').then((fp) => {
        graphRef.current.innerHTML = '';
        fp.default({
          target: graphRef.current,
          width: graphRef.current.clientWidth || 500,
          height: 300,
          yAxis: { domain: [-10, 10] },
          xAxis: { domain: [-10, 10] },
          grid: true,
          data: [{ fn: graphExpr, color: '#1976d2' }]
        });
      }).catch(console.error);
    }
  }, [graphExpr, activeTab, open, selectedTopic]);
  
  // Render interactive tool based on topic
  const renderTool = () => {
    if (!selectedTopic) return null;
    
    switch (selectedTopic.id) {
      // Class 1-3: Counting & Basic Operations
      case 'counting': return <CountingGame onComplete={handleScore} />;
      case 'comparison': return <ComparisonGame onComplete={handleScore} />;
      case 'addition': case 'addCarry': return <AdditionPractice maxNumber={selectedClass <= 2 ? 20 : 100} onComplete={handleScore} />;
      case 'subtraction': case 'subBorrow': return <SubtractionPractice maxNumber={selectedClass <= 2 ? 20 : 100} onComplete={handleScore} />;
      case 'patterns': return <PatternGame onComplete={handleScore} />;
      case 'shapes': return <ShapeExplorer />;
      case 'measurement': return <MeasurementBasics onComplete={handleScore} />;
      case 'money': return <MoneyGame onComplete={handleScore} />;
      
      // Class 2-4: Place Value, Times Tables, Fractions
      case 'placeValue': case 'largeNumbers': return <PlaceValueExplorer onComplete={handleScore} />;
      case 'multiplication': return <TimesTableTrainer onComplete={handleScore} />;
      case 'time': return <ClockPractice onComplete={handleScore} />;
      case 'fractions': case 'fractionOps': case 'fractionDecimals': return <FractionVisualizer />;
      
      // Class 5-7: Percentages, Geometry
      case 'percentage': case 'ratioPct': return <PercentageCalculator />;
      case 'areaPerimeter': case 'mensuration': case 'measurement': return <AreaPerimeterCalculator />;
      
      // Class 6-8: Integers, Algebra
      case 'integers': case 'integerOps': return <IntegerNumberLine onComplete={handleScore} />;
      case 'probability': return <ProbabilityGame onComplete={handleScore} />;
      case 'coordinate': return <CoordinatePlotter />;
      
      // Class 9-10: Quadratics, Trigonometry, AP
      case 'quadratic': return <QuadraticSolver />;
      case 'trigonometry': case 'trigFunctions': return <TrigCalculator />;
      case 'ap': return <APCalculator />;
      
      // Class 11-12: Matrices
      case 'matrices': case 'determinants': return <MatrixCalculator />;
      
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>🚧 Coming Soon</Typography>
            <Typography variant="body2" color="text.secondary">
              Interactive tool for "{selectedTopic.name}" is being developed.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try the Calculator or Graphing tabs for now!
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={fullScreen ? false : "md"} fullWidth fullScreen={fullScreen} PaperProps={{ sx: { height: fullScreen ? '100%' : '90vh' } }}>
      <DialogTitle sx={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: currentClass?.color || '#1976d2', color: 'white', py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedTopic ? (
            <IconButton onClick={() => setSelectedTopic(null)} sx={{ color: 'white' }}>
              <BackIcon />
            </IconButton>
          ) : <FunctionsIcon />}
          <Typography variant="h6">{selectedTopic ? selectedTopic.name : 'Math Tools'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={totalScore} color="secondary" max={999}>
            <Chip icon={<StarIcon />} label="Score" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          </Badge>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <Select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedTopic(null); }}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
            >
              {Object.entries(CURRICULUM).map(([key, val]) => (
                <MenuItem key={key} value={parseInt(key)}>{val.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      {!selectedTopic && (
        <>
          <Box sx={{ px: 2, py: 1, bgcolor: `${currentClass?.color}15`, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>{currentClass?.category}</Typography>
            <Typography variant="caption" color="text.secondary">{currentClass?.focus}</Typography>
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
              <Tab icon={<SchoolIcon />} label="Topics" iconPosition="start" />
              <Tab icon={<CalculatorIcon />} label="Calculator" iconPosition="start" />
              <Tab icon={<GraphIcon />} label="Graphing" iconPosition="start" />
              <Tab icon={<FunctionsIcon />} label="LaTeX" iconPosition="start" />
            </Tabs>
          </Box>
        </>
      )}

      <DialogContent sx={{ p: 2 }}>
        {selectedTopic ? (
          <Box>
            <Alert severity="info" icon={<TipIcon />} sx={{ mb: 2 }}>
              {selectedTopic.description} - {currentClass.name}
            </Alert>
            {renderTool()}
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <Grid container spacing={1.5}>
                {currentClass?.topics.map((topic) => (
                  <Grid item xs={6} sm={4} md={3} key={topic.id}>
                    <Card elevation={0} sx={{ border: '2px solid', borderColor: 'divider', borderRadius: 2, '&:hover': { borderColor: currentClass.color, transform: 'translateY(-2px)', boxShadow: 2 }, transition: 'all 0.2s' }}>
                      <CardActionArea onClick={() => setSelectedTopic(topic)} sx={{ p: 1.5 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography fontSize="2rem" mb={0.5}>{topic.icon}</Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2, mb: 0.5 }}>{topic.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{topic.description}</Typography>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            {activeTab === 1 && (
              <Box>
                <TextField fullWidth value={calcExpr} onChange={(e) => setCalcExpr(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCalculate()} placeholder="e.g., sqrt(16) + sin(pi/2)" sx={{ mb: 2 }} />
                <Button variant="contained" onClick={handleCalculate} sx={{ mb: 2 }}>Calculate</Button>
                {calcResult && <Paper sx={{ p: 2, bgcolor: calcResult.startsWith('Error') ? '#ffebee' : '#e8f5e9' }}><Typography variant="h5" fontFamily="monospace">= {calcResult}</Typography></Paper>}
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {['sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'pi', 'e', '^', '(', ')'].map(fn => (
                    <Grid item xs={3} key={fn}><Button fullWidth variant="outlined" size="small" onClick={() => setCalcExpr(prev => prev + fn + (fn.length > 1 && !['pi', 'e'].includes(fn) ? '(' : ''))}>{fn}</Button></Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {activeTab === 2 && (
              <Box>
                <TextField fullWidth value={graphExpr} onChange={(e) => setGraphExpr(e.target.value)} placeholder="e.g., sin(x), x^2" sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                  {['x^2', 'sin(x)', 'cos(x)', 'tan(x)', 'log(x)', '1/x'].map(fn => <Chip key={fn} label={fn} size="small" onClick={() => setGraphExpr(fn)} />)}
                </Box>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}><Box ref={graphRef} sx={{ width: '100%', minHeight: 300 }} /></Paper>
              </Box>
            )}
            {activeTab === 3 && (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {[{ l: 'Fraction', t: '\\frac{a}{b}' }, { l: 'Square Root', t: '\\sqrt{x}' }, { l: 'Power', t: 'x^{n}' }, { l: 'Integral', t: '\\int_{a}^{b} f(x) dx' }, { l: 'Sum', t: '\\sum_{i=1}^{n}' }].map(t => <Chip key={t.l} label={t.l} size="small" onClick={() => setLatexInput(prev => prev + ' ' + t.t)} />)}
                </Box>
                <TextField fullWidth multiline rows={3} value={latexInput} onChange={(e) => setLatexInput(e.target.value)} sx={{ mb: 2, fontFamily: 'monospace' }} />
                <Paper sx={{ p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>{latexInput && <BlockMath math={latexInput} errorColor="#cc0000" />}</Paper>
              </Box>
            )}
          </>
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

export default MathTools;
