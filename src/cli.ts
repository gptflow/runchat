import { Readable } from "stream";
import { MultiBar, Presets, SingleBar } from "cli-progress";
import { redBright, greenBright, gray, green } from "ansi-colors";
import { TaskConfig } from "./types";

type Status = "Pending" | "Running" | "Failed" | "Finished";

const TITLE_WIDTH = 50;
const STATUS_WIDTH = 10;
const TASK_ESTIMATION_MS = 160_000;

type TaskProgress = {
  config: TaskConfig;
  level: number;
  text: string;
  progress: number;
  status: Status;
};

type Progress = {
  show: () => void;
  hide: () => void;
};

const colors: Record<Status, (t: string) => string> = {
  Failed: redBright,
  Finished: green,
  Pending: gray,
  Running: greenBright,
};

export const spinnerFrames =
  process.platform === "win32"
    ? ["-", "\\", "|", "/"]
    : ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const statusIcon: Record<Status, (frame: number) => string> = {
  Finished: () => "✔",
  Failed: () => "✖",
  Pending: () => "⏸",
  Running: (frame) => {
    return spinnerFrames[frame % spinnerFrames.length];
  },
};

function formatTitle(
  title: string,
  status: Status,
  level: number,
  frame: number = 0
): string {
  const iconFn = statusIcon[status];
  const color = colors[status];
  const icon = color(iconFn(frame));
  const base = `${new Array(Math.max(0, level * 2)).join(" ")}${icon} ${title}`;
  if (base.length < TITLE_WIDTH) {
    return `${base}${new Array(TITLE_WIDTH - base.length).join(" ")}`;
  } else {
    return base.slice(0, TITLE_WIDTH - 1);
  }
}

function trimToLength(value: string, length: number): string {
  if (value.length > length) {
    return value.slice(0, length - 1);
  } else {
    return `${value}${new Array(length - value.length - 1).join(" ")}`;
  }
}

function createProgressState(rootConfig: TaskConfig): TaskProgress[] {
  const items: TaskProgress[] = [];
  function addNext(config: TaskConfig, level = 0) {
    const item: TaskProgress = {
      config,
      level,
      text: "",
      progress: 0,
      status: "Pending",
    };
    const stream = config.status
      ? Readable.from(config.status?.queue)
      : Readable.from("");
    let startedAt = 0;
    stream.on("data", (text: string) => {
      if (startedAt === 0) {
        startedAt = Date.now();
      }
      item.status = "Running";
      item.text = text;
      const coef = config.chatParams?.model === "gpt-4" ? 2 : 1;
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

export function createProgress(
  config: TaskConfig,
  interactive: boolean
): Progress {
  const progressItems = createProgressState(config);
  let multiBar: MultiBar;
  let bars: SingleBar[];
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

  function update(frame: number) {
    bars.forEach((it, at) => {
      const {
        text,
        status: statusRaw,
        progress,
        config,
        level,
      } = progressItems[at];
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
    multiBar = new MultiBar(
      {
        clearOnComplete: true,
        hideCursor: true,
        format: "{title} | {bar} | {text}",
        barsize: 20,
        fps: 30,
      },
      Presets.shades_grey
    );
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
