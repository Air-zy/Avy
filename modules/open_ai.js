const fetch = require('node-fetch');
const apiKey = process.env['aikey'];

async function generate(msgs, aimodel) {
  const body = {
    "messages": msgs,
    "model": aimodel,
    "temperature": 0.8,
    "presence_penalty": 0.5,
    "frequency_penalty": 1,
    "top_p": 0.8,
    "logit_bias": {
        "68697": -100, // sorry
        "19701": -100, // Sorry
        "3923": -50, // What
        "19182": -50, // Hey
        "8823": -50, // help
        "34360": -100, // cannot
        "58369": -50, // digital
        "26752": -50, // virtual
        "31": -100, // @
        "93": 5, // ~
        "596": -10, // 's
        "19643": 5, // sure
        "9336": 5, // well
        "2079": -50, // request
        "9": 5, // *
        "0": -30 // !
    }
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
