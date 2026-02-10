# Comparador de Períodos com ML - Design Document

## 📊 Análise das Melhores Faixas de Período para SEO

Baseado em pesquisa de best practices de analytics e SEO testing:

### 🎯 Períodos Recomendados (em ordem de prioridade)

#### 1. **7 dias (1 semana)** - Prioridade ALTA
- **Uso**: Análise de curto prazo, detecção rápida de anomalias
- **Vantagens**: 
  - Captura padrões semanais (weekday vs weekend)
  - Suficiente para detectar mudanças significativas
  - Menos volátil que 24h
- **Comparação ideal**: Match day-of-week (ex: segunda vs segunda)

#### 2. **28 dias (~1 mês)** - Prioridade ALTA
- **Uso**: Análise mensal padrão, relatórios de performance
- **Vantagens**:
  - 4 semanas completas = melhor representação mensal
  - Mais estável que 30 dias (que varia entre 28-31)
  - Padrão do Google Search Console
- **Comparação ideal**: MoM (Month-over-Month) ou YoY

#### 3. **90 dias (3 meses/trimestre)** - Prioridade MÉDIA-ALTA
- **Uso**: Análise de tendências, planejamento estratégico
- **Vantagens**:
  - Suficiente para significância estatística
  - Captura ciclos de negócio completos
  - Base para forecasting
- **Comparação ideal**: YoY (Year-over-Year)

#### 4. **14 dias (2 semanas)** - Prioridade MÉDIA
- **Uso**: Campanhas curtas, testes A/B de SEO
- **Vantagens**:
  - Balanceia entre velocidade e volume de dados
  - Bom para campanhas sazonais curtas
- **Limitação**: Pode não capturar padrões mensais completos

#### 5. **24h (1 dia)** - Prioridade BAIXA
- **Uso**: Monitoramento real-time, alertas de anomalias
- **Vantagens**: Detecção imediata de problemas
- **Limitações**: 
  - Alta volatilidade (ruído)
  - Não estatisticamente significativo isoladamente
- **Recomendação**: Usar apenas como trigger de alerta, não para decisões

### ❌ Períodos a EVITAR

- **3 dias**: Muito curto, muita variabilidade
- **10 dias**: Não alinhado com ciclos semanais ou mensais
- **45 dias**: Híbrido estranho entre mensal e bimestral
- **60 dias**: Suficiente para análise, mas raramente usado na prática

---

## 🤖 Modelos de Machine Learning Recomendados

### 1. **Detecção de Anomalias (Anomaly Detection)**
```
Algoritmo: Prophet (Facebook) + Z-Score
Input: Série temporal de tráfego/orgânico
Output: Pontos de anomalia com explicação
```
- Prophet lida bem com sazonalidade e feriados
- Z-Score identifica outliers (threshold: 2-3 desvios padrão)
- Explicação: "Tráfego 45% abaixo do esperado para este dia"

### 2. **Forecasting (Predição)**
```
Algoritmo: ARIMA ou Prophet
Input: 90-180 dias de dados históricos
Output: Predição para próximos 7-28 dias com intervalo de confiança
```
- Útil para: "Se o padrão continuar, você terá X visitas no próximo mês"

### 3. **Comparação Estatística Significativa**
```
Teste: Two-sample t-test para séries temporais
Input: Período A vs Período B
Output: P-value, nível de confiança, effect size
```
- Threshold: p < 0.05 (95% confiança)
- Considerar: day-of-week matching para compararções justas

### 4. **Decomposição de Tendências**
```
Algoritmo: STL (Seasonal and Trend decomposition using Loess)
Input: Série temporal
Output: Componentes de tendência, sazonalidade e residual
```
- Permite visualizar: "O crescimento é sustentável ou sazonal?"

---

## 🎨 Interface do Comparador

### Layout Proposto

