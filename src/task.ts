import path, { dirname, extname, join } from "path";
import * as nodeFs from "fs";
import { ChatCompletionRequestMessage } from "openai";
import {
  Context,
  TaskConfig,
  TaskVars,
  TaskStatus,
  Task,
  ChatGptParams,
} from "./types";
import { delay, saveFile } from "./utils";
import { callGpt } from "./openai";
import { AsyncQueue } from "./impl/AsyncQueue";

function getSearchPaths(dir: string): string[] {
  const directories: string[] = [];
  let currentDir = dir;
  while (currentDir !== path.parse(currentDir).root) {
    directories.push(currentDir);
    currentDir = path.dirname(currentDir);
  }
  // Adding the root directory
  directories.push(currentDir);
  return directories.map((it) =>
    it === "/" ? "/node_modules" : `${it}/node_modules`
  );
}

function resolveFileToExtend(baseDir: string, request: string) {
  let filePath: string | null = null;
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
    const paths = getSearchPaths(baseDir);
    try {
      filePath = require.resolve(request, {
        paths,
      });
    } catch (err) {
      throw new Error(
        `resolveFileToExtend: Failed to find ${request} from ${baseDir}\nPaths = ${JSON.stringify(
          paths,
          null,
          "  "
        )}`
      );
    }
  }
  if (!filePath.endsWith(".json")) {
    filePath = `${filePath}/index.json`;
  }
  if (filePath === null || !nodeFs.existsSync(filePath)) {
    throw new Error(
      `resolveFileToExtend: Failed to find ${request} from ${baseDir}: ${filePath} does not exist`
    );
  }
  return filePath;
}

// Resolves a config and sets it's baseDir field
export async function getSingleConfig(
  // extend field value
  request: string,
  // where the current
  baseDir: string
) {
  //
  const filePath = resolveFileToExtend(baseDir, request);
  try {
    const config = JSON.parse(
      await nodeFs.promises.readFile(filePath, "utf-8")
    ) as TaskConfig;
    config.baseDir = dirname(filePath);
    return config;
  } catch (err) {
    console.error(`Failed to parse file ${filePath}`);
    throw err;
  }
}

export async function extendFromConfig(
  ctx: Context,
  config: TaskConfig,
  baseDir: string,
  parent?: TaskConfig
) {
  return resolveNode(ctx, {
    ...config,
    baseDir,
    _parent: parent,
  });
}

// Finds a file, parses it and gives parsed file to resolveExtend
export async function extendFromFileRequest(
  // Execution context
  ctx: Context,
  // extend field value
  request: string,
  // where the current
  baseDir: string,
  //
  parent: TaskConfig
): Promise<TaskConfig> {
  const filePath = resolveFileToExtend(baseDir, request);
  try {
    const item = JSON.parse(
      await nodeFs.promises.readFile(filePath, "utf-8")
    ) as TaskConfig;
    return extendFromConfig(ctx, item, dirname(filePath), parent);
  } catch (err) {
    console.error(`Extend: failed to parse file ${filePath}`);
    throw err;
  }
}

async function resolveExtend(
  ctx: Context,
  node: TaskConfig
): Promise<TaskConfig> {
  const { extend } = node;
  // If extend - then read base file ane apply props
  if (extend) {
    node._extend = await extendFromFileRequest(
      ctx,
      extend,
      node.baseDir as string,
      node
    );
  }
  return node;
}

function findVariableSlots(input: string): string[] {
  const itemPattern = /{{(.*?)}}/g;
  const itemValues = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = itemPattern.exec(input)) !== null) {
    itemValues.add(match[1]);
  }
  return Array.from(itemValues);
}

function findResourceSlots(input: string): string[] {
  const itemPattern = /{\[(.*?)\]}/g;
  const itemValues = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = itemPattern.exec(input)) !== null) {
    itemValues.add(match[1]);
  }
  return Array.from(itemValues);
}

async function resolveVar(
  varName: string,
  node: TaskConfig
): Promise<string | undefined> {
  function next(node: TaskConfig): string | undefined {
    if (node?.vars && node?.vars[varName]) {
      return node?.vars[varName];
    }
    if (node?._parent) {
      return next(node?._parent);
    }
    return undefined;
  }
  return next(node);
}

export function configToString(config: TaskConfig): string {
  const exclude = ["status", "logStream", "_parent", "_extend"];
  return JSON.stringify(
    config,
    function (this: any, key: string, value: any): any {
      if (exclude.indexOf(key) !== -1) {
        return undefined;
      }
      return value;
    },
    "  "
  );
}

