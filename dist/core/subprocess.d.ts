export interface PortableInvocation {
    command: string;
    args: string[];
    env?: Record<string, string>;
}
/**
 * Encaminha shims npm do Windows sem `shell: true` e sem interpolar argumentos
 * controlados pelo usuário em uma string de comando.
 */
export declare function portableInvocation(command: string, args: string[], platform?: NodeJS.Platform): PortableInvocation;
