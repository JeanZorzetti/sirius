# Contrato de tokens: a pele do app (spec 010)

Sem entidade de banco. O "modelo" é o contrato de cor que `app/app-pele.css` publica para toda a área logada.

## Primitivos (valores do Pipeline, `hoje.css`)

| Nome | Claro | Escuro |
|---|---|---|
| fundo | `oklch(0.975 0.004 250)` gelo | `oklch(0.19 0.028 262)` noite |
| painel | `oklch(0.955 0.006 250)` | `oklch(0.215 0.028 262)` |
| cartão | `oklch(0.995 0.002 250)` | `oklch(0.25 0.028 262)` |
| tinta | `oklch(0.22 0.02 255)` grafite | `oklch(0.96 0.008 85)` gelo-quente |
| tinta-2 | `oklch(0.45 0.02 255)` | `oklch(0.76 0.02 262)` |
| fio | tinta / .12 | tinta / .1 |
| fio-forte | tinta / .3 | tinta / .22 |
| acento de ação | `oklch(0.22 0.02 255)` (botão = tinta) | `oklch(0.88 0.09 78)` âmbar |
| pulso | `oklch(0.56 0.2 29)`; texto `oklch(0.5 0.19 29)` | `oklch(0.66 0.18 29)` |

## Variáveis do shadcn

`--background` fundo · `--card`/`--popover` cartão · `--foreground` tinta · `--muted`/`--secondary`/`--accent` painel ·
`--muted-foreground` tinta-2 · `--primary` acento de ação · `--primary-foreground` fundo (claro) / noite (escuro) ·
`--destructive` pulso de texto · `--border` fio · `--input` fio-forte · `--ring` acento de ação · `--radius` 4px ·
`--sidebar*` iguais a fundo/tinta/painel/acento · `--chart-1..5` grafite, pulso, verde, âmbar, tinta-2 (escuro: gelo-quente,
âmbar, verde, pulso, tinta-2).

## Paleta do Tailwind remapeada

Luminosidade por degrau = a do Tailwind (50 .985 · 100 .967 · 200 .92 · 300 .871 · 400 .705 · 500 .552 · 600 .442 ·
700 .37 · 800 .274 · 900 .21 · 950 .141). Matiz e croma:

| Rampa | Matizes do Tailwind | Matiz | Croma (claro → escuro) |
|---|---|---|---|
| neutra | zinc slate gray neutral stone + indigo violet purple blue sky cyan fuchsia pink teal | 250 → 262 nos degraus 800–950 | .004 → .028 |
| verde | green emerald lime | 152 | até .13 no 500 |
| âmbar | amber yellow orange | 75 | até .14 no 500 |
| pulso | red rose | 29 | até .2 no 500 |

`--color-white` = cartão; `--color-black` = `oklch(0.141 0.028 262)`.

## Regras de forma

Canto 4 px (rounded-md…3xl; pílula com `px-`); sombra só em `[data-slot$="-content"]` e avisos; sem `backdrop-filter`;
gradiente achatado na cor de partida (exceto sobreposições `from-black`/`from-transparent`/`from-white`).
