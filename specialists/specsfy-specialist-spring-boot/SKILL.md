---
name: specsfy-specialist-spring-boot
description: Orientar aplicações Spring Boot somente quando Boot foi detectado, respeitando versão, auto-configuração, starters, configuração externa, Actuator e testes existentes. Não ativar por mera presença de Spring Framework.
---

# Spring Boot

## Fluxo

1. Confirme major/minor do Boot, Java alvo, parent/BOM e modo de packaging.
2. Inspecione auto-configuração, properties YAML, profiles e overrides antes de adicionar beans.
3. Preserve configuração externa, observabilidade e estratégia de testes (`@WebMvcTest`, `@DataJpaTest`, integração) adotadas.
4. Use starters compatíveis com a BOM e valide condition reports quando o wiring for ambíguo.
5. Execute testes e empacotamento do serviço.

## Guardrails

- Não migrar Boot, Java ou Jakarta como efeito colateral.
- Não substituir configuração explícita por auto-configuração sem provar equivalência.
- Não colocar segredo em `application*.yml` nem ativar profile operacional nos testes.
