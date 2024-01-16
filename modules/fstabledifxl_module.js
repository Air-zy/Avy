const fetch = require('node-fetch');

async function generate(input) {
  let bodydata = {
      "inputs": input + '\u2800', // funny bypass
      "options": {
          "negative_prompt": "",
          "width": 1024,
          "height": 1024,
          "guidance_scale": 7,
          "num_inference_steps": 35
      }
  };
  
  bodydata = JSON.stringify(bodydata, null, 2)
  const response = await fetch("https://enzostvs-stable-diffusion-tpu.hf.space/api", {
    "body": bodydata,
    "method": "POST"
  });

  const njson = await response.json();
  const url = `https://huggingface.co/datasets/enzostvs/stable-diffusion-tpu-generations/resolve/main/${njson.image.file_name}.png`
  return url
}

module.exports = {
  generate,
};
