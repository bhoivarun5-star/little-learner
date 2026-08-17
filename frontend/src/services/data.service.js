import db from '../db/index.js'
import syncEngine from '../sync/syncEngine.js'

// ─── Progress Service ──────────────────────────────────────────────────────
export const progressService = {
  async getModuleProgress(childId, moduleId) {
    return db.progress.get([childId, moduleId])
  },

  async updateModuleProgress(childId, moduleId, percent, timeSeconds = 0) {
    const existing = await db.progress.get([childId, moduleId])
    const newPercent = Math.max(existing?.percentComplete || 0, percent)
    const entry = {
      childId,
      moduleId,
      percentComplete: newPercent,
      totalTimeSeconds: (existing?.totalTimeSeconds || 0) + timeSeconds,
      updatedAt: new Date().toISOString(),
    }
    await db.progress.put(entry)
    await syncEngine.enqueue('update', 'progress', `${childId}_${moduleId}`, {
      child_id: childId,
      module_id: moduleId,
      percent_complete: newPercent,
      total_time_seconds: entry.totalTimeSeconds,
    })
    return entry
  },

  async getAllProgress(childId) {
    return db.progress.where('childId').equals(childId).toArray()
  },
}

// ─── Lesson Completion ─────────────────────────────────────────────────────
export const lessonService = {
  async markComplete(childId, lessonId, timeSpent = 0) {
    const existing = await db.lessonCompletions
      .where({ childId, lessonId }).first()
    if (existing) return existing

    const entry = {
      childId,
      lessonId,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpent,
    }
    const id = await db.lessonCompletions.add(entry)
    await syncEngine.enqueue('create', 'lesson_completion', id, {
      child_id: childId,
      lesson_id: lessonId,
      time_spent_seconds: timeSpent,
    })
    return { ...entry, localId: id }
  },

  async isCompleted(childId, lessonId) {
    const found = await db.lessonCompletions.where({ childId, lessonId }).first()
    return !!found
  },

  async getCompletedLessons(childId) {
    return db.lessonCompletions.where('childId').equals(childId).toArray()
  },
}

// ─── Game Scores ───────────────────────────────────────────────────────────
export const gameService = {
  async saveScore(childId, gameId, score, maxScore, level, timeTaken) {
    const localId = `gs_${childId}_${gameId}_${Date.now()}`
    const entry = {
      childId,
      gameId,
      score,
      maxScore,
      level,
      timeTakenSeconds: timeTaken,
      completedAt: new Date().toISOString(),
    }
    const id = await db.gameScores.add(entry)
    await syncEngine.enqueue('create', 'game_score', localId, {
      child_id: childId,
      game_id: gameId,
      score,
      max_score: maxScore,
      level,
      time_taken_seconds: timeTaken,
      local_id: localId,
    })
    return { ...entry, localId: id }
  },

  async getBestScore(childId, gameId) {
    const scores = await db.gameScores
      .where('childId').equals(childId)
      .filter((s) => s.gameId === gameId)
      .toArray()
    if (!scores.length) return null
    return scores.reduce((best, s) => (s.score > best.score ? s : best))
  },

  async getRecentScores(childId, limit = 10) {
    return db.gameScores
      .where('childId').equals(childId)
      .reverse()
      .limit(limit)
      .toArray()
  },
}

// ─── Game State Persistence (for refresh recovery) ─────────────────────────
export const gameStateService = {
  key: (gameId, childId) => `${gameId}:${childId}`,

  async save(gameId, childId, state) {
    await db.gameState.put({
      stateKey: this.key(gameId, childId),
      childId,
      gameId,
      state,
      savedAt: new Date().toISOString(),
    })
  },

  async load(gameId, childId) {
    const entry = await db.gameState.get(this.key(gameId, childId))
    return entry?.state || null
  },

  async clear(gameId, childId) {
    await db.gameState.delete(this.key(gameId, childId))
  },
}

