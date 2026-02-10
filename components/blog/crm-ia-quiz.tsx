'use client'

import { useState } from 'react'

const questions = [
  'Você sabe quais leads têm mais chance de fechar esta semana?',
  'Seu CRM avisa quando um cliente antigo está no ciclo de recompra?',
  'Você recebe previsões automáticas do seu forecast mensal?',
  'O sistema sugere o melhor momento para entrar em contato com cada cliente?',
  'Você consegue ver quais deals correm risco de esfriar antes que aconteça?',
]

const results = [
  {
    range: [0, 1],
    level: 'Iniciante em IA',
    borderColor: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    titleColor: 'text-red-700 dark:text-red-400',
    advice:
      'Seu processo ainda depende muito de memória e controle manual. Você está perdendo entre 30% e 50% das oportunidades por falta de automação. O Sirius CRM pode mudar isso gratuitamente.',
  },
  {
    range: [2, 3],
    level: 'Intermediário — crescendo',
    borderColor: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    titleColor: 'text-amber-700 dark:text-amber-400',
    advice:
      'Você usa algumas funcionalidades modernas, mas ainda há gaps importantes. Com um CRM com IA completo, você pode dobrar a eficiência do seu time em 90 dias.',
  },
  {
    range: [4, 5],
    level: 'Avançado — parabéns!',
    borderColor: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    titleColor: 'text-green-700 dark:text-green-400',
    advice:
      'Seu time já usa IA de forma madura. O próximo passo é otimizar: qual funcionalidade de IA está gerando mais ROI? Concentre esforços aí.',
  },
]

export function CRMIAQuiz() {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = Object.values(answers).filter(Boolean).length
  const result = submitted ? results.find((r) => score >= r.range[0] && score <= r.range[1]) : null
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className="border-2 border-border rounded-xl p-6 my-8 bg-card not-prose">
      <h3 className="text-xl font-bold mb-2 text-foreground">🧠 Diagnóstico: Seu CRM está Pronto para IA?</h3>
      <p className="text-muted-foreground mb-6">
        Responda 5 perguntas e descubra seu nível de maturidade em IA nas vendas.
      </p>

      {!submitted ? (
        <div className="space-y-5">
          {questions.map((q, i) => (
            <div key={i}>
              <p className="font-semibold text-foreground mb-2">
                {i + 1}. {q}
              </p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-foreground">
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === true}
                    onChange={() => setAnswers((prev) => ({ ...prev, [i]: true }))}
                    className="accent-primary"
                  />
                  Sim
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-foreground">
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === false}
                    onChange={() => setAnswers((prev) => ({ ...prev, [i]: false }))}
                    className="accent-primary"
                  />
                  Não
                </label>
              </div>
            </div>
          ))}
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2"
          >
            Ver meu diagnóstico →
          </button>
        </div>
      ) : (
        <div className={`border-l-4 p-5 rounded-r-xl ${result?.borderColor} ${result?.bg}`}>
          <p className={`font-bold text-lg mb-2 ${result?.titleColor}`}>
            Resultado: {result?.level} ({score}/5)
          </p>
          <p className="text-zinc-700 dark:text-zinc-300 mb-4">{result?.advice}</p>
          <div className="flex gap-3 flex-wrap items-center">
            <a
              href="/register"
              className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm no-underline hover:opacity-90 transition-opacity"
            >
              Começar com Sirius CRM gratuitamente →
            </a>
            <button
              onClick={() => {
                setAnswers({})
                setSubmitted(false)
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline bg-transparent border-none cursor-pointer p-0"
            >
              ← Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
