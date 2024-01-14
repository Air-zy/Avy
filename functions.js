let client;

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

async function handle_interactions(interaction) {
  try {
    const { commandName, options, user } = interaction;
    if (commandName == "draw") {
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
