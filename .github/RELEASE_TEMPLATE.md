# Release v[VERSION] - [RELEASE_NAME]

> **Release Date:** YYYY-MM-DD
> **Type:** Major | Minor | Patch
> **Status:** Stable | Beta | Alpha

---

## 🎯 Release Highlights

<!-- Descreva os principais destaques desta release em 2-3 bullet points -->

- 🚀 **[Feature Principal 1]** - Breve descrição do impacto
- ✨ **[Feature Principal 2]** - Breve descrição do impacto
- 🔧 **[Melhoria Principal]** - Breve descrição do impacto

---

## ✨ What's New

### New Features

<!-- Liste as novas funcionalidades adicionadas -->

- **[Feature Name]** (#PR_NUMBER)
  - Descrição detalhada da feature
  - Como usar: `exemplo de código ou comando`
  - Impacto: quem se beneficia e por quê
  - Disponível para: FREE | PRO | ADMIN

### Enhancements

<!-- Melhorias em funcionalidades existentes -->

- **[Enhancement Name]** (#PR_NUMBER)
  - O que foi melhorado
  - Benefícios para o usuário
  - Métricas: X% mais rápido, Y% menor, etc.

---

## 🔧 Changes & Improvements

### Breaking Changes

⚠️ **Atenção:** Esta release contém mudanças que podem quebrar compatibilidade.

<!-- Se houver breaking changes, liste aqui -->

- **[Breaking Change 1]**
  - O que mudou
  - Como migrar do comportamento antigo para o novo
  - Exemplo de migração

### Deprecations

<!-- Funcionalidades que serão removidas em versões futuras -->

- **[Deprecated Feature]** - Será removido em v[FUTURE_VERSION]
  - Use `[nova_alternativa]` ao invés de `[funcionalidade_antiga]`
  - Migration guide: [link]

### Performance

<!-- Melhorias de performance -->

- ⚡ **[Performance Improvement 1]**
  - Antes: X ms/s/MB
  - Depois: Y ms/s/MB
  - Impacto: Z% de melhoria

---

## 🐛 Bug Fixes

<!-- Bugs corrigidos nesta release -->

- **[Bug Title]** (#ISSUE_NUMBER, #PR_NUMBER)
  - Descrição do bug
  - Como foi corrigido
  - Impacto: quem foi afetado

---

## 🔒 Security

<!-- Correções de segurança (se houver) -->

- **[Security Fix Title]** (#PR_NUMBER)
  - Severidade: Critical | High | Medium | Low
  - CVE: CVE-YYYY-XXXXX (se aplicável)
  - Descrição da vulnerabilidade
  - Como foi corrigida
  - Ação necessária do usuário (se houver)

---

## 📊 Metrics & Stats

<!-- Estatísticas desta release -->

- **Total de PRs:** X merged
- **Total de Issues:** Y closed
- **Contributors:** Z people
- **Commits:** N commits
- **Files changed:** M files
- **Lines added/removed:** +X / -Y

---

## 🚀 Upgrade Instructions

### Para Usuários

1. **Backup seus dados** (se aplicável)
2. **Acesse o dashboard** e verifique se há notificações
3. **[Passo adicional se necessário]**

### Para Desenvolvedores

```bash
# 1. Pull das mudanças
git pull origin main

# 2. Instalar dependências atualizadas
npm install

# 3. Rodar migrations
npx prisma migrate deploy

# 4. Rebuild da aplicação
npm run build

# 5. Reiniciar servidor
npm run start
```

### Environment Variables

⚠️ **Novas variáveis de ambiente necessárias:**

```bash
# Adicione ao seu .env
NEW_VARIABLE_1="value"
NEW_VARIABLE_2="value"
```

Consulte [`.env.example`](.env.example) para detalhes.

---

## 📚 Documentation

### Updated Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Atualizado com [mudança]
- [DATABASE.md](docs/DATABASE.md) - Adicionado schema de [feature]
- [FEATURES.md](docs/FEATURES.md) - Documentadas [novas features]
- [API.md](docs/API.md) - Novos endpoints: [lista]

### New Documentation

- [NOME_DO_DOC.md](docs/NOME_DO_DOC.md) - Descrição

---

## 🧪 Testing

<!-- Informações sobre testes desta release -->

- **Test Coverage:** X% (target: 70%+)
- **E2E Tests:** Y passing / Z total
- **Unit Tests:** Y passing / Z total
- **Integration Tests:** Y passing / Z total

### How to Test

```bash
# Rodar todos os testes
npm test

# E2E tests
npm run test:e2e

# Unit tests
npm run test:unit
```

---

## 🔗 Links & Resources

- **Full Changelog:** [v[PREVIOUS_VERSION]...v[CURRENT_VERSION]](https://github.com/JeanZorzetti/sirius/compare/v[PREVIOUS]...v[CURRENT])
- **Documentation:** [docs/](docs/)
- **Roadmap:** [roadmaps/ROADMAP-CENARIO-C.md](roadmaps/ROADMAP-CENARIO-C.md)
- **Migration Guide:** [MIGRATION_v[VERSION].md](docs/migrations/MIGRATION_v[VERSION].md) (se aplicável)

---

## 🙏 Acknowledgments

### Contributors

Obrigado a todos que contribuíram para esta release! 🎉

- [@username1](https://github.com/username1) - [contribuição]
- [@username2](https://github.com/username2) - [contribuição]
- [@username3](https://github.com/username3) - [contribuição]

### Special Thanks

- Agradecimento especial para [pessoa/organização] por [razão]

---

## 🐛 Known Issues

<!-- Problemas conhecidos que não foram corrigidos nesta release -->

- **[Issue Title]** (#ISSUE_NUMBER)
  - Descrição do problema
  - Workaround temporário (se houver)
  - Previsão de correção: v[FUTURE_VERSION]

---

## 🔮 What's Next?

<!-- Preview do que está por vir nas próximas releases -->

### Coming in v[NEXT_VERSION]

- [ ] Feature X
- [ ] Feature Y
- [ ] Enhancement Z

Veja o [roadmap completo](roadmaps/ROADMAP-CENARIO-C.md) para mais detalhes.

---

## 💬 Feedback

Sua opinião é importante! Se você encontrou bugs ou tem sugestões:

- **Report a Bug:** [GitHub Issues](https://github.com/JeanZorzetti/sirius/issues/new?template=bug_report.md)
- **Feature Request:** [GitHub Issues](https://github.com/JeanZorzetti/sirius/issues/new?template=feature_request.md)
- **Email:** feedback@roilabs.com.br
- **Discord:** [Em breve]

---

## 📝 Notes

<!-- Notas adicionais importantes -->

- Esta release foi testada em: [ambientes/browsers/devices]
- Suporte para versões anteriores: [política de suporte]
- Recomendamos atualizar até: [data]

---

**Developed with ❤️ by [ROI Labs](https://roilabs.com.br)**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
