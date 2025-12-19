/**
 * Utility for extracting 3D visualization JSON from AI responses
 * Used across Teacher Mode, Smart Explain, Activities, Exam Prep, and Vyonn
 */

/**
 * Extract 3D visualization JSON from text response
 * Returns { text: cleanedText, visualAid: jsonObject or null }
 */
export function extract3DVisualization(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return { text: responseText, visualAid: null };
  }

  let visualAid = null;
  let cleanText = responseText;

  console.log('🔍 Checking for 3D JSON in response...');

  // Strategy 1: Look for JSON code blocks (```json ... ```)
  let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      visualAid = JSON.parse(jsonMatch[1]);
      cleanText = responseText.replace(jsonMatch[0], '').trim();
      console.log('🎨 Found 3D visualization (code block):', visualAid);
      return { text: cleanText, visualAid };
    } catch (e) {
      console.warn('Failed to parse JSON from code block:', e);
    }
  }

  // Strategy 2: Look for inline JSON with balanced braces (3D, chemistry, plotly, logic_circuit)
  const startMatch = responseText.match(/\{\s*"type"\s*:\s*"(3d|chemistry|plotly|logic_circuit)"/);
  
  if (startMatch) {
    const startIndex = responseText.indexOf(startMatch[0]);
    console.log('🔍 Found JSON start at position:', startIndex);
    
    // Find matching closing brace by counting braces
    let braceCount = 0;
    let jsonEndIndex = -1;
    
    for (let i = startIndex; i < responseText.length; i++) {
      if (responseText[i] === '{') braceCount++;
      if (responseText[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEndIndex = i + 1;
          break;
        }
      }
    }
    
    if (jsonEndIndex > startIndex) {
      const jsonText = responseText.substring(startIndex, jsonEndIndex);
      console.log('🔍 Extracted JSON text:', jsonText);
      
      try {
        visualAid = JSON.parse(jsonText);
        
        // Remove JSON from response
        cleanText = responseText.substring(0, startIndex).trim() + 
                   responseText.substring(jsonEndIndex).trim();
        // Clean up extra whitespace
        cleanText = cleanText.replace(/\s+$/, '').trim();
        
        console.log('✅ Extracted 3D visualization:', visualAid);
        return { text: cleanText, visualAid };
      } catch (e) {
        console.warn('❌ Failed to parse 3D JSON:', e);
      }
    }
  }

  // Strategy 3: Look for circuitVisualization wrapper
  const circuitMatch = responseText.match(/\{\s*"circuitVisualization"\s*:/);
  if (circuitMatch) {
    const startIndex = responseText.indexOf(circuitMatch[0]);
    console.log('🔍 Found circuitVisualization at position:', startIndex);
    
    let braceCount = 0;
    let jsonEndIndex = -1;
    
    for (let i = startIndex; i < responseText.length; i++) {
      if (responseText[i] === '{') braceCount++;
      if (responseText[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEndIndex = i + 1;
          break;
        }
      }
    }
    
    if (jsonEndIndex > startIndex) {
      const jsonText = responseText.substring(startIndex, jsonEndIndex);
      try {
        const parsed = JSON.parse(jsonText);
        visualAid = parsed.circuitVisualization || parsed;
        cleanText = responseText.substring(0, startIndex).trim() + 
                   responseText.substring(jsonEndIndex).trim();
        cleanText = cleanText.replace(/\s+$/, '').trim();
        console.log('✅ Extracted circuit visualization:', visualAid);
        return { text: cleanText, visualAid };
      } catch (e) {
        console.warn('❌ Failed to parse circuit JSON:', e);
      }
    }
  }

  console.log('❌ No visualization found in response');
  return { text: cleanText, visualAid: null };
}

/**
 * Extract 3D visualizations from structured response object
 * Recursively searches through object properties
 */
export function extractFromStructuredResponse(responseObj) {
  if (!responseObj || typeof responseObj !== 'object') {
    return { response: responseObj, visualizations: [] };
  }

  const visualizations = [];
  const cleanedResponse = {};

  for (const [key, value] of Object.entries(responseObj)) {
    if (typeof value === 'string') {
      const extracted = extract3DVisualization(value);
      cleanedResponse[key] = extracted.text;
      if (extracted.visualAid) {
        visualizations.push({
          section: key,
          visualAid: extracted.visualAid
        });
      }
    } else if (Array.isArray(value)) {
      // Handle arrays (e.g., exercises, questions)
      cleanedResponse[key] = value.map(item => {
        if (typeof item === 'string') {
          const extracted = extract3DVisualization(item);
          if (extracted.visualAid) {
            visualizations.push({
              section: key,
              visualAid: extracted.visualAid
            });
          }
          return extracted.text;
        }
        return item;
      });
    } else {
      cleanedResponse[key] = value;
    }
  }

  return { response: cleanedResponse, visualizations };
}

export default {
  extract3DVisualization,
  extractFromStructuredResponse
};

