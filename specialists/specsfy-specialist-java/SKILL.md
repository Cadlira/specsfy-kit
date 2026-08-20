---
name: specsfy-specialist-java
description: Orientar mudanças Java compatíveis com o JDK e o estilo detectados, sem presumir Spring Boot, Jakarta, Hibernate atual ou upgrade de linguagem. Use em código, build e APIs Java; combine com o specialist de framework quando houver evidência.
---

# Java

## Fluxo

1. Leia a versão alvo no build, wrapper e CI; `java --version` sozinho não define compatibilidade.
2. Preserve package structure, convenções, nulabilidade e estilo de exceções existentes.
3. Confirme que cada API usada existe no JDK alvo e no runtime de produção.
4. Separe refatoração mecânica de mudança de comportamento.
5. Execute compile, testes focais e suíte do módulo afetado.

## Guardrails

- Não presumir Spring Boot, Jakarta, records, modules ou o JDK mais recente.
- Não trocar `javax.*` por `jakarta.*` nem elevar source/target incidentalmente.
- Não introduzir streams, reflection ou concorrência apenas por preferência estética.
- Em legado, prefira uma alteração pequena, reversível e coerente com o código vizinho.

## Validação

- Use Maven/Gradle wrapper quando existir e registre comando, exit code e escopo.
- Verifique warnings novos, compatibilidade binária quando pública e comportamento de erro.
