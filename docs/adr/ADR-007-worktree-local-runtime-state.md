# ADR-007 — Worktree-local runtime state

## Status

Aceita.

## Decisão

Salvar runtime no resultado de `git rev-parse --git-path
specsfy-kit/runtime.json`, nunca inferir diretamente de `.git/HEAD`.

## Consequências

Worktrees do mesmo repositório mantêm profiles simultâneos e isolados sem
arquivo versionado diferente.
