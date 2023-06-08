import prompts from "prompts";
import { TaskArgs, TaskVars } from "./types";

export async function promptArgs(args: TaskArgs): Promise<TaskVars> {
  const result: TaskVars = {};
  for (const [argName, argDsc] of Object.entries(args || {})) {
    const { value } = await prompts({
      type: "text",
      name: "value",
      message: argDsc,
    });
    result[argName] = value;
  }
  return result;
}
