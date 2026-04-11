'use client'

/**
 * IndexedDB Cache para dados de leitura — Sprint 3.2 do roadmap mobile.
 *
 * Objetivo: permitir que o app continue funcional offline ou em redes lentas
 * mantendo cópias locais dos dados quase-estáticos do usuário:
 * - Top contatos
 * - Deals do pipeline ativo
 * - Últimas conversas do chat
 * - Pipelines/stages (raramente mudam)
 *
 * Estratégia de uso:
 * 1. Telas leem do cache imediatamente (instant render)
 * 2. Em paralelo, fetch da API atualiza UI + cache (stale-while-revalidate)
 * 3. Quando offline, cache é a única fonte
 *
 * Não substitui a fila de mutations (offline.ts) — esses são leituras.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb'

const DB_NAME = 'sirius-cache'
const DB_VERSION = 1

interface SiriusDB extends DBSchema {
  contacts: {
    key: string
    value: CachedRecord<unknown>
  }
  deals: {
    key: string
    value: CachedRecord<unknown>
  }
  conversations: {
    key: string
    value: CachedRecord<unknown>
  }
  pipelines: {
    key: string
    value: CachedRecord<unknown>
  }
}

export type CacheStore = 'contacts' | 'deals' | 'conversations' | 'pipelines'

interface CachedRecord<T> {
  id: string
  data: T
  cachedAt: number
}

let dbPromise: Promise<IDBPDatabase<SiriusDB>> | null = null

function getDB(): Promise<IDBPDatabase<SiriusDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available on server'))
  }
  if (!dbPromise) {
    dbPromise = openDB<SiriusDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('contacts')) {
          db.createObjectStore('contacts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('deals')) {
          db.createObjectStore('deals', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('pipelines')) {
          db.createObjectStore('pipelines', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

/**
 * Salva múltiplos registros no cache. Cada registro precisa ter um campo `id`.
 */
export async function cachePutMany<T extends { id: string }>(
  store: CacheStore,
  records: T[],
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await getDB()
    const tx = db.transaction(store, 'readwrite')
    const now = Date.now()
    await Promise.all(
      records.map((record) =>
        tx.store.put({ id: record.id, data: record, cachedAt: now }),
      ),
    )
    await tx.done
  } catch (err) {
    console.warn(`[offline-cache] failed to put ${store}:`, err)
  }
}

/**
 * Lê todos os registros de uma store, opcionalmente filtrando por idade máxima.
 */
export async function cacheGetAll<T>(
  store: CacheStore,
  maxAgeMs?: number,
): Promise<T[]> {
  if (typeof window === 'undefined') return []
  try {
    const db = await getDB()
    const records = await db.getAll(store)
    const cutoff = maxAgeMs ? Date.now() - maxAgeMs : 0
    return records
      .filter((r) => !maxAgeMs || r.cachedAt >= cutoff)
      .map((r) => r.data as T)
  } catch (err) {
    console.warn(`[offline-cache] failed to read ${store}:`, err)
    return []
  }
}

/**
 * Lê um registro específico pelo ID.
 */
export async function cacheGet<T>(store: CacheStore, id: string): Promise<T | null> {
  if (typeof window === 'undefined') return null
  try {
    const db = await getDB()
    const record = await db.get(store, id)
    return record ? (record.data as T) : null
  } catch {
    return null
  }
}

/**
 * Remove um registro específico (usado quando uma DELETE_DEAL é confirmada online).
 */
export async function cacheDelete(store: CacheStore, id: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await getDB()
    await db.delete(store, id)
  } catch {
    /* no-op */
  }
}

/**
 * Limpa toda uma store. Use depois de logout ou troca de organização.
 */
export async function cacheClear(store: CacheStore): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await getDB()
    await db.clear(store)
  } catch {
    /* no-op */
  }
}

/**
 * Limpa todas as stores — útil em logout.
 */
export async function cacheClearAll(): Promise<void> {
  if (typeof window === 'undefined') return
  await Promise.all([
    cacheClear('contacts'),
    cacheClear('deals'),
    cacheClear('conversations'),
    cacheClear('pipelines'),
  ])
}
