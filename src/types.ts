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

export interface Book {
  id: string;
  title: string;
  author?: string;
  coverImageUrl?: string;
  language: string;
  createdAt: number;
}

export interface PageData {
  id: string;
  imageDataUrl?: string; // Stored in IndexedDB
  paragraphs: Paragraph[];
  timestamp: number;
  originalText: string;
  language: string; // Source language of the page
  bookId?: string; // Optional reference to a book
  pageNumber?: number; // Optional page number in the book
}

export interface AppSettings {
  apiKey: string;
  nativeLanguage: string; // Target language for translations (default: English)
  recentLanguages: string[]; // Recently used source languages
}

