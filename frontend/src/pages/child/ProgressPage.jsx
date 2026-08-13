import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import { useChild } from '../../hooks/useChild.jsx'
import { badgeService, gameService, progressService } from '../../services/data.service.js'

export default function ProgressPage() {
  const { activeChild } = useChild()

  const allProgress = useLiveQuery(
    () => activeChild ? db.progress.where('childId').equals(activeChild.localId).toArray() : [],
    [activeChild?.localId]
  )
  const badges = useLiveQuery(
    () => activeChild ? db.badges.where('childId').equals(activeChild.localId).toArray() : [],
    [activeChild?.localId]
  )
  const recentScores = useLiveQuery(
    () => activeChild ? db.gameScores.where('childId').equals(activeChild.localId).reverse().limit(10).toArray() : [],
    [activeChild?.localId]
  )
  const lessonCount = useLiveQuery(
    () => activeChild ? db.lessonCompletions.where('childId').equals(activeChild.localId).count() : 0,
    [activeChild?.localId]
  )
  const modules = useLiveQuery(() => db.learningModules.orderBy('order').toArray(), [])

  if (!activeChild) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🌟</div>
      <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Select a child profile to see progress</p>
    </div>
  )

  const avgScore = recentScores?.length
    ? Math.round(recentScores.reduce((s, g) => s + g.score, 0) / recentScores.length)
    : 0

  return (
    <div style={{ padding: 16 }}>
      <h1 className="heading" style={{ marginBottom: 20 }}>⭐ {activeChild.name}'s Progress</h1>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '📚', value: lessonCount || 0, label: 'Lessons Done', color: '#6C63FF' },
          { icon: '🏆', value: badges?.length || 0, label: 'Badges', color: '#FFE66D' },
          { icon: '🎮', value: recentScores?.length || 0, label: 'Games Played', color: '#4ECDC4' },
          { icon: '🎯', value: avgScore, label: 'Avg Score', color: '#FF6B6B' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderColor: `${s.color}33` }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>🏆 Badges</h2>
        {badges?.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            Complete lessons and games to earn badges!
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {badges?.map((b) => (
              <div key={b.badgeType} style={{
                background: 'var(--color-card)', borderRadius: 'var(--radius-lg)',
                padding: '12px 16px', textAlign: 'center', border: '1px solid var(--color-border)',
                minWidth: 80
              }}>
                <div style={{ fontSize: 36 }}>{BADGE_EMOJIS[b.badgeType] || '🏅'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4 }}>
                  {b.badgeType.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module progress */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>📚 Module Progress</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modules?.map((m) => {
            const prog = (allProgress || []).find(p => p.moduleId === m.localId || p.moduleId === m.serverId)
            const pct = prog?.percentComplete || 0
            return (
              <div key={m.localId} style={{
                background: 'var(--color-card)', borderRadius: 'var(--radius-lg)',
                padding: '14px 18px', border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{m.iconEmoji}</span>
                    <span style={{ fontWeight: 700 }}>{m.title}</span>
                  </div>
                  <span style={{ fontWeight: 900, color: pct >= 100 ? '#4ECDC4' : 'var(--text-secondary)', fontSize: 14 }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: m.colorHex || 'var(--color-primary)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent game scores */}
      {recentScores?.length > 0 && (
        <div>
          <h2 className="subheading" style={{ marginBottom: 12 }}>🎮 Recent Games</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentScores.map((s, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'var(--color-card)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
              }}>
                <div style={{ fontWeight: 700 }}>Game Score</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 900 }}>{s.score}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(s.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const BADGE_EMOJIS = {
  first_lesson: '🌟', lesson_streak_3: '🔥', lesson_streak_7: '🏆',
  perfect_quiz: '🎯', game_master: '🎮', alphabet_complete: '🔤',
  numbers_complete: '🔢', colors_complete: '🎨', shapes_complete: '⭐',
  animals_complete: '🐾', all_modules: '🚀',
}
