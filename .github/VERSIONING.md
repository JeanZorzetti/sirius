# 📌 Versioning Guide - Sirius CRM

Este guia explica como o Sirius CRM utiliza **Semantic Versioning (semver)** para gerenciar releases.

## 🎯 Semantic Versioning (semver)

O Sirius CRM segue o padrão [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/).

### Formato

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Exemplo: 1.2.3-beta.1+20250105
```

### Componentes

```
v1.2.3-beta.1+20250105
│ │ │  │    │  │
│ │ │  │    │  └─ Build metadata (opcional)
│ │ │  │    └──── Prerelease identifier (opcional)
│ │ │  └───────── Prerelease version
│ │ └──────────── PATCH version
│ └────────────── MINOR version
└──────────────── MAJOR version
```

---

## 📊 Quando Incrementar Cada Versão

### MAJOR Version (X.0.0)

**Incrementa quando:** Há **breaking changes** (mudanças incompatíveis com versões anteriores)

**Exemplos:**
- Remoção de endpoints da API
- Mudança na estrutura de dados que quebra compatibilidade
- Remoção de features
- Mudança drástica na UI que requer re-treinamento do usuário
- Alteração de comportamento esperado que pode quebrar workflows existentes

**Exemplo Real:**
```
v1.5.3 → v2.0.0

Breaking Changes:
- Removido suporte para autenticação JWT (agora apenas OAuth)
- API v1 descontinuada (migre para API v2)
- Schema de deals alterado (campo "status" agora é enum)
```

### MINOR Version (x.Y.0)

**Incrementa quando:** Há **novas funcionalidades** compatíveis com versões anteriores

**Exemplos:**
- Adição de novas features
- Novos endpoints na API
- Novas opções de configuração
- Melhorias significativas em features existentes
- Adição de novos campos (opcional) no schema

**Exemplo Real:**
```
v1.2.5 → v1.3.0

New Features:
- Adicionado Multi-Pipeline support (PRO)
- Novo dashboard de Analytics PRO
- Email Automations configuráveis
- Google OAuth login
```

### PATCH Version (x.y.Z)

**Incrementa quando:** Há **bug fixes** compatíveis com versões anteriores

**Exemplos:**
- Correção de bugs
- Melhorias de performance sem mudança de API
- Atualização de dependências (patches de segurança)
- Correções de UI/UX
- Documentação atualizada

**Exemplo Real:**
```
v1.2.3 → v1.2.4

Bug Fixes:
- Corrigido drag & drop no Safari
- Corrigido cálculo de taxa de conversão
- Corrigido erro ao deletar contato com deals vinculados
- Performance: queries 30% mais rápidas
```

---

## 🏷️ Prerelease Versions

Usadas para versões em desenvolvimento ou beta testing.

### Formato

```
v1.3.0-alpha.1    # Primeira versão alpha
v1.3.0-beta.1     # Primeira versão beta
v1.3.0-rc.1       # Release candidate
```

### Tipos de Prerelease

| Tipo | Quando Usar | Estabilidade | Público |
|------|-------------|--------------|---------|
| **alpha** | Features em desenvolvimento | Instável | Interno (dev team) |
| **beta** | Features prontas para teste | Relativamente estável | Beta testers |
| **rc** | Candidato a release final | Estável | Early adopters |

**Exemplo de Ciclo:**
```
v1.3.0-alpha.1 → v1.3.0-alpha.2 → v1.3.0-alpha.3
       ↓
v1.3.0-beta.1 → v1.3.0-beta.2
       ↓
v1.3.0-rc.1 → v1.3.0-rc.2
       ↓
v1.3.0 (release final)
```

---

## 🔢 Build Metadata

Metadados opcionais que não afetam a precedência da versão.

**Formato:**
```
v1.2.3+20250105
v1.2.3+build.123
v1.2.3+sha.a1b2c3d
```

**Uso Comum:**
- Data do build: `+20250105`
- Número do build CI: `+build.456`
- Commit SHA: `+sha.a1b2c3d`

---

## 🚀 Release Workflow

### 1. Planejamento da Release

```bash
# Determine o tipo de release baseado nas mudanças
git log v1.2.0..HEAD --oneline

# Se houver:
# - Breaking changes → MAJOR
# - New features → MINOR
# - Bug fixes only → PATCH
```

### 2. Preparação

```bash
# 1. Crie uma branch de release
git checkout -b release/v1.3.0

