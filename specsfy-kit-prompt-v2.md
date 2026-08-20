# Prompt — Criar o specsfy-kit

Quero que você projete e implemente um novo projeto chamado **specsfy-kit**.

Não pare apenas na análise ou no plano. Faça a pesquisa necessária, defina a arquitetura e implemente um MVP funcional, testado e documentado.

## 1. Objetivo

O `specsfy-kit` será uma camada de distribuição e configuração sobre o **Specsfy oficial (`promovaweb/specsfy`)**.

O objetivo NÃO é criar um fork do Specsfy.

O objetivo é permitir utilizar o Specsfy de maneira padronizada em vários projetos com stacks diferentes, mantendo:

- Specsfy oficial atualizável independentemente;
- profiles reutilizáveis;
- specialists próprios;
- specialists oficiais;
- detecção automática de stack;
- configuração específica mínima em cada projeto;
- atualização centralizada;
- compatibilidade com múltiplos projetos;
- suporte inicial a Java/JVM, Spring, Hibernate, Vue, Quasar, Node e Serverless Framework.

O projeto deve funcionar principalmente como um CLI:

```bash
specsfy-kit
```

ou durante desenvolvimento:

```bash
npx specsfy-kit
```

## 2. Antes de implementar: pesquise o Specsfy atual

Antes de definir qualquer integração com o Specsfy:

1. Inspecione a versão atual do repositório oficial `promovaweb/specsfy`.
2. Leia:
   - README;
   - documentação do CLI;
   - referência do CLI;
   - implementação do CLI quando necessário;
   - estrutura de `skills/`;
   - estrutura de `specialists/`;
   - catálogo de specialists;
   - mecanismo de instalação;
   - lock/manifests utilizados no projeto consumidor;
   - comportamento de `setup`;
   - comportamento de `install`;
   - comportamento de `update`;
   - `skills list`;
   - `skills detect`;
   - `skills add`;
   - templates customizados;
   - variável `SPECSFY_SPECIALISTS_CATALOG`;
   - integração com o `skills` CLI.

3. Não assuma que informações deste prompt representam a API atual.

4. Quando a documentação e a implementação divergirem, priorize:
   1. testes do Specsfy;
   2. código atual;
   3. documentação atual.

5. Não copie o código do Specsfy para este projeto.

6. Não modifique nem faça fork do Specsfy.

7. Use somente interfaces públicas sempre que for razoavelmente possível.

Documente em:

```text
docs/specsfy-integration.md
```

as decisões tomadas e os pontos de integração utilizados.

## 3. Princípio arquitetural fundamental

Quero esta separação:

```text
                 Specsfy oficial
                       │
             metodologia / CLI
                       │
        ┌──────────────┴──────────────┐
        │                             │
specialists oficiais          specsfy-kit
                                    │
                           profiles + specialists
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                 JVM            Frontend          Node/AWS
```

O Specsfy deve continuar sendo responsável por:

- metodologia SDD;
- lifecycle das specs;
- gates;
- skills base;
- comportamento oficial do CLI;
- atualizações oficiais.

O `specsfy-kit` deve ser responsável por:

- intenção/profile do projeto;
- detecção complementar da stack;
- specialists adicionais;
- composição de profiles;
- guardrails tecnológicos;
- padronização entre projetos;
- instalação das extensões do kit;
- atualização das extensões do kit.

Não duplique funcionalidades existentes do Specsfy sem necessidade.

## 4. Profile precisa ser escolhido ANTES do setup

Esse requisito é fundamental.

O fluxo deve ser:

```text
specsfy-kit init
       │
       ▼
detectar stack
       │
       ▼
sugerir profiles
       │
       ▼
usuário seleciona profiles
       │
       ▼
salvar configuração
       │
       ▼
specsfy doctor
       │
       ▼
specsfy setup
       │
       ▼
instalar/resolver specialists
       │
       ▼
validar instalação
```

NÃO execute primeiro `specsfy setup` para somente depois descobrir qual profile utilizar.

A detecção inicial do `specsfy-kit` deve funcionar independentemente do setup do Specsfy.

## 5. Profiles são intenção, não apenas stack

É importante distinguir:

```text
STACK
= o que existe tecnicamente no projeto

PROFILE
= como esse projeto deve ser tratado

SPECIALISTS
= conhecimento/guardrails necessários
```

Exemplo:

Dois projetos podem possuir:

```text
Java 21
Spring Framework 4
Hibernate 4
Maven
```

mas um utilizar:

```text
java-maintenance
```

e outro:

```text
java-modernization
```

A stack é igual.

A intenção é diferente.

Portanto, NÃO tente determinar automaticamente todas as decisões apenas pelo `pom.xml`.

A detecção deve sugerir profiles, mas a escolha final deve poder ser explícita.

## 6. Profiles precisam ser composáveis

Um projeto pode utilizar mais de um profile.

Exemplo:

```bash
specsfy-kit init \
  --profile java-modernization \
  --profile vue-quasar
```

Outro:

```bash
specsfy-kit init \
  --profile spring-boot-service
```

Outro:

```bash
specsfy-kit init \
  --profile serverless-node
```

Um monorepo poderá eventualmente combinar vários deles.

Implemente resolução de:

- dependências;
- duplicidades;
- precedência;
- incompatibilidades;
- specialists adicionados por vários profiles.

Não instale duas vezes o mesmo specialist.

## 7. Profiles iniciais

Implemente inicialmente:

### java-legacy

