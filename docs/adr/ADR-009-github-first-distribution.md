# ADR-009 — GitHub-first distribution via Cadlira/specsfy-kit

## Status

Aceita.

## Decisão

Distribuir inicialmente pelo repositório GitHub com `dist/` versionado. Não usar
`prepare` ou outro lifecycle durante a instalação. Manter o comando
`npm install --global github:Cadlira/specsfy-kit` como fluxo principal e oferecer
o tarball HTTPS da branch como alternativa no Windows/NVM. O npm 10.9.7 pode
retornar sucesso após `TAR_ENTRY_ERROR` no caminho Git e deixar a árvore
incompleta; o tarball foi validado no mesmo npm sem exigir atualização separada.
`bin` aponta para JS ESM com shebang e `files` inclui os assets necessários.

## Consequências

O comando GitHub-first continua sem depender de publicação no registry. Em
ambientes afetados pelo erro de extração do npm, usar
`npm install --global https://github.com/Cadlira/specsfy-kit/archive/refs/heads/main.tar.gz`.
Isso preserva o Node.js e o npm fornecido pelo gerenciador de versões. `npm run
check` e `npm run build` devem ser executados antes do commit para manter o build
versionado sincronizado. Instalações pinadas dependerão de tags futuras.
