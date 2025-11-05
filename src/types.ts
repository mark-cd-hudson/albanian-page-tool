export interface WordInfo {
  word: string;
  meaning: string;
  sentenceTranslation: string;
}

export interface Sentence {
  text: string;
  translation: string;
  words: Map<string, WordInfo>;
}

export interface Paragraph {
  sentences: Sentence[];
}

export interface PageData {
  id: string;
  imageDataUrl?: string; // Stored in IndexedDB
  paragraphs: Paragraph[];
  timestamp: number;
  originalText: string;
}

export interface AppSettings {
  apiKey: string;
}

