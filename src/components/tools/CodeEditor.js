import React, { useState, useRef } from 'react';
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
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as RunIcon,
  ContentCopy as CopyIcon,
  Delete as ClearIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

/**
 * CodeEditor - Interactive code editor for programming practice
 * Features: Syntax highlighting, multiple languages, code execution (JS)
 */
function CodeEditor({ open, onClose }) {
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
        bgcolor: '#2d3436',
        color: 'white',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">💻 Code Editor</Typography>
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

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
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

        {/* Code snippets */}
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

