/**
 * Markdown to HTML renderer for AI responses
 * Converts markdown syntax to properly formatted HTML
 * v10.4.18: Created for consistent markdown rendering across all AI components
 */

/**
 * Convert LaTeX math to HTML
 */
const convertMathToHtml = (mathContent) => {
  let html = mathContent;
  
  // Greek letters
  const greekLetters = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\pi': 'π', '\\sigma': 'σ',
    '\\tau': 'τ', '\\phi': 'φ', '\\omega': 'ω', '\\Delta': 'Δ', '\\Omega': 'Ω'
  };
  
  Object.entries(greekLetters).forEach(([latex, unicode]) => {
    html = html.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), unicode);
  });
  
  // Math operators
  html = html.replace(/\\cos/g, 'cos');
  html = html.replace(/\\sin/g, 'sin');
  html = html.replace(/\\tan/g, 'tan');
  html = html.replace(/\\sqrt/g, '√');
  html = html.replace(/\\times/g, '×');
  html = html.replace(/\\div/g, '÷');
  html = html.replace(/\\pm/g, '±');
  html = html.replace(/\\approx/g, '≈');
  html = html.replace(/\\neq/g, '≠');
  html = html.replace(/\\leq/g, '≤');
  html = html.replace(/\\geq/g, '≥');
  html = html.replace(/\\infty/g, '∞');
  
  // Subscripts: x_{abc} or x_0
  html = html.replace(/([a-zA-Z0-9])_\{([^}]+)\}/g, (match, base, sub) => {
    return `${base}<sub>${sub}</sub>`;
  });
  html = html.replace(/([a-zA-Z0-9])_([a-zA-Z0-9])/g, (match, base, sub) => {
    return `${base}<sub>${sub}</sub>`;
  });
  
  // Superscripts: x^{abc} or x^2
  html = html.replace(/([a-zA-Z0-9])\\?\^\{([^}]+)\}/g, (match, base, sup) => {
    return `${base}<sup>${sup}</sup>`;
  });
  html = html.replace(/([a-zA-Z0-9])\\?\^([a-zA-Z0-9])/g, (match, base, sup) => {
    return `${base}<sup>${sup}</sup>`;
  });
  
  // Fractions: \frac{a}{b}
  html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    return `<span style="display: inline-block; text-align: center;">
      <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${num}</span>
      <span style="display: block; padding: 0 2px;">${den}</span>
    </span>`;
  });
  
  return html;
};

export const markdownToHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let html = text;
  
  // Convert LaTeX math (inline: $...$)
  html = html.replace(/\$(.+?)\$/g, (match, math) => {
    const converted = convertMathToHtml(math);
    return `<span style="font-style: italic; font-family: 'Times New Roman', serif;">${converted}</span>`;
  });
  
  // Convert headers (must be at start of line)
  html = html.replace(/^### (.*)$/gim, '<h3 style="margin: 12px 0 8px 0; font-weight: 600; font-size: 1.1em;">$1</h3>');
  html = html.replace(/^## (.*)$/gim, '<h2 style="margin: 16px 0 10px 0; font-weight: 600; font-size: 1.25em;">$1</h2>');
  html = html.replace(/^# (.*)$/gim, '<h1 style="margin: 20px 0 12px 0; font-weight: 700; font-size: 1.5em;">$1</h1>');
  
  // Convert bold (before italic to avoid conflicts)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Convert italic (but not underscores used in math subscripts that are already converted)
  html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  
  // Convert inline code
  html = html.replace(/`(.+?)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
  
  // Convert numbered lists (must be at start of line)
  html = html.replace(/^\d+\.\s+(.*)$/gim, '<li style="margin-left: 20px;">$1</li>');
  
  // Convert bullet points (must be at start of line)
  html = html.replace(/^[•\-\*]\s+(.*)$/gim, '<li style="margin-left: 20px;">$1</li>');
  
  // Wrap consecutive <li> tags in <ul> with proper spacing
  html = html.replace(/(<li[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ul style="margin: 8px 0; padding-left: 0; list-style-position: inside;">${match}</ul>`;
  });
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #1976d2; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert line breaks to paragraphs (handle double newlines)
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(para => {
    para = para.trim();
    // Don't wrap if already a tag
    if (!para) return '';
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<li')) {
      return para;
    }
    // Replace single newlines with <br> within paragraphs
    para = para.replace(/\n/g, '<br>');
    return `<p style="margin: 8px 0;">${para}</p>`;
  }).filter(p => p).join('');
  
  return html;
};

/**
 * Simpler version for chat messages (preserves formatting but less aggressive)
 */
export const formatChatMessage = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let html = text;
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic  
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
};

