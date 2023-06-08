import fs, { existsSync, mkdirSync, promises } from "fs";
import path, { dirname, extname, isAbsolute, join } from "path";

export function resolveFile(dirs: string[], filePath: string): string | null {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  for (let dir of dirs) {
    const dirPath = path.join(dir, filePath);
    if (fs.existsSync(dirPath)) {
      return dirPath;
    }
  }
  return null;
}

export async function rmFile(filePath: string, baseDir: string) {
  return promises.rm(isAbsolute(filePath) ? filePath : join(baseDir, filePath));
}

export async function saveFile(
  filePath: string,
  baseDir: string,
  content: string
) {
  const outputPath = isAbsolute(filePath) ? filePath : join(baseDir, filePath);
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  await promises.writeFile(outputPath, content);
}

// Read and parse json/yml file
export async function parseFile<T>(filePath: string): Promise<T> {
  const ext = extname(filePath);
  const fileContent = await promises.readFile(filePath, "utf-8");
  let result;
  if (ext === ".json") {
    result = JSON.parse(fileContent);
  }
  return result as T;
}

export const clearTerminal = function () {
  process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
  console.clear();
};

export function generateFunnyDescriptiveName(): string {
  const animalNames: string[] = [
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

  const adjectives: string[] = [
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

  const randomAnimalName =
    animalNames[Math.floor(Math.random() * animalNames.length)];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];

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
  const formattedTime =
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0");

  return `Log_${formattedDate}_${formattedTime}__${randomAdjective}-${randomAnimalName}`;
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sanitize(input: string): string {
  // Replace newline characters (\r\n, \n\r, \n and \r) with a space
  let result = input.replace(/(\r\n|\n\r|\n|\r)/gm, " ");
  // Replace any other characters not supported by JSON (e.g., unescaped quotes)
  return result.replace(/[^ -~\b\t\n\f\r"\\]/g, "");
}
