export type PostType = 'feed' | 'carousel' | 'stories'

const GOOD_SLOTS: Record<PostType, { days: number[]; hours: number[] }> = {
  feed:     { days: [2, 3, 4], hours: [9, 10, 18, 19] },
  carousel: { days: [2, 3, 4], hours: [12, 13] },
  stories:  { days: [1, 2, 3, 4, 5], hours: [8, 17, 18] },
}

const DEFAULT_TIMES: Record<PostType, { days: number[]; hour: number; minute: number }> = {
  stories:  { days: [1, 2, 3, 4, 5], hour: 8,  minute: 30 },
  feed:     { days: [2, 3, 4],       hour: 9,  minute: 0  },
  carousel: { days: [2, 3, 4],       hour: 12, minute: 30 },
}

export function nextScheduledTime(type: PostType): Date {
  const slot = DEFAULT_TIMES[type]
  const candidate = new Date()
  candidate.setUTCHours(slot.hour + 3, slot.minute, 0, 0)
  let attempts = 0
  while (attempts < 14 && (candidate <= new Date() || !slot.days.includes(candidate.getDay()))) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setUTCHours(slot.hour + 3, slot.minute, 0, 0)
    attempts++
  }
  return candidate
}

export function suggestTimeForType(type: PostType): Date {
  return nextScheduledTime(type)
}

export function isGoodTime(date: Date, type: PostType): boolean {
  const slot = GOOD_SLOTS[type]
  const day = date.getDay()
  const hourBrasilia = (date.getUTCHours() - 3 + 24) % 24
  return slot.days.includes(day) && slot.hours.includes(hourBrasilia)
}
