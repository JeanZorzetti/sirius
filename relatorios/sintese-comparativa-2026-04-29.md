# Síntese Comparativa — Knowledge Graphs

> **Sirius CRM vs Prolife Med** · Gerado em 29/04/2026

---

## Visão Geral

| Propriedade | Sirius CRM | Prolife Med |
|---|---|---|
| **Domínio** | B2B SaaS / Vendas | Telemedicina / Saúde Digital |
| **Arquivo** | knowledge-graph-2026-04-29-sirius.md | knowledge-graph-2026-04-29-prolife.md |
| **Gerado em** | 29/04/2026 às 14:36 | 29/04/2026 às 11:26 |
| **Entidades totais** | **430** | **412** |
| **Relacionamentos totais** | **332** | **782** |
| **Rel/Entidade (média)** | **0,77** | **1,90** |
| **Confiança mínima** | 0.3 | 0.3 |

> Os dois grafos são **completamente distintos**: domínios diferentes, dados diferentes, extraídos de blogs distintos. O Sirius CRM tem mais entidades, mas muito menos relacionamentos — o que revela diferenças significativas na densidade semântica de cada corpus.

---

## Densidade Semântica

O indicador mais revelador é a razão **relacionamentos por entidade**:

| Grafo | Entidades | Relacionamentos | Rel/Entidade | Interpretação |
|-------|-----------|----------------|--------------|---------------|
| Sirius CRM | 430 | 332 | **0,77** | Grafo esparso — muitas entidades isoladas |
| Prolife Med | 412 | 782 | **1,90** | Grafo denso — bem interconectado |

O Prolife tem 2,4× mais relacionamentos por entidade. Isso indica que o conteúdo médico do Prolife estabelece conexões mais explícitas entre os conceitos (causa/trata/especialidade), enquanto o conteúdo do Sirius CRM tem mais entidades mencionadas de passagem, sem relações ricas entre elas.

---

## Distribuição por Tipo de Entidade

| Tipo | Sirius CRM | % | Tipo | Prolife Med | % |
|------|-----------|---|------|------------|---|
| Tool | 103 | 24,0% | Doença | 33 | 8,0% |
| Industry | 68 | 15,8% | Conceito | 25 | 6,1% |
| Concept | 63 | 14,7% | Sintoma | 21 | 5,1% |
| Technology | 58 | 13,5% | Especialidade | 19 | 4,6% |
| Methodology | 41 | 9,5% | Medicamento | 12 | 2,9% |
| Persona | 31 | 7,2% | Procedimento | 10 | 2,4% |
| Other | 21 | 4,9% | — | — | — |
| Metric | 20 | 4,7% | — | — | — |
| Process | 17 | 4,0% | — | — | — |
| Geography | 8 | 1,9% | — | — | — |

O Sirius tem **10 tipos** de entidade contra **6** do Prolife — mais granular, porém mais fragmentado. O Prolife compensa com maior coerência semântica dentro de menos categorias.

---

## Tipos de Relacionamento

| Relação | Sirius CRM | % | Relação | Prolife Med | % |
|---------|-----------|---|---------|------------|---|
| uses | 80 | 24,1% | relacionado a | 115 | 43,2% |
| relatedTo | 63 | 19,0% | trata | 48 | 18,0% |
| usedIn | 59 | 17,8% | causa | 47 | 17,7% |
| usedBy | 37 | 11,1% | especialidade de | 44 | 16,5% |
| enables | 21 | 6,3% | previne | 9 | 3,4% |
| partOf | 19 | 5,7% | excludes | 1 | 0,4% |
| servesIndustry | 14 | 4,2% | — | — | — |
| instanceOf | 10 | 3,0% | — | — | — |
| solves | 10 | 3,0% | — | — | — |
| outros | 19 | 5,7% | — | — | — |

**Insight crítico:** O Sirius usa predicados mais **prescritivos e funcionais** (*uses*, *enables*, *solves*, *instanceOf*) — o grafo descreve como ferramentas e metodologias se relacionam. O Prolife usa majoritariamente *relacionado a* (43%), relação fraca semanticamente. O Sirius tem vocabulário relacional mais rico, mas volume menor.

---

## Entidades-Âncora (hubs)

