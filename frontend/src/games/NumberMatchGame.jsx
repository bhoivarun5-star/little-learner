import { useState } from 'react'
import { useGameStatePersistence } from './useGameState.js'

function genQuestion(maxNum) {
  const count = Math.floor(Math.random() * maxNum) + 1
  const emoji = ['⭐', '🌸', '🎈', '🍎', '🐝', '🦋', '🌺'][Math.floor(Math.random() * 7)]
  const opts = new Set([count])
  while (opts.size < 4) opts.add(Math.max(1, count + Math.floor(Math.random() * 5) - 2))
  return { count, emoji, options: [...opts].sort(() => Math.random() - 0.5) }
}

const LEVELS = [
  { level: 0, maxNum: 5, questions: 5 },
  { level: 1, maxNum: 10, questions: 7 },
  { level: 2, maxNum: 20, questions: 10 },
]

const INITIAL_STATE = (level = 0) => ({
  level, qIndex: 0, score: 0, lives: 3, answered: null,
  questions: Array.from({ length: LEVELS[level].questions }, () => genQuestion(LEVELS[level].maxNum)),
  startTime: Date.now()
})

export default function NumberMatchGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('number_match', childId, INITIAL_STATE(0))
  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const q = state.questions?.[state.qIndex]
  if (!q) return null

  const handleAnswer = (val) => {
    if (state.answered !== null) return
    const correct = val === q.count
    const newScore = correct ? state.score + 15 : state.score
    const newLives = correct ? state.lives : state.lives - 1
    saveState({ ...state, answered: val, score: newScore, lives: newLives })

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

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 12 }}>How many? Count them!</p>
        <div style={{ fontSize: Math.max(28, 48 - q.count * 1.5), letterSpacing: 6, lineHeight: 1.5, maxWidth: 300 }}>
          {q.emoji.repeat(Math.min(q.count, 15))}
          {q.count > 15 && `... +${q.count - 15}`}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Question {state.qIndex + 1}</p>
      </div>

      <div className="answer-grid">
        {q.options.map((opt) => {
          let cls = 'answer-btn'
          if (state.answered !== null) {
            if (opt === q.count) cls += ' correct'
            else if (opt === state.answered) cls += ' wrong'
          }
          return (
            <button key={opt} className={cls} onClick={() => handleAnswer(opt)}>{opt}</button>
          )
        })}
      </div>
    </div>
  )
}
