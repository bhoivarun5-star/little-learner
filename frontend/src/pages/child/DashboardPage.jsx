import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import { useChild } from '../../hooks/useChild.jsx'
import api from '../../api/client.js'
import { contentService } from '../../services/data.service.js'

export default function DashboardPage() {
  const { activeChild } = useChild()
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
      const local = await contentService.getModules()
      if (local.length > 0) {
        setModules(local)
        setLoadingModules(false)
      }
      try {
        const res = await api.get('/modules/')
        await contentService.seedModulesFromApi(res.data.results || res.data)
        const updated = await contentService.getModules()
        setModules(updated)
      } catch {
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

  const ANIMALS_WORLD = [
    { name: 'Lion', emoji: '🦁', desc: 'Roar! King of Jungle', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
    { name: 'Elephant', emoji: '🐘', desc: 'Big & Friendly', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
    { name: 'Puppy', emoji: '🐶', desc: 'Playful Companion', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { name: 'Bear', emoji: '🐻', desc: 'Warm & Cuddly', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { name: 'Fox', emoji: '🦊', desc: 'Smart & Quick', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { name: 'Owl', emoji: '🦉', desc: 'Night Explorer', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  ]

  const SHAPES_MAGIC = [
    { name: 'Star', emoji: '⭐', color: '#F59E0B' },
    { name: 'Circle', emoji: '⭕', color: '#F97316' },
    { name: 'Triangle', emoji: '🔺', color: '#EF4444' },
    { name: 'Square', emoji: '🟦', color: '#3B82F6' },
    { name: 'Heart', emoji: '❤️', color: '#EC4899' },
    { name: 'Diamond', emoji: '💎', color: '#8B5CF6' },
  ]

  const NUMBER_BUBBLES = [
    { num: '1', emoji: '🍎', label: 'One Apple' },
    { num: '2', emoji: '⚽', label: 'Two Balls' },
    { num: '3', emoji: '⭐', label: 'Three Stars' },
    { num: '4', emoji: '🌸', label: 'Four Flowers' },
    { num: '5', emoji: '🎈', label: 'Five Balloons' },
  ]

  return (
    <div style={{ padding: '0 16px' }}>
      {/* 🌈 Hero Banner with 3D Image & Animations */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-float)',
        marginBottom: 28,
        border: '2px solid rgba(249, 115, 22, 0.2)',
        background: '#FFFFFF'
      }}>
        <img
          src="/hero_banner.jpg"
          alt="Little Learner Fun Animals Numbers Shapes"
          style={{ width: '100%', height: 'auto', maxHeight: 320, objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,247,237,0.98) 100%)',
          marginTop: -40,
          position: 'relative',
          textAlign: 'center'
        }}>
          <h1 className="heading display-text" style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            background: 'linear-gradient(135deg, #F97316 0%, #EC4899 50%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome Little Learner! 🌈✨
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 800, marginTop: 6, marginBottom: 18 }}>
            Explore Animals, Shapes, Numbers & Fun Games!
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-child" onClick={() => navigate('/child/learn')}>
              📚 Start Learning
            </button>
            <button className="btn btn-purple btn-child" onClick={() => navigate('/child/games')}>
              🎮 Play Games
            </button>
          </div>
        </div>
      </div>



      {/* 🔢 Magic Numbers & Counting Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="subheading" style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔢 Magic Numbers & Counting
          </h2>
          <button
            onClick={() => navigate('/child/games')}
            style={{ color: '#EC4899', fontWeight: 800, fontSize: 14, background: 'none', cursor: 'pointer' }}
          >
            Play Games →
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'none'
        }}>
          {NUMBER_BUBBLES.map((n) => (
            <div
              key={n.num}
              onClick={() => navigate('/child/games')}
              style={{
                minWidth: 110,
                padding: '16px 14px',
                background: '#FFFFFF',
                border: '2px solid rgba(236, 72, 153, 0.25)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                flexShrink: 0
              }}
              className="module-card"
            >
              <div style={{
                fontFamily: 'Baloo 2', fontSize: 38, fontWeight: 900,
                color: '#EC4899', lineHeight: 1
              }}>
                {n.num}
              </div>
              <div style={{ fontSize: 28, margin: '6px 0' }}>{n.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>
                {n.label}
              </div>
            </div>
          ))}
        </div>
      </div>




    </div>
  )
}
