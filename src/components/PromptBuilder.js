import React, { useState, useEffect } from 'react';
import './PromptBuilder.css';

const PromptBuilder = ({ onPromptGenerated, initialPrompt = '' }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [promptHistory, setPromptHistory] = useState([]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  const categories = {
    general: {
      name: 'General Editing',
      templates: [
        'Enhance the overall quality and make it more professional',
        'Improve colors and lighting',
        'Remove imperfections and blemishes',
        'Make it look more modern and clean'
      ]
    },
    artistic: {
      name: 'Artistic Effects',
      templates: [
        'Convert to {style} painting style',
        'Apply {mood} atmosphere with {technique}',
        'Create a {style} artistic interpretation',
        'Transform into {mood} {style} artwork'
      ]
    },
    technical: {
      name: 'Technical Improvements',
      templates: [
        'Increase resolution and add detail',
        'Fix lighting and exposure issues',
        'Remove noise and improve sharpness',
        'Correct color balance and saturation'
      ]
    },
    creative: {
      name: 'Creative Transformations',
      templates: [
        'Change the setting to {custom}',
        'Add {custom} elements to the scene',
        'Transform the time of day to {custom}',
        'Replace the background with {custom}'
      ]
    }
  };

  const styles = [
    'Photorealistic', 'Oil Painting', 'Watercolor', 'Pencil Sketch',
    'Digital Art', 'Impressionist', 'Abstract', 'Pop Art',
    'Vintage', 'Modern', 'Minimalist', 'Surreal'
  ];

  const moods = [
    'Bright and Cheerful', 'Dark and Moody', 'Dramatic', 'Peaceful',
    'Energetic', 'Mysterious', 'Romantic', 'Nostalgic',
    'Professional', 'Dreamy', 'Intense', 'Serene'
  ];

  const techniques = [
    'Soft Focus', 'High Contrast', 'Vibrant Colors', 'Monochromatic',
    'Sepia Tone', 'HDR Effect', 'Film Grain', 'Motion Blur',
    'Depth of Field', 'Macro Style', 'Wide Angle', 'Telephoto'
  ];

  const promptEnhancers = [
    'Make it look professional and high-quality',
    'Ensure natural and realistic results',
    'Maintain the original subject and composition',
    'Pay attention to details and textures',
    'Create a balanced and harmonious look',
    'Use appropriate lighting and shadows'
  ];

  useEffect(() => {
    const savedHistory = localStorage.getItem('promptHistory');
    if (savedHistory) {
      setPromptHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (promptHistory.length > 0) {
      localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
    }
  }, [promptHistory]);

  const buildPrompt = () => {
    let builtPrompt = prompt;

    if (selectedStyle) {
      builtPrompt = builtPrompt.replace('{style}', selectedStyle);
    }
    if (selectedMood) {
      builtPrompt = builtPrompt.replace('{mood}', selectedMood);
    }
    if (selectedTechnique) {
      builtPrompt = builtPrompt.replace('{technique}', selectedTechnique);
    }

    if (customInstructions) {
      builtPrompt += `. ${customInstructions}`;
    }

    if (isAdvancedMode) {
      const selectedEnhancers = document.querySelectorAll('.enhancer-checkbox:checked');
      if (selectedEnhancers.length > 0) {
        const enhancerTexts = Array.from(selectedEnhancers).map(cb => cb.value);
        builtPrompt += `. Additional requirements: ${enhancerTexts.join(', ')}`;
      }
    }

    return builtPrompt.trim();
  };

  const handleTemplateSelect = (template) => {
    setPrompt(template);
  };

  const handleGeneratePrompt = () => {
    const finalPrompt = buildPrompt();
    if (finalPrompt) {
      const timestamp = new Date().toLocaleString();
      const historyItem = {
        prompt: finalPrompt,
        timestamp,
        category: selectedCategory,
        style: selectedStyle,
        mood: selectedMood,
        technique: selectedTechnique
      };
      
      setPromptHistory([historyItem, ...promptHistory.slice(0, 19)]); // Keep last 20
      onPromptGenerated && onPromptGenerated(finalPrompt);
    }
  };

  const handleHistorySelect = (historyItem) => {
    setPrompt(historyItem.prompt);
    setSelectedCategory(historyItem.category);
    setSelectedStyle(historyItem.style || '');
    setSelectedMood(historyItem.mood || '');
    setSelectedTechnique(historyItem.technique || '');
  };

  const clearHistory = () => {
    setPromptHistory([]);
    localStorage.removeItem('promptHistory');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="prompt-builder">
      <div className="builder-header">
        <h3>AI Prompt Builder</h3>
        <div className="mode-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isAdvancedMode}
              onChange={(e) => setIsAdvancedMode(e.target.checked)}
            />
            Advanced Mode
          </label>
        </div>
      </div>

      <div className="builder-content">
        <div className="category-section">
          <label>Category:</label>
          <div className="category-tabs">
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="template-section">
          <label>Quick Templates:</label>
          <div className="template-grid">
            {categories[selectedCategory].templates.map((template, index) => (
              <button
                key={index}
                className="template-button"
                onClick={() => handleTemplateSelect(template)}
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        <div className="prompt-input-section">
          <label htmlFor="prompt-input">Your Prompt:</label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your desired image edits..."
            rows={4}
            className="prompt-textarea"
          />
          <div className="prompt-actions">
            <button
              className="copy-button"
              onClick={() => copyToClipboard(prompt)}
              disabled={!prompt}
            >
              Copy
            </button>
            <span className="char-count">{prompt.length} characters</span>
          </div>
        </div>

        {(selectedCategory === 'artistic' || isAdvancedMode) && (
          <div className="options-grid">
            <div className="option-group">
              <label>Style:</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="option-select"
              >
                <option value="">Select Style</option>
                {styles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label>Mood:</label>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="option-select"
              >
                <option value="">Select Mood</option>
                {moods.map(mood => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label>Technique:</label>
              <select
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="option-select"
              >
                <option value="">Select Technique</option>
                {techniques.map(technique => (
                  <option key={technique} value={technique}>{technique}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="custom-section">
          <label htmlFor="custom-input">Custom Instructions:</label>
          <textarea
            id="custom-input"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific requirements or details..."
            rows={2}
            className="custom-textarea"
          />
        </div>

        {isAdvancedMode && (
          <div className="enhancers-section">
            <label>Enhancements:</label>
            <div className="enhancers-grid">
              {promptEnhancers.map((enhancer, index) => (
                <label key={index} className="enhancer-label">
                  <input
                    type="checkbox"
                    value={enhancer}
                    className="enhancer-checkbox"
                  />
                  <span>{enhancer}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="generate-section">
          <button
            className="generate-button"
            onClick={handleGeneratePrompt}
            disabled={!prompt.trim()}
          >
            Generate Enhanced Prompt
          </button>
        </div>

        {promptHistory.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h4>Prompt History</h4>
              <button className="clear-history-button" onClick={clearHistory}>
                Clear History
              </button>
            </div>
            <div className="history-list">
              {promptHistory.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-prompt" onClick={() => handleHistorySelect(item)}>
                    {item.prompt}
                  </div>
                  <div className="history-meta">
                    <span className="history-time">{item.timestamp}</span>
                    <span className="history-category">{categories[item.category]?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptBuilder;
