import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db/index.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChild } from '../hooks/useChild.jsx'
import { useConnectivity } from '../services/connectivity.service.js'
import syncEngine from '../sync/syncEngine.js'
import api from '../api/client.js'
import { contentService } from '../services/data.service.js'

export default function SelectChildPage() {
  const { user, logout } = useAuth()
  const { selectChild } = useChild()
  const { isOnline } = useConnectivity()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', avatar: 'bear', pin: '' })
  const [saving, setSaving] = useState(false)

  const children = useLiveQuery(() => db.childProfiles.toArray(), [])

  useEffect(() => {
    if (!isOnline) return
    // Sync children from server
    api.get('/children/').then(res => {
      const kids = res.data.results || res.data
      for (const k of kids) {
        db.childProfiles.put({
          localId: k.id, serverId: k.id, name: k.name, avatar: k.avatar,
          pin: '', parentId: user?.id, updatedAt: k.updated_at
        })
      }
    }).catch(() => {})
  }, [isOnline])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isOnline) {
        const res = await api.post('/children/', form)
        await db.childProfiles.put({
          localId: res.data.id, serverId: res.data.id,
          name: res.data.name, avatar: res.data.avatar,
          pin: form.pin, parentId: user?.id, updatedAt: res.data.updated_at
        })
      } else {
        const localId = `local_${Date.now()}`
        await db.childProfiles.add({ localId, serverId: null, ...form, parentId: user?.id, updatedAt: new Date().toISOString() })
      }
      setShowAdd(false)
      setForm({ name: '', avatar: 'bear', pin: '' })
    } finally { setSaving(false) }
  }

  const AVATARS = ['bear', 'cat', 'dog', 'elephant', 'fox', 'lion', 'owl', 'penguin']
  const AVATAR_EMOJI = { bear:'🐻', cat:'🐱', dog:'🐶', elephant:'🐘', fox:'🦊', lion:'🦁', owl:'🦉', penguin:'🐧' }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 56 }}>👋</div>
        <h1 className="heading display-text" style={{ marginTop: 8 }}>Who's Learning Today?</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Hi {user?.name}!</p>
      </div>

      {/* Children grid */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32, width: '100%', maxWidth: 480 }}>
        {children?.map((child) => (
          <button
            key={child.localId}
            onClick={() => { selectChild(child); navigate('/child/home') }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: 24, background: 'var(--color-card)', border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'var(--transition)',
              minWidth: 120
            }}
            className="module-card"
          >
            <div className="avatar-circle" style={{ width: 72, height: 72, fontSize: 44 }}>
              {AVATAR_EMOJI[child.avatar] || '🐻'}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{child.name}</div>
          </button>
        ))}

        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: 24, background: 'rgba(108,99,255,0.08)', border: '2px dashed rgba(108,99,255,0.3)',
            borderRadius: 'var(--radius-xl)', cursor: 'pointer', color: 'var(--color-primary)', minWidth: 120
          }}
        >
          <div style={{ fontSize: 44 }}>➕</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Add Child</div>
        </button>
      </div>

      {/* Add child form */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontWeight: 800 }}>Add a Child</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Child's Name</label>
                <input className="form-input" placeholder="e.g. Emma" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Choose Avatar</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATARS.map(a => (
                    <button key={a} type="button" onClick={() => setForm(p => ({ ...p, avatar: a }))}
                      style={{ fontSize: 32, padding: 8, borderRadius: 12, border: `2px solid ${form.avatar === a ? 'var(--color-primary)' : 'transparent'}`, background: form.avatar === a ? 'rgba(108,99,255,0.2)' : 'transparent', cursor: 'pointer' }}>
                      {AVATAR_EMOJI[a]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">4-Digit PIN (optional, for offline access)</label>
                <input className="form-input" type="text" inputMode="numeric" maxLength={4} placeholder="e.g. 1234"
                  value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g,'') }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving…' : '✓ Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent dashboard link */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="btn btn-secondary" style={{ fontSize: 14 }} onClick={() => navigate('/parent/dashboard')}>
          📊 Parent Dashboard
        </button>
        <button className="btn btn-secondary" style={{ fontSize: 14 }} onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
