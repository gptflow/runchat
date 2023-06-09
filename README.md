<div align="center">
  <h1>RunChat</h1>
  <p>
RunChat lets you set up one or multiple LLM chats into an operation line to address problems of any complexity.
  </p>
</div>

## What is RunChat?

RunChat is like a conveyor belt for ChatGPT tasks. It's like having a production line where you can set up and run several tasks, big or small, one after another, or even all at once. With RunChat, you can take all these separate tasks, whether they're simple or complex, and piece them together into one smooth operation.

## Before we start: ChatGPT API KEY

RunChat uses the ChatGPT API, so in order to run the examples from this manual, you will need an API key. Here's what you need to do to create a key:

- Go to OpenAI's Platform website at platform.openai.com and sign in with an OpenAI account.
- Click your profile icon at the top-right corner of the page and select "View API Keys."
- Click "Create New Secret Key" to generate a new API key.

RunChat expects a key to be avaialable as an environment variable under the `OPENAI_API_KEY` name.

```bash
export OPENAI_API_KEY=A_KEY_VALUE_OBTAINED_FROM_THE_SITE
```

## Run you first chat

Alright, let's get started. To call ChatGPT using RunChat, you simply need to run a command:

```bash
npx runchat -m "Hey ChatGPT, how are you?"
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/how_are_you.gif">

Essentially, it's the same as going to the chat.openai.com website, writing a greeting, and getting a response, but it's all done through the console.

### Message variables

RunChat allows you to use variables in messages. Use the -v option in order to set a variable's value. For instance, you can introduce yourself and pass the name through a variable. Yes, this example might seem a bit meaningless, but it introduces us to an important concept.

```bash
npx runchat -m "Hey ChatGPT, my name is {{name}}. How are you?" -vname=Alex
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/my_name_is.gif">

You can choose not to specify a variable's value using -v, and then RunChat will ask for its value using an interactive prompt.
<img src="https://github.com/gptflow/runchat/blob/readme/assets/name_prompt.gif">

### Message resources

Variables allow you to parameterize part of a message, but they're not suitable for every case. What if you want to use not just a short value like a name, but instead want to use the contents of an entire file?
In that case, RunChat provides the concept of Resources. Resources allow you to refer to external data sources, such as files, without the need to store data in intermediate variables and pass them through the command line:

```bash
npx runchat -m "Could you please create a short summary on what this file is about {[fs:book_chapter.txt?mode=text]}".
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/read_chapter.gif">

In the example above, RunChat sees the block inside `{[` and `]}` and understands that this is a reference to a resource. `book_chapter.txt?mode=text` is the resource specifier, `fs` is the resource type. It then passes the specifier to the code that handles `fs` type resources, waits for a response, and inserts its content instead of the original structure.

A resource specifier is similar to an URL - it contains a path and can contain additional parameters. In this case, `book_chapter.txt` is the main path, and `mode=text` is a parameter indicating that you should include only the text of the file, without extra data like file path. We will delve deeper into the details in the sections about fs resolver and writing your own resolvers.

The possibilities with resource types are quite extensive. The idea behind resources is to create a way to interact with external data or services, and insert that data directly into the chat as required. For example, in addition to file system resources (like in the example above), you could also create a resource type for API calls to various web services, databases, IoT devices, and much more. For example you could create a "weather" type resource. This resource type could be configured to make an API request to a weather service (like Google Weather or OpenWeatherMap), and return the response in a format that's useful for your chat.

This functionality can be really powerful as it allows the chatbot to interact with real-time data and services, which can significantly increase the range of tasks it can perform and the accuracy of its responses.

```bash
npx runchat -m "Hey ChatGPT! The weather in London today is {[weather:London]}. What do you recommend I should wear?"
```

When this chat is run, the ChatGPT would receive a message like "Hey ChatGPT! The weather in London today is sunny and 24 degrees Celsius. What do you recommend I should wear?" and it would generate a response based on this. This way, you can include real-time data in your chats with the model. We'll go through an example of how you can create a resource and use it in your project in the advanced section below.

### Mixing resources and variables

What if you want to use a file resource, but at the same time, the path to the file has to be specified dynamically? In this case, you can use a variable inside the reference to the resource:

```bash
npx runchat -m "Could you please create a short summary on what this file is about {[fs:{{file}}?mode=text]}".
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/read_chapter_dynamic.gif">

### Chat config files

Passing messages using the `-m` option is convenient when you are experimenting with short requests. But often, ChatGPT prompts can be quite long and complex to enter into the console every time. For instance, here's a prompt asking ChatGPT to pretend to be a Linux:

```txt
I want you to act as a Linux terminal. I will type commands, and you will reply with what the terminal should show.
I want you to only reply, with the terminal output inside one unique code block, and nothing else. Do not write
explanations. Do not type commands unless I instruct you to do so. When I need to tell you something in English, I will
do so by putting text inside curly brackets {like this}. My first command is pwd.
```

In this case, you can save the message in a chat file and use the `-c` option to specify the path to the file. So let's create a configuration for the previous request in a file `be-a-linux.json`:

