const express = require("express");
const server = express();

const vowels = 'aeiou';
const consonants = 'bcdfghjklmnpqrstvwxyz';

function generateName(ip) {
    const ipSegments = ip.split('.').join('').split(':').join('');
    let name = '';
    for (let i = 0; i < 6; i++) {
        const index = (parseInt(ipSegments.charAt(i), 10) || 0) % 2 === 0 ? i % 2 : (i + 1) % 2;
        name += index === 0 ? consonants.charAt(parseInt(ipSegments.charAt(i), 10) % consonants.length) : vowels.charAt(parseInt(ipSegments.charAt(i), 10) % vowels.length);
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
}

function wrapName(name) {
    return `<span style="font-weight: bold; color: #b30000;">${name}</span>`;
}

let alvtimer = 0;
let bigstring = ``;
server.all(`/`, (req, res) => {
  alvtimer += 1;

  const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
  bigstring += `<br>${wrapName(generateName(ipAddress))} [${alvtimer}]<br><i>` + req.headers["user-agent"] + `</i><br>` + ipAddress + `<br>`;
  
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
