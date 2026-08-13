import { useState, useEffect } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const LEVELS = [
  { level: 1, pairs: 4, items: ['🐶', '🐱', '🐻', '🐸'] },
  { level: 2, pairs: 6, items: ['🍎', '🍊', '🍇', '🍓', '🍌', '🍋'] },
  { level: 3, pairs: 8, items: ['⭐', '🌙', '☀️', '🌈', '🦋', '🌸', '🎈', '🎉'] },
]

const INITIAL_STATE = (level = 0) => {
  const { items, pairs } = LEVELS[level]
  const cards = shuffle([...items, ...items].slice(0, pairs * 2)).map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false
  }))
  return { level, score: 0, moves: 0, cards, flipped: [], matched: 0, startTime: Date.now(), complete: false }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MemoryCardsGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('memory_cards', childId, INITIAL_STATE(0))
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState(null) // 'match' | 'no-match'

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const cols = state.level === 0 ? 2 : state.level === 1 ? 3 : 4

  const flipCard = (id) => {
    if (checking) return
    const card = state.cards.find(c => c.id === id)
    if (!card || card.flipped || card.matched) return
    if (state.flipped.length === 1 && state.flipped[0] === id) return

    const newCards = state.cards.map(c => c.id === id ? { ...c, flipped: true } : c)
    const newFlipped = [...state.flipped, id]

    if (newFlipped.length === 2) {
      setChecking(true)
      const [a, b] = newFlipped.map(fid => state.cards.find(c => c.id === fid))
      const isMatch = a.emoji === b.emoji

      const nextCards = newCards.map(c =>
        newFlipped.includes(c.id) ? { ...c, matched: isMatch, flipped: true } : c
      )

      saveState({ ...state, cards: nextCards, flipped: [], moves: state.moves + 1 })
      setFeedback(isMatch ? 'match' : 'no-match')

      setTimeout(() => {
        if (!isMatch) {
          saveState(s => ({
            ...s,
            cards: s.cards.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c),
            flipped: []
          }))
        }
        const allMatched = nextCards.filter(c => c.matched).length === nextCards.length
        if (allMatched) {
          const timeTaken = Math.round((Date.now() - state.startTime) / 1000)
          const score = Math.max(0, 100 - state.moves * 5)
          saveState(s => ({ ...s, score, complete: true }))
          if (state.level < LEVELS.length - 1) {
            setTimeout(() => saveState(INITIAL_STATE(state.level + 1)), 1500)
          } else {
            onComplete(score, 100, state.level + 1, timeTaken)
            clearState()
          }
        }
        setChecking(false)
        setFeedback(null)
      }, 900)
    } else {
      saveState({ ...state, cards: newCards, flipped: newFlipped })
    }
  }

  const matched = state.cards.filter(c => c.matched).length / 2

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>LEVEL {state.level + 1}</div>
          <div className="game-score-display">{matched} / {LEVELS[state.level].pairs}</div>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
          <div>Moves</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--text-primary)' }}>{state.moves}</div>
        </div>
      </div>

      {/* Feedback flash */}
      {feedback && (
        <div style={{
          fontSize: 40, animation: 'burst 0.4s ease',
          color: feedback === 'match' ? '#4ECDC4' : '#FF6B6B'
        }}>
          {feedback === 'match' ? '✓ Match!' : '✗ Try again!'}
        </div>
      )}

      {/* Card grid */}
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols === 2 ? 280 : cols === 3 ? 340 : 400 }}>
        {state.cards.map((card) => (
          <div
            key={card.id}
            className="memory-card-wrapper"
            onClick={() => flipCard(card.id)}
            style={{ height: cols <= 2 ? 120 : cols === 3 ? 100 : 80 }}
          >
            <div className={`memory-card-inner${card.flipped || card.matched ? ' flipped' : ''}${card.matched ? ' matched' : ''}`}>
              <div className="memory-card-face memory-card-back">🎴</div>
              <div className="memory-card-face memory-card-front">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>

      {state.complete && (
        <div className="celebration-overlay">
          <div className="star-burst">🎉</div>
          <h2 className="heading display-text">Level {state.level + 1} Done!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Score: {state.score}</p>
        </div>
      )}
    </div>
  )
}
