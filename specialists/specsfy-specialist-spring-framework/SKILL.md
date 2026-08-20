---
name: specsfy-specialist-spring-framework
description: Orientar Spring Framework clássico com DI, XML, annotations, transactions, MVC, ApplicationContext e lifecycle sem presumir Spring Boot. Use quando Spring Framework existe e Boot não foi comprovado.
---

# Spring Framework

## Fluxo

1. Confirme a versão e como o `ApplicationContext` é criado.
2. Mapeie XML, component scanning, Java config, proxies e boundaries transacionais da área.
3. Preserve bean names, scopes, qualifiers, ordem e lifecycle observáveis.
4. Em MVC, siga configuração de dispatcher, resolvers, converters e tratamento de erros existentes.
5. Teste wiring real quando a mudança depende do container.

## Guardrails

- Não presumir Spring Boot nem suas auto-configurações.
- Não converter XML para annotations automaticamente.
- Não mudar proxy mode, propagation ou rollback rules sem requisito e teste.
- Não aplicar API de Spring atual a uma versão antiga sem confirmar disponibilidade.
