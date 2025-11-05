# Database Migrations

This directory contains all IndexedDB schema migrations for the Language Learning Tool.

## How It Works

Each migration is a separate file that defines schema changes for a specific version. Migrations are applied sequentially from the user's current database version to the latest version.

## Migration Structure

Each migration file follows this pattern:

```typescript
import { Migration } from './types';

export const v{N}_{description}: Migration = {
  version: N,
  description: 'Human-readable description',
  upgrade: (db: IDBDatabase, transaction: IDBTransaction) => {
    // Schema changes here
  }
};
```

## Existing Migrations

- **v1_initial.ts** - Initial database setup with pages and settings stores
- **v2_add_languages_and_books.ts** - Add language support, books store, and page indexes

## Adding a New Migration

1. **Create a new migration file**: `v{N}_{short_description}.ts`

   ```typescript
   import { Migration } from "./types";

   export const v3_add_tags: Migration = {
     version: 3,
     description: "Add tags support to pages",
     upgrade: (db: IDBDatabase, transaction: IDBTransaction) => {
       // Add your schema changes here
       const pageStore = transaction.objectStore("pages");
       pageStore.createIndex("tags", "tags", {
         unique: false,
         multiEntry: true,
       });
     },
   };
   ```

2. **Import it in `index.ts`**:

   ```typescript
   import { v3_add_tags } from "./v3_add_tags";

   export const migrations: Migration[] = [
     v1_initial,
     v2_add_languages_and_books,
     v3_add_tags, // Add your new migration
   ];
   ```

3. **That's it!** The migration system will automatically:
   - Detect the new version
   - Apply migrations sequentially
   - Update `CURRENT_DB_VERSION`

## Migration Best Practices

### ✅ DO:

- Create a new migration file for each schema change
- Keep migrations focused and descriptive
- Test migrations with different starting versions
- Check if stores/indexes exist before creating them
- Log what each migration does

### ❌ DON'T:

- Modify existing migration files (they may have already run)
- Skip version numbers
- Make data migrations without schema changes (document separately)
- Delete old migration files

## Testing Migrations

To test your migration:

1. **Test from scratch**: Clear IndexedDB and reload
2. **Test incremental**: Test upgrading from each previous version
3. **Check console**: Verify migration logs appear correctly

### Clear Database for Testing

```javascript
// In DevTools Console
indexedDB.deleteDatabase("LanguagePageTool");
location.reload();
```

## Debugging

If a migration fails:

1. Check the console for error messages
2. Verify store names match constants
3. Ensure transaction is used for store operations
4. Check if the migration has already partially applied

## Migration Rollback

⚠️ IndexedDB doesn't support automatic rollback. If a migration fails:

1. The database may be in an inconsistent state
2. Users may need to clear their database
3. Always test thoroughly before releasing

## Example: Complete Migration Flow

When a user with v1 loads the app with v3:

```
User DB Version: 1
App DB Version: 3

Applying migrations:
  ✓ v2_add_languages_and_books (v1 → v2)
  ✓ v3_add_tags (v2 → v3)

Database now at v3!
```

## Common Migration Patterns

### Add a new store:

```typescript
if (!db.objectStoreNames.contains("newStore")) {
  const store = db.createObjectStore("newStore", { keyPath: "id" });
  store.createIndex("timestamp", "timestamp", { unique: false });
}
```

### Add an index to existing store:

```typescript
const store = transaction.objectStore("pages");
if (!store.indexNames.contains("newIndex")) {
  store.createIndex("newIndex", "fieldName", { unique: false });
}
```

### Modify data (rare):

```typescript
const store = transaction.objectStore("pages");
const request = store.openCursor();

request.onsuccess = () => {
  const cursor = request.result;
  if (cursor) {
    const page = cursor.value;
    page.newField = "defaultValue";
    cursor.update(page);
    cursor.continue();
  }
};
```
