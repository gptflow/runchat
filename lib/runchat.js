#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const context_1 = require("./context");
const task_1 = require("./task");
const fs_1 = __importDefault(require("./resolvers/fs"));
const ctx_1 = __importDefault(require("./resolvers/ctx"));
const cli_1 = require("./cli");
const prompt_1 = require("./prompt");
const program = new commander_1.Command();
program
    .version("0.1.0")
    .description("A conveyor belt for ChatGPT tasks")
    .option("-c, --config <path>", "Config file to use")
    .option("-m, --message <message>", "A message to send. Will append it to a config messages if -c is passed")
    .option("-b, --base-dir <path>", "Project base directory. All file operations will be relative to this directory")
    .option("-s, --silent", "Omit progress indication")
    .option("-l, --logs-dir <path>", "Dump logs into a directory")
    .allowUnknownOption()
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let vars = {};
        for (const rawArg of process.argv) {
            if (rawArg.startsWith("-v")) {
                const arg = rawArg.slice(2);
                const [key, value] = arg.split("=");
                vars[key] = value;
            }
        }
        const { config: configRequest, message, baseDir: baseDirParam, logsDir, silent, } = options;
        if (!configRequest && !message) {
            throw new Error(`No input specified. Please use --chat or --message options`);
        }
        // Create a context
        const baseDir = baseDirParam || process.cwd();
        const ctx = yield (0, context_1.createContext)({
            baseDir,
            logsDir,
            resolvers: {
                fs: fs_1.default,
                ctx: ctx_1.default,
            },
        });
        // Fill missing vars
        const baseConfig = configRequest
            ? yield (0, task_1.getSingleConfig)(configRequest, baseDir)
            : { title: "Call ChatGPT", messages: [] };
        const missingArgs = {};
        for (const [argName, argDsc] of Object.entries(baseConfig.args || {})) {
            if (!vars[argName] && !(baseConfig.vars || {})[argName]) {
                missingArgs[argName] = argDsc;
            }
        }
        // Also look up for vars in the message passed with -m
        const messageVars = message ? (0, task_1.findVariableSlots)(message) : [];
        for (const argName of messageVars) {
            if (!vars[argName] && !(baseConfig.vars || {})[argName]) {
                missingArgs[argName] = `Set "${argName}" value`;
            }
        }
        if (Object.keys(missingArgs).length) {
            const missingVars = yield (0, prompt_1.promptArgs)(missingArgs);
            vars = Object.assign(Object.assign({}, vars), missingVars);
        }
        // Append message if needed
        if (baseConfig.messages && message) {
            baseConfig.messages.push({
                role: "user",
                content: message,
            });
        }
        // Parse base config
        const resolvedConfig = yield (0, task_1.extendFromConfig)(ctx, baseConfig, baseConfig.baseDir, { vars });
        const progress = (0, cli_1.createProgress)(resolvedConfig, !silent);
        progress.show();
        const task = (0, task_1.createTask)(resolvedConfig);
        const result = yield task(ctx);
        progress.hide();
        // Print output, reset try count
        console.log(result);
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}));
process.on("uncaughtException", function (err) {
    console.error("Caught unhandled", err);
    process.exit(1);
});
program.parse(process.argv);
