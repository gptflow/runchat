import { ResponseBuffer } from "./types";
import { CreateChatCompletionRequest, OpenAIApi } from "openai";
export declare const api: OpenAIApi;
export declare function chat(args: Partial<CreateChatCompletionRequest>, onTokens: (tokens: string) => void): Promise<void>;
export declare function callGpt(chatParams: Partial<CreateChatCompletionRequest>, onUpdate?: (chunk: string, buf: ResponseBuffer) => void): Promise<ResponseBuffer>;
