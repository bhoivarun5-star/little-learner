import { useState } from 'react'
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

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const INITIAL_STATE = (level = 0, currentScore = 0) => ({
  level,
  qIndex: 0,
  score: currentScore,
  lives: 3,
  answered: null,
  questions: shuffle([...(QUESTIONS_BY_LEVEL[level] || QUESTIONS_BY_LEVEL[0])]),
  startTime: Date.now(),
  gameOver: false,
  levelComplete: false,
  gameComplete: false
})

export default function AlphabetMatchGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('alphabet_match', childId, INITIAL_STATE(0))

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const q = state.questions?.[state.qIndex]

  const handleAnswer = (letter) => {
    if (state.answered || state.gameOver || state.levelComplete || state.gameComplete) return
    const correct = letter === q.letter
    const newScore = correct ? state.score + 20 : state.score
    const newLives = correct ? state.lives : state.lives - 1

    saveState({ ...state, answered: letter, score: newScore, lives: newLives })

    setTimeout(() => {
      if (newLives <= 0) {
        saveState({ ...state, answered: null, lives: 0, gameOver: true })
        return
      }

      const nextIdx = state.qIndex + 1
      if (nextIdx >= (state.questions?.length || 0)) {
        if (state.level < QUESTIONS_BY_LEVEL.length - 1) {
          saveState({ ...state, answered: null, score: newScore, levelComplete: true })
        } else {
          saveState({ ...state, answered: null, score: newScore, gameComplete: true })
        }
      } else {
        saveState({ ...state, answered: null, qIndex: nextIdx, score: newScore, lives: newLives })
      }
    }, 800)
  }

  const handleNextLevel = () => {
    saveState(INITIAL_STATE(state.level + 1, state.score))
  }

  const handleRestart = () => {
    saveState(INITIAL_STATE(0, 0))
  }

  const handleFinish = () => {
    const timeTaken = Math.round((Date.now() - (state.startTime || Date.now())) / 1000)
    onComplete(state.score, 240, state.level + 1, timeTaken)
    clearState()
  }

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800 }}>LEVEL {state.level + 1}</div>
          <div className="game-score-display">{state.score}</div>
        </div>
        <div className="game-lives">{Array.from({ length: 3 }, (_, i) => i < state.lives ? '❤️' : '🖤')}</div>
      </div>

      {q && !state.gameOver && !state.levelComplete && !state.gameComplete && (
        <>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
              Which letter starts with...
            </p>
            <div className="emoji-display animate-float">{q.emoji}</div>
            <h2 className="heading display-text" style={{ marginTop: 12, fontSize: 36 }}>{q.word}</h2>
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

          <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>
            Question {state.qIndex + 1} of {state.questions?.length}
          </div>
        </>
      )}

      {/* Game Over Modal */}
      {state.gameOver && (
        <div className="celebration-overlay">
          <div className="star-burst">💔</div>
          <h2 className="heading display-text" style={{ fontSize: 32 }}>Out of Lives!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>Final Score: {state.score}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary btn-child" onClick={handleRestart}>Try Again 🔄</button>
            <button className="btn btn-secondary btn-child" onClick={onBack}>Menu</button>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {state.levelComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🌟</div>
          <h2 className="heading display-text" style={{ fontSize: 36 }}>Level {state.level + 1} Passed!</h2>
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
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Champion! All Levels Cleared!</h2>
          <p style={{ color: 'var(--color-primary)', fontSize: 24, fontWeight: 900 }}>Total Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🏆
          </button>
        </div>
      )}
    </div>
  )
}
