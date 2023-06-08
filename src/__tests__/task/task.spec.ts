import { Context } from "../../types";
import { createContext } from "../../context";
import {
  extendFromConfig,
  extendFromFileRequest,
  getConfigMessages,
  getTasks,
} from "../../task";

describe("Filter function", () => {
  let ctx: Context;
  beforeAll(async () => {
    ctx = await createContext({
      baseDir: __dirname,
    });
  });

  it("Should set a var from the same config", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        vars: {
          name: "Alex",
        },
        messages: [
          {
            role: "user",
            content: "Hey {{name}}",
          },
        ],
      },
      __dirname,
      {}
    );
    expect(config.messages![0].content).toEqual("Hey Alex");
  });

  it("Should set a var inside resource specifier", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        vars: {
          name: "{[@fs:{{res_path}}]}",
        },
        messages: [
          {
            role: "user",
            content: "Hey {{name}}",
          },
        ],
      },
      __dirname,
      {
        vars: {
          res_path: "/images/json",
        },
      }
    );
    expect(config.messages![0].content).toEqual("Hey {[@fs:/images/json]}");
  });

  it("Should fail if var is not resolved", async () => {
    try {
      await extendFromConfig(
        ctx,
        {
          messages: [
            {
              role: "user",
              content: "Hey {{name}}",
            },
          ],
        },
        __dirname,
        {}
      );
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it("Should set a var from parent context", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        messages: [
          {
            role: "user",
            content: "Hey {{name}}",
          },
        ],
      },
      __dirname,
      {
        vars: {
          name: "Alex",
        },
      }
    );
    expect(config.messages![0].content).toEqual("Hey Alex");
  });

  it("It should properly resolve placeholders when settings var", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        vars: {
          name: "{{first_name}} {{last_name}}",
        },
        messages: [
          {
            role: "user",
            content: "Hey {{name}}",
          },
        ],
      },
      __dirname,
      {
        vars: {
          first_name: "Alex",
          last_name: "Johnson",
        },
      }
    );
    expect(config.messages![0].content).toEqual("Hey Alex Johnson");
  });

  it("Should correctly extend from config file", async () => {
    const config = await extendFromFileRequest(
      ctx,
      "./chat__has-default.json",
      __dirname,
      {}
    );
    expect(config.messages![0].content).toEqual("Hey Alex");
  });

  it("Shouldn't override variable that is defined on the lower level", async () => {
    // Even if pass name from the outside it will not affect the result
    const config = await extendFromConfig(
      ctx,
      {
        extend: "./chat__no-default.json",
        vars: {
          name: "Bob",
        },
      },
      __dirname,
      {
        vars: {
          name: "John",
        },
      }
    );
    const messages = await getConfigMessages(ctx, config);
    expect(messages[0].content).toEqual("Hey Bob");
  });

  it("Should extend task and set var override with value that also is linked to a var", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        extend: "./chat__no-default.json",
        vars: {
          name: "{{exposed_name}}",
        },
      },
      __dirname,
      {
        vars: {
          exposed_name: "John",
        },
      }
    );
    const messages = await getConfigMessages(ctx, config);
    expect(messages![0].content).toEqual("Hey John");
  });

  it("Should set a var for a task in a group", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        tasks: [
          {
            vars: {
              name: "Alex",
            },
            messages: [
              {
                role: "user",
                content: "Hey {{name}}",
              },
            ],
          },
        ],
      },
      __dirname,
      {}
    );
    expect(config.tasks![0].messages![0].content).toEqual("Hey Alex");
  });

  it("Should fail when group item var is not set", async () => {
    try {
      await extendFromConfig(
        ctx,
        {
          tasks: [
            {
              messages: [
                {
                  role: "user",
                  content: "Hey {{name}}",
                },
              ],
            },
          ],
        },
        __dirname,
        {
          vars: {
            name: "John",
          },
        }
      );
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it("Should fill var placeholder for the group item from parent context", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        tasks: [
          {
            messages: [
              {
                role: "user",
                content: "Hey {{name}}",
              },
            ],
          },
        ],
      },
      __dirname,
      {
        vars: {
          name: "John",
        },
      }
    );
    expect(config.tasks![0].messages![0].content).toEqual("Hey John");
  });

  it("Should fill exposed var for the group item from parent context", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        tasks: [
          {
            vars: {
              name: "{{first_name}} {{last_name}}",
            },
            messages: [
              {
                role: "user",
                content: "Hey {{name}}",
              },
            ],
          },
        ],
      },
      __dirname,
      {
        vars: {
          first_name: "Bob",
          last_name: "Johnson",
        },
      }
    );
    expect(config.tasks![0].messages![0].content).toEqual("Hey Bob Johnson");
  });

  it("Should properly handle task items that extends from other tasks", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        tasks: [
          {
            extend: "./chat__has-default.json",
          },
          {
            extend: "./chat__no-default.json",
            vars: {
              name: "Susie",
            },
          },
        ],
      },
      __dirname,
      {}
    );
    const messages0 = await getConfigMessages(ctx, config.tasks![0]);
    const messages1 = await getConfigMessages(ctx, config.tasks![1]);
    expect(messages0[0].content).toEqual("Hey Alex");
    expect(messages1[0].content).toEqual("Hey Susie");
  });

  it("Should properly handle task items that extends from other tasks: set vars", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        tasks: [
          {
            extend: "./chat__no-default.json",
            vars: {
              name: "{{first_person}}",
            },
          },
          {
            extend: "./chat__no-default.json",
            vars: {
              name: "{{second_person}}",
            },
          },
        ],
      },
      __dirname,
      {
        vars: {
          first_person: "Jane",
          second_person: "Jack",
        },
      }
    );
    const messages0 = await getConfigMessages(ctx, config.tasks![0]);
    const messages1 = await getConfigMessages(ctx, config.tasks![1]);
    expect(messages0[0].content).toEqual("Hey Jane");
    expect(messages1[0].content).toEqual("Hey Jack");
  });

  it("Should properly handle nested task groups", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        tasks: [
          {
            extend: "./chat__has-default.json",
          },
          {
            extend: "./chat__no-default.json",
            vars: {
              name: "{{first_person}}",
            },
          },
          {
            tasks: [
              {
                extend: "./chat__has-default.json",
              },
              {
                vars: {
                  name: "{{second_person}}",
                },
                messages: [
                  {
                    role: "user",
                    content: "Hey {{name}}",
                  },
                ],
              },
            ],
          },
        ],
      },
      __dirname,
      {
        vars: {
          first_person: "Billy",
          second_person: "Mandy",
        },
      }
    );

    const messages1 = await getConfigMessages(ctx, config.tasks![1]);
    const messages2 = await getConfigMessages(ctx, config.tasks![2].tasks![1]);
    expect(messages1[0].content).toEqual("Hey Billy");
    expect(messages2[0].content).toEqual("Hey Mandy");
  });

  it("Should properly set task item vars from group vars", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        vars: {
          name1: "Garry",
          name2: "Meghan",
        },
        tasks: [
          {
            messages: [
              {
                role: "user",
                content: "Hey {{name1}}",
              },
            ],
          },
          {
            messages: [
              {
                role: "user",
                content: "Hey {{name2}}",
              },
            ],
          },
        ],
      },
      __dirname,
      {}
    );
    const messages0 = await getConfigMessages(ctx, config.tasks![0]);
    const messages1 = await getConfigMessages(ctx, config.tasks![1]);
    expect(messages0[0].content).toEqual("Hey Garry");
    expect(messages1[0].content).toEqual("Hey Meghan");
  });

  it("Should properly set extended task item vars from group vars", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        extend: "./group.json",
        vars: {
          name1: "Garry",
          name2: "Meghan",
        },
      },
      __dirname,
      {}
    );
    const tasks = getTasks(config);
    const messages0 = await getConfigMessages(ctx, tasks![0]);
    const messages1 = await getConfigMessages(ctx, tasks![1]);

    expect(messages0[0].content).toEqual("Hey Garry");
    expect(messages1[0].content).toEqual("Hey Meghan");
  });

  it("Should properly set nested task item vars from group vars", async () => {
    const config = await extendFromConfig(
      ctx,
      {
        vars: {
          name1: "Garry",
          name2: "Meghan",
        },
        tasks: [
          {
            extend: "./group.json",
          },
          {
            extend: "./group.json",
          },
        ],
      },
      __dirname,
      {}
    );

    const tasks = getTasks(config);
    const tasks0 = getTasks(tasks![0])![0];
    const messages0 = await getConfigMessages(ctx, tasks0);

    const tasks1 = getTasks(tasks![0])![1];
    const messages1 = await getConfigMessages(ctx, tasks1);

    expect(messages0[0].content).toEqual("Hey Garry");
    expect(messages1[0].content).toEqual("Hey Meghan");
  });
});
