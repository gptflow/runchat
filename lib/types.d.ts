/// <reference types="node" />
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from "openai";
import { Writable } from "stream";
export type ProjectConfig = {
    resolvers?: {
        [key: string]: {
            package: string;
            config: {
                [key: string]: unknown;
            };
        };
    };
};
export type Chat = {
    messages?: ChatCompletionRequestMessage[];
};
export type TaskVars = {
    [key: string]: string;
};
export type TaskArgs = {
    [key: string]: string;
};
export type TaskStatus = {
    next: (status: string) => void;
    error: (error: Error) => void;
    finish: () => void;
    queue: AsyncIterable<string>;
};
export type TaskMessageItem = {
    role: ChatCompletionRequestMessageRoleEnum;
    content: string | string[];
};
export type ChatGptParams = {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
};
export type TaskConfig = {
    extend?: string;
    args?: TaskArgs;
    vars?: TaskVars;
    title?: string;
    description?: string | string[];
    tasks?: TaskConfig[];
    concurrent?: boolean;
    messages?: TaskMessageItem[];
    chatParams?: ChatGptParams;
    baseDir?: string;
    status?: TaskStatus;
    logStream?: Writable;
    _parent?: TaskConfig;
    _extend?: TaskConfig;
};
export type Task = (ctx: Context) => Promise<string>;
export type ResourceResolver = (query: string, config: TaskConfig) => Promise<string>;
export type ResourceResolverFactory = (ctx: Context, type: string, config: unknown) => Promise<ResourceResolver>;
export type InitContext = {
    baseDir: string;
    logsDir?: string;
    resolvers?: {
        [key: string]: ResourceResolverFactory;
    };
};
export type ResponseBuffer = {
    write: (value: string) => void;
    toString: () => string;
    getSize: () => number;
};
export type Context = {
    baseDir: string;
    runName: string;
    logsDir?: string;
    data: Record<string, string>;
    resolve: (specifier: string, config: TaskConfig) => Promise<string>;
};
