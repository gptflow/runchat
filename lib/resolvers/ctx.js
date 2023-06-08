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
const url_1 = require("url");
const minimatch_1 = require("minimatch");
const createCtxResolver = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return (query) => __awaiter(void 0, void 0, void 0, function* () {
        const [globQuery, search] = query.split("?");
        const searchParams = new url_1.URLSearchParams(search ? search : "");
        // default = text with a wrapper
        // text = text with no wrapper
        // name-only = put the file name instead of file content
        const mode = searchParams.get("mode") || "default";
        // put a path from usePath instead of real file path
        const usePath = searchParams.get("usePath");
        // Do not fall with an error in case if nothing found
        const emptyIsOk = searchParams.has("emptyIsOk");
        const varNames = Object.keys(ctx.data).filter((it) => (0, minimatch_1.minimatch)(it, globQuery));
        if (varNames.length === 0 && !emptyIsOk) {
            throw new Error(`No variables found for ${globQuery}. Use emptyIsOk flag to not fail if no files found.`);
        }
        if (varNames.length !== 1 && usePath) {
            throw new Error(`Got ${varNames.length} files for usePath. Should be a single file`);
        }
        const contents = {};
        for (const it of varNames) {
            let content = ctx.data[it];
            // Remove a file
            if (mode === "name-only") {
                content = it;
            }
            // Wrap into a parsable block by default
            const itemPath = usePath || it;
            contents[itemPath] =
                mode === "default"
                    ? `#>>${itemPath}.ctx>>#${content}#<<${itemPath}.ctx<<#`
                    : content;
        }
        return Object.values(contents).join("\n");
    });
});
exports.default = createCtxResolver;
