import { useState, useEffect, useRef, useCallback } from 'react'
import { gameStateService } from '../services/data.service.js'

// Shared game state persistence hook
export function useGameStatePersistence(gameId, childId, initialState) {
  const [state, setState] = useState(initialState)
  const [restored, setRestored] = useState(false)
  const saveTimer = useRef(null)

  // Load saved state on mount
  useEffect(() => {
    if (!childId || !gameId) { setRestored(true); return }
    gameStateService.load(gameId, childId).then((saved) => {
      if (saved) setState(saved)
      setRestored(true)
    })
  }, [gameId, childId])

  // Save state function
  const saveState = useCallback((updater) => {
    setState((prevState) => {
      const newState = typeof updater === 'function' ? updater(prevState) : updater
      if (childId && gameId) {
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          gameStateService.save(gameId, childId, newState)
        }, 500)
      }
      return newState
    })
  }, [gameId, childId])

  // Save on visibility change (tab switch / minimize)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && childId && gameId) {
        gameStateService.save(gameId, childId, state)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearTimeout(saveTimer.current)
    }
  }, [state, gameId, childId])

  const clearState = useCallback(() => {
    setState(initialState)
    if (childId && gameId) gameStateService.clear(gameId, childId)
  }, [gameId, childId])

  return { state, saveState, restored, clearState }
}
