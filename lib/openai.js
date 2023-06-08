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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGpt = exports.chat = exports.api = void 0;
const openai_1 = require("openai");
const configuration = new openai_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
exports.api = new openai_1.OpenAIApi(configuration);
const DEFAULTS = {
    model: "gpt-3.5-turbo",
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
};
function chat(args, onTokens) {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const request = Object.assign(Object.assign(Object.assign({}, DEFAULTS), { messages: [], stream: true }), args);
        const response = yield exports.api.createChatCompletion(request, {
            responseType: "stream",
        });
        try {
            // @ts-ignore
            for (var _d = true, _e = __asyncValues(response.data), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                _c = _f.value;
                _d = false;
                try {
                    const chunk = _c;
                    const lines = chunk
                        .toString("utf8")
                        .split("\n")
                        .filter((line) => line.trim().startsWith("data: "));
                    for (const line of lines) {
                        const message = line.replace(/^data: /, "");
                        if (message === "[DONE]") {
                            return;
                        }
                        let json;
                        try {
                            json = JSON.parse(message);
                        }
                        catch (err) {
                            throw new Error(`Failed to parse ChatGPT API response chunk: ${err}\nChunk was: ${message}`);
                        }
                        const token = json.choices[0].delta.content;
                        if (token) {
                            onTokens(token);
                        }
                    }
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
exports.chat = chat;
// Buffer for gpt output
function createResizableStringBuffer(size) {
    let instance = Buffer.alloc(size, 0, "utf-8");
    let bytesWritten = 0;
    return {
        write: (value) => {
            // Out of size? reallocate buffer
            if (instance.length <= bytesWritten + Buffer.byteLength(value, "utf-8")) {
                instance = Buffer.concat([instance], instance.length * 2);
            }
            bytesWritten += instance.write(value, bytesWritten);
        },
        toString: () => {
            return instance.toString("utf-8", 0, bytesWritten);
        },
        getSize: () => bytesWritten,
    };
}
function callGpt(chatParams, onUpdate) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = createResizableStringBuffer(1000);
        yield chat(chatParams, (chunk) => {
            buffer.write(chunk);
            if (onUpdate) {
                onUpdate(chunk, buffer);
            }
        });
        return buffer;
    });
}
exports.callGpt = callGpt;
