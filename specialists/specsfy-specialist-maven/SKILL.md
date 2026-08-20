---
name: specsfy-specialist-maven
description: Orientar builds Maven, lifecycle, scopes, dependencyManagement, profiles, Surefire, Failsafe, wrappers e multi-module sem alterar versões indiscriminadamente. Use em pom.xml e diagnóstico de build Maven.
---

# Maven

## Fluxo

1. Use `mvnw`/`mvnw.cmd` quando presente e identifique reactor e parent efetivos.
2. Leia properties, dependencyManagement, pluginManagement, profiles e módulo dono da mudança.
3. Diferencie dependência direta, gerenciada e transitiva; confirme com `dependency:tree` quando necessário.
4. Respeite lifecycle: Surefire para unit e Failsafe para integration quando o projeto assim os configura.
5. Rode a menor seleção correta e depois o reactor necessário.

## Guardrails

- Não elevar versões, reordenar o POM inteiro ou remover exclusions incidentalmente.
- Não substituir wrapper/global nem ativar profiles operacionais sem autorização.
- Não confundir `test` com `verify` quando Failsafe ou checks posteriores existem.
- Em multi-module, preserve dependencyManagement central e direção das dependências.
