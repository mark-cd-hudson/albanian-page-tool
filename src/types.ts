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
  selectedLanguage: string; // Selected language for vocab/stats filtering (default: "all")
  darkMode: boolean; // Dark mode preference (default: false)
}

// Vocabulary and Review System Types

export interface VocabContext {
  sentenceId: string; // Hash of sentenceText
  sentenceText: string;
  sentenceTranslation: string;
  meaning: string;
  pageId: string;
  seenAt: number;
}

export interface VocabWord {
  word: string; // lowercase
  language: string;
  addedAt: number;
  ignored: boolean;
  fsrsCard: any; // FSRS Card object (serialized)
  contexts: VocabContext[];
}

export interface ReviewSession {
  id: string;
  language: string;
  date: number;
  wordCount: number;
  duration: number; // in seconds
}

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  language: string;
  reviewCount: number;
  wordsAdded: number;
  wordsMastered: number; // New field
}

export interface WordReview {
  id: string; // unique ID
  word: string;
  language: string;
  rating: number; // FSRS Rating (1-4)
  date: number; // timestamp
  reviewedAt: string; // YYYY-MM-DD for indexing
}
