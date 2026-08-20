# ADR-006 — Branch-aware profile resolution

## Status

Aceita.

## Decisão

Aplicar precedência CLI override > regras de branch, na ordem declarada >
`defaultProfiles`. `replace` substitui o conjunto corrente; `add` o compõe.

## Consequências

A configuração não muda em checkout. Toda regra matched aparece em status.
