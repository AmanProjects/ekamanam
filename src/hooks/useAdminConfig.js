import { useState, useEffect } from 'react';

/**
 * Hook to read and apply admin configuration
 * @returns {Object} Admin configuration
 */
export const useAdminConfig = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Load config from localStorage
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem('ekamanam_admin_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfig(parsed);
          console.log('📋 Admin config loaded:', parsed);
        } else {
          console.log('📋 No admin config found, using defaults');
          setConfig(null);
        }
      } catch (error) {
        console.error('❌ Failed to load admin config:', error);
        setConfig(null);
      }
    };

    // Initial load
    loadConfig();

    // Listen for config updates
    const handleConfigUpdate = (event) => {
      console.log('🔄 Admin config updated');
      loadConfig();
    };

    window.addEventListener('adminConfigUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('adminConfigUpdated', handleConfigUpdate);
    };
  }, []);

  return config;
};

/**
 * Check if a tab is enabled
 * @param {Object} config - Admin configuration
 * @param {string} tabKey - Tab key (e.g., 'teacherMode', 'explain')
 * @returns {boolean} - true if tab is enabled
 */
export const isTabEnabled = (config, tabKey) => {
  if (!config || !config.tabs) return true; // Default to enabled
  const tab = config.tabs[tabKey];
  return tab ? tab.enabled !== false : true;
};

/**
 * Check if a feature is enabled
 * @param {Object} config - Admin configuration
 * @param {string} featureKey - Feature key (e.g., 'caching', 'autoSave')
 * @returns {boolean} - true if feature is enabled
 */
export const isFeatureEnabled = (config, featureKey) => {
  if (!config || !config.features) return true; // Default to enabled
  return config.features[featureKey] !== false;
};

/**
 * Get AI settings from config
 * @param {Object} config - Admin configuration
 * @returns {Object} - AI settings
 */
export const getAISettings = (config) => {
  if (!config || !config.ai) {
    return {
      defaultProvider: 'groq',
      temperature: 0.7,
      maxTokens: {
        teacherMode: 4096,
        explain: 8192,
        activities: 4096,
        examPrep: 4096,
        longAnswer: 1536,
        wordAnalysis: 4096
      }
    };
  }
  return config.ai;
};

export default useAdminConfig;