// ─── Quiz Results ──────────────────────────────────────────────────────────
export const quizService = {
  async saveResult(childId, quizId, score, total, timeTaken, answers) {
    const localId = `qr_${childId}_${quizId}_${Date.now()}`
    const entry = {
      childId,
      quizId,
      score,
      totalPoints: total,
      timeTakenSeconds: timeTaken,
      completedAt: new Date().toISOString(),
      answersJson: answers,
    }
    const id = await db.quizResults.add(entry)
    await syncEngine.enqueue('create', 'quiz_result', localId, {
      child_id: childId,
      quiz_id: quizId,
      score,
      total_points: total,
      time_taken_seconds: timeTaken,
      answers_json: answers,
      local_id: localId,
    })
    return { ...entry, localId: id }
  },

  async getResults(childId) {
    return db.quizResults.where('childId').equals(childId).reverse().toArray()
  },
}

// ─── Badge Service ─────────────────────────────────────────────────────────
export const badgeService = {
  async awardBadge(childId, badgeType) {
    const existing = await db.badges
      .where({ childId, badgeType }).first()
    if (existing) return existing

    const entry = { childId, badgeType, earnedAt: new Date().toISOString() }
    const id = await db.badges.add(entry)
    return { ...entry, localId: id }
  },

  async getBadges(childId) {
    return db.badges.where('childId').equals(childId).toArray()
  },
}

// ─── Content sync from API ─────────────────────────────────────────────────
export const DEFAULT_MODULES = [
  { id: 'm_alphabet', slug: 'alphabet', title: 'Alphabet', description: 'Learn ABCs from A to Z!', module_type: 'alphabet', icon_emoji: '🔤', color_hex: '#FF6B6B', order: 1 },
  { id: 'm_numbers', slug: 'numbers', title: 'Numbers', description: 'Count 1 to 20 with bubbles!', module_type: 'numbers', icon_emoji: '🔢', color_hex: '#4ECDC4', order: 2 },
  { id: 'm_colors', slug: 'colors', title: 'Colors', description: 'Discover colors of rainbow!', module_type: 'colors', icon_emoji: '🎨', color_hex: '#FFE66D', order: 3 },
  { id: 'm_shapes', slug: 'shapes', title: 'Shapes', description: 'Circle, square, triangle & more!', module_type: 'shapes', icon_emoji: '⭐', color_hex: '#A29BFE', order: 4 },
  { id: 'm_general_awareness', slug: 'general-awareness', title: 'General Awareness', description: 'Animals, Birds, Plants, Food, Vehicles, Weather, Seasons & Community Helpers!', module_type: 'general_awareness', icon_emoji: '🌎', color_hex: '#00CEC9', order: 5 },
  { id: 'm_animals', slug: 'animals', title: 'Animals', description: 'Meet animals and hear sounds!', module_type: 'animals', icon_emoji: '🐾', color_hex: '#55EFC4', order: 6 },
  { id: 'm_fruits', slug: 'fruits', title: 'Fruits & Veggies', description: 'Yummy fruits and vegetables!', module_type: 'fruits', icon_emoji: '🍎', color_hex: '#FD79A8', order: 7 },
  { id: 'm_words', slug: 'words', title: 'Basic Words', description: 'Learn everyday words!', module_type: 'words', icon_emoji: '💬', color_hex: '#FDCB6E', order: 8 },
  { id: 'm_stories', slug: 'stories', title: 'Stories', description: 'Short stories with pictures!', module_type: 'stories', icon_emoji: '📖', color_hex: '#6C5CE7', order: 9 },
  { id: 'm_mathematics', slug: 'mathematics', title: 'Mathematics', description: 'Simple math made fun!', module_type: 'mathematics', icon_emoji: '➕', color_hex: '#00B894', order: 10 },
  { id: 'm_english', slug: 'english', title: 'English', description: 'Simple English sentences!', module_type: 'english', icon_emoji: '🇬🇧', color_hex: '#0984E3', order: 11 },
]