Voltado para manutenção conservadora de aplicações Java legadas.

Especialistas esperados, conforme arquitetura final:

- java
- java-testing
- maven
- spring-framework
- hibernate
- legacy-modernization

Guardrail principal:

> preservar o comportamento e evitar modernizações incidentais.

### java-modernization

Voltado para modernização incremental de legado.

Especialistas:

- java
- java-testing
- maven
- spring-framework
- hibernate
- legacy-modernization

Diferença em relação ao `java-legacy`:

- permite modernizações quando explicitamente previstas pela spec;
- exige mudanças incrementais;
- favorece characterization tests antes de alterar comportamento legado;
- não permite upgrade incidental de frameworks.

### spring-boot-service

Especialistas:

- java
- java-testing
- maven, quando aplicável
- spring-boot
- hibernate, quando detectado
- specialists oficiais úteis de API/architecture quando disponíveis

### vue-quasar

Especialistas:

- typescript quando aplicável;
- vue;
- quasar;
- specialists oficiais de UI/UX pertinentes quando disponíveis.

### serverless-node

Especialistas:

- node;
- typescript quando aplicável;
- serverless-framework;
- API/architecture/security oficiais pertinentes quando disponíveis.

## 8. Profiles conflitantes

Implemente conceito explícito de conflitos.

Por exemplo:

```text
java-legacy
```

e:

```text
java-modernization
```

representam intenções diferentes e não devem ser combinados sem override explícito.

A arquitetura deve permitir declarar:

```text
conflicts:
dependencies:
specialists:
suggestWhen:
```

ou estrutura equivalente.

Não hardcode toda lógica dentro de grandes `if/else`.

Profiles devem ser orientados a dados sempre que possível.


## 8.1. Profiles por branch e Git worktree

O mesmo repositório pode representar intenções diferentes dependendo da branch.

Esse é um requisito de primeira classe.

Exemplo real esperado:

```text
main
└── java-legacy

develop
└── java-legacy

modernizacao/java21
└── java-modernization

modernizacao/hibernate4
└── java-modernization
```

O projeto deve conseguir manter uma configuração base única e resolver o profile efetivo a partir da branch atual.

A configuração deve suportar conceitualmente:

```yaml
schemaVersion: 1

defaultProfiles:
  - java-legacy

branchProfiles:
  - pattern: "modernizacao/**"
    replace:
      - java-modernization

  - pattern: "migration/**"
    replace:
      - java-modernization

overrides:
  addSpecialists: []
  removeSpecialists: []
```

Também deve ser possível utilizar composição:

```yaml
branchProfiles:
  - pattern: "modernizacao/**"
    replace:
      - java-modernization

  - pattern: "frontend/**"
    add:
      - vue-quasar
```

Defina semanticamente e documente a diferença entre:

- `replace`: substitui os profiles default pelo conjunto informado;
- `add`: adiciona profiles ao conjunto já resolvido;
- outros mecanismos apenas se houver necessidade concreta.

### Precedência

A resolução do profile efetivo deve seguir uma precedência explícita:

```text
CLI/local override
        ↓
branch rule
        ↓
defaultProfiles
```

Um override explícito deve poder ser usado, por exemplo:

```bash
specsfy-kit sync --profile java-legacy
```

O `status` deve informar claramente a origem do profile:

```text
Active profile: java-modernization
Source: branch rule modernizacao/**
```

ou:

```text
Active profile: java-legacy
Source: CLI override
```

### Branch não é stack

Não inferir intenção somente pelo conteúdo do `pom.xml`.

A branch indica contexto/intenção quando houver regra declarada.

A detecção da stack continua indicando o estado técnico atual.

Exemplo:

```text
Branch:
modernizacao/java21

Intenção:
java-modernization

Stack atualmente detectada:
Java 8
Spring 3
Hibernate 3
```

Esse estado é válido no início de uma modernização.

Não mudar automaticamente o profile porque a stack ainda parece antiga.

### Git worktree

O mesmo repositório pode estar aberto simultaneamente em vários worktrees.

Exemplo:

```text
C:\projetos\qsi
  branch main
  profile java-legacy

C:\projetos\qsi-java21
  branch modernizacao/java21
  profile java-modernization
```

O `specsfy-kit` deve funcionar corretamente nesse cenário.

Estado runtime relacionado ao profile ativo deve ser **worktree-local**, não compartilhado de forma incorreta entre worktrees.

Não dependa apenas de `.git/HEAD`, pois em worktrees a estrutura Git é diferente.

Use comandos Git apropriados, como `git branch --show-current`, `git rev-parse`, ou biblioteca equivalente, e teste o comportamento.

### Evitar churn no Git

Trocar de branch e executar `specsfy-kit sync` não deve produzir alterações desnecessárias em arquivos versionados.

Pesquise como as skills e o contexto do Specsfy são descobertos/carregados pelo agente e implemente uma estratégia segura para disponibilizar o profile ativo.

Requisitos:

- configuração declarativa compartilhada pode ser versionada;
- estado runtime do profile ativo não deve gerar commits diferentes por branch sem necessidade;
- worktrees diferentes devem poder ter profiles ativos diferentes;
- não modificar skills oficiais do Specsfy;
- não modificar silenciosamente arquivos user-owned;
- documentar a estratégia adotada.

Se for necessário manter um artefato runtime local, ele deve ficar em local apropriado e ser ignorado pelo Git quando aplicável.

