import type { ProfileDefinition } from "../core/types.js";

export const PROFILE_DEFINITIONS: readonly ProfileDefinition[] = [
  {
    name: "java-legacy",
    description: "Manutenção conservadora de Java legado.",
    intent: "Preservar comportamento e evitar modernizações incidentais.",
    dependencies: [], conflicts: ["java-modernization"],
    specialists: ["java", "java-testing", "maven", "spring-framework", "hibernate", "legacy-modernization"],
    conditionalSpecialists: [], officialSpecialists: [],
  },
  {
    name: "java-modernization",
    description: "Modernização incremental e explicitamente especificada de Java legado.",
    intent: "Criar characterization tests, entregar passos pequenos e impedir upgrades incidentais.",
    dependencies: [], conflicts: ["java-legacy"],
    specialists: ["java", "java-testing", "maven", "spring-framework", "hibernate", "legacy-modernization"],
    conditionalSpecialists: [], officialSpecialists: ["specsfy-specialist-software-architecture"],
  },
  {
    name: "spring-boot-service",
    description: "Serviço Spring Boot com práticas de API, persistência e testes.",
    intent: "Evoluir um serviço Boot segundo a versão e convenções realmente detectadas.",
    dependencies: [], conflicts: [], specialists: ["java", "java-testing", "spring-boot"],
    conditionalSpecialists: [
      { specialist: "maven", technology: "maven" },
      { specialist: "hibernate", technology: "hibernate" },
    ],
    officialSpecialists: ["specsfy-specialist-web-api-design", "specsfy-specialist-software-architecture"],
  },
  {
    name: "vue-quasar",
    description: "Aplicação Vue com Quasar, respeitando versão e convenções existentes.",
    intent: "Manter a arquitetura Vue/Quasar sem migrações cosméticas ou troca de UI library.",
    dependencies: [], conflicts: [], specialists: ["vue", "quasar"],
    conditionalSpecialists: [],
    officialSpecialists: ["specsfy-specialist-typescript", "specsfy-specialist-ui-design", "specsfy-specialist-ux-design", "specsfy-specialist-web-accessibility"],
  },
  {
    name: "serverless-node",
    description: "Serviço Node no Serverless Framework.",
    intent: "Preservar configuração, stages, IAM e packaging do Serverless existente.",
    dependencies: [], conflicts: [], specialists: ["node", "serverless-framework"],
    conditionalSpecialists: [],
    officialSpecialists: ["specsfy-specialist-typescript", "specsfy-specialist-web-api-design", "specsfy-specialist-software-architecture", "specsfy-specialist-application-security"],
  },
] as const;

export const PROFILES = new Map(PROFILE_DEFINITIONS.map((profile) => [profile.name, profile]));
