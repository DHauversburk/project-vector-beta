import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface VectorOfflineDB extends DBSchema {
    mutation_queue: {
        key: number; // Auto-increment ID
        value: {
            id?: number;
            type: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            url: string;
            body: any;
            timestamp: number;
            retryCount: number;
            operationName: string; // Friendly name for UI e.g. "Create Note"
        };
        indexes: { 'by-timestamp': number };
    };
    app_state: { // For storing general offline state/cache metadata if needed
        key: string;
        value: any;
    };
}

let dbPromise: Promise<IDBPDatabase<VectorOfflineDB>> | null = null;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<VectorOfflineDB>('project_vector_offline', 1, {
            upgrade(db) {
                // Mutation Queue Store
                if (!db.objectStoreNames.contains('mutation_queue')) {
                    const store = db.createObjectStore('mutation_queue', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by-timestamp', 'timestamp');
                }
                // App State Store
                if (!db.objectStoreNames.contains('app_state')) {
                    db.createObjectStore('app_state');
                }
            },
        });
    }
    return dbPromise;
};
