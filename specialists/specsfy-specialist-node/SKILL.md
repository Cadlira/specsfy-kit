---
name: specsfy-specialist-node
description: Orientar aplicações Node.js conforme versão, ESM/CJS, package manager, async lifecycle e testes detectados. Use em runtime, módulos, scripts e serviços Node; não presuma TypeScript ou versão recente.
---

# Node.js

## Fluxo

1. Confirme engines, `.nvmrc`/`.node-version`, package manager e ESM/CJS.
2. Preserve contratos async, encerramento, propagação de erro e limites de I/O.
3. Valide entrada externa e trate timeout, retry e idempotência onde houver efeitos.
4. Mantenha dependências e APIs compatíveis com o runtime alvo.
5. Execute testes, lint, typecheck quando aplicável e build/package.

## Guardrails

- Não converter CommonJS/ESM, elevar Node ou trocar package manager incidentalmente.
- Não engolir rejection nem registrar segredos/payloads sensíveis.
- Não adicionar dependência quando a plataforma já oferece uma solução clara e compatível.
