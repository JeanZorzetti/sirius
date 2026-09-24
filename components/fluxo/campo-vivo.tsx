'use client'

import { useEffect, useRef } from 'react'
import { desenharCampo, semear } from './geometria'

// The live field. It paints over the server poster (same geometry, more lines) and combs the
// tangle as the page scrolls. Redraws only when the comb moves, so there is no loop to pause.
export function CampoVivo() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const campo = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !campo || !ctx) return

    const estilo = getComputedStyle(campo)
    const cores = {
      linha: estilo.getPropertyValue('--campo-linha').trim(),
      pulso: estilo.getPropertyValue('--campo-pulso').trim(),
    }
    const parado = matchMedia('(prefers-reduced-motion: reduce)').matches
    let linhas = semear(190)
    let w = 0
    let h = 0
    let pente = 0
    let raf = 0

    const desenhar = () => {
      raf = 0
      desenharCampo(ctx, linhas, w, h, pente, cores, w < 700 ? 240 : 360)
      campo.dataset.estado = 'vivo'
    }
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(desenhar)
    }
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      linhas = semear(w < 700 ? 110 : 190)
      pedir()
    }
    // The comb completes in 60vh of scroll; below that the field stops changing.
    const rolar = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.6)))
      if (Math.abs(p - pente) > 0.004) {
        pente = p
        pedir()
      }
    }

    const observador = new ResizeObserver(medir)
    observador.observe(canvas)
    if (!parado) {
      window.addEventListener('scroll', rolar, { passive: true })
      rolar()
    }
    return () => {
      observador.disconnect()
      window.removeEventListener('scroll', rolar)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={ref} className="campo__vivo" aria-hidden="true" />
}
