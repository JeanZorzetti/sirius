'use client'

import { useState } from 'react'

export function ROIAutomacaoCalc() {
  const [horas, setHoras] = useState(10)
  const [salario, setSalario] = useState(8000)

  const valorHora = salario / 176
  const horasRecuperadasAno = Math.round(horas * 52 * 0.6)
  const valorRecuperado = Math.round(horasRecuperadasAno * valorHora)

  return (
    <div className="border-2 border-border rounded-xl p-6 my-8 bg-card not-prose">
      <h3 className="text-xl font-bold mb-2 text-foreground">⚡ Calculadora: Quanto Vale Automatizar suas Vendas?</h3>
      <p className="text-muted-foreground mb-6">
        Descubra quanto tempo e dinheiro você recupera com automação de CRM.
      </p>

      <div className="space-y-5 mb-6">
        <div>
          <label className="block font-semibold mb-2 text-foreground text-sm">
            Horas por semana em tarefas administrativas (follow-up manual, planilhas, relatórios):
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={horas}
            onChange={(e) => setHoras(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-center font-bold text-foreground mt-1">
            {horas} horas/semana
          </p>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-foreground text-sm">
            Sua renda mensal (R$):
          </label>
          <input
            type="range"
            min={3000}
            max={50000}
            step={1000}
            value={salario}
            onChange={(e) => setSalario(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-center font-bold text-foreground mt-1">
            R$ {salario.toLocaleString('pt-BR')}/mês
          </p>
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 text-center">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-3xl font-bold text-foreground">{horasRecuperadasAno}</p>
            <p className="text-sm text-foreground">horas recuperadas/ano</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              R$ {valorRecuperado.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-foreground">em tempo recuperado/ano</p>
          </div>
        </div>
        <p className="text-xs text-foreground mb-4">
          Baseado em 60% de automação do tempo administrativo
        </p>
        <a
          href="/register"
          className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-semibold text-sm no-underline hover:bg-destaque transition-colors"
        >
          Começar a economizar agora →
        </a>
      </div>
    </div>
  )
}
