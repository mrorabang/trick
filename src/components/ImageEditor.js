import React, { useState } from 'react';
import openAIService from '../services/openAIService';
import PromptBuilder from './PromptBuilder';
import ImageResult from './ImageResult';
import './ImageEditor.css';

const ImageEditor = ({ imageFile, onBack, onEditComplete }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);

  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handlePromptGenerated = (generatedPrompt) => {
    setPrompt(generatedPrompt);
    setShowPromptBuilder(false);
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      setError('Please enter an editing prompt');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      // Validate prompt first
      const isPromptSafe = await openAIService.validatePrompt(prompt);
      if (!isPromptSafe) {
        setError('Prompt is not appropriate for image editing');
        return;
      }

      // Process the image
      const editResult = await openAIService.editImage(imageFile, prompt);
      setResult(editResult);
      
      if (onEditComplete) {
        onEditComplete(editResult);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const analysis = await openAIService.analyzeImage(imageFile);
      setResult({ 
        type: 'analysis', 
        content: analysis,
        originalImage: imagePreview,
        originalFileName: imageFile.name,
        fileName: `analyzed_${imageFile.name}`
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVariations = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for variations');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const variations = await openAIService.generateVariations(imageFile, prompt);
      setResult({ 
        type: 'variations', 
        content: variations,
        originalImage: imagePreview,
        originalFileName: imageFile.name,
        fileName: `variations_${imageFile.name}`
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewEdit = () => {
    setResult(null);
    setPrompt('');
    setShowPromptBuilder(false);
  };

  const handleBackToEditor = () => {
    setResult(null);
  };

  const presetPrompts = [
    'Enhance colors and make more vibrant',
    'Convert to black and white',
    'Add artistic painting effect',
    'Remove background',
    'Improve lighting and contrast',
    'Add vintage film look',
    'Make it look professional',
    'Add dreamy soft focus effect',
    'chỉnh thời gian thành 11:11'
  ];

  // If we have a result, show the ImageResult component
  if (result && (result.type === 'edited_image' || result.type === 'edit_instructions' || result.type === 'text_instructions')) {
    return (
      <ImageResult
        result={result}
        onBack={handleBackToEditor}
        onNewEdit={handleNewEdit}
      />
    );
  }

  return (
    <div className="image-editor">
      <div className="editor-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>AI Image Editor</h2>
      </div>

      <div className="editor-content">
        <div className="image-section">
          <div className="original-image">
            <h3>Original Image</h3>
            {imagePreview && (
              <img src={imagePreview} alt="Original" className="preview-img" />
            )}
            <p className="file-info">
              {imageFile?.name} ({(imageFile?.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        </div>

        <div className="controls-section">
          <div className="prompt-controls">
            <div className="prompt-header">
              <label htmlFor="prompt">Edit Prompt:</label>
              <button 
                className="prompt-builder-button"
                onClick={() => setShowPromptBuilder(!showPromptBuilder)}
              >
                {showPromptBuilder ? 'Simple Mode' : 'Advanced Prompt Builder'}
              </button>
            </div>
            
            {showPromptBuilder ? (
              <PromptBuilder 
                onPromptGenerated={handlePromptGenerated}
                initialPrompt={prompt}
              />
            ) : (
              <>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe how you want to edit the image..."
                  rows={4}
                  className="prompt-input"
                />

                <div className="preset-prompts">
                  <h4>Quick Prompts:</h4>
                  <div className="preset-grid">
                    {presetPrompts.map((presetPrompt, index) => (
                      <button
                        key={index}
                        className="preset-button"
                        onClick={() => setPrompt(presetPrompt)}
                      >
                        {presetPrompt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {!showPromptBuilder && (
            <div className="action-buttons">
              <button
                className="edit-button primary"
                onClick={handleEdit}
                disabled={isProcessing || !prompt.trim()}
              >
                {isProcessing ? 'Processing...' : 'Edit Image (Gemini AI)'}
              </button>
              
              <button
                className="analyze-button secondary"
                onClick={handleAnalyze}
                disabled={isProcessing}
              >
                {isProcessing ? 'Analyzing...' : 'Analyze Image'}
              </button>
              
              <button
                className="variations-button secondary"
                onClick={handleVariations}
                disabled={isProcessing || !prompt.trim()}
              >
                {isProcessing ? 'Generating...' : 'Create Variations'}
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {result && (result.type === 'analysis' || result.type === 'variations') && (
          <div className="result-section">
            <h3>Result:</h3>
            <div className="result-content">
              {result.type === 'analysis' ? (
                <div className="analysis-result">
                  <pre>{result.content}</pre>
                </div>
              ) : (
                <div className="variations-result">
                  <pre>{result.content}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
