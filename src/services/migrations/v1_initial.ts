import { Migration } from './types';

const PAGES_STORE = 'pages';
const SETTINGS_STORE = 'settings';

export const v1_initial: Migration = {
  version: 1,
  description: 'Initial database setup with pages and settings stores',
  upgrade: (db: IDBDatabase) => {
    console.log('Running migration v1: Initial setup');

    // Create pages store
    if (!db.objectStoreNames.contains(PAGES_STORE)) {
      const pageStore = db.createObjectStore(PAGES_STORE, { keyPath: 'id' });
      pageStore.createIndex('timestamp', 'timestamp', { unique: false });
      console.log('  - Created pages store with timestamp index');
    }

    // Create settings store
    if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
      db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      console.log('  - Created settings store');
    }
  }
};