# 2. Atualize o CHANGELOG.md
# Mova mudanças de [Unreleased] para [1.3.0] - YYYY-MM-DD

# 3. Atualize package.json
npm version 1.3.0 --no-git-tag-version

# 4. Commit
git add .
git commit -m "chore: bump version to 1.3.0"
```

### 3. Testing

```bash
# Rode todos os testes
npm test
npm run test:e2e

# Build de produção
npm run build

# Deploy em staging
# (testar manualmente)
```

### 4. Tag & Release

```bash
# 1. Merge para main
git checkout main
git merge release/v1.3.0

# 2. Crie tag com mensagem
git tag -a v1.3.0 -m "Release v1.3.0 - Multi-Pipeline Support"

# 3. Push tag para remote
git push origin v1.3.0

# 4. Push main
git push origin main
```

### 5. GitHub Release

1. Acesse: `https://github.com/JeanZorzetti/sirius/releases/new`
2. Selecione a tag: `v1.3.0`
3. Preencha usando [RELEASE_TEMPLATE.md](.github/RELEASE_TEMPLATE.md)
4. Marque "Set as latest release" (se estável)
5. Publish release

---

## 📋 Checklists

### ✅ Checklist para MAJOR Release

- [ ] Todas as breaking changes estão documentadas
- [ ] Migration guide criado
- [ ] Deprecations warnings adicionados na versão anterior
- [ ] Comunicação prévia para usuários (email, blog post)
- [ ] Suporte para versão anterior por X meses
- [ ] Testes de migração completos
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado

### ✅ Checklist para MINOR Release

- [ ] Novas features testadas (E2E + unit)
- [ ] Documentação das novas features
- [ ] Feature flags configurados (se aplicável)
- [ ] Rollback plan preparado
- [ ] CHANGELOG.md atualizado
- [ ] Release notes preparadas

### ✅ Checklist para PATCH Release

- [ ] Bug fixes testados
- [ ] Regressões verificadas
- [ ] CHANGELOG.md atualizado
- [ ] Hotfix branch (se urgente)

---

## 🎯 Naming Conventions

### Tags Git

```bash
# Stable releases
v1.0.0, v1.2.3, v2.0.0

# Prerelease
v1.3.0-alpha.1
v1.3.0-beta.2
v1.3.0-rc.1
```

### Branches

```bash
# Release branches
release/v1.3.0
release/v2.0.0

# Hotfix branches
hotfix/v1.2.4
hotfix/security-fix

# Development
main           # Stable, production-ready
develop        # Integration branch (se usar gitflow)
feature/*      # New features
bugfix/*       # Bug fixes
```

---

## 📈 Version History Examples

### Example: Feature Development

```
v1.0.0          # Initial release
v1.1.0          # Added email automations
v1.2.0          # Added multi-pipeline
v1.2.1          # Fixed pipeline selector bug
v1.3.0-beta.1   # Beta: Analytics PRO
v1.3.0          # Release: Analytics PRO
v1.3.1          # Hotfix: chart rendering
```

### Example: Breaking Change

```
v1.9.0          # Last v1 release
v1.9.1          # Deprecation warnings added
v2.0.0-rc.1     # Release candidate
v2.0.0          # Major release with breaking changes
v2.0.1          # Post-release hotfix
v2.1.0          # New feature in v2
```

---

## 🔗 Resources

- **Semantic Versioning:** https://semver.org/lang/pt-BR/
- **Keep a Changelog:** https://keepachangelog.com/pt-BR/
- **Conventional Commits:** https://www.conventionalcommits.org/pt-br/
- **GitHub Releases:** https://docs.github.com/en/repositories/releasing-projects-on-github

---

## 🤝 Contributing

Ao criar PRs, use commits convencionais para facilitar o changelog:

```bash
# Features (MINOR bump)
feat: add multi-pipeline support
feat(analytics): add forecast charts

# Bug fixes (PATCH bump)
fix: correct conversion rate calculation
fix(kanban): resolve drag & drop on Safari

# Breaking changes (MAJOR bump)
feat!: remove JWT authentication
BREAKING CHANGE: JWT auth replaced with OAuth

# Outros
docs: update API documentation
chore: bump dependencies
perf: optimize database queries
refactor: restructure analytics components
test: add E2E tests for pipelines
```

---

**Última atualização:** 2026-01-06
**Versão atual:** 1.0.0
