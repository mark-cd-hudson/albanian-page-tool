import { Migration } from './types';
import { v1_initial } from './v1_initial';
import { v2_add_languages_and_books } from './v2_add_languages_and_books';
import { v3_recovery } from './v3_recovery';
import { v4_vocab_system } from './v4_vocab_system';
import { v5_word_reviews } from './v5_word_reviews';
import { v6_add_mastered_stats } from './v6_add_mastered_stats';

// All migrations in order
export const migrations: Migration[] = [
  v1_initial,
  v2_add_languages_and_books,
  v3_recovery,
  v4_vocab_system,
  v5_word_reviews,
  v6_add_mastered_stats,
];

// Current database version (should match the last migration version)
export const CURRENT_DB_VERSION = migrations[migrations.length - 1].version;

// Apply migrations sequentially from oldVersion to newVersion
export function applyMigrations(
  db: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number,
  newVersion: number
): void {
  console.log(`Applying migrations from version ${oldVersion} to ${newVersion}`);

  // Apply each migration that's between oldVersion and newVersion
  for (const migration of migrations) {
    if (migration.version > oldVersion && migration.version <= newVersion) {
      console.log(`Applying migration ${migration.version}: ${migration.description}`);
      migration.upgrade(db, transaction);
    }
  }

  console.log('All migrations completed successfully');
}

