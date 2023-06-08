import { TaskConfig } from "./types";
type Progress = {
    show: () => void;
    hide: () => void;
};
export declare const spinnerFrames: string[];
export declare function createProgress(config: TaskConfig, interactive: boolean): Progress;
export {};
