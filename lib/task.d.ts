import { ChatCompletionRequestMessage } from "openai";
import { Context, TaskConfig, Task, ChatGptParams } from "./types";
export declare function getSingleConfig(request: string, baseDir: string): Promise<TaskConfig>;
export declare function extendFromConfig(ctx: Context, config: TaskConfig, baseDir: string, parent?: TaskConfig): Promise<TaskConfig>;
export declare function extendFromFileRequest(ctx: Context, request: string, baseDir: string, parent: TaskConfig): Promise<TaskConfig>;
export declare function findVariableSlots(input: string): string[];
export declare function configToString(config: TaskConfig): string;
export declare function getConfigMessages(ctx: Context, node: TaskConfig): Promise<ChatCompletionRequestMessage[]>;
export declare const getTitle: (config: TaskConfig) => string | null;
export declare const getChatConfig: (config: TaskConfig) => ChatGptParams | null;
export declare const getTasks: (config: TaskConfig) => TaskConfig[] | null;
export declare const getConcurrent: (config: TaskConfig) => boolean | null;
export declare function resolveNode(ctx: Context, node: TaskConfig): Promise<TaskConfig>;
type ParsedValue = {
    path: string;
    content: string;
};
export declare function parseContextVars(str: string): Promise<ParsedValue[]>;
export declare function parseFiles(str: string): Promise<ParsedValue[]>;
export declare function createTask(config: TaskConfig): Task;
export declare function trace(config: TaskConfig): void;
export {};
