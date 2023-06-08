import { URLSearchParams } from "url";
import { Context, ResourceResolverFactory } from "../types";
import { minimatch } from "minimatch";

type Mode = "default" | "text" | "name-only";

const createCtxResolver: ResourceResolverFactory = async (ctx: Context) => {
  return async (query: string) => {
    const [globQuery, search] = query.split("?");
    const searchParams = new URLSearchParams(search ? search : "");

    // default = text with a wrapper
    // text = text with no wrapper
    // name-only = put the file name instead of file content
    const mode: Mode = (searchParams.get("mode") as Mode) || "default";
    // put a path from usePath instead of real file path
    const usePath = searchParams.get("usePath");
    // Do not fall with an error in case if nothing found
    const emptyIsOk = searchParams.has("emptyIsOk");

    const varNames = Object.keys(ctx.data).filter((it) =>
      minimatch(it, globQuery)
    );

    if (varNames.length === 0 && !emptyIsOk) {
      throw new Error(
        `No variables found for ${globQuery}. Use emptyIsOk flag to not fail if no files found.`
      );
    }

    if (varNames.length !== 1 && usePath) {
      throw new Error(
        `Got ${varNames.length} files for usePath. Should be a single file`
      );
    }

    const contents: Record<string, string> = {};
    for (const it of varNames) {
      let content: string = ctx.data[it];
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
  };
};

export default createCtxResolver;
