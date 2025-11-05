export interface Migration {
  version: number;
  description: string;
  upgrade: (db: IDBDatabase, transaction: IDBTransaction) => void;
}

