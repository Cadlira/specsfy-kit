---
name: specsfy-specialist-serverless-framework
description: Orientar Serverless Framework conforme a versão e configuração detectadas, cobrindo stages, variables, IAM, packaging, handlers, plugins, AWS Lambda e deploy seguro. Não migrar automaticamente para CDK, SAM ou Terraform.
---

# Serverless Framework

## Fluxo

1. Confirme versão do Framework, arquivo de configuração, provider, runtime e plugins.
2. Trace resolução de variables por stage sem imprimir segredos.
3. Preserve nomes lógicos, eventos, handlers, layers, packaging e compatibilidade de deploy.
4. Aplique menor privilégio em IAM e considere retry, idempotência, DLQ e timeout.
5. Valide configuração/package localmente; deploy e migrações exigem autorização explícita.

## Guardrails

- Não migrar para CDK/SAM/Terraform nem trocar major incidentalmente.
- Não executar deploy, remover stack ou ampliar IAM sem autorização.
- Não presumir AWS quando outro provider estiver configurado.
