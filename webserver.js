const express = require("express");
const axios = require("axios");
const server = express();

let alvtimer = 0;
let bigstring = ``;
server.all(`/`, (req, res) => {
  alvtimer += 1;
  bigstring += `<br>[${alvtimer}] ` + req.headers["user-agent"];
  res.send(`Air [SERVER]\n running ` + bigstring);
});

async function pingUrl() {
  try {
    const response = await axios.get("https://dccmqn-3000.csb.app");
    console.log(`Ping successful! Status code: ${response.status}`);
  } catch (error) {
    console.error(
      `Error pinging URL: ${"https://dccmqn-3000.csb.app"}`,
      error.message,
    );
  }
}

function runserver() {
  server
    .listen(3000, () => {
      console.log(`[SERVER] listening on port 3000`);
    })
    .on("error", (error) => {
      console.log(`[SERVER ERROR] error starting server `, error);
    });
  setInterval(pingUrl, 60000);
}

module.exports = runserver;
