import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatCurrency, formatDate, formatPhone, timeAgo } from '@/lib/format'

describe('formatCurrency', () => {
  const nbsp = ' '

  it('formats a positive value with 2 decimals by default', () => {
    expect(formatCurrency(1234.5)).toBe(`R$${nbsp}1.234,50`)
  })

  it('respects an opts override (e.g. 0 decimals)', () => {
    expect(formatCurrency(1234.5, { maximumFractionDigits: 0, minimumFractionDigits: 0 })).toBe(`R$${nbsp}1.235`)
  })

  it('returns R$ 0,00 for null/undefined/NaN', () => {
    expect(formatCurrency(null)).toBe(`R$${nbsp}0,00`)
    expect(formatCurrency(undefined)).toBe(`R$${nbsp}0,00`)
    expect(formatCurrency(NaN)).toBe(`R$${nbsp}0,00`)
  })

  it('formats zero as R$ 0,00', () => {
    expect(formatCurrency(0)).toBe(`R$${nbsp}0,00`)
  })
})

describe('formatDate', () => {
  const iso = '2026-08-24T15:30:00.000Z'

  it('returns empty string for null/undefined/invalid date', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('not-a-date')).toBe('')
  })

  it('short style matches plain toLocaleDateString', () => {
    expect(formatDate(iso, 'short')).toBe(new Date(iso).toLocaleDateString('pt-BR'))
  })

  it('long style shows day/short-month/year', () => {
    expect(formatDate(iso, 'long')).toBe(
      new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    )
  })

  it('datetime style matches plain toLocaleString', () => {
    expect(formatDate(iso, 'datetime')).toBe(new Date(iso).toLocaleString('pt-BR'))
  })

  it('day-month style is DD/MM', () => {
    expect(formatDate(iso, 'day-month')).toBe(
      new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    )
  })

  it('accepts a Date instance, not just a string', () => {
    expect(formatDate(new Date(iso), 'short')).toBe(new Date(iso).toLocaleDateString('pt-BR'))
  })
})

describe('formatPhone', () => {
  it('formats an 11-digit mobile number without DDI', () => {
    expect(formatPhone('62999998888')).toBe('(62) 99999-8888')
  })

  it('formats a 10-digit landline without DDI', () => {
    expect(formatPhone('6233334444')).toBe('(62) 3333-4444')
  })

  it('formats a 13-digit number with 55 DDI (mobile)', () => {
    expect(formatPhone('5562999998888')).toBe('+55 (62) 99999-8888')
  })

  it('formats a 12-digit number with 55 DDI (landline)', () => {
    expect(formatPhone('556233334444')).toBe('+55 (62) 3333-4444')
  })

  it('returns empty string for null/undefined/group ids (@)', () => {
    expect(formatPhone(null)).toBe('')
    expect(formatPhone(undefined)).toBe('')
    expect(formatPhone('12345-6789@g.us')).toBe('')
  })

  it('returns the raw value unchanged when the shape is unrecognized', () => {
    expect(formatPhone('123')).toBe('123')
  })
})

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers())

  it('returns "agora" for less than a minute ago', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-24T12:00:30Z'))
    expect(timeAgo('2026-08-24T12:00:00Z')).toBe('agora')
  })

  it('returns minutes for under an hour', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-24T12:30:00Z'))
    expect(timeAgo('2026-08-24T12:00:00Z')).toBe('30min atrás')
  })

  it('returns hours for under a day', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-24T15:00:00Z'))
    expect(timeAgo('2026-08-24T12:00:00Z')).toBe('3h atrás')
  })

  it('returns days for under a week', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-27T12:00:00Z'))
    expect(timeAgo('2026-08-24T12:00:00Z')).toBe('3d atrás')
  })

  it('falls back to a full date after 7 days', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-05T12:00:00Z'))
    const iso = '2026-08-24T12:00:00Z'
    expect(timeAgo(iso)).toBe(formatDate(iso))
  })

  it('returns empty string for null/undefined/invalid date', () => {
    expect(timeAgo(null)).toBe('')
    expect(timeAgo(undefined)).toBe('')
    expect(timeAgo('not-a-date')).toBe('')
  })
})
