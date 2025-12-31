/**
 * Universal Experiment Schema v1.0
 * 
 * A flexible schema that works across all Ekamanam Labs:
 * - Physics Simulator
 * - Chemistry Tools
 * - Math Lab
 * - Code Editor
 * - Globe Viewer
 * 
 * Supports:
 * - AI-generated experiments
 * - PDF context (what hub/PDF inspired this)
 * - Download/Upload as JSON
 * - Cross-user sharing
 */

export const EXPERIMENT_VERSION = '1.0';

export const LAB_TYPES = {
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry',
  MATH: 'math',
  CODE: 'code',
  GLOBE: 'globe'
};

export const PHYSICS_EXPERIMENT_TYPES = {
  PROJECTILE: 'projectile',
  FREEFALL: 'freefall',
  PENDULUM: 'pendulum',
  SPRING: 'spring',
  COLLISION: 'collision',
  INCLINED_PLANE: 'inclinedPlane',
  WAVE: 'wave',
  CUSTOM: 'custom'
};

export const CHEMISTRY_EXPERIMENT_TYPES = {
  MOLECULE: 'molecule',
  REACTION: 'reaction',
  PERIODIC_TABLE: 'periodicTable',
  CUSTOM: 'custom'
};

export const MATH_EXPERIMENT_TYPES = {
  FUNCTION: 'function',
  EQUATION: 'equation',
  GRAPH: 'graph',
  GEOMETRY: 'geometry',
  CUSTOM: 'custom'
};

export const CODE_EXPERIMENT_TYPES = {
  SNIPPET: 'snippet',
  ALGORITHM: 'algorithm',
  EXAMPLE: 'example',
  CUSTOM: 'custom'
};

export const GLOBE_EXPERIMENT_TYPES = {
  LOCATION: 'location',
  ROUTE: 'route',
  REGION: 'region',
  CUSTOM: 'custom'
};

/**
 * Create a new experiment
 */
export function createExperiment({
  title,
  description,
  lab,
  experimentType,
  parameters = {},
  config = {},
  tags = [],
  pdfContext = null
}) {
  return {
    id: generateId(),
    version: EXPERIMENT_VERSION,
    created: Date.now(),
    modified: Date.now(),
    metadata: {
      title,
      description,
      lab, // 'physics' | 'chemistry' | 'math' | 'code' | 'globe'
      tags, // ['motion', 'projectile', 'mechanics']
      author: null, // Set when saving
      pdfContext: pdfContext ? {
        hubId: pdfContext.hubId || null,
        hubName: pdfContext.hubName || null,
        pdfName: pdfContext.pdfName || null,
        page: pdfContext.page || null
      } : null
    },
    experiment: {
      type: experimentType, // Lab-specific type
      parameters, // Flexible key-value pairs
      config // Rendering/display settings
    }
  };
}

/**
 * Validate experiment structure
 */
export function validateExperiment(experiment) {
  if (!experiment) return { valid: false, error: 'Experiment is null or undefined' };
  
  // Check required fields
  if (!experiment.id) return { valid: false, error: 'Missing id' };
  if (!experiment.version) return { valid: false, error: 'Missing version' };
  if (!experiment.metadata) return { valid: false, error: 'Missing metadata' };
  if (!experiment.metadata.title) return { valid: false, error: 'Missing title' };
  if (!experiment.metadata.lab) return { valid: false, error: 'Missing lab type' };
  if (!experiment.experiment) return { valid: false, error: 'Missing experiment data' };
  if (!experiment.experiment.type) return { valid: false, error: 'Missing experiment type' };
  
  // Check lab type is valid
  if (!Object.values(LAB_TYPES).includes(experiment.metadata.lab)) {
    return { valid: false, error: `Invalid lab type: ${experiment.metadata.lab}` };
  }
  
  return { valid: true };
}

/**
 * Export experiment as JSON string
 */
export function exportExperiment(experiment) {
  return JSON.stringify(experiment, null, 2);
}

/**
 * Import experiment from JSON string
 */
