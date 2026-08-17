import React, { useState, useEffect, useRef } from 'react'
import { useGameStatePersistence } from './useGameState.js'

// ─── Web Audio Synthesizer Sound Effects ──────────────────────────────────
const playSoundEffect = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === 'correct') {
      // Happy ascending chime (C5 - E5 - G5 - C6)
      const freqs = [523.25, 659.25, 783.99, 1046.50]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.08)
        osc.stop(ctx.currentTime + i * 0.08 + 0.25)
      })
    } else if (type === 'wrong') {
      // Soft gentle wobble sound (non-punitive)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } else if (type === 'click') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = f
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.1)
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4)
      })
    }
  } catch (e) {
    // Ignore audio context autoplay restriction errors
  }
}

// ─── Speech Synthesis helper ──────────────────────────────────────────────
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    window.speechSynthesis.speak(utterance)
  }
}

// ─── Who Am I? Riddles Data Across All 12 General Awareness Categories ──────
export const WHO_AM_I_RIDDLES = [
  // 👨‍🚒 Community Helpers
  {
    id: 'r_firefighter',
    category: 'helpers',
    categoryLabel: '👨‍🚒 Community Helpers',
    riddle: "I help put out fires and drive a big red truck with a loud siren. Who am I?",
    correct: { name: 'Firefighter', emoji: '👨‍🚒', desc: 'Puts out fires & saves lives!' },
    options: [
      { name: 'Firefighter', emoji: '👨‍🚒', desc: 'Puts out fires & saves lives!' },
      { name: 'Chef', emoji: '👨‍🍳', desc: 'Cooks yummy food!' },
      { name: 'Doctor', emoji: '👨‍⚕️', desc: 'Helps sick people get well!' }
    ],
    hint: "I wear a protective yellow helmet and use a water hose!"
  },
  {
    id: 'r_chef',
    category: 'helpers',
    categoryLabel: '👨‍🚒 Community Helpers',
    riddle: "I cook yummy food, wear a tall white hat, and prepare tasty meals in a restaurant. Who am I?",
    correct: { name: 'Chef', emoji: '👨‍🍳', desc: 'Cooks delicious dishes!' },
    options: [
      { name: 'Doctor', emoji: '👨‍⚕️', desc: 'Helps sick people!' },
      { name: 'Chef', emoji: '👨‍🍳', desc: 'Cooks delicious dishes!' },
      { name: 'Police Officer', emoji: '👮‍♂️', desc: 'Keeps us safe!' }
    ],
    hint: "Look for the tall white hat and apron!"
  },
  {
    id: 'r_doctor',
    category: 'helpers',
    categoryLabel: '👨‍🚒 Community Helpers',
    riddle: "I listen to your heartbeat with a stethoscope and help you feel better when you are sick. Who am I?",
    correct: { name: 'Doctor', emoji: '👨‍⚕️', desc: 'Cares for your health!' },
    options: [
      { name: 'Teacher', emoji: '👩‍🏫', desc: 'Teaches in class!' },
      { name: 'Farmer', emoji: '👨‍🌾', desc: 'Grows vegetables & crops!' },
      { name: 'Doctor', emoji: '👨‍⚕️', desc: 'Cares for your health!' }
    ],
    hint: "I work at a hospital and wear a white coat!"
  },
  {
    id: 'r_teacher',
    category: 'helpers',
    categoryLabel: '👨‍🚒 Community Helpers',
    riddle: "I teach you ABCs, 123s, read fun books, and help you learn at school. Who am I?",
    correct: { name: 'Teacher', emoji: '👩‍🏫', desc: 'Guides you to learn!' },
    options: [
      { name: 'Teacher', emoji: '👩‍🏫', desc: 'Guides you to learn!' },
      { name: 'Pilot', emoji: '🧑‍✈️', desc: 'Flies airplanes!' },
      { name: 'Mail Carrier', emoji: '🧑‍📬', desc: 'Delivers letters!' }
    ],
    hint: "I stand at the classroom board and share stories!"
  },
  {
    id: 'r_police',
    category: 'helpers',
    categoryLabel: '👨‍🚒 Community Helpers',
    riddle: "I wear a navy blue uniform, drive a patrol car, and keep our neighborhood safe. Who am I?",
    correct: { name: 'Police Officer', emoji: '👮‍♂️', desc: 'Protects the community!' },
    options: [
      { name: 'Farmer', emoji: '👨‍🌾', desc: 'Grows plants & food!' },
      { name: 'Police Officer', emoji: '👮‍♂️', desc: 'Protects the community!' },
      { name: 'Chef', emoji: '👨‍🍳', desc: 'Cooks in the kitchen!' }
    ],
    hint: "Look for the shiny badge!"
  },

  // 🦁 Animals & Birds
  {
    id: 'r_lion',
    category: 'animals',
    categoryLabel: '🦁 Animals & Birds',
    riddle: "I am known as the King of the Jungle, have a golden mane, and ROAR loudly! Who am I?",
    correct: { name: 'Lion', emoji: '🦁', desc: 'King of the Jungle!' },
    options: [
      { name: 'Elephant', emoji: '🐘', desc: 'Huge with a trunk!' },
      { name: 'Lion', emoji: '🦁', desc: 'King of the Jungle!' },
      { name: 'Rabbit', emoji: '🐰', desc: 'Hops softly!' }
    ],
    hint: "I have a majestic mane and a big roar!"
  },
  {
    id: 'r_elephant',
    category: 'animals',
    categoryLabel: '🦁 Animals & Birds',
    riddle: "I am huge and gray, have two big floppy ears, and a long nose called a trunk. Who am I?",
    correct: { name: 'Elephant', emoji: '🐘', desc: 'Gentle giant with trunk!' },
    options: [
      { name: 'Dog', emoji: '🐶', desc: 'Loyal furry friend!' },
      { name: 'Elephant', emoji: '🐘', desc: 'Gentle giant with trunk!' },
      { name: 'Monkey', emoji: '🐒', desc: 'Swings on trees!' }
    ],
    hint: "I use my long trunk to spray water and eat leaves!"
  },
  {
    id: 'r_peacock',
    category: 'animals',
    categoryLabel: '🦁 Animals & Birds',
    riddle: "I am a beautiful bird that spreads blue and green feathers like a big fan when it rains. Who am I?",
    correct: { name: 'Peacock', emoji: '🦚', desc: 'National bird with colorful fan feathers!' },
    options: [
      { name: 'Owl', emoji: '🦉', desc: 'Night bird saying Hoot!' },
      { name: 'Peacock', emoji: '🦚', desc: 'National bird with colorful fan feathers!' },
      { name: 'Penguin', emoji: '🐧', desc: 'Swims in freezing water!' }
    ],
    hint: "Look for the magnificent colorful feathers with eyespots!"
  },
  {
    id: 'r_owl',
    category: 'animals',
    categoryLabel: '🦁 Animals & Birds',
    riddle: "I stay awake all night, have big round glowing eyes, and say HOOT HOOT! Who am I?",
    correct: { name: 'Owl', emoji: '🦉', desc: 'Wise night explorer!' },
    options: [
      { name: 'Parrot', emoji: '🦜', desc: 'Talkative bird!' },
      { name: 'Flamingo', emoji: '🦩', desc: 'Pink standing bird!' },
      { name: 'Owl', emoji: '🦉', desc: 'Wise night explorer!' }
    ],
    hint: "I sit on tree branches at night!"
  },

  // 🚒 Vehicles & Transport
  {
    id: 'r_firetruck',
    category: 'vehicles',
    categoryLabel: '🚒 Vehicles & Transport',
    riddle: "I am a red emergency vehicle with flashing lights, loud sirens, and long ladders. Who am I?",
    correct: { name: 'Fire Truck', emoji: '🚒', desc: 'Rushes to put out fires!' },
    options: [
      { name: 'Fire Truck', emoji: '🚒', desc: 'Rushes to put out fires!' },
      { name: 'Bicycle', emoji: '🚲', desc: 'Two-wheeled pedal bike!' },
      { name: 'Sailboat', emoji: '⛵', desc: 'Floats on water!' }
    ],
    hint: "I carry firefighters and water tanks!"
  },
  {
    id: 'r_airplane',
    category: 'vehicles',
    categoryLabel: '🚒 Vehicles & Transport',
    riddle: "I fly high above the clouds with big wings and take people on long journeys across the ocean. Who am I?",
    correct: { name: 'Airplane', emoji: '✈️', desc: 'Flies high in the sky!' },
    options: [
      { name: 'Train', emoji: '🚂', desc: 'Runs on iron tracks!' },
      { name: 'Airplane', emoji: '✈️', desc: 'Flies high in the sky!' },
      { name: 'Submarine', emoji: '🛥️', desc: 'Dives deep underwater!' }
    ],
    hint: "You see me high up in the blue sky leaving white trails!"
  },
  {
    id: 'r_train',
    category: 'vehicles',
    categoryLabel: '🚒 Vehicles & Transport',
    riddle: "I travel on long iron tracks, pull many carriages, and go CHOO-CHOO! Who am I?",
    correct: { name: 'Train', emoji: '🚂', desc: 'Rumbles down the tracks!' },
    options: [
      { name: 'School Bus', emoji: '🚌', desc: 'Takes kids to school!' },
      { name: 'Train', emoji: '🚂', desc: 'Rumbles down the tracks!' },
      { name: 'Helicopter', emoji: '🚁', desc: 'Spins blades up top!' }
    ],
    hint: "I have an engine head and run along railway tracks!"
  },

  // ☀️ Weather, Seasons & Nature
  {
    id: 'r_sun',
    category: 'nature',
    categoryLabel: '☀️ Weather & Nature',
    riddle: "I am a giant bright yellow star in the sky that gives warmth and light to everything on Earth. Who am I?",
    correct: { name: 'Sun', emoji: '☀️', desc: 'Source of daylight & warmth!' },
    options: [
      { name: 'Moon', emoji: '🌙', desc: 'Shines gently at night!' },
      { name: 'Sun', emoji: '☀️', desc: 'Source of daylight & warmth!' },
      { name: 'Rainbow', emoji: '🌈', desc: '7 colorful arches in sky!' }
    ],
    hint: "I shine during the day and make plants grow!"
  },
  {
    id: 'r_rainbow',
    category: 'nature',
    categoryLabel: '☀️ Weather & Nature',
    riddle: "I appear in the sky after a rain shower with 7 beautiful colorful stripes! Who am I?",
    correct: { name: 'Rainbow', emoji: '🌈', desc: 'Colorful sky arch!' },
    options: [
      { name: 'Rainbow', emoji: '🌈', desc: 'Colorful sky arch!' },
      { name: 'Cloud', emoji: '☁️', desc: 'Fluffy white cloud!' },
      { name: 'Volcano', emoji: '🌋', desc: 'Mountain with red lava!' }
    ],
    hint: "Red, orange, yellow, green, blue, indigo, violet!"
  },
  {
    id: 'r_winter',
    category: 'nature',
    categoryLabel: '☀️ Weather & Nature',
    riddle: "I am the chilly season when snow falls, ponds freeze, and we wear cozy jackets and gloves. Who am I?",
    correct: { name: 'Winter', emoji: '❄️', desc: 'Snowy cold season!' },
    options: [
      { name: 'Summer', emoji: '🏖️', desc: 'Hot sunny beach days!' },
      { name: 'Winter', emoji: '❄️', desc: 'Snowy cold season!' },
      { name: 'Autumn', emoji: '🍂', desc: 'Leaves turn brown & fall!' }
    ],
    hint: "Think of snowmen, ice, and hot cocoa!"
  },

  // 👁️ Body, Family & School
  {
    id: 'r_eyes',
    category: 'body_school',
    categoryLabel: '👁️ Body, Family & School',
    riddle: "We sit on your face above your nose and help you see all colors, pictures, and books! Who are we?",
    correct: { name: 'Eyes', emoji: '👁️', desc: 'Help you see the world!' },
    options: [
      { name: 'Ears', emoji: '👂', desc: 'Help you hear sounds!' },
      { name: 'Eyes', emoji: '👁️', desc: 'Help you see the world!' },
      { name: 'Hands', emoji: '🖐️', desc: 'Help you hold things!' }
    ],
    hint: "You close them when you go to sleep!"
  },
  {
    id: 'r_backpack',
    category: 'body_school',
    categoryLabel: '👁️ Body, Family & School',
    riddle: "I sit comfortably on your back and carry your books, pencils, and water bottle to school. Who am I?",
    correct: { name: 'School Backpack', emoji: '🎒', desc: 'Holds all your school gear!' },
    options: [
      { name: 'School Backpack', emoji: '🎒', desc: 'Holds all your school gear!' },
      { name: 'Desk', emoji: '🪑', desc: 'Table for writing!' },
      { name: 'Pencil', emoji: '✏️', desc: 'Used for writing!' }
    ],
    hint: "You zip me up and put me on your shoulders!"
  },
  {
    id: 'r_tree',
    category: 'nature',
    categoryLabel: '🌿 Plants & Trees',
    riddle: "I have deep brown roots in the soil, a strong woody trunk, and lush green leaves that shade you. Who am I?",
    correct: { name: 'Tree', emoji: '🌳', desc: 'Gives fresh air, shade & fruits!' },
    options: [
      { name: 'Cactus', emoji: '🌵', desc: 'Desert plant with spiky thorns!' },
      { name: 'Tree', emoji: '🌳', desc: 'Gives fresh air, shade & fruits!' },
      { name: 'Rose', emoji: '🌹', desc: 'Fragrant garden flower!' }
    ],
    hint: "Birds build nests on my branches!"
  }
]

