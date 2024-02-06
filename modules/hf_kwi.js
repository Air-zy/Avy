const fetch = require('node-fetch');
const HF_TOKEN = process.env['HF_TOKEN'];
const hf_headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${HF_TOKEN}`
};


async function generate(input){
  try {
    const resp = await fetch("https://dalleon-toyworld.hf.space/run/generate", {
      method: "POST",
      headers: hf_headers,
      body: JSON.stringify({
        data: [
          input,
        ]
      })
    })
    const base64Image = await resp.json()
    const data = base64Image.data[0].split(',')[1];
    const buffer = Buffer.from(data, 'base64');

    return buffer
  } catch (err) {
    console.log("[KWI] ERR " + err)
  }
}

module.exports = {
  generate,
};
