# ADR-004 — External specialists ownership

## Status

Aceita.

## Decisão

Skills oficiais usam `specsfy skills add`; specialists do kit são Agent Skills
copiadas para `.agents/skills` com manifest e SHA-256 próprios. Não substituir
o catálogo via `SPECSFY_SPECIALISTS_CATALOG`.

## Consequências

Catálogos coexistem sem merge privado e updates não apagam conteúdo do outro
dono. Alterações locais exigem `--force`.
