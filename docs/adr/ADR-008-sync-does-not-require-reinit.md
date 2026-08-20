# ADR-008 — sync does not require re-init

## Status

Aceita.

## Decisão

`sync` relê config, branch e stack, resolve profiles/specialists, reconcilia
assets e atualiza runtime. Não executa setup novamente nem instala hooks.

## Consequências

Checkout ou entrada em outro worktree exige apenas `specsfy-kit sync`.
