import { syncPendingRecords } from '@/services/pending-sync.service';
import { pullRemoteRecords } from '@/services/remote-sync.service';

let cloudSyncPromise: Promise<void> | null = null;
let lastCloudSyncStartedAt = 0;

const CLOUD_SYNC_THROTTLE_MS = 15000;

export function syncCloudRecordsAfterActivation() {
  const now = Date.now();

  if (cloudSyncPromise) {
    return cloudSyncPromise;
  }

  if (now - lastCloudSyncStartedAt < CLOUD_SYNC_THROTTLE_MS) {
    return Promise.resolve();
  }

  lastCloudSyncStartedAt = now;
  cloudSyncPromise = Promise.allSettled([
    syncPendingRecords(),
    pullRemoteRecords(),
  ])
    .then(() => undefined)
    .finally(() => {
      cloudSyncPromise = null;
    });

  return cloudSyncPromise;
}
