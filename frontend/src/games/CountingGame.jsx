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
  return { count, emoji, options: [...opts].sort(() => Math.random() - 0.5) }
}

const INITIAL_STATE = (level = 0, currentScore = 0) => {
  const lvlConfig = LEVELS[level] || LEVELS[0]
  return {
    level,
    qIndex: 0,
    score: currentScore,
    lives: 3,
    answered: null,
    startTime: Date.now(),
    questions: Array.from({ length: lvlConfig.questions }, () => mkQuestion(lvlConfig.max, lvlConfig.emoji)),
    gameOver: false,
    levelComplete: false,
    gameComplete: false
  }
}

export default function CountingGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('counting', childId, INITIAL_STATE(0))
  const [tapped, setTapped] = useState(0)

  useEffect(() => { setTapped(0) }, [state.qIndex, state.level])

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const q = state.questions?.[state.qIndex]

  const handleAnswer = (opt) => {
    if (state.answered !== null || state.gameOver || state.levelComplete || state.gameComplete) return
    const correct = opt === q.count
    const newScore = correct ? state.score + 15 : state.score
    const newLives = correct ? state.lives : state.lives - 1

    saveState({ ...state, answered: opt, score: newScore, lives: newLives })

    setTimeout(() => {
      if (newLives <= 0) {
        saveState({ ...state, answered: null, lives: 0, gameOver: true })
        return
      }

      const nextIdx = state.qIndex + 1
      if (nextIdx >= (state.questions?.length || 0)) {
        if (state.level < LEVELS.length - 1) {
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
    onComplete(state.score, 330, state.level + 1, timeTaken)
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
          <p style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: 20 }}>
            Tap & Count the {q.emoji}!
          </p>

          {/* Tappable items */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center',
            maxWidth: 340, padding: '12px 20px', background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }}>
            {Array.from({ length: q.count }, (_, i) => (
              <button
                key={i}
                onClick={() => setTapped(t => Math.min(t + 1, q.count))}
                style={{
                  fontSize: 44, background: 'none', border: 'none',
                  transform: i < tapped ? 'scale(0.82)' : 'scale(1)',
                  opacity: i < tapped ? 0.45 : 1,
                  transition: 'all 0.15s ease', cursor: 'pointer'
                }}
              >{q.emoji}</button>
            ))}
          </div>

          <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
            {tapped > 0 ? (
              <div style={{ fontFamily: 'Baloo 2', fontSize: 36, fontWeight: 900, color: '#F97316' }}>
                Counted: {tapped}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                Tap items to count out loud!
              </div>
            )}
          </div>

          <div className="answer-grid">
            {q.options.map((opt) => {
              let cls = 'answer-btn'
              if (state.answered !== null) {
                if (opt === q.count) cls += ' correct'
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
          <h2 className="heading display-text" style={{ fontSize: 36 }}>Level {state.level + 1} Done!</h2>
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
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Super Counter! All Levels Done!</h2>
          <p style={{ color: '#F97316', fontSize: 24, fontWeight: 900 }}>Total Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🏆
          </button>
        </div>
      )}
    </div>
  )
}