Não invente um mecanismo de carregamento de contexto que Codex/Claude Code/agents não consigam consumir. Pesquise primeiro o comportamento real de Agent Skills/AGENTS.md e do Specsfy atual.

## 8.2. Comando `sync`

Implemente:

```bash
specsfy-kit sync
```

Responsabilidades:

1. identificar repositório/worktree atual;
2. identificar branch atual;
3. detectar novamente a stack relevante;
4. carregar `.specsfy-kit.yml`;
5. resolver `defaultProfiles`;
6. aplicar regras `branchProfiles`;
7. aplicar override local/CLI, quando houver;
8. validar conflitos;
9. resolver specialists;
10. atualizar somente o contexto/assets kit-owned necessários;
11. detectar drift;
12. atualizar estado runtime/lock quando apropriado;
13. exibir profile efetivo e sua origem.

Suportar:

```bash
specsfy-kit sync --dry-run
specsfy-kit sync --json
specsfy-kit sync --profile java-legacy
```

Não instale Git hooks automaticamente.

Uma futura automação pós-checkout pode ser considerada depois, mas está fora do MVP.


## 9. Arquivo de configuração do projeto

Depois da escolha, crie na raiz:

```text
.specsfy-kit.yml
```

Formato conceitual:

```yaml
schemaVersion: 1

defaultProfiles:
  - java-legacy

branchProfiles:
  - pattern: "modernizacao/**"
    replace:
      - java-modernization

  - pattern: "frontend/**"
    add:
      - vue-quasar

overrides:
  addSpecialists: []
  removeSpecialists: []
```

Também deve ser possível um projeto simples sem regras por branch:

```yaml
schemaVersion: 1

defaultProfiles:
  - spring-boot-service

branchProfiles: []

overrides:
  addSpecialists: []
  removeSpecialists: []
```

A configuração não deve precisar mudar toda vez que o desenvolvedor fizer checkout de outra branch.

Não grave versões detectadas manualmente nesse arquivo se elas puderem ficar obsoletas.

Crie também, se fizer sentido arquiteturalmente:

```text
.specsfy-kit.lock.json
```

contendo o estado resolvido:

- versão do specsfy-kit;
- versão detectada do Specsfy;
- profiles resolvidos;
- stack detectada;
- versions detectadas quando disponíveis;
- specialists resolvidos;
- origem de cada specialist;
- versão/hash quando aplicável.

O lock deve permitir reproduzir e diagnosticar a instalação.

Decida e documente se ele deve ser commitado no Git. Minha preferência é **sim**, se isso melhorar a reprodutibilidade.

## 10. Detecção de stack

Implemente uma camada própria de detecção.

Ela deve procurar, pelo menos:

### Java/JVM

Detectar:

```text
pom.xml
mvnw
mvnw.cmd
build.gradle
build.gradle.kts
gradlew
gradlew.bat
```

Determinar quando possível:

- Java/JDK target;
- Maven ou Gradle;
- multi-module;
- Spring Framework;
- Spring Boot;
- Hibernate;
- JUnit;
- Mockito;
- AssertJ;
- versões relevantes.

Para Maven, considerar:

- properties;
- parent;
- dependencyManagement;
- dependencies;
- plugins;
- maven-compiler-plugin;
- `release`;
- `source`;
- `target`.

Não implemente um Maven completo.

Quando uma versão não puder ser resolvida com segurança, retorne:

```text
unknown
```

em vez de inventar.

### Vue/Quasar

Inspecionar:

```text
package.json
quasar.config.*
vue.config.*
vite.config.*
```

Detectar:

- Vue;
- Quasar;
- TypeScript;
- Vite;
- ferramentas de testes quando presentes.

### Node/Serverless

Inspecionar:

```text
package.json
serverless.yml
serverless.yaml
serverless.ts
serverless.js
.serverless/
.nvmrc
.node-version
```

Detectar:

- Node;
- TypeScript;
- Serverless Framework;
- provider AWS quando identificável;
- Lambda;
- ferramentas de testes.

### Monorepos

A detecção deve conseguir localizar stacks relevantes em subdiretórios.

Ignorar:

```text
node_modules
target
build
dist
.git
coverage
out
```

e outros diretórios gerados.

Não faça scans ilimitados de filesystem.

## 11. Evidência da detecção

Cada descoberta deve idealmente guardar:

```text
technology
version
confidence
source
```

Exemplo conceitual:

```json
{
  "technology": "hibernate",
  "version": "4.3.11.Final",
  "confidence": "high",
  "source": "pom.xml"
}
```

Isso permitirá explicar:

```text
Hibernate 4.3.11.Final
detectado em pom.xml
```

em vez de produzir resultados opacos.

## 12. CLI

Implemente inicialmente:

```bash
specsfy-kit init
specsfy-kit detect
specsfy-kit sync
specsfy-kit status
specsfy-kit doctor
specsfy-kit profiles list
specsfy-kit profiles show <profile>
specsfy-kit update
```

### init

Aceitar:

```bash
--project <path>
--profile <name>
-p <name>
--dry-run
--json
--yes
--force
```

`--profile` deve ser repetível.

Sem `--profile`, utilizar modo interativo quando houver terminal interativo.

Mostrar:

1. stack detectada;
2. profiles sugeridos;
3. razão da sugestão;
4. escolha dos profiles;
5. specialists que serão resolvidos;
6. operações que serão realizadas.

Só então executar setup.

Em ambiente não interativo sem profile suficiente, falhar com mensagem clara em vez de escolher silenciosamente uma intenção perigosa.

