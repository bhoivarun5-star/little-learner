import { useState } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const LEVELS = [
  { level: 1, pairs: 4, items: ['🐶', '🐱', '🐻', '🐸'] },
  { level: 2, pairs: 6, items: ['🍎', '🍊', '🍇', '🍓', '🍌', '🍋'] },
  { level: 3, pairs: 8, items: ['⭐', '🌙', '☀️', '🌈', '🦋', '🌸', '🎈', '🎉'] },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const INITIAL_STATE = (level = 0, currentScore = 0) => {
  const lvlConfig = LEVELS[level] || LEVELS[0]
  const cards = shuffle([...lvlConfig.items, ...lvlConfig.items].slice(0, lvlConfig.pairs * 2)).map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false
  }))
  return {
    level,
    score: currentScore,
    moves: 0,
    cards,
    flipped: [],
    matched: 0,
    startTime: Date.now(),
    levelComplete: false,
    gameComplete: false
  }
}

export default function MemoryCardsGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('memory_cards', childId, INITIAL_STATE(0))
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState(null) // 'match' | 'no-match'

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const currentLevelConfig = LEVELS[state.level] || LEVELS[0]
  const cols = state.level === 0 ? 2 : state.level === 1 ? 3 : 4
  const cardsList = state.cards || []

  const flipCard = (id) => {
    if (checking || state.levelComplete || state.gameComplete) return
    const card = cardsList.find(c => c.id === id)
    if (!card || card.flipped || card.matched) return
    if (state.flipped.length === 1 && state.flipped[0] === id) return

    const newCards = cardsList.map(c => c.id === id ? { ...c, flipped: true } : c)
    const newFlipped = [...state.flipped, id]

    if (newFlipped.length === 2) {
      setChecking(true)
      const [a, b] = newFlipped.map(fid => cardsList.find(c => c.id === fid))
      const isMatch = a?.emoji === b?.emoji

      const nextCards = newCards.map(c =>
        newFlipped.includes(c.id) ? { ...c, matched: isMatch, flipped: true } : c
      )

      setFeedback(isMatch ? 'match' : 'no-match')
      const newMoves = state.moves + 1

      setTimeout(() => {
        const finalCards = isMatch
          ? nextCards
          : nextCards.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)

        const allMatched = finalCards.length > 0 && finalCards.every(c => c.matched)

        if (allMatched) {
          const levelScore = Math.max(20, 100 - newMoves * 5)
          const newScore = state.score + levelScore

          if (state.level < LEVELS.length - 1) {
            saveState({ ...state, cards: finalCards, flipped: [], moves: newMoves, score: newScore, levelComplete: true })
          } else {
            saveState({ ...state, cards: finalCards, flipped: [], moves: newMoves, score: newScore, gameComplete: true })
          }
        } else {
          saveState({ ...state, cards: finalCards, flipped: [], moves: newMoves })
        }

        setChecking(false)
        setFeedback(null)
      }, 750)
    } else {
      saveState({ ...state, cards: newCards, flipped: newFlipped })
    }
  }

  const handleNextLevel = () => {
    saveState(INITIAL_STATE(state.level + 1, state.score))
  }

  const handleFinish = () => {
    const timeTaken = Math.round((Date.now() - (state.startTime || Date.now())) / 1000)
    onComplete(state.score, 300, state.level + 1, timeTaken)
    clearState()
  }

  const matchedPairs = cardsList.filter(c => c.matched).length / 2

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 800 }}>LEVEL {state.level + 1}</div>
          <div className="game-score-display">{matchedPairs} / {currentLevelConfig.pairs}</div>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
          <div>Moves</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#F97316' }}>{state.moves}</div>
        </div>
      </div>

      {/* Feedback flash */}
      {feedback && (
        <div style={{
          fontSize: 32, fontWeight: 900, animation: 'burst 0.4s ease',
          color: feedback === 'match' ? '#10B981' : '#EF4444'
        }}>
          {feedback === 'match' ? '🌟 Perfect Match!' : '🙈 Try Again!'}
        </div>
      )}

      {/* Card grid */}
      {!state.levelComplete && !state.gameComplete && (
        <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols === 2 ? 280 : cols === 3 ? 340 : 400 }}>
          {cardsList.map((card) => (
            <div
              key={card.id}
              className="memory-card-wrapper"
              onClick={() => flipCard(card.id)}
              style={{ height: cols <= 2 ? 120 : cols === 3 ? 100 : 80 }}
            >
              <div className={`memory-card-inner${card.flipped || card.matched ? ' flipped' : ''}${card.matched ? ' matched' : ''}`}>
                <div className="memory-card-face memory-card-back">🃏</div>
                <div className="memory-card-face memory-card-front">{card.emoji}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Level Complete Modal */}
      {state.levelComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🌟</div>
          <h2 className="heading display-text" style={{ fontSize: 36 }}>Level {state.level + 1} Cleared!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 20, fontWeight: 800 }}>Score: {state.score}</p>
          <button className="btn btn-primary btn-child" style={{ marginTop: 16 }} onClick={handleNextLevel}>
            Next Level →
          </button>
        </div>
      )}

      {/* Game Complete Victory Modal */}
      {state.gameComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🎉</div>
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Memory Master!</h2>
          <p style={{ color: '#F97316', fontSize: 24, fontWeight: 900 }}>Total Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🏆
          </button>
        </div>
      )}
    </div>
  )
}
