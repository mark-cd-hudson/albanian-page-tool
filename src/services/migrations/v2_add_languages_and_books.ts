import { Migration } from './types';

const PAGES_STORE = 'pages';
const BOOKS_STORE = 'books';

export const v2_add_languages_and_books: Migration = {
  version: 2,
  description: 'Add language support, books store, and additional page indexes',
  upgrade: (db: IDBDatabase, transaction: IDBTransaction) => {
    console.log('Running migration v2: Add languages and books');

    // Upgrade pages store with new indexes
    if (db.objectStoreNames.contains(PAGES_STORE)) {
      const pageStore = transaction.objectStore(PAGES_STORE);
      
      if (!pageStore.indexNames.contains('language')) {
        pageStore.createIndex('language', 'language', { unique: false });
        console.log('  - Added language index to pages store');
      }
      
      if (!pageStore.indexNames.contains('bookId')) {
        pageStore.createIndex('bookId', 'bookId', { unique: false });
        console.log('  - Added bookId index to pages store');
      }
    }

    // Create books store
    if (!db.objectStoreNames.contains(BOOKS_STORE)) {
      const bookStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      bookStore.createIndex('language', 'language', { unique: false });
      bookStore.createIndex('createdAt', 'createdAt', { unique: false });
      console.log('  - Created books store with language and createdAt indexes');
    }
  }
};