### detect

Somente leitura.

```bash
specsfy-kit detect
specsfy-kit detect --json
```

Não instalar nada.

### status

Exibir:

- versão do kit;
- versão do Specsfy;
- configuração;
- defaultProfiles configurados;
- branch atual;
- regra de branch que fez match, quando houver;
- profile(s) efetivo(s);
- origem da resolução do profile;
- stack atual;
- diferença entre stack atual e lock;
- specialists esperados;
- specialists instalados;
- drift;
- warnings.


### sync

Deve ser seguro executar após qualquer troca de branch:

```bash
git checkout modernizacao/java21
specsfy-kit sync
```

ou dentro de outro worktree:

```bash
cd ../projeto-java21
specsfy-kit sync
```

O comando deve resolver novamente o profile efetivo sem exigir novo `init`.

Não alterar `.specsfy-kit.yml` apenas porque a branch mudou.

Mostrar pelo menos:

- branch/worktree;
- profile efetivo;
- fonte do profile;
- stack detectada;
- specialists resolvidos;
- drift;
- operações executadas.


### doctor

Verificar pelo menos:

- Node;
- npm;
- Git;
- Specsfy;
- versão mínima exigida pelo Specsfy atual;
- acesso ao projeto;
- configuração do kit;
- profiles válidos;
- specialists;
- integridade do lock;
- dependências externas realmente utilizadas pelo mecanismo escolhido.

Não reinstalar nada no `doctor`.

### update

Deve:

1. ler `.specsfy-kit.yml`;
2. detectar novamente a stack;
3. resolver profiles;
4. atualizar assets oficiais do projeto utilizando a interface oficial apropriada do Specsfy;
5. atualizar/reinstalar os specialists gerenciados pelo kit;
6. preservar conteúdo externo não gerenciado;
7. atualizar o lock;
8. apresentar alterações.

Não execute `specsfy upgrade` global silenciosamente.

Se quiser suportar isso, utilize uma opção explícita como:

```bash
specsfy-kit update --upgrade-specsfy
```

## 13. Integração com Specsfy

Crie um adapter:

```text
SpecsfyAdapter
```

ou equivalente.

Toda execução do CLI oficial deve passar por essa camada.

Não espalhe chamadas a:

```text
specsfy ...
```

pelo código inteiro.

O adapter deve encapsular:

- descoberta do executável;
- versão;
- doctor;
- setup/install;
- update;
- listagem de skills;
- detecção oficial;
- adição de specialists;
- execução com environment customizado quando necessário.

Isso reduz o acoplamento caso o Specsfy altere sua CLI.

## 14. Specialists próprios

Crie inicialmente:

```text
specsfy-specialist-java
specsfy-specialist-java-testing
specsfy-specialist-maven
specsfy-specialist-spring-framework
specsfy-specialist-spring-boot
specsfy-specialist-hibernate
specsfy-specialist-legacy-modernization
specsfy-specialist-vue
specsfy-specialist-quasar
specsfy-specialist-node
specsfy-specialist-serverless-framework
```

Antes de escrever os specialists:

1. estude a estrutura dos specialists oficiais;
2. reproduza a convenção oficial;
3. use o padrão Agent Skills esperado pelo ecossistema atual;
4. não invente metadata incompatível.

Os specialists devem fornecer **guardrails e conhecimento**, não substituir a metodologia do Specsfy.

## 15. Regras importantes dos specialists

### java

Cobrir conceitos Java sem presumir framework moderno.

Não assumir automaticamente:

- Spring Boot;
- Jakarta;
- Hibernate atual;
- JDK mais recente.

Respeitar a versão detectada.

### java-testing

Cobrir:

- JUnit;
- Mockito;
- AssertJ quando aplicável;
- unit tests;
- integration tests;
- characterization tests;
- TDD;
- isolamento;
- deterministic tests;
- test pyramid de forma pragmática.

Regra:

> Não gerar milhares de testes apenas para aumentar coverage.

Regra:

> Não considerar falhas históricas não relacionadas como RED válido.

### maven

Cobrir:

- lifecycle;
- dependency scopes;
- Surefire;
- Failsafe;
- plugins;
- multi-module;
- dependencyManagement;
- profiles;
- wrappers.

Não alterar versões indiscriminadamente.

### spring-framework

Cobrir Spring Framework sem presumir Spring Boot:

- DI;
- XML config;
- annotations;
- transactions;
- MVC;
- ApplicationContext;
- component scanning;
- lifecycle.

Regra:

> não converter XML para annotations automaticamente.

### spring-boot

Especializado em Spring Boot quando ele realmente existir.

Não ativá-lo simplesmente porque existe Spring Framework.

### hibernate

Cobrir:

- Session;
- SessionFactory;
- EntityManager quando aplicável;
- transactions;
- lazy loading;
- proxies;
- N+1;
- fetching;
- dirty checking;
- cascades;
- detached entities;
- mapping.

Guardrails:

- não mudar LAZY para EAGER como solução genérica;
- não migrar Hibernate para outra major incidentalmente;
- não converter Hibernate API para JPA sem requisito;
- respeitar a versão detectada.

### legacy-modernization

Esse é um specialist central.

Regras:

- preservar comportamento existente;
- mudanças incrementais;
- separar modernização estrutural de mudança funcional;
- characterization tests quando comportamento legado relevante for alterado;
- upgrades somente quando previstos pela spec;
- não “modernizar porque é melhor”;
- não trocar framework como efeito colateral;
- registrar dívida técnica descoberta em vez de expandir silenciosamente o escopo.

