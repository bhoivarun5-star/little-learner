import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import { useChild } from '../../hooks/useChild.jsx'
import { gameService, gameStateService } from '../../services/data.service.js'
import api from '../../api/client.js'
import { contentService } from '../../services/data.service.js'
import MemoryCardsGame from '../../games/MemoryCardsGame.jsx'
import AlphabetMatchGame from '../../games/AlphabetMatchGame.jsx'
import NumberMatchGame from '../../games/NumberMatchGame.jsx'
import ShapeSorterGame from '../../games/ShapeSorterGame.jsx'
import CountingGame from '../../games/CountingGame.jsx'

export default function GamesPage() {
  const navigate = useNavigate()
  const { activeChild } = useChild()
  const [games, setGames] = useState([])
  const [activeGame, setActiveGame] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      let local = await contentService.getAllGames()
      if (!local.length) {
        try {
          const res = await api.get('/games/')
          await contentService.seedGamesFromApi(res.data.results || res.data)
          local = await contentService.getAllGames()
        } catch { }
      }
      setGames(local)
      setLoading(false)
    }
    load()
  }, [])

  const handleGameComplete = async (gameId, score, maxScore, level, timeTaken) => {
    if (activeChild) {
      await gameService.saveScore(activeChild.localId, gameId, score, maxScore, level, timeTaken)
    }
    setActiveGame(null)
  }

  if (activeGame) {
    return (
      <GameRouter
        game={activeGame}
        childId={activeChild?.localId}
        onComplete={(score, maxScore, level, timeTaken) => handleGameComplete(activeGame.localId, score, maxScore, level, timeTaken)}
        onBack={() => setActiveGame(null)}
      />
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 className="heading" style={{ marginBottom: 6 }}>🎮 Games</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Play and learn at the same time!</p>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div className="games-grid">
          {BUILTIN_GAMES.map((game) => (
            <button
              key={game.id}
              className="module-card"
              style={{
                background: `linear-gradient(135deg, ${game.color}44, ${game.color}22)`,
                border: `2px solid ${game.color}55`, cursor: 'pointer', aspectRatio: 'auto',
                padding: 24, minHeight: 160
              }}
              onClick={() => setActiveGame(game)}
            >
              <div style={{ fontSize: 48 }}>{game.emoji}</div>
              <div className="module-title" style={{ fontSize: 15 }}>{game.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{game.difficulty}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GameRouter({ game, childId, onComplete, onBack }) {
  const componentMap = {
    memory_cards: MemoryCardsGame,
    alphabet_match: AlphabetMatchGame,
    number_match: NumberMatchGame,
    shape_sorter: ShapeSorterGame,
    counting: CountingGame,
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
  { id: 'alphabet_match', gameType: 'alphabet_match', title: 'Alphabet Match', emoji: '🔤', color: '#FF6B6B', difficulty: 'Easy – Hard' },
  { id: 'number_match', gameType: 'number_match', title: 'Number Match', emoji: '🔢', color: '#4ECDC4', difficulty: 'Easy – Hard' },
  { id: 'memory_cards', gameType: 'memory_cards', title: 'Memory Cards', emoji: '🃏', color: '#A29BFE', difficulty: 'Easy – Hard' },
  { id: 'shape_sorter', gameType: 'shape_sorter', title: 'Shape Sorter', emoji: '🔷', color: '#FD79A8', difficulty: 'Easy – Hard' },
  { id: 'counting', gameType: 'counting', title: 'Counting Game', emoji: '🌟', color: '#FFE66D', difficulty: 'Easy – Hard' },
]
