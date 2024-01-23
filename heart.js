const hspaceurl = process.env['HSPACEURL']
const fetch = require('node-fetch');

let heartbeats = 0
const ws = require('ws');

const HF_TOKEN = process.env['HF_TOKEN'];
const hf_headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${HF_TOKEN}`
};

// by Staticaliza
const gradio_generate = async (data, fn_index, space_url) => {
  // Function to generate a simple hash
  const generateHash = () => {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  };

  let session_hash = generateHash();
  let json_data = JSON.stringify({ data: data, fn_index: fn_index, session_hash: session_hash });
  let json_hash_data = JSON.stringify({ fn_index: fn_index, session_hash: session_hash });

  return new Promise((mainResolve, mainReject) => {
    const websocket = new ws(`wss://${space_url}queue/join`, { headers: hf_headers, maxPayload: 1024 * 1024 * 1024 });

    websocket.on("open", () => {
      //console.log("WS OPEN")
      websocket.on("message", (event) => {
        let resp = JSON.parse(event);
        //console.log("WS EVENT " + resp.msg)
        if (resp.msg === "queue_full") {
          mainReject("[WEBSOCKET] Queue is full, please try again!");
        }
        else if (resp.msg === "send_hash") {
          //console.log("sent hash data")
          websocket.send(json_hash_data);
        }
        else if (resp.msg === "send_data") {
          //console.log("sent data")
          websocket.send(json_data);
        }
        else if (resp.msg === "process_completed") {
          heartbeats += 1
          console.log("[HEART] beat " + heartbeats)
          mainResolve(resp.output);
        };
      });
    });

    websocket.on("error", (error) => { mainReject(error); });
  });
}

async function uptimespace(){
  try {
    const result = await gradio_generate(
      ["run"],
      1, 
      hspaceurl
    )
  } catch (err) {
    console.log("[HEART] ERR " + err)
  }
}
function systole() {
  uptimespace()
  const pump = setInterval(uptimespace, 900000);
  console.log("[HEART STARTED] id " + pump)
}

module.exports = systole;
