export const STORAGE_KEY = 'earthlab-progress-v1'

export function shuffle(items) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

export function buildQuizSession(questions) {
  return shuffle(questions).map((question) => ({
    ...question,
    options: shuffle(
      question.options.map((option, index) => ({
        ...option,
        isCorrect: index === question.answer,
      })),
    ),
  }))
}

export function loadProgress() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return { completedLessons: [], quizScores: {} }
    const parsed = JSON.parse(saved)
    return {
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      quizScores: parsed.quizScores && typeof parsed.quizScores === 'object' ? parsed.quizScores : {},
    }
  } catch {
    return { completedLessons: [], quizScores: {} }
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Progress is a convenience; a blocked localStorage should not stop studying.
  }
}

export function getPercent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export function formatPercent(value) {
  return `${Math.round(value)}%`
}
