---
name: specsfy-specialist-quasar
description: Orientar projetos Quasar respeitando versão, boot files, plugins, router, stores, componentes, SSR/Cordova/Electron quando aplicável e convenções existentes. Não substituir Quasar por outra UI library.
---

# Quasar

## Fluxo

1. Confirme versão, modo de aplicação, `quasar.config.*`, boot files e plugins.
2. Preserve configuração central de componentes, ícones, idiomas, CSS e aliases.
3. Use componentes e breakpoints compatíveis com a versão instalada.
4. Verifique estados loading/empty/error, teclado, foco e responsividade.
5. Execute lint, typecheck, testes e build do modo afetado.

## Guardrails

- Não substituir Quasar nem duplicar seu design system com outra biblioteca.
- Não mover lógica entre boot files, stores e componentes sem necessidade.
- Não alterar targets, SSR/PWA/mobile packaging incidentalmente.