### Sirius CRM — Top 5
| Entidade | Tipo | Conexões | Conteúdos |
|----------|------|----------|-----------|
| **CRM** | Technology | 78 | 41 |
| **Sales Representative** | Persona | 26 | 15 |
| **Funil de Vendas** | Concept | 21 | 1 |
| **Brazil** | Geography | 15 | 23 |
| **SPIN Selling** | Methodology | 13 | 20 |

### Prolife Med — Top 5
| Entidade | Tipo | Conexões | Menções |
|----------|------|----------|---------|
| **Telemedicina** | Conceito | 57 | 29 |
| **Hipertensão** | Doença | 19 | 11 |
| **Diabetes** | Doença | 16 | 15 |
| **Medicamentos** | Medicamento | 16 | 9 |
| **Saúde mental** | Especialidade | 15 | 16 |

**CRM** (78 conexões) supera **Telemedicina** (57 conexões) como hub mais conectado de ambos os grafos. Ambos refletem o posicionamento central de cada plataforma: o Sirius se organiza em torno do produto CRM; o Prolife em torno do conceito de telemedicina.

Diferença notável: o hub do Sirius é um **produto** (`CRM` com 41 conteúdos vinculados), enquanto o hub do Prolife é um **conceito** (`Telemedicina`). Isso indica que o Sirius tem conteúdo mais concentrado num único nó, criando dependência excessiva.

---

## Problemas de Qualidade de Dados

### Sirius CRM
| Problema | Evidência | Impacto |
|---------|-----------|---------|
| **Duplicação massiva de entidades** | "Sirius CRM" aparece com mesmo slug em 30+ linhas da tabela Tools | Inflaciona contagem de entidades; cria ruído no grafo |
| **Duplicação de ferramentas** | HubSpot, Pipedrive, Salesforce, LinkedIn, WhatsApp, BANT, MEDDIC, etc. listados múltiplas vezes com mesmos slugs | Mesma causa: extração sem deduplicação por artigo |
| **Entidades sem conexões** | ~40% das entidades têm 0 conexões | Entidades mencionadas mas não relacionadas a outras |
| **Grafo esparso** | 332 rels para 430 entidades = 0,77 média | Muitas entidades aparecem 1x em 1 artigo, sem ponte para o restante |

### Prolife Med
| Problema | Evidência | Impacto |
|---------|-----------|---------|
| **Relação genérica dominante** | 43% dos links são "relacionado a" | Pouca informação semântica nos relacionamentos |
| **Diabetes fragmentado** | 5 variantes (tipo 1, tipo 2, gestacional, mellitus, pré-diabetes) com baixa interconexão | Fragmenta o cluster metabólico |
| **Relação bidirecional incorreta** | `Diabetes Tipo 1 | trata | Insulina` + `Insulina | trata | Diabetes Tipo 1` | Direção correta: só Insulina→Diabetes |
| **Entidade duplicada** | "Conselho Federal de Medicina" com slugs `cfm` e `conselho-federal-de-medicina` | Nó partido em dois |
| **"previne" escasso** | 9 ocorrências vs 47 "causa" | Conteúdo preventivo ausente |

---

## Clusters Temáticos

### Sirius CRM — Clusters identificados

**1. Cluster CRM + Automação**
Núcleo: CRM (78 conn) → Automação de Vendas (11) → Automação de E-mail (7) → AgaaS/Sofia IA
- Bem estruturado, muitos *enables* e *uses* entre si

**2. Cluster Metodologias de Vendas**
Núcleo: SPIN Selling (13) + Sandler Selling System (8) + BANT/MEDDIC + Sales Representative (26)
- Maior concentração de conteúdo (SPIN com 20 artigos, 13 conexões)
- MEDDPICC, LAER, BANT aparecem duplicados — risco de fragmentação

**3. Cluster Prospecção**
Núcleo: Prospection (7) + Scraping Ético (5) + Sales Intelligence (5) + LinkedIn/Google Maps
- Cluster coeso com *uses* bem definidos

**4. Cluster Pipeline/Funil**
Núcleo: Funil de Vendas (21) + Pipeline de Vendas (3) + Lead Decay + Context Switching Cost
- Hub subutilizado: Funil de Vendas tem 21 conexões mas apenas **1 conteúdo** vinculado