### vue

Respeitar versão existente.

Não converter automaticamente:

```text
Options API → Composition API
```

sem motivo funcional/arquitetural.

### quasar

Respeitar:

- versão;
- boot files;
- plugins;
- router;
- stores;
- componentes existentes;
- convenções do projeto.

Não substituir Quasar por outra biblioteca.

### serverless-framework

Respeitar:

- versão existente;
- `serverless.yml/yaml/ts/js`;
- stages;
- variables;
- IAM;
- packaging;
- handlers;
- plugins.

Não migrar automaticamente para CDK/SAM/Terraform.

## 16. Specialists oficiais + specialists do kit

Precisamos conseguir utilizar ambos.

Investigue cuidadosamente como o catálogo atual do Specsfy funciona.

A variável:

```text
SPECSFY_SPECIALISTS_CATALOG
```

pode mudar a fonte de catálogo. NÃO presuma que ela realiza merge.

Descubra o comportamento real.

Escolha uma estratégia que preserve:

```text
specialists oficiais
+
specialists do specsfy-kit
```

Preferência arquitetural:

- Specsfy gerencia specialists oficiais;
- specsfy-kit gerencia seus próprios specialists como extensões externas.

Se o `skills CLI` já possuir um mecanismo público apropriado para instalar skills externas, considere utilizá-lo.

Se for necessário criar catálogo combinado:

- descubra primeiro o schema real;
- encapsule essa responsabilidade;
- gere o catálogo de maneira determinística;
- não codifique o schema em vários lugares;
- crie testes de compatibilidade.

Documente a decisão.

## 17. Atualizações e isolamento

Uma atualização oficial do Specsfy não pode apagar silenciosamente os specialists do kit.

Uma atualização do kit não pode modificar skills oficiais do Specsfy diretamente.

Defina ownership:

```text
Specsfy-owned
Kit-owned
User-owned
```

Toda escrita de arquivo deve respeitar ownership.

Se um arquivo `kit-owned` tiver sido alterado manualmente pelo usuário:

- detectar drift;
- não sobrescrever silenciosamente;
- exigir `--force` ou estratégia equivalente;
- mostrar diff/resumo quando possível.

## 18. Templates customizados

Investigue o mecanismo oficial:

```text
.specsfy/templates/custom/
```

Se templates próprios forem necessários, utilize a extensão suportada oficialmente em vez de modificar templates gerenciados.

Não crie templates próprios nesta primeira versão se não houver necessidade concreta.

Prepare apenas a arquitetura para suportá-los futuramente.

## 19. Segurança

O CLI NÃO deve:

- apagar código da aplicação;
- alterar `pom.xml`;
- alterar `package.json`;
- atualizar framework;
- executar migrations;
- publicar pacote;
- fazer push;
- criar PR;
- instalar dependências globais silenciosamente.

`init` deve alterar somente os artefatos necessários ao Specsfy/kit.

Implemente:

```bash
--dry-run
```

nas operações mutáveis importantes.

## 20. Cross-platform

O projeto precisa funcionar em:

- Windows;
- Linux;
- macOS.

Evite scripts dependentes exclusivamente de Bash.

Para subprocessos:

- prefira APIs Node cross-platform;
- evite montar comando por concatenação de string;
- evite `shell: true` quando desnecessário;
- trate caminhos com espaços corretamente;
- trate `specsfy.cmd`/resolução Windows quando necessário.

## 21. Tecnologia do próprio specsfy-kit

Preferência:

```text
Node.js >= versão mínima atualmente exigida pelo Specsfy
TypeScript
ESM
```

Utilize poucas dependências.

Pode utilizar bibliotecas maduras para:

- parsing CLI;
- prompts;
- YAML;
- execução de subprocessos.

Mas antes verifique se há vantagens reais.

Não crie framework próprio desnecessariamente.

## 22. Arquitetura esperada

Não precisa seguir exatamente estes caminhos, mas mantenha separação semelhante:

```text
src/
├── cli/
│   ├── commands/
│   └── prompts/
│
├── config/
│   ├── schema.ts
│   ├── loader.ts
│   └── lock.ts
│
├── detection/
│   ├── detector.ts
│   ├── java/
│   ├── node/
│   ├── vue/
│   └── serverless/
│
├── profiles/
│   ├── resolver.ts
│   ├── definitions/
│   └── conflicts.ts
│
├── specialists/
│   ├── resolver.ts
│   └── installer.ts
│
├── specsfy/
│   └── adapter.ts
│
├── ownership/
│
└── core/
```

E:

```text
specialists/
profiles/
docs/
tests/
fixtures/
```

Evite classes gigantes.

## 23. Testes

Este projeto deve nascer testado.

Crie testes unitários para:

- parsing de configuração;
- resolução de profiles;
- composição de profiles;
- conflitos;
- resolução de default profile;
- regras `branchProfiles`;
- precedência CLI override > branch rule > default;
- patterns de branch;
- comportamento de `replace`;
- comportamento de `add`;
- resolução em Git worktree;
- isolamento de estado runtime entre worktrees;
- deduplicação de specialists;
- detecção Maven;
- detecção Gradle;
- detecção Spring Framework;
- detecção Spring Boot;
- detecção Hibernate;
- detecção Vue;
- detecção Quasar;
- detecção Serverless Framework;
- geração do lock;
- drift;
- comandos construídos para o SpecsfyAdapter.