export const contentService = {
  async seedDefaultModules() {
    for (const m of DEFAULT_MODULES) {
      await db.learningModules.put({
        localId: m.id,
        serverId: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        moduleType: m.module_type,
        iconEmoji: m.icon_emoji,
        colorHex: m.color_hex,
        sizeBytes: 10_000_000,
        version: 1,
        order: m.order,
        lessonCount: 12,
        downloadStatus: 'downloaded',
        updatedAt: new Date().toISOString(),
      })
    }
  },

  async seedModulesFromApi(modules) {
    for (const m of modules) {
      await db.learningModules.put({
        localId: m.id,
        serverId: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        moduleType: m.module_type,
        iconEmoji: m.icon_emoji,
        colorHex: m.color_hex,
        sizeBytes: m.size_bytes,
        version: m.version,
        order: m.order,
        lessonCount: m.lesson_count,
        downloadStatus: 'not_downloaded',
        updatedAt: m.updated_at,
      })
    }
  },

  async seedLessonsFromApi(moduleId, lessons) {
    for (const l of lessons) {
      await db.lessons.put({
        localId: l.id,
        serverId: l.id,
        moduleId,
        title: l.title,
        order: l.order,
        contentJson: l.content_json,
        audioUrl: l.audio_url,
        durationSeconds: l.duration_seconds,
        updatedAt: l.updated_at,
      })
    }
  },

  async seedGamesFromApi(games) {
    for (const g of games) {
      await db.games.put({
        localId: g.id,
        serverId: g.id,
        moduleId: g.module,
        title: g.title,
        gameType: g.game_type,
        description: g.description,
        configJson: g.config_json,
        maxLevel: g.max_level,
        iconEmoji: g.icon_emoji,
        updatedAt: g.updated_at,
      })
    }
  },

  async seedQuizzesFromApi(moduleId, quizzes) {
    for (const q of quizzes) {
      await db.quizzes.put({
        localId: q.id,
        serverId: q.id,
        moduleId,
        title: q.title,
        timeLimitSeconds: q.time_limit_seconds,
        questionCount: q.question_count,
        updatedAt: q.updated_at,
      })
      if (q.questions) {
        for (const question of q.questions) {
          await db.questions.put({
            localId: question.id,
            serverId: question.id,
            quizId: q.id,
            text: question.text,
            imageUrl: question.image_url,
            audioUrl: question.audio_url,
            questionType: question.question_type,
            order: question.order,
            points: question.points,
          })
          for (const ans of question.answers || []) {
            await db.answers.put({
              localId: ans.id,
              serverId: ans.id,
              questionId: question.id,
              text: ans.text,
              imageUrl: ans.image_url,
              isCorrect: ans.is_correct,
              order: ans.order,
            })
          }
        }
      }
    }
  },

  async getModules() {
    let list = await db.learningModules.orderBy('order').toArray()
    if (!list || list.length === 0) {
      await this.seedDefaultModules()
      list = await db.learningModules.orderBy('order').toArray()
    }
    return list
  },

  async getModule(slug) {
    let mod = await db.learningModules.where('slug').equals(slug).first()
    if (!mod) {
      await this.seedDefaultModules()
      mod = await db.learningModules.where('slug').equals(slug).first()
    }
    return mod
  },

  async getLessons(moduleId) {
    return db.lessons.where('moduleId').equals(moduleId).sortBy('order')
  },

  async getGames(moduleId) {
    return db.games.where('moduleId').equals(moduleId).toArray()
  },

  async getAllGames() {
    return db.games.toArray()
  },

  async getQuizzes(moduleId) {
    return db.quizzes.where('moduleId').equals(moduleId).toArray()
  },

  async getQuizWithQuestions(quizId) {
    const quiz = await db.quizzes.get(quizId)
    if (!quiz) return null
    const questions = await db.questions.where('quizId').equals(quizId).sortBy('order')
    for (const q of questions) {
      q.answers = await db.answers.where('questionId').equals(q.localId).sortBy('order')
    }
    quiz.questions = questions
    return quiz
  },

  async isModuleDownloaded(slug) {
    const entry = await db.downloadedModules.get(slug)
    return entry?.status === 'downloaded'
  },

  async markModuleDownloaded(slug, version, sizeBytes) {
    await db.downloadedModules.put({
      moduleSlug: slug,
      version,
      sizeBytes,
      downloadedAt: new Date().toISOString(),
      status: 'downloaded',
    })
    await db.learningModules.where('slug').equals(slug).modify({ downloadStatus: 'downloaded' })
  },

  async removeModule(slug) {
    await db.downloadedModules.delete(slug)
    await db.learningModules.where('slug').equals(slug).modify({ downloadStatus: 'not_downloaded' })
  },
}
