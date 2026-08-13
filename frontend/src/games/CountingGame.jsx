import { useState, useEffect } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const LEVELS = [
  { max: 5, questions: 5, emoji: '⭐' },
  { max: 10, questions: 7, emoji: '🍎' },
  { max: 15, questions: 10, emoji: '🌸' },
]

const mkQuestion = (max, emoji) => {
  const count = Math.floor(Math.random() * max) + 1
  const opts = new Set([count])
  while (opts.size < 4) opts.add(Math.max(1, count + Math.floor(Math.random() * 7) - 3))
  return { count, emoji, options: [...opts].sort(() => Math.random() - 0.5), tapped: 0 }
}

const INITIAL_STATE = (level = 0) => {
  const { max, questions, emoji } = LEVELS[level]
  return {
    level, qIndex: 0, score: 0, lives: 3, answered: null, startTime: Date.now(),
    questions: Array.from({ length: questions }, () => mkQuestion(max, emoji))
  }
}

export default function CountingGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('counting', childId, INITIAL_STATE(0))
  const [tapped, setTapped] = useState(0)

  useEffect(() => { setTapped(0) }, [state.qIndex])
  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const q = state.questions?.[state.qIndex]
  if (!q) return null

  const handleAnswer = (opt) => {
    if (state.answered !== null) return
    const correct = opt === q.count
    const newScore = correct ? state.score + 15 : state.score
    const newLives = correct ? state.lives : state.lives - 1
    saveState({ ...state, answered: opt, score: newScore, lives: newLives })

    setTimeout(() => {
      const nextIdx = state.qIndex + 1
      if (newLives <= 0 || nextIdx >= state.questions.length) {
        const timeTaken = Math.round((Date.now() - state.startTime) / 1000)
        if (state.level < LEVELS.length - 1 && newScore >= (state.qIndex + 1) * 10) {
          saveState(INITIAL_STATE(state.level + 1))
        } else {
          onComplete(newScore, state.questions.length * 15, state.level + 1, timeTaken)
          clearState()
        }
      } else {
        saveState({ ...state, answered: null, qIndex: nextIdx, score: newScore, lives: newLives })
      }
    }, 900)
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>LEVEL {state.level + 1}</div>
          <div className="game-score-display">{state.score}</div>
        </div>
        <div className="game-lives">{Array.from({ length: 3 }, (_, i) => i < state.lives ? '❤️' : '🖤')}</div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>How many {q.emoji}?</p>

      {/* Tappable items */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
        maxWidth: 320, padding: '0 20px'
      }}>
        {Array.from({ length: q.count }, (_, i) => (
          <button
            key={i}
            onClick={() => setTapped(t => Math.min(t + 1, q.count))}
            style={{
              fontSize: 40, background: 'none', border: 'none',
              transform: i < tapped ? 'scale(0.85)' : 'scale(1)',
              opacity: i < tapped ? 0.5 : 1,
              transition: 'all 0.15s', cursor: 'pointer'
            }}
          >{q.emoji}</button>
        ))}
      </div>

      {tapped > 0 && (
        <div style={{ fontFamily: 'Baloo 2', fontSize: 40, fontWeight: 900, color: 'var(--color-accent)' }}>
          {tapped}
        </div>
      )}

      <div className="answer-grid">
        {q.options.map((opt) => {
          let cls = 'answer-btn'
          if (state.answered !== null) {
            if (opt === q.count) cls += ' correct'
            else if (opt === state.answered) cls += ' wrong'
          }
          return <button key={opt} className={cls} onClick={() => handleAnswer(opt)}>{opt}</button>
        })}
      </div>
    </div>
  )
}
