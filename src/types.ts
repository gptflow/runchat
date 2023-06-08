import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { Writable } from "stream";

// Project config
export type ProjectConfig = {
  resolvers?: {
    [key: string]: {
      package: string;
      config: { [key: string]: unknown };
    };
  };
};

// Chat
export type Chat = {
  messages?: ChatCompletionRequestMessage[];
};

// Tasks
export type TaskVars = { [key: string]: string };
export type TaskArgs = { [key: string]: string };

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
  // Extend task from a task defined in a file
  extend?: string;

  // Args - is a description of vars
  args?: TaskArgs;
  vars?: TaskVars;

  // Short title to be shown during execution
  title?: string;
  description?: string | string[];

  // type = group
  tasks?: TaskConfig[];
  concurrent?: boolean;

  // type = chat
  messages?: TaskMessageItem[];

  // Chat gpt params
  chatParams?: ChatGptParams;

  // Injected during execution
  // Config dir
  baseDir?: string;
  // status and log streams
  status?: TaskStatus;
  logStream?: Writable;
  // structure relatives
  _parent?: TaskConfig;
  _extend?: TaskConfig;
};

export type Task = (ctx: Context) => Promise<string>;

// Takes a query and returns a resource
export type ResourceResolver = (
  query: string,
  config: TaskConfig
) => Promise<string>;

export type ResourceResolverFactory = (
  ctx: Context,
  type: string,
  config: unknown
) => Promise<ResourceResolver>;

//
export type InitContext = {
  baseDir: string;
  logsDir?: string;
  resolvers?: { [key: string]: ResourceResolverFactory };
};

export type ResponseBuffer = {
  write: (value: string) => void;
  toString: () => string;
  getSize: () => number;
};

// Execution context
export type Context = {
  // Project base dir
  baseDir: string;
  //
  runName: string;
  // Logs
  logsDir?: string;
  // Context data
  data: Record<string, string>;
  // Resolve resource by its specifier
  resolve: (specifier: string, config: TaskConfig) => Promise<string>;
};
