import { glob } from "glob";
import { generateFunnyDescriptiveName, parseFile } from "./utils";
import {
  ProjectConfig,
  Context,
  InitContext,
  ResourceResolver,
  ResourceResolverFactory,
} from "./types";
import { join } from "path";
import { existsSync } from "fs";
import { TaskConfig } from "./types";

export const CONFIG_FILE_GLOB = `runchat.json`;

function getResolverModulePath(request: string, baseDir: string): string {
  let filePath = "";
  // Relative path?
  if (request.startsWith(".")) {
    filePath = join(baseDir, request);
  }
  // Absolute path?
  else if (request.startsWith("/")) {
    filePath = request;
  }
  // Search node_modules
  else {
    try {
      filePath = require.resolve(request);
    } catch (err) {
      throw new Error(
        `getResolverModulePath: Failed to find ${request} from ${baseDir}`
      );
    }
  }
  if (!filePath.endsWith(".js")) {
    filePath = `${filePath}/index.js`;
  }
  if (filePath === null || !existsSync(filePath)) {
    throw new Error(
      `getResolverModulePath: Failed to find ${request} from ${baseDir}: ${filePath} does not exist`
    );
  }
  return filePath;
}

async function parseConfig(baseDir: string): Promise<ProjectConfig> {
  const files = glob.sync(CONFIG_FILE_GLOB, {
    cwd: baseDir,
    absolute: true,
  });
  if (!files.length) {
    return {};
  }
  // Parse config
  return parseFile<ProjectConfig>(files[0]);
}

export async function createContext(init: InitContext): Promise<Context> {
  const { baseDir, logsDir, resolvers: initResolvers } = init;
  const config = await parseConfig(baseDir);

  // Context instance
  const ctx: Context = {
    baseDir,
    logsDir,
    runName: generateFunnyDescriptiveName(),
    data: {} as Record<string, string>,
    resolve: async () => {
      throw new Error(`No waaay...`);
    },
  };

  const resolvers: { [key: string]: ResourceResolver } = {};

  // Create resolvres from config
  for (let [rk, resolverConfig] of Object.entries(config.resolvers || {})) {
    const factory = require(getResolverModulePath(
      resolverConfig.package,
      baseDir
    )).default as ResourceResolverFactory;
    resolvers[rk] = await factory(ctx, rk, resolverConfig.config);
  }
  // Create resolvers from init
  for (let [rk, factory] of Object.entries(initResolvers || {})) {
    resolvers[rk] = await factory(ctx, rk, {});
  }

  // Resolve
  ctx.resolve = async (specifier: string, config: TaskConfig) => {
    const resolverName = specifier.split(":")[0];
    const resolve = resolvers[resolverName];
    if (!resolve) {
      throw new Error(
        `Failed to resolve resource: no resolver for type ${resolverName} found. Resolvers list: ${JSON.stringify(
          Object.keys(resolvers)
        )}`
      );
    }
    const result = resolve(specifier.slice(resolverName.length + 1), config);

    if (result === null) {
      throw new Error(`Failed to resolve resource ${specifier}. Got null`);
    }
    return result;
  };

  return ctx;
}
