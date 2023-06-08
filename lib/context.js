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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = exports.CONFIG_FILE_GLOB = void 0;
const glob_1 = require("glob");
const utils_1 = require("./utils");
const path_1 = require("path");
const fs_1 = require("fs");
exports.CONFIG_FILE_GLOB = `runchat.json`;
function getResolverModulePath(request, baseDir) {
    let filePath = "";
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
        try {
            filePath = require.resolve(request);
        }
        catch (err) {
            throw new Error(`getResolverModulePath: Failed to find ${request} from ${baseDir}`);
        }
    }
    if (!filePath.endsWith(".js")) {
        filePath = `${filePath}/index.js`;
    }
    if (filePath === null || !(0, fs_1.existsSync)(filePath)) {
        throw new Error(`getResolverModulePath: Failed to find ${request} from ${baseDir}: ${filePath} does not exist`);
    }
    return filePath;
}
function parseConfig(baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = glob_1.glob.sync(exports.CONFIG_FILE_GLOB, {
            cwd: baseDir,
            absolute: true,
        });
        if (!files.length) {
            return {};
        }
        // Parse config
        return (0, utils_1.parseFile)(files[0]);
    });
}
function createContext(init) {
    return __awaiter(this, void 0, void 0, function* () {
        const { baseDir, logsDir, resolvers: initResolvers } = init;
        const config = yield parseConfig(baseDir);
        // Context instance
        const ctx = {
            baseDir,
            logsDir,
            runName: (0, utils_1.generateFunnyDescriptiveName)(),
            data: {},
            resolve: () => __awaiter(this, void 0, void 0, function* () {
                throw new Error(`No waaay...`);
            }),
        };
        const resolvers = {};
        // Create resolvres from config
        for (let [rk, resolverConfig] of Object.entries(config.resolvers || {})) {
            const factory = require(getResolverModulePath(resolverConfig.package, baseDir)).default;
            resolvers[rk] = yield factory(ctx, rk, resolverConfig.config);
        }
        // Create resolvers from init
        for (let [rk, factory] of Object.entries(initResolvers || {})) {
            resolvers[rk] = yield factory(ctx, rk, {});
        }
        // Resolve
        ctx.resolve = (specifier, config) => __awaiter(this, void 0, void 0, function* () {
            const resolverName = specifier.split(":")[0];
            const resolve = resolvers[resolverName];
            if (!resolve) {
                throw new Error(`Failed to resolve resource: no resolver for type ${resolverName} found. Resolvers list: ${JSON.stringify(Object.keys(resolvers))}`);
            }
            const result = resolve(specifier.slice(resolverName.length + 1), config);
            if (result === null) {
                throw new Error(`Failed to resolve resource ${specifier}. Got null`);
            }
            return result;
        });
        return ctx;
    });
}
exports.createContext = createContext;
