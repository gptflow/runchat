<div align="center">
  <h1>⚡ RunChat</h1>
  <p>
RunChat lets you set up one or multiple LLM chats into an operation line to address problems of any complexity.
  </p>
</div>

## What is RunChat?

RunChat is like a conveyor belt for ChatGPT tasks. It's like having a production line where you can set up and run several tasks, big or small, one after another, or even all at once. With RunChat, you can take all these separate tasks, whether they're simple or complex, and piece them together into one smooth operation.

## ChatGPT API KEY

RunChat uses the ChatGPT API, so in order to run the examples from this manual, you will need an API key. Here's what you need to do to create a key:

- Go to OpenAI's Platform website at platform.openai.com and sign in with an OpenAI account.
- Click your profile icon at the top-right corner of the page and select "View API Keys."
- Click "Create New Secret Key" to generate a new API key.

RunChat expects a key to be avaialable as an environment variable under the `OPENAI_API_KEY` name.

```bash
export OPENAI_API_KEY=A_KEY_VALUE_OBTAINED_FROM_THE_SITE
```

## NodeJS is required

In order to use RunChat, you need to have NodeJS installed. We recommend installing the <a href="https://nodejs.org/en">LTS version</a>. After that, in most cases, you won't need to install any additional packages, as RunChat operates using `npx`.

## Quick profit

Before you read everything else, I believe that any good tool should be beneficial from the first minutes. So here's a quick recipe that will save you some time in your daily work. If you need to modify a file: write a function's code, add comments, or translate them into another language, simply run the command and drop a quick spec on desired changes:

```bash
npx runchat -c runchat/recipes/modify-files
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/modify-files.gif">

## Run you first chat

Alright, let's get started. To call ChatGPT using RunChat, you simply need to run a command:

```bash
npx runchat -m "Hey ChatGPT, how are you?"
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/how_are_you.gif">

Essentially, it's the same as going to the chat.openai.com website, writing a greeting, and getting a response, but it's all done through the console.

### Message variables

RunChat allows you to use variables in messages. Use the -v option in order to set a variable's value. For instance, you can introduce yourself and pass the name through a variable. Yes, this example might seem a bit meaningless, but it introduces us to an important concept.

```bash
npx runchat -m "Hey ChatGPT, my name is {{name}}. How are you?" -vname=Alex
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/my_name_is.gif">

You can choose not to specify a variable's value using -v, and then RunChat will ask for its value using an interactive prompt.
<img src="https://github.com/gptflow/runchat/blob/main/assets/name_prompt.gif">

### Message resources

Variables allow you to parameterize part of a message, but they're not suitable for every case. What if you want to use not just a short value like a name, but instead want to use the contents of an entire file?
In that case, RunChat provides the concept of Resources. Resources allow you to refer to external data sources, such as files, without the need to store data in intermediate variables and pass them through the command line:

```bash
npx runchat -m "Could you please create a short summary on what this file is about {[fs:book_chapter.txt?mode=text]}".
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/read_chapter.gif">

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
npx runchat -m "Could you please create a short summary on what this file is about {[fs:{{file}}?mode=text]}"
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/read_chapter_dynamic.gif">

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
- Each message must have a `role` field where you should specify who is the author of the message. So far, we are using `user`. This will become an important part later in the section on `one/few shot prompting` methods.

```bash
npx runchat -c ./be-a-linux.json
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/be-a-linux.gif">

Sometimes it may be convenient to keep your main prompt in a file, but also have the ability to add a clarifying or additional message to it. In this case, you can use both -c and -m options.

```bash
npx runchat -c ./be-a-linux.json -m "Please also run `date` command"
```

In this case, the message passed in -m will be added to the messages from the config file passed in -c.

<img src="https://github.com/gptflow/runchat/blob/main/assets/be-a-linux-2.gif">

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

Note that by extending the `be-a-linux.json` file, we added the message "Please use the Italian localization". This works the same as when using the `-m` and `-c` options together - messages from the inheriting file will be added to the messages from the file that it inherited.

```bash
npx runchat -c ./be-a-linux-it.json -m "Please also run `date` command"
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/be-a-linux-it.gif">

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

