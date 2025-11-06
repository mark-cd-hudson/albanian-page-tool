import { PageData, AppSettings, Book, VocabWord, VocabContext, ReviewSession, DailyStats, WordReview } from '../types';
import { applyMigrations, CURRENT_DB_VERSION } from './migrations';

const DB_NAME = 'LanguagePageTool';
const DB_VERSION = CURRENT_DB_VERSION;
const PAGES_STORE = 'pages';
const SETTINGS_STORE = 'settings';
const BOOKS_STORE = 'books';
const VOCAB_STORE = 'vocab';
const REVIEW_SESSIONS_STORE = 'reviewSessions';
const DAILY_STATS_STORE = 'dailyStats';
const WORD_REVIEWS_STORE = 'wordReviews';

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || DB_VERSION;

        console.log('='.repeat(60));
        console.log(`Database upgrade needed: v${oldVersion} → v${newVersion}`);
        console.log('='.repeat(60));

        // Apply all necessary migrations in order
        applyMigrations(db, transaction, oldVersion, newVersion);

        console.log('='.repeat(60));
        console.log('Database upgrade complete!');
        console.log('='.repeat(60));
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  // Settings
  async getSettings(): Promise<AppSettings | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('app_settings');

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key: 'app_settings', value: settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Pages
  async getPages(): Promise<PageData[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PAGES_STORE], 'readonly');
      const store = transaction.objectStore(PAGES_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Sort by timestamp descending

      const pages: PageData[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const page = cursor.value;
          // Convert words back to Map
          page.paragraphs = page.paragraphs.map((paragraph: any) => ({
            sentences: paragraph.sentences.map((sentence: any) => ({
              ...sentence,
              words: new Map(Object.entries(sentence.words || {}))
            }))
          }));
          pages.push(page);
          cursor.continue();
        } else {
          resolve(pages);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePage(page: PageData): Promise<void> {
    const db = await this.ensureDB();
    
    // Convert Maps to objects for storage
    const serializedPage = {
      ...page,
      paragraphs: page.paragraphs.map(para => ({
        sentences: para.sentences.map(s => ({
          ...s,
          words: Object.fromEntries(s.words)
        }))
      }))
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PAGES_STORE], 'readwrite');
      const store = transaction.objectStore(PAGES_STORE);
      const request = store.put(serializedPage);

      request.onsuccess = () => {
        // Clean up old pages (keep only 50 most recent)
        this.cleanupOldPages(50).then(() => resolve()).catch(() => resolve());
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPage(id: string): Promise<PageData | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PAGES_STORE], 'readonly');
      const store = transaction.objectStore(PAGES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          const page = request.result;
          // Convert words back to Map
          page.paragraphs = page.paragraphs.map((paragraph: any) => ({
            sentences: paragraph.sentences.map((sentence: any) => ({
              ...sentence,
              words: new Map(Object.entries(sentence.words || {}))
            }))
          }));
          resolve(page);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deletePage(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PAGES_STORE], 'readwrite');
      const store = transaction.objectStore(PAGES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async cleanupOldPages(keepCount: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PAGES_STORE], 'readwrite');
      const store = transaction.objectStore(PAGES_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      let count = 0;
      const idsToDelete: string[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          count++;
          if (count > keepCount) {
            idsToDelete.push(cursor.value.id);
          }
          cursor.continue();
        } else {
          // Delete old pages
          idsToDelete.forEach(id => store.delete(id));
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Books
  async getBooks(): Promise<Book[]> {
    try {
      const db = await this.ensureDB();
      
      // Check if books store exists
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        console.warn('Books store not found, returning empty array');
        return [];
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BOOKS_STORE], 'readonly');
        const store = transaction.objectStore(BOOKS_STORE);
        const index = store.index('createdAt');
        const request = index.openCursor(null, 'prev');

        const books: Book[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            books.push(cursor.value);
            cursor.continue();
          } else {
            resolve(books);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  }

  async saveBook(book: Book): Promise<void> {
    const db = await this.ensureDB();
    
    // Check if books store exists
    if (!db.objectStoreNames.contains(BOOKS_STORE)) {
      console.error('Books store not found. Database version:', db.version, 'Expected:', DB_VERSION);
      throw new Error('DATABASE_UPGRADE_NEEDED');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BOOKS_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.put(book);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getBook(id: string): Promise<Book | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BOOKS_STORE], 'readonly');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBook(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BOOKS_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Vocabulary Methods

  async addVocabWord(word: string, language: string, context: VocabContext, fsrsCard: any): Promise<void> {
    const db = await this.ensureDB();
    const key = `${word.toLowerCase()}_${language}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VOCAB_STORE, DAILY_STATS_STORE], 'readwrite');
      const vocabStore = transaction.objectStore(VOCAB_STORE);
      const getRequest = vocabStore.get(key);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        let vocabWord: VocabWord & { word_language: string };
        let isNew = false;

        if (existing) {
          // Update existing word with new context (deduplicate by sentenceId)
          const contextExists = existing.contexts.some(
            (c: VocabContext) => c.sentenceId === context.sentenceId
          );
          
          vocabWord = {
            ...existing,
            contexts: contextExists 
              ? existing.contexts 
              : [...existing.contexts, context],
          };
        } else {
          // Create new word
          isNew = true;
          vocabWord = {
            word: word.toLowerCase(),
            language,
            addedAt: Date.now(),
            ignored: false,
            fsrsCard,
            contexts: [context],
            word_language: key,
          };
        }

        const putRequest = vocabStore.put(vocabWord);
        
        putRequest.onsuccess = async () => {
          // Update daily stats if this is a new word
          if (isNew) {
            await this.updateDailyStats(language, 'wordsAdded', 1);
          }
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getVocabWords(language?: string, includeIgnored: boolean = true): Promise<VocabWord[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VOCAB_STORE], 'readonly');
      const store = transaction.objectStore(VOCAB_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let words = request.result as VocabWord[];
        
        // Filter by language if specified
        if (language && language !== 'all') {
          words = words.filter(w => w.language === language);
        }
        
        // Filter by ignored status
        if (!includeIgnored) {
          words = words.filter(w => !w.ignored);
        }
        
        resolve(words);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateVocabCard(word: string, language: string, fsrsCard: any): Promise<void> {
    const db = await this.ensureDB();
    const key = `${word.toLowerCase()}_${language}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VOCAB_STORE], 'readwrite');
      const store = transaction.objectStore(VOCAB_STORE);
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          existing.fsrsCard = fsrsCard;
          const putRequest = store.put(existing);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Vocab word not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async toggleIgnoreWord(word: string, language: string): Promise<void> {
    const db = await this.ensureDB();
    const key = `${word.toLowerCase()}_${language}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VOCAB_STORE], 'readwrite');
      const store = transaction.objectStore(VOCAB_STORE);
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          existing.ignored = !existing.ignored;
          const putRequest = store.put(existing);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Vocab word not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getWordsDueForReview(language?: string): Promise<VocabWord[]> {
    const words = await this.getVocabWords(language, false); // Don't include ignored
    const now = Date.now();
    
    return words.filter(word => {
      if (!word.fsrsCard || !word.fsrsCard.due) return false;
      const dueDate = new Date(word.fsrsCard.due).getTime();
      return dueDate <= now;
    });
  }

  async saveReviewSession(session: ReviewSession): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REVIEW_SESSIONS_STORE, DAILY_STATS_STORE], 'readwrite');
      const store = transaction.objectStore(REVIEW_SESSIONS_STORE);
      const request = store.put(session);

      request.onsuccess = async () => {
        // Update daily stats
        await this.updateDailyStats(session.language, 'reviewCount', session.wordCount);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getDailyStats(language?: string, dateRange?: { start: string; end: string }): Promise<DailyStats[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_STATS_STORE], 'readonly');
      const store = transaction.objectStore(DAILY_STATS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let stats = request.result as DailyStats[];
        
        // Filter by language
        if (language && language !== 'all') {
          stats = stats.filter(s => s.language === language);
        }
        
        // Filter by date range
        if (dateRange) {
          stats = stats.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);
        }
        
        resolve(stats);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getStreak(language?: string): Promise<number> {
    const stats = await this.getDailyStats(language);
    if (stats.length === 0) return 0;

    // Sort by date descending
    stats.sort((a, b) => b.date.localeCompare(a.date));

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    let streak = 0;
    let currentDate = new Date(today);

    for (const stat of stats) {
      const statDate = stat.date;
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (statDate === expectedDate && stat.reviewCount > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (statDate < expectedDate) {
        // Gap in streak
        break;
      }
    }

    return streak;
  }

  private async updateDailyStats(language: string, field: 'reviewCount' | 'wordsAdded', increment: number): Promise<void> {
    const db = await this.ensureDB();
    const date = new Date().toISOString().split('T')[0];
    const key = `${date}_${language}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_STATS_STORE], 'readwrite');
      const store = transaction.objectStore(DAILY_STATS_STORE);
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        let stats = getRequest.result;
        
        if (!stats) {
          stats = {
            date,
            language,
            reviewCount: 0,
            wordsAdded: 0,
            date_language: key,
          };
        }
        
        stats[field] += increment;
        
        const putRequest = store.put(stats);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Word Review Methods

  async saveWordReview(review: WordReview): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([WORD_REVIEWS_STORE, DAILY_STATS_STORE], 'readwrite');
      const store = transaction.objectStore(WORD_REVIEWS_STORE);
      const request = store.add(review);
      
      request.onsuccess = async () => {
        // Update daily stats
        await this.updateDailyStats(review.language, 'reviewCount', 1);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getWordReviews(language?: string, limit?: number): Promise<WordReview[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([WORD_REVIEWS_STORE], 'readonly');
      const store = transaction.objectStore(WORD_REVIEWS_STORE);
      const index = store.index('date');
      const request = index.openCursor(null, 'prev'); // Most recent first
      
      const reviews: WordReview[] = [];
      let count = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && (!limit || count < limit)) {
          const review = cursor.value;
          if (!language || language === 'all' || review.language === language) {
            reviews.push(review);
            count++;
          }
          cursor.continue();
        } else {
          resolve(reviews);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Data Management Methods

  async exportAllData(): Promise<string> {
    const data: Record<string, any[]> = {
      pages: [],
      settings: [],
      books: [],
      vocab: [],
      reviewSessions: [],
      dailyStats: [],
      wordReviews: [],
    };

    const storeNames = [
      PAGES_STORE,
      SETTINGS_STORE,
      BOOKS_STORE,
      VOCAB_STORE,
      REVIEW_SESSIONS_STORE,
      DAILY_STATS_STORE,
      WORD_REVIEWS_STORE,
    ];

    for (const storeName of storeNames) {
      const storeData = await this.getAllFromStore(storeName);
      data[storeName] = storeData;
    }

    // Add metadata
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      dbVersion: DB_VERSION,
      data,
    };

    return JSON.stringify(exportData, null, 2);
  }

  private async getAllFromStore(storeName: string): Promise<any[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async importAllData(jsonData: string): Promise<void> {
    let importData;
    try {
      importData = JSON.parse(jsonData);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    if (!importData.data) {
      throw new Error('Invalid export format');
    }

    const storeNames = [
      PAGES_STORE,
      SETTINGS_STORE,
      BOOKS_STORE,
      VOCAB_STORE,
      REVIEW_SESSIONS_STORE,
      DAILY_STATS_STORE,
      WORD_REVIEWS_STORE,
    ];

    // Import data for each store
    for (const storeName of storeNames) {
      const storeData = importData.data[storeName] || [];
      if (storeData.length > 0) {
        await this.importToStore(storeName, storeData);
      } else {
        // Clear store if no data to import
        await this.clearStore(storeName);
      }
    }
  }

  private async importToStore(storeName: string, data: any[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing data first
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add all imported data
        let completed = 0;
        const total = data.length;
        
        if (total === 0) {
          resolve();
          return;
        }
        
        for (const item of data) {
          // Handle special deserialization for pages (Map conversion)
          let processedItem = item;
          if (storeName === PAGES_STORE && item.paragraphs) {
            processedItem = this.deserializePageData(item);
          }
          
          const addRequest = store.add(processedItem);
          
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };
          
          addRequest.onerror = () => {
            console.error(`Error importing item to ${storeName}:`, addRequest.error);
            completed++;
            if (completed === total) {
              resolve();
            }
          };
        }
      };
      
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private deserializePageData(pageData: any): any {
    // Convert serialized Map back to Map for words
    const paragraphs = pageData.paragraphs.map((para: any) => ({
      sentences: para.sentences.map((sent: any) => ({
        ...sent,
        words: new Map(Object.entries(sent.words || {})),
      })),
    }));
    
    return {
      ...pageData,
      paragraphs,
    };
  }

  async deleteAllData(): Promise<void> {
    const db = await this.ensureDB();
    
    const storeNames = [
      PAGES_STORE,
      SETTINGS_STORE,
      BOOKS_STORE,
      VOCAB_STORE,
      REVIEW_SESSIONS_STORE,
      DAILY_STATS_STORE,
      WORD_REVIEWS_STORE,
    ];

    return new Promise((resolve) => {
      const transaction = db.transaction(storeNames, 'readwrite');
      let completed = 0;
      const total = storeNames.length;
      
      for (const storeName of storeNames) {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        request.onerror = () => {
          console.error(`Error clearing ${storeName}:`, request.error);
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      }
    });
  }
}

export const indexedDBService = new IndexedDBService();

