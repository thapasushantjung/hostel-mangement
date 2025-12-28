import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useOnlineStatus, usePendingSyncCount } from './use-offline';
import { syncService } from './sync-service';
import { offlineStore } from './offline-store';

interface OfflineContextType {
    isOnline: boolean;
    pendingSyncCount: number;
    isInitialized: boolean;
    lastSyncTime: string | null;
    syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

interface OfflineProviderProps {
    children: ReactNode;
    serverData?: Record<string, unknown>;
}

export function OfflineProvider({ children, serverData }: OfflineProviderProps) {
    const status = useOnlineStatus();
    const pendingSyncCount = usePendingSyncCount();
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

    // Initialize local database with server data on first load
    useEffect(() => {
        const init = async () => {
            // If we have server data (from Inertia), sync it to local DB
            if (serverData && Object.keys(serverData).length > 0) {
                await offlineStore.syncFromServer(serverData);
            }

            const syncTime = await offlineStore.getLastSyncTime();
            setLastSyncTime(syncTime || null);
            setIsInitialized(true);
        };

        init();
    }, [serverData]);

    // Start background sync
    useEffect(() => {
        syncService.startBackgroundSync();
    }, []);

    // When coming online, sync pending changes
    useEffect(() => {
        if (status === 'online' && isInitialized && pendingSyncCount > 0) {
            syncService.pushChanges();
        }
    }, [status, isInitialized, pendingSyncCount]);

    const syncNow = async () => {
        if (status === 'online') {
            await syncService.pushChanges();
            await syncService.fullSync();
            const syncTime = await offlineStore.getLastSyncTime();
            setLastSyncTime(syncTime || null);
        }
    };

    return (
        <OfflineContext.Provider
            value={{
                isOnline: status === 'online',
                pendingSyncCount,
                isInitialized,
                lastSyncTime,
                syncNow,
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
