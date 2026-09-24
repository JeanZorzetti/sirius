# Data Model: tokens da pele

Não há dado persistido. A "entidade" desta spec é o contrato de tokens, válido dentro de `[data-art="fluxo"]`
(a home e o layout `(marketing)`), definido em `app/fluxo-pele.css`.

## Primitivos (valores da home, `(fluxo)/fluxo.css` de 23/09)

| Token | Hex (fallback) | OKLCH | Papel |
|---|---|---|---|
| `--gelo` | `#f5f7f9` | `0.975 0.004 250` | fundo |
| `--gelo-escuro` **(novo)** | `#eef1f4` | `0.955 0.006 250` | superfície secundária: hover, painel, selo |
| `--grafite` | `#141b24` | `0.22 0.02 255` | texto, botão principal |
| `--grafite-suave` | `#4e5661` | `0.45 0.02 255` | texto secundário |
| `--fio` | grafite 12% | `0.22 0.02 255 / .12` | separador, borda |
| `--fio-forte` | grafite 30% | `0.22 0.02 255 / .3` | borda de campo, contorno do botão secundário |
| `--pulso` | `#d02d23` | `0.56 0.2 29` | acento em texto grande e linha (4,79:1) |
| `--pulso-escuro` | `#b71b14` | `0.5 0.19 29` | acento em texto pequeno, botão sob o ponteiro (6,16:1) |
| `--campo-cinza` | `#303b4a` | `0.35 0.03 255` | só as linhas da home |

## Semânticos (variáveis do shadcn, dentro do escopo)

| Variável | Aponta para |
|---|---|
| `--background`, `--card`, `--popover` | `--gelo` |
| `--foreground`, `--card-foreground`, `--popover-foreground` | `--grafite` |
| `--primary` / `--primary-foreground` | `--grafite` / `--gelo` |
| `--secondary`, `--muted`, `--accent` | `--gelo-escuro` |
| `--secondary-foreground`, `--accent-foreground` | `--grafite` |
| `--muted-foreground` | `--grafite-suave` |
| `--destructive` / `--destructive-foreground` | `--pulso-escuro` / `--gelo` |
| `--border` | `--fio` |
| `--input` | `--fio-forte` |
| `--ring` | `--pulso-escuro` |
| `--radius` | `4px` |
| `--marca-pingo` | `--pulso` (já era assim na home) |
| `--chart-1…5` | grafite, pulso, grafite suave, campo cinza, fio forte (se a calculadora usar) |

Utilitário novo no `@theme inline` de `theme.css`: `--color-destaque: var(--pulso-escuro)` (`text-destaque`,
`bg-destaque`, `border-destaque`). Fora do escopo a variável não existe; só as páginas públicas usam a classe.

## Regras de escopo (o que o token sozinho não alcança)

- Sombra: `[class*="shadow"]` zera `--tw-shadow` (o anel de foco fica).
- Raio: `.rounded-xl/.rounded-2xl/.rounded-3xl` → `var(--radius)`.
- Tema: `color-scheme: light`; a variante `dark:` não casa dentro de `[data-art]` (`theme.css`).
- Página: fundo gelo, texto grafite, fonte de texto da home, `::selection` e foco visível como na home.

## Validação

- Contraste de cada par texto/fundo usado: grafite e grafite suave sobre gelo e gelo escuro; gelo sobre grafite e
  pulso escuro. Medido na verificação (quickstart), piso AA.
