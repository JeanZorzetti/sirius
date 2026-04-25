'use client'

import { Capacitor } from '@capacitor/core'

export async function saveFileNative(
  filename: string,
  data: string,
  mimeType: string = 'application/octet-stream'
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback: trigger browser download
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return true
  }

  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    return true
  } catch {
    return false
  }
}

export async function readFileNative(filename: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const result = await Filesystem.readFile({
      path: filename,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
    return result.data as string
  } catch {
    return null
  }
}

export async function cacheData(key: string, data: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    try { localStorage.setItem(`cache_${key}`, data) } catch {}
    return
  }
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    await Filesystem.writeFile({
      path: `cache/${key}.json`,
      data,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    })
  } catch {}
}

export async function getCachedData(key: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return localStorage.getItem(`cache_${key}`)
  }
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const result = await Filesystem.readFile({
      path: `cache/${key}.json`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
    return result.data as string
  } catch {
    return null
  }
}
