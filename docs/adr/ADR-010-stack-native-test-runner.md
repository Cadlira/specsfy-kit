# ADR-010 — Runner de testes nativo da stack

## Status

Aceita.

## Contexto

O comando `specsfy test` da versão oficial 0.8.1 detecta exclusivamente
Laravel com Pest e não expõe configuração ou hook para Maven, Gradle ou
scripts Node. Projetos atendidos pelos profiles do kit precisam de uma forma
uniforme de executar seus testes sem alterar, substituir ou simular o CLI
oficial.

## Decisão

O kit fornece `specsfy-kit test`, independente de `SpecsfyAdapter`. O comando
detecta manifests estaticamente, prioriza wrappers versionados, mantém comando
e argumentos separados e executa os runners nativos da stack. Agregadores
Maven, builds Gradle com `settings.gradle` e workspaces Node com script `test`
possuem o subdiretório para evitar execução duplicada em monorepos.

O modo padrão usa `mvn test`, `gradle test` e o script Node `test`. `--verify`
troca somente os lifecycles JVM para `mvn verify` e `gradle check`. Argumentos
após `--` são repassados separadamente. Todos os runners detectados são
executados e o comando falha se qualquer um retornar código diferente de zero.

## Consequências

- O kit não mascara nem modifica `specsfy test`.
- A seleção de profile não altera o lifecycle do build; o manifest continua
  sendo a fonte do runner.
- `--dry-run` permite auditar o plano sem executar código do consumidor.
- `--json` captura stdout e stderr para manter uma única saída estruturada.
- Runners customizados que não usem manifests suportados ainda devem ser
  executados diretamente pelo projeto.
