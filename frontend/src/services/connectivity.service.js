import { useState, useEffect, useCallback, useRef } from 'react'

const PING_URL = import.meta.env.VITE_OFFLINE_PING_URL || '/ping'
const PING_INTERVAL = 15000 // 15 seconds

export const CONNECTIVITY_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  SYNCING: 'SYNCING',
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  SYNC_FAILED: 'SYNC_FAILED',
}

// Singleton event emitter for connectivity status
const listeners = new Set()
let currentStatus = navigator.onLine ? CONNECTIVITY_STATUS.ONLINE : CONNECTIVITY_STATUS.OFFLINE

export function onConnectivityChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setConnectivityStatus(status) {
  if (status !== currentStatus) {
    currentStatus = status
    listeners.forEach((fn) => fn(status))
  }
}

export function getConnectivityStatus() {
  return currentStatus
}

// Perform a real HTTP ping (not just navigator.onLine)
async function pingServer() {
  try {
    const res = await fetch(PING_URL, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(3000) })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

// Start the background connectivity watcher (call once at app root)
let pingTimer = null
export function startConnectivityWatcher(onOnline, onOffline) {
  const check = async () => {
    const isOnline = await pingServer()
    if (isOnline && currentStatus === CONNECTIVITY_STATUS.OFFLINE) {
      setConnectivityStatus(CONNECTIVITY_STATUS.ONLINE)
      onOnline?.()
    } else if (!isOnline && currentStatus !== CONNECTIVITY_STATUS.OFFLINE) {
      setConnectivityStatus(CONNECTIVITY_STATUS.OFFLINE)
      onOffline?.()
    }
  }

  window.addEventListener('online', check)
  window.addEventListener('offline', () => {
    setConnectivityStatus(CONNECTIVITY_STATUS.OFFLINE)
    onOffline?.()
  })

  pingTimer = setInterval(check, PING_INTERVAL)
  check() // Immediate check
  return () => {
    clearInterval(pingTimer)
    window.removeEventListener('online', check)
    window.removeEventListener('offline', check)
  }
}

// React hook
export function useConnectivity() {
  const [status, setStatus] = useState(currentStatus)

  useEffect(() => {
    const unsub = onConnectivityChange(setStatus)
    return unsub
  }, [])

  const isOnline = status === CONNECTIVITY_STATUS.ONLINE || status === CONNECTIVITY_STATUS.SYNC_COMPLETED
  const isSyncing = status === CONNECTIVITY_STATUS.SYNCING

  return { status, isOnline, isSyncing }
}
