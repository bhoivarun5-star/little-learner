import { useConnectivity, CONNECTIVITY_STATUS } from '../services/connectivity.service.js'

const STATUS_CONFIG = {
  [CONNECTIVITY_STATUS.ONLINE]: { label: '● Online', cls: 'online' },
  [CONNECTIVITY_STATUS.OFFLINE]: { label: '⚠ Offline — progress saved on device', cls: 'offline' },
  [CONNECTIVITY_STATUS.SYNCING]: { label: '↻ Syncing…', cls: 'syncing' },
  [CONNECTIVITY_STATUS.SYNC_COMPLETED]: { label: '✓ Synced', cls: 'synced' },
  [CONNECTIVITY_STATUS.SYNC_FAILED]: { label: '⚡ Sync failed — will retry', cls: 'sync-failed' },
}

export default function ConnectivityBar() {
  return null
}
