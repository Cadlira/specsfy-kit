# Integração com o Specsfy oficial

Pesquisa realizada em 20 de agosto de 2026 no branch `main` de
[`promovaweb/specsfy`](https://github.com/promovaweb/specsfy), versão do pacote
`@promovaweb/specsfy` **0.8.1**. Foram conferidos README, documentação de CLI,
`cli/src/cli.ts`, `cli/src/catalog.ts`, `cli/src/installer.ts`, testes do CLI,
`specialists/catalog.json` e specialists publicados.

## Contrato oficial observado

- Requisitos: Node.js >= 22.20.0, npm, Git e `skills` ou fallback por `npx`.
- Instalação: `npm install --global @promovaweb/specsfy`.
- `specsfy setup --project .` é alias público de `specsfy install --project .`.
- `specsfy update --project .` atualiza assets/skills do projeto;
  `specsfy upgrade` atualiza o CLI global e não é executado implicitamente.
- `specsfy skills list|detect|add|remove|update` é a interface pública para o
  catálogo oficial.
- A materialização é delegada ao CLI `skills` com cópia para `.agents/skills`.
- O ecossistema usa Agent Skills: diretório por skill, `SKILL.md` com
  frontmatter `name`/`description`; `agents/openai.yaml` é metadata opcional.
- `skills-lock.json` registra a instalação feita pelo `skills`; o Specsfy
  mantém fingerprints adicionais em `.specsfy/skills-lock.json` e protege
  customizações, exigindo `--force` para substituí-las.
- `.specsfy/templates/custom/` é user-owned, tem precedência e não é alterado
  pelo update, nem com `--force`.

Fontes primárias:

- [README oficial](https://github.com/promovaweb/specsfy/blob/main/README.md)
- [README do CLI](https://github.com/promovaweb/specsfy/blob/main/cli/README.md)
- [Referência do CLI](https://github.com/promovaweb/specsfy/blob/main/docs/user/cli.md)
- [Catálogo oficial](https://github.com/promovaweb/specsfy/blob/main/specialists/catalog.json)
- [Guia de specialists](https://promovaweb.com/docs/specsfy/especialistas/)

## Diferenças relevantes em relação à especificação inicial

`SPECSFY_SPECIALISTS_CATALOG` **não faz merge**. Em `Catalog.fetch()`, a
presença da variável faz o CLI ler somente o arquivo indicado, substituindo o
catálogo remoto oficial. Portanto, o kit não usa essa variável e não fabrica
um catálogo combinado.

O CLI oficial aceita apenas nomes existentes em seu catálogo no comando
`specsfy skills add`. Os specialists JVM/Vue/Quasar/Node/Serverless deste kit
não fazem parte do catálogo oficial atual. O kit os publica diretamente pelo
mecanismo público Agent Skills, em `.agents/skills`, mantendo fingerprints em
`.specsfy-kit/ownership.json`. Eles não entram no lock oficial. Assim:

- `specsfy update` continua gerenciando somente conteúdo Specsfy-owned;
- `specsfy-kit update` gerencia somente conteúdo Kit-owned e orquestra o
  update oficial pelo adapter;
- skills externas/user-owned permanecem fora de ambos os conjuntos;
- specialists oficiais selecionados pelo profile são intersectados com o
  catálogo retornado por `specsfy skills list --json` antes de `skills add`.

## SpecsfyAdapter

Toda execução oficial passa por `src/specsfy/adapter.ts`. O adapter encapsula
resolução cross-platform (`specsfy.cmd` no Windows ou `SPECSFY_BIN`),
`--version`, `doctor`, `setup`, `update`, `upgrade`, `skills list`,
`skills detect` e `skills add`. Usa `execFile`, argumentos separados e
`shell: false`.

O fluxo `init` persiste a intenção antes de chamar:

1. `specsfy doctor --project <raiz> --json`;
2. `specsfy setup --project <raiz>`;
3. `specsfy skills list --json`;
4. `specsfy skills add ... --project <raiz>` para specialists oficiais
   disponíveis.

## Contexto ativo e worktrees

O kit acrescenta um bloco estático e delimitado em `AGENTS.md`, preservando
conteúdo externo. O bloco instrui o agente a consultar
`specsfy-kit status --json`; o profile ativo não é gravado no bloco.

O runtime é salvo no caminho retornado por:

```bash
git rev-parse --git-path specsfy-kit/runtime.json
```

Esse caminho pertence ao Git dir do worktree. Em linked worktrees, cada um
recebe um arquivo distinto em `.git/worktrees/<nome>/...`; não há churn em
arquivos versionados ao trocar de branch.

## Ownership

| Dono | Exemplos | Atualizador |
| --- | --- | --- |
| Specsfy-owned | `.specsfy/Spec.md`, base skills, official specialists | `specsfy update` |
| Kit-owned | 11 specialists do kit, bloco marcado em `AGENTS.md`, ownership | `specsfy-kit sync/update` |
| User-owned | código, manifests, templates custom, texto fora dos marcadores | usuário |

O kit compara SHA-256 antes de substituir diretórios próprios. Drift manual é
recusado sem `--force`. O kit não altera `pom.xml`, `package.json`, frameworks,
templates customizados, hooks Git ou código-fonte do Specsfy.

## Configuração e lock

`.specsfy-kit.yml` e `.specsfy-kit.lock.json` são recomendados para commit. O
lock é um baseline reproduzível de `defaultProfiles`, detecção e specialists,
atualizado em `init/update`. `sync` grava o estado branch-aware somente no Git
dir local. Essa separação evita que `main` e `modernizacao/**` disputem um lock
versionado a cada checkout.

## Limites de compatibilidade atuais

- No Windows, o Specsfy 0.8.1 verifica Git procurando literalmente um arquivo
  chamado `git` em cada entrada do `PATH`; ele não aplica `PATHEXT` e, portanto,
  não reconhece instalações que expõem apenas `git.exe`. O `SpecsfyAdapter`
  acrescenta temporariamente ao `PATH` um sentinela sem extensão durante cada
  chamada oficial. Isso satisfaz somente o diagnóstico; quando o Specsfy executa
  `git`, o Windows continua resolvendo o `git.exe` real. O diretório temporário é
  removido ao fim da chamada. Nenhum arquivo do Specsfy é modificado.
- O mesmo resolvedor oficial pode priorizar no Windows um launcher `skills` sem
  extensão que passe em `fs.access`, mas não possa ser iniciado por `execFile`.
  Durante a chamada, o adapter remove do `PATH` entradas com esse launcher para
  permitir o fallback empacotado e oficialmente suportado
  (`node skills/bin/cli.mjs`).
- O schema JSON do catálogo oficial não é reimplementado; o adapter consome a
  saída pública do CLI, reduzindo acoplamento.
- A detecção Maven não é um effective-POM completo. Propriedades locais são
  resolvidas; herança remota ou expressions complexas resultam em `unknown`.
- Em validação real com o Specsfy 0.8.1, `specsfy test` recusou um projeto
  Java/Maven e informou que esperava Laravel com Pest. A inspeção do pacote
  instalado confirmou que `detectProjectTestCommand` exige `artisan` e
  `pestphp/pest` e não expõe configuração de runner. O kit preserva o comando
  oficial e oferece `specsfy-kit test`, que detecta wrappers Maven/Gradle e
  scripts Node, incluindo agregação segura em monorepos. Essa execução não
  passa pelo `SpecsfyAdapter`, pois não existe contrato oficial aplicável.
- Instalar/atualizar specialists oficiais requer os mesmos acessos de rede e
  autenticação exigidos pelo Specsfy.
- Novas mudanças incompatíveis no CLI oficial devem ser absorvidas somente no
  adapter e cobertas pelos testes de construção de comandos.
