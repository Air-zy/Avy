const fetch = require('node-fetch');

async function readStreamBody(response) {
  // Read the entire response as text
  const fulltxt = await response.text();

  // Use regular expression to extract JSON-like strings
  const jsonRegex = /{[^}]+}/g;
  const jsonMatches = fulltxt.match(jsonRegex);

  // Parse each extracted JSON-like string
  const jsonArray = jsonMatches.map((jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Error parsing JSON: ${jsonString}`);
      return null;
    }
  });

  let messagesString = '';
  for (let i = 0; i < jsonArray.length; i++) {
    if (jsonArray[i].isSuccess !== true || jsonArray[i].isToolMessage !== false) {
      console.log(jsonArray[i]);
      messagesString += "(Err💔r)";
    } else {
      messagesString += jsonArray[i].message;
    }
  }

  // Remove trailing space
  // messagesString = messagesString.trim();
  return messagesString;
}

function fetchWithTimeout(url, timeout, stuff) {
  return Promise.race([
    fetch(url, stuff),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]).catch(error => {
    if (error.message === 'Timeout') {
      // Handle timeout, e.g., return undefined or perform other actions
      return undefined;
    }
    throw error; // Re-throw other errors
  });
}

async function generate(messages, depth) {
  if (depth != 0){
    let bodydata = {
      "messages": messages,
      "stream": true,
      "model": "gpt-3.5-turbo",
      "temperature": 0.8,
      "presence_penalty": 0.5,
      "frequency_penalty": 0.2,
      "top_p": 0.8,
      "baseUrl": "/api/openai/",
      "maxIterations": 1, //n ?
      "returnIntermediateSteps": true,
      "useTools": [
        "web-search",
        "calculator",
        "web-browser"
      ]
    };
    let gpturl = "https://ngoctuanai-chatgptfree.hf.space/api/langchain/tool/agent"
    if (depth == 3){ // fault attempt
      gpturl = "https://ngoctuanai-chatgptfree.hf.space/api/langchain/tool/agent/edge"
    }
    if (depth <= 3){ // fault attempt 2
      messages = messages.slice(0, 6) // less history maybe
      bodydata = {
        "messages": messages,
        "stream": true,
        "model": "gpt-3.5-turbo",
        "temperature": 0.8,
        "presence_penalty": 0.5,
        "frequency_penalty": 0.2,
        "top_p": 0.8,
        "baseUrl": "/api/openai/",
        "maxIterations": 10, //n ?
        "returnIntermediateSteps": true,
        "useTools": [
          "web-search",
          "calculator",
          "web-browser"
        ]
      };
    }

    bodydata = JSON.stringify(bodydata, null, 2)
    const response = await fetchWithTimeout(gpturl, 10000, {
      "headers": {
        "accept": "text/event-stream",
        "accept-language": "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": "https://ngoctuanai-chatgptfree.hf.space/",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": bodydata,
      "method": "POST",
      "mode": "cors",
      "credentials": "omit"
    });

    if (response && response.body) {
      let val = await readStreamBody(response);
      if (val == "Unauthorized - Access token is missing" || val == "Your authentication token has expired. Please try signing in again." || val == "(Err💔r)"){
        console.log("Unauth FAIL DEPTH: ", depth)
        val = generate(messages, depth-1)
      }
      return val;
    } else {
      console.log("Timeout FAIL DEPTH: ", depth)
      let val = generate(messages, depth-1)
      return val;
    }
  } else {
    return "[eror]"
  }
}

module.exports = {
  generate,
};
