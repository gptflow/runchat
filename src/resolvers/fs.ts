import path from "path";
import { glob } from "glob";
import { URLSearchParams } from "url";
import { Context, ResourceResolverFactory, TaskConfig } from "../types";
import { promises } from "fs";
import { configToString } from "../task";

type BaseDir = "config" | "project";
type Mode = "default" | "text" | "filename";

const createFsResolver: ResourceResolverFactory = async (ctx: Context) => {
  return async (query: string, config: TaskConfig) => {
    const [globQuery, search] = query.split("?");
    const searchParams = new URLSearchParams(search ? search : "");

    // default = text with a wrapper
    // text = text with no wrapper
    // name-only = put the file name instead of file content
    const mode: Mode = (searchParams.get("mode") as Mode) || "default";
    // put a path from usePath instead of real file path
    const usePath = searchParams.get("usePath");
    //
    const baseDirType: BaseDir =
      (searchParams.get("baseDir") as BaseDir) || "project";

    const baseDir = baseDirType === "config" ? config.baseDir : ctx.baseDir;

    if (!baseDir) {
      throw new Error(
        `Base dir is empty or undefined:\n ${configToString(config)}`
      );
    }

    const files = await glob(globQuery, {
      cwd: baseDir,
      absolute: false,
      nodir: true,
    });

    if (files.length !== 1 && usePath) {
      throw new Error(
        `Got ${files.length} files for usePath. Should be a single file`
      );
    }

    const contents: Record<string, string> = {};
    for (const it of files) {
      const filePath = path.join(baseDir, it);
      let content: string = "";
      // Remove a file
      if (mode === "filename") {
        content = it;
      } else {
        content = await promises.readFile(filePath, "utf-8");
      }
      // Wrap into a parsable block by default
      const itemPath = usePath || it;
      contents[itemPath] =
        mode === "default"
          ? `#>>${itemPath}>>#${content}#<<${itemPath}<<#`
          : content;
    }
    return Object.values(contents).join("\n");
  };
};

export default createFsResolver;
