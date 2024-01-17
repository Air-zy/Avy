// Call Variables

let client;
let discordjs;

const fetch = require("node-fetch");
const fs = require("fs");
const os = require("os");

const main_funcs = require("./functions.js");
const toText = main_funcs.toText;

// Values

const cmdprefix = JSON.parse(fs.readFileSync("json_storage/configs.json"))[0]
  .prefix;
const urlRegex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/i;

// Functions

function formatUptime(uptime) {
  const seconds = Math.floor((uptime / 1000) % 60);
  const minutes = Math.floor((uptime / (1000 * 60)) % 60);
  const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

function reverseLines(originalString) {
  const lines = originalString.split("\n");
  const reversedLines = lines.reverse();
  const reversedString = reversedLines.join("\n");
  return reversedString;
}

async function handle_cmds(message) {
  const words = message.content.split(" ");
  const mchannel = message.channel;

  if (words[0] == cmdprefix + "send" || words[0] == cmdprefix + "dm") {
    const recipient_id = words[1].replace(/\D/g, "");
    const recipient = await client.users.fetch(recipient_id);
    const found_channel = await recipient.createDM();
    const txt = words.slice(2).join(" ");

    await found_channel.send(txt);
    await mchannel.send("sent to <@" + recipient_id + ">");
    //
  } else if (message.content == cmdprefix + "ping") {
    const start = Date.now();
    const rmsg = await mchannel.send({
      content: "A",
    });
    const latency = Date.now() - start;
    const wsPing = client.ws.ping;
    const newEmbed = new discordjs.EmbedBuilder()
      .setColor("#DC143C")
      .addFields(
        { name: "websocket", value: toText(wsPing), inline: true },
        { name: "latency", value: toText(latency), inline: true }
      );
    rmsg.edit({
      content: "",
      embeds: [newEmbed],
    });
    //
  } else if (
    words[0] == cmdprefix + "viewc" ||
    words[0] == cmdprefix + "view_channel"
  ) {
    let channelid = words[1];
    if (channelid) {
      channelid = toText(channelid).substring(0, 1024).replace(/\D/g, "");
    } else {
      mchannel.send(
        `channel ${toText(channelid).substring(0, 1024)} not found`
      );
      return;
    }

    var found_channel;
    try {
      const user = await client.users.fetch(channelid);
      if (user && user.id) {
        const dmChannel = await user.createDM();
        found_channel = dmChannel;
      }
    } catch (err) {
      found_channel = await client.channels.fetch(channelid);
    }

    if (found_channel) {
      let prevmessages = await found_channel.messages.fetch({ limit: 100 });
      let desctxt = "";
      prevmessages.forEach((msg) => {
        if (msg.attachments.size > 0) {
          msg.attachments.forEach((mattach) => {
            desctxt =
              desctxt +
              "(attachment){" +
              mattach.url +
              ", " +
              mattach.name +
              "}\n";
          });
        }
        desctxt =
          desctxt + `${msg.author.username}: ${msg.content.substring(0, 512)}`;
        desctxt = desctxt + "\n";
      });

      if (desctxt.length <= 0) {
        desctxt = "{empty}";
      }
      desctxt = reverseLines(desctxt.substring(0, 4096));
      let embedTitle = found_channel.name;
      if (found_channel.recipient) {
        embedTitle =
          found_channel.recipientId + " | " + found_channel.recipient.username;
      }
      const newEmbed = new discordjs.EmbedBuilder()
        .setTitle(embedTitle)
        .setColor("#DC143C")
        .setDescription(desctxt);

      mchannel.send({
        content: "",
        embeds: [newEmbed],
      });
    } else {
      mchannel.send(`${channelid} not found`);
    }
    //
  } else if (words[0] == cmdprefix + "vserver") {
    const search_id = words[1].replace(/\D/g, "");
    const guilds = await client.guilds.fetch();
    let foundguild;

    guilds.forEach((guild) => {
      console.log(toText(guild.id), toText(search_id));
      if (toText(guild.id) == toText(search_id)) {
        foundguild = guild;
      }
    });

    if (foundguild) {
      let guild_info = "";
      const fetchedguild = await client.guilds.fetch(search_id);
      if (fetchedguild) {
        console.log(fetchedguild);
        for (const key in fetchedguild) {
          if (fetchedguild.hasOwnProperty(key)) {
            const value = fetchedguild[key];
            guild_info = guild_info + toText(key) + `: ${value}`;
            guild_info = guild_info + "\n";
          }
        }
      }

      const newEmbed = new discordjs.EmbedBuilder()
        .setColor("#DC143C")
        .setTitle(foundguild.name)
        .setDescription(guild_info.substring(0, 4096));
      mchannel.send({
        content: "",
        embeds: [newEmbed],
      });
    } else {
      mchannel.send({
        content: "```js\nguild not found\n```",
      });
    }
    //
  } else if (message.content == cmdprefix + "servers") {
    const guilds = await client.guilds.fetch();
    let desctxt = "";
    let count = 0;
    guilds.forEach((guild) => {
      count += 1;
      desctxt = desctxt + `${guild.name}, ${guild.id}\n`;
    });
    const newEmbed = new discordjs.EmbedBuilder()
      .setColor("#DC143C")
      .setTitle(`${count} guilds`)
      .setDescription(desctxt);
    mchannel.send({
      content: "",
      embeds: [newEmbed],
    });
    //
  } else if (
    message.content == cmdprefix + "info" ||
    message.content == cmdprefix + "stats"
  ) {
    const uptimeValue = formatUptime(client.uptime);
    const newEmbed = new discordjs.EmbedBuilder().setColor("#DC143C").addFields(
      { name: "Bot ID", value: client.user.id, inline: false },
      {
        name: "Platform",
        value: os.platform() + " " + os.release(),
        inline: false,
      },
      {
        name: "Cpu",
        value: toText((process.cpuUsage().system / 1000000).toFixed(2)) + "%",
        inline: true,
      },
      {
        name: "Storage",
        value:
          toText(((os.totalmem() - os.freemem()) / 1073741824).toFixed(2)) +
          " / " +
          toText((os.totalmem() / 1073741824).toFixed(2)) +
          " GB",
        inline: true,
      },
      {
        name: "Heap",
        value:
          toText((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)) +
          " / " +
          toText((process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)) +
          " MB",
        inline: true,
      },
      { name: "Uptime", value: uptimeValue, inline: false }
    );
    /*.setDescription(`
        **hi**
      `);*/
    mchannel.send({ embeds: [newEmbed] });
    //
  } else if (words[0] == cmdprefix + "analyze") {
    if (words[1]) {
      if (urlRegex.test(words[1])) { // URL
        const match = words[1].match(urlRegex);
        const url = match ? match[0] : null;

        let logtxt = "↻";
        const initialmsg = await mchannel.send({
          content: "```js\n" + logtxt + "\n```",
        });
        async function trackurl(r, depth) {
          if (depth > 0) {
            try {
              const response = await fetch(r, { redirect: "manual", follow: 0 });
              if (response.headers.get("location")) {
                const redirectedUrl = response.headers.get("location");
                const contentType = response.headers.get("Content-Type");
                logtxt = logtxt + `\n\n["${r}"]: `;
                logtxt = logtxt + `\n//CTYPE: ${contentType}`;
                logtxt = logtxt + `\n[REDIRECT] > "` + redirectedUrl + `"`;
                if (
                  contentType &&
                  contentType.startsWith("application/octet-stream")
                ) {
                  logtxt = logtxt + `\n[DOWNLOAD]`;
                }
                await initialmsg.edit({
                  content: "```js\n" + logtxt + "\n```",
                });
                return await trackurl(redirectedUrl, depth - 1);
              } else {
                const contentType = response.headers.get("Content-Type");
                logtxt = logtxt + `\n\n[FINAL]: "${r}"`;
                logtxt = logtxt + `\n//CTYPE: ${contentType}`;
                if (
                  contentType &&
                  contentType.startsWith("application/octet-stream")
                ) {
                  logtxt = logtxt + `\n[DOWNLOAD]`;
                }
                await initialmsg.edit({
                  content: "```js\n" + logtxt + "\n```",
                });
              }
            } catch (err) {
              logtxt = logtxt + "\n\n[ERROR]: " + toText(err);
              await initialmsg.edit({
                content: "```js\n" + logtxt + "\n```",
              });
            }
          }
        }
        trackurl(url, 6); // DEPTH
      }
    }
    //
  }
}

function pass_exports(p_client, p_discordjs) {
  client = p_client;
  discordjs = p_discordjs;
}

module.exports = {
  handle_cmds,
  pass_exports,
};