Crie fixtures representando pelo menos:

```text
java8-legacy/
java21-spring4-hibernate4/
spring-boot-service/
vue-quasar/
serverless-node/
java-vue-monorepo/
git-branches-modernization/
git-worktree-legacy/
git-worktree-modernization/
```

O caso:

```text
java21-spring4-hibernate4
```

é particularmente importante.

O detector NÃO pode inferir Spring Boot apenas porque Java é moderno.

Crie integração usando fake/mock do executável `specsfy`.

Os testes padrão NÃO devem depender de:

- rede;
- GitHub;
- instalação global do Specsfy.

Se quiser criar testes de integração reais, coloque-os atrás de flag/environment variável separada.

## 24. Experiência esperada

Exemplo:

```text
$ specsfy-kit init

Analyzing project...

Detected stack

  Java                 21
  Build                 Maven
  Spring Framework      4.3.x
  Hibernate             4.x
  Vue                   3.x
  Quasar                2.x

Suggested profiles

  ◉ java-modernization
  ◉ vue-quasar
  ○ java-legacy
  ○ spring-boot-service

Why?

  java-modernization
    Java 21 combined with legacy Spring/Hibernate was detected.
    Project intent cannot be inferred automatically.

Select project profiles:
> java-modernization
  vue-quasar

Resolved specialists:

  Kit
    java
    java-testing
    maven
    spring-framework
    hibernate
    legacy-modernization
    vue
    quasar

  Official
    <official specialists considered useful>

Operations:

  create .specsfy-kit.yml
  run specsfy doctor
  run specsfy setup
  install resolved specialists
  create .specsfy-kit.lock.json

Proceed? Y/n
```

Não precisa copiar exatamente a aparência, mas quero UX semelhante.

## 25. Automação

Modo não interativo:

```bash
specsfy-kit init \
  --profile java-modernization \
  --profile vue-quasar \
  --yes
```

Também:

```bash
specsfy-kit detect --json
specsfy-kit status --json
specsfy-kit doctor --json
```

JSON deve ser estável e adequado para CI.


## 25.1. Distribuição via GitHub

O MVP será hospedado no repositório:

```text
Cadlira/specsfy-kit
```

Não dependa de publicação no npm registry.

O projeto deve ser instalável diretamente do GitHub por npm.

Garanta:

- `package.json` válido;
- campo `bin` correto;
- build reproduzível;
- artefatos necessários presentes no pacote instalado;
- lifecycle apropriado para dependência Git;
- shebang apropriado no executável quando necessário;
- permissões/execução cross-platform;
- versão disponível via `specsfy-kit --version`.

Crie pelo menos um teste de empacotamento/instalação que simule ou execute instalação a partir de um pacote Git/local equivalente, sem depender obrigatoriamente da rede nos testes padrão.

Antes da entrega, valide manualmente ou por teste isolado que a estratégia escolhida funciona para:

```bash
npm install --global github:Cadlira/specsfy-kit
```

ou documente e utilize a forma GitHub equivalente que de fato funcione.


## 26. README

O README é parte obrigatória do MVP e deve permitir que alguém configure tudo **do zero**, sem precisar consultar este prompt.

O repositório pessoal que será utilizado para o projeto é:

```text
https://github.com/Cadlira/specsfy-kit
```

O package/repository deve ser preparado para instalação diretamente desse repositório GitHub, mesmo antes de existir publicação no npm registry.

### 26.1. Pré-requisitos

Documentar explicitamente os pré-requisitos reais.

Na data da implementação, confirmar novamente os requisitos oficiais do Specsfy.

No momento deste prompt, a documentação oficial informa Node.js 22.20 ou superior e npm.

O README não deve congelar esse número sem validação: confirme a versão atual no Specsfy oficial durante a implementação.

Documentar como verificar:

```bash
node --version
npm --version
git --version
```

e quaisquer outros pré-requisitos realmente necessários.

### 26.2. Instalação do Specsfy oficial

Criar uma seção específica:

```text
## Instalação do Specsfy oficial
```

Explicar que o `specsfy-kit` NÃO substitui o Specsfy e NÃO é fork dele.

Usar o mecanismo oficial atual confirmado durante a implementação.

No momento deste prompt, o fluxo oficial documentado é:

```bash
npm install --global @promovaweb/specsfy
specsfy --version
```

Documentar também como atualizar o CLI oficial utilizando o mecanismo recomendado pelo próprio Specsfy.

No momento deste prompt, existe:

```bash
specsfy upgrade
```

mas confirme isso novamente antes de escrever o README final.

### 26.3. Instalação do specsfy-kit a partir do GitHub Cadlira

Criar uma seção específica:

```text
## Instalação do specsfy-kit
```

O repositório será:

```text
https://github.com/Cadlira/specsfy-kit
```

Prepare `package.json`, `bin`, build e lifecycle scripts necessários para que a instalação direta do GitHub funcione.

A experiência desejada é algo semelhante a:

```bash
npm install --global github:Cadlira/specsfy-kit
specsfy-kit --version
```

ou, se tecnicamente mais correto:

```bash
npm install --global git+https://github.com/Cadlira/specsfy-kit.git
specsfy-kit --version
```

Determine qual formato funciona de maneira confiável e documente o formato recomendado.

A instalação via GitHub deve funcionar a partir de um checkout limpo do consumidor.

Se o TypeScript precisar ser compilado durante instalação Git:

