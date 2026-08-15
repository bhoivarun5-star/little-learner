import { useState } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const STAGES = [
  { id: 1, shape: 'star', name: 'Star', emoji: '⭐', color: '#F59E0B', options: ['star', 'circle', 'triangle', 'square'] },
  { id: 2, shape: 'circle', name: 'Circle', emoji: '⭕', color: '#F97316', options: ['circle', 'square', 'heart', 'star'] },
  { id: 3, shape: 'triangle', name: 'Triangle', emoji: '🔺', color: '#EF4444', options: ['triangle', 'diamond', 'oval', 'circle'] },
  { id: 4, shape: 'heart', name: 'Heart', emoji: '❤️', color: '#EC4899', options: ['heart', 'star', 'circle', 'square'] },
  { id: 5, shape: 'square', name: 'Square', emoji: '🟦', color: '#3B82F6', options: ['square', 'triangle', 'diamond', 'heart'] },
  { id: 6, shape: 'diamond', name: 'Diamond', emoji: '💎', color: '#8B5CF6', options: ['diamond', 'circle', 'star', 'hexagon'] },
  { id: 7, shape: 'oval', name: 'Oval', emoji: '🥚', color: '#D97706', options: ['oval', 'circle', 'heart', 'triangle'] },
  { id: 8, shape: 'crescent', name: 'Crescent Moon', emoji: '🌙', color: '#10B981', options: ['crescent', 'star', 'oval', 'square'] },
  { id: 9, shape: 'hexagon', name: 'Hexagon', emoji: '🛑', color: '#6366F1', options: ['hexagon', 'diamond', 'square', 'star'] },
  { id: 10, shape: 'crown', name: 'Golden Crown', emoji: '👑', color: '#EAB308', options: ['crown', 'star', 'heart', 'diamond'] },
]

