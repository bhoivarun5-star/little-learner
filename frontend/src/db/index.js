import Dexie from 'dexie'

export const db = new Dexie('LittleLearnerDB')

db.version(1).stores({
  // Auth session
  authSession: '&id, accessToken, refreshToken, expiresAt, userId, role, name',

  // Child profiles
  childProfiles: '&localId, serverId, name, avatar, pin, parentId, updatedAt',

  // Content catalog (synced from server, read-only offline)
  learningModules: '&localId, serverId, slug, title, moduleType, version, downloadStatus, order',
  lessons: '&localId, serverId, moduleId, title, order',
  games: '&localId, serverId, moduleId, gameType, title',
  quizzes: '&localId, serverId, moduleId, title',
  questions: '&localId, serverId, quizId, order',
  answers: '&localId, serverId, questionId, isCorrect',

  // Progress (LOCAL SOURCE OF TRUTH)
  progress: '&[childId+moduleId], serverId, childId, moduleId, percentComplete, updatedAt',
  lessonCompletions: '++localId, serverId, childId, lessonId, completedAt',
  gameScores: '++localId, serverId, childId, gameId, score, completedAt',
  quizResults: '++localId, serverId, childId, quizId, score, completedAt',
  badges: '++localId, serverId, childId, badgeType, earnedAt',

  // Game state persistence (key = gameId:childId)
  gameState: '&stateKey, childId, gameId, state, savedAt',

  // Module download tracking
  downloadedModules: '&moduleSlug, version, downloadedAt, status, sizeBytes',

  // Sync queue (outbox pattern)
  syncQueue: '++id, operation, entityType, localId, serverId, status, retryCount, createdAt',

  // Settings
  settings: '&key, value, updatedAt',
})

// ─── Convenience helpers ───────────────────────────────────────────────────

export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key)
  return row ? row.value : defaultValue
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value, updatedAt: new Date().toISOString() })
}

export default db
