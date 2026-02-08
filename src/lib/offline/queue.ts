import { getDB } from './db';

export interface OfflineRequest {
    id?: number;
    type: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body: any;
    timestamp: number;
    retryCount: number;
    operationName: string;
}

export class OfflineQueue {
    static async enqueue(request: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<number> {
        const db = await getDB();
        const entry: OfflineRequest = {
            ...request,
            timestamp: Date.now(),
            retryCount: 0
        };
        const id = await db.add('mutation_queue', entry);
        return id as number;
    }

    static async peek(): Promise<OfflineRequest | undefined> {
        const db = await getDB();
        const cursor = await db.transaction('mutation_queue').store.openCursor(null, 'next');
        return cursor?.value;
    }

    static async getAll(): Promise<OfflineRequest[]> {
        const db = await getDB();
        return db.getAllFromIndex('mutation_queue', 'by-timestamp');
    }

    static async remove(id: number): Promise<void> {
        const db = await getDB();
        await db.delete('mutation_queue', id);
    }

    static async clear(): Promise<void> {
        const db = await getDB();
        await db.clear('mutation_queue');
    }

    static async getCount(): Promise<number> {
        const db = await getDB();
        return db.count('mutation_queue');
    }
}
