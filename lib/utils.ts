import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TZ = 'America/Sao_Paulo'

/** Format any date/ISO string as dd/mm/yyyy in BRT */
export function formatDateBR(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: TZ, ...opts })
}

/** Format any date/ISO string as HH:MM in BRT */
export function formatTimeBR(date: string | Date): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Convert a UTC DateTime from the DB to a YYYY-MM-DD string in BRT.
 * Avoids the off-by-one that happens with `.toISOString().slice(0,10)` when
 * the stored time is midnight UTC (= 21:00 BRT the previous day).
 */
export function toDateInputBR(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: TZ }) // en-CA gives YYYY-MM-DD
}

/**
 * Convert a YYYY-MM-DD date input value to an ISO string at noon BRT (15:00 UTC).
 * Prevents UTC off-by-one: storing midnight UTC means the date shows as "yesterday" in BRT.
 */
export function dateInputToISO(value: string): string {
  return `${value}T15:00:00.000Z` // noon BRT = 15:00 UTC
}
