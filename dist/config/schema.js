function stringArray(value, label) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw new Error(`${label} deve ser uma lista de strings`);
    }
    return [...new Set(value)];
}
export function parseConfig(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("configuração deve ser um objeto YAML");
    }
    const raw = value;
    if (raw.schemaVersion !== 1)
        throw new Error("schemaVersion suportado: 1");
    const defaultProfiles = stringArray(raw.defaultProfiles, "defaultProfiles");
    if (defaultProfiles.length === 0)
        throw new Error("defaultProfiles não pode ser vazio");
    if (!Array.isArray(raw.branchProfiles))
        throw new Error("branchProfiles deve ser uma lista");
    const branchProfiles = raw.branchProfiles.map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            throw new Error(`branchProfiles[${index}] deve ser um objeto`);
        }
        const rule = entry;
        if (typeof rule.pattern !== "string" || !rule.pattern) {
            throw new Error(`branchProfiles[${index}].pattern é obrigatório`);
        }
        if (rule.add !== undefined && rule.replace !== undefined) {
            throw new Error(`branchProfiles[${index}] não pode combinar add e replace`);
        }
        if (rule.add === undefined && rule.replace === undefined) {
            throw new Error(`branchProfiles[${index}] requer add ou replace`);
        }
        const result = { pattern: rule.pattern };
        if (rule.add !== undefined)
            result.add = stringArray(rule.add, `branchProfiles[${index}].add`);
        if (rule.replace !== undefined)
            result.replace = stringArray(rule.replace, `branchProfiles[${index}].replace`);
        return result;
    });
    const rawOverrides = raw.overrides ?? {};
    if (!rawOverrides || typeof rawOverrides !== "object" || Array.isArray(rawOverrides)) {
        throw new Error("overrides deve ser um objeto");
    }
    const overrides = rawOverrides;
    return {
        schemaVersion: 1,
        defaultProfiles,
        branchProfiles,
        overrides: {
            addSpecialists: stringArray(overrides.addSpecialists ?? [], "overrides.addSpecialists"),
            removeSpecialists: stringArray(overrides.removeSpecialists ?? [], "overrides.removeSpecialists"),
        },
    };
}
//# sourceMappingURL=schema.js.map