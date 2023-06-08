export declare function resolveFile(dirs: string[], filePath: string): string | null;
export declare function rmFile(filePath: string, baseDir: string): Promise<void>;
export declare function saveFile(filePath: string, baseDir: string, content: string): Promise<void>;
export declare function parseFile<T>(filePath: string): Promise<T>;
export declare const clearTerminal: () => void;
export declare function generateFunnyDescriptiveName(): string;
export declare function delay(ms: number): Promise<unknown>;
export declare function sanitize(input: string): string;
