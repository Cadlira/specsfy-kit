---
name: specsfy-specialist-hibernate
description: Orientar Hibernate conforme a versão detectada, cobrindo Session, EntityManager quando aplicável, transações, lazy loading, proxies, fetching, N+1, dirty checking, cascades e entidades detached.
---

# Hibernate

## Fluxo

1. Confirme versão, API usada (native/JPA), mappings XML/annotations e boundary de sessão.
2. Trace transação, estado da entidade e momento real de acesso às relações.
3. Para N+1, meça e escolha fetch join, batch ou query focal compatível com a versão.
4. Preserve ownership de associações, cascade, orphan removal e contrato de equals/hashCode.
5. Teste contra o banco/dialeto relevante quando SQL ou mapping mudar.

## Guardrails

- Não mudar LAZY para EAGER como solução genérica.
- Não migrar major do Hibernate incidentalmente.
- Não converter API Hibernate para JPA sem requisito.
- Não esconder `LazyInitializationException` ampliando sessão sem entender boundary.
