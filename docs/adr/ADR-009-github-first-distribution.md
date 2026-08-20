# ADR-009 — Distribuição por tarball HTTPS via Cadlira/specsfy-kit

## Status

Aceita.

## Decisão

Distribuir pelo tarball HTTPS da branch `main` com `dist/` versionado. Não usar
`prepare` ou outro lifecycle durante a instalação. O comando oficial do projeto
é `npm install --global https://github.com/Cadlira/specsfy-kit/archive/refs/heads/main.tar.gz`.
O npm 10.9.7 pode retornar sucesso no caminho `github:` e criar uma junction
para um clone temporário removido logo depois; esse formato não é suportado.
`bin` aponta para JS ESM com shebang e `files` inclui os assets necessários.

## Consequências

O tarball continua sem depender de publicação no registry e materializa uma
árvore independente do cache temporário do npm. Isso preserva o Node.js e o npm
fornecido pelo gerenciador de versões. `npm run check` e `npm run build` devem
ser executados antes do commit para manter o build versionado sincronizado.
Instalações pinadas usarão tarballs de tags futuras.
