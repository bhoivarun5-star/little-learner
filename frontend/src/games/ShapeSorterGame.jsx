import { useState } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const SHAPES_BY_LEVEL = [
  ['circle', 'square', 'triangle'],
  ['circle', 'square', 'triangle', 'rectangle', 'star'],
  ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'diamond', 'oval'],
]

const SHAPE_EMOJI = {
  circle: '⭕', square: '⬛', triangle: '🔺', rectangle: '🟦',
  star: '⭐', heart: '❤️', diamond: '💎', oval: '🥚'
}

const SHAPE_COLORS = {
  circle: '#F97316', square: '#EC4899', triangle: '#8B5CF6', rectangle: '#3B82F6',
  star: '#F59E0B', heart: '#EF4444', diamond: '#10B981', oval: '#D97706'
}

function shuffleArr(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

const INITIAL_STATE = (level = 0, currentScore = 0) => {
  const shapes = SHAPES_BY_LEVEL[level] || SHAPES_BY_LEVEL[0]
  const shuffled = shuffleArr(shapes)
  return {
    level,
    shapes,
    tray: shuffled,
    slots: shapes.map(() => null),
    score: currentScore,
    dragging: null,
    startTime: Date.now(),
    levelComplete: false,
    gameComplete: false
  }
}

export default function ShapeSorterGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('shape_sorter', childId, INITIAL_STATE(0))
  const [wrongFlash, setWrongFlash] = useState(false)

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const handleTap = (targetShape, fromTray) => {
    if (state.levelComplete || state.gameComplete) return

    if (!state.dragging) {
      if (fromTray) saveState({ ...state, dragging: targetShape })
    } else {
      if (!fromTray) {
        // Tapped a target slot
        const slotIdx = state.shapes.indexOf(targetShape)
        const correct = state.shapes[slotIdx] === state.dragging

        if (correct) {
          const newSlots = [...state.slots]
          newSlots[slotIdx] = state.dragging
          const newTray = state.tray.filter(s => s !== state.dragging)
          const newScore = state.score + 25
          const isLevelDone = newSlots.every(Boolean)

          if (isLevelDone) {
            if (state.level < SHAPES_BY_LEVEL.length - 1) {
              saveState({ ...state, slots: newSlots, tray: newTray, score: newScore, dragging: null, levelComplete: true })
            } else {
              saveState({ ...state, slots: newSlots, tray: newTray, score: newScore, dragging: null, gameComplete: true })
            }
          } else {
            saveState({ ...state, slots: newSlots, tray: newTray, score: newScore, dragging: null })
          }
        } else {
          // Wrong slot tap
          setWrongFlash(true)
          setTimeout(() => setWrongFlash(false), 500)
          saveState({ ...state, dragging: null })
        }
      } else {
        // Select different shape from tray
        saveState({ ...state, dragging: targetShape })
      }
    }
  }

  const handleNextLevel = () => {
    saveState(INITIAL_STATE(state.level + 1, state.score))
  }

  const handleFinish = () => {
    const timeTaken = Math.round((Date.now() - (state.startTime || Date.now())) / 1000)
    onComplete(state.score, 400, state.level + 1, timeTaken)
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
        <div style={{ width: 60 }} />
      </div>

      {!state.levelComplete && !state.gameComplete && (
        <>
          <p style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, textAlign: 'center' }}>
            {state.dragging ? `Now tap the matching slot for ${state.dragging.toUpperCase()}!` : 'Tap a shape below to pick it up!'}
          </p>

          {/* Target slots */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 380 }}>
            {state.shapes.map((shape, i) => {
              const isFilled = Boolean(state.slots[i])
              return (
                <button
                  key={shape}
                  onClick={() => !isFilled && handleTap(shape, false)}
                  style={{
                    width: 84, height: 84,
                    borderRadius: 'var(--radius-lg)',
                    border: `3px dashed ${isFilled ? SHAPE_COLORS[shape] : wrongFlash ? '#EF4444' : 'rgba(249,115,22,0.3)'}`,
                    background: isFilled ? `${SHAPE_COLORS[shape]}22` : '#FFFFFF',
                    fontSize: 40, cursor: isFilled ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isFilled ? SHAPE_EMOJI[shape] : <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 800 }}>?</span>}
                </button>
              )
            })}
          </div>

          {/* Tray of shapes to place */}
          <div style={{
            display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
            padding: '16px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)',
            marginTop: 10
          }}>
            {state.tray.map((shape) => {
              const isSelected = state.dragging === shape
              return (
                <button
                  key={shape}
                  onClick={() => handleTap(shape, true)}
                  style={{
                    width: 76, height: 76,
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'linear-gradient(135deg, #F97316, #EC4899)' : 'rgba(249,115,22,0.06)',
                    border: `2.5px solid ${isSelected ? '#F97316' : 'var(--color-border)'}`,
                    fontSize: 40, cursor: 'pointer',
                    transform: isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                    boxShadow: isSelected ? '0 8px 20px rgba(249,115,22,0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {SHAPE_EMOJI[shape]}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Level Complete Modal */}
      {state.levelComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🌟</div>
          <h2 className="heading display-text" style={{ fontSize: 36 }}>Level {state.level + 1} Sorted!</h2>
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
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Shape Genius!</h2>
          <p style={{ color: '#F97316', fontSize: 24, fontWeight: 900 }}>Total Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🏆
          </button>
        </div>
      )}
    </div>
  )
}