Before we move on to the main topic of this manual - **Tasks**, we need to delve a little more into **Resource resolvers**. We started discussing this topic at the beginning of the manual [beginning of the manual](#message-resources), but now it's time to learn more about the `File resolver` and `Context resolver` because they are very important for explaining how Tasks work.

### File system resolver

As we have already mentioned, resources are a way to interact with external data or services.
The file system resolver allows interaction with the file system:

- searching for files and their names
- creating and updating files

To use the file resolver, you need to add a `{[fs:query?parameters]}` structure to the message. Where the `query` is a glob for searching for one or several files, and `parameters` is a string in the URL search format that can contain the following parameters:

- `mode` - file search and reading mode. Possible values are: `default`, `text` or a `filename`, `default` is used if nothing is passed
- `usePath` - replace the original file path with the one passed in this parameter
- `baseDir` - which directory to consider as the base. Possible values are `project` or `config`. `project` is used if nothing is passed

Before we get to the examples, we need to mention an important aspect. Any request to the file resolver always works relative to some base directory. There are two types of base directories:

- `project` - the base directory is considered to be the directory where RunChat was originally launched. In this case, any search and file writing will be carried out relative to this directory.
- `config` - the base directory is considered to be the config file directory where this resource link is located. This mode is useful for writing modular chat configs that refer to their local files.

So each time you use the file resolver, keep in mind what will be the base directory in your case.

Let's delve a bit deeper into all parts of the request to the file resolver using examples.

#### Searching for one or more files

To search for one or more files, you need to specify a `glob` expression in the query part of the resource specifier. You can read more about `glob` expressions at <a href="https://www.npmjs.com/package/glob">this link</a>. Upon receiving a request with a glob expression, the file resolver will find all files corresponding to it and return their values depending on what was used as the `mode` parameter.

The `mode` parameter can take 3 values:

- `default` - the value of the file will be its content wrapped in special start and end markers: the start marker `#>>{filename}>>#`, the end marker `#<<{filename}<<#`. This mode is convenient because it allows you to work not only with the contents of the file but also its path. We'll look at examples later.

- `text` - the value of the file will only be its content without any wrapping. This mode is convenient when indicating the path to the file is excessive and you just need to insert the text of the file.

- `filename` - the value of the file will be its name. This mode is used when you need to get a list of files, not their content.

Let's look at all the examples.

Let's return to one of the first examples when we asked ChatGPT to create a summary for a book chapter:

```bash
npx runchat -llogs -m "Could you please create a short summary on what this file is about {[fs:book_chapter.txt?mode=text]}".
```

In this example, query = `book_chapter.txt`, and the parameters are `?mode=text`. From this, we can draw two conclusions:

- the value of mode will be `text`, meaning the text of the file will be inserted without any wrappers
- the value of `baseDir` will be `project`, meaning the file search will be performed relative to the directory where RunChat was launched

To confirm this, let's run the command again, but this time we'll add the `-llogs` parameter to see the interaction log with ChatGPT.

Now, if you check the contents of the 'logs' directory, you can see the execution log files inside:

```txt
[Chat Call ChatGPT] messages: [
  {
    "role": "user",
    "content": "Could you please create a short summary on what this file is about “My dear Victor, You have probably waited impatiently for a letter to fix the date of your return to us; and I was at first tempted to write only a few lines, merely mentioning the day on which I should expect you.

... Chapter text goes here ...

“Your affectionate and afflicted father,
“Alphonse Frankenstein.
."
  }
]
[Chat Call ChatGPT] gpt response:
The file is a letter from Alphonse Frankenstein to his son Victor, informing him of the tragic death of his younger brother William. William was murdered and the family is devastated by the loss. Alphonse urges Victor to return home to console his grieving family and to not seek vengeance against the murderer.
[Chat Call ChatGPT] gpt response done.

[Chat Call ChatGPT] parsed files .
```

You can see that the chapter text begins immediately after "Could you please create a short summary on what this file is about" in the sent message.

Now, let's change the mode from `text` to `default`. To do this, just delete the part with `?mode=text` and run the command again.

```bash
npx runchat -llogs -m "Could you please create a short summary on what this file is about {[fs:book_chapter.txt]}".
```

After running a command and reviewing the logs files we can see that now chapter file is wrapped into a `#>>book_chapter.txt>>#` and `#<<book_chapter.txt<<#` markers:

```txt
[Chat Call ChatGPT] messages: [
  {
    "role": "user",
    "content": "Could you please create a short summary on what this file is about #>>book_chapter.txt>>#“My dear Victor,

“You have probably waited impatiently for a letter to fix the date of your return to us; and I was at first tempted to write only a few lines, merely mentioning the day on which I should expect you. But that would be a cruel kindness, and I dare not do it. What would be your surprise, my son, when you expected

... Chapter text goes here ...

“Your affectionate and afflicted father,
“Alphonse Frankenstein.
#<<book_chapter.txt<<#."
  }
]
[Chat Call ChatGPT] gpt response:
The file contains a letter from Alphonse Frankenstein to his son Victor, informing him of the tragic death of his younger brother William. William was murdered and the family is devastated by the loss. Alphonse urges Victor to return home to console his grieving family and not to seek vengeance against the murderer.
[Chat Call ChatGPT] gpt response done.

[Chat Call ChatGPT] parsed files
```

And finally, let's replace mode=text with mode=filename and run the command for the third time.

```bash
npx runchat -llogs -m "Could you please create a short summary on what this file is about {[fs:book_chapter.txt?mode=filename]}".
```

```txt
[Chat Call ChatGPT] messages: [
  {
    "role": "user",
    "content": "Could you please create a short summary on what this file is about book_chapter.txt."
  }
]
[Chat Call ChatGPT] gpt response:
As an AI language model, I do not have access to the specific file named "book_chapter.txt" as it is not provided in the prompt. Please provide more information or context about the file so I can assist you better.
[Chat Call ChatGPT] gpt response done.
[Chat Call ChatGPT] parsed files .
```

You can see that in this case, the resource resolver returned the name of the file itself.

#### Creating real files

Each mode has its purpose: `text` is like using variables but with files, `filename` is needed when you want to get a list of directory files, but the `default` mode has a special purpose.

The thing is that the ChatGPT API does not have a concept like a file. You can't ask ChatGPT to write you a React component file with the path `src/components/MyApp.tsx` and then retrieve it through the `getFile()` method. All you can operate with is text.

But this problem can be easily circumvented by introducing file start and end markers `#>>{filename}>>#` and `#<<{filename}<<#` and teaching ChatGPT to wrap resulting files in this markers.

RunChat can find such markers and when they are detected, the text within these markers is copied to a real file in your file system.

This approach allows you to do this:

"Hey, ChatGPT could you please generate me a 'Hello World' React component and put it into a src/components/MyApp.tsx file."

And if you've previously taught ChatGPT to work with start and end markers, the result of executing this command will be a React component file saved in your project:

```bash
npx runchat -c runchat/recipes/base -m "Hey! Could you please create a Hello world react component and save it to a MyComponent.tsx file"
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/create-file.gif">

`runchat/recipes/base` is the base chat file shipped with the `runchat` package. It used to teach ChatGPT how to work with file start and end markers, as well as with context variables. Here's the content of this file:

```json
{
  "title": "Base",
  "description": "Files and context variables",
  "messages": [
    {
      "role": "system",
      "content": "You act as a helpful developer assistant"
    },
    {
      "role": "user",
      "content": [
        "Hello! During our upcoming conversation, I will occasionally ask you to create a file",
        "or implement a particular piece of code. In these situations, I would like you to",
        "always wrap the file content within special blocks: #>>{path}>># and #<<{path}<<#,",
        "where {path} is replaced with the actual path to the file.",
        "Okay, let's try it: Write a simple example using TypeScript."
      ]
    },
    {
      "role": "assistant",
      "content": "{[fs:./examples/Dummy.ts?baseDir=config]}"
    },
    {
      "role": "user",
      "content": [
        "Also during our upcoming conversation, I will occasionally ask you to create a context variable,",
        "or to put some value into context under the certain name. In these situations, I would like you to",
        "always wrap the value within special blocks: #>>{name}.ctx>># and #<<{name}.ctx<<#,",
        "where {name} is replaced with the actual name of the variable",
        "Okay, let's try it: Put a the capital of England into the context variable `capital`."
      ]
    },
    {
      "role": "assistant",
      "content": "#>>capital.ctx>>#London#<<capital.ctx<<#"
    },
    {
      "role": "user",
      "content": "Perfect. I will give you the next task in the following messages"
    }
  ]
}
```

It uses the one shot prompting method to show ChatGPT what is the proper way to wrap files into start and end markers, as well as working with context variables. ( We'll talk about context variables in the next chapters )

#### Faking file path

Sometimes there may be a need to use a file from location `A`, but have the file resolver replace the file path in the markers with location `B`. For example, you're creating your own package with chat configs and using local example files. Then, in your message, you'll use a resource specifier like this: `{[fs:./examples/Navigation.tsx]}`

And the file resolver will use the path `./examples/Navigation.tsx` in the start and end markers. But you want ChatGPT to think that this is actually the code for the file `src/components/Navigation.tsx`. In this case, you'll find the `usePath` parameter useful when referring to the file resolver. Upon receiving usePath, the file resolver will replace the actual file path with the one passed in the parameter: `{[fs:./examples/Navigation.tsx?usePath=src/components/Navigation.tsx]}`

### Context resolver

Files are a handy tool, but sometimes there may be a need to work with data without saving it to physical storage. For these situations, there is a special kind of resolver - `context resolver`. The context resolver works exactly the same way as the `file resolver`, with the only difference being that, unlike the file resolver, it saves data not to disk but to a special data object that all tasks executed within a RunChat session have access to.

If you want to save some data to the context, you can ask ChatGPT to create a file with the extension `.ctx`. For example:

```txt
"Hey ChatGPT, could you please create a file called my_variable.ctx and put the current date in that file?"
```

If you have inherited your configuration from `runchat/recipes/base`, then in its response, ChatGPT will put the current date in the file `start` and end `tags`:

```txt
Today's date is #>>my_variable.ctx>>#June 9, 2023#<<my_variable<<#
```

After that, RunChat will recognize these tags, understand that the file extension is .ctx and therefore, instead of saving it to disk, it will put it in the context variable storage so that other tasks can later use this value. (We will talk about tasks right in the next section)

## Tasks

Everything we've discussed so far has been about launching just one chat with ChatGPT, but what if we're tackling a problem that's too complex to solve with just one chat? To understand this in more detail, let's return to the example with the chapter summary from the book, but now let's imagine that we have several files and we want to create a a resulting file that contains a table of contents and a short summary of each chapter. We also want to generate summaries in parallel for speed efficiency.

To run parallel generation we could run several RunChat commands and wait for their execution:

```bash
# Summarize
npx runchat -m "Could you please create a short summary on what this file is about {[fs:chapter_1.txt]}" > ch_1_summary.txt &
npx runchat -m "Could you please create a short summary on what this file is about {[fs:chapter_2.txt]}" > ch_2_summary.txt &
wait
# Create a table of contents
npx runchat -m "Could you please review text summaries from {[fs:./*_summary.txt]} and create a resulting file that contains: a table of contents and a summary texts for the chapters passed to the input. A table of contents item should contain a number and a short description sentence of 5-10 words. Do not add any chapters that are not in the input" > result.txt
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/table-of-contents-1.gif">

While this approach is absolutely valid, it has its flaws:

- It requires some bash skills. I like bash, but it would be nice to solve such tasks without the need to program anything.
- It will be more difficult for you to share your code with others, as distributing a bash file is much harder than, for example, an npm package.
- You won't be able to use bash code from other RunChat configuration files.
- Passing data between tasks through files is not always the best option. For example: in the command above, we didn't need to create summary files, they were needed as a storage for intermediate data, and after executing the commands, don't forget to delete them.

To address this, RunChat supports the ability to create multiple tasks within config files. To describe tasks, you need to use the `tasks` property in the config file. Lets create a `toc.json` config file:

```json
{
  "title": "Summary and contents",
  "tasks": [
    {
      "title": "Chapter 1 summary",
      "messages": [
        {
          "role": "user",
          "content": [
            "Could you please create a short summary on what this file is about:",
            "{[fs:chapter_1.txt?mode=text]}"
          ]
        }
      ]
    },
    {
      "title": "Chapter 2 summary",
      "messages": [
        {
          "role": "user",
          "content": [
            "Could you please create a short summary on what this file is about:",
            "{[fs:chapter_2.txt?mode=text]}"
          ]
        }
      ]
    }
  ],
  "concurrent": true
}
```

Please note the `concurrent` property. By default, its value is `false` and tasks inside `tasks` are executed sequentially. Sequential execution is slower, but it allows you to pass data down the chain from one task to another.

Above, we provided a configuration for parallel summary generation. Now let's add the ability to create a table of contents to it

```json
{
  "title": "Summaries and table of contents",
  "tasks": [
    {
      "title": "Summaries",
      "tasks": [
        {
          "title": "Chapter 1 summary",
          "extend": "runchat/recipes/base",
          "messages": [
            {
              "role": "user",
              "content": [
                "Please read the text:",
                "{[fs:chapter_1.txt?mode=text]}.",
                "Create a file `chapter_1_summary.txt` that contains a short summary on what this text is about."
              ]
            }
          ]
        },
        {
          "title": "Chapter 2 summary",
          "extend": "runchat/recipes/base",
          "messages": [
            {
              "role": "user",
              "content": [
                "Please read the text:",
                "{[fs:chapter_2.txt?mode=text]}.",
                "Create a file `chapter_2_summary.txt` that contains a short summary on what this text is about."
              ]
            }
          ]
        }
      ],
      "concurrent": true
    },
    {
      "title": "Table of contents",
      "extend": "runchat/recipes/base",
      "messages": [
        {
          "role": "user",
          "content": [
            "Review text summaries from {[fs:*_summary.txt]} and create a text file result.txt",
            "that contains: a table of contents and a summary texts for the ",
            "chapters passed to the input. A table of contents item should contain a number ",
            "and a short description sentence of 5-10 words. Do not add any chapters that ",
            "are not in the input."
          ]
        }
      ]
    }
  ]
}
```

```bash
npx runchat -c ./toc.json
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/table-of-contents-2.gif">

Take note of the following:

- We've added another level of tasks, now there are 2 levels.
- We've added `extend` for tasks that need to work with files and context.

Although this example solves most of the drawbacks of the previous bash example:

- You didn't have to program anything
- You can easily distribute this config by creating an npm package for it
- You can reuse this config by inheriting from it

It still has one drawback:

- In addition to `result.txt`, it creates extraneous `chapter_1_summary.txt` and `chapter_2_summary.txt` files.

There's nothing complicated about deleting extraneous files after execution, or not deleting them if they don't bother you, but the more complex your config files and the task you're solving, the higher the probability that one day these files will confuse you, so it's better not to create them unnecessarily. Moreover, there's a simple way to achieve this using `context` variables.
The changes that need to be made to the config file are minimal. It's enough to change the extensions of the intermediate files to .ctx and use context resolver instead of file resolver:

```json
{
  "title": "Summaries and table of contents",
  "tasks": [
    {
      "title": "Summaries",
      "tasks": [
        {
          "title": "Chapter 1 summary",
          "extend": "runchat/recipes/base",
          "messages": [
            {
              "role": "user",
              "content": [
                "Please read the text:",
                "{[fs:chapter_1.txt?mode=text]}.",
                "Create a file `chapter_1_summary.ctx` that contains a short summary on what this text is about."
              ]
            }
          ]
        },
        {
          "title": "Chapter 2 summary",
          "extend": "runchat/recipes/base",
          "messages": [
            {
              "role": "user",
              "content": [
                "Please read the text:",
                "{[fs:chapter_2.txt?mode=text]}.",
                "Create a file `chapter_2_summary.ctx` that contains a short summary on what this text is about."
              ]
            }
          ]
        }
      ],
      "concurrent": true
    },
    {
      "title": "Table of contents",
      "extend": "runchat/recipes/base",
      "messages": [
        {
          "role": "user",
          "content": [
            "Review text summaries from {[ctx:*_summary]} and create a text file result.txt",
            "that contains: a table of contents and a summary texts for the ",
            "chapters passed to the input. A table of contents item should contain a number ",
            "and a short description sentence of 5-10 words. Do not add any chapters that ",
            "are not in the input."
          ]
        }
      ]
    }
  ]
}
```

<img src="https://github.com/gptflow/runchat/blob/main/assets/table-of-contents-3.gif">

## Advanced

### Task tree mental model

Every time RunChat is launched, it creates a certain data structure that is used during task execution. Understanding this structure is very crucial to creating configurations of any complexity. Let's consider everything using the example of a book summary and the contents of its chapters. However, this time we'll complicate the conditions a bit:

- The task of creating a summary should be in a separate file
- We want to be able to specify the final text localization

Here is the updated `toc.json` file:

```json
{
  "title": "Summaries and table of contents",
  "args": {
    "lang": "In what language should the result be?"
  },
  "tasks": [
    {
      "title": "Summaries",
      "tasks": [
        {
          "title": "Chapter 1 summary",
          "extend": "./chapter-summary.json",
          "vars": {
            "file_path": "./chapter_1.txt",
            "save_to": "chapter_1_summary.ctx"
          }
        },
        {
          "title": "Chapter 2 summary",
          "extend": "./chapter-summary.json",
          "vars": {
            "file_path": "./chapter_2.txt",
            "save_to": "chapter_2_summary.ctx"
          }
        }
      ],
      "concurrent": true
    },
    {
      "title": "Table of contents",
      "extend": "runchat/recipes/base",
      "messages": [
        {
          "role": "user",
          "content": [
            "Review text summaries from {[ctx:*_summary]} and create a text file result.txt",
            "that contains: a table of contents and a summary texts for the ",
            "chapters passed to the input. A table of contents item should contain a number ",
            "and a short description sentence of 5-10 words. Do not add any chapters that ",
            "are not in the input. Please use the {{lang}} language."
          ]
        }
      ]
    }
  ]
}
```

Changes review:

- Now the summary generators are inherited from chapter-summary
- We've added a `lang` parameter to args
- We use `lang` in the task that combines the results and writes the table of contents

And here is the `chapter-summary.json`:

```json
{
  "title": "Chapter summary",
  "extend": "runchat/recipes/base",
  "args": {
    "file_path": "A path to a text file to generate summary for",
    "save_to": "A name of the context file to save the result to",
    "lang": "A language of the summary"
  },
  "messages": [
    {
      "role": "user",
      "content": [
        "Please read the text:",
        "{[fs:{{file_path}}?mode=text]}.",
        "Create a file `{{save_to}}.ctx` that contains a short summary on what this text is about.",
        "Please use {{lang}} language for the summary text"
      ]
    }
  ]
}
```

```bash
npx runchat -c ./toc.json
```

<img src="https://github.com/gptflow/runchat/blob/readme-advanced/assets/table-of-contents-4.gif">

Alright, now let's get to the main part. When we launch RunChat, it creates a structure that describes the configuration file you passed in the `-c` option. This structure is a tree, with nodes being the tasks from your configuration file. Every structure that has a `messages` field or a `tasks` field is a node in the configuration. It will be easier to understand if we visualize everything.

<div align="center">
  <img src="https://github.com/gptflow/runchat/blob/readme-advanced/assets/task-tree.png">
</div>

It's important to note a few things from this scheme:

- There is always a Root node that inherits from the configuration file you passed in the `-c` option
- The Root node stores the values of the variables that you passed through `-v` or in the interactive prompt
- Variable values are stored in the node where you defined them
- Configurations you inherited from are full-fledged parts of the structure

Even if you didn't pass any configuration file and just used `-m` with a simple test message RunChat will automatically create a task node for that message and a Root node that inherits from that node:

```bash
npx runchat -m "Hey ChatGPT, my name is {{name}}. How are you?" -vname=Alex
```

<div align="center">
  <img style="width: 50%" src="https://github.com/gptflow/runchat/blob/readme-advanced/assets/task-tree-one-message.png">
</div>

### Resolution phases

There is a strict algorithm inside RunChat for preparing and launching a config file:

Phase 1: **Preparation**:

- Resolving variables in messages and inside other variables
- Buld task tree node structure

Phase 2: **Execution**:

- Resolving message resources
- Calling ChatGPT

Let's discuss variable and resource resolution in more detail.

#### Variable resolution flow

Variable resolution occurs in the first phase - preparation. RunChat recursively traverses all nodes in depth and every time it finds a structure like `{{var_name}}` within a message text or another variable's value, it tries to determine its value and replace `{{var_name}}` with the resolved value.

To determine the value of a variable, RunChat goes through nodes upwards from the node where `{{var_name}}` was found to the root node Root until it finds a node which has a value for `var_name` in its `vars`. Here is a visual representation of how variables from the 'chapter_summary' node were resolved.

<img style="width: 50%" src="https://github.com/gptflow/runchat/blob/readme-advanced/assets/task-tree-one-message.png">

#### Resource resolution flow

- Create and distribute own chat config
- Creating and distribute own resolver
- Project file
- Use a resolver in the project

- API
- Example project: TODO

````

```

```
````
