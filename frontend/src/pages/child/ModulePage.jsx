import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChild } from '../../hooks/useChild.jsx'
import { contentService, lessonService, progressService, badgeService } from '../../services/data.service.js'
import api from '../../api/client.js'

export default function ModulePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { activeChild } = useChild()
  const [module, setModule] = useState(null)
  const [lessons, setLessons] = useState([])
  const [completedIds, setCompletedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [activeLessonIdx, setActiveLessonIdx] = useState(null)

  useEffect(() => {
    const load = async () => {
      // Load module metadata
      let mod = await contentService.getModule(slug)
      if (!mod) {
        try {
          const res = await api.get(`/modules/${slug}/`)
          await contentService.seedModulesFromApi([res.data])
          mod = await contentService.getModule(slug)
        } catch { }
      }
      setModule(mod)

      if (!mod) { setLoading(false); return }

      // Load lessons
      let localLessons = await contentService.getLessons(mod.localId)
      if (!localLessons.length) {
        try {
          const res = await api.get(`/modules/${slug}/lessons/`)
          await contentService.seedLessonsFromApi(mod.localId, res.data)
          localLessons = await contentService.getLessons(mod.localId)
        } catch { }
      }
      setLessons(localLessons)

      // Load completions
      if (activeChild) {
        const completions = await lessonService.getCompletedLessons(activeChild.localId)
        setCompletedIds(new Set(completions.map(c => c.lessonId)))
      }

      setLoading(false)
    }
    load()
  }, [slug, activeChild?.localId])

  const handleCompleteLesson = async (lesson) => {
    if (!activeChild) return
    await lessonService.markComplete(activeChild.localId, lesson.localId, lesson.durationSeconds || 120)
    setCompletedIds(prev => new Set([...prev, lesson.localId]))

    // Update module progress
    const newPct = Math.round(((completedIds.size + 1) / lessons.length) * 100)
    await progressService.updateModuleProgress(activeChild.localId, module.localId, newPct, lesson.durationSeconds || 120)

    // Award first lesson badge
    if (completedIds.size === 0) {
      await badgeService.awardBadge(activeChild.localId, 'first_lesson')
    }
    // Award module complete badge
    if (newPct >= 100) {
      const badgeMap = {
        alphabet: 'alphabet_complete', numbers: 'numbers_complete',
        colors: 'colors_complete', shapes: 'shapes_complete', animals: 'animals_complete'
      }
      if (badgeMap[slug]) await badgeService.awardBadge(activeChild.localId, badgeMap[slug])
    }
    setActiveLessonIdx(null)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding: 40 }}><div className="spinner" /></div>
  if (!module) return <div style={{ padding: 24, textAlign: 'center' }}>Module not found. Go online to load it.</div>

  return (
    <div style={{ padding: 16 }}>
      {/* Module Header */}
      <div style={{
        background: `linear-gradient(135deg, ${module.colorHex}44, ${module.colorHex}11)`,
        borderRadius: 'var(--radius-xl)', padding: 24, marginBottom: 20,
        border: `2px solid ${module.colorHex}55`, textAlign: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>{module.iconEmoji}</div>
        <h1 className="heading display-text">{module.title}</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{module.description}</p>
        <div style={{ marginTop: 16 }}>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{
              width: `${lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0}%`,
              background: module.colorHex
            }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
            {completedIds.size} / {lessons.length} lessons
          </p>
        </div>
      </div>

      {/* Lesson in progress */}
      {activeLessonIdx !== null && lessons[activeLessonIdx] && (
        <LessonViewer
          lesson={lessons[activeLessonIdx]}
          onComplete={() => handleCompleteLesson(lessons[activeLessonIdx])}
          onClose={() => setActiveLessonIdx(null)}
        />
      )}

      {/* Lessons list */}
      {activeLessonIdx === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lessons.map((lesson, idx) => {
            const done = completedIds.has(lesson.localId)
            return (
              <button
                key={lesson.localId}
                onClick={() => setActiveLessonIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px',
                  background: done ? 'rgba(78,205,196,0.08)' : 'var(--color-card)',
                  border: `1.5px solid ${done ? 'rgba(78,205,196,0.3)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left',
                  transition: 'var(--transition)'
                }}
                aria-label={`Lesson ${idx + 1}: ${lesson.title}`}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#4ECDC4' : 'rgba(108,99,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: done ? '#fff' : 'var(--color-primary)'
                }}>
                  {done ? '✓' : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{lesson.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                    {Math.round((lesson.durationSeconds || 120) / 60)} min
                    {done && <span style={{ color: '#4ECDC4', marginLeft: 8 }}>✓ Done</span>}
                  </div>
                </div>
                <span style={{ fontSize: 20 }}>{done ? '🌟' : '▶'}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LessonViewer({ lesson, onComplete, onClose }) {
  const content = lesson.contentJson || {}
  const [slideIdx, setSlideIdx] = useState(0)
  const slides = content.slides || []
  const isLast = slideIdx >= slides.length - 1

  const renderSlide = (slide) => {
    if (!slide) return null
    switch (slide.type) {
      case 'letter_display': return (
        <div style={{ textAlign: 'center' }}>
          <div className="letter-display animate-float">{slide.letter}</div>
          <div style={{ fontSize: 48, marginTop: 8 }}>{slide.lowercase}</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 18 }}>
            Uppercase and Lowercase
          </p>
        </div>
      )
      case 'word_association': return (
        <div style={{ textAlign: 'center' }}>
          <div className="emoji-display">{slide.emoji}</div>
          <h2 className="heading display-text" style={{ marginTop: 16, fontSize: 36 }}>{slide.word}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>This starts with the letter!</p>
        </div>
      )
      case 'number_display': return (
        <div style={{ textAlign: 'center' }}>
          <div className="letter-display">{slide.number}</div>
          <h2 className="heading display-text" style={{ marginTop: 8 }}>{slide.word}</h2>
        </div>
      )
      case 'counting': return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, letterSpacing: 4, marginBottom: 16 }}>
            {slide.item_emoji.repeat(Math.min(slide.count, 10))}
          </div>
          <h2 className="heading display-text">Count: {slide.count}</h2>
        </div>
      )
      case 'color_display': return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: slide.hex, margin: '0 auto 24px',
            boxShadow: `0 0 40px ${slide.hex}88`
          }} />
          <h2 className="heading display-text">{slide.color}</h2>
        </div>
      )
      case 'shape_display': return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 100, margin: '0 auto 16px' }}>{shapeEmoji(slide.shape)}</div>
          <h2 className="heading display-text">{slide.shape}</h2>
        </div>
      )
      case 'animal_display': return (
        <div style={{ textAlign: 'center' }}>
          <div className="emoji-display">{slide.emoji}</div>
          <h2 className="heading display-text" style={{ marginTop: 16 }}>{slide.animal}</h2>
        </div>
      )
      default: return (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 64 }}>📖</div>
          <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6 }}>{JSON.stringify(slide)}</p>
        </div>
      )
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--color-bg)',
      zIndex: 200, display: 'flex', flexDirection: 'column',
      paddingBottom: 'var(--nav-height)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onClose}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 800 }}>{lesson.title}</div>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{slideIdx + 1}/{slides.length}</span>
      </div>

      {/* Slide progress */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px 16px' }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 99,
            background: i <= slideIdx ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {renderSlide(slides[slideIdx])}
      </div>

      {/* Navigation */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 12 }}>
        {slideIdx > 0 && (
          <button className="btn btn-secondary btn-child" style={{ flex: 1 }} onClick={() => setSlideIdx(i => i - 1)}>
            ← Back
          </button>
        )}
        <button
          className={`btn ${isLast ? 'btn-success' : 'btn-primary'} btn-child`}
          style={{ flex: 2 }}
          onClick={() => isLast ? onComplete() : setSlideIdx(i => i + 1)}
        >
          {isLast ? '🌟 Complete!' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

function shapeEmoji(shape) {
  const map = { circle: '⭕', square: '⬛', triangle: '🔺', rectangle: '▬', star: '⭐', heart: '❤️', diamond: '💎', oval: '🥚' }
  return map[shape?.toLowerCase()] || '🔷'
}
