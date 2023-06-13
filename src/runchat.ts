#!/usr/bin/env node
import { Command } from "commander";
import { createContext } from "./context";
import {
  createTask,
  extendFromConfig,
  findVariableSlots,
  getSingleConfig,
} from "./task";
import createFsResolver from "./resolvers/fs";
import createCtxResolver from "./resolvers/ctx";
import { createProgress } from "./cli";
import { promptArgs } from "./prompt";
import { TaskArgs, TaskConfig } from "./types";

const program = new Command();
program
  .version("0.8.7")
  .description("A conveyor belt for ChatGPT tasks")
  .option("-c, --config <path>", "Config file to use")
  .option(
    "-m, --message <message>",
    "A message to send. Will append it to a config messages if -c is passed"
  )
  .option(
    "-b, --base-dir <path>",
    "Project base directory. All file operations will be relative to this directory"
  )
  .option("-s, --silent", "Omit progress indication")
  .option("-l, --logs-dir <path>", "Dump logs into a directory")
  .allowUnknownOption()
  .action(async (options) => {
    try {
      let vars: { [key: string]: string } = {};
      for (const rawArg of process.argv) {
        if (rawArg.startsWith("-v")) {
          const arg = rawArg.slice(2);
          const [key, value] = arg.split("=");
          vars[key] = value;
        }
      }

      const {
        config: configRequest,
        message,
        baseDir: baseDirParam,
        logsDir,
        silent,
      } = options;

      if (!configRequest && !message) {
        throw new Error(
          `No input specified. Please use --chat or --message options`
        );
      }

      // Create a context
      const baseDir = baseDirParam || process.cwd();
      const ctx = await createContext({
        baseDir,
        logsDir,
        resolvers: {
          fs: createFsResolver,
          ctx: createCtxResolver,
        },
      });

      // Fill missing vars
      const baseConfig = configRequest
        ? await getSingleConfig(configRequest, baseDir)
        : { title: "Call ChatGPT", messages: [] };
      const missingArgs: TaskArgs = {};
      for (const [argName, argDsc] of Object.entries(baseConfig.args || {})) {
        if (!vars[argName] && !(baseConfig.vars || {})[argName]) {
          missingArgs[argName] = argDsc;
        }
      }

      // Also look up for vars in the message passed with -m
      const messageVars = message ? findVariableSlots(message) : [];
      for (const argName of messageVars) {
        if (!vars[argName] && !(baseConfig.vars || {})[argName]) {
          missingArgs[argName] = `Set "${argName}" value`;
        }
      }

      if (Object.keys(missingArgs).length) {
        const missingVars = await promptArgs(missingArgs);
        vars = {
          ...vars,
          ...missingVars,
        };
      }

      // Append message if needed
      if (baseConfig.messages && message) {
        baseConfig.messages.push({
          role: "user",
          content: message,
        });
      }

      // Parse base config
      const resolvedConfig: TaskConfig = await extendFromConfig(
        ctx,
        baseConfig,
        baseConfig.baseDir!,
        { vars }
      );

      const progress = createProgress(resolvedConfig, !silent);
      progress.show();
      const task = createTask(resolvedConfig);
      const result = await task(ctx);
      progress.hide();

      // Print output, reset try count
      console.log(result);
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

process.on("uncaughtException", function (err) {
  console.error("Caught unhandled", err);
  process.exit(1);
});

program.parse(process.argv);
