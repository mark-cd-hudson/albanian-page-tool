import { Migration } from './types';

export const v6_add_mastered_stats: Migration = {
  version: 6,
  description: 'Add wordsMastered field to daily stats',
  upgrade: (_db: IDBDatabase) => {
    console.log('Running migration v6: Add wordsMastered to daily stats');
    // No schema changes needed - just a new field
    // Existing records will have undefined, which we'll treat as 0
    console.log('  - Field wordsMastered will be added to new daily stats records');
  },
};

