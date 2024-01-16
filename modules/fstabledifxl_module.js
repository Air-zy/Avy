const fetch = require('node-fetch');
const whitelist_characters = [' ', '.', ',', ';', ':', '!', '?', '"'];

function insert_string(input, fill_character) {
    let result = fill_character;

    for (let char of input) {
        if (whitelist_characters.includes(char)) {
            result += fill_character + char + fill_character;
        } else {
            result += char;
        }
    }

    result += fill_character;
    return result;
}

async function generate(input) {
  let bodydata = {
      "inputs": insert_string(input, '\u2800'), // funny bypass
      "options": {
          "negative_prompt": "",
          "width": 1028,
          "height": 1028,
          "guidance_scale": 7.5,
          "num_inference_steps": 50,
      }
  };
  
  bodydata = JSON.stringify(bodydata, null, 2)
  const response = await fetch("https://enzostvs-stable-diffusion-tpu.hf.space/api", {
    "body": bodydata,
    "method": "POST"
  });

  const njson = await response.json();
  if (njson && njson.image){
    const url = `https://huggingface.co/datasets/enzostvs/stable-diffusion-tpu-generations/resolve/main/${njson.image.file_name}.png`
    return url
  } else {
     return response.text()
  }
}

module.exports = {
  generate,
};
