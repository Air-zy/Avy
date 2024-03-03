// Call Variables

let client;
let discordjs;
let firedb;

const fetch = require("node-fetch");
const fs = require("fs");
const os = require("os");

const main_funcs = require("./functions.js");
const toText = main_funcs.toText;

// Values

const cmdprefix = JSON.parse(fs.readFileSync("json_storage/configs.json"))[0]
  .prefix;
const authorized_users = JSON.parse(fs.readFileSync("json_storage/configs.json"))[0]
  .authorized_users;
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

function isIPAddress(input) {
  // Regular expression to match IPv4 address
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

  // Regular expression to match IPv6 address
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^[0-9a-fA-F]{1,4}:([0-9a-fA-F]{1,4}:){1,6}|^:((:[0-9a-fA-F]{1,4}){1,6})|^(::){1,7}$/;

  return ipv4Regex.test(input) || ipv6Regex.test(input);
}

function parseHTML(htmlContent) {
  // Find the start and end points of the MaxMind section
  const startMarker = '<a href="#ip_info-geolite2">';
  const endMarker = 'Powered by <a target="_blank" rel="nofollow" href="https://www.maxmind.com">MaxMind GeoIP</a>';

  const startIndex = htmlContent.indexOf(startMarker);
  const endIndex = htmlContent.indexOf(endMarker);

  // Extract the MaxMind section using string splicing
  const htmlSnippet = htmlContent.substring(startIndex, endIndex);
  
  // Extracting IP Address
  const ipAddressRegex = /<strong>([\d.]+)<\/strong>/;
  const ipAddressMatch = htmlSnippet.match(ipAddressRegex);
  const ipAddress = ipAddressMatch ? ipAddressMatch[1] : null;

  // Extracting Host Name
  const hostNameRegex = /<td>Host name<\/td>\s*<td class="break-all">([^<]+)<\/td>/;
  const hostNameMatch = htmlSnippet.match(hostNameRegex);
  const hostName = hostNameMatch ? hostNameMatch[1] : null;

  // Extracting Country
  const countryRegex = /<td>Country<\/td>\s*<td class="break-words">\s*<img class="inline flag" src="\/images\/flags\/[a-z]+\.png" \/>\s*<strong>([^<]+)<\/strong>/;
  const countryMatch = htmlSnippet.match(countryRegex);
  const country = countryMatch ? countryMatch[1] : null;

  // Extracting Region
  const regionRegex = /<td>Region<\/td>\s*<td class="break-all">([^<]+)<\/td>/;
  const regionMatch = htmlSnippet.match(regionRegex);
  const region = regionMatch ? regionMatch[1] : null;

  // Extracting City
  const cityRegex = /<td>City<\/td>\s*<td class="break-all">([^<]+)<\/td>/;
  const cityMatch = htmlSnippet.match(cityRegex);
  const city = cityMatch ? cityMatch[1] : null;

  // Extracting Postal Code
  const postalCodeRegex = /<td>Postal Code<\/td>\s*<td class="break-all">([^<]+)<\/td>/;
  const postalCodeMatch = htmlSnippet.match(postalCodeRegex);
  const postalCode = postalCodeMatch ? postalCodeMatch[1] : null;

  return `
  IP Address: ${ipAddress}
  Host Name: ${hostName}
  Country: ${country}
  Region: ${region}
  City: ${city}
  Postal Code: ${postalCode}
  `;
}

function formatTimestamp(createdTimestamp) {
  // Convert timestamp to Date object
  const date = new Date(createdTimestamp);

  // Get individual components of the date
  const year = date.getFullYear();
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  const day = date.getDate();

  // Create the formatted date string
  const formattedDate = `${month} ${day}, ${year}`;

  return formattedDate;
}

async function firedbTokenGET() {
  try {
    const aTuringRef = await firedb.doc('3rhrsWF9YlhpfZ2y3L7q');
    const value = await aTuringRef.get();
    const data = await value.data();
    return data;
  } catch(err) {
    console.log("[FIRE BASE ERR]",err)
  }
}

async function getDiscordUser(str) {
  let newstr = str
  newstr = newstr.replace(/[<@!>]/g, '');
  console.log(newstr);

  if (!/^\d+$/.test(newstr)) {
    return false;
  }
  
  if (newstr.length < 17 || newstr.length > 20) {
    return false;
  }
  
  try {
    const user = await client.users.fetch(newstr);
    const jsonObject = {
      "creation_date": formatTimestamp(user.createdTimestamp),
    }
    const jsonString = JSON.stringify(jsonObject, null, 2);
    return jsonString + "\n" + toText(user);
  } catch {
    return false;
  }
}

