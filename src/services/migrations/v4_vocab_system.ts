import { Migration } from './types';

export const v4_vocab_system: Migration = {
  version: 4,
  description: 'Add vocabulary tracking and review system',
  upgrade: (db: IDBDatabase) => {
    console.log('Running migration v4: Add vocabulary tracking and review system');

    // Create vocab store with composite key (word_language)
    if (!db.objectStoreNames.contains('vocab')) {
      const vocabStore = db.createObjectStore('vocab', { keyPath: 'word_language' });
      vocabStore.createIndex('language', 'language', { unique: false });
      vocabStore.createIndex('addedAt', 'addedAt', { unique: false });
      vocabStore.createIndex('ignored', 'ignored', { unique: false });
      console.log('  - Created vocab store with indexes');
    }

    // Create reviewSessions store
    if (!db.objectStoreNames.contains('reviewSessions')) {
      const reviewStore = db.createObjectStore('reviewSessions', { keyPath: 'id' });
      reviewStore.createIndex('language', 'language', { unique: false });
      reviewStore.createIndex('date', 'date', { unique: false });
      console.log('  - Created reviewSessions store with indexes');
    }

    // Create dailyStats store with composite key (date_language)
    if (!db.objectStoreNames.contains('dailyStats')) {
      const statsStore = db.createObjectStore('dailyStats', { keyPath: 'date_language' });
      statsStore.createIndex('date', 'date', { unique: false });
      statsStore.createIndex('language', 'language', { unique: false });
      console.log('  - Created dailyStats store with indexes');
    }
  },
};

