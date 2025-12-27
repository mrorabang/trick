import OpenAI from "openai";

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️ Missing REACT_APP_OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // ⚠️ chỉ dùng khi dev / demo
});

class OpenAIService {
  constructor() {
    this.imageModel = "dall-e-3";
    this.visionModel = "gpt-4o";
    this.editModel = "gpt-4o";
  }

  /* ===============================
   * IMAGE EDIT (INPAINT / EDIT)
   * =============================== */
  async editImage(imageFile, prompt, maskFile = null, size = "1024x1024")
 {
    if (!imageFile || !prompt) {
      throw new Error("imageFile and prompt are required");
    }

    try {
      const response = await openai.images.edit({
        model: this.imageModel,
        image: imageFile,
        mask: maskFile || undefined,
        prompt,
        size,
      });

      const base64 = response.data[0].b64_json;

      return {
        type: "edited_image",
        imageBase64: `data:image/png;base64,${base64}`,
        prompt,
        fileName: `edited_${Date.now()}.png`,
      };
    } catch (error) {
      console.error("❌ Image edit failed:", error);
      throw error;
    }
  }

  /* ===============================
   * IMAGE GENERATION
   * =============================== */
  async generateImage({ prompt, size = "1024x1024" }) {
    if (!prompt) throw new Error("prompt is required");

    try {
      const response = await openai.images.generate({
        model: this.imageModel,
        prompt,
        size,
      });

      const base64 = response.data[0].b64_json;

      return {
        type: "generated_image",
        imageBase64: `data:image/png;base64,${base64}`,
        prompt,
        fileName: `generated_${Date.now()}.png`,
      };
    } catch (error) {
      console.error("❌ Image generation failed:", error);
      throw error;
    }
  }

  /* ===============================
   * IMAGE ANALYSIS / OCR / SUGGESTION
   * =============================== */
  async analyzeImage({ imageFile, prompt = "Describe this image" }) {
    if (!imageFile) throw new Error("imageFile is required");

    const base64Image = await this.fileToBase64(imageFile);

    try {
      const response = await openai.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: base64Image },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("❌ Image analysis failed:", error);
      throw error;
    }
  }

  /* ===============================
   * UTILITIES
   * =============================== */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  validatePrompt(prompt) {
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
      return true;
    } catch (error) {
      console.error('Error validating prompt:', error);
      return true; // Fail-safe
    }
  }

  downloadBase64Image(base64, fileName) {
    const a = document.createElement("a");
    a.href = base64;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

const openAIService = new OpenAIService();
export default openAIService;
