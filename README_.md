## What is runchat?

**runchat** is like a conveyor belt for ChatGPT tasks. It's like having a production line where you can set up and run several tasks, big or small, one after another, or even all at once. With **runchat**, you can take all these separate tasks, whether they're simple or complex, and piece them together into one smooth operation.

### Run you first chat

Alright, let's start. To run runchat, you need a chat file. A chat file is a regular json file containing messages and some other settings. Let's start with a simple example:

```json
{
  "title": "Say hello",
  "description": "This chat sends Hello to a ChatGPT",
  "messages": [
    {
      "role": "user",
      "content": "Hey ChatGPT!"
    }
  ]
}
```

Let's save this file as hello-chatgpt.chat.json and run it with the command:

```bash
npx run runchat hello-chatgpt.chat.json
```

After that, the loading of the response from ChatGPT will appear on the screen, and once it's done, the response will be displayed. Essentially, it's the same as going to the chat.openai.com website, writing a greeting, and getting a response, but it's all done through the console.

Let's take a moment to discuss the parameters we used in hello-chatgpt.chat.json.

**title** - is the title of the chat, it will be displayed on the screen when you start the chat.
**description** - is a short description of the purpose of this chat.
**messages** - is a list of messages to send to ChatGPT.

You might have noticed that in addition to the **content** field in the message, there's also a **role**. This is the format in which ChatGPT accepts messages in its API. The role can be one of three types: user, assistant, or system. You can read more about this in the ChatGPT API description. In short, roles help to simulate the initial dialogue and assist ChatGPT in better solving the task you've set in the future. The **user** role represents you and the **assistant** role is ChatGPT. When you send a message from the **assistant** role, you are essentially giving ChatGPT a hint as to how it should respond in future conversations.

By the way, take note that if the "content" is multiline , you can break it into parts and use an array instead of a string.

```json
{
  "title": "Say hello",
  "description": "This chat sends Hello to a ChatGPT",
  "messages": [
    {
      "role": "user",
      "content": ["Hey ChatGPT!", "You are amazing"]
    }
  ]
}
```

### Chat variables

There may be situations when you need to parameterize part of a message. For example, you have a chat in which you ask ChatGPT to summarize a book in a few sentences. So you don't have to edit the file content each time, you can place the book's title in a variable called "book_name"

```json
{
  "title": "Whats this book about",
  "description": "This chat creates a short book description",
  "messages": [
    {
      "role": "user",
      "content": [
        "Hey ChatGPT! Could you please explain what the \"{{book_name}}\" book is about? ",
        "Could you also mention book author and publishing date.",
        "Thank you!"
      ]
    }
  ]
}
```

And then pass the parameter when starting the chat:

```bash
npx run runchat describe-book.chat.json -vbook_name=1984
```

Now, if you run this command, runchat will substitute the value of "book_name" and you'll get a short description of "1984" from ChatGPT.

TODO: Image

Before sending the chat, all variables in the text must be replaced with their values. If it happens that some of the variables have not been set, the command will fail.

TODO: Image

You can use the --dry-run parameter or simply -d to see the text of the messages without sending them to ChatGPT.

TODO: Image

We will return to the topic of variables in more detail in the sections on Tasks.

### Extending chat files

Sometimes it can be handy to describe a "base" interaction in a file to be able to reuse it later. You've probably often seen people sharing usefull ChatGPT prompts so others could try them. For instance, I recently found a prompt that asks ChatGPT to behave like a Linux terminal:

```
I want you to act as a Linux terminal. I will type commands, and you will reply with what the terminal should
show. I want you to only reply with the terminal output inside one unique code block, and nothing else. Do not
write explanations. Do not type commands unless I instruct you to do so. When I need to tell you something in
English, I will do so by putting text inside curly brackets {like this}. My first command is pwd.
```

Now, imagine you have many chats based on ChatGPT behaving like a Linux terminal. In this case, to avoid repeating this prompt every time, you can create a base file and inherit all others from it:

```json
{
  "title": "Linux terminal",
  "description": "This chat sets up ChatGPT to act as a Linux terminal",
  "messages": [
    {
      "role": "user",
      "content": ["I want you to act as a Linux terminal. I will type commands, ",
      "and you will reply with what the terminal should show. I want you to only reply",
      "with the terminal output inside one unique code block, and nothing else. Do not",
      "write explanations. Do not type commands unless I instruct you to do so. When I ",
      "need to tell you something in English, I will do so by putting text inside curly ",
      "brackets {like this}. My first command is pwd."
    }
  ]
}
```

