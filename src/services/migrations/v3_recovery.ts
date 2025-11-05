import { Migration } from './types';

export const v3_recovery: Migration = {
  version: 3,
  description: 'Recovery migration to ensure books store exists',
  upgrade: (db: IDBDatabase, transaction: IDBTransaction) => {
    console.log('Running migration v3: Recovery migration');

    // Ensure books store exists (in case v2 migration didn't run for some users)
    if (!db.objectStoreNames.contains('books')) {
      console.log('  - Books store missing, creating it now...');
      const bookStore = db.createObjectStore('books', { keyPath: 'id' });
      bookStore.createIndex('language', 'language', { unique: false });
      bookStore.createIndex('createdAt', 'createdAt', { unique: false });
      console.log('  - Created books store with indexes');
    } else {
      console.log('  - Books store already exists, nothing to do');
    }

    // Ensure pages store has required indexes
    if (transaction.objectStore('pages')) {
      const pageStore = transaction.objectStore('pages');
      
      if (!pageStore.indexNames.contains('language')) {
        pageStore.createIndex('language', 'language', { unique: false });
        console.log('  - Added language index to pages store');
      }
      
      if (!pageStore.indexNames.contains('bookId')) {
        pageStore.createIndex('bookId', 'bookId', { unique: false });
        console.log('  - Added bookId index to pages store');
      }
    }
  },
};

