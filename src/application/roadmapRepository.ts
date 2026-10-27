import { db } from '../persistence/database'
import { DEFAULT_PREFERENCES, type StudyMinutes } from '../domain/models'
import { validLearningProfile, validScore, type LearningProfile } from '../domain/roadmap'
import { localDayKey } from '../domain/learning'
import { StudyOperationError } from './errors'
import { practiceQuestions, stimuli } from '../content/questions'
import { questionAvailable } from '../domain/assessment'
import { recommendDailyPlan } from '../domain/adaptivePlan'
import { learningRoadmap } from '../domain/roadmap'
import { readStudyData, startSession } from './studyRepository'

export async function startRoadmapPractice(section: 'listening' | 'reading') {
  const data = await readStudyData(),
    now = Date.now()
  const roadmap = learningRoadmap(data.preferences, data.skillEvidence, now)
  if (!roadmap) throw new StudyOperationError('Hãy lưu mục tiêu trước khi mở bài theo lộ trình.')
  const pool = practiceQuestions.filter(
    (q) => questionAvailable(q, stimuli) && (section === 'listening' ? q.part <= 4 : q.part >= 5),
  )
  const allocation = section === 'listening' ? roadmap.listeningMinutes : roadmap.readingMinutes
  const minutes: StudyMinutes = allocation >= 40 ? 40 : allocation >= 20 ? 20 : 10
  const ids = recommendDailyPlan(
    { ...data, questions: pool, stimuli, cards: data.cards.filter((c) => c.kind === 'question') },
    minutes,
    now,
  ).questionIds
  if (!ids.length) throw new StudyOperationError('Chưa có nhóm nội dung phù hợp cho phần này.')
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
