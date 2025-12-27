import React, { useState } from 'react';
import openAIService from '../services/openAIService';
import './ImageResult.css';

const ImageResult = ({ result, onBack, onNewEdit }) => {
  const [activeTab, setActiveTab] = useState('edited');

  const handleDownload = (imageData, fileName) => {
    openAIService.downloadImage(imageData, fileName);
  };

  // Handle edited image result
  if (result.type === 'edited_image') {
    return (
      <div className="image-result">
        <div className="result-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Editor
          </button>
          <h3>Edited Image</h3>
          <button className="new-edit-button" onClick={onNewEdit}>
            New Edit
          </button>
        </div>

        <div className="result-content">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'edited' ? 'active' : ''}`}
              onClick={() => setActiveTab('edited')}
            >
              Edited Image
            </button>
            <button
              className={`tab-button ${activeTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveTab('original')}
            >
              Original
            </button>
            <button
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Edit Info
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'edited' && (
              <div className="image-preview">
                <h4>Edited Image</h4>
                <img 
                  src={result.editedImage} 
                  alt="Edited" 
                  className="preview-img"
                />
                <div className="image-actions">
                  <button
                    className="download-button primary"
                    onClick={() => handleDownload(result.editedImage, result.fileName)}
                  >
                    Download Edited (High Quality)
                  </button>
                  <button
                    className="compare-button"
                    onClick={() => setActiveTab('original')}
                  >
                    Compare with Original
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'original' && (
              <div className="image-preview">
                <h4>Original Image</h4>
                <img 
                  src={result.originalImage} 
                  alt="Original" 
                  className="preview-img"
                />
                <div className="image-actions">
                  <button
                    className="download-button"
                    onClick={() => handleDownload(result.originalImage, result.originalFileName)}
                  >
                    Download Original
                  </button>
                  <button
                    className="compare-button"
                    onClick={() => setActiveTab('edited')}
                  >
                    View Edited
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="edit-info">
                <h4>Edit Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Prompt:</span>
                    <span className="info-value">{result.prompt}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Original File:</span>
                    <span className="info-value">{result.originalFileName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Edited File:</span>
                    <span className="info-value">{result.fileName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">File Size:</span>
                    <span className="info-value">{(result.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  {result.appliedSettings && (
                    <div className="info-item">
                      <span className="info-label">Applied Settings:</span>
                      <div className="settings-list">
                        {Object.entries(result.appliedSettings).map(([key, value]) => (
                          <span key={key} className="setting-tag">
                            {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default ImageResult;
