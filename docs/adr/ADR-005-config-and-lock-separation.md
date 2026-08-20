# ADR-005 — Config and lock separation

## Status

Aceita.

## Decisão

`.specsfy-kit.yml` guarda intenção estável; `.specsfy-kit.lock.json` guarda o
baseline reproduzível criado em init/update. Versões detectadas não entram na
configuração declarativa.

## Consequências

Config e lock podem ser versionados e drift pode ser explicado sem congelar a
detecção na configuração.
