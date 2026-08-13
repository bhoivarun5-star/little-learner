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
  circle: '#FF6B6B', square: '#4ECDC4', triangle: '#FFE66D', rectangle: '#A29BFE',
  star: '#FD79A8', heart: '#FF9F43', diamond: '#6C63FF', oval: '#55EFC4'
}

function shuffleArr(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

const INITIAL_STATE = (level = 0) => {
  const shapes = SHAPES_BY_LEVEL[level]
  const shuffled = shuffleArr(shapes)
  return { level, shapes, tray: shuffled, slots: shapes.map(() => null), score: 0, dragging: null, complete: false, startTime: Date.now() }
}

export default function ShapeSorterGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('shape_sorter', childId, INITIAL_STATE(0))
  const [dragOver, setDragOver] = useState(null)

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const handleTap = (shape, fromTray) => {
    // On mobile: tap shape then tap slot
    if (!state.dragging) {
      if (fromTray) saveState({ ...state, dragging: shape })
    } else {
      if (!fromTray) {
        // slot tap - try to place
        const slotIdx = state.shapes.indexOf(shape)
        const correct = state.shapes[slotIdx] === state.dragging
        if (correct) {
          const newSlots = [...state.slots]
          newSlots[slotIdx] = state.dragging
          const newTray = state.tray.filter(s => s !== state.dragging)
          const newScore = state.score + 25
          const complete = newSlots.every(Boolean)
          const ns = { ...state, slots: newSlots, tray: newTray, score: newScore, dragging: null, complete }
          saveState(ns)
          if (complete) {
            const timeTaken = Math.round((Date.now() - state.startTime) / 1000)
            if (state.level < SHAPES_BY_LEVEL.length - 1) {
              setTimeout(() => saveState(INITIAL_STATE(state.level + 1)), 1500)
            } else {
              onComplete(newScore, state.shapes.length * 25, state.level + 1, timeTaken)
              clearState()
            }
          }
        } else {
          saveState({ ...state, dragging: null }) // wrong slot
        }
      } else {
        saveState({ ...state, dragging: shape }) // select different
      }
    }
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>LEVEL {state.level + 1}</div>
          <div className="game-score-display">{state.score}</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 16 }}>
        {state.dragging ? `Place the ${state.dragging}!` : 'Tap a shape to pick it up!'}
      </p>

      {/* Target slots */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 360 }}>
        {state.shapes.map((shape, i) => (
          <button
            key={shape}
            onClick={() => !state.slots[i] && handleTap(shape, false)}
            style={{
              width: 80, height: 80,
              borderRadius: 'var(--radius-lg)',
              border: `3px dashed ${state.slots[i] ? SHAPE_COLORS[shape] : dragOver === shape ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'}`,
              background: state.slots[i] ? `${SHAPE_COLORS[shape]}33` : 'rgba(255,255,255,0.03)',
              fontSize: 36, cursor: state.slots[i] ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            {state.slots[i] ? SHAPE_EMOJI[shape] : <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>?</span>}
          </button>
        ))}
      </div>

      {/* Tray of shapes to place */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {state.tray.map((shape) => (
          <button
            key={shape}
            onClick={() => handleTap(shape, true)}
            style={{
              width: 72, height: 72,
              borderRadius: 'var(--radius-md)',
              background: state.dragging === shape ? `${SHAPE_COLORS[shape]}55` : 'var(--color-card)',
              border: `2px solid ${state.dragging === shape ? SHAPE_COLORS[shape] : 'var(--color-border)'}`,
              fontSize: 36, cursor: 'pointer',
              transform: state.dragging === shape ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {SHAPE_EMOJI[shape]}
          </button>
        ))}
      </div>

      {state.complete && (
        <div className="celebration-overlay">
          <div className="star-burst">🌟</div>
          <h2 className="heading display-text">Level {state.level + 1} Complete!</h2>
          <p style={{ color: 'var(--color-accent)', fontSize: 20, fontWeight: 800 }}>Score: {state.score}</p>
        </div>
      )}
    </div>
  )
}
