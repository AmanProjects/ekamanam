import React, { useState, useRef } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Alert,
  Badge,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as RunIcon,
  ContentCopy as CopyIcon,
  Delete as ClearIcon,
  Code as CodeIcon,
  Send as SendIcon,
  AddCircle as InsertIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { callLLM } from '../../services/llmService';

/**
 * CodeEditor - Interactive code editor for programming practice
 * Features: Syntax highlighting, multiple languages, code execution (JS)
 */

// Vyonn Code Icon component
function VyonnCodeIcon({ size = 40 }) {
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
            background: 'linear-gradient(135deg, #2d3436 0%, #1a1d1f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(45,52,54,0.4)'
          }}
        >
          <CodeIcon sx={{ fontSize: size * 0.3, color: 'white' }} />
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

// AI Chat Component
function CodeAIChat({ user, onInsertCode }) {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  const SUGGESTED_QUESTIONS = [
    "Explain JavaScript async/await",
    "What are Python classes?",
    "How do CSS flexbox layouts work?",
    "Explain SQL JOIN operations"
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
      
      const prompt = `You are Vyonn Code, a brilliant and friendly programming tutor.

${isRegional ? `🚨 IMPORTANT: Student asked in ${lang}. You MUST respond in ${lang}!` : ''}

Student asked: "${userQuestion}"

Provide a clear, educational response that:
1. Explains the programming concept step-by-step ${isRegional ? `(in ${lang})` : ''}
2. Includes code examples where helpful
3. Covers best practices and common pitfalls ${isRegional ? `(explained in ${lang})` : ''}
4. Is encouraging and supportive ${isRegional ? `(in ${lang})` : ''}
5. Suggests next steps for learning ${isRegional ? `(in ${lang})` : ''}

When including code examples, wrap them with special markers:
[CODE_START:language]
your code here
[CODE_END]

For example:
[CODE_START:javascript]
function greet(name) {
  console.log('Hello, ' + name);
}
[CODE_END]

${isRegional ? `Write explanations in ${lang}, but code examples can remain in programming language!` : 'Be warm and engaging!'}`;

      const response = await callLLM(prompt, { feature: 'general', temperature: 0.7, maxTokens: 2048 });  // V3.2: Increased for detailed code explanations
      
      // Extract code blocks if present
      const codeMatches = [...(response || '').matchAll(/\[CODE_START:(\w+)\]\n?([\s\S]*?)\n?\[CODE_END\]/g)];
      let content = response || "Let me help you with that coding concept!";
      const codeBlocks = [];
      
      codeMatches.forEach((match, index) => {
        const [fullMatch, language, code] = match;
        codeBlocks.push({ language, code: code.trim(), index });
        // Replace code block with a placeholder in the displayed text
        content = content.replace(fullMatch, `\n[Code Example ${index + 1} - ${language}]\n`);
      });
      
      setChatHistory(prev => [{ role: 'assistant', content, codeBlocks }, ...prev]);
    } catch (error) {
      console.error('❌ Code AI error:', error);
      console.error('❌ Error details:', error.message, error.stack);
      // v10.4.6: Graceful fallback like Chemistry - don't show raw error to user
      setChatHistory(prev => [{ 
        role: 'assistant', 
        content: "I'd be happy to help you with programming! Could you please rephrase your question? Try to be specific about what you'd like to learn - whether it's JavaScript, Python, HTML, CSS, or any other programming topic. I'm here to help! 💻" 
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
          placeholder="Ask me anything about programming..."
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
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
        {chatHistory.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <VyonnCodeIcon size={64} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Welcome to Vyonn Code Editor! 💻
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask me anything about JavaScript, Python, Java, HTML, CSS, React, and more!
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
                    <VyonnCodeIcon size={32} />
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
                      {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                          {msg.codeBlocks.map((block, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              variant="contained"
                              startIcon={<InsertIcon />}
                              onClick={() => onInsertCode(block.code, block.language)}
                              sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                              Insert {block.language} Code
                            </Button>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VyonnCodeIcon size={24} />
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

function CodeEditor({ open, onClose, user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(codeTemplates.javascript);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const editorRef = useRef(null);

  const languages = [
    { id: 'javascript', name: 'JavaScript', runnable: true },
    { id: 'python', name: 'Python', runnable: false },
    { id: 'java', name: 'Java', runnable: false },
    { id: 'cpp', name: 'C++', runnable: false },
    { id: 'html', name: 'HTML', runnable: true },
    { id: 'css', name: 'CSS', runnable: false },
    { id: 'sql', name: 'SQL', runnable: false },
  ];

  // Run JavaScript code
  const runCode = () => {
    setError(null);
    setOutput('');

    if (language === 'javascript') {
      try {
        // Capture console.log output
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' '));
        };

        // Execute code safely
        // eslint-disable-next-line no-eval
        const result = eval(code);
        
        console.log = originalLog;

        let outputText = logs.join('\n');
        if (result !== undefined && !logs.length) {
          outputText = String(result);
        } else if (result !== undefined) {
          outputText += '\n→ ' + String(result);
        }
        
        setOutput(outputText || '(No output)');
      } catch (err) {
        setError(err.message);
      }
    } else if (language === 'html') {
      // Create preview for HTML
      setOutput('HTML_PREVIEW:' + code);
    } else {
      setOutput(`⚠️ ${language} execution is not supported in browser.\nCode is syntax-highlighted for learning.`);
    }
  };

  // Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  // Handle language change
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(codeTemplates[newLang] || '// Start coding...');
    setOutput('');
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #2d3436 0%, #1a1d1f 100%)',
        color: 'white',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VyonnCodeIcon size={36} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Vyonn Code Editor</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>JavaScript · Python · Java · HTML · CSS</Typography>
            </Box>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              sx={{ 
                color: 'white', 
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '.MuiSvgIcon-root': { color: 'white' }
              }}
            >
              {languages.map(lang => (
                <MenuItem key={lang.id} value={lang.id}>
                  {lang.name} {lang.runnable && '▶'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={runCode}
            startIcon={<RunIcon />}
            sx={{ bgcolor: '#27ae60' }}
            disabled={!languages.find(l => l.id === language)?.runnable}
          >
            Run
          </Button>
          <IconButton onClick={copyCode} sx={{ color: 'white' }} title="Copy code">
            <CopyIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 600, minWidth: 'auto', px: 2 } }}>
          <Tab icon={<VyonnCodeIcon size={18} />} label="Ask Vyonn AI" iconPosition="start" />
          <Tab icon={<CodeIcon sx={{ fontSize: 18 }} />} label="Code Editor" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 0 && <CodeAIChat user={user} onInsertCode={(codeContent, lang) => {
          setCode(codeContent);
          if (lang && languages.find(l => l.id === lang.toLowerCase())) {
            setLanguage(lang.toLowerCase());
          }
          setActiveTab(1);
        }} />}
        {activeTab === 1 && (
        <Grid container sx={{ flexGrow: 1, height: '100%' }}>
          {/* Editor */}
          <Grid item xs={12} md={7} sx={{ height: '100%', borderRight: '1px solid #ddd' }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2
              }}
              onMount={(editor) => { editorRef.current = editor; }}
            />
          </Grid>

          {/* Output */}
          <Grid item xs={12} md={5} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              <Typography variant="subtitle2">Output</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#1e1e1e' }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {output.startsWith('HTML_PREVIEW:') ? (
                <Paper sx={{ p: 2, bgcolor: 'white', overflow: 'auto' }}>
                  <iframe
                    key={output.length}
                    srcDoc={output.replace('HTML_PREVIEW:', '')}
                    title="HTML Preview"
                    style={{
                      width: '100%',
                      minHeight: 300,
                      border: 'none',
                      background: 'white'
                    }}
                    sandbox="allow-scripts"
                  />
                </Paper>
              ) : (
                <Typography 
                  component="pre" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: 14, 
                    color: '#4ade80',
                    whiteSpace: 'pre-wrap',
                    m: 0
                  }}
                >
                  {output || 'Click "Run" to execute code...'}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
        )}

        {activeTab === 1 && (
        <Box sx={{ p: 1.5, bgcolor: '#f0f0f0', borderTop: '1px solid #ddd' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Quick snippets:
          </Typography>
          {codeSnippets[language]?.map((snippet, i) => (
            <Chip
              key={i}
              label={snippet.name}
              size="small"
              onClick={() => setCode(snippet.code)}
              sx={{ mr: 0.5, cursor: 'pointer' }}
            />
          ))}
        </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Code templates for each language
const codeTemplates = {
  javascript: `// JavaScript - Interactive Coding
// Try these examples!

// Variables
let name = "Student";
let age = 16;

// Function
function greet(person) {
  return \`Hello, \${person}! Welcome to coding.\`;
}

// Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// Output
console.log(greet(name));
console.log("Doubled:", doubled);
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));
`,
  python: `# Python - Learning to Code
# Note: Python runs on server, this is for learning syntax

# Variables
name = "Student"
age = 16

# Function
def greet(person):
    return f"Hello, {person}! Welcome to Python."

# List comprehension
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]

# Output
print(greet(name))
print("Doubled:", doubled)
print("Sum:", sum(numbers))
`,
  java: `// Java - Object-Oriented Programming
public class Main {
    public static void main(String[] args) {
        // Variables
        String name = "Student";
        int age = 16;
        
        // Output
        System.out.println("Hello, " + name + "!");
        System.out.println("Age: " + age);
        
        // Array
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        System.out.println("Sum: " + sum);
    }
}
`,
  cpp: `// C++ - Systems Programming
#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Variables
    string name = "Student";
    int age = 16;
    
    // Output
    cout << "Hello, " << name << "!" << endl;
    cout << "Age: " << age << endl;
    
    // Vector
    vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int n : numbers) {
        sum += n;
    }
    cout << "Sum: " << sum << endl;
    
    return 0;
}
`,
  html: `<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        h1 { text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .card {
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <h1>🎉 Welcome to HTML!</h1>
    <div class="card">
        <h2>Learning Web Development</h2>
        <p>HTML + CSS = Beautiful websites!</p>
        <button onclick="alert('Hello!')">Click me!</button>
    </div>
</body>
</html>
`,
  css: `/* CSS - Styling the Web */

/* Modern Card Design */
.card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    color: white;
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
}

/* Button Styles */
.button {
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
}

.button:hover {
    background: #45a049;
}

/* Flexbox Layout */
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}
`,
  sql: `-- SQL - Database Queries

-- Create a table
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    age INT,
    grade VARCHAR(10)
);

-- Insert data
INSERT INTO students (id, name, age, grade)
VALUES 
    (1, 'Alice', 16, '10th'),
    (2, 'Bob', 15, '9th'),
    (3, 'Charlie', 17, '11th');

-- Select all students
SELECT * FROM students;

-- Filter and sort
SELECT name, age 
FROM students 
WHERE age >= 16 
ORDER BY age DESC;

-- Aggregate functions
SELECT grade, COUNT(*) as count, AVG(age) as avg_age
FROM students
GROUP BY grade;
`
};

// Quick snippets for each language
const codeSnippets = {
  javascript: [
    { name: 'For Loop', code: 'for (let i = 0; i < 10; i++) {\n  console.log(i);\n}' },
    { name: 'Array Map', code: 'const result = [1,2,3].map(x => x * 2);\nconsole.log(result);' },
    { name: 'Fetch API', code: "fetch('https://api.example.com/data')\n  .then(res => res.json())\n  .then(data => console.log(data));" },
    { name: 'Async/Await', code: 'async function getData() {\n  const response = await fetch(url);\n  return response.json();\n}' },
  ],
  python: [
    { name: 'For Loop', code: 'for i in range(10):\n    print(i)' },
    { name: 'List Comp', code: 'result = [x * 2 for x in [1, 2, 3]]\nprint(result)' },
    { name: 'Dictionary', code: 'data = {"name": "Alice", "age": 16}\nprint(data["name"])' },
    { name: 'Function', code: 'def add(a, b):\n    return a + b\n\nprint(add(2, 3))' },
  ],
  java: [
    { name: 'For Loop', code: 'for (int i = 0; i < 10; i++) {\n    System.out.println(i);\n}' },
    { name: 'ArrayList', code: 'ArrayList<String> list = new ArrayList<>();\nlist.add("Hello");' },
  ],
  html: [
    { name: 'Button', code: '<button onclick="alert(\'Clicked!\')">Click Me</button>' },
    { name: 'Image', code: '<img src="image.jpg" alt="Description" width="300">' },
    { name: 'Link', code: '<a href="https://example.com">Visit Site</a>' },
  ],
};

export default CodeEditor;

