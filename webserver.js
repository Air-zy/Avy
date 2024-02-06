const express = require("express");
const axios = require("axios");
const server = express();

let alvtimer = 0;
let bigstring = ``;
server.all(`/`, (req, res) => {
  alvtimer += 1;

  const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
  bigstring += `<br>[${alvtimer}] ` + req.headers["user-agent"] + `<br>` + ipAddress + `<br>`;
  
  res.send(`Air [SERVER]\n running ` + bigstring);
});

function runserver() {
  server
    .listen(3000, () => {
      console.log(`[SERVER] listening on port 3000`);
    })
    .on("error", (error) => {
      console.log(`[SERVER ERROR] error starting server `, error);
    });
}

module.exports = runserver;