**5. Cluster WhatsApp/IA**
Núcleo: WhatsApp (4 artigos) + AgaaS + Sofia IA + Agentes IA + Evolution API
- Cluster emergente, reflete nova direção AgaaS do produto

### Prolife Med — Clusters identificados

**1. Cluster Metabólico-Endócrino** — Diabetes + Insulina + Obesidade + Endocrinologia
**2. Cluster Saúde Mental** — Ansiedade + Depressão + Psiquiatria + Psicologia
**3. Cluster Cardiovascular** — Hipertensão + AVC + Infarto + Cardiologia
**4. Cluster Neurológico** — Enxaqueca + Cefaleia + Neurologia
**5. Cluster Regulatório** — Telemedicina + Lei nº 14.510/2022 + CFM + ANVISA
**6. Cluster Saúde Ocupacional** — NR-1 + Riscos Psicossociais + PGR

---

## Oportunidades por Projeto

### Sirius CRM
| Área | Problema | Ação |
|------|---------|------|
| **Deduplicação urgente** | ~30 slugs `sirius-crm` duplicados; HubSpot, BANT, MEDDIC etc. repetidos | Implementar deduplicação no extrator por `(name, type)` antes de inserir |
| **Funil de Vendas** | 21 conexões, apenas 1 artigo | Criar artigos internos sobre etapas do funil |
| **Cluster WhatsApp/IA** | Emergente, poucos relacionamentos | Investir em conteúdo AgaaS para densificar |
| **Métricas isoladas** | ~40% de Metrics com 0 conexões (Churn, MRR, etc.) | Artigos de análise que liguem métricas a ferramentas e processos |
| **Geography subutilizado** | Brazil (15 conn, 23 artigos) — bom, mas demais cidades zeradas | Conteúdo regional (PMEs brasileiras, LGPD) |

### Prolife Med
| Área | Problema | Ação |
|------|---------|------|
| **Predicados genéricos** | 43% "relacionado a" | Próximo ciclo de extração priorizar *trata*, *causa*, *previne* |
| **Conteúdo preventivo** | 9 "previne" vs 47 "causa" | Artigos de prevenção primária |
| **Medicamentos** | Razão 0,36 med/doença | Artigos de farmacologia por condição |
| **Entidades isoladas** | Síndrome das Pernas Inquietas, Cronobiologia, etc. | Reprocessar artigos ou criar conteúdo-ponte |

---

## Comparação de Maturidade

| Dimensão | Sirius CRM | Prolife Med | Vantagem |
|----------|-----------|-------------|---------|
| Volume de entidades | 430 | 412 | Sirius (+4%) |
| Densidade (rel/ent) | 0,77 | 1,90 | **Prolife (2,4×)** |
| Riqueza de predicados | 14 tipos | 6 tipos | **Sirius** |
| Qualidade dos predicados | Alta (*uses*, *enables*, *solves*) | Baixa (43% genérico) | **Sirius** |
| Cobertura de conteúdo | CRM concentrado (41 art.) | Distribuído | Prolife |
| Duplicação | **Grave** (~30+ duplicatas) | Moderada (4–5 casos) | Prolife |
| Clusters identificados | 5 | 6 | Similar |
| Hub principal | CRM (78 conn) | Telemedicina (57 conn) | Sirius em conectividade |

---

## Conclusão

Os dois grafos são **complementares em suas fraquezas**: o Sirius CRM tem predicados funcionais ricos mas sofre de duplicação severa e baixa densidade; o Prolife tem boa densidade mas predicados fracos e semanticamente pobres.

**Prioridade imediata para Sirius CRM:** corrigir a deduplicação de entidades no pipeline de extração. Com ~30 slugs `sirius-crm` duplicados e dezenas de outros (HubSpot, BANT, Pipedrive repetidos), as métricas de 430 entidades e 332 relacionamentos estão infladas — o grafo real é menor e mais esparso do que os números indicam.

**Prioridade imediata para Prolife Med:** substituir "relacionado a" por predicados específicos nas próximas extrações. 43% de relações genéricas limitam diretamente a qualidade das recomendações semânticas.

---

*Síntese gerada em 29/04/2026 com base nos arquivos `knowledge-graph-2026-04-29-sirius.md` (430 ent., 332 rel.) e `knowledge-graph-2026-04-29-prolife.md` (412 ent., 782 rel.).*
