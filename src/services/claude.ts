import Anthropic from '@anthropic-ai/sdk';
import { Sentence, WordInfo, Paragraph } from '../types';

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Note: For production, use a backend proxy
    });
  }

  async extractParagraphs(imageDataUrl: string): Promise<string[]> {
    // Convert data URL to base64
    const base64Data = imageDataUrl.split(',')[1];
    const mediaType = imageDataUrl.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    // Use Sonnet 4.5 for vision tasks (required for image processing)
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Extract all text from this image. Preserve the paragraph structure - return each paragraph separated by two newlines (\\n\\n). Within each paragraph, keep all the text together. Only return the extracted text, nothing else.'
            }
          ],
        },
      ],
    });

    const textContent = message.content[0];
    if (textContent.type === 'text') {
      return textContent.text
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }
    
    return [];
  }

  async splitIntoSentences(paragraphText: string, language: string): Promise<string[]> {
    // Use Haiku 4.5 for text-only tasks (faster and more cost-effective)
    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Split this ${language} text into individual sentences. Return each sentence on a new line. Only return the sentences, nothing else.

Text: "${paragraphText}"`
        }
      ]
    });

    const textContent = message.content[0];
    if (textContent.type === 'text') {
      return textContent.text
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    return [paragraphText]; // Fallback to treating whole paragraph as one sentence
  }

  async translateSentenceAndWords(sentence: string, sourceLanguage: string, targetLanguage: string): Promise<Sentence> {
    // Use Haiku 4.5 for text-only tasks (faster and more cost-effective)
    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Translate this ${sourceLanguage} sentence to ${targetLanguage} and provide the meaning of each word in context.

Sentence: "${sentence}"

Return a JSON object with this structure:
{
  "translation": "${targetLanguage} translation of the full sentence",
  "words": [
    {
      "word": "${sourceLanguage} word",
      "meaning": "meaning in this context in ${targetLanguage}"
    }
  ]
}`
        },
        {
          role: 'assistant',
          content: '{'
        }
      ]
    });

    const textContent = message.content[0];
    if (textContent.type === 'text') {
      try {
        // Prepend the opening brace from prefill
        const jsonText = '{' + textContent.text;
        const data = JSON.parse(jsonText);
        
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
        console.error('Response text:', textContent.text);
      }
    }

    // Fallback
    return {
      text: sentence,
      translation: 'Translation unavailable',
      words: new Map()
    };
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

