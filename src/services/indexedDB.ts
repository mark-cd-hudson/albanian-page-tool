import { PageData, AppSettings, Book } from '../types';
import { applyMigrations, CURRENT_DB_VERSION } from './migrations';

const DB_NAME = 'LanguagePageTool';
const DB_VERSION = CURRENT_DB_VERSION;
const PAGES_STORE = 'pages';
const SETTINGS_STORE = 'settings';
const BOOKS_STORE = 'books';

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
}

export const indexedDBService = new IndexedDBService();

