import { db } from '../persistence/database'
import { DEFAULT_PREFERENCES, type StudyMinutes } from '../domain/models'
import { validLearningProfile, validScore, type LearningProfile } from '../domain/roadmap'
import { localDayKey } from '../domain/learning'
import { StudyOperationError } from './errors'
import { stimuli } from '../content/questions'
import { learningQuestionPool } from './learningQuestionPool'
import { questionAvailable } from '../domain/assessment'
import { recommendDailyPlan } from '../domain/adaptivePlan'
import { learningRoadmap } from '../domain/roadmap'
import { readStudyData, startSession } from './studyRepository'
import { curriculum } from '../content/curriculum'
import { curriculumPool, curriculumProgress } from '../domain/curriculum'

export async function startRoadmapPractice(
  section: 'listening' | 'reading' | 'all',
  options?: { unitId: string; minutes: StudyMinutes },
) {
  const data = await readStudyData(),
    now = Date.now()
  const roadmap = learningRoadmap(data.preferences, data.skillEvidence, now)
  if (!roadmap) throw new StudyOperationError('Hãy lưu mục tiêu trước khi mở bài theo lộ trình.')
  const active = data.sessions.find((session) => session.status === 'active')
  if (active) return active
  const practiceQuestions = learningQuestionPool(data.sessions)
  const unit = options ? curriculum.find((item) => item.id === options.unitId) : undefined
  if (options && (!unit || ![10, 20, 40].includes(options.minutes)))
    throw new StudyOperationError('Chuyên đề hoặc thời lượng học không hợp lệ.')
  const source = unit
    ? curriculumPool(unit, practiceQuestions, stimuli).questions
    : practiceQuestions
  const pool = source.filter(
    (q) =>
      questionAvailable(q, stimuli) &&
      (section === 'all' || (section === 'listening' ? q.part <= 4 : q.part >= 5)),
  )
  const allocation =
    options?.minutes ??
    (section === 'listening'
      ? roadmap.listeningMinutes
      : section === 'reading'
        ? roadmap.readingMinutes
        : roadmap.profile.minutesPerDay)
  const minutes: StudyMinutes = allocation >= 40 ? 40 : allocation >= 20 ? 20 : 10
  const priorityParts =
    unit?.id === 'diagnostic'
      ? curriculumProgress(practiceQuestions, stimuli, data.attempts, now).find(
          (row) => row.unit.id === 'diagnostic',
        )!.unmetParts
      : undefined
  const ids = recommendDailyPlan(
    {
      ...data,
      questions: pool,
      stimuli,
      cards: data.cards.filter((c) => c.kind === 'question'),
      budgetSeconds: allocation * 60,
      priorityParts,
    },
    minutes,
    now,
  ).questionIds
  if (!ids.length)
    throw new StudyOperationError(
      'Chưa có nhóm câu trọn vẹn vừa khung thời gian hoặc các nhóm phù hợp đã làm hôm nay. Chọn thời lượng dài hơn, ôn thẻ đến hạn hoặc mở sổ tay.',
    )
  return startSession('practice', ids, { mode: 'study' })
}

export async function saveLearningProfile(profile: LearningProfile, targetScore: number) {
  if (
    !validLearningProfile(profile) ||
    !validScore(targetScore) ||
    profile.deadline < localDayKey(Date.now()) ||
    profile.startedOn > localDayKey(Date.now())
  )
    throw new StudyOperationError(
      'Kiểm tra điểm (10–990, bước 5), hạn học 7–366 ngày, thời lượng 10–240 phút và ít nhất một ngày học mỗi tuần.',
    )
  await db.transaction('rw', db.preferences, async () => {
    const current = (await db.preferences.get('preferences')) ?? DEFAULT_PREFERENCES
    await db.preferences.put({
      ...current,
      targetScore,
      learningProfile: structuredClone(profile),
      studyMinutes: profile.minutesPerDay >= 40 ? 40 : profile.minutesPerDay >= 20 ? 20 : 10,
    })
  })
}