- configure `prepare`, `prepack` ou mecanismo apropriado;
- garanta que `bin` aponte para código executável existente;
- teste realmente a instalação empacotada;
- não presuma que `src/*.ts` será executável diretamente.

Também documentar, quando suportado:

```bash
npx github:Cadlira/specsfy-kit --help
```

Não documente esse comando se ele não funcionar de verdade.

### 26.4. Instalação para desenvolvimento do próprio kit

Documentar separadamente como desenvolver o kit:

```bash
git clone https://github.com/Cadlira/specsfy-kit.git
cd specsfy-kit
npm install
npm test
npm run build
```

Ajustar aos scripts reais implementados.

Não misturar "instalar para usar" com "clonar para desenvolver".

### 26.5. Configuração do zero em um projeto consumidor

Criar uma seção de destaque:

```text
## Configuração do zero em um projeto
```

Ela deve mostrar o fluxo completo desde uma máquina que ainda não possui Specsfy/kit até um projeto configurado.

O fluxo conceitual desejado é:

```bash
# 1. confirmar pré-requisitos
node --version
npm --version

# 2. instalar Specsfy oficial
npm install --global @promovaweb/specsfy
specsfy --version

# 3. instalar specsfy-kit
npm install --global github:Cadlira/specsfy-kit
specsfy-kit --version

# 4. entrar no projeto
cd caminho/do/projeto

# 5. opcional: somente detectar, sem escrever
specsfy-kit detect

# 6. inicializar
specsfy-kit init

# 7. conferir resultado
specsfy-kit status
specsfy-kit doctor
```

A regra MAIS IMPORTANTE do README:

> O caminho recomendado NÃO deve mandar o usuário executar `specsfy setup` manualmente antes do `specsfy-kit init`.

O `specsfy-kit init` deve:

1. detectar a stack;
2. escolher/resolver profile;
3. persistir a configuração do kit;
4. executar `specsfy doctor`;
5. executar o `specsfy setup` oficial pelo `SpecsfyAdapter`;
6. instalar/resolver specialists;
7. validar a instalação.

Ou seja:

```text
ERRADO

specsfy setup
specsfy-kit init
```

```text
CORRETO

instalar CLI Specsfy
instalar CLI specsfy-kit
specsfy-kit init
```

O Specsfy precisa estar instalado; o setup do projeto será orquestrado pelo kit.

### 26.6. Configuração de projeto simples

Mostrar um exemplo como:

```bash
cd meu-microservico
specsfy-kit init --profile spring-boot-service
```

e o arquivo resultante:

```yaml
schemaVersion: 1

defaultProfiles:
  - spring-boot-service

branchProfiles: []

overrides:
  addSpecialists: []
  removeSpecialists: []
```

### 26.7. Configuração de legado + modernização por branches

Criar um exemplo completo com:

```yaml
schemaVersion: 1

defaultProfiles:
  - java-legacy

branchProfiles:
  - pattern: "modernizacao/**"
    replace:
      - java-modernization

  - pattern: "migration/**"
    replace:
      - java-modernization

overrides:
  addSpecialists: []
  removeSpecialists: []
```

Mostrar:

```bash
git checkout main
specsfy-kit sync
specsfy-kit status
```

Resultado esperado conceitual:

```text
Branch: main
Active profile: java-legacy
Source: defaultProfiles
```

Depois:

```bash
git checkout modernizacao/java21
specsfy-kit sync
specsfy-kit status
```

Resultado:

```text
Branch: modernizacao/java21
Active profile: java-modernization
Source: branch rule modernizacao/**
```

### 26.8. Exemplo com Git worktree

Documentar um exemplo:

```bash
git worktree add ../projeto-java21 modernizacao/java21
```

Depois:

```bash
cd ../projeto-java21
specsfy-kit sync
specsfy-kit status
```

Explicar que cada worktree pode possuir profile runtime diferente sem interferir no outro.

### 26.9. Atualização

Criar seção clara separando responsabilidades.

#### Atualizar Specsfy oficial

Documentar o comando oficial atual confirmado durante implementação.

Exemplo atualmente conhecido:

```bash
specsfy upgrade
```

e, para assets do projeto quando apropriado:

```bash
specsfy update --project .
```

Explicar quando o usuário deve utilizar diretamente esse comando e quando `specsfy-kit update` o orquestra.

#### Atualizar specsfy-kit

Como o kit inicialmente estará no GitHub pessoal, documentar como obter a versão mais recente, por exemplo:

```bash
npm install --global github:Cadlira/specsfy-kit
```

Se houver tags/releases, documentar também instalação pinada:

```bash
npm install --global github:Cadlira/specsfy-kit#vX.Y.Z
```

somente se isso for testado.

Depois:

```bash
cd caminho/do/projeto
specsfy-kit update
specsfy-kit status
```

### 26.10. Desinstalação

Documentar como remover o kit sem remover o Specsfy oficial e vice-versa.

Não apagar configuração de projetos automaticamente durante desinstalação global.

### 26.11. Conteúdo restante obrigatório do README

Além da instalação, explicar:

- problema resolvido;
- relação com Specsfy;
- por que não é um fork;
- arquitetura;
- profiles;
- defaultProfiles;
- branchProfiles;
- precedência dos profiles;
- `sync`;
- Git worktrees;
- specialists;
- detecção;
- update;
- ownership;
- configuração;
- lock;
- exemplos Java;
- exemplos Java legado;
- exemplos de modernização;
- exemplos Spring Boot;
- exemplos Vue/Quasar;
- exemplos Serverless;
- `--dry-run`;
- uso em CI;
- troubleshooting.