Inheritance can have many levels. For example, you could create a file called gpt-as-a-linux.chat.json that instructs ChatGPT to act like Linux, inherit from it with a file called use-chinese-localization.chat.json to localize the "Linux" behavior to Chinese, and finally create ok-good-luck-with-that.chat.json to interact with Linux in Chinese.

TODO: example

The rules of inheritance are very straightforward. Each descendant overwrites the properties of the file from which it is inherited, with the exception of the "vars" and "messages" properties.

The "vars" values of a descendant in inheritance are copied over the "vars" values of the parent. This means that if there was a variable called "linux_name" in gpt-as-a-linux.chat.json, the "linux_name" from use-chinese-localization.chat.json would overwrite it. But if there was a variable called "command_shell" in gpt-as-a-linux.chat.json that is not in the descendant file use-chinese-localization.chat.json, then "command_shell" will remain in the final "vars" object.

TODO: example code

The "messages" values of the descendant are added to the "messages" of the parent. This means that if you declare "messages" in gpt-as-a-linux.chat.json and there is one item with the text: "Please use Chinese localization", then the final chat will contain two messages: the first one from gpt-as-a-linux.chat.json and the second from use-chinese-localization.chat.json.

TODO: example code

This mechanism allows for a flexible and modular approach to constructing complex interactions, where common dialogue segments can be defined once and reused across different scenarios.

### ChatGPT params

The ChatGPT API allows you to control its behavior using a set of parameters. For example, the "model" parameter lets you choose from available models such as "gpt-3.5-turbo" or "gpt-4". The "temperature" parameter controls the randomness of the text generated by ChatGPT. To learn more about all available parameters, refer to the documentation on the OpenAI website.

To manage the API parameters of ChatGPT, use the "gptParams" property in your chat file. This allows you to fine-tune the behavior of ChatGPT to better suit your specific needs. Here is an example of how to include these parameters:

```json
{
  "title": "Hello world with params",
  "description": "This chat sends Hello to ChatGPT with customized gptParams",
  "gptParams": {
    "temperature": 0.5,
    "model": "gpt-4"
  },
  "messages": [
    {
      "role": "user",
      "content": "Hello ChatGPT!"
    }
  ]
}
```

### Resources

In the section about "vars", we showed how you can parameterize part of a message and then pass that parameter value via the "vars" property of the chat or the command line argument -vname=value.

```json
{
  "title": "Whats this book about",
  "description": "This chat creates a short book description",
  "messages": [
    {
      "role": "user",
      "content": [
        "Hey ChatGPT! Could you please explain what the \"{{book_name}}\" book is about? ",
        "Could you also mention the book's author and publishing date.",
        "Thank you!"
      ]
    }
  ]
}
```

But "vars" aren't always convenient. What if you want to use the content of an entire file as a value? Let's imagine that instead of the book's title in the example above, we want to send the content of a book chapter:

```json
{
  "title": "Whats this chapter about",
  "description": "This chat creates a short chapter description",
  "messages": [
    {
      "role": "user",
      "content": [
        "Hey ChatGPT! Could you please read a chapter from a book for me and tell what it's about? Here is the chapter text: {{text}}"
      ]
    }
  ]
}
```

In this case, we would have to put the chapter's content in a file, read the file's content into a variable, and pass its value as input to runchat:

```bash
VAR=`cat chapter.txt`
npx run runchat describe-book.chat.json -vtext=$VAR
```

Instead, runchat provides the concept of Resources. Resources allow you to refer to external data sources, such as files, without the need to store data in intermediate variables and pass them through the command line:

```json
{
  "title": "Whats this chapter about",
  "description": "This chat creates a short chapter description",
  "messages": [
    {
      "role": "user",
      "content": [
        "Hey ChatGPT! Could you please read a chapter from a book for me and tell what it's about? Here is the chapter text: {[@files.fs:path/to/chapter.txt]}"
      ]
    }
  ]
}
```

In the example above, runchat sees the block inside {[@ and ]} and understands that this is a reference to a resource. "files" is the resource id, "fs" is its type, and "path/to/chapter.txt" is the resource query. It then passes the "path/to/chapter.txt" query to the code that handles "fs" type resources, waits for a response, and inserts its content instead of the original structure.

If you run this chat with the logs-dir function, you'll be able to see that the content of the file was sent instead of the resource link:

```json
runchat describe-book.chat.json --logs-dir=logs
```

TODO: logs image
TODO: add logs section to chat

