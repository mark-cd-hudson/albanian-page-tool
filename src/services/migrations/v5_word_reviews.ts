import { Migration } from './types';

export const v5_word_reviews: Migration = {
  version: 5,
  description: 'Add word reviews tracking',
  upgrade: (db: IDBDatabase) => {
    console.log('Running migration v5: Add word reviews tracking');

    if (!db.objectStoreNames.contains('wordReviews')) {
      const store = db.createObjectStore('wordReviews', { keyPath: 'id' });
      store.createIndex('word_language', ['word', 'language'], { unique: false });
      store.createIndex('date', 'date', { unique: false });
      store.createIndex('reviewedAt', 'reviewedAt', { unique: false });
      console.log('  - Created wordReviews store');
    } else {
      console.log('  - wordReviews store already exists');
    }
  },
};

