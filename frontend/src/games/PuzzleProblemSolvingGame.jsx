import { useState, useEffect } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const PUZZLE_MODES = [
  { id: 'jigsaw', name: 'Jigsaw Puzzle', emoji: '🧩', desc: 'Assemble puzzle pieces in the right grid slots!' },
  { id: 'missing_piece', name: 'Find Missing Piece', emoji: '🔍', desc: 'Find which piece completes the picture cutout!' },
  { id: 'match_object', name: 'Match Shadows', emoji: '🎯', desc: 'Match each object to its silhouette shadow!' },
  { id: 'maze', name: 'Maze Explorer', emoji: '🌀', desc: 'Guide the animal through the maze path!' },
  { id: 'spot_diff', name: 'Spot Differences', emoji: '🔎', desc: 'Tap the difference between the two pictures!' },
  { id: 'arrange_size', name: 'Arrange by Size', emoji: '📦', desc: 'Sort objects from Smallest to Largest!' },
  { id: 'category_sort', name: 'Color & Type Sorting', emoji: '🎨', desc: 'Sort items into matching color baskets!' },
]

const AGE_BANDS = [
  { level: 0, label: 'Age 3–4 (Easy)', gridCols: 2, pieces: 4 },
  { level: 1, label: 'Age 4–5 (Medium)', gridCols: 3, pieces: 6 },
  { level: 2, label: 'Age 5–6 (Hard)', gridCols: 4, pieces: 12 },
]

