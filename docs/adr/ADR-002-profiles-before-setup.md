# ADR-002 — Profiles before Specsfy setup

## Status

Aceita.

## Decisão

`init` detecta, recebe a escolha explícita, valida e persiste profiles antes
de executar `specsfy doctor` e `specsfy setup`.

## Consequências

Setup nunca precede a intenção do projeto. Falha oficial deixa a configuração
declarativa disponível para diagnóstico e nova tentativa.