The possibilities with resource types are quite extensive. The idea behind resources is to create a way to interact with external data or services, and insert that data directly into the chat as required. For example, in addition to file system resources (like in the example above), you could also create a resource type for API calls to various web services, databases, IoT devices, and much more. For example you could create a "weather" type resource. This resource type could be configured to make an API request to a weather service (like Google Weather or OpenWeatherMap), and return the response in a format that's useful for your chat. This functionality can be really powerful as it allows the chatbot to interact with real-time data and services, which can significantly increase the range of tasks it can perform and the accuracy of its responses.

```json
{
  "title": "Weather Check",
  "description": "Ask ChatGPT for a weather-based clothing recommendation.",
  "messages": [
    {
      "role": "user",
      "content": [
        "Hey ChatGPT! The weather in London today is {[@forecast.weather:London]}. What do you recommend I should wear?"
      ]
    }
  ]
}
```

When this chat is run, the ChatGPT would receive a message like "Hey ChatGPT! The weather in London today is sunny and 24 degrees Celsius. What do you recommend I should wear?" and it would generate a response based on this. This way, you can include real-time data in your chats with the model. In the "Resource Type Implementation" section, we'll go through an example of how you can create a resource and use it in your project.

### Tasks

Everything we've discussed so far has been about launching just one chat with ChatGPT, but what if we're tackling a problem that's too complex to solve with just one chat? Let's return to the example where ChatGPT was writing a summary of a book chapter, but now we want it to write summaries of ALL the book chapters, and to process all the chapters concurrently. Tasks could help solve such a problem.

For this, there's a "tasks" property in the configuration file where you can specify several elements with "messages" properties:

```json
{
  "title": "What this books is about?",
  "concurrent": true,
  "tasks": [
    {
      "title": "What chapter 1 is about",
      "description": "This chat creates a short chapter description",
      "messages": [
        {
          "role": "user",
          "content": [
            "Hey ChatGPT! Could you please read a chapter from a book for me and tell what",
            "it's about? Here is the chapter text: {[@files.fs:book/chapter_1_text.txt]}"
          ]
        }
      ]
    },
    {
      "title": "What chapter 2 is about",
      "description": "This chat creates a short chapter description",
      "messages": [
        {
          "role": "user",
          "content": [
            "Hey ChatGPT! Could you please read a chapter from a book for me and tell what",
            "it's about? Here is the chapter text: {[@files.fs:book/chapter_2_text.txt]}"
          ]
        }
      ]
    },
    {
      "title": "What chapter 3 is about",
      "description": "This chat creates a short chapter description",
      "messages": [
        {
          "role": "user",
          "content": [
            "Hey ChatGPT! Could you please read a chapter from a book for me and tell what",
            "it's about? Here is the chapter text: {[@files.fs:book/chapter_3_text.txt]}"
          ]
        }
      ]
    }
  ]
}
```

This example is a bit contrived, but it illustrates the concept of tasks well. Pay attention to the "concurrent" property; it's set to true, meaning runchat understands that all tasks can be launched concurrently. If you run this example, you'll see that all three tasks are processed concurrently.

TODO: execution example

Tasks can be run concurrently if their execution doesn't depend on each other, as is the case here. If you need the next task to take the results of the previous task as input, the "concurrent" property should be false, or you can simply not specify it, as the default value for "concurrent" is false.

### Virtual file system

The task virtual file system plays a key role in this approach. Imagine that each initiated chat isn't just a set of messages between you and ChatGPT, but a full-fledged program that you've launched in your terminal. The program can read files from the file system and write them back, so that other programs can utilize the results of its work.

To better understand how this works, let's consider a practical example. Imagine you're a web developer, and your project includes a file with React component code. The issue is that this code doesn't contain any comments explaining its operation, so you want ChatGPT to do it for you.

Let's start by creating a basic configuration:

```json
{
  "title": "Comments code",
  "messages": [
    {
      "role": "user",
      "content": "Hey! Could you please take a look at a file {[@files.fs:path/to/Component.tsx]} and add meaningful comments?"
    }
  ]
}
```

Let's dissect what's happening here. As I mentioned before, think of our chat as a program running in a virtual file system. In this case, it's attempting to find the file at path/to/Component.tsx and read it. Here are the first two principles of vfs operation that will help you understand what will happen next:

File search algorithm in vfs:

find files on the real fs,
find files on the virtual fs,
merge the results.
Reading algorithm from vfs:

try to read the file from vfs,
if the file doesn't exist in vfs - fallback to the real fs.
