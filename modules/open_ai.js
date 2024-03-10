const fetch = require('node-fetch');
const apiKey = process.env['aikey'];
const fs = require('fs');

let firedb;

let total_tokens = 0;
let prompt_tokens = 0;
let completion_tokens = 0;

let tokenGetSuccess = 0;

async function firedbTokenUpdate(tuTotal,tuInput,tuOutput) {
  try {
    if (tokenGetSuccess == 1) {
      const aTuringRef = await firedb.doc('3rhrsWF9YlhpfZ2y3L7q');
      aTuringRef.set(
        {
          'total_tokens': tuTotal,
          'prompt_tokens': tuInput,
          'completion_tokens': tuOutput
        }
      );
    }
  } catch(err) {
    console.log("[FIRE BASE ERR]",err)
  }
}

async function firedbTokenGET() {
  try {
    const aTuringRef = await firedb.doc('3rhrsWF9YlhpfZ2y3L7q');
    const value = await aTuringRef.get();
    const data = await value.data();
    tokenGetSuccess = 1;
    return data;
  } catch(err) {
    console.log("[FIRE BASE ERR]",err)
  }
}

async function generate(msgs, aimodel) {
  const body = {
    "messages": msgs,
    "model": aimodel,
    "temperature": 1,
    "presence_penalty": 1,
    "frequency_penalty": 1.5,//1.5,
    "top_p": 0.8,
    "logit_bias": {
        "7976": 2, // ( fuck)
        "16585": 2, // (pussy)
        "14931": -1, // ( sorry)
        "33386": -1, // ( Sorry)
        "68697": -1, // sorry
        "19701": -1, // Sorry
        "3923": -50, // What
        "19182": -50, // Hey
        "1520": -100, // ( help)
        "8823": -100, // help
        "52066": -100, // assist
        "7945": -100, // ( assist)
        "49150": -100, // ( respectful)
        "34360": -100, // cannot
        "58369": -50, // digital
        "26752": -50, // virtual
        "82630": -50, // friendly
        "47916": -50, // Whatever
        "69386": -50, // whatever
        "1480": 4, // Error
        "31": -100, // @
        "93": 1, // ~
        "9": 1, // *
        "2771": 2, // (sure)
        "27075": 2, // ( dick)
        "596": -10, // 's
        "19643": 5, // sure
        "9336": 5, // well
        "2079": -50, // request
        "29589": -50, // :)
        "18754": 1, // ( stupid)
        "0": -1, // !
        "30": -1, // ?
        "19770": 1 // 418
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
  if ('usage' in nresp) {
    const tokensUsedTotal = nresp.usage.total_tokens;
    const tokensUsedInput = nresp.usage.prompt_tokens;
    const tokensUsedOutput = nresp.usage.completion_tokens;
    total_tokens += tokensUsedTotal
    prompt_tokens += tokensUsedInput;
    completion_tokens += tokensUsedOutput;
    
    firedbTokenUpdate(total_tokens, prompt_tokens, completion_tokens);
    let update = JSON.parse(fs.readFileSync('json_storage/info.json', 'utf-8'));
    update.token_usage = total_tokens;
    fs.writeFileSync('json_storage/info.json', JSON.stringify(update, null, 2));
  }
  if (nresp["choices"]) {
    return nresp["choices"][0]["message"]["content"]
  } else {
    throw nresp;
  }
}

async function loadTokens() {
  const newtokendata = await firedbTokenGET()
  total_tokens = parseInt(newtokendata.total_tokens);
  prompt_tokens = parseInt(newtokendata.prompt_tokens);
  completion_tokens = parseInt(newtokendata.completion_tokens);
}

function pass_exports(p_firedb) {
  firedb = p_firedb;
  loadTokens();
}

module.exports = {
  generate,
  pass_exports
};
