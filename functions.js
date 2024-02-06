let client;

const fs = require('fs');
const imgnamewatermark = JSON.parse(fs.readFileSync('json_storage/configs.json'))[0].img_name_stamp;

const fstabledifxl = require("./modules/fstabledifxl_module.js");
const kwimodule = require("./modules/hf_kwi.js");

// Functions

function toText(value) {
  function circularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return undefined; // Ignore circular references
        }
        seen.add(value);
      }
      return value;
    };
  }

  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
    return value.toString();
  } else if (Array.isArray(value)) {
    return value.join(', ');
  } else if (typeof value === 'object' && value !== null) {
    if (Buffer.isBuffer(value)) {
      const bufferString = value.toString("utf8");
      return bufferString;
    } else {
      return JSON.stringify(value, circularReplacer(), 2);
    }
  } else {
    return String(value);
  }
}

async function command_say(interaction, options) {
  const text = toText(options.get('text').value).substring(0, 1024)
  let channelid = options.get('channel_id')
  if (channelid && channelid.value) {
    channelid = toText(channelid.value).substring(0, 1024).replace(/\D/g, '');
  } else {
    channelid = toText(interaction.channelId)
  }

  try {
    const user = await client.users.fetch(channelid);
    if (user && user.id) {
      const dmChannel = await user.createDM();
      let senttxt = false;
      try {
        await dmChannel.send(text);
        senttxt = true;
      } catch (err2) {
        await interaction.reply("```js\n" + toText(err2.message) + "```");
      }
      if (senttxt == true) {
        await interaction.reply(`sent to user ${user.username}#${user.discriminator}`);
      }
    }
  } catch (err) {
    const channel = await client.channels.fetch(channelid);
    if (channel) {
      channel.send(text);
      await interaction.reply(`sent to channel ${channel.name}`);
    } else {
      await interaction.reply(`no channel or user found`);
    } 
  }
}

const animationFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const kwi_trigger_regex = new RegExp(process.env['kwi_trigger'], 'i');
let currentFrame = 0;
async function command_draw(interaction, options) {
  const input = toText(options.get('prompt').value).substring(0, 512)
  const reply = await interaction.reply('drawing ' + input);
  const interval = setInterval(async () => {
    try {
      currentFrame = (currentFrame + 1) % animationFrames.length;
      await reply.edit('drawing ' + input + ' ' + animationFrames[currentFrame]);
    } catch (err) {
      clearInterval(interval);
      return;
    }
  }, 1000);
  
  try {
    let response
    if (kwi_trigger_regex.test(input) && /real/i.test(input) == false) {
      response = await kwimodule.generate(input);
    } else {
      response = await fstabledifxl.generate(input);
    }
    clearInterval(interval);
    if (response) {
      if (kwi_trigger_regex.test(input) && /real/i.test(input) == false) {
        response = await kwimodule.generate(input);
        console.log("[hfkwi] " + input)
      } else {
        response = await fstabledifxl.generate(input);
        console.log("[fstabledifxl] " + input + "\n" + response)
      }
      await reply.edit({
      content: "`" + input + "`",
        files: [{
          attachment: response,
          name: input.substring(0, 64) + imgnamewatermark + '.png'
        }]
      })
    } else {
      await reply.edit({
        content: "FAILED",
      })
    }
  } catch (error) {
    clearInterval(interval);
    throw error;
  }
}
  
async function handle_interactions(interaction) {
  try {
    const { commandName, options, user } = interaction;
    if (commandName == "draw") {
      await command_draw(interaction, options);
    } else if (commandName == "send") {
      await command_say(interaction, options);
    }
  } catch (error) {
    console.log('\n[DISCORD BOT ERROR] interaction error', error);
    try {
      if (error && error.stack && error.message){
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("```js\n" + `err: ${error.message}` + "```");
        } else {
          await interaction.reply("```js\n" + `err: ${error.message}` + "```");
        }
      } else {
        await interaction.reply("```js\n" + toText(error) + "```")
      }
    } catch (err2) {
      console.log('\n[DISCORD INTER ERROR] ', error)
    }
  }
}


function pass_exports(p_client, p_discordjs) {
  client = p_client;
  discordjs = p_discordjs;
}

module.exports = {
  handle_interactions,
  pass_exports,
  toText,
};
