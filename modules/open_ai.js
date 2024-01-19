const fetch = require('node-fetch');
const apiKey = process.env['aikey'];

async function generate(msgs) {
  const body = {
    "messages": msgs,
    "model": "gpt-3.5-turbo-1106",
    "temperature": 0.8,
    "presence_penalty": 0.5,
    "frequency_penalty": 0.8,
    "top_p": 0.8,
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    "headers": {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    "body": JSON.stringify(body),
  });
  const nresp = await response.json()
  return nresp["choices"][0]["message"]["content"]
}

module.exports = {
  generate,
};
