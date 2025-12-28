import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOffline } from '@/lib/offline-context';
import { IconCloudOff, IconCloud, IconRefresh } from '@tabler/icons-react';

/**
 * Status indicator for offline mode and pending sync items
 */
export function OfflineIndicator() {
    const { isOnline, pendingSyncCount, syncNow, lastSyncTime } = useOffline();

    if (isOnline && pendingSyncCount === 0) {
        return null; // Don't show anything when online and synced
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            {!isOnline && (
                <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5">
                    <IconCloudOff className="h-4 w-4" />
                    Offline Mode
                </Badge>
            )}

            {pendingSyncCount > 0 && (
                <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800"
                >
                    <IconCloud className="h-4 w-4" />
                    {pendingSyncCount} pending
                    {isOnline && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1"
                            onClick={syncNow}
                        >
                            <IconRefresh className="h-3 w-3" />
                        </Button>
                    )}
                </Badge>
            )}
        </div>
    );
}
