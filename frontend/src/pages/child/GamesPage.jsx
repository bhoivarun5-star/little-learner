import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import { useChild } from '../../hooks/useChild.jsx'
import { gameService } from '../../services/data.service.js'

import MemoryCardsGame from '../../games/MemoryCardsGame.jsx'
import AlphabetMatchGame from '../../games/AlphabetMatchGame.jsx'
import NumberMatchGame from '../../games/NumberMatchGame.jsx'
import CountingGame from '../../games/CountingGame.jsx'
import ShapeMatchDragGame from '../../games/ShapeMatchDragGame.jsx'
import AlphabetPhonicsSuiteGame from '../../games/AlphabetPhonicsSuiteGame.jsx'
import PuzzleProblemSolvingGame from '../../games/PuzzleProblemSolvingGame.jsx'
import WhoAmIGame from '../../games/WhoAmIGame.jsx'

export default function GamesPage() {
  const { activeChild } = useChild()
  const [activeGame, setActiveGame] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const scoresList = useLiveQuery(
    () => activeChild ? db.gameScores.where('childId').equals(activeChild.localId).toArray() : [],
    [activeChild?.localId]
  )

  const handleGameComplete = async (gameId, score, maxScore, level, timeTaken) => {
    if (activeChild) {
      await gameService.saveScore(activeChild.localId, gameId, score, maxScore, level, timeTaken)
    }
    setActiveGame(null)
  }

  const getHighScore = (gameId) => {
    if (!scoresList || !scoresList.length) return null
    const matching = scoresList.filter(s => s.gameId === gameId || s.gameType === gameId)
    if (!matching.length) return null
    return Math.max(...matching.map(s => s.score || 0))
  }

  if (activeGame) {
    return (
      <GameRouter
        game={activeGame}
        childId={activeChild?.localId}
        onComplete={(score, maxScore, level, timeTaken) => handleGameComplete(activeGame.id || activeGame.gameType, score, maxScore, level, timeTaken)}
        onBack={() => setActiveGame(null)}
      />
    )
  }

  const CATEGORIES = [
    { id: 'all', label: '🌟 All Usable Games' },
    { id: 'awareness', label: '🌎 General Awareness' },
    { id: 'puzzles', label: '🧩 Puzzles & Logic' },
    { id: 'letters', label: '🔤 Phonics & Letters' },
    { id: 'shapes', label: '⭐ Shapes & Matching' },
    { id: 'numbers', label: '🔢 Numbers & Math' },
  ]

  const filteredGames = activeCategory === 'all'
    ? BUILTIN_GAMES
    : BUILTIN_GAMES.filter(g => g.category === activeCategory)

  const featuredGame = BUILTIN_GAMES.find(g => g.id === 'who_am_i') || BUILTIN_GAMES[0]

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="heading display-text" style={{ fontSize: 32, marginBottom: 4 }}>
          🎮 Game Zone
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700 }}>
          Play our fully functional, interactive learning games!
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 24,
        scrollbarWidth: 'none'
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-full)',
              background: activeCategory === cat.id ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#FFFFFF',
              color: activeCategory === cat.id ? '#FFFFFF' : 'var(--text-primary)',
              border: `1.5px solid ${activeCategory === cat.id ? '#8B5CF6' : 'var(--color-border)'}`,
              fontWeight: 800,
              fontSize: 14,
              whiteSpace: 'nowrap',
              boxShadow: activeCategory === cat.id ? '0 6px 18px rgba(139, 92, 246, 0.3)' : 'var(--shadow-card)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Game Hero */}
      {(activeCategory === 'all' || activeCategory === 'awareness') && featuredGame && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 13, fontWeight: 800, color: '#00CEC9',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8
          }}>
            🌎 FEATURED GENERAL AWARENESS GAME
          </div>
          <div
            onClick={() => setActiveGame(featuredGame)}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 206, 201, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '2.5px solid #00CEC9',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            className="module-card"
          >
            <div style={{ fontSize: 60, animation: 'float 3s ease-in-out infinite' }}>
              {featuredGame.emoji}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <span className="badge badge-success" style={{ marginBottom: 6, background: '#00CEC9', color: '#fff' }}>15 RIDDLES</span>
              <h3 className="heading display-text" style={{ fontSize: 24 }}>
                {featuredGame.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, fontWeight: 700 }}>
                "I help put out fires. Who am I?" Guess Community Helpers, Animals, Vehicles & Nature!
              </p>
            </div>
            <button className="btn btn-primary" style={{ padding: '10px 20px', minHeight: 'auto', background: '#00CEC9', borderColor: '#00CEC9' }}>
              Play ▶
            </button>
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="games-grid" style={{ padding: 0 }}>
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => setActiveGame(game)}
            style={{
              background: '#FFFFFF',
              border: `2px solid ${game.color}44`,
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 10,
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="module-card"
          >
            <div style={{
              position: 'absolute', top: 12, right: 12,
              fontSize: 11, fontWeight: 800, padding: '3px 8px',
              borderRadius: 99, background: `${game.color}15`, color: game.color
            }}>
              {game.difficulty}
            </div>

            <div style={{ fontSize: 48, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
              {game.emoji}
            </div>

            <div className="module-title" style={{ fontSize: 16, color: 'var(--text-primary)' }}>
              {game.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {getHighScore(game.id) !== null ? (
                <span className="badge badge-success" style={{ fontSize: 11 }}>
                  🏆 Best: {getHighScore(game.id)} pts
                </span>
              ) : (
                <span className="badge badge-info" style={{ fontSize: 11 }}>
                  🌟 Play Now
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GameRouter({ game, childId, onComplete, onBack }) {
  const componentMap = {
    who_am_i: WhoAmIGame,
    puzzle_suite: PuzzleProblemSolvingGame,
    shape_drag_match: ShapeMatchDragGame,
    alphabet_phonics: AlphabetPhonicsSuiteGame,
    number_match: NumberMatchGame,
    counting: CountingGame,
    memory_cards: MemoryCardsGame,
  }
  const Component = componentMap[game.id] || componentMap[game.gameType]
  if (!Component) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p>Game not available offline yet.</p>
      <button className="btn btn-secondary" onClick={onBack}>← Back</button>
    </div>
  )
  return <Component game={game} childId={childId} onComplete={onComplete} onBack={onBack} />
}

export const BUILTIN_GAMES = [
  { id: 'who_am_i', gameType: 'who_am_i', category: 'awareness', title: 'Who Am I? Riddles', emoji: '🕵️‍♂️', color: '#00CEC9', difficulty: '15 Riddles' },
  { id: 'puzzle_suite', gameType: 'puzzle_suite', category: 'puzzles', title: 'Puzzle & Problem Solving', emoji: '🧩', color: '#8B5CF6', difficulty: '7 Modes' },
  { id: 'shape_drag_match', gameType: 'shape_drag_match', category: 'shapes', title: 'Shape Drop Match', emoji: '⭐', color: '#F97316', difficulty: '10 Stages' },
  { id: 'alphabet_phonics', gameType: 'alphabet_phonics', category: 'letters', title: 'Alphabet & Phonics', emoji: '🔤', color: '#EC4899', difficulty: '5 Modes' },
  { id: 'number_match', gameType: 'number_match', category: 'numbers', title: 'Number Match', emoji: '🔢', color: '#EC4899', difficulty: '3 Levels' },
  { id: 'counting', gameType: 'counting', category: 'numbers', title: 'Counting Game', emoji: '🌟', color: '#10B981', difficulty: '3 Levels' },
  { id: 'memory_cards', gameType: 'memory_cards', category: 'letters', title: 'Memory Cards', emoji: '🃏', color: '#3B82F6', difficulty: '3 Levels' },
]
