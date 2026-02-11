/**
 * Utilitário para detectar se estamos rodando em plataforma nativa (Capacitor)
 * Graceful degradation: tudo funciona no web também via browser APIs
 */

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  // Capacitor injeta window.Capacitor quando rodando como app nativo
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as any).Capacitor
  if (!cap?.isNativePlatform?.()) return 'web'
  return cap.getPlatform?.() ?? 'web'
}
