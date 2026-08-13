import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import api from '../../api/client.js'
import { contentService } from '../../services/data.service.js'

export default function LearnPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const modules = useLiveQuery(() => db.learningModules.orderBy('order').toArray(), [])

  useEffect(() => {
    const load = async () => {
      const local = await db.learningModules.count()
      if (local === 0) {
        try {
          const res = await api.get('/modules/')
          await contentService.seedModulesFromApi(res.data.results || res.data)
        } catch { /* offline */ }
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading && !modules?.length) {
    return (
      <div style={{ padding: 16 }}>
        <div className="modules-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: 1, borderRadius: 20 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 className="heading">📚 Learn</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 15 }}>
          Choose what you want to learn today!
        </p>
      </div>
      <div className="modules-grid">
        {(modules || []).map((m) => (
          <button
            key={m.localId}
            className="module-card"
            style={{
              background: `linear-gradient(135deg, ${m.colorHex}44, ${m.colorHex}22)`,
              border: `2px solid ${m.colorHex}55`,
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/child/learn/${m.slug}`)}
            aria-label={`Learn ${m.title}`}
          >
            <div className="module-emoji">{m.iconEmoji}</div>
            <div className="module-title">{m.title}</div>
            {m.downloadStatus === 'downloaded' && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>✓ Offline</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
