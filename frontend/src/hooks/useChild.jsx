import { useState, useEffect, createContext, useContext } from 'react'
import db from '../db/index.js'

const ChildContext = createContext(null)

export function ChildProvider({ children }) {
  const [activeChild, setActiveChild] = useState(null)
  const [loadingChild, setLoadingChild] = useState(true)

  useEffect(() => {
    // Restore active child from settings
    db.settings.get('activeChildId').then(async (row) => {
      if (row?.value) {
        const child = await db.childProfiles.get(row.value)
        if (child) setActiveChild(child)
      }
      setLoadingChild(false)
    })
  }, [])

  const selectChild = async (child) => {
    setActiveChild(child)
    await db.settings.put({ key: 'activeChildId', value: child.localId, updatedAt: new Date().toISOString() })
  }

  const clearChild = async () => {
    setActiveChild(null)
    await db.settings.delete('activeChildId')
  }

  return (
    <ChildContext.Provider value={{ activeChild, loadingChild, selectChild, clearChild }}>
      {children}
    </ChildContext.Provider>
  )
}

export function useChild() {
  return useContext(ChildContext)
}