Inclua um diagrama Mermaid da arquitetura.

Inclua uma seção curta "Quick start" perto do início, mas mantenha uma seção de instalação completa e detalhada mais abaixo.

Todos os comandos mostrados no README devem ser executáveis ou claramente marcados como exemplos conceituais.


## 27. ADRs

Crie ADRs para decisões importantes, pelo menos:

```text
ADR-001 - Do not fork Specsfy
ADR-002 - Profiles before Specsfy setup
ADR-003 - Profiles represent intent
ADR-004 - External specialists ownership
ADR-005 - Config and lock separation
ADR-006 - Branch-aware profile resolution
ADR-007 - Worktree-local runtime state
ADR-008 - sync does not require re-init
ADR-009 - GitHub-first distribution via Cadlira/specsfy-kit
```

## 28. Não faça overengineering

A primeira versão deve ser útil de verdade, mas pequena o suficiente para manutenção.

Prioridade:

```text
1. arquitetura correta
2. init
3. stack detection
4. profiles
5. config
6. specialists
7. integração com Specsfy
8. update/status/doctor
9. testes
10. documentação
```

Não implemente agora:

- servidor;
- SaaS;
- banco de dados;
- UI web;
- telemetry;
- analytics;
- marketplace;
- plugin system genérico;
- atualização automática em background.

## 29. Critérios de aceite

Só considere o MVP concluído quando:

- [ ] projeto compila;
- [ ] CLI executa;
- [ ] `specsfy-kit --help` funciona;
- [ ] `specsfy-kit detect` funciona;
- [ ] profiles são listados;
- [ ] profiles são composáveis;
- [ ] `defaultProfiles` funciona;
- [ ] `branchProfiles` funciona;
- [ ] regras `replace` e `add` funcionam;
- [ ] precedência CLI override > branch rule > default funciona;
- [ ] `specsfy-kit sync` funciona após checkout;
- [ ] `sync` não exige novo `init`;
- [ ] `status` mostra branch, profile ativo e origem;
- [ ] Git worktrees diferentes conseguem resolver profiles diferentes;
- [ ] estado runtime de um worktree não contamina outro;
- [ ] conflitos são validados;
- [ ] `init` escolhe profile antes do Specsfy setup;
- [ ] `--profile` repetível funciona;
- [ ] `.specsfy-kit.yml` é criado;
- [ ] lock é criado;
- [ ] stack Java é detectada;
- [ ] Spring Framework e Spring Boot são diferenciados;
- [ ] Hibernate é detectado;
- [ ] Vue é detectado;
- [ ] Quasar é detectado;
- [ ] Serverless Framework é detectado;
- [ ] specialists do kit são resolvidos;
- [ ] specialists oficiais podem coexistir;
- [ ] `SpecsfyAdapter` encapsula chamadas externas;
- [ ] `--dry-run` não escreve;
- [ ] `status` funciona;
- [ ] `doctor` funciona;
- [ ] `update` funciona;
- [ ] Windows é considerado;
- [ ] testes unitários passam;
- [ ] fixtures passam;
- [ ] lint passa;
- [ ] typecheck passa;
- [ ] README está completo;
- [ ] README documenta instalação do Specsfy oficial;
- [ ] README documenta instalação do kit via `Cadlira/specsfy-kit`;
- [ ] instalação direta do GitHub foi realmente testada;
- [ ] README possui configuração do zero de um projeto;
- [ ] README deixa claro que `specsfy-kit init` ocorre antes do `specsfy setup` do projeto;
- [ ] README possui exemplo de legado + modernização por branch;
- [ ] README possui exemplo de Git worktree;
- [ ] README documenta atualização separada de Specsfy e specsfy-kit;
- [ ] ADRs foram criados;
- [ ] nenhuma alteração foi feita no código-fonte do Specsfy.

## 30. Forma de trabalho

Antes de codificar:

1. pesquise;
2. documente rapidamente os findings relevantes;
3. proponha internamente a arquitetura;
4. implemente.

Durante a implementação:

- mantenha mudanças pequenas;
- execute testes frequentemente;
- não ignore erros;
- não masque falhas;
- não altere requisitos apenas para fazer testes passarem.

Se encontrar alguma incompatibilidade entre este prompt e o Specsfy atual:

1. não invente uma API;
2. descubra o mecanismo atual;
3. adapte a implementação preservando o objetivo arquitetural;
4. documente a diferença em `docs/specsfy-integration.md`.

Não pare para me perguntar detalhes menores. Tome decisões técnicas razoáveis, documente-as e prossiga.

## 31. Entrega final

Ao terminar, apresente:

1. resumo da arquitetura implementada;
2. árvore principal do projeto;
3. commands disponíveis;
4. profiles implementados;
5. specialists implementados;
6. como a integração com o Specsfy funciona;
7. como atualizar o Specsfy sem afetar o kit;
8. como atualizar o kit sem afetar o Specsfy;
9. testes executados e resultados;
10. limitações conhecidas;
11. próximos passos recomendados;
12. instruções verificadas para instalar o kit diretamente de `github.com/Cadlira/specsfy-kit`;
13. demonstração do fluxo `main -> java-legacy` e `modernizacao/** -> java-modernization`;
14. demonstração ou teste automatizado do isolamento entre worktrees.

Não publique o pacote npm e não envie nada para repositórios remotos sem solicitação explícita.
