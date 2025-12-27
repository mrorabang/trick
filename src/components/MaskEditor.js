import React, { useState, useRef, useEffect } from 'react';
import './MaskEditor.css';

const MaskEditor = ({ imageFile, onMaskCreated, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [maskData, setMaskData] = useState(null);

  useEffect(() => {
    if (imageFile && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Create transparent overlay for mask
        ctx.globalCompositeOperation = 'source-over';
      };
      
      img.src = URL.createObjectURL(imageFile);
    }
  }, [imageFile]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate correct coordinates accounting for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = URL.createObjectURL(imageFile);
  };

  const createMaskFile = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Create mask canvas with transparent background and white drawn areas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Get current canvas image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create new image data for mask
    const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
    const maskData = maskImageData.data;
    
    // Process each pixel: white/semi-white areas become white, everything else becomes transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // If pixel is white or near-white (drawn area), make it white in mask
      // Otherwise make it transparent
      if (r > 200 && g > 200 && b > 200 && a > 0) {
        maskData[i] = 255;     // R
        maskData[i + 1] = 255; // G
        maskData[i + 2] = 255; // B
        maskData[i + 3] = 255; // A (opaque white)
      } else {
        maskData[i] = 0;       // R
        maskData[i + 1] = 0;   // G
        maskData[i + 2] = 0;   // B
        maskData[i + 3] = 0;   // A (transparent)
      }
    }
    
    // Put the mask image data on the mask canvas
    maskCtx.putImageData(maskImageData, 0, 0);
    
    // Convert to blob and create file
    maskCanvas.toBlob((blob) => {
      const maskFile = new File([blob], 'mask.png', { type: 'image/png' });
      onMaskCreated(maskFile);
    }, 'image/png');
  };

  return (
    <div className="mask-editor">
      <div className="editor-header">
        <h3>Create Mask for Text Editing</h3>
        <p>Draw over the text areas you want to edit (white areas will be edited)</p>
      </div>

      <div className="editor-controls">
        <div className="brush-controls">
          <label>Brush Size: {brushSize}px</label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
          />
        </div>

        <div className="action-buttons">
          <button onClick={clearMask} className="clear-button">
            Clear Mask
          </button>
          <button onClick={createMaskFile} className="create-button">
            Create Mask & Edit
          </button>
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="mask-canvas"
        />
      </div>

      <div className="instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Draw white areas over text you want to replace</li>
          <li>White areas = regions that will be edited</li>
          <li>Transparent areas = regions that will stay the same</li>
          <li>Click "Create Mask & Edit" when done</li>
        </ul>
      </div>
    </div>
  );
};

export default MaskEditor;
