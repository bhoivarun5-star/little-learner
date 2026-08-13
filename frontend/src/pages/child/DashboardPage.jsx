import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import { useChild } from '../../hooks/useChild.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import api from '../../api/client.js'
import { contentService } from '../../services/data.service.js'

export default function DashboardPage() {
  const { activeChild } = useChild()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [loadingModules, setLoadingModules] = useState(true)

  const allProgress = useLiveQuery(
    () => activeChild ? db.progress.where('childId').equals(activeChild.localId).toArray() : [],
    [activeChild?.localId]
  )
  const recentScores = useLiveQuery(
    () => activeChild ? db.gameScores.where('childId').equals(activeChild.localId).reverse().limit(3).toArray() : [],
    [activeChild?.localId]
  )
  const badges = useLiveQuery(
    () => activeChild ? db.badges.where('childId').equals(activeChild.localId).toArray() : [],
    [activeChild?.localId]
  )

  useEffect(() => {
    const loadModules = async () => {
      // Try local first
      const local = await contentService.getModules()
      if (local.length > 0) {
        setModules(local)
        setLoadingModules(false)
      }
      // Then try network
      try {
        const res = await api.get('/modules/')
        await contentService.seedModulesFromApi(res.data.results || res.data)
        const updated = await contentService.getModules()
        setModules(updated)
      } catch {
        // Offline - use what we have
      } finally {
        setLoadingModules(false)
      }
    }
    loadModules()
  }, [])

  const totalLessons = useLiveQuery(
    () => activeChild ? db.lessonCompletions.where('childId').equals(activeChild.localId).count() : 0,
    [activeChild?.localId]
  )

  const completedModules = (allProgress || []).filter(p => p.percentComplete >= 100).length
  const avgProgress = allProgress?.length
    ? Math.round(allProgress.reduce((s, p) => s + p.percentComplete, 0) / allProgress.length)
    : 0

  if (!activeChild) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👋</div>
        <h2 className="heading">Hi there!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 24 }}>
          Select a child profile to start learning
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/select-child')}>
          Choose Profile
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #6C63FF22, #FF6B6B22)',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: 'slideUp 0.4s ease'
      }}>
        <div className="avatar-circle" style={{ width: 64, height: 64, fontSize: 36 }}>
          {avatarEmoji(activeChild.avatar)}
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Hello!</p>
          <h1 className="heading display-text" style={{ fontSize: 28 }}>{activeChild.name} 🌟</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {totalLessons || 0} lessons completed!
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '📚', value: totalLessons || 0, label: 'Lessons Done' },
          { icon: '⭐', value: badges?.length || 0, label: 'Badges Earned' },
          { icon: '🎮', value: recentScores?.length || 0, label: 'Games Played' },
          { icon: '📈', value: `${avgProgress}%`, label: 'Avg Progress' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: 'var(--color-primary)', fontSize: 24 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 className="subheading" style={{ marginBottom: 12 }}>🏆 Your Badges</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {badges.map((b) => (
              <div key={b.badgeType} style={{ fontSize: 32 }} title={b.badgeType.replace(/_/g,' ')}>
                {BADGE_EMOJIS[b.badgeType] || '🏅'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue learning */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>📖 Continue Learning</h2>
        {loadingModules ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: 120, height: 120 }} />)}
          </div>
        ) : (
          <div className="modules-grid" style={{ padding: 0 }}>
            {modules.slice(0, 6).map((m) => {
              const prog = (allProgress || []).find(p => p.moduleId === m.serverId)
              const pct = prog?.percentComplete || 0
              return (
                <div
                  key={m.localId}
                  className="module-card"
                  style={{ background: `linear-gradient(135deg, ${m.colorHex}33, ${m.colorHex}11)`, border: `1px solid ${m.colorHex}44` }}
                  onClick={() => navigate(`/child/learn/${m.slug}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="module-emoji">{m.iconEmoji}</div>
                  <div className="module-title">{m.title}</div>
                  {pct > 0 && (
                    <div className="progress-bar" style={{ width: '90%' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: m.colorHex }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function avatarEmoji(avatar) {
  const map = { bear:'🐻', cat:'🐱', dog:'🐶', elephant:'🐘', fox:'🦊', lion:'🦁', owl:'🦉', penguin:'🐧' }
  return map[avatar] || '🐻'
}

const BADGE_EMOJIS = {
  first_lesson: '🌟', lesson_streak_3: '🔥', lesson_streak_7: '🏆',
  perfect_quiz: '🎯', game_master: '🎮', alphabet_complete: '🔤',
  numbers_complete: '🔢', colors_complete: '🎨', shapes_complete: '⭐',
  animals_complete: '🐾', all_modules: '🚀',
}