async function handle_cmds(message) {
  const words = message.content.split(" ");
  const mchannel = message.channel;
  const authorid = toText(message.author.id) // tostring cuz json handle number weirdly
  
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
    (
    words[0] == cmdprefix + "viewc" ||
    words[0] == cmdprefix + "view_channel"
    ) &&
    authorized_users.includes(authorid)
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
  } else if (words[0] == cmdprefix + "vserver" && authorized_users.includes(authorid)) {
    const search_id = words[1].replace(/\D/g, "");
    const guilds = await client.guilds.fetch();
    let foundguild;

    guilds.forEach((guild) => {
      if (toText(guild.id) == toText(search_id)) {
        foundguild = guild;
      }
    });

    if (foundguild) {
      let guild_info = "";
      const fetchedguild = await client.guilds.fetch(search_id);
      if (fetchedguild) {
        guild_info = guild_info + "owner_id" + `: ${fetchedguild.ownerId}\n\n`;
        guild_info = guild_info + "[CHANNELS]: \n"
        let fguild_channels = await fetchedguild.channels.fetch();
        let channelsArray = Array.from(fguild_channels.values());
        channelsArray.sort((a, b) => {
          // If both channels have the same parentId, sort based on rawPosition
          if (a.parentId === b.parentId) {
            return a.rawPosition - b.rawPosition;
          }

          // If b has a parentId and it matches a's id, put b after a
          if (b.parentId === a.id) {
            return -1;
          }

            // If a has a parentId and it matches b's id, put a after b
          if (a.parentId === b.id) {
            return 1;
          }

          // Otherwise, sort based on rawPosition
          return a.rawPosition - b.rawPosition;
        });
        channelsArray.forEach((channel) => {
          if (channel.type == 4) {
            guild_info = guild_info + "\n\n" + `${channel.name}`;
          } else if (channel.type == 2) {
            guild_info = guild_info + "\n 𝄞 " + `${channel.name}` + `, ${channel.type}` + `   *${channel.id}*`;
          } else {
            guild_info = guild_info + "\n ◦ " + `${channel.name}` + `, ${channel.type}` + `   *${channel.id}*`;
          }
        });

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
      desctxt = desctxt + `${guild.name} ` + "`" + guild.id + "`\n";
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
  } else if (words[0] == cmdprefix + "replyc" && words[2]) {
    const channel = await client.channels.fetch(words[1].replace(/\D/g, ""));
    if (channel) {
      const messages = await channel.messages.fetch({ limit: 2 });
      const latestMessage = messages.last();
      const txt = words.slice(2).join(" ");
      channel.sendTyping();
      setTimeout(async () => {
          await latestMessage.reply(txt);
      }, 4 * 1000);
    } else {
      await message.reply(`no channel found`);
    }
  } else if (
    message.content == cmdprefix + "info" ||
    message.content == cmdprefix + "stats"
  ) {
    const newtokendata = await firedbTokenGET()
    const total_tokens = parseInt(newtokendata.total_tokens);
    const prompt_tokens = parseInt(newtokendata.prompt_tokens);
    const completion_tokens = parseInt(newtokendata.completion_tokens);
    
    const uptimeValue = formatUptime(client.uptime);
    //let infojson = JSON.parse(fs.readFileSync('json_storage/info.json', 'utf-8'));
    const newEmbed = new discordjs.EmbedBuilder().setColor("#DC143C").addFields(
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
    )
    .setDescription(`
{"total_tokens": ${total_tokens}}
{"prompt_tokens": ${prompt_tokens}}
{"completion_tokens": ${completion_tokens}}
    `);
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
                  (contentType.startsWith("application/octet-stream") || contentType.startsWith("application/zip"))
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

        const ipftech = await fetch("https://check-host.net/ip-info?host=" + toText(url), {
          "headers": {
            "accept": "*/*",
            "accept-language": "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://check-host.net/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          "body": null,
          "method": "GET"
        });
        const fetchres = await ipftech.text();
        logtxt = logtxt + "\n```||\n```" + toText(parseHTML(fetchres)) + "```||";
        await initialmsg.edit({
          content: "```js\n" + logtxt + "\n",
        });
      } else if (isIPAddress(words[1])) {
        const initialmsg = await mchannel.send({
          content: "```js\nIP ADRESS: " + words[1] + "\n```",
        });
        const ipftech = await fetch("https://check-host.net/ip-info?host=" + toText(words[1]), {
          "headers": {
            "accept": "*/*",
            "accept-language": "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://check-host.net/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          "body": null,
          "method": "GET"
        });
        const fetchres = await ipftech.text();
        initialmsg.edit({
          content: "||```\n" + toText(parseHTML(fetchres)) + "\n```||",
        });
      } else {
        const initialmsg = await mchannel.send({
          content: "```js\n" + words[1] + "\n```",
        });
        const found_user = await getDiscordUser(words[1])
        if (found_user) {
          initialmsg.edit({
            content: "```js\n" + toText(found_user) + "\n```",
          });
        }
      }
    }
    //
  }
}

function pass_exports(p_client, p_discordjs, p_firedb) {
  client = p_client;
  discordjs = p_discordjs;
  firedb = p_firedb;
}

module.exports = {
  handle_cmds,
  pass_exports,
};
