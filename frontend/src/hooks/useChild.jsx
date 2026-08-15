import { useState, useEffect, createContext, useContext } from 'react'
import db from '../db/index.js'

const ChildContext = createContext(null)

export function ChildProvider({ children }) {
  const [activeChild, setActiveChild] = useState(null)
  const [loadingChild, setLoadingChild] = useState(true)

  useEffect(() => {
    const initChild = async () => {
      let child = null
      const row = await db.settings.get('activeChildId')
      if (row?.value) {
        child = await db.childProfiles.get(row.value)
      }
      if (!child) {
        const all = await db.childProfiles.toArray()
        if (all.length > 0) {
          child = all[0]
        } else {
          // Auto create default learner profile
          const defaultProfile = {
            localId: 'default_learner',
            serverId: null,
            name: 'Little Learner',
            avatar: 'bear',
            pin: '',
            updatedAt: new Date().toISOString()
          }
          await db.childProfiles.put(defaultProfile)
          child = defaultProfile
        }
        await db.settings.put({ key: 'activeChildId', value: child.localId, updatedAt: new Date().toISOString() })
      }
      setActiveChild(child)
      setLoadingChild(false)
    }
    initChild()
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
