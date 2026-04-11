/**
 * Thin wrapper sobre @capacitor/haptics que funciona em:
 * - App nativo (Capacitor): usa haptics reais
 * - Web/PWA: usa Vibration API como fallback (quando suportada)
 * - Desktop ou browsers sem suporte: no-op silencioso
 *
 * Todas as funções são safe — nunca throw.
 */

type ImpactStyle = 'light' | 'medium' | 'heavy'

let capacitorHaptics: typeof import('@capacitor/haptics') | null = null
let capacitorLoaded = false

async function loadCapacitor() {
  if (capacitorLoaded) return capacitorHaptics
  capacitorLoaded = true
  try {
    // Lazy import — evita carregar Capacitor em builds web puros
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      capacitorHaptics = await import('@capacitor/haptics')
    }
  } catch {
    capacitorHaptics = null
  }
  return capacitorHaptics
}

function webVibrate(ms: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms)
    } catch {
      /* no-op */
    }
  }
}

export async function hapticImpact(style: ImpactStyle = 'light') {
  const mod = await loadCapacitor()
  if (mod) {
    const impactStyle =
      style === 'light'
        ? mod.ImpactStyle.Light
        : style === 'medium'
          ? mod.ImpactStyle.Medium
          : mod.ImpactStyle.Heavy
    try {
      await mod.Haptics.impact({ style: impactStyle })
      return
    } catch {
      /* fall through to web */
    }
  }
  const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 35
  webVibrate(duration)
}

export async function hapticSuccess() {
  const mod = await loadCapacitor()
  if (mod) {
    try {
      await mod.Haptics.notification({ type: mod.NotificationType.Success })
      return
    } catch {
      /* fall through */
    }
  }
  webVibrate([10, 30, 10])
}

export async function hapticWarning() {
  const mod = await loadCapacitor()
  if (mod) {
    try {
      await mod.Haptics.notification({ type: mod.NotificationType.Warning })
      return
    } catch {
      /* fall through */
    }
  }
  webVibrate([15, 20, 15])
}

export async function hapticSelection() {
  const mod = await loadCapacitor()
  if (mod) {
    try {
      await mod.Haptics.selectionStart()
      await mod.Haptics.selectionChanged()
      await mod.Haptics.selectionEnd()
      return
    } catch {
      /* fall through */
    }
  }
  webVibrate(5)
}
