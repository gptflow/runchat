"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgress = exports.spinnerFrames = void 0;
const stream_1 = require("stream");
const cli_progress_1 = require("cli-progress");
const ansi_colors_1 = require("ansi-colors");
const TITLE_WIDTH = 50;
const STATUS_WIDTH = 10;
const TASK_ESTIMATION_MS = 160000;
const colors = {
    Failed: ansi_colors_1.redBright,
    Finished: ansi_colors_1.green,
    Pending: ansi_colors_1.gray,
    Running: ansi_colors_1.greenBright,
};
exports.spinnerFrames = process.platform === "win32"
    ? ["-", "\\", "|", "/"]
    : ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const statusIcon = {
    Finished: () => "✔",
    Failed: () => "✖",
    Pending: () => "⏸",
    Running: (frame) => {
        return exports.spinnerFrames[frame % exports.spinnerFrames.length];
    },
};
function formatTitle(title, status, level, frame = 0) {
    const iconFn = statusIcon[status];
    const color = colors[status];
    const icon = color(iconFn(frame));
    const base = `${new Array(Math.max(0, level * 2)).join(" ")}${icon} ${title}`;
    if (base.length < TITLE_WIDTH) {
        return `${base}${new Array(TITLE_WIDTH - base.length).join(" ")}`;
    }
    else {
        return base.slice(0, TITLE_WIDTH - 1);
    }
}
function trimToLength(value, length) {
    if (value.length > length) {
        return value.slice(0, length - 1);
    }
    else {
        return `${value}${new Array(length - value.length - 1).join(" ")}`;
    }
}
function createProgressState(rootConfig) {
    const items = [];
    function addNext(config, level = 0) {
        var _a;
        const item = {
            config,
            level,
            text: "",
            progress: 0,
            status: "Pending",
        };
        const stream = config.status
            ? stream_1.Readable.from((_a = config.status) === null || _a === void 0 ? void 0 : _a.queue)
            : stream_1.Readable.from("");
        let startedAt = 0;
        stream.on("data", (text) => {
            var _a;
            if (startedAt === 0) {
                startedAt = Date.now();
            }
            item.status = "Running";
            item.text = text;
            const coef = ((_a = config.chatParams) === null || _a === void 0 ? void 0 : _a.model) === "gpt-4" ? 2 : 1;
            item.progress = (Date.now() - startedAt) / (TASK_ESTIMATION_MS * coef);
        });
        stream.on("error", (error) => {
            item.status = "Failed";
            item.text = error.message;
            item.progress = 0;
        });
        stream.on("end", () => {
            item.status = "Finished";
            item.text = "Done";
            item.progress = 1;
        });
        items.push(item);
        if (config.tasks) {
            config.tasks.forEach((t) => addNext(t, level + 1));
        }
    }
    addNext(rootConfig);
    return items;
}
function createProgress(config, interactive) {
    const progressItems = createProgressState(config);
    let multiBar;
    let bars;
    let running = false;
    let frame = 0;
    function getNextUpdate() {
        return running ? 50 : 1000;
    }
    function nextUpdate() {
        if (running) {
            update(frame++);
        }
        setTimeout(nextUpdate, getNextUpdate());
    }
    nextUpdate();
    function update(frame) {
        bars.forEach((it, at) => {
            const { text, status: statusRaw, progress, config, level, } = progressItems[at];
            const color = colors[statusRaw];
            const status = color(trimToLength(statusRaw, STATUS_WIDTH));
            const title = formatTitle(config.title || "", statusRaw, level, frame);
            it.update(progress, {
                title,
                status,
                text,
            });
        });
    }
    function show() {
        if (!interactive) {
            return;
        }
        // Main
        multiBar = new cli_progress_1.MultiBar({
            clearOnComplete: true,
            hideCursor: true,
            format: "{title} | {bar} | {text}",
            barsize: 20,
            fps: 30,
        }, cli_progress_1.Presets.shades_grey);
        // Bars
        bars = progressItems.map(({ config, level, status, text }) => {
            return multiBar.create(1, 0, {
                title: formatTitle(config.title || "", status, level),
                status: trimToLength(status, STATUS_WIDTH),
                text,
            });
        });
        running = true;
    }
    function hide() {
        if (!interactive) {
            return;
        }
        running = false;
        multiBar.stop();
    }
    return {
        show,
        hide,
    };
}
exports.createProgress = createProgress;
