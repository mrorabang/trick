import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GOOGLE_AI_API_KEY || 'AIzaSyAPWSV5wmC9pajfPZqhJ2xo1eWJQlRxmuc';
const genAI = new GoogleGenerativeAI(API_KEY);

class GoogleAIService {
  constructor(modelName = 'gemini-pro') {
    this.setModel(modelName);
  }

  /**
   * Set the model to use for generation
   * @param {string} modelName - Available models: 'gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'
   */
  setModel(modelName) {
    const availableModels = [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview', 
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];
    
    if (availableModels.includes(modelName)) {
      this.model = genAI.getGenerativeModel({ model: modelName });
      this.currentModel = modelName;
      console.log(`Using model: ${modelName}`);
    } else {
      console.warn(`Model ${modelName} not available. Using default: gemini-2.5-flash`);
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.currentModel = 'gemini-2.5-flash';
    }
  }

  /**đọc fileddo
   * Get current model name
   * @returns {string} Current model name
   */
  getCurrentModel() {
    return this.currentModel || 'gemini-1.5-flash';
  }

  /**
   * Edit image based on text prompt
   * @param {File} imageFile - The image file to edit
   * @param {string} prompt - The editing prompt
   * @returns {Promise<Object>} - Edited image result with download URL
   */
  async editImage(imageFile, prompt) {
    try {
      console.log('Starting image edit with prompt:', prompt);
      
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      console.log('Image converted to base64, length:', base64Image.length);
      
      // Try to use image generation model that can return edited images
      const editingPrompt = `You are an image editing AI. Please edit this image according to: "${prompt}". 
      Apply the requested changes and return the edited image. Make it look natural and professional.
      If you cannot generate the edited image, describe the specific visual changes needed in detail.`;

      const imagePart = {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: imageFile.type
        }
      };

      console.log('Sending request to AI with model:', this.getCurrentModel());
      
      const result = await this.model.generateContent([editingPrompt, imagePart]);
      const response = await result.response;
      
      console.log('AI Response received:', response);
      
      // Check if response contains image data
      const candidates = response.candidates || [];
      console.log('Candidates found:', candidates.length);
      
      if (candidates.length > 0) {
        const candidate = candidates[0];
        const content = candidate.content || {};
        const parts = content.parts || [];
        console.log('Parts found:', parts.length);
        
        // Look for image data in response
        for (const part of parts) {
          console.log('Part type:', part.inlineData ? 'has image data' : 'text only');
          if (part.inlineData && part.inlineData.data) {
            // Found edited image
            const editedImageData = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
            console.log('Edited image generated successfully!');
            return {
              type: 'edited_image',
              originalImage: base64Image,
              editedImage: editedImageData,
              fileName: `edited_${imageFile.name}`,
              originalFileName: imageFile.name,
              fileSize: imageFile.size,
              prompt: prompt
            };
          }
        }
      }
      
      // If no image returned, get text response and apply enhanced client-side edits
      const text = response.text();
      console.log('AI Response (no image):', text);
      
      // Apply more sophisticated edits based on prompt and AI analysis
      const editSettings = this.parsePromptForSettings(prompt, text);
      console.log('Applying enhanced client-side edits with settings:', editSettings);
      const editedImage = await this.applyImageEdits(base64Image, editSettings);
      console.log('Enhanced client-side edits completed');
      
      return {
        type: 'edited_image',
        originalImage: base64Image,
        editedImage: editedImage,
        fileName: `edited_${imageFile.name}`,
        originalFileName: imageFile.name,
        fileSize: imageFile.size,
        prompt: prompt,
        appliedSettings: editSettings,
        aiAnalysis: text
      };
      
    } catch (error) {
      console.error('Error editing image:', error);
      
      // Fallback: Apply basic edits without AI
      try {
        const base64Image = await this.fileToBase64(imageFile);
        const editSettings = this.parsePromptForSettings(prompt);
        const editedImage = await this.applyImageEdits(base64Image, editSettings);
        
        return {
          type: 'edited_image',
          originalImage: base64Image,
          editedImage: editedImage,
          fileName: `edited_${imageFile.name}`,
          originalFileName: imageFile.name,
          fileSize: imageFile.size,
          prompt: prompt,
          appliedSettings: editSettings,
          fallback: true
        };
      } catch (fallbackError) {
        throw new Error('Failed to edit image: ' + fallbackError.message);
      }
    }
  }

  /**
   * Parse prompt to extract image editing settings
   * @param {string} prompt - The editing prompt
   * @returns {Object} - Editing settings object
   */
  parsePromptForSettings(prompt, aiAnalysis = '') {
    const settings = {};
    const lowerPrompt = prompt.toLowerCase();
    const lowerAnalysis = aiAnalysis.toLowerCase();
    
    // Enhanced parsing based on AI analysis
    if (lowerAnalysis.includes('bright') || lowerPrompt.includes('bright') || lowerPrompt.includes('vibrant')) {
      settings.brightness = '110';
    }
    if (lowerAnalysis.includes('dark') || lowerPrompt.includes('dark') || lowerPrompt.includes('dim')) {
      settings.brightness = '90';
    }
    
    // Contrast adjustments
    if (lowerAnalysis.includes('contrast') || lowerPrompt.includes('contrast')) {
      settings.contrast = '120';
    }
    
    // Saturation adjustments
    if (lowerAnalysis.includes('color') || lowerAnalysis.includes('saturation') || lowerPrompt.includes('color') || lowerPrompt.includes('vibrant')) {
      settings.saturation = '130';
    }
    if (lowerAnalysis.includes('black and white') || lowerAnalysis.includes('grayscale') || lowerPrompt.includes('black and white') || lowerPrompt.includes('grayscale')) {
      settings.grayscale = true;
    }
    
    // Special effects
    if (lowerAnalysis.includes('vintage') || lowerAnalysis.includes('sepia') || lowerPrompt.includes('vintage') || lowerPrompt.includes('sepia')) {
      settings.sepia = true;
      settings.saturation = '80';
    }
    
    if (lowerAnalysis.includes('blur') || lowerAnalysis.includes('soft') || lowerPrompt.includes('blur') || lowerPrompt.includes('soft focus')) {
      settings.blur = '1';
    }
    
    if (lowerAnalysis.includes('warm') || lowerPrompt.includes('warm')) {
      settings.hue = '10';
      settings.saturation = '110';
    }
    
    if (lowerAnalysis.includes('cool') || lowerPrompt.includes('cool')) {
      settings.hue = '-10';
      settings.saturation = '90';
    }
    
    // Advanced effects based on AI analysis
    if (lowerAnalysis.includes('professional') || lowerPrompt.includes('professional')) {
      settings.contrast = '110';
      settings.sharpness = '1.1';
    }
    
    if (lowerAnalysis.includes('artistic') || lowerPrompt.includes('artistic')) {
      settings.saturation = '120';
      settings.contrast = '105';
    }
    
    return settings;
  }

  /**
   * Apply simulated edits to image (client-side processing)
   * @param {string} imageBase64 - Base64 image data
   * @param {Object} settings - Edit settings to apply
   * @returns {Promise<string>} - Edited image as base64
   */
  async applyImageEdits(imageBase64, settings) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match original image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply CSS filters for basic edits
        let filters = [];
        
        if (settings.brightness) {
          const brightness = parseFloat(settings.brightness) || 100;
          filters.push(`brightness(${brightness}%)`);
        }
        
        if (settings.contrast) {
          const contrast = parseFloat(settings.contrast) || 100;
          filters.push(`contrast(${contrast}%)`);
        }
        
        if (settings.saturation) {
          const saturation = parseFloat(settings.saturation) || 100;
          filters.push(`saturate(${saturation}%)`);
        }
        
        if (settings.blur) {
          const blur = parseFloat(settings.blur) || 0;
          filters.push(`blur(${blur}px)`);
        }
        
        if (settings.grayscale) {
          filters.push('grayscale(100%)');
        }
        
        if (settings.sepia) {
          filters.push('sepia(100%)');
        }
        
        if (settings.hue) {
          const hue = parseFloat(settings.hue) || 0;
          filters.push(`hue-rotate(${hue}deg)`);
        }
        
        ctx.filter = filters.join(' ');
        ctx.drawImage(img, 0, 0);
        
        // Convert back to base64 with high quality
        const editedBase64 = canvas.toDataURL('image/jpeg', 0.95);
        resolve(editedBase64);
      };
      
      img.src = imageBase64;
    });
  }

  /**
   * Download image with original quality
   * @param {string} imageBase64 - Base64 image data
   * @param {string} fileName - Download file name
   */
  downloadImage(imageBase64, fileName) {
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate image variations based on prompt
   * @param {File} imageFile - The source image file
   * @param {string} prompt - The variation prompt
   * @param {number} variations - Number of variations to generate
   * @returns {Promise<Array>} - Array of generated images
   */
  async generateVariations(imageFile, prompt, variations = 3) {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      const variationPrompt = `Create ${variations} variations of this image based on: ${prompt}. 
      Each variation should maintain the main subject but with different styles, compositions, or elements as described.`;

      const imagePart = {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: imageFile.type
        }
      };

      const result = await this.model.generateContent([variationPrompt, imagePart]);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error generating variations:', error);
      throw new Error('Failed to generate variations: ' + error.message);
    }
  }

  /**
   * Get image analysis and suggestions
   * @param {File} imageFile - The image file to analyze
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeImage(imageFile) {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      const analysisPrompt = `Analyze this image and provide:
      1. Main subject description
      2. Style and mood
      3. Color palette
      4. Composition analysis
      5. Suggested improvements or edits
      6. Potential editing prompts that would work well with this image`;

      const imagePart = {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: imageFile.type
        }
      };

      const result = await this.model.generateContent([analysisPrompt, imagePart]);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image: ' + error.message);
    }
  }

  /**
   * Convert file to base64
   * @param {File} file - The file to convert
   * @returns {Promise<string>} - Base64 string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate prompt for safety
   * @param {string} prompt - The prompt to validate
   * @returns {Promise<boolean>} - True if prompt is safe
   */
  async validatePrompt(prompt) {
    try {
      // Basic safety checks - only block clearly inappropriate content
      const blockedTerms = [
        'violent', 'harmful', 'illegal', 'adult', 'nude', 'naked',
        'weapon', 'blood', 'gore', 'explicit', 'sexual'
      ];
      
      const lowerPrompt = prompt.toLowerCase();
      const hasBlockedTerm = blockedTerms.some(term => lowerPrompt.includes(term));
      
      if (hasBlockedTerm) {
        return false;
      }
      
      // For image editing, most prompts are acceptable
      // Only block if clearly inappropriate
      return true;
    } catch (error) {
      console.error('Error validating prompt:', error);
      // If validation fails, allow the prompt (fail-safe)
      return true;
    }
  }
}

const googleAIServiceInstance = new GoogleAIService();

export default googleAIServiceInstance;