const ALL_SHAPES_MAP = {
  star: { name: 'Star', emoji: '⭐', color: '#F59E0B' },
  circle: { name: 'Circle', emoji: '⭕', color: '#F97316' },
  triangle: { name: 'Triangle', emoji: '🔺', color: '#EF4444' },
  heart: { name: 'Heart', emoji: '❤️', color: '#EC4899' },
  square: { name: 'Square', emoji: '🟦', color: '#3B82F6' },
  diamond: { name: 'Diamond', emoji: '💎', color: '#8B5CF6' },
  oval: { name: 'Oval', emoji: '🥚', color: '#D97706' },
  crescent: { name: 'Crescent Moon', emoji: '🌙', color: '#10B981' },
  hexagon: { name: 'Hexagon', emoji: '🛑', color: '#6366F1' },
  crown: { name: 'Golden Crown', emoji: '👑', color: '#EAB308' },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const INITIAL_STATE = (stageIdx = 0, currentScore = 0) => {
  const stage = STAGES[stageIdx] || STAGES[0]
  return {
    stageIdx,
    score: currentScore,
    lives: 3,
    selectedShape: null,
    matched: false,
    startTime: Date.now(),
    options: shuffle([...stage.options]),
    gameOver: false,
    stageComplete: false,
    gameComplete: false
  }
}

export default function ShapeMatchDragGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('shape_drag_match', childId, INITIAL_STATE(0))
  const [draggedShapeKey, setDraggedShapeKey] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong'
  const [isDragOver, setIsDragOver] = useState(false)

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const currentStage = STAGES[state.stageIdx] || STAGES[0]

  const processDropAttempt = (droppedKey) => {
    if (state.matched || state.gameOver || state.stageComplete || state.gameComplete) return

    const isCorrect = droppedKey === currentStage.shape

    if (isCorrect) {
      setFeedback('correct')
      const newScore = state.score + 25

      saveState({ ...state, selectedShape: null, matched: true, score: newScore })

      setTimeout(() => {
        setFeedback(null)
        if (state.stageIdx < STAGES.length - 1) {
          saveState({ ...state, selectedShape: null, matched: true, score: newScore, stageComplete: true })
        } else {
          saveState({ ...state, selectedShape: null, matched: true, score: newScore, gameComplete: true })
        }
      }, 700)
    } else {
      setFeedback('wrong')
      const newLives = state.lives - 1

      if (newLives <= 0) {
        setTimeout(() => {
          setFeedback(null)
          saveState({ ...state, selectedShape: null, lives: 0, gameOver: true })
        }, 500)
      } else {
        setTimeout(() => {
          setFeedback(null)
          saveState({ ...state, selectedShape: null, lives: newLives })
        }, 600)
      }
    }
  }

  // Handle HTML5 Drag and Drop events
  const handleDragStart = (e, key) => {
    setDraggedShapeKey(key)
    e.dataTransfer.setData('text/plain', key)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const key = e.dataTransfer.getData('text/plain') || draggedShapeKey
    if (key) processDropAttempt(key)
  }

  // Handle Tap / Click selection
  const handleOptionClick = (key) => {
    if (state.selectedShape === key) {
      saveState({ ...state, selectedShape: null })
    } else {
      saveState({ ...state, selectedShape: key })
    }
  }

  const handleTargetSlotClick = () => {
    if (state.selectedShape) {
      processDropAttempt(state.selectedShape)
    }
  }

  const handleNextStage = () => {
    saveState(INITIAL_STATE(state.stageIdx + 1, state.score))
  }

  const handleRestart = () => {
    saveState(INITIAL_STATE(0, 0))
  }

  const handleFinish = () => {
    const timeTaken = Math.round((Date.now() - (state.startTime || Date.now())) / 1000)
    onComplete(state.score, 250, state.stageIdx + 1, timeTaken)
    clearState()
  }

  return (
    <div className="game-container">
      {/* Header Bar */}
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 800 }}>STAGE {state.stageIdx + 1} OF 10</div>
          <div className="game-score-display">{state.score}</div>
        </div>
        <div className="game-lives">{Array.from({ length: 3 }, (_, i) => i < state.lives ? '❤️' : '🖤')}</div>
      </div>

      {/* Stage Progress Pips */}
      <div style={{ display: 'flex', gap: 6, width: '100%', maxWidth: 400, padding: '0 8px' }}>
        {STAGES.map((s, idx) => (
          <div
            key={s.id}
            style={{
              flex: 1, height: 8, borderRadius: 99,
              background: idx < state.stageIdx ? '#10B981' : idx === state.stageIdx ? '#F97316' : 'rgba(249,115,22,0.15)',
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>

      {!state.gameOver && !state.stageComplete && !state.gameComplete && (
        <>
          <p style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, textAlign: 'center', margin: '4px 0' }}>
            {state.selectedShape
              ? `Now tap the empty slot to drop ${ALL_SHAPES_MAP[state.selectedShape]?.name}!`
              : 'Drag & Drop the shape into the empty space!'}
          </p>

          {/* Target Empty Cutout Slot */}
          <div style={{ textAlign: 'center', width: '100%', maxWidth: 360 }}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTargetSlotClick}
              style={{
                width: 170,
                height: 170,
                margin: '0 auto',
                borderRadius: 'var(--radius-xl)',
                border: `3.5px dashed ${state.matched ? '#10B981' : isDragOver ? '#F97316' : feedback === 'wrong' ? '#EF4444' : 'rgba(249, 115, 22, 0.4)'}`,
                background: state.matched
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isDragOver
                  ? 'rgba(249, 115, 22, 0.15)'
                  : '#FFFFFF',
                boxShadow: isDragOver ? '0 0 25px rgba(249, 115, 22, 0.3)' : 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: state.selectedShape ? 'pointer' : 'default',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: state.matched ? 'scale(1.08)' : isDragOver ? 'scale(1.04)' : 'scale(1)'
              }}
            >
              {state.matched ? (
                <div style={{ fontSize: 80, animation: 'burst 0.5s ease' }}>{currentStage.emoji}</div>
              ) : (
                <>
                  <div style={{
                    fontSize: 72,
                    opacity: 0.25,
                    filter: 'grayscale(100%)',
                    userSelect: 'none'
                  }}>
                    {currentStage.emoji}
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    marginTop: 6
                  }}>
                    EMPTY SLOT
                  </div>
                </>
              )}
            </div>
            <h3 className="heading display-text" style={{ fontSize: 24, marginTop: 12 }}>
              Target: {currentStage.name}
            </h3>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div style={{
              fontSize: 24, fontWeight: 900, animation: 'burst 0.4s ease',
              color: feedback === 'correct' ? '#10B981' : '#EF4444'
            }}>
              {feedback === 'correct' ? '🌟 Perfect Match!' : '🙈 Try Another Shape!'}
            </div>
          )}

          {/* 4 Draggable Option Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            width: '100%',
            maxWidth: 420
          }}>
            {state.options.map((shapeKey) => {
              const item = ALL_SHAPES_MAP[shapeKey]
              const isSelected = state.selectedShape === shapeKey
              return (
                <div
                  key={shapeKey}
                  draggable={!state.matched}
                  onDragStart={(e) => handleDragStart(e, shapeKey)}
                  onClick={() => handleOptionClick(shapeKey)}
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #F97316, #EC4899)' : '#FFFFFF',
                    border: `2.5px solid ${isSelected ? '#F97316' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 8px',
                    textAlign: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    transform: isSelected ? 'scale(1.1) translateY(-6px)' : 'scale(1)',
                    boxShadow: isSelected ? '0 10px 24px rgba(249, 115, 22, 0.35)' : 'var(--shadow-card)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  className="module-card"
                >
                  <div style={{ fontSize: 44 }}>{item.emoji}</div>
                  <div style={{
                    fontSize: 12, fontWeight: 800, marginTop: 6,
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)'
                  }}>
                    {item.name}
                  </div>
                </div>
              )
            })}
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

      {/* Stage Complete Modal */}
      {state.stageComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🌟</div>
          <h2 className="heading display-text" style={{ fontSize: 36 }}>Stage {state.stageIdx + 1} Cleared!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 20, fontWeight: 800 }}>Score: {state.score}</p>
          <button className="btn btn-primary btn-child" style={{ marginTop: 16 }} onClick={handleNextStage}>
            Stage {state.stageIdx + 2} →
          </button>
        </div>
      )}

      {/* Game Complete Victory Modal */}
      {state.gameComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🏆</div>
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Shape Match Master!</h2>
          <p style={{ color: '#F97316', fontSize: 24, fontWeight: 900 }}>10/10 Stages Cleared! Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🎉
          </button>
        </div>
      )}
    </div>
  )
}
