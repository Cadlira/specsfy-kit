---
name: specsfy-specialist-java-testing
description: Planejar e implementar testes Java pragmáticos com JUnit, Mockito, AssertJ, characterization tests e TDD conforme as versões detectadas. Use para RED/GREEN, regressões e isolamento; não use coverage bruto como objetivo.
---

# Testes Java

## Fluxo

1. Confirme JUnit 4/5, runner, Mockito, AssertJ, Surefire/Failsafe e convenções do módulo.
2. Para comportamento legado sem contrato claro, crie primeiro um characterization test focal.
3. No TDD, prove que o RED falha pela ausência do comportamento solicitado, não por falha histórica alheia.
4. Implemente o mínimo para GREEN e refatore mantendo evidência.
5. Separe unit, integration e end-to-end conforme custo e risco reais.

## Guardrails

- Não gerar milhares de testes para aumentar coverage.
- Não considerar falhas históricas não relacionadas como RED válido.
- Não mockar o objeto sob teste nem detalhes internos desnecessários.
- Evitar relógio, rede, locale, ordem e concorrência não controlados.

## Validação

- Execute teste focal, módulo e suíte relevante; reporte falhas preexistentes separadamente.
- Teste caminho feliz, limites e falhas observáveis, sem duplicar a implementação no teste.
