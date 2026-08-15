import { useState, useEffect } from 'react'
import { useGameStatePersistence } from './useGameState.js'

const PHONICS_WORDS = [
  { letter: 'A', word: 'Apple', emoji: '🍎', lowercase: 'a' },
  { letter: 'B', word: 'Ball', emoji: '⚽', lowercase: 'b' },
  { letter: 'C', word: 'Cat', emoji: '🐱', lowercase: 'c' },
  { letter: 'D', word: 'Dog', emoji: '🐶', lowercase: 'd' },
  { letter: 'E', word: 'Elephant', emoji: '🐘', lowercase: 'e' },
  { letter: 'F', word: 'Fish', emoji: '🐟', lowercase: 'f' },
  { letter: 'G', word: 'Grapes', emoji: '🍇', lowercase: 'g' },
  { letter: 'H', word: 'Hat', emoji: '🎩', lowercase: 'h' },
  { letter: 'I', word: 'Ice Cream', emoji: '🍦', lowercase: 'i' },
  { letter: 'J', word: 'Juice', emoji: '🧃', lowercase: 'j' },
  { letter: 'K', word: 'Kite', emoji: '🪁', lowercase: 'k' },
  { letter: 'L', word: 'Lion', emoji: '🦁', lowercase: 'l' },
  { letter: 'M', word: 'Monkey', emoji: '🐒', lowercase: 'm' },
  { letter: 'N', word: 'Nest', emoji: '🪹', lowercase: 'n' },
  { letter: 'O', word: 'Owl', emoji: '🦉', lowercase: 'o' },
  { letter: 'P', word: 'Penguin', emoji: '🐧', lowercase: 'p' },
  { letter: 'Q', word: 'Queen', emoji: '👑', lowercase: 'q' },
  { letter: 'R', word: 'Rabbit', emoji: '🐰', lowercase: 'r' },
  { letter: 'S', word: 'Sun', emoji: '☀️', lowercase: 's' },
  { letter: 'T', word: 'Tiger', emoji: '🐯', lowercase: 't' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️', lowercase: 'u' },
  { letter: 'V', word: 'Violin', emoji: '🎻', lowercase: 'v' },
  { letter: 'W', word: 'Watermelon', emoji: '🍉', lowercase: 'w' },
  { letter: 'X', word: 'Xylophone', emoji: '🎼', lowercase: 'x' },
  { letter: 'Y', word: 'Yo-Yo', emoji: '🪀', lowercase: 'y' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓', lowercase: 'z' },
]

const MODES = [
  { id: 'balloon', name: 'Pop the Letter', emoji: '🎈', desc: 'Pop the correct floating letter balloon!' },
  { id: 'case_match', name: 'Uppercase ↔ Lowercase', emoji: '🔤', desc: 'Match uppercase with lowercase letters' },
  { id: 'first_letter', name: 'First Letter Phonics', emoji: '🐱', desc: 'Find the starting letter for words' },
  { id: 'listen_choose', name: 'Listen & Choose', emoji: '🔊', desc: 'Listen to the sound & pick the letter' },
  { id: 'sequencing', name: 'Alphabet Sequence', emoji: '🧩', desc: 'Arrange letters in correct order' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    window.speechSynthesis.speak(utterance)
  }
}

const INITIAL_STATE = (mode = 'balloon', level = 0, currentScore = 0) => ({
  mode,
  level,
  score: currentScore,
  lives: 3,
  qIndex: 0,
  answered: null,
  seqSlots: [],
  seqOptions: [],
  gameOver: false,
  modeComplete: false
})

export default function AlphabetPhonicsSuiteGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored, clearState } = useGameStatePersistence('alphabet_phonics_suite', childId, INITIAL_STATE('balloon', 0))
  const [feedback, setFeedback] = useState(null)

  const activeModeObj = MODES.find(m => m.id === state.mode) || MODES[0]
  const currentPhonics = PHONICS_WORDS[state.qIndex % PHONICS_WORDS.length]

  // Auto-speak target letter in Audio Listener mode
  useEffect(() => {
    if (state.mode === 'listen_choose' && currentPhonics && !state.answered) {
      speakText(`Find the letter ${currentPhonics.letter}`)
    }
  }, [state.mode, state.qIndex, state.answered])

  // Setup Sequencing Puzzle choices for current question
  useEffect(() => {
    if (state.mode === 'sequencing' && !state.seqOptions.length) {
      const startIdx = (state.qIndex * 4) % 22
      const targetSeq = PHONICS_WORDS.slice(startIdx, startIdx + 4).map(p => p.letter)
      saveState({
        ...state,
        seqSlots: Array(4).fill(null),
        seqOptions: shuffle([...targetSeq]),
        targetSeq
      })
    }
  }, [state.mode, state.qIndex])

  if (!restored) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>

  const handleAnswer = (answer, targetKey) => {
    if (state.answered !== null || state.gameOver || state.modeComplete) return
    const isCorrect = answer === targetKey

    if (isCorrect) {
      speakText(`Correct! ${answer}`)
      setFeedback('correct')
      const newScore = state.score + 20

      saveState({ ...state, answered: answer, score: newScore })

      setTimeout(() => {
        setFeedback(null)
        const nextQ = state.qIndex + 1

        if (nextQ >= 6) {
          saveState({ ...state, answered: null, qIndex: 0, score: newScore, modeComplete: true })
        } else {
          saveState({ ...state, answered: null, qIndex: nextQ, score: newScore })
        }
      }, 750)
    } else {
      speakText('Try again')
      setFeedback('wrong')
      const newLives = state.lives - 1

      if (newLives <= 0) {
        setTimeout(() => {
          setFeedback(null)
          saveState({ ...state, answered: null, lives: 0, gameOver: true })
        }, 600)
      } else {
        setTimeout(() => {
          setFeedback(null)
          saveState({ ...state, answered: null, lives: newLives })
        }, 600)
      }
    }
  }

  // Sequencing Puzzle Slot Placement
  const handleSeqPlace = (letter) => {
    if (!state.seqSlots || state.answered) return
    const emptyIdx = state.seqSlots.findIndex(s => s === null)
    if (emptyIdx === -1) return

    const newSlots = [...state.seqSlots]
    newSlots[emptyIdx] = letter
    const newOptions = state.seqOptions.filter(l => l !== letter)

    const isFull = newSlots.every(Boolean)

    if (isFull) {
      const isCorrect = newSlots.join('') === (state.targetSeq || []).join('')
      if (isCorrect) {
        speakText('Great job! In order!')
        setFeedback('correct')
        const newScore = state.score + 30
        saveState({ ...state, seqSlots: newSlots, seqOptions: newOptions, score: newScore, answered: 'correct' })
        setTimeout(() => {
          setFeedback(null)
          const nextQ = state.qIndex + 1
          const startIdx = (nextQ * 4) % 22
          const nextSeq = PHONICS_WORDS.slice(startIdx, startIdx + 4).map(p => p.letter)
          if (nextQ >= 5) {
            saveState({ ...state, answered: null, qIndex: 0, score: newScore, modeComplete: true })
          } else {
            saveState({ ...state, answered: null, qIndex: nextQ, score: newScore, seqSlots: Array(4).fill(null), seqOptions: shuffle([...nextSeq]), targetSeq: nextSeq })
          }
        }, 800)
      } else {
        speakText('Oops, try arranging them again!')
        setFeedback('wrong')
        setTimeout(() => {
          setFeedback(null)
          saveState({ ...state, seqSlots: Array(4).fill(null), seqOptions: shuffle([...(state.targetSeq || [])]) })
        }, 700)
      }
    } else {
      saveState({ ...state, seqSlots: newSlots, seqOptions: newOptions })
    }
  }

  const switchMode = (newModeId) => {
    saveState(INITIAL_STATE(newModeId, 0, state.score))
  }

  const handleRestart = () => {
    saveState(INITIAL_STATE(state.mode, 0, 0))
  }

  const handleFinish = () => {
    onComplete(state.score, 300, 1, 120)
    clearState()
  }

  // Generate 4 options for multiple choice modes
  const generateLetterOptions = (correctLetter) => {
    const distractors = PHONICS_WORDS.filter(p => p.letter !== correctLetter)
    const picked = shuffle(distractors).slice(0, 3).map(p => p.letter)
    return shuffle([correctLetter, ...picked])
  }

  return (
    <div className="game-container">
      {/* Header Bar */}
      <div className="game-header">
        <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto' }} onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#F97316', fontWeight: 800 }}>{activeModeObj.emoji} {activeModeObj.name}</div>
          <div className="game-score-display">{state.score}</div>
        </div>
        <div className="game-lives">{Array.from({ length: 3 }, (_, i) => i < state.lives ? '❤️' : '🖤')}</div>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', width: '100%',
        maxWidth: 500, paddingBottom: 6, scrollbarWidth: 'none'
      }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-full)',
              background: state.mode === m.id ? 'linear-gradient(135deg, #F97316, #EC4899)' : '#FFFFFF',
              color: state.mode === m.id ? '#FFFFFF' : 'var(--text-primary)',
              border: `1.5px solid ${state.mode === m.id ? '#F97316' : 'var(--color-border)'}`,
              fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: state.mode === m.id ? '0 4px 14px rgba(249,115,22,0.3)' : 'none'
            }}
          >
            {m.emoji} {m.name}
          </button>
        ))}
      </div>

      {!state.gameOver && !state.modeComplete && (
        <>
          {/* Feedback message */}
          {feedback && (
            <div style={{
              fontSize: 26, fontWeight: 900, animation: 'burst 0.4s ease',
              color: feedback === 'correct' ? '#10B981' : '#EF4444'
            }}>
              {feedback === 'correct' ? '🌟 Super Job!' : '🙈 Try Again!'}
            </div>
          )}

          {/* 🎈 MODE 1: POP THE BALLOON */}
          {state.mode === 'balloon' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Pop the balloon with Letter <span style={{ color: '#F97316', fontSize: 26 }}>"{currentPhonics.letter}"</span>!
              </p>

              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center',
                padding: 20, minHeight: 220
              }}>
                {generateLetterOptions(currentPhonics.letter).map((letOpt, idx) => {
                  const colors = ['#F97316', '#EC4899', '#8B5CF6', '#10B981']
                  const bg = colors[idx % colors.length]
                  return (
                    <button
                      key={letOpt}
                      onClick={() => handleAnswer(letOpt, currentPhonics.letter)}
                      style={{
                        width: 90, height: 110,
                        borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                        background: `linear-gradient(135deg, ${bg}, ${bg}DD)`,
                        color: '#FFFFFF', fontSize: 36, fontWeight: 900,
                        border: 'none', boxShadow: `0 10px 24px ${bg}55`,
                        cursor: 'pointer', animation: 'float 3s ease-in-out infinite',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', transition: 'all 0.2s ease'
                      }}
                    >
                      {letOpt}
                      <span style={{ position: 'absolute', bottom: -12, fontSize: 12, color: 'var(--text-muted)' }}>🎈</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🔤 MODE 2: UPPERCASE ↔ LOWERCASE MATCH */}
          {state.mode === 'case_match' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Which lowercase matches <span style={{ color: '#EC4899', fontSize: 32, fontFamily: 'Baloo 2' }}>"{currentPhonics.letter}"</span>?
              </p>

              <div style={{
                fontSize: 90, fontFamily: 'Baloo 2', fontWeight: 900,
                color: '#EC4899', filter: 'drop-shadow(0 6px 12px rgba(236,72,153,0.25))',
                margin: '10px 0'
              }}>
                {currentPhonics.letter}
              </div>

              <div className="answer-grid">
                {shuffle([currentPhonics.lowercase, 'e', 'g', 'k']).slice(0, 4).map((lowOpt) => {
                  let cls = 'answer-btn'
                  if (state.answered) {
                    if (lowOpt === currentPhonics.lowercase) cls += ' correct'
                    else if (lowOpt === state.answered) cls += ' wrong'
                  }
                  return (
                    <button
                      key={lowOpt} className={cls}
                      onClick={() => handleAnswer(lowOpt, currentPhonics.lowercase)}
                    >
                      {lowOpt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🐱 MODE 3: FIRST LETTER PHONICS */}
          {state.mode === 'first_letter' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Which letter starts this word?
              </p>

              <div className="emoji-display">{currentPhonics.emoji}</div>
              <h2 className="heading display-text" style={{ fontSize: 36, marginTop: 8, color: '#8B5CF6' }}>
                _ {currentPhonics.word.slice(1)}
              </h2>

              <div className="answer-grid" style={{ marginTop: 16 }}>
                {generateLetterOptions(currentPhonics.letter).map((letOpt) => {
                  let cls = 'answer-btn'
                  if (state.answered) {
                    if (letOpt === currentPhonics.letter) cls += ' correct'
                    else if (letOpt === state.answered) cls += ' wrong'
                  }
                  return (
                    <button
                      key={letOpt} className={cls}
                      onClick={() => handleAnswer(letOpt, currentPhonics.letter)}
                    >
                      {letOpt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🔊 MODE 4: LISTEN & CHOOSE */}
          {state.mode === 'listen_choose' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Listen & tap the correct letter!
              </p>

              <button
                className="btn btn-primary"
                onClick={() => speakText(`Find the letter ${currentPhonics.letter}`)}
                style={{ padding: '14px 28px', margin: '12px 0 20px', fontSize: 18 }}
              >
                🔊 Listen Sound Again
              </button>

              <div className="answer-grid">
                {generateLetterOptions(currentPhonics.letter).map((letOpt) => {
                  let cls = 'answer-btn'
                  if (state.answered) {
                    if (letOpt === currentPhonics.letter) cls += ' correct'
                    else if (letOpt === state.answered) cls += ' wrong'
                  }
                  return (
                    <button
                      key={letOpt} className={cls}
                      onClick={() => handleAnswer(letOpt, currentPhonics.letter)}
                    >
                      {letOpt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🧩 MODE 5: ALPHABET SEQUENCING PUZZLE */}
          {state.mode === 'sequencing' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Arrange letters in correct order!
              </p>

              {/* Target Order Slots */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
                {(state.seqSlots || [null, null, null, null]).map((slotVal, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 68, height: 68, borderRadius: 'var(--radius-md)',
                      border: `2.5px dashed ${slotVal ? '#10B981' : '#F97316'}`,
                      background: slotVal ? 'rgba(16, 185, 129, 0.12)' : '#FFFFFF',
                      fontSize: 32, fontWeight: 900, color: '#F97316',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--shadow-card)'
                    }}
                  >
                    {slotVal || '?'}
                  </div>
                ))}
              </div>

              {/* Letter Options */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {(state.seqOptions || []).map((letterOpt) => (
                  <button
                    key={letterOpt}
                    onClick={() => handleSeqPlace(letterOpt)}
                    style={{
                      width: 64, height: 64, borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #F97316, #EC4899)',
                      color: '#FFFFFF', fontSize: 32, fontWeight: 900,
                      border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-card)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {letterOpt}
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
          <div className="star-burst">🏆</div>
          <h2 className="heading display-text" style={{ fontSize: 38 }}>Phonics Master!</h2>
          <p style={{ color: '#F97316', fontSize: 24, fontWeight: 900 }}>Total Score: {state.score}</p>
          <button className="btn btn-success btn-child" style={{ marginTop: 16 }} onClick={handleFinish}>
            Claim Victory 🎉
          </button>
        </div>
      )}
    </div>
  )
}
