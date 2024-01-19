const hspacecookie = process.env['HSPACECOOKIE']
const hspaceurl = process.env['HSPACEURL']
const fetch = require('node-fetch');

let heartbeats = 0
async function uptimespace() {
  try {
    const response = await fetch(hspaceurl + "/join?", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": hspacecookie,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": "{\"data\":[\"d\"],\"event_data\":null,\"fn_index\":0,\"trigger_id\":9,\"session_hash\":\"35ie5cow5sz\"}",
      "method": "POST"
    });
    const response2 = await fetch(hspaceurl + "/data?session_hash=35ie5cow5sz", {
      "headers": {
        "accept": "text/event-stream",
        "accept-language": "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": hspacecookie,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    });
    if (response2.status == "200"){ // success
      heartbeats += 1
      console.log("[heart] beat " + heartbeats)
    } else {
      throw "Ping Fialed"
    }
  } catch (err) {
    console.log("[HEART ERROR]: " + err)
  }
}

function systole() {
  uptimespace()
  const pump = setInterval(uptimespace, 900000);
  console.log("[HEART STARTED] " + pump)
}

module.exports = systole;
