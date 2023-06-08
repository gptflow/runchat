import { Context, InitContext } from "./types";
export declare const CONFIG_FILE_GLOB = "runchat.json";
export declare function createContext(init: InitContext): Promise<Context>;
