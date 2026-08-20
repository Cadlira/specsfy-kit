---
name: specsfy-specialist-legacy-modernization
description: Governar manutenção e modernização incremental de legado, preservando comportamento, criando characterization tests e separando mudança estrutural de funcional. Use em profiles java-legacy e java-modernization conforme a intenção ativa.
---

# Modernização de legado

## Fluxo

1. Leia o profile ativo com `specsfy-kit status --json`; stack não define intenção.
2. Delimite comportamento observável, riscos, dependências e rollback da fatia.
3. Crie characterization tests onde o comportamento relevante ainda não está protegido.
4. Separe commit/fatia estrutural de mudança funcional e mantenha passos reversíveis.
5. Só faça upgrade quando a spec o autorizar, com matriz de compatibilidade e validação própria.

## Guardrails

- Preservar comportamento existente salvo requisito explícito em contrário.
- Não modernizar porque “é melhor”, trocar framework ou expandir escopo silenciosamente.
- Em `java-legacy`, evitar modernização incidental; em `java-modernization`, modernizar apenas a fatia prevista.
- Registrar dívida descoberta para triagem futura.
