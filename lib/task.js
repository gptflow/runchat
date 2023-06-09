"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = exports.createTask = exports.parseFiles = exports.parseContextVars = exports.resolveNode = exports.getConcurrent = exports.getTasks = exports.getChatConfig = exports.getTitle = exports.getConfigMessages = exports.configToString = exports.findVariableSlots = exports.extendFromFileRequest = exports.extendFromConfig = exports.getSingleConfig = void 0;
const path_1 = __importStar(require("path"));
const nodeFs = __importStar(require("fs"));
const utils_1 = require("./utils");
const openai_1 = require("./openai");
const AsyncQueue_1 = require("./impl/AsyncQueue");
function getSearchPaths(dir) {
    const directories = [];
    let currentDir = dir;
    while (currentDir !== path_1.default.parse(currentDir).root) {
        directories.push(currentDir);
        currentDir = path_1.default.dirname(currentDir);
    }
    // Adding the root directory
    directories.push(currentDir);
    return directories.map((it) => it === "/" ? "/node_modules" : `${it}/node_modules`);
}
function resolveFileToExtend(baseDir, request) {
    let filePath = null;
    // Relative path?
    if (request.startsWith(".")) {
        filePath = (0, path_1.join)(baseDir, request);
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
        }
        catch (err) {
            throw new Error(`resolveFileToExtend: Failed to find ${request} from ${baseDir}\nPaths = ${JSON.stringify(paths, null, "  ")}`);
        }
    }
    if (!filePath.endsWith(".json")) {
        filePath = `${filePath}/index.json`;
    }
    if (filePath === null || !nodeFs.existsSync(filePath)) {
        throw new Error(`resolveFileToExtend: Failed to find ${request} from ${baseDir}: ${filePath} does not exist`);
    }
    return filePath;
}
// Resolves a config and sets it's baseDir field
function getSingleConfig(
// extend field value
request, 
// where the current
baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        //
        const filePath = resolveFileToExtend(baseDir, request);
        try {
            const config = JSON.parse(yield nodeFs.promises.readFile(filePath, "utf-8"));
            config.baseDir = (0, path_1.dirname)(filePath);
            return config;
        }
        catch (err) {
            console.error(`Failed to parse file ${filePath}`);
            throw err;
        }
    });
}
exports.getSingleConfig = getSingleConfig;
function extendFromConfig(ctx, config, baseDir, parent) {
    return __awaiter(this, void 0, void 0, function* () {
        return resolveNode(ctx, Object.assign(Object.assign({}, config), { baseDir, _parent: parent }));
    });
}
exports.extendFromConfig = extendFromConfig;
// Finds a file, parses it and gives parsed file to resolveExtend
function extendFromFileRequest(
// Execution context
ctx, 
// extend field value
request, 
// where the current
baseDir, 
//
parent) {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = resolveFileToExtend(baseDir, request);
        try {
            const item = JSON.parse(yield nodeFs.promises.readFile(filePath, "utf-8"));
            return extendFromConfig(ctx, item, (0, path_1.dirname)(filePath), parent);
        }
        catch (err) {
            console.error(`Extend: failed to parse file ${filePath}`);
            throw err;
        }
    });
}
exports.extendFromFileRequest = extendFromFileRequest;
function resolveExtend(ctx, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const { extend } = node;
        // If extend - then read base file ane apply props
        if (extend) {
            node._extend = yield extendFromFileRequest(ctx, extend, node.baseDir, node);
        }
        return node;
    });
}
function findVariableSlots(input) {
    const itemPattern = /{{(.*?)}}/g;
    const itemValues = new Set();
    let match;
    while ((match = itemPattern.exec(input)) !== null) {
        itemValues.add(match[1]);
    }
    return Array.from(itemValues);
}
exports.findVariableSlots = findVariableSlots;
function findResourceSlots(input) {
    const itemPattern = /{\[(.*?)\]}/g;
    const itemValues = new Set();
    let match;
    while ((match = itemPattern.exec(input)) !== null) {
        itemValues.add(match[1]);
    }
    return Array.from(itemValues);
}
function resolveVar(varName, node) {
    return __awaiter(this, void 0, void 0, function* () {
        function next(node) {
            if ((node === null || node === void 0 ? void 0 : node.vars) && (node === null || node === void 0 ? void 0 : node.vars[varName])) {
                return node === null || node === void 0 ? void 0 : node.vars[varName];
            }
            if (node === null || node === void 0 ? void 0 : node._parent) {
                return next(node === null || node === void 0 ? void 0 : node._parent);
            }
            return undefined;
        }
        return next(node);
    });
}
function configToString(config) {
    const exclude = ["status", "logStream", "_parent", "_extend"];
    return JSON.stringify(config, function (key, value) {
        if (exclude.indexOf(key) !== -1) {
            return undefined;
        }
        return value;
    }, "  ");
}
exports.configToString = configToString;
function trimSlots(value) {
    return value.replace(/{{\s*/g, "{{").replace(/\s*}}/g, "}}");
}
function replaceAll(input, value, replaceWith) {
    let result = input;
    do {
        result = result.replace(value, replaceWith);
    } while (result.indexOf(value) !== -1);
    return result;
}
function resolveValueResources(config, inputValue, ctx
// data?: ResolveData
) {
    return __awaiter(this, void 0, void 0, function* () {
        // For every var find all the {{ slot }} entires
        const value = trimSlots(inputValue);
        const slots = findResourceSlots(value);
        const slotValues = {};
        for (let slot of slots) {
            // For every slot - either reslove a resource value or a var value
            // let content: string | undefined = "";
            // Looks like a resource specifier
            if (slot.indexOf(":") === -1) {
                throw new Error(`A resource specifier should be of type:query format. Missing : in ${slot}`);
            }
            const content = yield ctx.resolve(slot, config);
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
    });
}
function resolveValueVars(inputValue, node) {
    return __awaiter(this, void 0, void 0, function* () {
        // For every var find all the {{ slot }} entires
        const value = trimSlots(inputValue);
        const slots = findVariableSlots(value);
        const slotValues = {};
        for (let slot of slots) {
            // For every slot - either reslove a resource value or a var value
            const content = yield resolveVar(slot, node);
            // Will look parent nodes for var value if nothing in current node
            if (content === undefined) {
                throw new Error(`Failed to resolve "${slot}" variable at ${configToString(node)}`);
            }
            slotValues[slot] = content;
        }
        // After all slot values found - merge it back to var value
        let resolvedValue = value;
        for (let [slot, slotValue] of Object.entries(slotValues)) {
            resolvedValue = replaceAll(resolvedValue, `{{${slot}}}`, slotValue);
        }
        return resolvedValue;
    });
}
function resolveVars(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const vars = {};
        for (const [varName, varValue] of Object.entries(node.vars || {})) {
            vars[varName] = yield resolveValueVars(varValue, node);
        }
        node.vars = vars;
        return node;
    });
}
function resolveNodeMessagesVars(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = [];
        for (const rawMessage of node.messages || []) {
            const { content: rawContent } = rawMessage;
            let content = "";
            if (typeof rawContent === "string") {
                content = rawContent;
            }
            else if (Array.isArray(rawContent)) {
                content = rawContent.join("\n");
            }
            else {
                throw new Error(`Unknown message content format ${rawContent}`);
            }
            messages.push(Object.assign(Object.assign({}, rawMessage), { content: yield resolveValueVars(content, node) }));
        }
        node.messages = messages;
        return node;
    });
}
function getNodeChatMessagesWithResolvedResources(node, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = [];
        for (const rawMessage of node.messages || []) {
            const { content: rawContent } = rawMessage;
            let content = "";
            if (typeof rawContent === "string") {
                content = rawContent;
            }
            else if (Array.isArray(rawContent)) {
                content = rawContent.join("\n");
            }
            else {
                throw new Error(`Unknown message content format ${rawContent}`);
            }
            messages.push(Object.assign(Object.assign({}, rawMessage), { content: yield resolveValueResources(node, content, ctx) }));
        }
        return messages;
    });
}
// Get config properties. Taking into account that config can be extended
function getConfigMessages(ctx, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = [];
        function getInner(node) {
            return __awaiter(this, void 0, void 0, function* () {
                if (node._extend) {
                    yield getInner(node._extend);
                }
                messages.push(...(yield getNodeChatMessagesWithResolvedResources(node, ctx)));
            });
        }
        yield getInner(node);
        return messages;
    });
}
exports.getConfigMessages = getConfigMessages;
function getFirst(config, propName) {
    function getInner(config) {
        // @ts-expect-error
        const val = config[propName];
        if (val) {
            return val;
        }
        return config._extend ? getInner(config._extend) : null;
    }
    return getInner(config);
}
const getTitle = (config) => getFirst(config, "title");
exports.getTitle = getTitle;
const getChatConfig = (config) => getFirst(config, "chatParams");
exports.getChatConfig = getChatConfig;
const getTasks = (config) => getFirst(config, "tasks");
exports.getTasks = getTasks;
const getConcurrent = (config) => getFirst(config, "concurrent");
exports.getConcurrent = getConcurrent;
function resolveTasks(ctx, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = [];
        for (const child of node.tasks || []) {
            tasks.push(yield resolveNode(ctx, Object.assign(Object.assign({}, child), { _parent: node, baseDir: node.baseDir })));
        }
        node.tasks = tasks;
        return node;
    });
}
function generateFilename(strings) {
    const combinedString = strings.join("-");
    const hyphenatedString = combinedString.replace(/[\s\t]/g, "-");
    const cleanedString = hyphenatedString
        .replace(/[^a-z0-9.-]/gi, "")
        .toLowerCase();
    const filename = cleanedString + ".log";
    return filename;
}
let lastLogId = 0;
function getLogFileName(node) {
    const parts = [];
    function next(node) {
        parts.push(node.title);
    }
    next(node);
    return `${++lastLogId}_${generateFilename(parts)}`;
}
function createLogStream(ctx, node) {
    return __awaiter(this, void 0, void 0, function* () {
        // Set logging
        if (ctx.logsDir) {
            const logsDir = path_1.default.isAbsolute(ctx.logsDir)
                ? ctx.logsDir
                : path_1.default.join(ctx.baseDir, ctx.logsDir, ctx.runName);
            if (!nodeFs.existsSync(logsDir)) {
                yield nodeFs.promises.mkdir(logsDir, { recursive: true });
            }
            return nodeFs.createWriteStream(path_1.default.join(logsDir, getLogFileName(node)));
        }
    });
}
function createTaskStatus() {
    const queue = new AsyncQueue_1.AsyncQueue();
    return {
        next: (value) => queue.push({ value }),
        error: (error) => queue.push({ value: null, error }),
        finish: () => queue.push({ value: null }),
        queue,
    };
}
function trimVars(node) {
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
function resolveNode(ctx, node) {
    return __awaiter(this, void 0, void 0, function* () {
        function resolveInner(node) {
            return __awaiter(this, void 0, void 0, function* () {
                // Remove vars of form: varName: '{{varName}}'
                // as this will lead to a cycle
                trimVars(node);
                // If this node has vars declared and this
                // vars have {{ }} in their bodies - replace it with
                // actual values
                node = yield resolveVars(node);
                // extend?
                if (node.extend) {
                    node = yield resolveExtend(ctx, node);
                }
                // chat?
                // Replace vars innode messages
                if (node.messages) {
                    node = yield resolveNodeMessagesVars(node);
                }
                // group?
                // Go to tasks
                else if (node.tasks) {
                    node = yield resolveTasks(ctx, node);
                }
                node.status = createTaskStatus();
                return node;
            });
        }
        return resolveInner(node);
    });
}
exports.resolveNode = resolveNode;
function parseContextVars(str) {
    return __awaiter(this, void 0, void 0, function* () {
        const regex = /#>>(.+?)>>#([\s\S]+?)#<<\1<<#/g;
        const ctxVars = [];
        let match;
        while ((match = regex.exec(str))) {
            const [, path, content] = match;
            if ((0, path_1.extname)(path) === ".ctx") {
                ctxVars.push({ path: path.replace(/\.ctx$/, ""), content });
            }
        }
        return ctxVars;
    });
}
exports.parseContextVars = parseContextVars;
function parseFiles(str) {
    return __awaiter(this, void 0, void 0, function* () {
        const regex = /#>>(.+?)>>#([\s\S]+?)#<<\1<<#/g;
        const files = [];
        let match;
        while ((match = regex.exec(str))) {
            const [, path, content] = match;
            if ((0, path_1.extname)(path) !== ".ctx") {
                files.push({ path, content });
            }
        }
        return files;
    });
}
exports.parseFiles = parseFiles;
function getNodeType(config) {
    function getInnerType(config) {
        if (config.messages) {
            return "chat";
        }
        else if (config.tasks) {
            return "group";
        }
        else if (config._extend) {
            return getInnerType(config._extend);
        }
        else {
            throw new Error(`Unknown node type\n${configToString(config)}`);
        }
    }
    return getInnerType(config);
}
function createTask(config
// transformVfs: VfsTransform,
// fsTypeKey: string
) {
    function createAnyTask(config) {
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
            throw new Error(`Failed to create task: unknown type\n${configToString(config)}`);
        }
    }
    function createChatTask(config) {
        const { status } = config;
        // data contains
        return function (ctx) {
            var _a, _b, _c, _d, _e, _f, _g;
            return __awaiter(this, void 0, void 0, function* () {
                const title = (0, exports.getTitle)(config);
                const chatParams = (0, exports.getChatConfig)(config);
                config.logStream = yield createLogStream(ctx, config);
                //
                try {
                    (_a = config === null || config === void 0 ? void 0 : config.status) === null || _a === void 0 ? void 0 : _a.next("Resolving messages...");
                    // Set resources
                    const messages = yield getConfigMessages(ctx, config);
                    // Chat messages with resolved resources
                    const msgString = JSON.stringify(messages, null, "  ")
                        .replace(/\\n/g, "\n")
                        .replace(/\\"/g, '"');
                    (_b = config === null || config === void 0 ? void 0 : config.logStream) === null || _b === void 0 ? void 0 : _b.write(`[Chat ${title}] messages: ${msgString}\n`);
                    (_c = config === null || config === void 0 ? void 0 : config.logStream) === null || _c === void 0 ? void 0 : _c.write(`[Chat ${title}] gpt response:\n`);
                    (_d = config === null || config === void 0 ? void 0 : config.status) === null || _d === void 0 ? void 0 : _d.next("Waiting for ChatGPT response...");
                    const buf = yield (0, openai_1.callGpt)(Object.assign(Object.assign({}, chatParams), { messages }), (chunk, buf) => {
                        var _a;
                        (_a = config === null || config === void 0 ? void 0 : config.logStream) === null || _a === void 0 ? void 0 : _a.write(chunk);
                        status === null || status === void 0 ? void 0 : status.next(`Done ${buf.getSize()} bytes`);
                    });
                    (_e = config === null || config === void 0 ? void 0 : config.logStream) === null || _e === void 0 ? void 0 : _e.write(`\n[Chat ${title}] gpt response done.\n`);
                    const bufString = buf.toString();
                    // Parse resources from gpt response
                    const files = yield parseFiles(bufString);
                    const ctxVars = yield parseContextVars(bufString);
                    // Save context vars
                    for (const { path: ctxVarName, content } of ctxVars) {
                        ctx.data[ctxVarName] = content;
                    }
                    // Apply parsed files
                    for (const { path: filePath, content } of files) {
                        yield (0, utils_1.saveFile)(filePath, ctx.baseDir, content);
                    }
                    (_f = config === null || config === void 0 ? void 0 : config.logStream) === null || _f === void 0 ? void 0 : _f.write(`\n[Chat ${title}] parsed files ${files
                        .map((it) => it.path)
                        .join(",")}.\n`);
                    status === null || status === void 0 ? void 0 : status.finish();
                    // TODO:
                    yield (0, utils_1.delay)(1000);
                    return bufString;
                }
                catch (err) {
                    const error = err;
                    (_g = config === null || config === void 0 ? void 0 : config.logStream) === null || _g === void 0 ? void 0 : _g.write(`[Chat ${title}]: ${error.message}\n${error.stack}`);
                    status === null || status === void 0 ? void 0 : status.error(error);
                    // TODO:
                    yield (0, utils_1.delay)(1000);
                    throw error;
                }
            });
        };
    }
    function createGroupTask(config) {
        return function (ctx) {
            var _a, _b, _c, _d;
            return __awaiter(this, void 0, void 0, function* () {
                const title = (0, exports.getTitle)(config);
                const tasks = (0, exports.getTasks)(config);
                const concurrent = (0, exports.getConcurrent)(config);
                try {
                    const toRun = (tasks === null || tasks === void 0 ? void 0 : tasks.map((t) => createAnyTask(t))) || [];
                    const outputs = [];
                    (_a = config.status) === null || _a === void 0 ? void 0 : _a.next("Waiting for subtasks...");
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
                        const results = yield Promise.all(pool);
                        outputs.push(...results);
                    }
                    // If sequential - tasks run one be one, each following task
                    //  will get a vfs populated by previous task
                    else {
                        for (const task of toRun) {
                            const result = yield task(ctx);
                            outputs.push(result);
                        }
                    }
                    (_b = config.status) === null || _b === void 0 ? void 0 : _b.finish();
                    // TODO:
                    yield (0, utils_1.delay)(1000);
                    return outputs.join("\n");
                }
                catch (err) {
                    const error = err;
                    (_c = config === null || config === void 0 ? void 0 : config.logStream) === null || _c === void 0 ? void 0 : _c.write(`[Chat ${title}]: ${error.message}\n${error.stack}`);
                    (_d = config.status) === null || _d === void 0 ? void 0 : _d.error(error);
                    // TODO:
                    yield (0, utils_1.delay)(1000);
                    throw error;
                }
            });
        };
    }
    return createAnyTask(config);
}
exports.createTask = createTask;
function trace(config) {
    function inner(config, type, level = 0) {
        console.log(`${new Array(level * 2).join(" ")}[${type}] Node: ${config.title};`);
        if (config._extend) {
            inner(config._extend, "Extend", level + 1);
        }
        if (config.tasks) {
            config.tasks.forEach((it) => inner(it, "Task", level + 1));
        }
    }
    inner(config, "Root");
}
exports.trace = trace;
