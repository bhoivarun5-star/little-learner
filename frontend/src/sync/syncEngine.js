import db from '../db/index.js'
import api from '../api/client.js'
import { setConnectivityStatus, CONNECTIVITY_STATUS } from '../services/connectivity.service.js'

const MAX_RETRIES = 5
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

export const syncEngine = {
  async push() {
    const pending = await db.syncQueue
      .where('status').anyOf(['PENDING', 'FAILED'])
      .and((item) => item.retryCount < MAX_RETRIES)
      .sortBy('createdAt')

    if (pending.length === 0) return { synced: 0, failed: 0 }

    setConnectivityStatus(CONNECTIVITY_STATUS.SYNCING)

    const operations = pending.map((item) => ({
      operation: item.operation,
      entity_type: item.entityType,
      local_id: String(item.localId),
      payload: item.payload,
    }))

    try {
      const res = await api.post('/sync/push/', { operations })
      const results = res.data.results || []

      let synced = 0, failed = 0
      for (const result of results) {
        const queueItem = pending.find((p) => String(p.localId) === result.local_id)
        if (!queueItem) continue

        if (result.status === 'synced') {
          await db.syncQueue.update(queueItem.id, {
            status: 'SYNCED',
            serverId: result.server_id,
          })
          synced++
        } else {
          const newRetry = (queueItem.retryCount || 0) + 1
          await db.syncQueue.update(queueItem.id, {
            status: newRetry >= MAX_RETRIES ? 'FAILED_PERMANENT' : 'FAILED',
            retryCount: newRetry,
            lastError: result.error || 'Unknown error',
          })
          failed++
        }
      }

      setConnectivityStatus(
        failed > 0 ? CONNECTIVITY_STATUS.SYNC_FAILED : CONNECTIVITY_STATUS.SYNC_COMPLETED
      )
      setTimeout(() => setConnectivityStatus(CONNECTIVITY_STATUS.ONLINE), 3000)
      return { synced, failed }
    } catch (err) {
      // Network failed during sync - mark all as pending for retry
      for (const item of pending) {
        await db.syncQueue.update(item.id, {
          status: 'PENDING',
          retryCount: (item.retryCount || 0) + 1,
        })
      }
      setConnectivityStatus(CONNECTIVITY_STATUS.SYNC_FAILED)
      setTimeout(() => setConnectivityStatus(CONNECTIVITY_STATUS.OFFLINE), 3000)
      throw err
    }
  },

  async enqueue(operation, entityType, localId, payload) {
    await db.syncQueue.add({
      operation,
      entityType,
      localId: String(localId),
      serverId: null,
      payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    })
  },

  async getPendingCount() {
    return db.syncQueue.where('status').anyOf(['PENDING', 'FAILED']).count()
  },

  async clearSynced() {
    await db.syncQueue.where('status').equals('SYNCED').delete()
  },
}

export default syncEngine
