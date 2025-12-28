import { useState, useEffect, useCallback } from 'react';

export type ConnectionStatus = 'online' | 'offline';

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): ConnectionStatus {
    const [status, setStatus] = useState<ConnectionStatus>(
        typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
    );

    useEffect(() => {
        const handleOnline = () => setStatus('online');
        const handleOffline = () => setStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return status;
}

/**
 * Hook to get pending sync count
 */
export function usePendingSyncCount(): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const updateCount = async () => {
            const { db } = await import('./db');
            const pendingCount = await db.syncQueue.count();
            setCount(pendingCount);
        };

        updateCount();

        // Update every 5 seconds
        const interval = setInterval(updateCount, 5000);
        return () => clearInterval(interval);
    }, []);

    return count;
}