function trimSlots(value: string): string {
  return value.replace(/{{\s*/g, "{{").replace(/\s*}}/g, "}}");
}

function replaceAll(input: string, value: string, replaceWith: string): string {
  let result = input;
  do {
    result = result.replace(value, replaceWith);
  } while (result.indexOf(value) !== -1);
  return result;
}

async function resolveValueResources(
  config: TaskConfig,
  inputValue: string,
  ctx: Context
  // data?: ResolveData
): Promise<string> {
  // For every var find all the {{ slot }} entires
  const value = trimSlots(inputValue);
  const slots = findResourceSlots(value);
  const slotValues: { [key: string]: string } = {};
  for (let slot of slots) {
    // For every slot - either reslove a resource value or a var value
    // let content: string | undefined = "";
    // Looks like a resource specifier
    if (slot.indexOf(":") === -1) {
      throw new Error(
        `A resource specifier should be of type:query format. Missing : in ${slot}`
      );
    }
    const content = await ctx.resolve(slot, config);
    // content = await resourceToString(ctx, resolved);
    if (content === undefined) {
      throw new Error(`Failed to resolve "${slot}" resource at ${inputValue}`);
    }
    slotValues[slot] = content;
  }
  // After all slot values found - merge it back to var value
  let resolvedValue = value;
  for (let [slot, slotValue] of Object.entries(slotValues)) {
    resolvedValue = replaceAll(resolvedValue, `{[${slot}]}`, slotValue);
  }
  return resolvedValue;
}

async function resolveValueVars(
  inputValue: string,
  node: TaskConfig
): Promise<string> {
  // For every var find all the {{ slot }} entires
  const value = trimSlots(inputValue);
  const slots = findVariableSlots(value);
  const slotValues: { [key: string]: string } = {};
  for (let slot of slots) {
    // For every slot - either reslove a resource value or a var value
    const content = await resolveVar(slot, node);
    // Will look parent nodes for var value if nothing in current node
    if (content === undefined) {
      throw new Error(
        `Failed to resolve "${slot}" variable at ${configToString(node)}`
      );
    }
    slotValues[slot] = content;
  }
  // After all slot values found - merge it back to var value
  let resolvedValue = value;
  for (let [slot, slotValue] of Object.entries(slotValues)) {
    resolvedValue = replaceAll(resolvedValue, `{{${slot}}}`, slotValue);
  }
  return resolvedValue;
}

async function resolveVars(node: TaskConfig): Promise<TaskConfig> {
  const vars: TaskVars = {};
  for (const [varName, varValue] of Object.entries(node.vars || {})) {
    vars[varName] = await resolveValueVars(varValue, node);
  }
  node.vars = vars;
  return node;
}

async function resolveNodeMessagesVars(node: TaskConfig): Promise<TaskConfig> {
  const messages: ChatCompletionRequestMessage[] = [];
  for (const rawMessage of node.messages || []) {
    const { content: rawContent } = rawMessage;
    let content = "";
    if (typeof rawContent === "string") {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      content = rawContent.join("\n");
    } else {
      throw new Error(`Unknown message content format ${rawContent}`);
    }
    messages.push({
      ...rawMessage,
      content: await resolveValueVars(content, node),
    });
  }
  node.messages = messages;
  return node;
}

async function getNodeChatMessagesWithResolvedResources(
  node: TaskConfig,
  ctx: Context
): Promise<ChatCompletionRequestMessage[]> {
  const messages: ChatCompletionRequestMessage[] = [];
  for (const rawMessage of node.messages || []) {
    const { content: rawContent } = rawMessage;
    let content = "";
    if (typeof rawContent === "string") {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      content = rawContent.join("\n");
    } else {
      throw new Error(`Unknown message content format ${rawContent}`);
    }
    messages.push({
      ...rawMessage,
      content: await resolveValueResources(node, content, ctx),
    });
  }
  return messages;
}

// Get config properties. Taking into account that config can be extended
export async function getConfigMessages(
  ctx: Context,
  node: TaskConfig
): Promise<ChatCompletionRequestMessage[]> {
  const messages: ChatCompletionRequestMessage[] = [];
  async function getInner(node: TaskConfig) {
    if (node._extend) {
      await getInner(node._extend);
    }
    messages.push(
      ...(await getNodeChatMessagesWithResolvedResources(node, ctx))
    );
  }
  await getInner(node);
  return messages;
}

function getFirst<T>(config: TaskConfig, propName: string): T | null {
  function getInner(config: TaskConfig): T | null {
    // @ts-expect-error
    const val = config[propName] as T;
    if (val) {
      return val;
    }
    return config._extend ? getInner(config._extend) : null;
  }
  return getInner(config);
}

