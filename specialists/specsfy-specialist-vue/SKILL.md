---
name: specsfy-specialist-vue
description: Orientar Vue conforme a versão, API e arquitetura detectadas, preservando components, router, stores, reatividade e testes. Não converter Options API para Composition API automaticamente.
---

# Vue

## Fluxo

1. Confirme Vue 2/3, build tool, SFC syntax, router, store e biblioteca de testes.
2. Siga o padrão local de props, emits, slots, composables/mixins e estado.
3. Mantenha contratos reativos explícitos e evite mutação escondida de props.
4. Teste comportamento do usuário, estados assíncronos e acessibilidade relevante.
5. Rode typecheck, unit/component tests e build.

## Guardrails

- Não converter Options API para Composition API sem motivo funcional/arquitetural.
- Não introduzir API de Vue 3 em Vue 2 nem trocar store/router incidentalmente.
- Não testar detalhes internos frágeis quando o comportamento é observável.
