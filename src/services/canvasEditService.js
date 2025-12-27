class CanvasEditService {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  initCanvas(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.canvas = document.createElement('canvas');
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.drawImage(img, 0, 0);
        resolve(this.canvas);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }

  getPixelData() {
    if (!this.canvas) throw new Error('Canvas not initialized');
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  analyzePixels(pixelData) {
    const data = pixelData.data;
    return {
      width: pixelData.width,
      height: pixelData.height,
      totalPixels: data.length / 4,
      dominantColors: this.getDominantColors(data),
      brightness: this.getAverageBrightness(data)
    };
  }

  getDominantColors(data) {
    const colorMap = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color.split(',').map(Number));
  }

  getAverageBrightness(data) {
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      total += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return total / (data.length / 4);
  }

  getContrast(data) {
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
    }
    return max - min;
  }

  detectEdges(pixelData) {
    const data = pixelData.data;
    const width = pixelData.width;
    const height = pixelData.height;
    const edges = new Uint8ClampedArray(data.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Simple edge detection
        const topLeft = ((y - 1) * width + (x - 1)) * 4;
        const top = ((y - 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        
        const diff = Math.abs(data[idx] - data[topLeft]) + 
                    Math.abs(data[idx] - data[top]) + 
                    Math.abs(data[idx] - data[left]);
        
        if (diff > 30) {
          edges[idx] = 255;
          edges[idx + 1] = 255;
          edges[idx + 2] = 255;
          edges[idx + 3] = 255;
        }
      }
    }
    
    return new ImageData(edges, width, height);
  }

  async editPixelsWithAI(pixelData, prompt) {
    const analysis = this.analyzePixels(pixelData);
    
    // Gửi analysis + prompt lên AI
    const aiResponse = await this.callAI(analysis, prompt);
    
    // Áp dụng thay đổi
    return this.applyPixelChanges(pixelData, aiResponse);
  }

  async callAI(analysis, prompt) {
    try {
      // Gọi OpenAI API để phân tích và gợi ý chỉnh sửa
      const response = await fetch('/api/analyze-pixels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          prompt,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error('AI analysis failed');
      }
      
      return await response.json();
    } catch (error) {
      console.warn('AI call failed, using fallback:', error);
      
      // Fallback logic dựa trên prompt
      const lowerPrompt = prompt.toLowerCase();
      const changes = {};
      
      if (lowerPrompt.includes('bright') || lowerPrompt.includes('sáng')) {
        changes.brightness = Math.min(255, analysis.brightness + 30);
      }
      
      if (lowerPrompt.includes('dark') || lowerPrompt.includes('tối')) {
        changes.brightness = Math.max(0, analysis.brightness - 30);
      }
      
      if (lowerPrompt.includes('contrast') || lowerPrompt.includes('tương phản')) {
        changes.contrast = 1.3;
      }
      
      if (lowerPrompt.includes('black and white') || lowerPrompt.includes('đen trắng')) {
        changes.grayscale = true;
      }
      
      if (lowerPrompt.includes('vintage') || lowerPrompt.includes('cũ')) {
        changes.sepia = true;
        changes.brightness = analysis.brightness * 0.9;
      }
      
      return changes;
    }
    // Mock AI response - thay với API call thật
    return {
      brightness: analysis.brightness + 20,
      contrast: 1.2
    };
  }

  applyPixelChanges(pixelData, changes) {
    const data = pixelData.data;
    const originalBrightness = this.getAverageBrightness(data);
    
    // Brightness adjustment
    if (changes.brightness !== undefined) {
      const adjustment = changes.brightness - originalBrightness;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
      }
    }
    
    // Contrast adjustment
    if (changes.contrast) {
      const factor = (259 * (changes.contrast * 255 + 255)) / (255 * (259 - changes.contrast * 255));
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
      }
    }
    
    // Grayscale
    if (changes.grayscale) {
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
    }
    
    // Sepia effect
    if (changes.sepia) {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
      }
    }
    
    this.ctx.putImageData(pixelData, 0, 0);
    return this.canvas.toDataURL();
  }

  getEditedImage() {
    if (!this.canvas) throw new Error('Canvas not initialized');
    return this.canvas.toDataURL('image/png');
  }
}

const canvasEditService = new CanvasEditService();
export default canvasEditService;
