'use client'

import { Capacitor } from '@capacitor/core'

type KeyboardListener = (info: { keyboardHeight: number }) => void

export async function setupKeyboardListeners(
  onShow: KeyboardListener,
  onHide: () => void
) {
  if (!Capacitor.isNativePlatform()) return () => {}

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    const showHandle = await Keyboard.addListener('keyboardWillShow', onShow)
    const hideHandle = await Keyboard.addListener('keyboardWillHide', onHide)

    return () => {
      showHandle.remove()
      hideHandle.remove()
    }
  } catch {
    return () => {}
  }
}

export async function hideKeyboard() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    await Keyboard.hide()
  } catch {}
}
