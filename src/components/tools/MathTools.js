import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Functions as FunctionsIcon,
  ShowChart as GraphIcon,
  Calculate as CalculatorIcon
} from '@mui/icons-material';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import * as math from 'mathjs';

/**
 * MathTools - Comprehensive math toolkit for students
 * Features: LaTeX rendering, graphing calculator, expression evaluator
 */
function MathTools({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [latexInput, setLatexInput] = useState('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  const [calcExpression, setCalcExpression] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [calcHistory, setCalcHistory] = useState([]);
  const [graphExpression, setGraphExpression] = useState('x^2');
  const graphRef = useRef(null);

  // Common LaTeX templates
  const latexTemplates = [
    { label: 'Fraction', latex: '\\frac{a}{b}' },
    { label: 'Square Root', latex: '\\sqrt{x}' },
    { label: 'Power', latex: 'x^{n}' },
    { label: 'Subscript', latex: 'x_{i}' },
    { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx' },
    { label: 'Sum', latex: '\\sum_{i=1}^{n} x_i' },
    { label: 'Limit', latex: '\\lim_{x \\to \\infty} f(x)' },
    { label: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Derivative', latex: '\\frac{d}{dx} f(x)' },
    { label: 'Partial', latex: '\\frac{\\partial f}{\\partial x}' },
  ];

  // Calculate expression
  const handleCalculate = () => {
    try {
      const result = math.evaluate(calcExpression);
      const formattedResult = typeof result === 'number' 
        ? math.format(result, { precision: 10 })
        : result.toString();
      setCalcResult(formattedResult);
      setCalcHistory(prev => [...prev, { expr: calcExpression, result: formattedResult }].slice(-10));
    } catch (error) {
      setCalcResult(`Error: ${error.message}`);
    }
  };

  // Draw graph using function-plot
  useEffect(() => {
    if (activeTab === 2 && graphRef.current && open) {
      try {
        // Dynamic import of function-plot
        import('function-plot').then((functionPlot) => {
          const fp = functionPlot.default;
          graphRef.current.innerHTML = '';
          fp({
            target: graphRef.current,
            width: graphRef.current.clientWidth || 500,
            height: 350,
            yAxis: { domain: [-10, 10] },
            xAxis: { domain: [-10, 10] },
            grid: true,
            data: [{
              fn: graphExpression,
              color: '#1976d2'
            }]
          });
        });
      } catch (error) {
        console.error('Graph error:', error);
      }
    }
  }, [graphExpression, activeTab, open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FunctionsIcon />
          <Typography variant="h6">Math Tools</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<FunctionsIcon />} label="LaTeX Editor" />
          <Tab icon={<CalculatorIcon />} label="Calculator" />
          <Tab icon={<GraphIcon />} label="Graphing" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* LaTeX Editor Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Type LaTeX notation to render beautiful math equations
            </Typography>
            
            {/* Templates */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {latexTemplates.map((t, i) => (
                <Chip
                  key={i}
                  label={t.label}
                  size="small"
                  onClick={() => setLatexInput(prev => prev + ' ' + t.latex)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder="Enter LaTeX notation..."
              sx={{ mb: 2, fontFamily: 'monospace' }}
            />

            <Paper elevation={2} sx={{ p: 3, bgcolor: '#fafafa', minHeight: 100, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Preview:
              </Typography>
              {latexInput && (
                <Box sx={{ fontSize: '1.5rem' }}>
                  <BlockMath math={latexInput} errorColor="#cc0000" />
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Calculator Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Scientific calculator with support for advanced functions
            </Typography>

            <TextField
              fullWidth
              value={calcExpression}
              onChange={(e) => setCalcExpression(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
              placeholder="Enter expression (e.g., sqrt(16) + sin(pi/2))"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="contained" onClick={handleCalculate} startIcon={<CalculatorIcon />}>
                Calculate
              </Button>
              <Button variant="outlined" onClick={() => { setCalcExpression(''); setCalcResult(''); }}>
                Clear
              </Button>
            </Box>

            {calcResult && (
              <Paper elevation={2} sx={{ p: 2, bgcolor: calcResult.startsWith('Error') ? '#ffebee' : '#e8f5e9', mb: 2 }}>
                <Typography variant="h5" fontFamily="monospace">
                  = {calcResult}
                </Typography>
              </Paper>
            )}

            {/* Quick buttons */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
              {['sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'pi', 'e', '^', '(', ')', '/'].map(fn => (
                <Grid item xs={3} sm={2} key={fn}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    onClick={() => setCalcExpression(prev => prev + fn + (fn.length > 1 && fn !== 'pi' && fn !== 'e' ? '(' : ''))}
                  >
                    {fn}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {/* History */}
            {calcHistory.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>History:</Typography>
                {calcHistory.slice().reverse().map((h, i) => (
                  <Typography key={i} variant="body2" color="text.secondary" fontFamily="monospace">
                    {h.expr} = {h.result}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Graphing Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Plot mathematical functions interactively
            </Typography>

            <TextField
              fullWidth
              value={graphExpression}
              onChange={(e) => setGraphExpression(e.target.value)}
              placeholder="Enter function (e.g., sin(x), x^2, log(x))"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
              {['x^2', 'sin(x)', 'cos(x)', 'tan(x)', 'log(x)', 'exp(x)', '1/x', 'sqrt(x)'].map(fn => (
                <Chip 
                  key={fn} 
                  label={fn} 
                  size="small" 
                  onClick={() => setGraphExpression(fn)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <Paper elevation={2} sx={{ p: 2, bgcolor: '#fafafa' }}>
              <Box ref={graphRef} sx={{ width: '100%', minHeight: 350 }} />
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MathTools;