```json
{
  "title": "Be a linux",
  "args": {
    "command": "A linux command to run"
  },
  "messages": [
    {
      "role": "user",
      "content": [
        "I want you to act as a Linux terminal. I will type commands, and you will reply with what the terminal should show.",
        "I want you to only reply, with the terminal output inside one unique code block, and nothing else. Do not write",
        "explanations. Do not type commands unless I instruct you to do so. When I need to tell you something in English, I will",
        "do so by putting text inside curly brackets {like this}. "
      ]
    },
    {
      "role": "user",
      "content": "My first command is {{command}}"
    }
  ]
}
```

Pay attention to some details:

- We specified the chat `title` field. This title will be displayed during the execution of runchat;
- We used the `{{command}}` parameter so that a command could be set via a `-v` option or a interactive prompt;
- We added an `args` object with an explanation for what `{{command}}` is used for. This explanation will be shown in the interactive prompt when you run runchat.
- In the configuration file, you can break messages into parts for convenience, and we divided the message into 2 parts: the main prompt and the part with `{{command}}`.
- Each message must have a `role` field where you should specify who is the author of the message. So far, we are using `user`. This will become an important part later in the section on Zero shot learning.

```bash
npx runchat -c ./be-a-linux.json
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/be-a-linux.gif">

Sometimes it may be convenient to keep your main prompt in a file, but also have the ability to add a clarifying or additional message to it. In this case, you can use both -c and -m options.

```bash
npx runchat -c ./be-a-linux.json -m "Please also run `date` command"
```

In this case, the message passed in -m will be added to the messages from the config file passed in -c.

<img src="https://github.com/gptflow/runchat/blob/readme/assets/be-a-linux-2.gif">

### Extending chat config files

Sometimes it can be handy to describe a "base" interaction in a file to be able to reuse it later. Imagine you have many chats based on ChatGPT behaving like a Linux terminal. In this case, to avoid repeating this prompt every time, you can create a base file and inherit all others from it.
You can extend a chat file, by using an `extend` field of a config:

```json
{
  "title": "A Linux. Italian localization.",
  "extend": "./be-a-linux.json",
  "vars": {
    "command": "pwd"
  },
  "messages": [
    {
      "role": "user",
      "content": "Please use the Italian localization"
    }
  ]
}
```

```bash
npx runchat -c ./be-a-linux-it.json -m "Please also run `date` command"
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/be-a-linux-it.gif">

### Config file path resolution

It's important to note how the config file search takes place every time you specify a path to it using the `-c` option or by specifying it in the extend field.

The search works based on the same algorithm that is used in `require.resolve` when searching for modules in NodeJS, so if you are a NodeJS developer, everything is pretty straightforward. You can read about the algorithm in detail at <a href="https://nodejs.org/api/modules.html#all-together">this link</a>.

So when you run the cmd command:

```bash
npx runchat -c ./be-a-linux-it.json
```

The file resolution will go through the following steps:

- RunChat decides which directory it started at. For example its `/work`;
- require.resolve() is called with `./be-a-linux-it.json` request and a file `/work/be-a-linux-it.json` is found;
- Then `/work/be-a-linux-it.json` is read and a process repeated with a `./be-a-linux.json` file, because it is linked from the extend field of `/work/be-a-linux-it.json` file;

**Important note:** Remember that the first search starts from the directory where RunChat is launched, but if later a config `A` is loaded which refers to another config `B` through extend, then the file search will take place relative to the directory in which config `A` is located.

### Config file distribution

The fact that RunChat uses `require.resolve` algorythm means that you can easily create and publish your config files using the `npm` infrastructure and package repositories like <a href="https://npmjs.com">npmjs</a>.

Suppose you want anyone to now be able to use your `be-a-linux` config. Here's what you need to do for that:

- Read a little more about <a href="https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry">creating and publishing an npm package</a>.
- Create an npm package and put the be-a-linux.json file in it.
- Choose a name and publish the package on npm.

After the package is published by you, anyone can install and use it:

```bash
npm i --save be-a-linux
npx runchat -c be-a-linux/be-a-linux.json
```

We will discuss config diostribution more in the Advanced section, but for now, let's move on.

### ChatGPT params

The ChatGPT API allows you to control its behavior using a set of parameters. For example, the "model" parameter lets you choose from available models such as "gpt-3.5-turbo" or "gpt-4". The "temperature" parameter controls the randomness of the text generated by ChatGPT. To learn more about all available parameters, refer to the documentation on the OpenAI website.

To manage the API parameters of ChatGPT, use the "chatParams" property in your chat file. This allows you to fine-tune the behavior of ChatGPT to better suit your specific needs. Here is an example of how to include these parameters:

```json
{
  "title": "Hello world with params",
  "description": "This chat sends Hello to ChatGPT with customized chatParams",
  "chatParams": {
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
## Resource resolvers

### File system resolver

- how to query a file or a multiple files
- no files = bad
- result modes: default, text, filename
- baseDir

### Context resolver

- how to create and use context

## Tasks

Everything we've discussed so far has been about launching just one chat with ChatGPT, but what if we're tackling a problem that's too complex to solve with just one chat?
For example:

- Running multiple tasks
- Nesting
- Execution and result order
- Passing data between tasks: Context
- Passing data between tasks: Files
- Task tree mental model
- Var and resource resolution phases
- Var resolution model

## Advanced

- Create and distribute own chat config
- Creating and distribute own resolver
- Project file
- Use a resolver in the project
- Example project: TODO
