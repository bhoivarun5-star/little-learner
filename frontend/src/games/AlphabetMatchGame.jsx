import { useState, useEffect } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const QUESTIONS_BY_LEVEL = [
  [
    { letter: 'A', word: 'Apple', emoji: '🍎', options: ['A', 'B', 'C', 'D'] },
    { letter: 'B', word: 'Ball', emoji: '⚽', options: ['A', 'B', 'C', 'D'] },
    { letter: 'C', word: 'Cat', emoji: '🐱', options: ['B', 'C', 'D', 'E'] },
    { letter: 'D', word: 'Dog', emoji: '🐶', options: ['C', 'D', 'E', 'F'] },
  ],
  [
    { letter: 'E', word: 'Elephant', emoji: '🐘', options: ['C', 'D', 'E', 'F'] },
    { letter: 'F', word: 'Fish', emoji: '🐟', options: ['D', 'F', 'G', 'H'] },
    { letter: 'G', word: 'Grapes', emoji: '🍇', options: ['E', 'F', 'G', 'H'] },
    { letter: 'H', word: 'Hat', emoji: '🎩', options: ['F', 'G', 'H', 'I'] },
  ],
  [
    { letter: 'I', word: 'Ice Cream', emoji: '🍦', options: ['G', 'H', 'I', 'J'] },
    { letter: 'L', word: 'Lion', emoji: '🦁', options: ['J', 'K', 'L', 'M'] },
    { letter: 'M', word: 'Monkey', emoji: '🐒', options: ['L', 'M', 'N', 'O'] },
    { letter: 'S', word: 'Sun', emoji: '☀️', options: ['R', 'S', 'T', 'U'] },
  ],
]

const INITIAL_STATE = (level = 0) => ({
  level, qIndex: 0, score: 0, lives: 3, answered: null,
  questions: shuffle([...QUESTIONS_BY_LEVEL[level]]),
  startTime: Date.now(), complete: false
})

function shuffle(arr) {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

export default function AlphabetMatchGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('alphabet_match', childId, INITIAL_STATE(0))

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const q = state.questions?.[state.qIndex]
  if (!q) return null

  const handleAnswer = (letter) => {
    if (state.answered) return
    const correct = letter === q.letter
    const newScore = correct ? state.score + 20 : state.score
    const newLives = correct ? state.lives : state.lives - 1
    saveState({ ...state, answered: letter, score: newScore, lives: newLives })

    setTimeout(() => {
      const nextIdx = state.qIndex + 1
      if (newLives <= 0 || nextIdx >= state.questions.length) {
        const timeTaken = Math.round((Date.now() - state.startTime) / 1000)
        if (state.level < QUESTIONS_BY_LEVEL.length - 1 && newScore > state.score * 0.6) {
          saveState(INITIAL_STATE(state.level + 1))
        } else {
          onComplete(newScore, state.questions.length * 20, state.level + 1, timeTaken)
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

      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>
          Which letter starts with...
        </p>
        <div className="emoji-display animate-float">{q.emoji}</div>
        <h2 className="heading display-text" style={{ marginTop: 8 }}>{q.word}</h2>
      </div>

      <div className="answer-grid">
        {q.options.map((opt) => {
          let cls = 'answer-btn'
          if (state.answered) {
            if (opt === q.letter) cls += ' correct'
            else if (opt === state.answered) cls += ' wrong'
          }
          return (
            <button key={opt} className={cls} onClick={() => handleAnswer(opt)}>
              {opt}
            </button>
          )
        })}
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Question {state.qIndex + 1} of {state.questions?.length}
      </div>
    </div>
  )
}
