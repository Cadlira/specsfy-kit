# ADR-009 — GitHub-first distribution via Cadlira/specsfy-kit

## Status

Aceita.

## Decisão

Distribuir inicialmente pelo repositório GitHub. `prepare` compila TypeScript
quando o compilador está disponível e, no `npm install --global` que não instala
`devDependencies` no clone Git, valida e utiliza o `dist/` versionado. `bin`
aponta para JS ESM com shebang e `files` inclui assets necessários.

## Consequências

`npm install --global github:Cadlira/specsfy-kit` funciona sem publicação no
registry. O build versionado deve ser atualizado e verificado antes de cada
commit de release. Instalações pinadas dependerão de tags futuras.
