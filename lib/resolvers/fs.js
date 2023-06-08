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
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const url_1 = require("url");
const fs_1 = require("fs");
const task_1 = require("../task");
const createFsResolver = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return (query, config) => __awaiter(void 0, void 0, void 0, function* () {
        const [globQuery, search] = query.split("?");
        const searchParams = new url_1.URLSearchParams(search ? search : "");
        // default = text with a wrapper
        // text = text with no wrapper
        // name-only = put the file name instead of file content
        const mode = searchParams.get("mode") || "default";
        // put a path from usePath instead of real file path
        const usePath = searchParams.get("usePath");
        //
        const baseDirType = searchParams.get("baseDir") || "project";
        const baseDir = baseDirType === "config" ? config.baseDir : ctx.baseDir;
        if (!baseDir) {
            throw new Error(`Base dir is empty or undefined:\n ${(0, task_1.configToString)(config)}`);
        }
        const files = yield (0, glob_1.glob)(globQuery, {
            cwd: baseDir,
            absolute: false,
            nodir: true,
        });
        if (files.length !== 1 && usePath) {
            throw new Error(`Got ${files.length} files for usePath. Should be a single file`);
        }
        const contents = {};
        for (const it of files) {
            const filePath = path_1.default.join(baseDir, it);
            let content = "";
            // Remove a file
            if (mode === "filename") {
                content = it;
            }
            else {
                content = yield fs_1.promises.readFile(filePath, "utf-8");
            }
            // Wrap into a parsable block by default
            const itemPath = usePath || it;
            contents[itemPath] =
                mode === "default"
                    ? `#>>${itemPath}>>#${content}#<<${itemPath}<<#`
                    : content;
        }
        return Object.values(contents).join("\n");
    });
});
exports.default = createFsResolver;
