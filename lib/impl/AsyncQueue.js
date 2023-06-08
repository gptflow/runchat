"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncQueue = void 0;
class AsyncQueue {
    constructor() {
        this.storage = [];
        this.waitingResolvers = [];
    }
    // Push method
    push(item) {
        if (this.waitingResolvers.length > 0) {
            const resolver = this.waitingResolvers.shift();
            resolver === null || resolver === void 0 ? void 0 : resolver(item);
        }
        else {
            this.storage.push(item);
        }
    }
    // Async iterable interface
    [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
            while (true) {
                let item;
                if (this.storage.length > 0) {
                    item = this.storage.shift();
                }
                else {
                    item = yield __await(new Promise((resolve) => {
                        this.waitingResolvers.push(resolve);
                    }));
                }
                // If item error is not null, throw the error
                if (item === null || item === void 0 ? void 0 : item.error) {
                    throw item.error;
                }
                // If item value is null, finish the iteration
                if ((item === null || item === void 0 ? void 0 : item.value) === null) {
                    return yield __await(void 0);
                }
                // Yield the value
                yield yield __await(item.value);
            }
        });
    }
}
exports.AsyncQueue = AsyncQueue;