```
┌─────────────────────────────────────────────────────────────┐
│  COMPARADOR DE PERÍODOS ML                    [? Ajuda]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Período Base:          Período de Comparação:             │
│  ┌─────────────┐        ┌─────────────┐                    │
│  │ Últimos     │        │ 7 dias      │                    │
│  │ 7 dias  ▼   │   vs   │ anteriores ▼│                    │
│  └─────────────┘        └─────────────┘                    │
│                                                             │
│  [x] Match day-of-week    [x] Excluir feriados             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 RESULTADO DA COMPARAÇÃO                                │
│                                                             │
│  Tráfego Orgânico:                                         │
│  Período Base: 12,450 visits                               │
│  Período Comp: 11,200 visits                               │
│  ─────────────────────────────────────────                  │
│  Δ -10.0%  │  p=0.03  │  ✅ Significativo (95%)           │
│                                                             │
│  [Gráfico de comparação lado a lado]                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🤖 INSIGHTS DO ML                                         │
│                                                             │
│  🔴 Anomalia detectada: Queda de 45% no dia 14/02          │
│     Possível causa: Atualização do Google (Feb 2024 Core)  │
│                                                             │
│  📊 Forecast: Tendência de alta para próximos 7 dias       │
│     Predição: 13,200 visitas (+6% vs período atual)        │
│                                                             │
│  🎯 Recomendação: Investir em conteúdo sobre [tópico X]    │
│     Baseado em: Palavras-chave em alta durante o período   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Visuais

1. **Date Range Picker Dual**
   - Seleção intuitiva de período base vs comparação
   - Presets: 7d, 14d, 28d, 90d
   - Visualização de overlap no calendário

2. **Comparison Chart**
   - Tipo: Line chart com duas séries
   - Features:
     - Linha sólida: Período base
     - Linha tracejada: Período comparação
     - Shaded area: Intervalo de confiança
     - Markers: Pontos de anomalia

3. **Statistical Summary Card**
   - Delta percentual
   - P-value
   - Nível de confiança (indicador visual)
   - Effect size (Cohen's d)

4. **Insights Panel**
   - Anomalias detectadas com explicação
   - Forecast para próximos dias
   - Recomendações acionáveis

---

## 🔧 Implementação Técnica

### Stack Tecnológico
- **Frontend**: React + Recharts + shadcn/ui
- **ML/Analytics**: 
  - Prophet (via Python microservice ou WASM)
  - Simple-statistics (JS) para cálculos estatísticos
  - ml.js para algoritmos leves

### Estrutura de Dados
```typescript
interface PeriodComparison {
  basePeriod: {
    startDate: Date
    endDate: Date
    metrics: MetricData
  }
  comparisonPeriod: {
    startDate: Date
    endDate: Date
    metrics: MetricData
  }
  statisticalTest: {
    pValue: number
    confidenceLevel: number
    isSignificant: boolean
    effectSize: number
  }
  mlInsights: {
    anomalies: AnomalyPoint[]
    forecast: ForecastPoint[]
    recommendations: string[]
  }
}

interface MetricData {
  organicTraffic: number
  impressions: number
  clicks: number
  ctr: number
  averagePosition: number
  dailyData: DailyPoint[]
}
```

### Algoritmo de Comparação
```
1. Normalizar os dados (tratar missing values, outliers)
2. Aplicar day-of-week matching se habilitado
3. Calcular estatísticas descritivas para ambos os períodos
4. Executar two-sample t-test
5. Calcular effect size (Cohen's d)
6. Determinar significância (p < 0.05)
7. Executar Prophet para decomposição e forecasting
8. Detectar anomalias usando Z-score
9. Gerar insights textuais baseados nos resultados
```

---

## 📋 Requisitos Funcionais

### MVP (Fase 1)
- [ ] Seleção de período base e comparação
- [ ] Cálculo estatístico básico (média, delta, p-value simulado)
- [ ] Gráfico de comparação visual
- [ ] Indicador de significância estatística

### Fase 2
- [ ] Integração com Prophet para forecasting
- [ ] Detecção de anomalias automática
- [ ] Recomendações baseadas em dados
- [ ] Exportação de relatório PDF

### Fase 3
- [ ] Comparação multi-período (3+ períodos)
- [ ] Cohort analysis
- [ ] Integração com Google Search Console API
- [ ] Alertas automáticos de anomalias

---

## 🎯 Métricas de Sucesso

- Usuário consegue identificar se uma mudança é significativa em < 30 segundos
- Redução de 50% nas decisões baseadas em "achismo" vs dados estatísticos
- Taxa de falsos positivos de anomalias < 10%