export const getTitle = (config: TaskConfig) =>
  getFirst<string>(config, "title");
export const getChatConfig = (config: TaskConfig) =>
  getFirst<ChatGptParams>(config, "chatParams");
export const getTasks = (config: TaskConfig) =>
  getFirst<TaskConfig[]>(config, "tasks");
export const getConcurrent = (config: TaskConfig) =>
  getFirst<boolean>(config, "concurrent");

async function resolveTasks(
  ctx: Context,
  node: TaskConfig
): Promise<TaskConfig> {
  const tasks: TaskConfig[] = [];
  for (const child of node.tasks || []) {
    tasks.push(
      await resolveNode(ctx, { ...child, _parent: node, baseDir: node.baseDir })
    );
  }
  node.tasks = tasks;
  return node;
}

function generateFilename(strings: string[]): string {
  const combinedString = strings.join("-");
  const hyphenatedString = combinedString.replace(/[\s\t]/g, "-");
  const cleanedString = hyphenatedString
    .replace(/[^a-z0-9.-]/gi, "")
    .toLowerCase();
  const filename = cleanedString + ".log";
  return filename;
}

let lastLogId = 0;
function getLogFileName(node: TaskConfig): string {
  const parts: string[] = [];
  function next(node: TaskConfig) {
    parts.push(node.title!);
  }
  next(node);
  return `${++lastLogId}_${generateFilename(parts)}`;
}

async function createLogStream(
  ctx: Context,
  node: TaskConfig
): Promise<nodeFs.WriteStream | undefined> {
  // Set logging
  if (ctx.logsDir) {
    const logsDir = path.isAbsolute(ctx.logsDir)
      ? ctx.logsDir
      : path.join(ctx.baseDir, ctx.logsDir, ctx.runName);

    if (!nodeFs.existsSync(logsDir)) {
      await nodeFs.promises.mkdir(logsDir, { recursive: true });
    }
    return nodeFs.createWriteStream(path.join(logsDir, getLogFileName(node)));
  }
}

function createTaskStatus(): TaskStatus {
  const queue = new AsyncQueue<string>();
  return {
    next: (value: string) => queue.push({ value }),
    error: (error: Error) => queue.push({ value: null, error }),
    finish: () => queue.push({ value: null }),
    queue,
  };
}

function trimVars(node: TaskConfig) {
  if (!node.vars) {
    return;
  }
  for (const varName of Object.keys(node.vars || {})) {
    const varValue = node.vars[varName];
    if (varValue && varValue.replace(/\s*/g, "") === `{{${varName}}}`) {
      delete node.vars[varName];
    }
  }
}

export async function resolveNode(
  ctx: Context,
  node: TaskConfig
): Promise<TaskConfig> {
  async function resolveInner(node: TaskConfig): Promise<TaskConfig> {
    // Remove vars of form: varName: '{{varName}}'
    // as this will lead to a cycle
    trimVars(node);

    // If this node has vars declared and this
    // vars have {{ }} in their bodies - replace it with
    // actual values
    node = await resolveVars(node);

    // extend?
    if (node.extend) {
      node = await resolveExtend(ctx, node);
    }
    // chat?
    // Replace vars innode messages
    if (node.messages) {
      node = await resolveNodeMessagesVars(node);
    }
    // group?
    // Go to tasks
    else if (node.tasks) {
      node = await resolveTasks(ctx, node);
    }

    node.status = createTaskStatus();
    return node;
  }
  return resolveInner(node);
}

type ParsedValue = { path: string; content: string };

export async function parseContextVars(str: string): Promise<ParsedValue[]> {
  const regex = /#>>(.+?)>>#([\s\S]+?)#<<\1<<#/g;
  const ctxVars: ParsedValue[] = [];
  let match;
  while ((match = regex.exec(str))) {
    const [, path, content] = match;
    if (extname(path) === ".ctx") {
      ctxVars.push({ path: path.replace(/\.ctx$/, ""), content });
    }
  }
  return ctxVars;
}

export async function parseFiles(str: string): Promise<ParsedValue[]> {
  const regex = /#>>(.+?)>>#([\s\S]+?)#<<\1<<#/g;
  const files: ParsedValue[] = [];
  let match;
  while ((match = regex.exec(str))) {
    const [, path, content] = match;
    if (extname(path) !== ".ctx") {
      files.push({ path, content });
    }
  }
  return files;
}

//
// Execution part
//