export function importExperiment(jsonString) {
  try {
    const experiment = JSON.parse(jsonString);
    const validation = validateExperiment(experiment);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Generate new ID for imported experiment
    experiment.id = generateId();
    experiment.imported = Date.now();
    
    return { success: true, experiment };
  } catch (error) {
    return { success: false, error: `Failed to parse JSON: ${error.message}` };
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Example: Physics Projectile Motion
 */
export const EXAMPLE_PHYSICS_PROJECTILE = {
  id: 'exp_example_projectile',
  version: '1.0',
  created: Date.now(),
  modified: Date.now(),
  metadata: {
    title: 'Projectile Motion at 45°',
    description: 'A projectile launched at 45 degrees with initial velocity of 20 m/s',
    lab: 'physics',
    tags: ['motion', 'projectile', 'mechanics', 'parabolic'],
    author: 'system',
    pdfContext: null
  },
  experiment: {
    type: 'projectile',
    parameters: {
      angle: 45,
      velocity: 20,
      gravity: 9.8,
      mass: 1
    },
    config: {
      showTrajectory: true,
      showVelocityVector: true,
      showGrid: true
    }
  }
};

/**
 * Example: Chemistry Molecule
 */
export const EXAMPLE_CHEMISTRY_MOLECULE = {
  id: 'exp_example_caffeine',
  version: '1.0',
  created: Date.now(),
  modified: Date.now(),
  metadata: {
    title: 'Caffeine Molecule',
    description: '3D structure of caffeine (C8H10N4O2)',
    lab: 'chemistry',
    tags: ['molecule', 'organic', 'caffeine', '3d'],
    author: 'system',
    pdfContext: null
  },
  experiment: {
    type: 'molecule',
    parameters: {
      moleculeName: 'caffeine',
      formula: 'C8H10N4O2',
      structure: '3d' // Will be fetched from API
    },
    config: {
      rotate: true,
      showLabels: true,
      colorScheme: 'default'
    }
  }
};

/**
 * Example: Math Function Graph
 */
export const EXAMPLE_MATH_FUNCTION = {
  id: 'exp_example_quadratic',
  version: '1.0',
  created: Date.now(),
  modified: Date.now(),
  metadata: {
    title: 'Quadratic Function',
    description: 'Graph of y = x² - 4x + 3',
    lab: 'math',
    tags: ['function', 'quadratic', 'graph', 'parabola'],
    author: 'system',
    pdfContext: null
  },
  experiment: {
    type: 'function',
    parameters: {
      equation: 'x^2 - 4*x + 3',
      domain: { min: -2, max: 6 },
      range: { min: -2, max: 10 }
    },
    config: {
      showGrid: true,
      showAxis: true,
      color: '#2196f3'
    }
  }
};

/**
 * Example: Code Snippet
 */
export const EXAMPLE_CODE_SNIPPET = {
  id: 'exp_example_fibonacci',
  version: '1.0',
  created: Date.now(),
  modified: Date.now(),
  metadata: {
    title: 'Fibonacci Sequence',
    description: 'Recursive implementation of Fibonacci in JavaScript',
    lab: 'code',
    tags: ['javascript', 'recursion', 'fibonacci', 'algorithm'],
    author: 'system',
    pdfContext: null
  },
  experiment: {
    type: 'snippet',
    parameters: {
      language: 'javascript',
      code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55`
    },
    config: {
      theme: 'dark',
      fontSize: 14
    }
  }
};

/**
 * Example: Globe Location
 */
export const EXAMPLE_GLOBE_LOCATION = {
  id: 'exp_example_eiffel',
  version: '1.0',
  created: Date.now(),
  modified: Date.now(),
  metadata: {
    title: 'Eiffel Tower, Paris',
    description: 'Famous landmark in Paris, France',
    lab: 'globe',
    tags: ['landmark', 'paris', 'france', 'europe'],
    author: 'system',
    pdfContext: null
  },
  experiment: {
    type: 'location',
    parameters: {
      name: 'Eiffel Tower',
      coordinates: {
        lat: 48.8584,
        lon: 2.2945
      },
      country: 'France',
      city: 'Paris'
    },
    config: {
      zoom: 15,
      showLabel: true
    }
  }
};

