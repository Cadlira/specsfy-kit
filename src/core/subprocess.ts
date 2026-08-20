export interface PortableInvocation { command: string; args: string[]; env?: Record<string, string> }

/**
 * Encaminha shims npm do Windows sem `shell: true` e sem interpolar argumentos
 * controlados pelo usuário em uma string de comando.
 */
export function portableInvocation(command: string, args: string[], platform = process.platform): PortableInvocation {
  if (platform === "win32" && /\.(?:cmd|bat)$/i.test(command)) {
    const targetNeedsQuotes = /\s/.test(command);
    const env: Record<string, string> = { SPECSFY_KIT_TARGET: targetNeedsQuotes ? `"${command.replaceAll('"', '""')}"` : command };
    const placeholders = args.map((value, index) => {
      const key = `SPECSFY_KIT_ARG_${index}`;
      env[key] = `"${value.replaceAll('"', '""')}"`;
      return `%${key}%`;
    });
    return {
      command: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/v:off", "/s", "/c", `${targetNeedsQuotes ? "" : "call "}%SPECSFY_KIT_TARGET% ${placeholders.join(" ")}`.trim()],
      env,
    };
  }
  return { command, args };
}
