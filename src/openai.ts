import { ResponseBuffer } from "./types";
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const api = new OpenAIApi(configuration);

const DEFAULTS = {
  model: "gpt-3.5-turbo",
  temperature: 0,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export async function chat(
  args: Partial<CreateChatCompletionRequest>,
  onTokens: (tokens: string) => void
) {
  const request = {
    ...DEFAULTS,
    messages: [],
    stream: true,
    ...args,
  };
  const response = await api.createChatCompletion(request, {
    responseType: "stream",
  });

  // @ts-ignore
  for await (const chunk of response.data) {
    const lines = chunk
      .toString("utf8")
      .split("\n")
      .filter((line: string) => line.trim().startsWith("data: "));

    for (const line of lines) {
      const message = line.replace(/^data: /, "");
      if (message === "[DONE]") {
        return;
      }

      let json;
      try {
        json = JSON.parse(message);
      } catch (err) {
        throw new Error(
          `Failed to parse ChatGPT API response chunk: ${err}\nChunk was: ${message}`
        );
      }
      const token = json.choices[0].delta.content;
      if (token) {
        onTokens(token);
      }
    }
  }
}

// Buffer for gpt output
function createResizableStringBuffer(size: number): ResponseBuffer {
  let instance = Buffer.alloc(size, 0, "utf-8");
  let bytesWritten = 0;
  return {
    write: (value: string) => {
      // Out of size? reallocate buffer
      if (instance.length <= bytesWritten + Buffer.byteLength(value, "utf-8")) {
        instance = Buffer.concat([instance], instance.length * 2);
      }
      bytesWritten += instance.write(value, bytesWritten);
    },
    toString: (): string => {
      return instance.toString("utf-8", 0, bytesWritten);
    },
    getSize: () => bytesWritten,
  };
}

export async function callGpt(
  chatParams: Partial<CreateChatCompletionRequest>,
  onUpdate?: (chunk: string, buf: ResponseBuffer) => void
): Promise<ResponseBuffer> {
  const buffer = createResizableStringBuffer(1000);
  await chat(chatParams, (chunk: string) => {
    buffer.write(chunk);
    if (onUpdate) {
      onUpdate(chunk, buffer);
    }
  });
  return buffer;
}