const GAME_CATEGORIES = [
  { id: 'all', name: '🌟 All Mixed Riddles', emoji: '🔮' },
  { id: 'helpers', name: '👨‍🚒 Community Helpers', emoji: '👨‍🚒' },
  { id: 'animals', name: '🦁 Animals & Birds', emoji: '🐾' },
  { id: 'vehicles', name: '🚒 Vehicles & Transport', emoji: '🚀' },
  { id: 'nature', name: '☀️ Weather & Nature', emoji: '🌈' },
  { id: 'body_school', name: '👁️ Body, Family & School', emoji: '🎒' },
]

const INITIAL_GAME_STATE = (cat = 'all') => ({
  category: cat,
  riddleIndex: 0,
  score: 0,
  streak: 0,
  stars: 0,
  lives: 3,
  answered: null, // null | 'correct' | 'wrong'
  selectedOption: null,
  showHint: false,
  removedOptionIndex: null,
  gameOver: false,
  completedAll: false
})

export default function WhoAmIGame({ game, childId, onComplete, onBack }) {
  const { state, saveState, restored } = useGameStatePersistence('who_am_i_riddle_game', childId, INITIAL_GAME_STATE('all'))
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Filter riddles by selected category
  const activeRiddles = state.category === 'all'
    ? WHO_AM_I_RIDDLES
    : WHO_AM_I_RIDDLES.filter(r => r.category === state.category)

  const currentRiddle = activeRiddles[state.riddleIndex % activeRiddles.length] || WHO_AM_I_RIDDLES[0]

  // Read riddle aloud on change or manually
  const handleSpeak = (textToSpeak) => {
    if (!textToSpeak) return
    setIsSpeaking(true)
    speakText(textToSpeak)
    setTimeout(() => setIsSpeaking(false), 4000)
  }

  // Auto-speak new riddle when it loads
  useEffect(() => {
    if (restored && currentRiddle && !state.answered && !state.gameOver && !state.completedAll) {
      const timer = setTimeout(() => {
        handleSpeak(currentRiddle.riddle)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [state.riddleIndex, state.category, restored])

  if (!restored) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
  }

  const handleSelectCategory = (catId) => {
    playSoundEffect('click')
    saveState(INITIAL_GAME_STATE(catId))
  }

  const handleOptionClick = (option, index) => {
    if (state.answered !== null || state.gameOver) return

    playSoundEffect('click')
    const isCorrect = option.name === currentRiddle.correct.name

    if (isCorrect) {
      playSoundEffect('correct')
      handleSpeak(`Correct! ${currentRiddle.correct.name}! ${currentRiddle.correct.desc}`)

      const addedPoints = 20 + (state.streak * 5)
      const newScore = state.score + addedPoints
      const newStreak = state.streak + 1
      const newStars = state.stars + 1

      saveState({
        ...state,
        score: newScore,
        streak: newStreak,
        stars: newStars,
        answered: 'correct',
        selectedOption: option.name
      })

      // Next question timer
      setTimeout(() => {
        const nextIdx = state.riddleIndex + 1
        if (nextIdx >= activeRiddles.length) {
          playSoundEffect('fanfare')
          saveState({
            ...state,
            score: newScore,
            streak: newStreak,
            stars: newStars,
            answered: null,
            completedAll: true
          })
          if (onComplete) onComplete(newScore, activeRiddles.length * 25, 1, 120)
        } else {
          saveState({
            ...state,
            riddleIndex: nextIdx,
            score: newScore,
            streak: newStreak,
            stars: newStars,
            answered: null,
            selectedOption: null,
            showHint: false,
            removedOptionIndex: null
          })
        }
      }, 1600)
    } else {
      playSoundEffect('wrong')
      handleSpeak("Oops! Try again!")

      const newLives = state.lives - 1
      const isGameOver = newLives <= 0

      saveState({
        ...state,
        lives: newLives,
        streak: 0,
        answered: 'wrong',
        selectedOption: option.name,
        gameOver: isGameOver
      })

      if (!isGameOver) {
        setTimeout(() => {
          saveState({
            ...state,
            lives: newLives,
            streak: 0,
            answered: null,
            selectedOption: null
          })
        }, 1200)
      }
    }
  }

  const handleUseHint = () => {
    if (state.showHint || state.removedOptionIndex !== null) return
    playSoundEffect('click')

    // Find a wrong option to eliminate
    const wrongIndices = currentRiddle.options
      .map((opt, i) => (opt.name !== currentRiddle.correct.name ? i : null))
      .filter(i => i !== null)

    const removeIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
    saveState({
      ...state,
      showHint: true,
      removedOptionIndex: removeIdx
    })
    handleSpeak(`Hint: ${currentRiddle.hint}`)
  }

  const handleRestart = () => {
    playSoundEffect('click')
    saveState(INITIAL_GAME_STATE(state.category))
  }

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '16px 16px 32px',
      fontFamily: 'var(--font-main)'
    }}>
      {/* 🔝 Game Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        marginBottom: 16,
        background: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        border: '1.5px solid rgba(139, 92, 246, 0.2)'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', fontSize: 16, fontWeight: 800,
            color: '#8B5CF6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          ← Exit
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: '#F59E0B',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            ⭐ {state.stars} Stars
          </div>
          <div style={{
            fontSize: 14, fontWeight: 800, color: '#10B981',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            🎯 {state.score} Pts
          </div>
          <div style={{ fontSize: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ opacity: i < state.lives ? 1 : 0.25, transition: 'all 0.3s' }}>
                ❤️
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🏷️ Category Selection Bar */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 20,
        scrollbarWidth: 'none'
      }}>
        {GAME_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: state.category === cat.id ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#FFFFFF',
              color: state.category === cat.id ? '#FFFFFF' : 'var(--text-primary)',
              border: `1.5px solid ${state.category === cat.id ? '#8B5CF6' : 'var(--color-border)'}`,
              fontWeight: 800,
              fontSize: 13,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: state.category === cat.id ? '0 4px 14px rgba(139, 92, 246, 0.3)' : 'none',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 🏆 Game Over / Victory Modal */}
      {(state.gameOver || state.completedAll) ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-float)',
          border: '3px solid #8B5CF6'
        }}>
          <div style={{ fontSize: 72, marginBottom: 12 }}>
            {state.completedAll ? '🎉' : '💔'}
          </div>
          <h2 className="heading display-text" style={{ fontSize: 32, marginBottom: 8 }}>
            {state.completedAll ? 'Riddle Champion!' : 'Game Over!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            {state.completedAll
              ? `You solved all riddles in this category with ${state.score} points!`
              : `Great effort! You earned ${state.score} points and ${state.stars} stars!`}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-child" onClick={handleRestart}>
              🔄 Play Again
            </button>
            <button className="btn btn-secondary btn-child" onClick={onBack}>
              🏠 Back to Zone
            </button>
          </div>
        </div>
      ) : (
        /* 🧩 Active Riddle Stage */
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,243,255,0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-float)',
          border: '2px solid rgba(139, 92, 246, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Progress badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            marginBottom: 16
          }}>
            <span className="badge badge-purple" style={{ fontSize: 12 }}>
              {currentRiddle.categoryLabel}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)' }}>
              Riddle {state.riddleIndex + 1} of {activeRiddles.length}
            </span>
          </div>

          {/* Riddle Card Display */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
            border: '2px solid rgba(236, 72, 153, 0.15)',
            marginBottom: 24,
            position: 'relative'
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 12,
              animation: 'float 3s ease-in-out infinite'
            }}>
              ❓
            </div>

            <h3 className="heading display-text" style={{
              fontSize: 'clamp(20px, 4vw, 26px)',
              lineHeight: 1.35,
              color: 'var(--text-primary)',
              marginBottom: 16
            }}>
              "{currentRiddle.riddle}"
            </h3>

            {/* Read Aloud Button */}
            <button
              onClick={() => handleSpeak(currentRiddle.riddle)}
              style={{
                background: isSpeaking ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : '#F3E8FF',
                color: isSpeaking ? '#FFFFFF' : '#8B5CF6',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isSpeaking ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔊 {isSpeaking ? 'Reading Aloud...' : 'Listen to Riddle'}
            </button>

            {/* Hint box */}
            {state.showHint && (
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                background: '#FEF3C7',
                border: '1.5px solid #F59E0B',
                borderRadius: 'var(--radius-md)',
                color: '#92400E',
                fontSize: 13,
                fontWeight: 800,
                animation: 'pulse 1.5s infinite'
              }}>
                💡 Hint: {currentRiddle.hint}
              </div>
            )}
          </div>

          {/* "Who Am I?" Prompt */}
          <div style={{
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 900,
            color: '#8B5CF6',
            marginBottom: 16,
            letterSpacing: 0.5
          }}>
            Who Am I? Tap the correct answer below 👇
          </div>

          {/* Options Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1px))',
            gridAutoColumns: '1fr',
            gridAutoFlow: 'column',
            gap: 14,
            marginBottom: 20
          }}>
            {currentRiddle.options.map((opt, idx) => {
              const isRemoved = state.removedOptionIndex === idx
              const isSelected = state.selectedOption === opt.name
              const isCorrect = opt.name === currentRiddle.correct.name

              let bgColor = '#FFFFFF'
              let borderColor = 'rgba(139, 92, 246, 0.25)'
              let transformStyle = 'none'

              if (state.answered === 'correct' && isSelected) {
                bgColor = '#D1FAE5'
                borderColor = '#10B981'
                transformStyle = 'scale(1.04)'
              } else if (state.answered === 'wrong' && isSelected) {
                bgColor = '#FEE2E2'
                borderColor = '#EF4444'
              }

              if (isRemoved) {
                return (
                  <div key={idx} style={{ opacity: 0.2, pointerEvents: 'none', padding: 20, textAlign: 'center' }}>
                    ❌ Eliminated
                  </div>
                )
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt, idx)}
                  disabled={state.answered !== null}
                  style={{
                    background: bgColor,
                    border: `2.5px solid ${borderColor}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justify: 'center',
                    gap: 8,
                    cursor: state.answered !== null ? 'default' : 'pointer',
                    boxShadow: 'var(--shadow-card)',
                    transform: transformStyle,
                    transition: 'all 0.25s ease'
                  }}
                  className="module-card"
                >
                  <div style={{ fontSize: 48, lineHeight: 1 }}>{opt.emoji}</div>
                  <div style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    fontFamily: 'Baloo 2'
                  }}>
                    {opt.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    {opt.desc}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Hint Trigger Button */}
          {!state.showHint && state.answered === null && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button
                onClick={handleUseHint}
                style={{
                  background: 'none',
                  border: '1.5px solid #F59E0B',
                  color: '#D97706',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                💡 Need a Hint? (Eliminate 1 Choice)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
