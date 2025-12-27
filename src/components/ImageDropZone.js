import React, { useState, useCallback } from 'react';
import './ImageDropZone.css';

const ImageDropZone = ({ onFilesSelected, multiple = false, maxSize = 5 * 1024 * 1024, acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [previewImages, setPreviewImages] = useState([]);

  const validateFiles = (files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`File ${file.name} is not a valid image type`);
        return;
      }
      
      if (file.size > maxSize) {
        errors.push(`File ${file.name} is larger than ${maxSize / 1024 / 1024}MB`);
        return;
      }
      
      validFiles.push(file);
    });

    if (!multiple && validFiles.length > 1) {
      errors.push('Only one file is allowed');
      return { validFiles: [], errors };
    }

    return { validFiles, errors };
  };

  const createPreviews = (files) => {
    const previews = [];
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: e.target.result,
            file: file
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(() => {
      setPreviewImages(previews);
    });
  };

  const handleFiles = useCallback((files) => {
    setError('');
    const { validFiles, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    if (validFiles.length > 0) {
      createPreviews(validFiles);
      onFilesSelected && onFilesSelected(validFiles);
    }
  }, [onFilesSelected, validateFiles, createPreviews]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    handleFiles(files);
  }, [handleFiles]);

  const removePreview = (index) => {
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    
    if (newPreviews.length === 0 && onFilesSelected) {
      onFilesSelected([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-drop-zone">
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p className="drop-zone-text">
            Drag & drop images here or click to browse
          </p>
          <p className="drop-zone-hint">
            Accepted formats: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
          </p>
          <p className="drop-zone-hint">
            Max file size: {formatFileSize(maxSize)}
          </p>
          <input
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="file-input"
          />
          <button className="browse-button" type="button">
            Choose Files
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {previewImages.length > 0 && (
        <div className="preview-container">
          <h3>Preview ({previewImages.length})</h3>
          <div className="preview-grid">
            {previewImages.map((preview, index) => (
              <div key={index} className="preview-item">
                <img src={preview.url} alt={preview.name} className="preview-image" />
                <div className="preview-info">
                  <p className="preview-name">{preview.name}</p>
                  <p className="preview-size">{formatFileSize(preview.size)}</p>
                </div>
                <button
                  className="remove-button"
                  onClick={() => removePreview(index)}
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDropZone;
