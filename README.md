<div align="center">
  <h1>RunChat</h1>
  <p>
RunChat lets you set up one or multiple LLM chats into an operation line to address problems of any complexity.
  </p>
</div>

## What is RunChat?

RunChat is like a conveyor belt for ChatGPT tasks. It's like having a production line where you can set up and run several tasks, big or small, one after another, or even all at once. With RunChat, you can take all these separate tasks, whether they're simple or complex, and piece them together into one smooth operation.

### Before we start: ChatGPT API KEY

RunChat uses the ChatGPT API, so in order to run the examples from this manual, you will need an API key. Here's what you need to do to create a key:

- Go to OpenAI's Platform website at platform.openai.com and sign in with an OpenAI account.
- Click your profile icon at the top-right corner of the page and select "View API Keys."
- Click "Create New Secret Key" to generate a new API key.

RunChat expects a key to be avaialable as an environment variable under the `OPENAI_API_KEY` name.

```bash
export OPENAI_API_KEY=A_KEY_VALUE_OBTAINED_FROM_THE_SITE
```

### Run you first chat

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

In the example above, RunChat sees the block inside {[ and ]} and understands that this is a reference to a resource. "book_chapter.txt?mode=text" is the resource specifier, "fs" is the resource type. It then passes the specifier to the code that handles "fs" type resources, waits for a response, and inserts its content instead of the original structure.

A resource specifier is similar to an URL - it contains a path and can contain additional parameters. In this case, `book_chapter.txt` is the main path, and `mode=text` is a parameter indicating that you should include only the text of the file, without extra data like file path. We will delve deeper into the details in the sections about fs resolver and writing your own resolvers.

The possibilities with resource types are quite extensive. The idea behind resources is to create a way to interact with external data or services, and insert that data directly into the chat as required. For example, in addition to file system resources (like in the example above), you could also create a resource type for API calls to various web services, databases, IoT devices, and much more. For example you could create a "weather" type resource. This resource type could be configured to make an API request to a weather service (like Google Weather or OpenWeatherMap), and return the response in a format that's useful for your chat.

```bash
npx runchat -m "Hey ChatGPT! The weather in London today is {[weather:London]}. What do you recommend I should wear?"
```

This functionality can be really powerful as it allows the chatbot to interact with real-time data and services, which can significantly increase the range of tasks it can perform and the accuracy of its responses.

### Mixing resources and variables

What if I want to use a file resource, but at the same time, I want the path to the file to be specified dynamically? In this case, you can use a variable inside the reference to the resource:

```bash
npx runchat -m "Could you please create a short summary on what this file is about {[fs:{{file}}?mode=text]}".
```

<img src="https://github.com/gptflow/runchat/blob/readme/assets/read_chapter_dynamic.gif">
