// Símbolo: os dois pingos do wordmark soltos — Sirius A e Sirius B. Favicon, ícone do app, avatar.
// Receita: rA = 20; rB = rA / sqrt(2.063 / 1.018); B a 40° acima da horizontal, folga 3 entre as bordas.
// Pingo A em path próprio: pinta com --marca-pingo quando a direção define, senão herda currentColor.
// Mesmo raio-razão do wordmark (components/brand/wordmark.tsx) — não mudar um sem o outro.
export function Pingos({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="-22 -39.86 66.43 61.86" fill="currentColor" className={className} role="img" aria-label="Sirius">
      <path d="M14.33 -23.81A14.05 14.05 0 1 0 42.43 -23.81A14.05 14.05 0 1 0 14.33 -23.81Z" />
      <path d="M-20 0A20 20 0 1 0 20 0A20 20 0 1 0 -20 0Z" fill="var(--marca-pingo, currentColor)" />
    </svg>
  )
}