type TaskType = "chat" | "group";
function getNodeType(config: TaskConfig): TaskType {
  function getInnerType(config: TaskConfig): TaskType {
    if (config.messages) {
      return "chat";
    } else if (config.tasks) {
      return "group";
    } else if (config._extend) {
      return getInnerType(config._extend);
    } else {
      throw new Error(`Unknown node type\n${configToString(config)}`);
    }
  }
  return getInnerType(config);
}

export function createTask(
  config: TaskConfig
  // transformVfs: VfsTransform,
  // fsTypeKey: string
) {
  function createAnyTask(config: TaskConfig): Task {
    const nodeType = getNodeType(config);
    // chat task?
    if (nodeType === "chat") {
      return createChatTask(config);
    }
    // group?
    else if (nodeType === "group") {
      return createGroupTask(config);
    }
    // Hmm??
    else {
      throw new Error(
        `Failed to create task: unknown type\n${configToString(config)}`
      );
    }
  }

  function createChatTask(config: TaskConfig): Task {
    const { status } = config;

    // data contains
    return async function (ctx: Context): Promise<string> {
      const title = getTitle(config);
      const chatParams = getChatConfig(config);
      config.logStream = await createLogStream(ctx, config);

      //
      try {
        config?.status?.next("Resolving messages...");
        // Set resources
        const messages = await getConfigMessages(ctx, config);

        // Chat messages with resolved resources
        const msgString = JSON.stringify(messages, null, "  ")
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"');
        config?.logStream?.write(`[Chat ${title}] messages: ${msgString}\n`);

        config?.logStream?.write(`[Chat ${title}] gpt response:\n`);
        config?.status?.next("Waiting for ChatGPT response...");
        const buf = await callGpt({ ...chatParams, messages }, (chunk, buf) => {
          config?.logStream?.write(chunk);
          status?.next(`Done ${buf.getSize()} bytes`);
        });
        config?.logStream?.write(`\n[Chat ${title}] gpt response done.\n`);

        const bufString = buf.toString();
        // Parse resources from gpt response
        const files = await parseFiles(bufString);
        const ctxVars = await parseContextVars(bufString);

        // Save context vars
        for (const { path: ctxVarName, content } of ctxVars) {
          ctx.data[ctxVarName] = content;
        }

        // Apply parsed files
        for (const { path: filePath, content } of files) {
          await saveFile(filePath, ctx.baseDir, content);
        }

        config?.logStream?.write(
          `\n[Chat ${title}] parsed files ${files
            .map((it) => it.path)
            .join(",")}.\n`
        );

        status?.finish();
        // TODO:
        await delay(1000);
        return bufString;
      } catch (err) {
        const error = err as Error;
        config?.logStream?.write(
          `[Chat ${title}]: ${error.message}\n${error.stack}`
        );
        status?.error(error);
        // TODO:
        await delay(1000);
        throw error;
      }
    };
  }

  function createGroupTask(config: TaskConfig): Task {
    return async function (ctx: Context): Promise<string> {
      const title = getTitle(config);
      const tasks = getTasks(config);
      const concurrent = getConcurrent(config);
      try {
        const toRun = tasks?.map((t) => createAnyTask(t)) || [];
        const outputs: string[] = [];

        config.status?.next("Waiting for subtasks...");
        // const ownVfs = createVfs(ctx, {});
        // If concurrent - all tasks run individually
        // Note: results merged in order which tasks were specified
        if (concurrent) {
          const pool = [];
          // Concurrent tasks all take the same data input
          for (const task of toRun) {
            pool.push(task(ctx));
          }
          // Get results here
          const results = await Promise.all(pool);
          outputs.push(...results);
        }

        // If sequential - tasks run one be one, each following task
        //  will get a vfs populated by previous task
        else {
          for (const task of toRun) {
            const result = await task(ctx);
            outputs.push(result);
          }
        }

        config.status?.finish();
        // TODO:
        await delay(1000);
        return outputs.join("\n");
      } catch (err) {
        const error = err as Error;
        config?.logStream?.write(
          `[Chat ${title}]: ${error.message}\n${error.stack}`
        );
        config.status?.error(error);
        // TODO:
        await delay(1000);
        throw error;
      }
    };
  }

  return createAnyTask(config);
}

export function trace(config: TaskConfig) {
  function inner(config: TaskConfig, type: string, level = 0) {
    console.log(
      `${new Array(level * 2).join(" ")}[${type}] Node: ${config.title};`
    );
    if (config._extend) {
      inner(config._extend, "Extend", level + 1);
    }
    if (config.tasks) {
      config.tasks.forEach((it) => inner(it, "Task", level + 1));
    }
  }
  inner(config, "Root");
}