const PUZZLE_PICTURES = [
  { id: 1, title: 'Friendly Lion', emoji: '🦁', color: '#F97316' },
  { id: 2, title: 'Happy Elephant', emoji: '🐘', color: '#EC4899' },
  { id: 3, title: 'Space Rocket', emoji: '🚀', color: '#8B5CF6' },
  { id: 4, title: 'Playful Puppy', emoji: '🐶', color: '#10B981' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const INITIAL_STATE = (mode = 'jigsaw', ageLevel = 0, currentScore = 0) => {
  const age = AGE_BANDS[ageLevel] || AGE_BANDS[0]
  const piecesCount = age.pieces
  const initialPlaced = Array(piecesCount).fill(null)
  const pieceIds = Array.from({ length: piecesCount }, (_, i) => i)

  return {
    mode,
    ageLevel,
    score: currentScore,
    lives: 3,
    picIndex: 0,
    placed: initialPlaced,
    tray: shuffle([...pieceIds]),
    selectedPiece: null,
    mazePos: { r: 0, c: 0 },
    sortedItems: [],
    gameOver: false,
    modeComplete: false
  }
}

export default function PuzzleProblemSolvingGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('puzzle_suite', childId, INITIAL_STATE('jigsaw', 0))
  const [feedback, setFeedback] = useState(null)

  const activeModeObj = PUZZLE_MODES.find(m => m.id === state.mode) || PUZZLE_MODES[0]
  const activeAgeObj = AGE_BANDS[state.ageLevel] || AGE_BANDS[0]
  const currentPic = PUZZLE_PICTURES[state.picIndex % PUZZLE_PICTURES.length]

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  // 🧩 JIGSAW PUZZLE HANDLERS
  const handleJigsawPieceClick = (pieceId) => {
    if (state.selectedPiece === pieceId) {
      saveState({ ...state, selectedPiece: null })
    } else {
      saveState({ ...state, selectedPiece: pieceId })
    }
  }

  const handleJigsawSlotClick = (slotIdx) => {
    if (state.selectedPiece === null) return
    const pieceId = state.selectedPiece

    // Check if slotIdx matches correct piece position
    if (pieceId === slotIdx) {
      setFeedback('correct')
      const newPlaced = [...state.placed]
      newPlaced[slotIdx] = pieceId
      const newTray = state.tray.filter(p => p !== pieceId)
      const isComplete = newPlaced.every((p, idx) => p === idx)

      const newScore = state.score + 25

      saveState({
        ...state,
        placed: newPlaced,
        tray: newTray,
        selectedPiece: null,
        score: newScore
      })

      setTimeout(() => {
        setFeedback(null)
        if (isComplete) {
          saveState({ ...state, placed: newPlaced, tray: newTray, selectedPiece: null, score: newScore + 50, modeComplete: true })
        }
      }, 500)
    } else {
      setFeedback('wrong')
      const newLives = state.lives - 1
      setTimeout(() => {
        setFeedback(null)
        if (newLives <= 0) {
          saveState({ ...state, selectedPiece: null, lives: 0, gameOver: true })
        } else {
          saveState({ ...state, selectedPiece: null, lives: newLives })
        }
      }, 500)
    }
  }

  // 🔍 MISSING PIECE HANDLER
  const handleMissingPieceAnswer = (choice) => {
    if (feedback) return
    if (choice.isCorrect) {
      setFeedback('correct')
      const newScore = state.score + 30
      saveState({ ...state, score: newScore })
      setTimeout(() => {
        setFeedback(null)
        saveState({ ...state, picIndex: state.picIndex + 1, score: newScore, modeComplete: true })
      }, 800)
    } else {
      setFeedback('wrong')
      const newLives = state.lives - 1
      setTimeout(() => {
        setFeedback(null)
        if (newLives <= 0) {
          saveState({ ...state, lives: 0, gameOver: true })
        } else {
          saveState({ ...state, lives: newLives })
        }
      }, 600)
    }
  }

  // 📦 ARRANGE BY SIZE HANDLER
  const handleSizeItemClick = (sizeItem) => {
    if (state.sortedItems.includes(sizeItem.id)) return
    const expectedNextOrder = state.sortedItems.length + 1
    if (sizeItem.order === expectedNextOrder) {
      const newSorted = [...state.sortedItems, sizeItem.id]
      setFeedback('correct')
      const newScore = state.score + 20
      saveState({ ...state, sortedItems: newSorted, score: newScore })
      setTimeout(() => {
        setFeedback(null)
        if (newSorted.length === 4) {
          saveState({ ...state, sortedItems: newSorted, score: newScore + 40, modeComplete: true })
        }
      }, 500)
    } else {
      setFeedback('wrong')
      const newLives = state.lives - 1
      setTimeout(() => {
        setFeedback(null)
        if (newLives <= 0) {
          saveState({ ...state, lives: 0, gameOver: true })
        } else {
          saveState({ ...state, lives: newLives })
        }
      }, 500)
    }
  }

  const switchMode = (modeId) => {
    saveState(INITIAL_STATE(modeId, state.ageLevel, state.score))
  }

  const setAgeLevel = (lvl) => {
    saveState(INITIAL_STATE(state.mode, lvl, state.score))
  }

  const handleRestart = () => {
    saveState(INITIAL_STATE(state.mode, state.ageLevel, 0))
  }

  const handleFinish = () => {
    onComplete(state.score, 400, state.ageLevel + 1, 120)
    clearState()
  }

  return (
    <div className="game-container">
      {/* Header Bar */}
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 800 }}>{activeModeObj.emoji} {activeModeObj.name}</div>
          <div className="game-score-display">{state.score}</div>
        </div>
        <div className="game-lives">{Array.from({ length: 3 }, (_, i) => i < state.lives ? '❤️' : '🖤')}</div>
      </div>

      {/* Mode Tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', width: '100%',
        maxWidth: 520, paddingBottom: 6, scrollbarWidth: 'none'
      }}>
        {PUZZLE_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-full)',
              background: state.mode === m.id ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#FFFFFF',
              color: state.mode === m.id ? '#FFFFFF' : 'var(--text-primary)',
              border: `1.5px solid ${state.mode === m.id ? '#8B5CF6' : 'var(--color-border)'}`,
              fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: state.mode === m.id ? '0 4px 14px rgba(139,92,246,0.3)' : 'none'
            }}
          >
            {m.emoji} {m.name}
          </button>
        ))}
      </div>

      {/* Age Band / Difficulty Selector */}
      <div style={{ display: 'flex', gap: 8, margin: '2px 0 10px' }}>
        {AGE_BANDS.map(b => (
          <button
            key={b.level}
            onClick={() => setAgeLevel(b.level)}
            style={{
              padding: '6px 12px', borderRadius: 99,
              background: state.ageLevel === b.level ? 'rgba(249, 115, 22, 0.15)' : '#FFFFFF',
              color: state.ageLevel === b.level ? '#F97316' : 'var(--text-muted)',
              border: `1.5px solid ${state.ageLevel === b.level ? '#F97316' : 'var(--color-border)'}`,
              fontSize: 12, fontWeight: 800
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {!state.gameOver && !state.modeComplete && (
        <>
          {/* Feedback message */}
          {feedback && (
            <div style={{
              fontSize: 24, fontWeight: 900, animation: 'burst 0.4s ease',
              color: feedback === 'correct' ? '#10B981' : '#EF4444'
            }}>
              {feedback === 'correct' ? '🌟 Perfect Placement!' : '🙈 Try Another Piece!'}
            </div>
          )}

          {/* 🧩 MODE 1: JIGSAW PUZZLE */}
          {state.mode === 'jigsaw' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                {state.selectedPiece !== null ? 'Tap empty slot to place piece!' : 'Tap a piece below to select it!'}
              </p>

              {/* Jigsaw Target Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${activeAgeObj.gridCols}, 1fr)`,
                gap: 8,
                width: 280,
                height: 280,
                margin: '0 auto 20px',
                padding: 12,
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '3px dashed #8B5CF6',
                boxShadow: 'var(--shadow-card)'
              }}>
                {Array.from({ length: activeAgeObj.pieces }, (_, slotIdx) => {
                  const pieceInSlot = state.placed[slotIdx]
                  const isFilled = pieceInSlot !== null
                  return (
                    <div
                      key={slotIdx}
                      onClick={() => handleJigsawSlotClick(slotIdx)}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        background: isFilled ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'rgba(139, 92, 246, 0.08)',
                        border: `2px ${isFilled ? 'solid #8B5CF6' : 'dashed rgba(139,92,246,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isFilled ? 36 : 14, color: isFilled ? '#FFFFFF' : 'var(--text-muted)',
                        fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {isFilled ? currentPic.emoji : `Piece ${slotIdx + 1}`}
                    </div>
                  )
                })}
              </div>

              {/* Unplaced Piece Tray */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {state.tray.map((pieceId) => {
                  const isSelected = state.selectedPiece === pieceId
                  return (
                    <button
                      key={pieceId}
                      onClick={() => handleJigsawPieceClick(pieceId)}
                      style={{
                        width: 60, height: 60, borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'linear-gradient(135deg, #F97316, #EC4899)' : '#FFFFFF',
                        border: `2.5px solid ${isSelected ? '#F97316' : '#8B5CF6'}`,
                        color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                        fontSize: 28, fontWeight: 900, cursor: 'pointer',
                        transform: isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                        boxShadow: isSelected ? '0 8px 20px rgba(249,115,22,0.4)' : 'var(--shadow-card)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {currentPic.emoji}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🔍 MODE 2: FIND MISSING PIECE */}
          {state.mode === 'missing_piece' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Which cutout piece completes the picture?
              </p>

              <div style={{
                width: 180, height: 180, margin: '0 auto 20px', borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))',
                border: '3.5px dashed #EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 80, boxShadow: 'var(--shadow-card)'
              }}>
                {currentPic.emoji}
              </div>

              <div className="answer-grid">
                {[
                  { id: 'correct', emoji: currentPic.emoji, isCorrect: true },
                  { id: 'wrong1', emoji: '🍎', isCorrect: false },
                  { id: 'wrong2', emoji: '⚽', isCorrect: false },
                  { id: 'wrong3', emoji: '🚗', isCorrect: false },
                ].sort(() => 0.5 - Math.random()).map((choice) => (
                  <button
                    key={choice.id} className="answer-btn"
                    onClick={() => handleMissingPieceAnswer(choice)}
                    style={{ fontSize: 44 }}
                  >
                    {choice.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🎯 MODE 3: MATCH OBJECT SHADOWS */}
          {state.mode === 'match_object' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Match object to its silhouette shadow!
              </p>

              <div style={{
                fontSize: 90, filter: 'brightness(0) opacity(0.35)', margin: '12px 0'
              }}>
                {currentPic.emoji}
              </div>

              <div className="answer-grid">
                {[
                  { id: 'c', emoji: currentPic.emoji, isCorrect: true },
                  { id: 'w1', emoji: '🐱', isCorrect: false },
                  { id: 'w2', emoji: '🐻', isCorrect: false },
                  { id: 'w3', emoji: '🦊', isCorrect: false },
                ].sort(() => 0.5 - Math.random()).map((choice) => (
                  <button
                    key={choice.id} className="answer-btn"
                    onClick={() => handleMissingPieceAnswer(choice)}
                    style={{ fontSize: 44 }}
                  >
                    {choice.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 📦 MODE 6: ARRANGE BY SIZE */}
          {state.mode === 'arrange_size' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Tap items from Smallest ➔ Largest!
              </p>

              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'flex-end', minHeight: 140 }}>
                {[
                  { id: 's1', size: 32, order: 1, emoji: '🐻' },
                  { id: 's2', size: 48, order: 2, emoji: '🐻' },
                  { id: 's3', size: 64, order: 3, emoji: '🐻' },
                  { id: 's4', size: 80, order: 4, emoji: '🐻' },
                ].sort(() => 0.5 - Math.random()).map((item) => {
                  const isDone = state.sortedItems.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSizeItemClick(item)}
                      style={{
                        padding: 10, borderRadius: 'var(--radius-lg)',
                        background: isDone ? '#D1FAE5' : '#FFFFFF',
                        border: `3px solid ${isDone ? '#10B981' : '#F97316'}`,
                        fontSize: item.size, cursor: 'pointer',
                        boxShadow: 'var(--shadow-card)', opacity: isDone ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.emoji}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🎨 OTHER MODES FALLBACK: CATEGORY SORTING */}
          {(state.mode === 'maze' || state.mode === 'spot_diff' || state.mode === 'category_sort') && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Which category does {currentPic.emoji} belong to?
              </p>

              <div style={{ fontSize: 80, margin: '10px 0' }}>{currentPic.emoji}</div>

              <div className="answer-grid">
                {[
                  { id: 'cat1', text: '🐾 Animals', isCorrect: true },
                  { id: 'cat2', text: '🍎 Fruits', isCorrect: false },
                  { id: 'cat3', text: '🚗 Vehicles', isCorrect: false },
                  { id: 'cat4', text: '⭐ Shapes', isCorrect: false },
                ].map((choice) => (
                  <button
                    key={choice.id} className="answer-btn"
                    onClick={() => handleMissingPieceAnswer(choice)}
                    style={{ fontSize: 18 }}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Game Over Modal */}
      {state.gameOver && (
        <div className="celebration-overlay">
          <div className="star-burst">💔</div>
          <h2 className="heading display-text" style={{ fontSize: 32 }}>Out of Lives!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>Score: {state.score}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary btn-child" onClick={handleRestart}>Try Again 🔄</button>
            <button className="btn btn-secondary btn-child" onClick={onBack}>Menu</button>
          </div>
        </div>
      )}

      {/* Mode Complete Victory Modal */}
      {state.modeComplete && (
        <div className="celebration-overlay">
          <div className="star-burst">🧩</div>
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Puzzle Solved!</h2>
          <p style={{ color: '#8B5CF6', fontSize: 24, fontWeight: 900 }}>Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🎉
          </button>
        </div>
      )}
    </div>
  )
}
