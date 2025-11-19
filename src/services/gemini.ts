import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Sentence, WordInfo, Paragraph } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelName: string = 'gemini-3-pro-preview';

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractParagraphs(imageDataUrl: string, language: string): Promise<string[]> {
    // Convert data URL to base64 (remove header)
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1];

    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Extract all text from this image. The text is in ${language}.

Please carefully read the text and verify that the extracted words make sense in ${language}. First think of a transcription of the text, next analyze the transcription for errors. For example incorrect characters that don't fit the language, misspellings, incorrect joining of words, etc. If you notice any obvious OCR errors or character misrecognitions, correct them based on the context and what would be valid ${language} words.

Preserve the paragraph structure - return each paragraph separated by two newlines (\\n\\n). Within each paragraph, keep all the text together.

Only return the extracted text, nothing else.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    return text
      .split('\n\n')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);
  }

  async splitIntoSentences(paragraphText: string, language: string): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Split this ${language} text into individual sentences. Return each sentence on a new line. Only return the sentences, nothing else.

Text: "${paragraphText}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async translateSentenceAndWords(sentence: string, sourceLanguage: string, targetLanguage: string): Promise<Sentence> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            translation: { type: SchemaType.STRING },
            words: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  word: { type: SchemaType.STRING },
                  meaning: { type: SchemaType.STRING }
                },
                required: ["word", "meaning"]
              }
            }
          },
          required: ["translation", "words"]
        }
      }
    });

    const prompt = `Translate this ${sourceLanguage} sentence to ${targetLanguage} and provide the meaning of each word in context.

Sentence: "${sentence}"`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const data = JSON.parse(response.text());

      const words = new Map<string, WordInfo>();
      if (data.words && Array.isArray(data.words)) {
        data.words.forEach((w: { word: string; meaning: string }) => {
          if (w.word && w.meaning) {
            words.set(w.word.toLowerCase(), {
              word: w.word,
              meaning: w.meaning,
              sentenceTranslation: data.translation
            });
          }
        });
      }

      return {
        text: sentence,
        translation: data.translation || 'Translation unavailable',
        words
      };
    } catch (error) {
      console.error('Failed to parse translation response:', error);
      
      // Fallback
      return {
        text: sentence,
        translation: 'Translation unavailable',
        words: new Map()
      };
    }
  }

  async processParagraphsConcurrently(paragraphTexts: string[], sourceLanguage: string, targetLanguage: string): Promise<Paragraph[]> {
    const paragraphPromises = paragraphTexts.map(async (paragraphText) => {
      // Split paragraph into sentences
      const sentenceTexts = await this.splitIntoSentences(paragraphText, sourceLanguage);
      
      // Process all sentences in this paragraph concurrently
      const sentencePromises = sentenceTexts.map(sentenceText => 
        this.translateSentenceAndWords(sentenceText, sourceLanguage, targetLanguage)
      );
      
      const sentences = await Promise.all(sentencePromises);
      
      return {
        sentences
      };
    });
    
    return Promise.all(paragraphPromises);
  }
}

