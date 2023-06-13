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
exports.sanitize = exports.delay = exports.generateFunnyDescriptiveName = exports.clearTerminal = exports.parseFile = exports.saveFile = exports.rmFile = exports.resolveFile = void 0;
const fs_1 = __importStar(require("fs"));
const path_1 = __importStar(require("path"));
function resolveFile(dirs, filePath) {
    if (path_1.default.isAbsolute(filePath)) {
        return filePath;
    }
    for (let dir of dirs) {
        const dirPath = path_1.default.join(dir, filePath);
        if (fs_1.default.existsSync(dirPath)) {
            return dirPath;
        }
    }
    return null;
}
exports.resolveFile = resolveFile;
function rmFile(filePath, baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        return fs_1.promises.rm((0, path_1.isAbsolute)(filePath) ? filePath : (0, path_1.join)(baseDir, filePath));
    });
}
exports.rmFile = rmFile;
function saveFile(filePath, baseDir, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputPath = (0, path_1.isAbsolute)(filePath) ? filePath : (0, path_1.join)(baseDir, filePath);
        const outputDir = (0, path_1.dirname)(outputPath);
        if (!(0, fs_1.existsSync)(outputDir)) {
            (0, fs_1.mkdirSync)(outputDir, { recursive: true });
        }
        yield fs_1.promises.writeFile(outputPath, content);
    });
}
exports.saveFile = saveFile;
// Read and parse json/yml file
function parseFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const ext = (0, path_1.extname)(filePath);
        const fileContent = yield fs_1.promises.readFile(filePath, "utf-8");
        let result;
        if (ext === ".json") {
            result = JSON.parse(fileContent);
        }
        return result;
    });
}
exports.parseFile = parseFile;
const clearTerminal = function () {
    process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
    console.clear();
};
exports.clearTerminal = clearTerminal;
function generateFunnyDescriptiveName() {
    const animalNames = [
        "rabbit",
        "giraffe",
        "lion",
        "tiger",
        "koala",
        "bear",
        "elephant",
        "kangaroo",
        "penguin",
        "zebra",
        "hippo",
        "rhino",
        "monkey",
        "leopard",
        "platypus",
    ];
    const adjectives = [
        "mighty",
        "graceful",
        "whimsical",
        "curious",
        "energetic",
        "lazy",
        "fierce",
        "gentle",
        "adorable",
        "sly",
    ];
    const randomAnimalName = animalNames[Math.floor(Math.random() * animalNames.length)];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const date = new Date();
    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const formattedDate = monthNames[date.getMonth()] + date.getDate().toString();
    const formattedTime = date.getHours().toString().padStart(2, "0") +
        "_" +
        date.getMinutes().toString().padStart(2, "0");
    return `Log_${formattedDate}_${formattedTime}__${randomAdjective}-${randomAnimalName}`;
}
exports.generateFunnyDescriptiveName = generateFunnyDescriptiveName;
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.delay = delay;
function sanitize(input) {
    // Replace newline characters (\r\n, \n\r, \n and \r) with a space
    let result = input.replace(/(\r\n|\n\r|\n|\r)/gm, " ");
    // Replace any other characters not supported by JSON (e.g., unescaped quotes)
    return result.replace(/[^ -~\b\t\n\f\r"\\]/g, "");
}
exports.sanitize = sanitize;
