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

<p align="center">
  <img width="80%" src="https://github.com/gptflow/runchat/blob/readme/assets/how_are_you.gif">
</p>

Essentially, it's the same as going to the chat.openai.com website, writing a greeting, and getting a response, but it's all done through the console.

### Message variables

RunChat allows you to use variables in messages. Use the -v option in order to set a variable's value. For instance, you can introduce yourself and pass the name through a variable. Yes, this example might seem a bit meaningless, but it introduces us to an important concept.

```bash
npx runchat -m "Hey ChatGPT, my name is {{name}}. How are you?" -vname=Alex
```

<p align="center">
  <img width="80%" src="https://github.com/gptflow/runchat/blob/readme/assets/my_name_is.gif">
</p>


You can choose not to specify a variable's value using -v, and then RunChat will ask for its value using an interactive prompt.



### Message resources


