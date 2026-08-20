# ADR-009 — GitHub-first distribution via Cadlira/specsfy-kit

## Status

Aceita.

## Decisão

Distribuir inicialmente pelo repositório GitHub com `dist/` versionado. Não usar
`prepare` ou outro lifecycle durante a instalação: npm 10 no Windows pode
corromper a extração de uma dependência Git global ao executar a instalação
aninhada necessária ao lifecycle. `bin` aponta para JS ESM com shebang e `files`
inclui os assets necessários.

## Consequências

`npm install --global github:Cadlira/specsfy-kit` funciona sem publicação no
registry. `npm run check` e `npm run build` devem ser executados antes do commit
para manter o build versionado sincronizado. Instalações pinadas dependerão de
tags futuras.
